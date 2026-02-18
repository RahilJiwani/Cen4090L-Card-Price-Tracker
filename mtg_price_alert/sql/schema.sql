-- Schema definitions for the MTG price alert system.
--
-- This file should be executed against a PostgreSQL database to create the
-- necessary tables and indexes. See README.md for setup instructions.

-- Users table. Each user may have one or more watchlist entries. For a
-- classroom project there will typically be a single user.
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    email           TEXT NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    active          BOOLEAN NOT NULL DEFAULT TRUE
);

-- The cards table stores basic information about each printed card keyed
-- by its MTGJSON UUID. We include identifiers to bridge to Scryfall and
-- TCGplayer. This table is populated from the MTGJSON AllIdentifiers file.
CREATE TABLE IF NOT EXISTS cards (
    uuid                    UUID PRIMARY KEY,
    name                    TEXT NOT NULL,
    set_code                TEXT NOT NULL,
    collector_number        TEXT NOT NULL,
    rarity                  TEXT,
    scryfall_id             UUID,
    tcgplayer_product_id    BIGINT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cards_name ON cards (name);
CREATE INDEX IF NOT EXISTS idx_cards_set_code ON cards (set_code);

-- The daily_prices table stores price points for each card/finish/date
-- combination. Prices are loaded from the MTGJSON AllPricesToday file,
-- which provides a snapshot of vendor pricing for the current day
-- organised by card UUID【841503420405473†L195-L208】. Over time this table
-- will accumulate up to 90 days of history if supplemented with the
-- AllPrices file【841503420405473†L195-L208】. We use "price_type" to
-- distinguish between retail or buylist values and "vendor" to support
-- multiple marketplaces should you wish to extend the project.
CREATE TABLE IF NOT EXISTS daily_prices (
    price_date      DATE NOT NULL,
    uuid            UUID NOT NULL REFERENCES cards(uuid) ON DELETE CASCADE,
    finish          TEXT NOT NULL,
    vendor          TEXT NOT NULL,
    price_type      TEXT NOT NULL,
    currency        TEXT NOT NULL,
    price           NUMERIC(12,4) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (price_date, uuid, finish, vendor, price_type)
);

CREATE INDEX IF NOT EXISTS idx_daily_prices_uuid_date
    ON daily_prices (uuid, price_date DESC);

-- Each row in the watchlist defines a rule for a user. The rule consists
-- of the card UUID, the finish (normal, foil, etched), a percentage drop
-- threshold, a maximum affordable price, and a lookback period in days.
-- The system will notify the user when the latest price is below
-- the maximum price and has dropped at least the given percentage relative
-- to the price lookback_days ago.
CREATE TABLE IF NOT EXISTS watchlist (
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uuid                UUID NOT NULL REFERENCES cards(uuid) ON DELETE CASCADE,
    finish              TEXT NOT NULL DEFAULT 'normal',
    pct_drop_threshold  NUMERIC(5,2) NOT NULL,
    max_price           NUMERIC(12,4) NOT NULL,
    lookback_days       INTEGER NOT NULL DEFAULT 7,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, uuid, finish)
);

-- When an alert fires the details are recorded here. A unique constraint
-- prevents duplicate alerts for the same card/finish/user on a given day.
CREATE TABLE IF NOT EXISTS alerts (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uuid            UUID NOT NULL REFERENCES cards(uuid) ON DELETE CASCADE,
    finish          TEXT NOT NULL,
    price_date      DATE NOT NULL,
    latest_price    NUMERIC(12,4) NOT NULL,
    old_price       NUMERIC(12,4) NOT NULL,
    pct_drop        NUMERIC(6,2) NOT NULL,
    lookback_days   INTEGER NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT alerts_unique_once_per_day
        UNIQUE (user_id, uuid, finish, price_date)
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_created
    ON alerts (user_id, created_at DESC);