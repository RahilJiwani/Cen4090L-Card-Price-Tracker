# MTG Price Drop Alert System

This project implements a price drop alerting service for **Magic: The
Gathering** cards. It downloads card metadata and daily pricing data
from publicly available data sources, loads the information into a
PostgreSQL database, evaluates user‑defined watchlist rules, and
sends email notifications when a card's price falls by a configured
percentage and is below a specified budget. The project is designed to
be approachable for beginners in a database class while remaining
fully functional for real‑world use.

## Data Sources

The application leverages two public APIs:

1. **MTGJSON** – provides card identifiers, metadata and daily price
   snapshots. The project uses the following files:
   - **AllIdentifiers** (`/AllIdentifiers.json`): Contains every
     card printed in Magic organised by the card's `uuid` property
     along with its identifiers including Scryfall and TCGplayer IDs.
   - **AllPricesToday** (`/AllPricesToday.json`): Contains all prices
     for the current day, organised by a card's `uuid` property. It
     includes vendor‑specific price lists for finishes such as
     **normal**, **foil** and **etched**.
2. **Scryfall** – provides additional card details given a TCGplayer
   product identifier. In particular, the `/cards/tcgplayer/:id` endpoint
   returns a card object containing a `scryfall_uri` field, which the
   application includes in alert emails.

No TCGplayer API keys are required because pricing data is taken from
MTGJSON. Scryfall does not require authentication for public card
lookup.

## Directory Structure

```
mtg_price_alert/
  ├── app/                 # Application modules
  │   ├── __init__.py      # Package marker
  │   ├── add_to_watchlist.py  # Helper script for adding watch entries
  │   ├── alerts.py        # Alert detection and email dispatch
  │   ├── config.py        # Environment variable loader
  │   ├── db.py            # SQLAlchemy session factory
  │   ├── emailer.py       # SMTP helper
  │   ├── load_cards_identifiers.py  # Loads card metadata from MTGJSON
  │   ├── load_prices_mtgjson.py     # Loads daily prices from MTGJSON
  │   ├── main_daily_job.py   # Orchestrates daily workflow
  │   └── scryfall_client.py  # Fetches card info from Scryfall
  ├── sql/
  │   └── schema.sql       # PostgreSQL table definitions
  ├── .env.example         # Sample environment file
  ├── requirements.txt     # Python dependencies
  └── README.md            # This documentation
```

## Setup

Follow these steps to get the project running on your own machine:

1. **Install PostgreSQL** if you do not already have it. Version 12+
   is sufficient. Create a database and user for the application:

   ```bash
   psql -U postgres -c "CREATE DATABASE mtg_price_alert;"
   psql -U postgres -c "CREATE USER mtg_user WITH PASSWORD 'supersecret';"
   psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE mtg_price_alert TO mtg_user;"
   ```

2. **Apply the schema** contained in `sql/schema.sql`:

   ```bash
   psql -U mtg_user -d mtg_price_alert -f sql/schema.sql
   ```

3. **Create a user record** for yourself in the `users` table. This
   email will receive notifications. For example:

   ```sql
   INSERT INTO users (email) VALUES ('you@example.com');
   ```

4. **Install dependencies** into a Python virtual environment:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

5. **Configure environment variables** by copying `.env.example` to
   `.env` and editing the values to match your environment (database
   credentials, email settings, etc.).

6. **Initialise the card catalogue** by loading the AllIdentifiers
   data. This step populates the `cards` table with metadata and
   identifier mappings. Run:

   ```bash
   python -m app.load_cards_identifiers
   ```

7. **Add one or more watchlist entries**. Use the helper script to
   specify the card by name and set code along with your alert rules:

   ```bash
   python -m app.add_to_watchlist \
     --user-id 1 \
     --name "Ragavan, Nimble Pilferer" \
     --set-code mh2 \
     --finish normal \
     --pct-drop 15 \
     --max-price 40 \
     --lookback-days 14 \
     --notes "If Ragavan dips, buy a playset"
   ```

8. **Run the daily job**. Execute the following script each day after
   the MTGJSON data has been updated. It loads the latest prices,
   computes alerts and sends emails:

   ```bash
   python -m app.main_daily_job
   ```

   You can automate this with cron on Unix:

   ```cron
   30 9 * * * /path/to/venv/bin/python /path/to/mtg_price_alert/app/main_daily_job.py
   ```

## How It Works

1. **Card metadata** is pulled from MTGJSON's `AllIdentifiers.json` file.
   Each card is stored in the `cards` table along with its Scryfall
   and TCGplayer identifiers.
2. **Daily prices** are pulled from MTGJSON's `AllPricesToday.json` and
   inserted into the `daily_prices` table. Over time the table will
   accumulate a price history for each card/finish.
3. **Watchlist rules** specify a percentage drop threshold, a maximum
   price and a look‑back window. When the latest price is below the
   budget and has fallen by at least the threshold compared to the
   price lookback_days ago, an alert is generated.
4. **Alert generation** queries the database to compute percentage
   drops and inserts rows into the `alerts` table for matches. It
   uses the Scryfall API to fetch the card’s `scryfall_uri`, which
   provides a convenient link in the email.
5. **Email notifications** are sent via SMTP. Alerts are grouped per
   user so you receive one email per day summarising all new matches.

## Future Enhancements

This project is intentionally simple, but it can serve as a foundation
for more advanced functionality:

* Support additional vendors such as Cardmarket or TCGplayer buylist
  prices by expanding the `daily_prices` schema.
* Persist pricing data beyond 90 days by supplementing `AllPricesToday`
  with `AllPrices` and implementing retention policies.
* Build a small web interface for managing the watchlist rather than
  using the command line helper.
* Use a task scheduler like Celery or RQ for improved job management.

Enjoy tracking those bargains!