import { qwenEdit2511 } from "../types/image";

export const buildWan22A14bToolkitConfig = (numImages: number) => ({
  job: 'extension',
  config: {
    process: [{
      type: 'sd_trainer',
      device: 'cuda:0',
      network: { type: 'lora', linear: 32, linear_alpha: 32 },
      save: { dtype: 'float16', save_every: 1000, max_step_saves_to_keep: 4 },
      datasets: [{
        caption_ext: 'txt',
        resolution: [qwenEdit2511['1:1TV'][0]],
        caption_dropout_rate: 0.05,
        cache_latents_to_disk: true,
        num_frames: 1,
      }],
      train: {
        batch_size: 1,
        steps: numImages * 100,
        gradient_accumulation: 1,
        train_unet: true,
        train_text_encoder: false,
        gradient_checkpointing: true,
        noise_scheduler: 'flowmatch',
        optimizer: 'adamw8bit',
        lr: 1e-4,
        optimizer_params: { weight_decay: 1e-4 },
        lr_scheduler: 'constant',
        dtype: 'bf16',
        cache_text_embeddings: true,
        timestep_type: 'linear',
        switch_boundary_every: 10,
      },
      model: {
        arch: 'wan22_14b',
        model_kwargs: {
          train_high_noise: true,
          train_low_noise: true,
        },
      },
    }],
  },
});
