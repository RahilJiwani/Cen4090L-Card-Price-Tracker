import os
import datetime
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

# NOTE: Have .env file in same directory, should look like
# DATABASE_URL="database@link.com"
# do not upload database url to github, it is a secret (see settings)
load_dotenv()
conn_str = os.getenv('DATABASE_URL')

if not conn_str:
    raise ValueError("No DATABASE_URL found in environment variables. Check your .env file!")


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = conn_str
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Card(db.Model):
    __tablename__ = 'cards'
    card_id = db.Column(db.Integer, primary_key=True)
    scryfall_id = db.Column(db.String(50), unique=True, nullable=False)
    card_name = db.Column(db.String(255), nullable=False)
    rarity = db.Column(db.String(50), nullable=False)
    set_code = db.Column(db.String(20), nullable=False)
    collector_num = db.Column(db.String(50), nullable=False)
    image_url = db.Column(db.Text, nullable=True)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.today())

    # Many-to-many relationship
    watchlist = db.relationship('Card', secondary='watchlists', backref='watched_by')

    # Helper funcs==============================================================================

    # Use to hash password
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    # Use to authenticate password
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Watchlist(db.Model):
    __tablename__ = 'watchlists'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.card_id'), primary_key=True)


# Need PriceHistory (will be added)


