"""
Vercel entry point for HooksDream Python Backend
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

# Export the FastAPI app for Vercel
handler = app
