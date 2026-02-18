"""Scryfall API client for fetching card details by TCGplayer identifier.

The Scryfall REST API provides an endpoint for retrieving a card by its
TCGplayer product identifier. According to the Scryfall documentation,
the `/cards/tcgplayer/:id` endpoint returns a single card object with
fields including ``scryfall_uri``, which is a link to the card's page on
the Scryfall website【307560635646749†L5646-L5653】【307560635646749†L5740-L5744】.  This helper wraps that
endpoint and surfaces a minimal interface along with exception handling.
"""
from __future__ import annotations

import requests
from typing import Optional

from .config import settings


class ScryfallError(Exception):
    """Custom error for Scryfall API failures."""


def get_card_by_tcgplayer_id(product_id: int) -> dict:
    """Retrieve a card object from Scryfall using a TCGplayer product ID.

    The Scryfall endpoint ``/cards/tcgplayer/:id`` accepts a TCGplayer
    product identifier (sometimes referred to as ``tcgplayer_id``). It
    returns a JSON representation of a card that includes the
    ``scryfall_uri`` field for linking to Scryfall's website【307560635646749†L5646-L5653】【307560635646749†L5740-L5744】.

    Parameters
    ----------
    product_id: int
        The product identifier assigned by TCGplayer.

    Returns
    -------
    dict
        A dictionary parsed from the JSON response. On error this
        function will raise a ScryfallError.
    """
    url = f"{settings.SCRYFALL_API_BASE}/cards/tcgplayer/{product_id}"
    try:
        response = requests.get(url, timeout=15)
    except requests.RequestException as exc:
        raise ScryfallError(f"Network error contacting Scryfall: {exc}") from exc

    # Accept only successful (200 OK) responses. The API returns 404 for
    # unknown IDs and may include error details in the body.
    if response.status_code != 200:
        raise ScryfallError(
            f"Scryfall returned {response.status_code}: {response.text[:200]}"
        )

    try:
        return response.json()
    except Exception as exc:
        raise ScryfallError(f"Failed to decode JSON from Scryfall: {exc}") from exc