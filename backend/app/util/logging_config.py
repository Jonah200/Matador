from loguru import logger
import sys

def setup_logging():
    logger.remove()

    logger.add(
        sys.stdout,
        level="TRACE",
        enqueue=True,
        backtrace=True,
        diagnose=True
    )

    logger.add(
        "logs/app.log",
        rotation="10 MB",
        retention="7 days",
        compression="zip",
        level="TRACE",
        enqueue=True
    )