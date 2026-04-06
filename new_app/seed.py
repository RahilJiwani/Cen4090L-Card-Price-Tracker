# NOTE: A Github workflow will be created to schedule updates to database.
# Database rows will only be changed if a difference is detected to avoid wasting computing time with Neon.
# Will change to update PriceHistory (not yet made)

import requests
import datetime
from new_app.app import app
from new_app.exts import db
from new_app.models import Card, PriceHistory
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import or_

def fetch_scryfall_data():
    print("Fetching scryfall data...")
    bulk_data_info = requests.get('https://api.scryfall.com/bulk-data').json()
    default_cards_url = next(item['download_uri'] for item in bulk_data_info['data'] if item['type'] == 'default_cards')
    # Download JSON file
    print(f"Downloading Card data (JSON) from {default_cards_url} (Could take a bit)")
    response = requests.get(default_cards_url)
    return response.json()

# Updates only if there are changes to card data
def update_cards(json_data):
    stmt = insert(Card).values(json_data)
    # Defines what to update
    update_dict = {
        'card_name': stmt.excluded.card_name,
        'rarity': stmt.excluded.rarity,
        'set_code': stmt.excluded.set_code,
        'collector_num': stmt.excluded.collector_num,
        'image_url': stmt.excluded.image_url,
        'image_url_back': stmt.excluded.image_url_back,
        'artist': stmt.excluded.artist,
        'colors': stmt.excluded.colors
    }

    update_stmt = stmt.on_conflict_do_update(
        index_elements=['scryfall_id'],
        set_=update_dict,
        # where clause added to prevent unnecessary updates/inserts
        where=or_(
            Card.card_name != stmt.excluded.card_name,
            Card.rarity != stmt.excluded.rarity,
            Card.set_code != stmt.excluded.set_code,
            Card.collector_num != stmt.excluded.collector_num,
            Card.image_url.is_distinct_from(stmt.excluded.image_url),
            Card.image_url_back.is_distinct_from(stmt.excluded.image_url_back),
            Card.artist.is_distinct_from(stmt.excluded.artist),
            Card.colors.is_distinct_from(stmt.excluded.colors)
        )
    )

    db.session.execute(update_stmt)
    db.session.commit()

def update_prices(price_data):
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

def prune_old_prices():
    # Removes prices older than 30 days
    old = datetime.date.today() - datetime.timedelta(days=30)
    deleted = db.session.query(PriceHistory).filter(PriceHistory.date < old).delete()
    db.session.commit()
    print(f"{deleted} prices have been deleted.")

def seed_database():
    with app.app_context():
        print("Creating tables if they do not exist...")
        db.create_all()

        cards_data = fetch_scryfall_data()
        print(f"Loaded {len(cards_data)} cards from Scryfall. Processing...")

        batch_size = 2000
        cards_to_insert = []

        for card in cards_data:
            image_url = None
            image_url_back = None

            if 'image_uris' in card and 'normal' in card['image_uris']:
                image_url = card['image_uris']['normal']
            elif 'card_faces' in card:
                if 'image_uris' in card['card_faces'][0]:
                    image_url = card['card_faces'][0]['image_uris'].get('normal')
                if len(card['card_faces']) > 1 and 'image_uris' in card['card_faces'][1]:
                    image_url_back = card['card_faces'][1]['image_uris'].get('normal')

            # Convert array of colors ['W', 'B'] to string "W,B"
            raw_colors = card.get('colors', [])
            if not raw_colors and 'card_faces' in card:
                raw_colors = card['card_faces'][0].get('colors', [])
            colors_str = ','.join(raw_colors) if raw_colors else None

            artist = card.get('artist')
            if not artist and 'card_faces' in card:
                artist = card['card_faces'][0].get('artist')

            cards_to_insert.append({
                'scryfall_id': card.get('id'),
                'card_name': card.get('name'),
                'rarity': card.get('rarity'),
                'set_code': card.get('set'),
                'collector_num': card.get('collector_number'),
                'image_url': image_url,
                'image_url_back': image_url_back,
                'artist': artist,
                'colors': colors_str
            })

            # Updates cards in batches
            if len(cards_to_insert) >= batch_size:
                update_cards(cards_to_insert)
                cards_to_insert = [] # empty list

        # Catches any remaining cards after for-loop
        if cards_to_insert:
            update_cards(cards_to_insert)


        db_cards = Card.query.with_entities(Card.scryfall_id, Card.card_id).all()
        id_map = {scryfall_id: card_id for scryfall_id, card_id in db_cards}

        # Update prices
        prices_to_add = []
        today = datetime.date.today()

        for card in cards_data:
            scryfall_id = card.get('id')
            internal_card_id = id_map[scryfall_id]

            if not internal_card_id:
                continue

            prices = card.get('prices', {})

            prices_to_add.append({
                'card_id': internal_card_id,
                'date': today,
                'price': prices.get('usd'),
                'price_foil': prices.get('usd_foil')
            })

            if len(prices_to_add) >= batch_size:
                update_prices(prices_to_add)
                prices_to_add = []

        if prices_to_add:
            update_prices(prices_to_add)

        prune_old_prices()

        print("Database sync with Scryfall complete!")



if __name__ == "__main__":
    seed_database()
