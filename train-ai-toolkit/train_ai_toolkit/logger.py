import logging
import os
import threading

LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

_local = threading.local()


class _JobIdFilter(logging.Filter):
    def filter(self, record):
        record.job_id = getattr(_local, "job_id", "-")
        return True


def set_job_id(job_id: str):
    _local.job_id = job_id


def clear_job_id():
    _local.job_id = "-"


def _build_logger() -> logging.Logger:
    logger = logging.getLogger("train_ai_toolkit")
    if logger.handlers:
        return logger

    logger.setLevel(LOG_LEVEL)
    handler = logging.StreamHandler()
    handler.setLevel(LOG_LEVEL)
    handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s] [%(job_id)s] %(message)s")
    )
    handler.addFilter(_JobIdFilter())
    logger.addHandler(handler)
    logger.propagate = False
    return logger


logger = _build_logger()


def get_logger(_name: str = None) -> logging.Logger:
    return logger
