# StudyHub — Production-Ready MERN Meeting & Learning Platform

StudyHub is a lightweight, responsive online meeting and virtual classroom platform inspired by the simplicity and practical workflow of educational tools like CodeTantra. It combines session scheduling, WebRTC-powered meetings, attendance tracking, and host moderation with a clean, low-overhead UI.

---

## Features

- **Multi-step Signup with Email OTP Verification**:
  - Step 1: Personal Details (Full Name, Email Address [required], Mobile Number [required], Age [required])
  - Step 2: Role & Learning Profile (Role, What the user is studying/preparing for, Institution, Experience Level)
  - Step 3: Account Security (Password, Confirm Password)
  - Step 4: Email OTP Verification (4-digit OTP sent to email via EmailJS with resend cooldown and 10-minute expiry)
  - Account creation only completes once OTP is verified, followed by clean redirect to Login
- **Email + Password Login**:
  - Email + Password authentication with bcrypt hashing and JWT tokens (OTP is only for email verification during signup)
  - Direct `[Forgot Password?]` recovery navigation
- **Secure Password Recovery via EmailJS**:
  - Enter registered email address
  - Backend generates secure, expiring 6-digit reset code (15-minute validity, rate-limited)
  - Reset email sent using **EmailJS**
  - Verify code & set new password with confirmation
  - Seamless redirection back to Login
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
  - High-contrast Light Mode & Dark Mode with toggles on every page
  - Persisted in `localStorage`
  - Clean black & white / neutral grayscale color system

---

## Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS v4** with design tokens
- **React Router v6** (lazy loaded routes and protected routes)
- **EmailJS Browser SDK** (`@emailjs/browser`)
- **Axios** with JWT authorization interceptors
- **Socket.IO Client** for signaling & chat
- **WebRTC APIs** for video/audio streams
- **Lucide React** for icons

### Backend
- **Node.js** & **Express.js** (Native ES Modules `"type": "module"`)
- **MongoDB** with Mongoose ORM
- **Socket.IO** for room signaling and chat
- **EmailJS REST API** for password recovery email delivery
- **JWT** (JSON Web Tokens) & **bcryptjs**
- **Helmet**, **CORS**, **compression**, & **express-rate-limit**
- **dotenv** for environment configuration

---

## Project Structure

```text
StudyHub/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js, env.js
│   │   ├── controllers/     # auth, user, meeting, attendance, feedback controllers
│   │   ├── middleware/      # auth, error, rateLimit middleware
│   │   ├── models/          # User, Meeting, Attendance, Feedback schemas
│   │   ├── routes/          # auth, user, meeting, attendance, feedback routes
│   │   ├── services/        # email, meeting, attendance services
│   │   ├── socket/          # meeting.socket.js
│   │   ├── utils/           # generateCode.js, response.js
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server bootstrap & Socket.IO
│   ├── test-suite.js        # Automated integration test suite
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # common, forms, layout, meeting
│   │   ├── context/         # AuthContext, ThemeContext, ToastContext
│   │   ├── hooks/           # useWebRTC.js
│   │   ├── pages/           # Landing, Login, Signup, ForgotPassword, Dashboard,
│   │   │                    # Meetings, CreateMeeting, JoinMeeting, MeetingRoom,
│   │   │                    # Attendance, Profile, Feedback, NotFound
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
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/?appName=Cluster0
JWT_SECRET=your_jwt_secret_key_change_in_production
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# EmailJS Configuration (Password Recovery)
EMAILJS_SERVICE_ID=service_xxxxxxx
EMAILJS_TEMPLATE_ID=template_xxxxxxx
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_access_token
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# EmailJS Public Configuration
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key
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

To run backend automated tests:
```bash
npm test
```

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
   - `VITE_EMAILJS_SERVICE_ID`: `service_xxxxxxx`
   - `VITE_EMAILJS_TEMPLATE_ID`: `template_xxxxxxx`
   - `VITE_EMAILJS_PUBLIC_KEY`: `your_public_key`
4. The included `vercel.json` handles SPA route rewrites automatically.

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
   - `EMAILJS_SERVICE_ID`: `service_xxxxxxx`
   - `EMAILJS_TEMPLATE_ID`: `template_xxxxxxx`
   - `EMAILJS_PUBLIC_KEY`: `your_public_key`
   - `EMAILJS_PRIVATE_KEY`: `your_private_access_token`

---

## Technical SEO & Google Search Console Guide

StudyHub comes pre-configured with production-ready, white-hat Technical SEO:

- **Robots Configuration**: `robots.txt` allowing public indexable pages (`/`, `/login`, `/signup`, `/forgot-password`, `/feedback`) and disallowing private app dashboards and meeting rooms.
- **Sitemap**: Canonical `sitemap.xml` at `https://studyhub.online/sitemap.xml`.
- **Structured Data**: Semantic JSON-LD schema (`WebSite`, `Organization`, and `SoftwareApplication`) embedded directly in HTML.
- **Open Graph & Twitter**: Complete metadata with high-resolution 1200x630 social share card (`studyhub-og.png`).
- **Noindex Protection**: Protected app routes (`/dashboard`, `/profile`, `/attendance`, `/meetings/*`, `/join/*`) automatically emit `<meta name="robots" content="noindex, nofollow" />`.

### How to Connect StudyHub to Google Search Console (GSC)

1. **Add Property**:
   - Open [Google Search Console](https://search.google.com/search-console).
   - Click **Add property**.
   - Choose **Domain** property and enter `studyhub.online` (covers both `studyhub.online` and `www.studyhub.online`), OR choose **URL prefix** and enter `https://studyhub.online`.

2. **Verify Ownership**:
   - **DNS TXT Record (Recommended for Domain Property)**: Copy the `google-site-verification=...` string from Google Search Console, go to your domain registrar DNS settings (Hostinger, GoDaddy, Cloudflare, Namecheap, etc.), and add a `TXT` record for `@` with that verification token.
   - **HTML Tag (Alternative for URL Prefix)**: Add the verification meta tag `<meta name="google-site-verification" content="YOUR_TOKEN" />` into `frontend/index.html` head section and redeploy.
   - Click **Verify** in Google Search Console.

3. **Submit the XML Sitemap**:
   - In the left sidebar of Google Search Console, click **Sitemaps** under *Indexing*.
   - In the *Add a new sitemap* input box, enter: `sitemap.xml`.
   - Click **Submit**. Google will queue `https://studyhub.online/sitemap.xml` for crawling.

4. **URL Inspection**:
   - Use the top search bar (**Inspect any URL in "studyhub.online"**) to test `https://studyhub.online`.
   - Click **Test Live URL** to confirm that Googlebot can retrieve the page, render HTML, read metadata, and extract the JSON-LD structured data without crawl-blocking issues.
   - Click **Request Indexing** to submit the fresh page for indexing.

5. **Monitoring Indexing & Core Web Vitals**:
   - **Page Indexing**: Check the *Pages* report periodically to see which public URLs have been indexed and verify that no private routes are accidentally included.
   - **Core Web Vitals**: Monitor Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS) under the *Experience* tab.

