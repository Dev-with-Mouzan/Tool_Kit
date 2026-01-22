# Development Guide

Guide for developers contributing to or extending WebToolkit.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Development Setup](#development-setup)
3. [Adding New Tools](#adding-new-tools)
4. [Code Style Guidelines](#code-style-guidelines)
5. [Testing](#testing)
6. [Common Tasks](#common-tasks)

---

## Project Structure

```
Tool/
├── backend/                    # Python FastAPI backend
│   ├── app.py                 # Main application with all endpoints
│   ├── config.py              # Configuration management
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Backend container image
│   └── .dockerignore          # Docker build exclusions
│
├── tools/                      # Individual tool pages
│   ├── yt-downloader.html     # YouTube downloader UI
│   ├── bg-remover.html        # Background remover UI
│   ├── pdf-to-word.html       # PDF converter UI
│   └── ...                    # Other tool pages
│
├── js/                         # JavaScript files
│   ├── main.js                # Main frontend logic
│   ├── libs/                  # Third-party libraries
│   └── tools/                 # Tool-specific scripts
│       ├── yt-downloader.js   # YouTube downloader logic
│       ├── bg-remover.js      # Background remover logic
│       └── ...                # Other tool scripts
│
├── css/                        # Stylesheets
│   └── style.css              # Main stylesheet
│
├── assets/                     # Static assets (images, etc.)
│
├── scripts/                    # Automation scripts
│   ├── dev.sh                 # Unix development script
│   ├── dev.bat                # Windows development script
│   └── deploy.sh              # Deployment script
│
├── docs/                       # Documentation
│   ├── API.md                 # API documentation
│   ├── DEPLOYMENT.md          # Deployment guide
│   └── DEVELOPMENT.md         # This file
│
├── downloads/                  # Temporary download directory
├── index.html                 # Main landing page
├── docker-compose.yml         # Docker Compose config
├── nginx.conf                 # Nginx configuration
├── package.json               # Node.js dependencies
├── .env.example               # Environment template
├── .gitignore                 # Git ignore patterns
└── README.md                  # Project overview
```

---

## Development Setup

### Prerequisites

- Python 3.9+
- Node.js 14+ (optional)
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. **Clone and navigate**
   ```bash
   git clone <repository-url>
   cd Tool
   ```

2. **Create virtual environment (recommended)**
   ```bash
   cd backend
   python -m venv venv
   
   # Activate
   # Windows:
   venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   cd ..
   npm install  # If using Node.js dependencies
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env
   ```

5. **Run development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   python app.py
   
   # Terminal 2 - Frontend
   python -m http.server 8000
   ```

---

## Adding New Tools

### Step 1: Create HTML Page

Create `tools/your-tool.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Tool - WebToolkit</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body>
    <!-- Navigation (copy from existing tool) -->
    
    <main class="max-w-4xl mx-auto px-4 py-16">
        <h1 class="text-4xl font-bold text-white mb-8">Your Tool</h1>
        
        <!-- Your tool UI here -->
        <div id="tool-container">
            <!-- Input elements -->
            <!-- Output elements -->
        </div>
    </main>
    
    <script src="../js/tools/your-tool.js"></script>
</body>
</html>
```

### Step 2: Create JavaScript Logic

Create `js/tools/your-tool.js`:

```javascript
// Tool initialization
document.addEventListener('DOMContentLoaded', () => {
    initYourTool();
});

function initYourTool() {
    // Set up event listeners
    const processBtn = document.getElementById('process-btn');
    processBtn.addEventListener('click', handleProcess);
}

async function handleProcess() {
    try {
        // Get input
        const input = document.getElementById('input').value;
        
        // Process (client-side or API call)
        const result = await processData(input);
        
        // Display result
        displayResult(result);
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}

async function processData(input) {
    // If using backend API:
    const response = await fetch('http://localhost:5000/your-endpoint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: input })
    });
    
    if (!response.ok) {
        throw new Error('Processing failed');
    }
    
    return await response.json();
}

function displayResult(result) {
    // Update UI with result
}

function showError(message) {
    // Display error to user
}
```

### Step 3: Add Backend Endpoint (if needed)

In `backend/app.py`:

```python
@app.post("/your-endpoint")
async def your_endpoint(data: dict):
    try:
        # Process data
        result = process_your_data(data)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def process_your_data(data):
    # Your processing logic
    return processed_data
```

### Step 4: Add to Homepage

In `index.html`, add a tool card:

```html
<a href="tools/your-tool.html" class="glass-card rounded-xl p-6 relative group overflow-hidden">
    <div class="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
        <i data-lucide="icon-name" class="w-6 h-6 text-blue-400"></i>
    </div>
    <h3 class="text-xl font-bold text-white mb-2">Your Tool</h3>
    <p class="text-sm text-gray-400">Brief description of your tool.</p>
</a>
```

### Step 5: Update Documentation

Add your endpoint to `docs/API.md` if you created a backend endpoint.

---

## Code Style Guidelines

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints where possible
- Keep functions focused and small
- Add docstrings to functions
- Handle errors gracefully

```python
from typing import Optional

async def process_file(file: UploadFile, options: Optional[dict] = None) -> dict:
    """
    Process uploaded file with optional configuration.
    
    Args:
        file: Uploaded file object
        options: Optional processing configuration
        
    Returns:
        Dictionary with processing results
        
    Raises:
        HTTPException: If processing fails
    """
    try:
        # Processing logic
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### JavaScript (Frontend)

- Use modern ES6+ syntax
- Use async/await for asynchronous operations
- Add comments for complex logic
- Keep functions pure when possible
- Handle errors with try/catch

```javascript
/**
 * Process user input and display results
 * @param {string} input - User input data
 * @returns {Promise<Object>} Processing results
 */
async function processInput(input) {
    try {
        const response = await fetch('/api/endpoint', {
            method: 'POST',
            body: JSON.stringify({ input })
        });
        
        if (!response.ok) {
            throw new Error('Processing failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error processing input:', error);
        throw error;
    }
}
```

### HTML/CSS

- Use semantic HTML5 elements
- Use Tailwind CSS utility classes
- Keep custom CSS minimal
- Ensure responsive design
- Add proper ARIA labels for accessibility

---

## Testing

### Manual Testing

1. **Test each tool individually**
   - Upload various file types
   - Test edge cases (large files, invalid inputs)
   - Verify error handling

2. **Test cross-browser compatibility**
   - Chrome
   - Firefox
   - Safari
   - Edge

3. **Test responsive design**
   - Mobile devices
   - Tablets
   - Desktop

### Backend Testing

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test with sample data
curl -X POST http://localhost:5000/endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## Common Tasks

### Update Dependencies

```bash
# Python
cd backend
pip install --upgrade -r requirements.txt
pip freeze > requirements.txt

# Node.js
npm update
```

### Add New Python Package

```bash
cd backend
pip install package-name
pip freeze > requirements.txt
```

### Debug Backend

```python
# Add to app.py
import logging
logging.basicConfig(level=logging.DEBUG)

# Add debug logs
logging.debug(f"Processing data: {data}")
```

### Check Docker Build

```bash
# Build backend image
docker build -t webtoolkit-backend ./backend

# Run container
docker run -p 5000:5000 webtoolkit-backend
```

### View Logs

```bash
# Docker logs
docker-compose logs -f backend

# Python logs (add to app.py)
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

---

## Best Practices

1. **Always test locally before committing**
2. **Keep commits atomic and well-described**
3. **Update documentation when adding features**
4. **Handle errors gracefully with user-friendly messages**
5. **Optimize for performance (lazy loading, caching)**
6. **Ensure privacy (delete temporary files)**
7. **Make tools accessible (ARIA labels, keyboard navigation)**
8. **Test with various file sizes and formats**

---

## Useful Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Python Type Hints](https://docs.python.org/3/library/typing.html)

---

For questions or issues, please open a GitHub issue or discussion.
