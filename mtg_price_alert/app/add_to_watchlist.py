"""
Command-line helper for adding or updating watchlist entries.

Usage example:

    python -m app.add_to_watchlist ^
      --user-id 1 ^
      --name "Ragavan, Nimble Pilferer" ^
      --set-code mh2 ^
      --finish normal ^
      --pct-drop 15 ^
      --max-price 40 ^
      --lookback-days 14 ^
      --notes "If Ragavan dips, buy a playset"

This script:

1. Looks up a card in the `cards` table by name + set code.
2. If found, inserts or updates a row in `watchlist` for the given user,
   keyed by (user_id, uuid, finish).
3. Prints a human-readable confirmation.
"""

from __future__ import annotations

import argparse
import sys
from typing import Optional, Dict, Any

from sqlalchemy import text

from app.db import get_session


def lookup_card(session, name: str, set_code: str) -> Optional[Dict[str, Any]]:
    """
    Look up a single card by name and set code.

    Returns a dict-like row with uuid, name, set_code, collector_number
    or None if not found.
    """
    sql = text(
        """
        SELECT uuid, name, set_code, collector_number
        FROM cards
        WHERE lower(name) = lower(:name)
          AND lower(set_code) = lower(:set_code)
        ORDER BY collector_number
        LIMIT 1;
        """
    )
    result = session.execute(sql, {"name": name, "set_code": set_code}).mappings().first()
    return result


def add_watch_entry(
    user_id: int,
    name: str,
    set_code: str,
    finish: str,
    pct_drop_threshold: float,
    max_price: float,
    lookback_days: int,
    notes: Optional[str] = None,
) -> None:
    """
    Add or update a watchlist entry for the given user and card.

    - Resolves the card UUID via the `cards` table.
    - UPSERTs into `watchlist` on (user_id, uuid, finish).
    """
    finish = finish.lower().strip()
    if finish not in {"normal", "foil", "etched"}:
        raise SystemExit(
            f"Invalid finish '{finish}'. Must be one of: normal, foil, etched."
        )

    with get_session() as session:
        card = lookup_card(session, name=name, set_code=set_code)
        if card is None:
            raise SystemExit(
                f"No card found matching name='{name}' and set_code='{set_code}'. "
                "Check spelling and that the AllIdentifiers data was loaded."
            )

        uuid = card["uuid"]

        insert_sql = text(
            """
            INSERT INTO watchlist (
                user_id,
                uuid,
                finish,
                pct_drop_threshold,
                max_price,
                lookback_days,
                notes,
                active
            )
            VALUES (
                :user_id,
                CAST(:uuid AS uuid),
                :finish,
                :pct_drop_threshold,
                :max_price,
                :lookback_days,
                :notes,
                TRUE
            )
            ON CONFLICT (user_id, uuid, finish)
            DO UPDATE SET
                pct_drop_threshold = EXCLUDED.pct_drop_threshold,
                max_price          = EXCLUDED.max_price,
                lookback_days      = EXCLUDED.lookback_days,
                notes              = EXCLUDED.notes,
                active             = TRUE;
            """
        )

        params = {
            "user_id": user_id,
            "uuid": uuid,
            "finish": finish,
            "pct_drop_threshold": pct_drop_threshold,
            "max_price": max_price,
            "lookback_days": lookback_days,
            "notes": notes,
        }

        session.execute(insert_sql, params)
        session.commit()

        card_label = f"{card['name']} [{card['set_code']}] #{card['collector_number']}"
        print(
            f"Watchlist updated for user {user_id}: {card_label} "
            f"(finish={finish}, drop>={pct_drop_threshold}%, max=${max_price}, "
            f"lookback={lookback_days} days)."
        )


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Add or update a Magic card price watchlist entry."
    )
    parser.add_argument(
        "--user-id",
        type=int,
        required=True,
        help="ID of the user (from the users table) who owns this watchlist entry.",
    )
    parser.add_argument(
        "--name",
        type=str,
        required=True,
        help="Exact card name (e.g., 'Ragavan, Nimble Pilferer').",
    )
    parser.add_argument(
        "--set-code",
        type=str,
        required=True,
        help="Set code (e.g., mh2, bro, etc.).",
    )
    parser.add_argument(
        "--finish",
        type=str,
        default="normal",
        help="Card finish: normal, foil, or etched. Default: normal.",
    )
    parser.add_argument(
        "--pct-drop",
        type=float,
        required=True,
        help="Minimum percent drop over the lookback window to trigger an alert.",
    )
    parser.add_argument(
        "--max-price",
        type=float,
        required=True,
        help="Maximum current price (USD) at which the card is considered affordable.",
    )
    parser.add_argument(
        "--lookback-days",
        type=int,
        default=14,
        help="Number of days to look back for computing the price drop. Default: 14.",
    )
    parser.add_argument(
        "--notes",
        type=str,
        default=None,
        help="Optional free-text notes about why you're tracking this card.",
    )
    return parser.parse_args(argv)


def main(argv: Optional[list[str]] = None) -> int:
    args = parse_args(argv)

    try:
        add_watch_entry(
            user_id=args.user_id,
            name=args.name,
            set_code=args.set_code,
            finish=args.finish,
            pct_drop_threshold=args.pct_drop,
            max_price=args.max_price,
            lookback_days=args.lookback_days,
            notes=args.notes,
        )
    except SystemExit as exc:
        # If add_watch_entry calls SystemExit with a message, re-raise it
        # so CLI exit code is non-zero and message is printed.
        raise
    except Exception as exc:  # pragma: no cover - generic safety net
        print(f"Error adding watchlist entry: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
