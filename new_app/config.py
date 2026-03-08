from decouple import config
import os

class Config:
    SQLALCHEMY_DATABASE_URI = config('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False # should be moved to .env for security.