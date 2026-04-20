import datetime

from flask_restx import Namespace, Resource
import requests

from ..models import Card, PriceHistory

api = Namespace("detail", description="Card detail operations")

SCRYFALL_API_BASE = "https://api.scryfall.com"
COLOR_NAMES = {
    "W": "White",
    "U": "Blue",
    "B": "Black",
    "R": "Red",
    "G": "Green",
}


def get_card_images(card_data):
    image_url = ""
    back_image_url = None

    if "image_uris" in card_data:
        image_url = card_data["image_uris"].get("normal", "")
    elif "card_faces" in card_data and card_data["card_faces"]:
        first_face = card_data["card_faces"][0]
        if "image_uris" in first_face:
            image_url = first_face["image_uris"].get("normal", "")

        if len(card_data["card_faces"]) > 1:
            second_face = card_data["card_faces"][1]
            if "image_uris" in second_face:
                back_image_url = second_face["image_uris"].get("normal")

    return image_url, back_image_url


def get_card_text(card_data):
    if card_data.get("oracle_text"):
        return card_data["oracle_text"]

    face_text = [face.get("oracle_text") for face in card_data.get("card_faces", []) if face.get("oracle_text")]
    return "\n\n".join(face_text)


def get_card_artist(card_data, db_card):
    if db_card.artist:
        return db_card.artist

    if card_data.get("artist"):
        return card_data["artist"]

    for face in card_data.get("card_faces", []):
        if face.get("artist"):
            return face["artist"]

    return "Unknown"


def get_card_colors(card_data, db_card):
    if db_card.colors:
        return [COLOR_NAMES.get(color_code, color_code) for color_code in db_card.colors.split(",") if color_code]

    colors = card_data.get("colors") or []
    if not colors:
        for face in card_data.get("card_faces", []):
            colors.extend(face.get("colors", []))

    unique_colors = []
    for color_code in colors:
        if color_code not in unique_colors:
            unique_colors.append(color_code)

    return [COLOR_NAMES.get(color_code, color_code) for color_code in unique_colors]


def get_current_price(card_data, db_card):
    latest_price = None
    previous_price = None

    price_rows = (
        PriceHistory.query.filter_by(card_id=db_card.card_id)
        .filter(PriceHistory.price.isnot(None))
        .order_by(PriceHistory.date.desc())
        .limit(2)
        .all()
    )
    if price_rows:
        latest_price = price_rows[0].price
    if len(price_rows) > 1:
        previous_price = price_rows[1].price

    scryfall_price = card_data.get("prices", {}).get("usd")
    if latest_price is None and scryfall_price is not None:
        latest_price = float(scryfall_price)

    if latest_price is None:
        return None, None

    if previous_price is None:
        previous_price = latest_price

    return latest_price, previous_price


def get_price_history(db_card, fallback_price):
    history_rows = (
        PriceHistory.query.filter_by(card_id=db_card.card_id)
        .filter(PriceHistory.price.isnot(None))
        .order_by(PriceHistory.date.asc())
        .all()
    )
    if history_rows:
        return [
            {
                "date": row.date.isoformat(),
                "price": row.price,
            }
            for row in history_rows
        ]

    if fallback_price is None:
        return []

    return [
        {
            "date": datetime.date.today().isoformat(),
            "price": fallback_price,
        }
    ]


def serialize_card_detail(card_data, db_card):
    image_url, back_image_url = get_card_images(card_data)
    current_price, previous_price = get_current_price(card_data, db_card)
    price_change = 0.0
    price_change_percent = 0.0

    if current_price is not None and previous_price is not None:
        price_change = current_price - previous_price

    if previous_price:
        price_change_percent = (price_change / previous_price) * 100

    printings = Card.query.filter_by(card_name=db_card.card_name).all()
    printings_data = [{"id": p.card_id, "setCode": p.set_code.upper()} for p in printings]

    return {
        "card": {
            "id": db_card.card_id,
            "scryfallId": card_data["id"],
            "name": card_data["name"],
            "rarity": (db_card.rarity or card_data.get("rarity", "")).title(),
            "setCode": (db_card.set_code or card_data.get("set", "")).upper(),
            "setName": card_data.get("set_name", ""),
            "collectorNumber": db_card.collector_num or card_data.get("collector_number", ""),
            "artist": get_card_artist(card_data, db_card),
            "colors": get_card_colors(card_data, db_card),
            "type": card_data.get("type_line", ""),
            "manaCost": card_data.get("mana_cost", ""),
            "imageUrl": db_card.image_url or image_url,
            "backImageUrl": db_card.image_url_back or back_image_url,
            "description": get_card_text(card_data),
            "currentPrice": current_price,
            "previousPrice": previous_price,
            "priceChange": price_change,
            "priceChangePercent": price_change_percent,
        },
        "priceHistory": get_price_history(db_card, current_price),
        "printings": printings_data
    }


@api.route("/<int:card_id>")
class CardDetail(Resource):
    def get(self, card_id):
        db_card = Card.query.get(card_id)

        if not db_card:
            return {"message": "Card not found"}, 404

        try:
            response = requests.get(f"{SCRYFALL_API_BASE}/cards/{db_card.scryfall_id}", timeout=15)
            response.raise_for_status()
        except requests.HTTPError as exc:
            if exc.response is not None and exc.response.status_code == 404:
                return {"message": "Card not found"}, 404
            return {"message": "Failed to fetch card details", "error": str(exc)}, 502
        except requests.RequestException as exc:
            return {"message": "Failed to fetch card details", "error": str(exc)}, 502

        return serialize_card_detail(response.json(), db_card), 200