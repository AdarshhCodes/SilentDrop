# 🌧️ SilentDrop

SilentDrop is a calm, developer-focused web application that analyzes GitHub activity to **detect early signs of burnout** — without notifications, pressure, or judgment.

Burnout doesn’t shout.  
**It drops silently.**

---

## ✨ Features

- 🔐 **GitHub OAuth Login** (read-only access)
- 📊 **Burnout Risk Meter** based on commit patterns
- 🌙 **Late-Night Coding Detection**
- 📆 **Weekend Work Analysis**
- 📈 **Burnout Trends Over Time**
- 🧠 **Reflection & Well-Being Insights**
- 🌓 **Light / Dark Mode**
- 📱 **Fully Responsive UI (Mobile + Desktop)**

---

## 🧠 How It Works

SilentDrop analyzes:
- commit timing (late nights, weekends)
- work rhythm consistency
- frequency and patterns over time

From this, it calculates a **burnout risk score** and presents insights in a **calm, non-alarming dashboard**.

No alerts.  
No productivity pressure.  
Just awareness.

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express
- Passport.js (GitHub OAuth)
- MongoDB + Mongoose
- JWT TOKENS

---

## 🔐 Authentication

- Uses **GitHub OAuth**
- **Read-only** access (no posting, no writing)
- Sessions handled securely
- Logout fully clears session & cookies

---

## 📱 Responsiveness

SilentDrop is fully responsive:
- Mobile phones
- Tablets
- Desktops



## 🚀 Getting Started (Local Setup)

### 1️⃣ Clone the repository
```bash
git clone https://github.com/<your-username>/SilentDrop.git
cd SilentDrop


### 2️⃣Install dependencies
# backend
cd backend
npm install

# frontend
cd ../frontend
npm install

### 3️⃣ Environment Variables
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
SESSION_SECRET=your_session_secret
MONGODB_URI=your_mongodb_uri

### 4️⃣ Run the app

# backend
cd backend
npm run dev

# frontend (new terminal)
cd frontend
npm run dev
