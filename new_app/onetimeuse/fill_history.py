""" This file was ran once on local machine to fill-in price history for the last 14 days in database,
    this had to be done using MTGJSON as Scryfall does not keep price history, only daily.
    seed.py will be used for daily updates """

import json
import datetime
import os
from app import app
from exts import db
from models import Card, PriceHistory
from sqlalchemy.dialects.postgresql import insert

# Load local files, downloaded from MTGJSON: https://mtgjson.com/downloads/all-files/
IDENTIFIERS = 'AllIdentifiers.json'
PRICES = 'AllPrices.json'

# Helper function to load json files
def load_json(filename):
    print("Loading json file: ", filename)
    if not os.path.exists(filename):
        raise FileNotFoundError("File not found: ", filename)
    with open(filename, 'r', encoding='utf-8') as f:
        return json.load(f)

# Maps scryfall id to uuid
def scryfall_to_uuid(identifiers_data):
    print("Scryfall to uuid...")
    mapping = {}

    for uuid, card_data in identifiers_data.get('data', {}).items():
        identifiers = card_data.get('identifiers', {})
        scryfall_id = identifiers.get('scryfallId')
        if scryfall_id:
            mapping[scryfall_id] = uuid

    print(f"Mapped {len(mapping)} cards.")
    return mapping

# Inserts prices into database
def upsert_prices(price_data):
    if not price_data:
        return

    stmt = insert(PriceHistory).values(price_data)

    update_dict = {
        'price': stmt.excluded.price,
        'price_foil': stmt.excluded.price_foil
    }

    update_stmt = stmt.on_conflict_do_update(
        index_elements=['card_id', 'date'],
        set_=update_dict
    )

    db.session.execute(update_stmt)
    db.session.commit()
    print(f"Upserted batch of {len(price_data)} prices")

# Driver, loads jsons then grabs prices for target dates, loads in batches
def run_backfill():
    identifiers_raw = load_json(IDENTIFIERS)
    scryfall_uuid = scryfall_to_uuid(identifiers_raw)

    del identifiers_raw

    prices_raw = load_json(PRICES)
    prices_data = prices_raw.get('data', {})

    today = datetime.date.today()
    target_dates = [today - datetime.timedelta(days=i) for i in range(14)]
    target_date_strs = [d.strftime('%Y-%m-%d') for d in target_dates]

    with app.app_context():
        db_cards = Card.query.with_entities(Card.scryfall_id, Card.card_id).all()
        print(f"Checking {len(db_cards)} database cards against MTGJSON data...")

        prices_to_add = []
        batch_size = 3000

        for scryfall_id, card_id in db_cards:
            mtgjson_id = scryfall_uuid.get(scryfall_id)
            if not mtgjson_id:
                continue

            card_pricing = prices_data.get(mtgjson_id, {}).get('paper', {}).get('tcgplayer', {}).get('retail', {})

            normal_prices = card_pricing.get('normal', {})
            foil_prices = card_pricing.get('foil', {})

            for target_date, date_str in zip(target_dates, target_date_strs):
                price_normal = normal_prices.get(date_str)
                price_foil = foil_prices.get(date_str)

                if price_normal is not None or price_foil is not None:
                    prices_to_add.append({
                        'card_id': card_id,
                        'date': target_date,
                        'price': price_normal,
                        'price_foil': price_foil
                    })

            if len(prices_to_add) >= batch_size:
                upsert_prices(prices_to_add)
                prices_to_add = []

        if prices_to_add:
            upsert_prices(prices_to_add)

        print("Price History fill-in complete!")

if __name__ == "__main__":
    run_backfill()
