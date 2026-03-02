import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()
conn_str = os.getenv('DATABASE_URL')

basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = conn_str
app.config['SQLALCHEMY_TRACK_MODIFICATION'] = False

db = SQLAlchemy(app)

class Card(db.Model):
    card_id = db.Column(db.Integer, primary_key=True)
    scryfall_id = db.Column(db.String(50), unique=True, nullable=False)
    card_name = db.Column(db.String(255), nullable=False)
    rarity = db.Column(db.String(50), nullable=False)
    set_code = db.Column(db.String(20), nullable=False)
    collector_num = db.Column(db.String(50), nullable=False)
    image_url = db.Column(db.Text, nullable=True)

# Need PriceHistory, User, and Favorites Tables (will be added)
