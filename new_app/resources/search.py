from flask_restx import Namespace, Resource, reqparse
import requests
from sqlalchemy import func

from ..models import Card, PriceHistory, get_set_name
from ..exts import db, cache

api = Namespace("search", description="Card searching operations")

search_parser = reqparse.RequestParser()
search_parser.add_argument('q', type=str, required=True, help='Search query (e.g., name of the card)')
search_parser.add_argument('type', type=str, required=False, help='Card type filter')

@api.route("/")
class CardSearch(Resource):
    @api.expect(search_parser)
    def get(self):
        args = search_parser.parse_args()
        query = args.get('q', '').strip()
        card_type = args.get('type')
        
        # Build scryfall query
        scryfall_q = query
        if card_type and card_type != "All":
            scryfall_q += f" t:{card_type}"

        try:
            # Cache Scryfall responses for 5 minutes to avoid paying network
            # latency (+ cold TCP/TLS) on repeated or concurrent searches.
            cache_key = f"scryfall:{scryfall_q}"
            search_cards = cache.get(cache_key)

            if search_cards is None:
                response = requests.get(
                    f"https://api.scryfall.com/cards/search?q={scryfall_q}"
                )
                if response.status_code == 404:
                    return {"cards": []}, 200
                response.raise_for_status()
                data = response.json()
                search_cards = data.get("data", [])[:20]
                cache.set(cache_key, search_cards)
            scryfall_ids = [c["id"] for c in search_cards]
            db_cards = Card.query.filter(Card.scryfall_id.in_(scryfall_ids)).all() if scryfall_ids else []
            db_card_map = {c.scryfall_id: c for c in db_cards}

            card_names = list(set([c.card_name for c in db_cards]))
            all_printings = Card.query.filter(Card.card_name.in_(card_names)).all() if card_names else []

            # Scope the price lookup to only cards in the current result set
            # so we don't scan the entire PriceHistory table.
            result_card_ids = [c.card_id for c in all_printings]
            subquery = db.session.query(
                PriceHistory.card_id,
                func.max(PriceHistory.date).label('max_date')
            ).filter(
                PriceHistory.card_id.in_(result_card_ids)
            ).group_by(PriceHistory.card_id).subquery()

            latest_prices = db.session.query(
                PriceHistory.card_id,
                PriceHistory.price
            ).join(
                subquery,
                (PriceHistory.card_id == subquery.c.card_id) &
                (PriceHistory.date == subquery.c.max_date)
            ).all()

            price_map = {p.card_id: p.price for p in latest_prices}
            
            printings_by_name = {}
            for p in all_printings:
                price_val = price_map.get(p.card_id)
                printings_by_name.setdefault(p.card_name, []).append({
                    "id": p.card_id,
                    "setCode": p.set_code.upper(),
                    "setName": get_set_name(p.set_code),
                    "imageUrl": p.image_url,
                    "price": f"${price_val:,.2f}" if price_val else "N/A"
                })
            
            results = []
            for card in search_cards: # Limit to 20 results
                try:
                    db_card = db_card_map.get(card["id"])
                    if not db_card:
                        continue

                    # Get image url, handle double-faced cards formatting
                    image_url = ""
                    if "image_uris" in card:
                        image_url = card["image_uris"].get("normal", "")
                    elif "card_faces" in card and "image_uris" in card["card_faces"][0]:
                        image_url = card["card_faces"][0]["image_uris"].get("normal", "")
                        
                    results.append({
                        "id": db_card.card_id,
                        "scryfallId": card["id"],
                        "name": card["name"],
                        "set": card.get("set_name", ""),
                        "type": card.get("type_line", ""),
                        "manaCost": card.get("mana_cost", ""),
                        "price": f"${card.get('prices', {}).get('usd') or '0.00'}",
                        "imageUrl": image_url,
                        "printings": printings_by_name.get(db_card.card_name, [])
                    })
                except Exception as e:
                    continue
                    
            return {"cards": results}, 200
            
        except requests.RequestException as e:
            return {"message": "Failed to search for cards", "error": str(e)}, 500
