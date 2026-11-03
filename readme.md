# CaptchaShield - Dynamic CAPTCHA Verification System 🛡️

A modern, production-ready, full-stack **CAPTCHA Generation & Verification System** built with **Node.js, Express, and `svg-captcha`**. Featuring a responsive interactive web frontend, developer playground, real-world protected form demo, and secure REST API with single-use session tokens and anti-replay protection.

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy on Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=black)](https://render.com)

---

## 📌 Highlights & Features

### 🎨 Modern Web Frontend
- **Interactive Playground**: Real-time generation of crisp, lossless SVG vector CAPTCHAs.
- **5 Challenge Modes**:
  - `Alphanumeric` (Letters & numbers with ambiguous characters filtered)
  - `Numeric` (Digits only)
  - `Alphabet` (A-Z characters)
  - `Math Puzzle` (e.g. `12 + 7 = ?`)
  - `Custom Text` (Enter custom words/codes)
- **Visual Distortion Studio**: Adjust character length, noise lines, background palettes, and multi-color vs. monochrome.
- **Accessibility & Spoken Audio**: Built-in speech synthesis (Web Speech API) reads out characters or math challenges.
- **Instant Actions**: One-click **Copy SVG code**, **Download SVG**, and **Session Countdown Timer**.
- **Developer Inspector**: Live inspection of server session ID, active expiry, and server-side verification answer.

### 🔒 Enterprise-Grade Security
- **Anti-Replay Attack Protection**: Single-use token consumption upon successful verification prevents re-use.
- **Brute-Force Rate Limiting**: Max 3 verification attempts per session before the challenge is invalidated.
- **Time-to-Live (TTL)**: Configurable session expiration (default: 5 minutes) with periodic garbage collection.
- **Zero Client Overhead**: Pure SVG vector rendering with no external font downloads or canvas bloat.

### 📝 Real-World Protected Form Demo
- Fully functional contact/inquiry form demonstrating real-world backend bot protection before processing submissions.

### 💻 Dual Interface
- **Web UI & REST API**: Start with `npm start` and visit `http://localhost:3000`.
- **Command Line Interface (CLI)**: Run terminal verification with `npm run cli` or `node index.js`.

---

## 🚀 Tech Stack

- **Backend**: Node.js, Express 5, CORS, native Crypto API
- **CAPTCHA Engine**: `svg-captcha` (vector paths, Bezier curves, noise lines)
- **Frontend**: Semantic HTML5, Modern CSS (Glassmorphism, CSS Variables, Flex/Grid), Vanilla JavaScript (ES6+)
- **Audio**: Web Speech API for accessibility

---

## 📂 Project Structure

```txt
Captcha-generator/
│
├── public/                     # Frontend Web Application
│   ├── index.html              # Main UI (Playground, Form Demo, API Docs, Deploy)
│   ├── style.css               # Modern responsive styling & animations
│   ├── app.js                  # Client logic, timer, speech audio, REST API calls
│   └── favicon.svg             # Shield vector favicon
│
├── index.js                    # Original CLI terminal verification script
├── server.js                   # Express REST API & static file web server
├── test-endpoints.js           # Automated integration test suite
├── package.json                # Project dependencies and run scripts
├── Procfile                    # Deployment configuration (Render / Railway / Heroku)
├── render.yaml                 # 1-Click Render blueprint
├── .gitignore                  # Git ignore rules
└── README.md                   # Project documentation
```

---

## ⚙️ Quick Start (Run Locally)

### 1. Clone Repository
```bash
git clone https://github.com/ParthL001/Captcha-Generator.git
cd Captcha-Generator
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Web Server & Frontend
```bash
npm start
```
Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**

### 4. Run CLI Version (Terminal Mode)
```bash
npm run cli
```

### 5. Run Automated Tests
```bash
npm test
```

---

## 🌐 1-Click Live Deployment Guide

The application is pre-configured for instant zero-downtime deployment on free cloud platforms:

### Option A: Render.com (Recommended - 100% Free)
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Add full-stack web frontend and REST API"
   git push origin main
   ```
2. Go to [Render.com](https://render.com) and click **New +** → **Web Service**.
3. Connect your `Captcha-Generator` repository.
4. Render auto-detects the settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click **Deploy Web Service** — your live link is generated in ~2 minutes!

### Option B: Railway.app
1. Go to [Railway.app](https://railway.app) and select **Deploy from GitHub repo**.
2. Railway detects `Procfile` and boots the service immediately.
3. In **Settings**, click **Generate Domain** to get a public URL.

---

## 📡 REST API Reference

### 1. Generate CAPTCHA
```http
POST /api/captcha/generate
```
**Request Body (Optional):**
```json
{
  "type": "alphanumeric",   // "alphanumeric" | "numeric" | "alphabet" | "math" | "custom"
  "size": 5,                // Length (3 to 8)
  "noise": 3,               // Distortion lines (0 to 10)
  "color": true,            // Multi-colored characters
  "background": "#f8fafc",  // Hex background color
  "ttl": 300                // Validity in seconds (default: 300)
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "id": "e9352e89-18c3-4d22-b91a-f761ba3b036c",
  "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" ... </svg>",
  "type": "alphanumeric",
  "expiresIn": 300,
  "expiresAt": "2026-11-03T23:30:00.000Z"
}
```

---

### 2. Verify Solution
```http
POST /api/captcha/verify
```
**Request Body (Required):**
```json
{
  "id": "e9352e89-18c3-4d22-b91a-f761ba3b036c",
  "answer": "8kX2p",
  "caseSensitive": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "CAPTCHA verified successfully!",
  "verifiedAt": "2026-11-03T23:28:14.515Z"
}
```

---

### 3. Server Health
```http
GET /api/health
```
Returns uptime, server timestamp, and count of active in-memory challenges.

---

## 💻 Developer Client Integration

### JavaScript / Fetch
```javascript
// Step 1: Request CAPTCHA
const res = await fetch('https://your-domain.com/api/captcha/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'alphanumeric', size: 5 })
});
const { id, svg } = await res.json();
document.getElementById('captchaBox').innerHTML = svg;

// Step 2: Verify user input
const verifyRes = await fetch('https://your-domain.com/api/captcha/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: id,
    answer: document.getElementById('captchaInput').value
  })
});
const result = await verifyRes.json();
if (result.success) {
  // Allow form submission
}
```

### Python
```python
import requests

API_URL = "https://your-domain.com"

# Generate
gen_res = requests.post(f"{API_URL}/api/captcha/generate", json={"type": "math"})
captcha = gen_res.json()

# Verify
answer = input("Solve math problem: ")
ver_res = requests.post(f"{API_URL}/api/captcha/verify", json={
    "id": captcha["id"],
    "answer": answer
})
print(ver_res.json())
```

---

## 👨‍💻 Author

**Parth Lokhande**  
- GitHub: [@ParthL001](https://github.com/ParthL001)  
- Repository: [Captcha-Generator](https://github.com/ParthL001/Captcha-Generator)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
