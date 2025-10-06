"""
Photo Tracker Service
Tracks used photos to prevent duplicates
"""

import json
import os
import asyncio
from datetime import datetime
from typing import Dict, List, Set
import logging

logger = logging.getLogger(__name__)

class PhotoTrackerService:
    """Service to track used photos and prevent duplicates"""
    
    def __init__(self):
        self.data_file = os.path.join(os.path.dirname(__file__), "..", "data", "used_photos.json")
        self.data = {}
        self._ensure_data_file()
        self._load_data()
    
    def _ensure_data_file(self):
        """Ensure data directory and file exist"""
        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
        
        if not os.path.exists(self.data_file):
            default_data = {
                "marcin_frames_art": {
                    "used_photo_ids": [],
                    "last_updated": None,
                    "total_used": 0
                }
            }
            with open(self.data_file, 'w') as f:
                json.dump(default_data, f, indent=2)
    
    def _load_data(self):
        """Load data from JSON file"""
        try:
            with open(self.data_file, 'r') as f:
                self.data = json.load(f)
        except Exception as e:
            logger.error(f"❌ Error loading photo tracker data: {str(e)}")
            self.data = {}
    
    def _save_data(self):
        """Save data to JSON file"""
        try:
            with open(self.data_file, 'w') as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            logger.error(f"❌ Error saving photo tracker data: {str(e)}")
    
    def is_photo_used(self, bot_username: str, photo_id: str) -> bool:
        """Check if a photo has been used by a bot"""
        if bot_username not in self.data:
            self.data[bot_username] = {
                "used_photo_ids": [],
                "last_updated": None,
                "total_used": 0
            }
        
        return photo_id in self.data[bot_username]["used_photo_ids"]
    
    def mark_photo_used(self, bot_username: str, photo_id: str):
        """Mark a photo as used by a bot"""
        if bot_username not in self.data:
            self.data[bot_username] = {
                "used_photo_ids": [],
                "last_updated": None,
                "total_used": 0
            }
        
        if photo_id not in self.data[bot_username]["used_photo_ids"]:
            self.data[bot_username]["used_photo_ids"].append(photo_id)
            self.data[bot_username]["total_used"] += 1
            self.data[bot_username]["last_updated"] = datetime.now().isoformat()
            self._save_data()
            logger.info(f"📝 Marked photo {photo_id} as used by {bot_username}")
    
    def get_used_photos(self, bot_username: str) -> List[str]:
        """Get list of used photo IDs for a bot"""
        if bot_username not in self.data:
            return []
        return self.data[bot_username]["used_photo_ids"].copy()
    
    def get_unused_photos(self, bot_username: str, available_photos: List[Dict]) -> List[Dict]:
        """Filter out used photos from available photos"""
        used_ids = set(self.get_used_photos(bot_username))
        unused_photos = [photo for photo in available_photos if photo["id"] not in used_ids]
        
        logger.info(f"🔍 {bot_username}: {len(available_photos)} total, {len(used_ids)} used, {len(unused_photos)} unused")
        
        return unused_photos
    
    def reset_used_photos(self, bot_username: str):
        """Reset used photos for a bot (when all photos are exhausted)"""
        if bot_username in self.data:
            old_count = len(self.data[bot_username]["used_photo_ids"])
            self.data[bot_username]["used_photo_ids"] = []
            self.data[bot_username]["total_used"] = 0
            self.data[bot_username]["last_updated"] = datetime.now().isoformat()
            self._save_data()
            logger.info(f"🔄 Reset {old_count} used photos for {bot_username}")
    
    def get_stats(self, bot_username: str) -> Dict:
        """Get usage statistics for a bot"""
        if bot_username not in self.data:
            return {
                "total_used": 0,
                "last_updated": None,
                "used_photo_ids": []
            }
        
        return {
            "total_used": self.data[bot_username]["total_used"],
            "last_updated": self.data[bot_username]["last_updated"],
            "used_count": len(self.data[bot_username]["used_photo_ids"])
        }
    
    def cleanup_old_data(self, days_old: int = 30):
        """Clean up old tracking data (optional maintenance)"""
        # This could be implemented to remove very old tracking data
        # For now, we keep all data to ensure no duplicates
        pass

# Global instance
photo_tracker = PhotoTrackerService()

# Helper functions for easy import
def is_photo_used(bot_username: str, photo_id: str) -> bool:
    """Check if photo is already used"""
    return photo_tracker.is_photo_used(bot_username, photo_id)

def mark_photo_used(bot_username: str, photo_id: str):
    """Mark photo as used"""
    photo_tracker.mark_photo_used(bot_username, photo_id)

def get_unused_photos(bot_username: str, available_photos: List[Dict]) -> List[Dict]:
    """Get only unused photos"""
    return photo_tracker.get_unused_photos(bot_username, available_photos)

def get_photo_stats(bot_username: str) -> Dict:
    """Get photo usage stats"""
    return photo_tracker.get_stats(bot_username)

def reset_used_photos(bot_username: str):
    """Reset used photos when exhausted"""
    photo_tracker.reset_used_photos(bot_username)
