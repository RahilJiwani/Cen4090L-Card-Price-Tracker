"""Loader for MTGJSON AllIdentifiers data.

This module downloads the AllIdentifiers JSON file from MTGJSON and
populates the ``cards`` table. The AllIdentifiers file contains every
card printed in Magic organised by the card's ``uuid`` property along
with its identifiers including ``scryfallId`` and ``tcgplayerProductId``【841503420405473†L188-L199】.

Run this script whenever you need to refresh your card metadata. It is
also a prerequisite before loading price data so that all referenced
UUIDs exist in the database.
"""
from __future__ import annotations

import json
from typing import Iterable, Iterator, Tuple
import sys

import requests
from sqlalchemy import text

from .config import settings
from .db import get_session

ALL_IDENTIFIERS_URL = f"{settings.MTGJSON_API_BASE}/AllIdentifiers.json"


def fetch_all_identifiers() -> dict:
    """Download and return the AllIdentifiers JSON payload.

    Returns
    -------
    dict
        The top-level dictionary containing card UUIDs as keys and
        identifier records as values.
    """
    print(f"Downloading AllIdentifiers from {ALL_IDENTIFIERS_URL} ...")
    response = requests.get(ALL_IDENTIFIERS_URL, timeout=120)
    response.raise_for_status()
    data = response.json()
    return data.get("data", {})


def iter_card_records(data: dict) -> Iterator[Tuple[str, str, str, str, str, str, int | None]]:
    """Yield card metadata tuples suitable for upserting into the cards table.

    Parameters
    ----------
    data: dict
        The dictionary returned from ``fetch_all_identifiers``.

    Yields
    ------
    tuple
        A tuple ``(uuid, name, set_code, number, rarity, scryfall_id, tcgplayer_product_id)``.
    """
    for uuid_str, card in data.items():
        name: str = card.get("name") or ""
        set_code: str = card.get("setCode") or ""
        number: str = card.get("number") or ""
        rarity: str | None = card.get("rarity")
        identifiers: dict = card.get("identifiers", {})

        scryfall_id: str | None = identifiers.get("scryfallId")
        tcg_id: str | int | None = identifiers.get("tcgplayerProductId")
        tcgplayer_product_id: int | None = int(tcg_id) if tcg_id is not None else None

        yield (
            uuid_str,
            name,
            set_code,
            number,
            rarity,
            scryfall_id,
            tcgplayer_product_id,
        )


def upsert_cards(records: Iterable[Tuple[str, str, str, str, str, str | None, int | None]]) -> None:
    """Upsert card metadata into the database.

    Parameters
    ----------
    records: iterable of tuples
        Each tuple contains the fields required by the ``cards`` table.
    """
    sql = text(
        """
        INSERT INTO cards (
            uuid, name, set_code, collector_number, rarity,
            scryfall_id, tcgplayer_product_id
        )
        VALUES (
            :uuid, :name, :set_code, :number, :rarity,
            :scryfall_id, :tcgplayer_product_id
        )
        ON CONFLICT (uuid) DO UPDATE
        SET
            name = EXCLUDED.name,
            set_code = EXCLUDED.set_code,
            collector_number = EXCLUDED.collector_number,
            rarity = EXCLUDED.rarity,
            scryfall_id = EXCLUDED.scryfall_id,
            tcgplayer_product_id = EXCLUDED.tcgplayer_product_id;
        """
    )

    with get_session() as session:
        batch: list[dict] = []
        for rec in records:
            uuid, name, set_code, number, rarity, scryfall_id, tcg_player_id = rec
            batch.append({
                "uuid": uuid,
                "name": name,
                "set_code": set_code,
                "number": number,
                "rarity": rarity,
                "scryfall_id": scryfall_id,
                "tcgplayer_product_id": tcg_player_id,
            })
            if len(batch) >= 1000:
                session.execute(sql, batch)
                batch.clear()
        if batch:
            session.execute(sql, batch)
        session.commit()


def main() -> int:
    """Entry point for loading identifiers.

    Downloads the AllIdentifiers file, parses it, and upserts the data
    into the ``cards`` table.
    """
    data = fetch_all_identifiers()
    upsert_cards(iter_card_records(data))
    print("Finished upserting cards from AllIdentifiers.")
    return 0


if __name__ == "__main__":
    sys.exit(main())