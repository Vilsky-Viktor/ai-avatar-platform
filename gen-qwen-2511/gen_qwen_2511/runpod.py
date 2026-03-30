import threading
import subprocess
import os
import gen_qwen_2511.logger as log_module

RUNPOD_POD_ID = os.getenv("RUNPOD_POD_ID")
INACTIVITY_TIMEOUT = int(os.getenv("INACTIVITY_TIMEOUT", "300"))

inactivity_timer = None
logger = log_module.get_logger(__name__)

def terminate_pod():
    if not RUNPOD_POD_ID:
        logger.error("Inactivity timeout: RUNPOD_POD_ID is missing. Cannot terminate.")
        return

    logger.info(f"Inactivity timeout reached. Terminating pod {RUNPOD_POD_ID}...")
    try:
        subprocess.run(["runpodctl", "remove", "pod", RUNPOD_POD_ID], check=True)
    except subprocess.CalledProcessError as e:
        logger.error(f"runpodctl failed: {e}")

def reset_inactivity_timer():
    global inactivity_timer
    if inactivity_timer:
        inactivity_timer.cancel()

    inactivity_timer = threading.Timer(INACTIVITY_TIMEOUT, terminate_pod)
    inactivity_timer.start()
    logger.info("Inactivity timer reset.")
