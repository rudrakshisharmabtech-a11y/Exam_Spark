# ExamSpark — Examination & Smart Learning Platform

ExamSpark is a modern, unified examination platform for students, teachers, and administrators. It features examination prep & attempt flows, question banks, analytics, secure role-based authentication, Google OAuth, live Railway MySQL database persistence, and advanced AI study tools (Smart AI Summarizer & Chat with PDF).

---

## 📁 Project Architecture & Directory Structure

The project has been separated into dedicated `frontend` and `backend` directories:

```
project exam spark/
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/           # Reusable UI components, layout shell, dialogs
│   │   ├── pages/                # All application screens
│   │   │   ├── Marketing.tsx     # Landing page & feature showcase
│   │   │   ├── Auth.tsx          # Sign in, registration, Google OAuth button
│   │   │   ├── Student.tsx       # Student dashboard, tests, analysis, exam prep
│   │   │   ├── Learning.tsx      # Smart AI Summarizer & Chat with your PDF
│   │   │   ├── Attempt.tsx       # Real-time exam taking interface
│   │   │   ├── Results.tsx       # Detailed grading breakdown & explanations
│   │   │   ├── Teacher.tsx       # Exam creator, question bank, live analytics
│   │   │   └── Admin.tsx         # User management, system metrics & settings
│   │   ├── api.ts                # API client with OAuth helpers
│   │   ├── data.ts               # Sample exam, question & subject data
│   │   ├── state.ts              # Session & attempt state management
│   │   └── index.css             # Design system styling
│   ├── public/                   # Favicon & static assets
│   ├── index.html                # Vite entry HTML
│   ├── vite.config.ts            # Vite 6 config with API proxy to port 3001
│   ├── tsconfig.json             # TypeScript configuration
│   └── package.json              # Frontend modules and scripts
│
├── backend/                      # Node.js + Express + MySQL / Railway API
│   ├── index.js                  # Express API server entrypoint
│   ├── routes.js                 # API endpoints (exams, attempts, AI, admin)
│   ├── auth.js                   # JWT session cookies, bcrypt, Google OAuth
│   ├── db.js                     # Railway MySQL pool + local storage fallback
│   ├── ai.js                     # Smart AI Summarizer & PDF Question Answering
│   ├── schema.sql                # Complete SQL schema for Railway MySQL
│   ├── init-db.js                # Database table creator for Railway MySQL
│   ├── view-users.js             # Live database user & credentials viewer
│   ├── bootstrap-admin.js        # Script to create initial administrator
│   ├── railway.json              # 1-click Railway deployment specification
│   ├── Procfile                  # Process file for cloud hosting
│   ├── .env.example              # Environment variables template
│   └── package.json              # Backend modules and scripts
│
├── start-dev.js                  # Concurrent runner for frontend + backend
├── package.json                  # Root orchestration package.json
└── README.md                     # Documentation & setup guide
```

---

## 🚀 Quick Start (Run on Localhost)

### 1. Install Dependencies
Dependencies are already installed in both `frontend` and `backend`. If you ever need to re-install:
```bash
npm --prefix backend install
npm --prefix frontend install
```

### 2. Start Both Frontend and Backend
From the root directory:
```bash
npm run dev
```
This automatically starts:
- **Backend API**: `http://localhost:3001`
- **Frontend App**: `http://localhost:8443` (or `http://localhost:3000`)

Or run them individually:
```bash
# Terminal 1: Run Backend API
npm run server

# Terminal 2: Run Frontend UI
npm run client
```

---

## 🔐 Google OAuth Authentication

ExamSpark includes full Google OAuth support:
1. When user clicks the **"Continue with Google"** button on the Sign-In or Registration page:
   - If Google Cloud credentials (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`) are configured in `backend/.env`, it routes to official Google OAuth (`accounts.google.com`).
   - If credentials are not yet configured (during local testing), it seamlessly opens an authentic Google Account Selector where you can pick a test account or enter any Google email.
2. The user profile is created in the database and linked to `provider: 'google'`.
3. A secure HTTP-only JWT session cookie (`examspark_session`) is issued.

To connect live Google Cloud credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **Credentials**.
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Set **Authorized redirect URI** to: `http://localhost:3001/api/auth/google/callback` (or your live domain).
4. Paste the Client ID and Client Secret into `backend/.env`.

---

## 🗄️ Storing Credentials on a Live Database (Railway MySQL)

ExamSpark natively supports **Railway MySQL** as well as any live MySQL instance.

### Connecting to Railway:
1. Create a MySQL database on [Railway](https://railway.app/).
2. Copy your **MySQL Connection URL** (e.g. `mysql://root:password@roundhouse.proxy.rlwy.net:3306/railway`).
3. Open `backend/.env` and paste it into `DATABASE_URL`:
   ```env
   DATABASE_URL=mysql://root:password@roundhouse.proxy.rlwy.net:3306/railway
   ```
4. Run the database initializer to automatically create all tables:
   ```bash
   npm run init:db
   ```

### Viewing Stored Accounts in the Database:
To inspect all user accounts, bcrypt-hashed passwords, roll numbers, and timestamps stored in the live database:
```bash
npm run view:users
```
*(Or directly run: `node backend/view-users.js`)*

---

## 🧠 Advanced Features: Smart AI Summarizer & Chat with PDF

Located in the student workspace under **Study Hub** (`#/study`):

### 1. Smart AI Summarizer
- Paste any lecture transcript or study notes (or click *"Paste Sample Transcript"*).
- Optionally attach an audio file recording.
- Click **"Summarize with Smart AI"**.
- Generates:
  - 📚 **Executive Revision Summary**
  - 💡 **Core Takeaways & Highlights**
  - 🔑 **Key Terminology & Definitions**
  - ❓ **Self-Assessment Quiz** with answers

### 2. Chat with your PDF
- Upload any course PDF (e.g. syllabus, textbook chapter, lecture slides).
- Type a question (e.g. *"What is active transport?"* or *"Explain the cell cycle"*).
- The backend parses the PDF using `pdf-parse` and retrieves direct answers and citations from your document!

*Note: AI features work instantly out of the box using our built-in NLP engine! You can also connect OpenAI or Gemini by adding `AI_API_KEY=sk-...` in `backend/.env`.*

---

## 👥 Default Demo Credentials

For quick testing without creating a new account:

| Role | Email | Password |
| --- | --- | --- |
| **Student** | `maya.chen@demo.edu` | `Password123!` |
| **Teacher** | `elias.ford@demo.edu` | `Password123!` |
| **Administrator** | `nina.okafor@demo.edu` | `Password123!` |

You can also create brand-new accounts with any email and password at `#/register` or via Google Sign-In.
