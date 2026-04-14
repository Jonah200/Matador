import subprocess
import signal
import sys
from typing import List
import psutil
from app.util.logging_config import setup_logging
setup_logging()
from loguru import logger

SERVICES = [
    [sys.executable, "-m", "app.services.cleanup.main"],
    [sys.executable, "-m", "app.services.ner.main"],
    # [sys.executable, "-m", "app.services.textrank.main"],
    [sys.executable, "-m", "app.services.isd.main"],
    [sys.executable, "-m", "app.services.emotion_detection.main"],
    [sys.executable, "-m", "app.services.claim_detection.main"],
    [sys.executable, "-m", "app.services.summarization.main"]
]

processes: List[subprocess.Popen] = []

def start_services():
    for cmd in SERVICES:
        logger.info(f"[STARTING] {' '.join(cmd)}")
        p = subprocess.Popen(cmd)
        processes.append(p)

def shutdown_services():
    logger.info("[SHUTDOWN] Stopping services...")
    for p in processes:
        try:
            parent = psutil.Process(p.pid)
            children = parent.children(recursive=True)
            for child in children:
                child.terminate()
        except psutil.NoSuchProcess:
            pass
        p.terminate()

    for p in processes:
        p.wait()

def signal_handler(sig, frame):
    shutdown_services()
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    start_services()

    logger.info(f"[RUNNING] All Services Started")

    for p in processes:
        p.wait()