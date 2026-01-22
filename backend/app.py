import os
import re
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse, FileResponse
from starlette.background import BackgroundTask
import requests
import yt_dlp
from dotenv import load_dotenv

# Try to import rembg, but don't fail if it's not available yet
try:
    from rembg import remove as rembg_remove
    REMBG_AVAILABLE = True
except Exception as e:
    print(f"⚠️ Warning: rembg not available yet: {e}")
    REMBG_AVAILABLE = False
    rembg_remove = None

load_dotenv()

def sanitize_filename(filename):
    """Remove invalid characters from filename for Windows compatibility"""
    # Remove invalid Windows filename characters: < > : " / \ | ? *
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)
    # Replace multiple spaces with single space
    filename = re.sub(r'\s+', ' ', filename)
    # Remove leading/trailing spaces and dots
    filename = filename.strip('. ')
    # Limit length to avoid path too long errors
    if len(filename) > 200:
        filename = filename[:200]
    return filename if filename else 'video'

app = FastAPI()

# Enable CORS - must be the FIRST middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now to debug
    allow_credentials=False,  # Set to False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=600,
)

@app.get("/health")
async def health():
    return {"status": "running", "message": "Backend is online"}

@app.get("/test")
async def test():
    """Simple test endpoint"""
    return {"status": "ok", "message": "Backend is working!"}

@app.get("/warm-up")
async def warm_up():
    """Warm up the rembg model - call this once after deployment"""
    global REMBG_AVAILABLE, rembg_remove
    
    if REMBG_AVAILABLE and rembg_remove is not None:
        return {"status": "ready", "message": "rembg is already loaded"}
    
    try:
        print("🔥 Loading rembg model...")
        from rembg import remove as rembg_remove_new
        rembg_remove = rembg_remove_new
        REMBG_AVAILABLE = True
        print("✅ rembg model loaded successfully")
        return {"status": "warmed up", "message": "rembg model is now loaded"}
    except Exception as e:
        print(f"❌ Error loading rembg: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/remove-bg")
async def remove_bg(image: UploadFile = File(...)):
    print(f"📥 Received upload request: {image.filename}")
    
    if not image:
        raise HTTPException(status_code=400, detail="No image file provided")
    
    if not REMBG_AVAILABLE or rembg_remove is None:
        print("⚠️ rembg not available yet")
        raise HTTPException(
            status_code=503, 
            detail="Background removal service is starting. Please try again in 30 seconds."
        )
    
    try:
        print(f"🔄 Processing image: {image.filename}")
        # Read file data
        image_data = await image.read()
        print(f"✓ Image data read: {len(image_data)} bytes")
        
        # Process image with rembg
        print("🎨 Removing background...")
        result_content = rembg_remove(image_data)
        print(f"✓ Background removed: {len(result_content)} bytes")
        
        # Return result as image bytes directly
        return Response(content=result_content, media_type="image/png")

    except Exception as e:
        print(f"❌ Error in remove_bg: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.get("/yt-info")
async def yt_info(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="Missing URL parameter")
    
    try:
        ffmpeg_path = os.path.join(os.getcwd(), 'backend', 'bin', 'ffmpeg.exe') if os.path.exists(os.path.join(os.getcwd(), 'backend', 'bin', 'ffmpeg.exe')) else None

        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'format': 'best',
            'ffmpeg_location': ffmpeg_path
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Extract relevant formats
            formats = []
            
            # 1. Best Video + Audio Merge (MP4 1080p+)
            # We construct a custom option for this
            formats.append({
                'label': f"Download High Quality (MP4)",
                'sub': f"1080p+ (Merged)",
                'color': 'indigo',
                'url': url,
                'format_id': 'bestvideo+bestaudio/best' # Pass this code to backend
            })
            
            # 2. Standard MP4 (Single file)
            best_single = next((f for f in info.get('formats', []) if f.get('vcodec') != 'none' and f.get('acodec') != 'none' and f.get('ext') == 'mp4'), None)
            if best_single:
                formats.append({
                    'label': f"Download Standard (MP4)",
                    'sub': f"{best_single.get('resolution', 'Unknown')}",
                    'color': 'blue',
                    'url': url,
                    'format_id': best_single.get('format_id')
                })

            # 3. Audio Only
            formats.append({
                'label': f"Download Audio (MP3)",
                'sub': 'Best Quality',
                'color': 'purple',
                'url': url,
                'format_id': 'bestaudio/best',
                'is_audio': True
            })

            return {
                "title": info.get('title'),
                "thumbnail_url": info.get('thumbnail'),
                "duration_string": info.get('duration_string'),
                "formats": formats
            }

    except Exception as e:
        print(f"Error fetching YT info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download")
async def download_file(url: str, format_id: str = "best"):
    if not url:
         raise HTTPException(status_code=400, detail="Missing URL")
    
    try:
        downloads_dir = "downloads"
        os.makedirs(downloads_dir, exist_ok=True)
        
        ffmpeg_path = os.path.join(os.getcwd(), 'backend', 'bin', 'ffmpeg.exe') if os.path.exists(os.path.join(os.getcwd(), 'backend', 'bin', 'ffmpeg.exe')) else None

        # Clean old files (simple maintenance)
        for f in os.listdir(downloads_dir):
            try:
                os.remove(os.path.join(downloads_dir, f))
            except:
                pass

        # First, get video info to sanitize the title
        ydl_info_opts = {
            'quiet': True,
            'no_warnings': True,
            'ffmpeg_location': ffmpeg_path,
        }
        
        with yt_dlp.YoutubeDL(ydl_info_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            safe_title = sanitize_filename(info.get('title', 'video'))
        
        # Now download with sanitized filename
        ydl_opts = {
            'outtmpl': f'{downloads_dir}/{safe_title}.%(ext)s',
            'format': format_id,
            'merge_output_format': 'mp4',
            'ffmpeg_location': ffmpeg_path,
            'quiet': True,
            'no_warnings': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            
            # If merged, extension handles itself, but we should verify the file exists
            # yt-dlp prepares filename with original extension appropriately
            # If we enforced merge to mp4, the final file usually ends in mp4
            if info.get('requested_downloads'):
                 filename = info['requested_downloads'][0]['filepath']
            
            # Additional check for mp4 replacement if merge happened
            if format_id == 'bestvideo+bestaudio/best' and not filename.endswith('.mp4'):
                 filename = os.path.splitext(filename)[0] + '.mp4'

        if not os.path.exists(filename):
             raise HTTPException(status_code=500, detail="File download failed")

        def cleanup():
            if os.path.exists(filename):
                try:
                    os.remove(filename)
                except:
                    pass

        return FileResponse(
            path=filename, 
            filename=os.path.basename(filename), 
            media_type='video/mp4', 
            background=BackgroundTask(cleanup)
        )

    except Exception as e:
        print(f"Download Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process download: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get('PORT', 5000))
    print(f"Server starting on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
