# SilentDrop 🧠💻

[![CI](https://github.com/AdarshhCodes/SilentDrop/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/AdarshhCodes/SilentDrop/actions/workflows/ci.yml)

*A mindful developer burnout & work-pattern analyzer*


SilentDrop is a full-stack web application that analyzes a developer’s GitHub activity to surface **work patterns, burnout risk, and behavioral trends** — without judgment.

Instead of tracking productivity, SilentDrop focuses on **sustainability**:
when you work, how often you push late nights or weekends, and whether your recent rhythm signals strain.

---

## ✨ Features

### 🔐 Authentication

* GitHub OAuth login
* Secure JWT-based authentication
* Session-safe, stateless backend

### 📊 Dashboard

* Daily burnout risk meter
* Total commits for the day
* Human-readable insights (Healthy / Pushing Hard / High Strain)

### 🕒 Work Patterns

* Late-night vs daytime activity
* Weekend work detection
* **Hourly activity heatmap (IST-normalized)**
* Most active working hour with confidence indicator

### 📈 Trends

* Burnout risk direction (Improving / Stable / Worsening)
* Lightweight animated activity bars
* Derived trends without over-persisting user data

### 🧘 Reflection

* Gentle, context-aware reflection prompts
* Encourages awareness instead of pressure
* Zero gamification, zero judgment

---

## 🧱 Tech Stack

### Frontend

* React + Vite
* Tailwind CSS
* React Router
* Axios
* Fully responsive (mobile, tablet, desktop)

### Backend

* Node.js + Express
* GitHub REST API
* JWT authentication
* MongoDB (Mongoose)
* Render deployment

### Infrastructure

* Frontend: Render/Vercel
* Backend: Render
* Database: MongoDB Atlas

---

## 🧠 Core Design Principles

* **No productivity scoring**
* **No invasive tracking**
* **Derived insights over raw surveillance**
* **Fast, readable UI**
* **Minimal data persistence**
* **Respect developer mental health**

SilentDrop does not judge how much you work —
it reflects *how* you’ve been working lately.

---

## 🚀 Getting Started (Local)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/silentdrop.git
cd silentdrop
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_TOKEN=optional_personal_access_token
```

Run backend:

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔄 Data Flow Overview

```
GitHub API
   ↓
Backend Analysis Layer
   ↓
Derived Metrics (patterns, risk)
   ↓
Frontend Visualization
```

* No raw commit history is stored permanently
* Most insights are calculated on demand
* Optional daily snapshots used only for trend direction

---

## ⚡ Performance Notes

* API calls are cached where safe
* Pages load independently (fault-tolerant)
* No blocking cross-page dependencies
* Optimized for cold starts on free tiers

---

## 🛣️ Roadmap (Future Ideas)

* Weekly summaries
* Personal reflection notes
* Optional email nudges
* Time-zone awareness per user
* Privacy-first export (PDF / CSV)

---

## 📄 License

MIT License
Free to use, modify, and learn from.

---

## 🙌 Author

Built by **Adarsh Singh**
Focused on learning full-stack systems, thoughtful UX, and developer well-being.


