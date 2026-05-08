import logging
import os
import threading
from typing import Optional

LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()
LOG_LEVEL_MAP = {
    'DEBUG': logging.DEBUG,
    'INFO': logging.INFO,
    'WARNING': logging.WARNING,
    'WARN': logging.WARNING,
    'ERROR': logging.ERROR,
    'CRITICAL': logging.CRITICAL,
    'FATAL': logging.CRITICAL,
}

_job_id_local = threading.local()


class _JobIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        job_id = getattr(_job_id_local, "job_id", None)
        record.job_id = f"[{job_id}] " if job_id else ""
        return True


def set_job_id(job_id: str) -> None:
    _job_id_local.job_id = job_id


def unset_job_id() -> None:
    _job_id_local.job_id = None


def configure_logging() -> None:
    level = LOG_LEVEL_MAP.get(LOG_LEVEL, logging.INFO)

    if LOG_LEVEL not in LOG_LEVEL_MAP:
        logging.warning(f"Invalid LOG_LEVEL '{LOG_LEVEL}' → using INFO")

    handler = logging.StreamHandler()
    handler.addFilter(_JobIdFilter())
    handler.setFormatter(logging.Formatter(
        fmt='%(asctime)s [%(levelname)s] %(job_id)s%(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    ))

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()
    root.addHandler(handler)


configure_logging()


def get_logger(name: Optional[str] = None) -> logging.Logger:
    return logging.getLogger(name)
