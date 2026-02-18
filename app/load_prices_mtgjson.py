"""
Loader for MTGJSON AllPricesToday data.

This script downloads the AllPricesToday.json file from MTGJSON and
stores the prices into the `daily_prices` table.

We only care about:
- vendor: tcgplayer
- price_type: retail
- finishes: normal / foil / etched
- currency: USD

Each record inserted:
- price_date (date)
- uuid (card uuid, from MTGJSON)
- finish (normal/foil/etched)
- vendor (tcgplayer)
- price_type (retail)
- currency (USD)
- price (numeric)
"""

from __future__ import annotations

from datetime import date
from typing import Any, Dict, Iterable, List

import requests
from sqlalchemy import text

from app.config import settings
from app.db import get_session


def download_all_prices_today() -> Dict[str, Any]:
    """Download AllPricesToday.json from MTGJSON."""
    base = settings.mtgjson_api_base.rstrip("/")
    url = f"{base}/AllPricesToday.json"
    print(f"Downloading AllPricesToday from {url} ...")
    resp = requests.get(url, timeout=120)
    resp.raise_for_status()
    return resp.json()


def build_price_records(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Transform MTGJSON AllPricesToday payload into a flat list of price records.

    Expected structure (simplified):

        {
          "meta": {
            "date": "2024-11-27",
            ...
          },
          "data": {
            "<uuid>": {
              "paper": {
                "tcgplayer": {
                  "retail": {
                    "normal": { "2024-11-27": 1.23 },
                    "foil":   { "2024-11-27": 3.45 },
                    "etched": { ... }
                  }
                }
              }
            },
            ...
          }
        }

    We will:
    - Take price_date from meta.date if present, otherwise from the price map key,
      otherwise fall back to today's date.
    - Only create records where we have a numeric price.
    """
    records: List[Dict[str, Any]] = []

    meta = data.get("meta", {}) or {}
    default_date_str = meta.get("date")
    if not default_date_str:
        default_date_str = date.today().isoformat()

    data_section = data.get("data", {}) or {}

    for uuid, price_info in data_section.items():
        # Navigate into paper.tcgplayer.retail
        paper = (price_info or {}).get("paper") or {}
        tcg = paper.get("tcgplayer") or {}
        retail = tcg.get("retail") or {}

        # For each finish we care about
        for finish in ("normal", "foil", "etched"):
            finish_prices = retail.get(finish)
            if not isinstance(finish_prices, dict):
                continue

            # finish_prices is usually { "YYYY-MM-DD": price }
            for date_str, value in finish_prices.items():
                if value is None:
                    continue

                try:
                    price_val = float(value)
                except (TypeError, ValueError):
                    continue

                price_date_str = date_str or default_date_str
                if not price_date_str:
                    price_date_str = date.today().isoformat()

                records.append(
                    {
                        "price_date": price_date_str,
                        "uuid": uuid,
                        "finish": finish,
                        "vendor": "tcgplayer",
                        "price_type": "retail",
                        "currency": "USD",
                        "price": price_val,
                    }
                )

    return records


def upsert_daily_prices(records: Iterable[Dict[str, Any]], batch_size: int = 1000) -> None:
    """
    Bulk upsert price records into daily_prices.

    Uses a single parameter style (:name) for SQLAlchemy compatibility.
    """
    records = list(records)
    if not records:
        print("No price records to upsert.")
        return

    insert_sql = text(
        """
        INSERT INTO daily_prices (
            price_date,
            uuid,
            finish,
            vendor,
            price_type,
            currency,
            price
        )
        VALUES (
            CAST(:price_date AS date),
            CAST(:uuid AS uuid),
            :finish,
            :vendor,
            :price_type,
            :currency,
            :price
        )
        ON CONFLICT (price_date, uuid, finish, vendor, price_type)
        DO UPDATE SET
            currency = EXCLUDED.currency,
            price    = EXCLUDED.price;
        """
    )

    total = len(records)
    print(f"Upserting {total} price records in batches of {batch_size}...")

    with get_session() as session:
        for i in range(0, total, batch_size):
            batch = records[i : i + batch_size]
            session.execute(insert_sql, batch)
            session.commit()
            print(f"  Upserted {min(i + batch_size, total)} / {total} records")

    print("Finished upserting daily_prices.")


def main() -> None:
    """Entry point for CLI use."""
    data = download_all_prices_today()
    records = build_price_records(data)
    print(f"Built {len(records)} price records.")
    upsert_daily_prices(records)


if __name__ == "__main__":
    main()
