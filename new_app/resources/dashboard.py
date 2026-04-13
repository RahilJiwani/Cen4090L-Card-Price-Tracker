from flask import request, session
from flask_restx import Namespace, Resource, fields
from ..exts import db
from ..models import User, Card, Watchlist, PriceHistory

api = Namespace('dashboard', description='Dashboard operations')

# Define request model for Swagger
add_card_model = api.model('AddCard', {
    'card_id': fields.Integer(required=True, description='Internal card ID to add to watchlist', example=1121),
})

@api.route('/watchlist')
class WatchlistCollection(Resource):
    def get(self):
        """Get all cards in the authenticated user's watchlist"""
        user_id = session.get('user_id')
        if not user_id:
            return {"error": "Unauthorized"}, 401

        user = User.query.get(user_id)
        if not user:
            return {"error": "User not found"}, 401

        cards = user.watchlist
        results = []
        for card in cards:
            latest_price_record = PriceHistory.query.filter_by(card_id=card.card_id).order_by(PriceHistory.date.desc()).first()
            
            results.append({
                "id": card.card_id,
                "scryfall_id": card.scryfall_id,
                "name": card.card_name,
                "set": card.set_code,
                "type": card.rarity,
                "manaCost": "",
                "price": f"${latest_price_record.price:,.2f}" if latest_price_record and latest_price_record.price else "N/A",
                "imageUrl": card.image_url
            })
            
        return {"watchlist": results}, 200

    @api.expect(add_card_model)
    def post(self):
        """Add a card to the authenticated user's watchlist"""
        user_id = session.get('user_id')
        if not user_id:
            return {"error": "Unauthorized"}, 401
            
        data = request.get_json()
        if not data or not data.get('card_id'):
            return {"error": "Invalid request payload"}, 400
            
        card_id = data.get('card_id')
        user = User.query.get(user_id)
        card = Card.query.get(card_id)
        
        if not card:
            return {"error": "Card not found"}, 404
            
        if card in user.watchlist:
            return {"message": "Card already in watchlist"}, 200
            
        try:
            user.watchlist.append(card)
            db.session.commit()
            return {"message": "Card added to watchlist"}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": "Internal server error"}, 500

@api.route('/watchlist/<int:card_id>')
class WatchlistItem(Resource):
    def delete(self, card_id):
        """Remove a card from the authenticated user's watchlist"""
        user_id = session.get('user_id')
        if not user_id:
            return {"error": "Unauthorized"}, 401

        user = User.query.get(user_id)
        card = Card.query.get(card_id)
        
        if not card:
            return {"error": "Card not found"}, 404
            
        if card not in user.watchlist:
            return {"message": "Card not in watchlist"}, 200
            
        try:
            user.watchlist.remove(card)
            db.session.commit()
            return {"message": "Card removed from watchlist"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": "Internal server error"}, 500
