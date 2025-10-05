"""
App entry point for deployment
Import the FastAPI app from main.py
"""

from main import app

# This allows deployment platforms to import the app
# Usage: uvicorn app:app or gunicorn app:app
