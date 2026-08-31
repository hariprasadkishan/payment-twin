"""
Centralized logging configuration for Payment Twin backend.
"""

import logging
import sys
from typing import Optional


def setup_logging(log_level: Optional[str] = "INFO") -> logging.Logger:
    """
    Sets up application-wide logging with a standardized formatting structure.
    """
    level = getattr(logging, (log_level or "INFO").upper(), logging.INFO)

    log_format = "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    # Configure root logger
    logging.basicConfig(
        level=level,
        format=log_format,
        datefmt=date_format,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Set logger levels for noisy third-party libraries if needed
    logging.getLogger("uvicorn.access").setLevel(level)

    logger = logging.getLogger("payment_twin")
    logger.setLevel(level)
    return logger


logger = logging.getLogger("payment_twin")
