from flask_restx import Namespace, Resource, reqparse
import requests

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
            
            results = []
            for card in data.get("data", [])[:20]: # Limit to 20 results
                try:
                    # Get image url, handle double-faced cards formatting
                    image_url = ""
                    if "image_uris" in card:
                        image_url = card["image_uris"].get("normal", "")
                    elif "card_faces" in card and "image_uris" in card["card_faces"][0]:
                        image_url = card["card_faces"][0]["image_uris"].get("normal", "")
                        
                    results.append({
                        "id": card["id"],
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
