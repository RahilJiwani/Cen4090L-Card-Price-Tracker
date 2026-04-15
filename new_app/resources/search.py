from flask_restx import Namespace, Resource, reqparse
import requests

from ..models import Card

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
            response = requests.get(f"https://api.scryfall.com/cards/search?q={scryfall_q}")
            
            if response.status_code == 404:
                return {"cards": []}, 200
                
            response.raise_for_status()
            data = response.json()

            search_cards = data.get("data", [])[:20]
            scryfall_ids = [c["id"] for c in search_cards]
            db_cards = Card.query.filter(Card.scryfall_id.in_(scryfall_ids)).all() if scryfall_ids else []
            db_card_map = {c.scryfall_id: c for c in db_cards}
            
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
                        "imageUrl": image_url
                    })
                except Exception as e:
                    continue
                    
            return {"cards": results}, 200
            
        except requests.RequestException as e:
            return {"message": "Failed to search for cards", "error": str(e)}, 500
