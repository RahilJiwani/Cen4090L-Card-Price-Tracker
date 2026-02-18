"""
Alert detection logic for MTG price drops.

This module encapsulates the core logic for detecting when a card on a
user's watchlist has dropped in price by a specified percentage within
a given lookback window and is currently below a maximum affordable
price. When such a condition is met, an alert is recorded in the
database and an email notification is sent to the user. Alerts are
deduplicated so that only one alert is sent per card per day.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Dict, List, Tuple, Optional

from sqlalchemy import text

from .db import get_session
from .emailer import send_email
from .scryfall_client import get_card_by_tcgplayer_id, ScryfallError


DEFAULT_LOOKBACK_DAYS = 14


def _get_active_watchlist(session):
    """Return all active watchlist entries along with user and card info."""
    sql = text(
        """
        SELECT
            w.user_id,
            u.email AS user_email,
            w.uuid,
            w.finish,
            w.pct_drop_threshold,
            w.max_price,
            w.lookback_days,
            c.name,
            c.set_code,
            c.collector_number,
            c.tcgplayer_product_id
        FROM watchlist w
        JOIN users u ON u.id = w.user_id AND u.active = TRUE
        JOIN cards c ON c.uuid = w.uuid
        WHERE w.active = TRUE;
        """
    )
    return session.execute(sql).fetchall()


def _get_latest_price(
    session,
    uuid,
    finish: str,
) -> Optional[Tuple[date, float]]:
    """Return the most recent price for a given card/finish, or None."""
    sql = text(
        """
        SELECT price_date, price
        FROM daily_prices
        WHERE uuid = CAST(:uuid AS uuid)
          AND finish = :finish
          AND vendor = 'tcgplayer'
          AND price_type = 'retail'
        ORDER BY price_date DESC
        LIMIT 1;
        """
    )
    row = session.execute(
        sql,
        {"uuid": str(uuid), "finish": finish},
    ).fetchone()

    if row is None:
        return None

    return row.price_date, float(row.price)


def _get_old_price(
    session,
    uuid,
    finish: str,
    lookback_days: int,
    latest_date: date,
) -> Optional[Tuple[date, float]]:
    """
    Return the price for a card/finish on or before the lookback date,
    or None if no such price exists.
    """
    target_date = latest_date - timedelta(days=lookback_days)

    sql = text(
        """
        SELECT price_date, price
        FROM daily_prices
        WHERE uuid = CAST(:uuid AS uuid)
          AND finish = :finish
          AND vendor = 'tcgplayer'
          AND price_type = 'retail'
          AND price_date <= :target_date
        ORDER BY price_date DESC
        LIMIT 1;
        """
    )
    row = session.execute(
        sql,
        {
            "uuid": str(uuid),
            "finish": finish,
            "target_date": target_date,
        },
    ).fetchone()

    if row is None:
        return None

    return row.price_date, float(row.price)


def _has_alert_for_date(
    session,
    user_id: int,
    uuid,
    finish: str,
    price_date: date,
) -> bool:
    """Check whether an alert already exists for a given card and date."""
    sql = text(
        """
        SELECT 1
        FROM alerts
        WHERE user_id = :user_id
          AND uuid = CAST(:uuid AS uuid)
          AND finish = :finish
          AND price_date = :price_date
        LIMIT 1;
        """
    )
    row = session.execute(
        sql,
        {
            "user_id": user_id,
            "uuid": str(uuid),
            "finish": finish,
            "price_date": price_date,
        },
    ).fetchone()

    return bool(row)


def _insert_alert(
    session,
    user_id: int,
    uuid,
    finish: str,
    price_date: date,
    latest_price: float,
    old_price: float,
    pct_drop: float,
    lookback_days: int,
) -> Optional[int]:
    """Insert an alert and return its ID (or None on conflict)."""
    sql = text(
        """
        INSERT INTO alerts (
            user_id,
            uuid,
            finish,
            price_date,
            latest_price,
            old_price,
            pct_drop,
            lookback_days
        )
        VALUES (
            :user_id,
            CAST(:uuid AS uuid),
            :finish,
            :price_date,
            :latest_price,
            :old_price,
            :pct_drop,
            :lookback_days
        )
        ON CONFLICT (user_id, uuid, finish, price_date)
        DO NOTHING
        RETURNING id;
        """
    )
    row = session.execute(
        sql,
        {
            "user_id": user_id,
            "uuid": str(uuid),
            "finish": finish,
            "price_date": price_date,
            "latest_price": latest_price,
            "old_price": old_price,
            "pct_drop": pct_drop,
            "lookback_days": lookback_days,
        },
    ).fetchone()

    return row.id if row else None


def _build_email_body(
    card_name: str,
    set_code: str,
    collector_number: str,
    finish: str,
    latest_price: float,
    old_price: float,
    pct_drop: float,
    lookback_days: int,
    scryfall_uri: Optional[str],
) -> str:
    """Return a formatted email body describing a price drop."""
    lines = [
        f"Card: {card_name} [{set_code}] #{collector_number} ({finish})",
        f"Lookback: {lookback_days} days",
        f"Old price:  ${old_price:.2f}",
        f"New price:  ${latest_price:.2f}",
        f"Drop:       {pct_drop:.2f}%",
    ]

    if scryfall_uri:
        lines.append("")
        lines.append(f"Scryfall: {scryfall_uri}")

    lines.append("")
    lines.append(
        "You received this alert because this card met your watchlist criteria."
    )

    return "\n".join(lines)


def run_alerts() -> None:
    """Detect price drops and dispatch alerts to users.

    This function should be called after the daily price data has been
    loaded. It queries the watchlist for active entries and determines
    whether the price drop conditions have been met. If so it inserts
    alert rows and sends notification emails.
    """
    alerts_by_user: Dict[int, List[Tuple[str, str, str]]] = {}

    with get_session() as session:
        watch_rows = _get_active_watchlist(session)
        if not watch_rows:
            print("No active watchlist entries. Exiting.")
            return

        for w in watch_rows:
            user_id = w.user_id
            user_email = w.user_email
            uuid = w.uuid
            finish = w.finish

            threshold = float(w.pct_drop_threshold)
            max_price = float(w.max_price)
            lookback_days = int(w.lookback_days or DEFAULT_LOOKBACK_DAYS)

            latest = _get_latest_price(session, uuid, finish)
            if latest is None:
                continue

            latest_date, latest_price = latest

            old = _get_old_price(session, uuid, finish, lookback_days, latest_date)
            if old is None:
                continue

            old_date, old_price = old

            if old_price <= 0:
                continue

            pct_drop = (old_price - latest_price) / old_price * 100.0

            # Check user-defined conditions
            if pct_drop < threshold:
                continue
            if latest_price > max_price:
                continue
            if _has_alert_for_date(session, user_id, uuid, finish, latest_date):
                continue

            alert_id = _insert_alert(
                session,
                user_id=user_id,
                uuid=uuid,
                finish=finish,
                price_date=latest_date,
                latest_price=latest_price,
                old_price=old_price,
                pct_drop=pct_drop,
                lookback_days=lookback_days,
            )
            if alert_id is None:
                # Conflict / duplicate, skip.
                continue

            # Try to fetch Scryfall URL via TCGPlayer product ID
            scryfall_uri: Optional[str] = None
            if w.tcgplayer_product_id:
                try:
                    card = get_card_by_tcgplayer_id(int(w.tcgplayer_product_id))
                    scryfall_uri = card.get("scryfall_uri")
                except ScryfallError as exc:
                    print(
                        f"Scryfall lookup failed for product {w.tcgplayer_product_id}: {exc}"
                    )
                except Exception as exc:
                    print(f"Unexpected error talking to Scryfall: {exc}")

            body = _build_email_body(
                card_name=w.name,
                set_code=w.set_code,
                collector_number=w.collector_number,
                finish=finish,
                latest_price=latest_price,
                old_price=old_price,
                pct_drop=pct_drop,
                lookback_days=lookback_days,
                scryfall_uri=scryfall_uri,
            )
            subject = (
                f"[MTG Alert] {w.name} dropped {pct_drop:.1f}% to ${latest_price:.2f}"
            )

            alerts_by_user.setdefault(user_id, []).append(
                (subject, body, user_email)
            )

        # Make sure inserts are committed before we send emails.
        session.commit()

    # Send grouped emails per user (outside DB session).
    for user_id, entries in alerts_by_user.items():
        subjects = [s for (s, _, _) in entries]
        bodies = [b for (_, b, _) in entries]
        emails = {e for (_, _, e) in entries}

        subject = f"[MTG Alerts] {len(entries)} price drop{'s' if len(entries) != 1 else ''}"
        body = "\n\n---\n\n".join(bodies)

        send_email(subject, body, list(emails))
        print(
            f"Sent {len(entries)} alert{'s' if len(entries) != 1 else ''} "
            f"to {', '.join(emails)}"
        )
