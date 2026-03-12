# NOTE: A Github workflow will be created to schedule updates to database.
# Database rows will only be changed if a difference is detected to avoid wasting computing time with Neon.
# Will change to update PriceHistory (not yet made)

import requests
from new_app.app import app
from new_app.exts import db
from new_app.models import Card
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
        'image_url': stmt.excluded.image_url
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
            Card.image_url.is_distinct_from(stmt.excluded.image_url)
        )
    )

    db.session.execute(update_stmt)
    db.session.commit()

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
            if 'image_uris' in card and 'normal' in card['image_uris']:
                image_url = card['image_uris']['normal']
            elif 'card_faces' in card and 'image_uris' in card['card_faces'][0]:
                image_url = card['card_faces'][0]['image_uris']['normal']

            cards_to_insert.append({
                'scryfall_id': card.get('id'),
                'card_name': card.get('name'),
                'rarity': card.get('rarity'),
                'set_code': card.get('set'),
                'collector_num': card.get('collector_number'),
                'image_url': image_url
            })

            # Updates cards in batches
            if len(cards_to_insert) >= batch_size:
                update_cards(cards_to_insert)
                cards_to_insert = [] # empty list

        # Catches any remaining cards after for-loop
        if cards_to_insert:
            update_cards(cards_to_insert)

        print("Database sync with Scryfall complete!")

if __name__ == "__main__":
    seed_database()
