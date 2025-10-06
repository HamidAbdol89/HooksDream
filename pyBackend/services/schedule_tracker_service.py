"""
Schedule Tracker Service
Persistent tracking để tránh spam posts khi restart server
Sử dụng timezone Việt Nam và schedule cố định
"""

import json
import os
from datetime import datetime, time
from typing import Dict, List, Optional
import logging
import pytz

logger = logging.getLogger(__name__)

class ScheduleTrackerService:
    """Service để track schedule và tránh duplicate posts"""
    
    def __init__(self):
        self.data_file = os.path.join(os.path.dirname(__file__), "..", "data", "schedule_tracker.json")
        self.vietnam_tz = pytz.timezone('Asia/Ho_Chi_Minh')
        
        # Fixed posting times (Vietnam timezone)
        self.posting_times = [
            time(9, 0),   # 9:00 AM
            time(15, 0),  # 3:00 PM  
            time(19, 0)   # 7:00 PM
        ]
        
        self.data = {}
        self._ensure_data_file()
        self._load_data()
    
    def _ensure_data_file(self):
        """Ensure data directory and file exist"""
        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
        
        if not os.path.exists(self.data_file):
            default_data = {
                "marcin_frames_art": {
                    "last_post_dates": {},  # {"2025-10-06": ["09:00", "15:00"]}
                    "total_posts": 0,
                    "last_updated": None
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
            logger.error(f"❌ Error loading schedule tracker data: {str(e)}")
            self.data = {}
    
    def _save_data(self):
        """Save data to JSON file"""
        try:
            with open(self.data_file, 'w') as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            logger.error(f"❌ Error saving schedule tracker data: {str(e)}")
    
    def get_vietnam_now(self) -> datetime:
        """Get current time in Vietnam timezone"""
        return datetime.now(self.vietnam_tz)
    
    def get_today_string(self) -> str:
        """Get today's date string in Vietnam timezone"""
        return self.get_vietnam_now().strftime('%Y-%m-%d')
    
    def get_current_time_string(self) -> str:
        """Get current time string in HH:MM format"""
        return self.get_vietnam_now().strftime('%H:%M')
    
    def is_posting_time(self) -> bool:
        """Check if current time matches any posting schedule"""
        current_time = self.get_vietnam_now().time()
        
        # Allow 1 minute window for each posting time
        for posting_time in self.posting_times:
            if (current_time.hour == posting_time.hour and 
                abs(current_time.minute - posting_time.minute) <= 1):
                return True
        return False
    
    def get_next_posting_time(self) -> Optional[str]:
        """Get next scheduled posting time"""
        current_time = self.get_vietnam_now().time()
        
        for posting_time in self.posting_times:
            if current_time < posting_time:
                return posting_time.strftime('%H:%M')
        
        # If past all today's times, return first time tomorrow
        return self.posting_times[0].strftime('%H:%M') + " (tomorrow)"
    
    def can_post_now(self, bot_username: str = "marcin_frames_art") -> bool:
        """Check if bot can post at current time"""
        if not self.is_posting_time():
            return False
        
        today = self.get_today_string()
        current_time = self.get_current_time_string()
        
        # Initialize bot data if not exists
        if bot_username not in self.data:
            self.data[bot_username] = {
                "last_post_dates": {},
                "total_posts": 0,
                "last_updated": None
            }
        
        # Check if already posted at this time today
        if today in self.data[bot_username]["last_post_dates"]:
            posted_times = self.data[bot_username]["last_post_dates"][today]
            
            # Check if current posting time slot is already used
            for posting_time in self.posting_times:
                time_str = posting_time.strftime('%H:%M')
                if (abs(datetime.strptime(current_time, '%H:%M').time().hour - posting_time.hour) <= 0 and
                    time_str in posted_times):
                    return False
        
        return True
    
    def mark_post_created(self, bot_username: str = "marcin_frames_art"):
        """Mark that a post was created at current time"""
        today = self.get_today_string()
        current_time = self.get_current_time_string()
        
        # Initialize bot data if not exists
        if bot_username not in self.data:
            self.data[bot_username] = {
                "last_post_dates": {},
                "total_posts": 0,
                "last_updated": None
            }
        
        # Initialize today's data if not exists
        if today not in self.data[bot_username]["last_post_dates"]:
            self.data[bot_username]["last_post_dates"][today] = []
        
        # Find the closest posting time slot
        current_datetime = datetime.strptime(current_time, '%H:%M').time()
        closest_posting_time = min(
            self.posting_times,
            key=lambda t: abs((datetime.combine(datetime.today(), current_datetime) - 
                             datetime.combine(datetime.today(), t)).total_seconds())
        )
        
        time_slot = closest_posting_time.strftime('%H:%M')
        
        # Add to posted times if not already there
        if time_slot not in self.data[bot_username]["last_post_dates"][today]:
            self.data[bot_username]["last_post_dates"][today].append(time_slot)
            self.data[bot_username]["total_posts"] += 1
            self.data[bot_username]["last_updated"] = self.get_vietnam_now().isoformat()
            
            self._save_data()
            logger.info(f"📝 Marked post created for {bot_username} at {time_slot} on {today}")
    
    def get_today_posts_count(self, bot_username: str = "marcin_frames_art") -> int:
        """Get number of posts created today"""
        today = self.get_today_string()
        
        if (bot_username in self.data and 
            today in self.data[bot_username]["last_post_dates"]):
            return len(self.data[bot_username]["last_post_dates"][today])
        
        return 0
    
    def get_stats(self, bot_username: str = "marcin_frames_art") -> Dict:
        """Get scheduling statistics"""
        if bot_username not in self.data:
            return {
                "total_posts": 0,
                "today_posts": 0,
                "last_updated": None,
                "next_posting_time": self.get_next_posting_time(),
                "can_post_now": False,
                "posting_schedule": [t.strftime('%H:%M') for t in self.posting_times],
                "vietnam_time": self.get_vietnam_now().strftime('%Y-%m-%d %H:%M:%S %Z')
            }
        
        return {
            "total_posts": self.data[bot_username]["total_posts"],
            "today_posts": self.get_today_posts_count(bot_username),
            "last_updated": self.data[bot_username]["last_updated"],
            "next_posting_time": self.get_next_posting_time(),
            "can_post_now": self.can_post_now(bot_username),
            "posting_schedule": [t.strftime('%H:%M') for t in self.posting_times],
            "vietnam_time": self.get_vietnam_now().strftime('%Y-%m-%d %H:%M:%S %Z')
        }
    
    def cleanup_old_data(self, days_to_keep: int = 7):
        """Clean up old scheduling data (keep last 7 days)"""
        cutoff_date = (self.get_vietnam_now() - 
                      datetime.timedelta(days=days_to_keep)).strftime('%Y-%m-%d')
        
        for bot_username in self.data:
            if "last_post_dates" in self.data[bot_username]:
                dates_to_remove = [
                    date for date in self.data[bot_username]["last_post_dates"]
                    if date < cutoff_date
                ]
                
                for date in dates_to_remove:
                    del self.data[bot_username]["last_post_dates"][date]
        
        if dates_to_remove:
            self._save_data()
            logger.info(f"🧹 Cleaned up {len(dates_to_remove)} old schedule entries")

# Global instance
schedule_tracker = ScheduleTrackerService()

# Helper functions for easy import
def can_post_now(bot_username: str = "marcin_frames_art") -> bool:
    """Check if bot can post now"""
    return schedule_tracker.can_post_now(bot_username)

def mark_post_created(bot_username: str = "marcin_frames_art"):
    """Mark post as created"""
    schedule_tracker.mark_post_created(bot_username)

def get_schedule_stats(bot_username: str = "marcin_frames_art") -> Dict:
    """Get schedule stats"""
    return schedule_tracker.get_stats(bot_username)

def is_posting_time() -> bool:
    """Check if current time is posting time"""
    return schedule_tracker.is_posting_time()

def get_vietnam_time() -> datetime:
    """Get current Vietnam time"""
    return schedule_tracker.get_vietnam_now()
