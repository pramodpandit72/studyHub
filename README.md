# viMeet — Production-Ready MERN Meeting & Learning Platform

viMeet is a lightweight, responsive online meeting and virtual classroom platform inspired by the simplicity and practical workflow of educational tools like CodeTantra. It combines session scheduling, WebRTC-powered meetings, attendance tracking, and host moderation with a clean, low-overhead UI.

---

## Features

- **Multi-step Signup Onboarding**:
  - Step 1: Basic Information (Name, Mobile, Age)
  - Step 2: Role & Academic Information (Role, Target Examination/Study, Institution, Experience)
  - Step 3: Account Security (Password)
  - Step 4: 4-Digit Mobile OTP Verification (with retry protection and countdown)
- **Passwordless Mobile OTP Login**:
  - 10-digit mobile number + 4-digit OTP
  - OTP expiration & resend cooldown
  - Rate limiting & brute-force protection
- **Lightweight WebRTC Video & Audio**:
  - Peer-to-peer media mesh ideal for small classrooms and mentoring groups
  - Local microphone & camera controls
  - Screen sharing
  - Fallback avatar cards when camera is disabled
  - In-meeting text chat with timestamps
  - Real-time participant drawer with mic/camera indicators
- **Host Moderation**:
  - Remote mute participants
  - Remove participants from active session
  - End meeting for all attendees
  - Waiting room enforcement
- **Automated Attendance Tracking**:
  - Automatic timestamping on join and leave
  - Exact duration calculation (minutes)
  - Attendance metrics: Present, Late, Left Early, Average Duration
  - Host session view & personal user attendance history
- **Theme System**:
  - Default Light Mode & Dark Mode
  - Persisted in `localStorage`
  - Zero hardcoded colors; centralized CSS design tokens

---

## Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS v4.3** with CSS variable design tokens
- **React Router v6** (with lazy loading and code splitting)
- **Axios** with JWT interceptors
- **Socket.IO Client** for signaling & chat
- **WebRTC APIs** for video/audio streams
- **Lucide React** for lightweight icons

### Backend
- **Node.js** & **Express.js** (Native ES Modules `"type": "module"`)
- **MongoDB** with Mongoose ORM
- **Socket.IO** for room signaling and chat
- **JWT** (JSON Web Tokens) & **bcryptjs**
- **Helmet**, **CORS**, **compression**, & **express-rate-limit**
- **dotenv** for environment configuration

---

## Project Structure

```text
viMeet/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js, env.js
│   │   ├── controllers/     # auth, user, meeting, attendance controllers
│   │   ├── middleware/      # auth, error, rateLimit middleware
│   │   ├── models/          # User, Meeting, Attendance, Otp schemas
│   │   ├── routes/          # auth, user, meeting, attendance routes
│   │   ├── services/        # otp, meeting, attendance services
│   │   ├── socket/          # meeting.socket.js
│   │   ├── utils/           # generateCode.js, response.js
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server bootstrap & Socket.IO
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # common, layout, meeting
│   │   ├── context/         # AuthContext, ThemeContext, ToastContext
│   │   ├── hooks/           # useWebRTC.js
│   │   ├── pages/           # Landing, Login, Signup, Dashboard, Meetings,
│   │   │                    # CreateMeeting, JoinMeeting, MeetingRoom,
│   │   │                    # Attendance, Profile, NotFound
│   │   ├── services/        # api.js, auth.api.js, meeting.api.js, socket.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── vercel.json
│   └── package.json
│
├── render.yaml
└── README.md
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/vimeet
JWT_SECRET=your_jwt_secret_key_change_in_production
CLIENT_URL=http://localhost:5173
OTP_PROVIDER=development
OTP_API_KEY=
NODE_ENV=development
```

> **Note for Local Development:** When `OTP_PROVIDER=development`, the generated 4-digit OTP is logged to the server console and returned in the API response with a quick "Auto-Fill" button in the UI for effortless testing.

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Local Development Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally or a MongoDB Atlas URI

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The backend server runs on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server runs on `http://localhost:5173`.

---

## Production Deployment

### Frontend (Vercel)
1. Push project to GitHub.
2. In Vercel, set root directory to `frontend`.
3. Set environment variables:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://your-backend.onrender.com`
4. The included [vercel.json](file:///d:/viMeet/frontend/vercel.json) handles SPA route rewrites automatically.

### Backend (Render)
1. In Render, create a new Web Service pointing to your repository.
2. Root directory: `backend`.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Set environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render default)
   - `MONGO_URI`: `your_mongodb_atlas_connection_string`
   - `JWT_SECRET`: `your_secure_production_secret`
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
   - `OTP_PROVIDER`: `development` or your SMS provider
