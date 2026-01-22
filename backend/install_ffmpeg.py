import os
import requests
import zipfile
import io

# URL for a smaller, older but stable build or just standard release. 
# Using gyan.dev essentials which is standard for Windows.
url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"

target_dir = os.path.join('backend', 'bin')
os.makedirs(target_dir, exist_ok=True)

print(f"Downloading ffmpeg from {url}...")
print("This might take a minute...")
try:
    r = requests.get(url)
    r.raise_for_status()
    
    print("Download complete. Extracting...")
    
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        for file in z.namelist():
            # We look for ffmpeg.exe and ffprobe.exe in the bin folder of the zip
            if file.endswith('bin/ffmpeg.exe') or file.endswith('bin/ffprobe.exe'):
                target_name = os.path.basename(file)
                target_path = os.path.join(target_dir, target_name)
                
                print(f"Extracting {target_name}...")
                with z.open(file) as source, open(target_path, "wb") as target:
                    target.write(source.read())
                    
    print("FFmpeg installation complete.")
    
except Exception as e:
    print(f"Error installing ffmpeg: {e}")
