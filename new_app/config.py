from pathlib import Path
from decouple import config
from dotenv import load_dotenv
import os

env_path = Path(__file__).parent / '.env'

if not env_path.is_file():
    env_path = Path('.') / '.env'
    if not env_path.is_file():
        raise FileNotFoundError(f"Environment file not found. Please create a .env file in the new_app directory with the necessary configuration.")
    else:
        print("WARNING: .env should be moved to the new_app directory for better organization and to avoid confusion. The current .env in the root directory is deprecated.")

class Config:
    SECRET_KEY = config('SECRET_KEY', default='dev-secret-key-fallback')
    SQLALCHEMY_DATABASE_URI = config('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False # should be moved to .env for security.
#    # Email settings
MAIL_SERVER = config('MAIL_SERVER')
MAIL_PORT = config('MAIL_PORT', cast=int)
MAIL_USE_TLS = True
MAIL_USERNAME = config('MAIL_USERNAME')
MAIL_PASSWORD = config('MAIL_PASSWORD')
MAIL_DEFAULT_SENDER = config('MAIL_FROM')