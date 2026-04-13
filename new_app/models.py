from werkzeug.security import generate_password_hash, check_password_hash
from .exts import db
import datetime

class Card(db.Model):
    __tablename__ = 'cards'
    card_id = db.Column(db.Integer, primary_key=True)
    scryfall_id = db.Column(db.String(50), unique=True, nullable=False)
    card_name = db.Column(db.String(255), nullable=False)
    rarity = db.Column(db.String(50), nullable=False)
    set_code = db.Column(db.String(20), nullable=False)
    collector_num = db.Column(db.String(50), nullable=False)
    image_url = db.Column(db.Text, nullable=True)

    # ADDED: Did not know there were some two-sided cards, also added artist + colors
    image_url_back = db.Column(db.Text, nullable=True)
    artist = db.Column(db.String(50), nullable=True)
    colors = db.Column(db.String(50), nullable=True) # Stored as single letters: 'W' or 'W,B' for multi


    price_history = db.relationship('PriceHistory', backref='card', cascade='all, delete-orphan')

class PriceHistory(db.Model):
    __tablename__ = 'price_history'
    id = db.Column(db.Integer, primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.card_id'), nullable=False)
    date = db.Column(db.DateTime, default=datetime.datetime.today(), nullable=False)

    price = db.Column(db.Float, nullable=True)
    price_foil = db.Column(db.Float, nullable=True)

    __table_args__ = (
            db.UniqueConstraint('card_id', 'date', name='card_id_date'),
    )



class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.today)

# added for email verification
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    verification_token = db.Column(db.String(100), nullable=True)

    # Many-to-many relationship
    watchlist = db.relationship('Card', secondary='watchlists', backref='watched_by')

    # Helper funcs==============================================================================

    # Use to hash password
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    # Use to authenticate password
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def verify_email(self):
        # Placeholder for email verification logic
        pass

class Watchlist(db.Model):
    __tablename__ = 'watchlists'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.card_id'), primary_key=True)
