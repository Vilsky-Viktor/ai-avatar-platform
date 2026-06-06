from __future__ import annotations

import logging
import sys
import threading
from typing import Any, MutableMapping, Optional

_context: threading.local = threading.local()


class _ContextAdapter(logging.LoggerAdapter):
    """Appends thread-local context fields (userId, avatarId, jobId) to every message."""

    def process(self, msg: str, kwargs: MutableMapping[str, Any]) -> tuple[str, MutableMapping[str, Any]]:
        ctx = {k: v for k, v in getattr(_context, "data", {}).items() if v}
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
    """Set thread-local log context fields. Only non-None values are included."""
    ctx: dict[str, str] = {}
    if user_id:
        ctx["userId"] = user_id
    if avatar_id:
        ctx["avatarId"] = avatar_id
    if job_id:
        ctx["jobId"] = job_id
    _context.data = ctx


def clear_log_context() -> None:
    """Clear the thread-local log context."""
    _context.data = {}
