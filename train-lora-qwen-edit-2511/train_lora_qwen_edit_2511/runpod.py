import os
import subprocess
import threading

from train_lora_qwen_edit_2511.logger import logger

RUNPOD_POD_ID = os.environ.get("RUNPOD_POD_ID")
INACTIVITY_TIMEOUT = int(os.environ.get("INACTIVITY_TIMEOUT", "300"))

_timer: threading.Timer | None = None
_lock = threading.Lock()


def _terminate():
    if RUNPOD_POD_ID:
        logger.info(f"Inactivity timeout reached — terminating pod {RUNPOD_POD_ID}")
        subprocess.run(["runpodctl", "remove", "pod", RUNPOD_POD_ID], check=False)


def reset_inactivity_timer():
    global _timer
    with _lock:
        if _timer is not None:
            _timer.cancel()
        _timer = threading.Timer(INACTIVITY_TIMEOUT, _terminate)
        _timer.daemon = True
        _timer.start()


def stop_inactivity_timer():
    global _timer
    with _lock:
        if _timer is not None:
            _timer.cancel()
            _timer = None
