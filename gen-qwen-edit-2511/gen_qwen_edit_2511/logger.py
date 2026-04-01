import logging
import os
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


def configure_logging() -> None:
    level = LOG_LEVEL_MAP.get(LOG_LEVEL, logging.INFO)

    if LOG_LEVEL not in LOG_LEVEL_MAP:
        logging.warning(f"Invalid LOG_LEVEL '{LOG_LEVEL}' → using INFO")

    logging.basicConfig(
        level=logging.ERROR,  # silence all third-party loggers by default
        format='%(asctime)s [%(levelname)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Only our namespace logs at the configured level
    logging.getLogger("gen_qwen_edit_2511").setLevel(level)


configure_logging()


def get_logger(name: Optional[str] = None) -> logging.Logger:
    return logging.getLogger(name)
