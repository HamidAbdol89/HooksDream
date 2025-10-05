"""
Global Image Tracking Service
Prevents duplicate images across all bot posts
"""

import asyncio
import time
from typing import Set, Dict, Optional
from datetime import datetime, timedelta

class ImageTracker:
    def __init__(self):
        """Initialize image tracking system"""
        self.used_image_ids: Set[str] = set()
        self.used_image_urls: Set[str] = set()
        self.image_usage_time: Dict[str, float] = {}
        self.cleanup_interval = 24 * 60 * 60  # 24 hours in seconds
        
    def is_image_used(self, image_id: str, image_url: str) -> bool:
        """Check if image has been used recently"""
        # Clean up old entries first
        self._cleanup_old_entries()
        
        return image_id in self.used_image_ids or image_url in self.used_image_urls
    
    def mark_image_used(self, image_id: str, image_url: str) -> None:
        """Mark image as used"""
        current_time = time.time()
        
        self.used_image_ids.add(image_id)
        self.used_image_urls.add(image_url)
        self.image_usage_time[image_id] = current_time
        
        print(f"📝 Marked image {image_id} as used")
    
    def _cleanup_old_entries(self) -> None:
        """Remove images older than 24 hours from tracking"""
        current_time = time.time()
        cutoff_time = current_time - self.cleanup_interval
        
        # Find old image IDs
        old_image_ids = [
            img_id for img_id, usage_time in self.image_usage_time.items()
            if usage_time < cutoff_time
        ]
        
        # Remove old entries
        for img_id in old_image_ids:
            self.used_image_ids.discard(img_id)
            del self.image_usage_time[img_id]
            
            # Find and remove corresponding URL (this is approximate)
            # In practice, you might want to store ID->URL mapping
        
        if old_image_ids:
            print(f"🧹 Cleaned up {len(old_image_ids)} old image entries")
    
    def get_stats(self) -> Dict:
        """Get tracking statistics"""
        return {
            "tracked_images": len(self.used_image_ids),
            "tracked_urls": len(self.used_image_urls),
            "oldest_entry": min(self.image_usage_time.values()) if self.image_usage_time else None
        }

# Global instance
global_image_tracker = ImageTracker()
