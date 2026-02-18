"""
Central configuration for the MTG price alert project.

Values are loaded from a .env file in the project root (and/or the OS
environment). We expose BOTH lowercase and uppercase attribute names
to stay compatible with all modules.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv  # pip install python-dotenv if needed


# Load .env from the project root (two levels up from this file)
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(env_path)


@dataclass
class Settings:
    # --- Database settings (lowercase) ---
    db_host: str = os.getenv("DB_HOST", "localhost")
    db_port: int = int(os.getenv("DB_PORT", "5432"))
    db_name: str = os.getenv("DB_NAME", "mtg_price_alert")
    db_user: str = os.getenv("DB_USER", "mtg_user")
    db_password: str = os.getenv("DB_PASSWORD", "")

    # --- Database settings (UPPERCASE aliases) ---
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_NAME: str = os.getenv("DB_NAME", "mtg_price_alert")
    DB_USER: str = os.getenv("DB_USER", "mtg_user")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")

    # --- SMTP / email settings (lowercase) ---
    smtp_host: str = os.getenv("SMTP_HOST", "")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_username: str = os.getenv("SMTP_USERNAME", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    email_from: str = os.getenv("EMAIL_FROM", "")

    # --- SMTP / email settings (UPPERCASE aliases) ---
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "")

    # --- External APIs (lowercase) ---
    scryfall_api_base: str = os.getenv(
        "SCRYFALL_API_BASE", "https://api.scryfall.com"
    )
    mtgjson_api_base: str = os.getenv(
        "MTGJSON_API_BASE", "https://mtgjson.com/api/v5"
    )

    # --- External APIs (UPPERCASE aliases) ---
    SCRYFALL_API_BASE: str = os.getenv(
        "SCRYFALL_API_BASE", "https://api.scryfall.com"
    )
    MTGJSON_API_BASE: str = os.getenv(
        "MTGJSON_API_BASE", "https://mtgjson.com/api/v5"
    )


# Singleton settings instance used throughout the app
settings = Settings()
