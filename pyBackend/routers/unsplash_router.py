"""
Unsplash API Router
Endpoints for fetching images from Unsplash
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Optional
import main

router = APIRouter()

class PhotoResponse(BaseModel):
    id: str
    description: str
    urls: Dict[str, str]
    user: Dict[str, str]
    width: int
    height: int
    color: Optional[str]
    likes: int
    download_url: str
    html_url: str

class SearchResponse(BaseModel):
    total: int
    total_pages: int
    photos: List[PhotoResponse]

@router.get("/random", response_model=List[PhotoResponse])
async def get_random_photos(
    count: int = Query(1, ge=1, le=30, description="Number of photos to fetch"),
    query: Optional[str] = Query(None, description="Search query for specific topics")
):
    """Get random photos from Unsplash"""
    unsplash_service = main.unsplash_service
    
    if not unsplash_service:
        raise HTTPException(status_code=503, detail="Unsplash service not initialized")
    
    try:
        photos = await unsplash_service.get_random_photos(count=count, query=query)
        
        if not photos:
            raise HTTPException(status_code=404, detail="No photos found")
        
        return photos
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching photos: {str(e)}")

@router.get("/search", response_model=SearchResponse)
async def search_photos(
    query: str = Query(..., description="Search query"),
    per_page: int = Query(10, ge=1, le=30, description="Results per page"),
    page: int = Query(1, ge=1, description="Page number")
):
    """Search for photos on Unsplash"""
    unsplash_service = main.unsplash_service
    
    if not unsplash_service:
        raise HTTPException(status_code=503, detail="Unsplash service not initialized")
    
    try:
        results = await unsplash_service.search_photos(
            query=query,
            per_page=per_page,
            page=page
        )
        
        return results
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching photos: {str(e)}")

@router.get("/topics")
async def get_trending_topics():
    """Get trending topics for diverse content"""
    unsplash_service = main.unsplash_service
    
    if not unsplash_service:
        raise HTTPException(status_code=503, detail="Unsplash service not initialized")
    
    try:
        topics = await unsplash_service.get_trending_topics()
        return {"topics": topics, "total": len(topics)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching topics: {str(e)}")

@router.post("/download/{photo_id}")
async def download_photo(photo_id: str):
    """Trigger download tracking for a photo (required by Unsplash API)"""
    unsplash_service = main.unsplash_service
    
    if not unsplash_service:
        raise HTTPException(status_code=503, detail="Unsplash service not initialized")
    
    try:
        download_url = await unsplash_service.download_photo(photo_id)
        
        if not download_url:
            raise HTTPException(status_code=404, detail="Photo not found or download failed")
        
        return {"download_url": download_url, "photo_id": photo_id}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading photo: {str(e)}")

@router.get("/stats")
async def get_unsplash_stats():
    """Get Unsplash service statistics"""
    unsplash_service = main.unsplash_service
    
    if not unsplash_service:
        raise HTTPException(status_code=503, detail="Unsplash service not initialized")
    
    return {
        "service": "Unsplash API",
        "access_key_configured": bool(unsplash_service.access_key),
        "base_url": unsplash_service.base_url,
        "status": "active"
    }
