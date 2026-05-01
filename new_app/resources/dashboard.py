from datetime import datetime, timedelta

from flask import request, session
from flask_restx import Namespace, Resource, fields
from flask_mail import Message
from ..exts import db, mail
from ..models import User, Card, Watchlist, PriceHistory, get_set_name

api = Namespace('dashboard', description='Dashboard operations')

add_card_model = api.model('AddCard', {
    'card_id':          fields.Integer(required=True,  description='Internal card ID'),
    'target_price':     fields.Float(  required=False, description='Absolute price alert ($)'),
    'percentage_drop':  fields.Float(  required=False, description='% drop alert (e.g. 5.0)'),
    'lookback_days':    fields.Integer(required=False, description='Days to look back for max price baseline'),
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

        watchlists = Watchlist.query.filter_by(user_id=user_id).all()
        results = []
        for wl in watchlists:
            card = Card.query.get(wl.card_id)
            if not card:
                continue
            latest_price_record = PriceHistory.query.filter_by(card_id=card.card_id).order_by(PriceHistory.date.desc()).first()
            results.append({
                "id": card.card_id,
                "scryfall_id": card.scryfall_id,
                "name": card.card_name,
                "set": get_set_name(card.set_code),
                "type": card.rarity,
                "manaCost": "",
                "price": f"${latest_price_record.price:,.2f}" if latest_price_record and latest_price_record.price else "N/A",
                "imageUrl": card.image_url,
                "config": {
                    "target_price": wl.target_price,
                    "percentage_drop": wl.percentage_drop,
                    "lookback_days": wl.lookback_days
                }
            })

        return {"watchlist": results}, 200

    @api.expect(add_card_model)
    def post(self):
        """Add a card to the authenticated user's watchlist with optional alert config"""
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

        # Check if already in watchlist
        existing = Watchlist.query.filter_by(user_id=user_id, card_id=card_id).first()
        if existing:
            try:
                existing.target_price = data.get('target_price')
                existing.percentage_drop = data.get('percentage_drop')
                existing.lookback_days = data.get('lookback_days')
                db.session.commit()
                return {"message": "Card updated in watchlist"}, 200
            except Exception as e:
                db.session.rollback()
                return {"error": "Internal server error"}, 500

        try:
            entry = Watchlist(
                user_id=user_id,
                card_id=card_id,
                target_price=data.get('target_price'),
                percentage_drop=data.get('percentage_drop'),
                lookback_days=data.get('lookback_days'),
            )
            db.session.add(entry)
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


@api.route('/trigger-check')
class TriggerCheck(Resource):
    def post(self):
        """Evaluate all watchlist alert rules and send emails where thresholds are met"""
        user_id = session.get('user_id')
        if not user_id:
            return {"error": "Unauthorized"}, 401

        entries = Watchlist.query.filter_by(user_id=user_id).all()
        alerts_sent = []

        for entry in entries:
            card = Card.query.get(entry.card_id)
            if not card:
                continue

            # Get the latest price
            latest_record = (
                PriceHistory.query
                .filter_by(card_id=entry.card_id)
                .filter(PriceHistory.price.isnot(None))
                .order_by(PriceHistory.date.desc())
                .first()
            )
            if not latest_record or latest_record.price is None:
                continue

            current_price = latest_record.price
            triggered = False
            reason = ""

            # Check absolute target price
            if entry.target_price is not None and current_price <= entry.target_price:
                triggered = True
                reason = f"Price ${current_price:.2f} is at or below your target of ${entry.target_price:.2f}"

            # Check percentage drop against lookback window max
            if not triggered and entry.percentage_drop is not None:
                lookback = entry.lookback_days or 30
                since = datetime.utcnow() - timedelta(days=lookback)
                max_record = (
                    PriceHistory.query
                    .filter_by(card_id=entry.card_id)
                    .filter(PriceHistory.price.isnot(None), PriceHistory.date >= since)
                    .order_by(PriceHistory.price.desc())
                    .first()
                )
                if max_record and max_record.price:
                    drop_pct = ((max_record.price - current_price) / max_record.price) * 100
                    if drop_pct >= entry.percentage_drop:
                        triggered = True
                        reason = (
                            f"Price dropped {drop_pct:.1f}% from ${max_record.price:.2f} "
                            f"to ${current_price:.2f} (threshold: {entry.percentage_drop:.1f}%)"
                        )

            if triggered:
                user = User.query.get(user_id)
                try:
                    msg = Message(
                        subject=f"[MTG Tracker] Alert: {card.card_name}",
                        recipients=[user.email],
                        body=(
                            f"Hello {user.username},\n\n"
                            f"Your watchlist alert fired for {card.card_name} ({card.set_code.upper()}):\n"
                            f"{reason}\n\n"
                            f"View the card: http://localhost:5173/card/{card.card_id}\n\n"
                            f"— MTG Price Tracker"
                        )
                    )
                    mail.send(msg)
                    alerts_sent.append({"card": card.card_name, "reason": reason})
                except Exception as e:
                    alerts_sent.append({"card": card.card_name, "error": str(e)})

        return {"alerts_sent": alerts_sent, "count": len(alerts_sent)}, 200


