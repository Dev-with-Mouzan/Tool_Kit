# ◈ FileToolkitPro: The Ultimate Technical Encyclopedia

> **Free Online File Tools (No Upload Required) — Privacy-First Hybrid Architecture.**

FileToolkitPro is a high-performance, dual-engine web platform offering 10+ professional-grade utilities. This document details every technical aspect of the project, from client-side canvas logic to backend AI inference models.

---

## 🏗️ Hybrid Architecture Overview

The platform operates on a split-logic model to balance privacy and computational power:

### 1. Client-Side Engine (Privacy-First)
*   **Execution Environment:** User's Browser (V8/SpiderMonkey).
*   **Data Flow:** Local File -> Memory Buffer -> Processing -> Blob Download.
*   **Security:** 0% data transmission to external servers for supported tools.
*   **Libraries:**
    *   `browser-image-compression`: Multi-threaded image optimization.
    *   `pdf-lib`: Binary-level PDF structure manipulation and object pruning.
    *   `jspdf`: Dynamic PDF generation for image batching.
    *   `JSZip`: Client-side compression for multi-file downloads.
    *   `Canvas API`: Real-time pixel manipulation for format conversion and social media resizing.

### 2. Backend AI & Transcoding Engine
*   **Language:** Python 3.11+
*   **Framework:** FastAPI (Asynchronous REST API).
*   **Data Lifecycle:** RAM-only processing (using `io.BytesIO`) or temporary isolated storage with `BackgroundTasks` triggered **Auto-Purge**.
*   **Core Systems:**
    *   **AI Vision:** `rembg` (U2Net) for background removal; `RealESRGAN_x4plus` & `GFPGANv1.3` for 4K upscaling and face restoration.
    *   **Media Engine:** `FFmpeg 8.0` for high-efficiency video transcoding (libx264/palettegen).
    *   **Document Engine:** `mammoth` (DOCX->HTML), `xhtml2pdf/pisa` (HTML->PDF), `pdfplumber` (Table extraction), `openpyxl` (Excel manipulation).

---

## 🛠️ Comprehensive Tool Dictionary

### 🖼️ Image Suite (7 Tools)
1.  **Image Compressor:** Uses `browser-image-compression` to reduce file size while maintaining visual fidelity via local resampling.
2.  **Image Converter:** Instant format conversion (JPG ↔ PNG ↔ WebP ↔ BMP) using the `Canvas API` for pixel-perfect data transfer.
3.  **Image to PDF:** Batch converts multiple images into a single PDF document using `jspdf` with automated aspect-ratio fitting.
4.  **AI Background Remover:** Uses a server-side `U2Net` model via `rembg` to generate transparent PNGs with high-precision edge detection.
5.  **AI Image Enhancer:** Features a singleton `ImageEnhancer` class utilizing `RealESRGAN` for 4K upscaling and `GFPGAN` for face detail restoration.
6.  **Social Media Resizer:** Automated client-side canvas resizing with professional presets for Instagram (Square/Portrait), YouTube (Thumbnails), and Facebook.
7.  **Passport Photo Maker:** Generates compliant identity photos for 5+ countries (USA, UK, India, etc.) with automated 4x6" print sheet tiling.

### 📄 PDF & Document Suite (2 Tools)
1.  **PDF Compressor:** Performs structural cleanup of PDF binaries using `pdf-lib`, stripping redundant metadata and objects without visual loss.
2.  **Document Converter:** A massive multi-directional conversion engine:
    *   **PDF to:** DOCX, TXT, XLSX (Table Extraction).
    *   **DOCX to:** PDF (Mammoth+Pisa), TXT, XLSX.
    *   **XLSX/CSV to:** PDF (Styled HTML Tables), DOCX, CSV/XLSX.
    *   **TXT to:** PDF, DOCX, XLSX.

### 🎬 Video Suite (1 Tool)
1.  **Video Converter:** High-performance `FFmpeg` wrapper supporting batch transcoding between MP4, AVI, MOV, MKV, and high-quality GIF (using `palettegen` & `paletteuse`).

---

## 🔌 API Documentation (FastAPI)

| Endpoint | Method | Input Parameters | Purpose |
| :--- | :--- | :--- | :--- |
| `/health` | GET | None | System status & Engine info. |
| `/enhance-image`| POST | `file` (Image), `model_name`, `face_enhance` | AI 4K Upscaling & Face Fix. |
| `/remove-bg` | POST | `file` (Image) | AI Background Removal. |
| `/convert-video`| POST | `video` (File), `format` (Target) | High-speed Video Transcoding. |
| `/convert-doc` | POST | `document` (File), `format` (Target) | Multi-format Document Conversion. |
| `/contact` | POST | `message`, `name`, `email` | Resend API integrated contact form. |

---

## 🎨 Professional Design System

*   **UI Framework:** Tailwind CSS (Modern Glassmorphism aesthetics).
*   **Typography:** **Inter** (Google Fonts) with tight `tracking-tighter` for premium feel.
*   **Iconography:** Hybrid system using **Lucide Icons** and **Material Symbols Outlined**.
*   **Navigation:** Unified sidebar with global categories and a real-time searching system (`initSearch` & `initSidebarSearch`).
*   **Theme Engine:** LocalStorage-persisted Dark/Light mode manager (`theme.js`).

---

## 📁 Repository Organization

```text
FileToolkitPro/
├── index.html                   # Global Hub / Search Portal
├── tools/                       # Modular UI Components (10 separate HTML pages)
├── js/
│   ├── main.js                  # Global Orchestration (Search, Menu, Typewriter)
│   ├── theme.js                 # Theme Persistence Engine
│   ├── config.js                # Environment Constants
│   └── tools/                   # Isolated Business Logic per tool (JS)
├── css/
│   └── style.css                # Master Design Tokens & Glass Tokens
├── backend/
│   ├── app.py                   # FastAPI Master Node (Route handling & Cleanup)
│   ├── enhancer.py              # AI Singleton (RealESRGAN/GFPGAN)
│   └── weights/                 # Pre-trained AI Model Files (.pth)
└── README.md                    # This Encyclopedia
```

---

## 🚀 Future Roadmap & Scalability

1.  **WASM Migration:** Transitioning Background Removal to the client using ONNX Runtime for 100% privacy.
2.  **PWA Core:** Implementing a manifest and service worker for offline use.
3.  **Real-time Preview:** Live preview of PDF compression and image Enhancement before download.
4.  **Worker-Based UI:** Offloading heavy canvas math to Web Workers for 60FPS interaction.

---

> **Designed & Engineered with ❤️ by Mouzan Raza — Privacy-First File Tools.**
