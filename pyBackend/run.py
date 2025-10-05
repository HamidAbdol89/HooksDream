"""
Run script for HooksDream Python Backend
"""

import uvicorn
from config import settings, get_port, get_host

if __name__ == "__main__":
    host = get_host()
    port = get_port()
    
    print(" Starting HooksDream Python Backend...")
    print(f" Environment: {settings.ENVIRONMENT}")
    print(f" Server will run on {host}:{port}")
    print(f" Backend URL: {settings.NODE_BACKEND_URL}")
    print(f" Bot enabled: {settings.BOT_ENABLED}")
    
    # Different settings for development vs production
    if settings.ENVIRONMENT == "production":
        uvicorn.run(
            "app:app",
            host=host,
            port=port,
            reload=False,  # No reload in production
            log_level="info"
        )
    else:
        uvicorn.run(
            "app:app",
            host=host,
            port=port,
            reload=True,   # Hot reload in development
            log_level="debug"
        )
