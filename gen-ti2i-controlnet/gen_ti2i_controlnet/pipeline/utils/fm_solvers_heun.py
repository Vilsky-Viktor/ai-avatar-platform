# Heun (2nd-order Runge-Kutta) scheduler for flow matching.
# Based on FlowMatchEulerDiscreteScheduler from diffusers.
# Copyright 2024-2025 The Alibaba Wan Team Authors. All rights reserved.

import math
from typing import List, Optional, Tuple, Union

import numpy as np
import torch
from diffusers.configuration_utils import ConfigMixin, register_to_config
from diffusers.schedulers.scheduling_utils import SchedulerMixin, SchedulerOutput


class FlowMatchHeunDiscreteScheduler(SchedulerMixin, ConfigMixin):
    """
    Heun (2nd-order Runge-Kutta) scheduler for flow-matching models.

    Each denoising step consists of:
      1. Euler predictor  — one model evaluation at sigma_t
      2. Heun corrector   — one model evaluation at sigma_{t+1} on the predicted x̃
      x_{t+1} = x_t + (sigma_{t+1} - sigma_t) / 2 * (d_t + d̃_{t+1})

    Because every step requires 2 model evaluations, ``set_timesteps(N)`` produces
    2*N timestep entries and ``scheduler.order`` returns 2, so the pipeline loop
    and progress-bar update correctly.
    """

    _compatibles = []
    order = 2

    @register_to_config
    def __init__(
        self,
        num_train_timesteps: int = 1000,
        shift: float = 1.0,
        use_dynamic_shifting: bool = False,
        base_shift: float = 0.5,
        max_shift: float = 1.15,
        base_image_seq_len: int = 256,
        max_image_seq_len: int = 4096,
    ):
        # Build default full sigmas (not used after set_timesteps; kept for API compat)
        timesteps = np.arange(1, num_train_timesteps + 1)[::-1].copy().astype(np.float32)
        sigmas = timesteps / num_train_timesteps

        if not use_dynamic_shifting:
            sigmas = shift * sigmas / (1 + (shift - 1) * sigmas)

        self.sigmas = torch.from_numpy(sigmas)
        self.timesteps = self.sigmas * num_train_timesteps

        self.num_inference_steps = None
        self._step_index = None
        self._begin_index = None
        self._interleaved_sigmas = None

        # Heun state — reset on each set_timesteps / set_begin_index
        self._is_predictor_step = True
        self._prev_derivative: Optional[torch.Tensor] = None
        self._prev_sample: Optional[torch.Tensor] = None
        self._sigma_from: Optional[float] = None
        self._sigma_to: Optional[float] = None

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def step_index(self) -> Optional[int]:
        return self._step_index

    @property
    def begin_index(self) -> Optional[int]:
        return self._begin_index

    # ------------------------------------------------------------------
    # Dynamic shifting (same formula as UniPC / EulerDiscrete)
    # ------------------------------------------------------------------

    def time_shift(self, mu: float, sigma: float, t: np.ndarray) -> np.ndarray:
        return math.exp(mu) / (math.exp(mu) + (1 / t - 1) ** sigma)

    # ------------------------------------------------------------------
    # Pipeline interface
    # ------------------------------------------------------------------

    def set_begin_index(self, begin_index: int = 0) -> None:
        """Called by the pipeline before the denoising loop."""
        self._begin_index = begin_index
        # Reset Heun state so back-to-back calls are clean
        self._is_predictor_step = True
        self._prev_derivative = None
        self._prev_sample = None
        self._sigma_from = None
        self._sigma_to = None

    def set_timesteps(
        self,
        num_inference_steps: Optional[int] = None,
        device: Union[str, torch.device, None] = None,
        sigmas: Optional[List[float]] = None,
        mu: Optional[float] = None,
        shift: Optional[float] = None,
    ) -> None:
        """
        Build the interleaved timestep schedule.

        Parameters
        ----------
        num_inference_steps : int
            Number of *actual* denoising steps N.  The resulting
            ``self.timesteps`` will have 2*N entries.
        sigmas : list[float], optional
            Pre-computed sigma schedule (length N).  When omitted,
            ``np.linspace(1.0, 1/num_inference_steps, num_inference_steps)``
            is used, matching the pipeline default.
        mu : float, optional
            Log-image-seq-len for dynamic shifting; required when
            ``use_dynamic_shifting=True``.
        """
        if sigmas is None:
            if num_inference_steps is None:
                raise ValueError("Either num_inference_steps or sigmas must be provided.")
            sigmas = np.linspace(1.0, 1.0 / num_inference_steps, num_inference_steps)

        sigmas = np.array(sigmas, dtype=np.float64)

        if self.config.use_dynamic_shifting:
            if mu is None:
                raise ValueError(
                    "mu must be provided when use_dynamic_shifting=True"
                )
            sigmas = self.time_shift(mu, 1.0, sigmas)
        else:
            _shift = shift if shift is not None else self.config.shift
            sigmas = _shift * sigmas / (1 + (_shift - 1) * sigmas)

        # Append terminal sigma=0 → N+1 values: [s_0, s_1, ..., s_{N-1}, 0]
        sigmas_full = np.concatenate([sigmas, [0.0]])

        # Interleave to produce 2N timestep entries:
        #   [s_0, s_1, s_1, s_2, s_2, ..., s_{N-1}, s_{N-1}, 0]
        #   Count: 1 + 2*(N-1) + 1 = 2N
        interleaved: List[float] = [sigmas_full[0]]
        for s in sigmas_full[1:-1]:
            interleaved.extend([s, s])
        interleaved.append(sigmas_full[-1])
        interleaved_arr = np.array(interleaved, dtype=np.float32)

        self._interleaved_sigmas = torch.from_numpy(interleaved_arr).to(device or "cpu")
        self.timesteps = (self._interleaved_sigmas * self.config.num_train_timesteps).to(device or "cpu")
        self.sigmas = torch.from_numpy(sigmas_full.astype(np.float32)).to("cpu")

        self.num_inference_steps = len(sigmas)  # N (reported as the logical step count)

        self._step_index = None
        self._begin_index = None
        self._is_predictor_step = True
        self._prev_derivative = None
        self._prev_sample = None
        self._sigma_from = None
        self._sigma_to = None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _init_step_index(self, timestep: Union[float, torch.Tensor]) -> None:
        if self._begin_index is None:
            # Fallback: find the first matching timestep in the sequence
            if isinstance(timestep, torch.Tensor):
                t_val = timestep.item()
            else:
                t_val = float(timestep)
            matches = (self.timesteps - t_val).abs() < 1e-3
            indices = matches.nonzero(as_tuple=True)[0]
            self._step_index = int(indices[0].item()) if len(indices) > 0 else 0
        else:
            self._step_index = self._begin_index

    # ------------------------------------------------------------------
    # Step
    # ------------------------------------------------------------------

    def step(
        self,
        model_output: torch.Tensor,
        timestep: Union[float, torch.Tensor],
        sample: torch.Tensor,
        return_dict: bool = True,
    ) -> Union[SchedulerOutput, Tuple]:
        """
        One sub-step in the Heun loop (either predictor or corrector).

        The pipeline calls this once per timestep entry.  Predictor and
        corrector alternate automatically via internal state.
        """
        if self._step_index is None:
            self._init_step_index(timestep)

        idx = self._step_index
        sigma = self._interleaved_sigmas[idx].item()
        next_idx = idx + 1
        sigma_next = (
            self._interleaved_sigmas[next_idx].item()
            if next_idx < len(self._interleaved_sigmas)
            else 0.0
        )

        # In flow matching the model predicts the velocity field (dx/dsigma)
        derivative = model_output
        dt = sigma_next - sigma  # negative (sigma decreases towards 0)

        if self._is_predictor_step:
            # --- Euler predictor ---
            self._prev_derivative = derivative
            self._prev_sample = sample.clone()
            self._sigma_from = sigma
            self._sigma_to = sigma_next

            prev_sample = sample + dt * derivative
            self._is_predictor_step = False
        else:
            # --- Heun corrector ---
            # x_{i+1} = x_i + Δσ/2 * (d_i + d̃_{i+1})
            dt_full = self._sigma_to - self._sigma_from  # type: ignore[operator]
            prev_sample = (
                self._prev_sample  # type: ignore[operator]
                + dt_full / 2.0 * (self._prev_derivative + derivative)
            )
            self._is_predictor_step = True

        self._step_index += 1  # type: ignore[operator]

        if not return_dict:
            return (prev_sample,)
        return SchedulerOutput(prev_sample=prev_sample)

    def __len__(self) -> int:
        return self.config.num_train_timesteps
