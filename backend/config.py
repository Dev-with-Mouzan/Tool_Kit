import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    PORT: int = int(os.getenv('PORT', 5000))
    HOST: str = os.getenv('HOST', '0.0.0.0')
    ENVIRONMENT: str = os.getenv('ENVIRONMENT', 'development')
    
    # CORS
    FRONTEND_URL: str = os.getenv('FRONTEND_URL', 'http://localhost:8000')
    ALLOWED_ORIGINS: list = [
        origin.strip() 
        for origin in os.getenv('FRONTEND_URL', 'http://localhost:8000').split(',')
    ]
    
    # File Upload
    MAX_FILE_SIZE: int = int(os.getenv('MAX_FILE_SIZE', 100)) * 1024 * 1024  # Convert MB to bytes
    
    # Paths
    DOWNLOADS_DIR: str = os.path.join(os.getcwd(), 'downloads')
    FFMPEG_PATH: Optional[str] = None
    
    @classmethod
    def get_ffmpeg_path(cls) -> Optional[str]:
        """Get ffmpeg path if it exists"""
        ffmpeg_path = os.path.join(os.getcwd(), 'backend', 'bin', 'ffmpeg.exe')
        if os.path.exists(ffmpeg_path):
            return ffmpeg_path
        # Try system ffmpeg
        return 'ffmpeg' if os.system('ffmpeg -version > nul 2>&1') == 0 else None

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG: bool = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG: bool = False
    
def get_config() -> Config:
    """Get configuration based on environment"""
    env = os.getenv('ENVIRONMENT', 'development')
    if env == 'production':
        return ProductionConfig()
    return DevelopmentConfig()

config = get_config()
