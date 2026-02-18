"""Entry point for the scheduled daily job.

This script orchestrates the daily workflow:

1. Loads the current day's prices from MTGJSON by invoking
   ``load_prices_mtgjson.py``. This populates the ``daily_prices`` table.
2. Runs the alert detection algorithm defined in ``alerts.py``, which
   inserts new alerts and sends out email notifications.

The job can be scheduled via cron on Unix systems or the Windows Task
Scheduler. See README.md for example cron entries.
"""
from __future__ import annotations

import sys

from .load_prices_mtgjson import main as load_prices_main
from .alerts import run_alerts


def main() -> int:
    print("=== Running daily MTG price job ===")
    # 1) Load today's prices into daily_prices
    load_prices_main()
    # 2) Check alerts + send emails
    run_alerts()
    print("=== Daily job complete ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())