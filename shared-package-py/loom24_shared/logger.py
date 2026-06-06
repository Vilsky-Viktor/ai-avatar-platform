from __future__ import annotations

import logging
import sys
from contextvars import ContextVar
from typing import Any, MutableMapping, Optional

_context_var: ContextVar[dict[str, str]] = ContextVar('log_context', default={})


class _ContextAdapter(logging.LoggerAdapter):
    def process(self, msg: str, kwargs: MutableMapping[str, Any]) -> tuple[str, MutableMapping[str, Any]]:
        ctx = {k: v for k, v in _context_var.get().items() if v}
        if ctx:
            suffix = "  " + "  ".join(f"{k}={v}" for k, v in ctx.items())
            return f"{msg}{suffix}", kwargs
        return msg, kwargs


def _build_logger() -> _ContextAdapter:
    base = logging.getLogger("loom24")
    if not base.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        ))
        base.addHandler(handler)
        base.setLevel(logging.INFO)
        base.propagate = False
    return _ContextAdapter(base, {})


logger: _ContextAdapter = _build_logger()


def set_log_context(
    user_id: Optional[str] = None,
    avatar_id: Optional[str] = None,
    job_id: Optional[str] = None,
) -> None:
    ctx: dict[str, str] = {}
    if user_id:
        ctx["userId"] = user_id
    if avatar_id:
        ctx["avatarId"] = avatar_id
    if job_id:
        ctx["jobId"] = job_id
    _context_var.set(ctx)


def clear_log_context() -> None:
    _context_var.set({})
