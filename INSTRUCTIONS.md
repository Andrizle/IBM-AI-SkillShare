# Hearthside — Setup & Run Instructions

## Prerequisites

- **Node.js v20 or higher** — download at https://nodejs.org
- **IBM WatsonX account** — for AI analysis (free tier available at https://dataplatform.cloud.ibm.com)

---

## 1. Install dependencies

Open a terminal in the project folder and run:

```
npm install
```

---

## 2. Configure environment variables

Copy `.env.example` to `.env`:

```
cp .env.example .env
```

Then open `.env` and fill in the required values:

| Variable | Where to find it | Required |
|---|---|---|
| `WATSONX_API_KEY` | IBM Cloud → Manage → API Keys | Yes |
| `WATSONX_PROJECT_ID` | WatsonX project → Manage tab → General | Yes |
| `WATSONX_MODEL_ID` | Any model ID from WatsonX model library (e.g. `ibm/granite-3-8b-instruct`) | Yes |
| `WATSONX_URL` | Leave as default unless your region differs | No |
| `VAPID_PUBLIC_KEY` | Generate with the command below | For push notifications |
| `VAPID_PRIVATE_KEY` | Generate with the command below | For push notifications |
| `VAPID_CONTACT` | Your email address | For push notifications |

### Generating VAPID keys (push notifications)

Run this once in your terminal:

```
node -e "const wp = require('web-push'); const k = wp.generateVAPIDKeys(); console.log('VAPID_PUBLIC_KEY=' + k.publicKey); console.log('VAPID_PRIVATE_KEY=' + k.privateKey);"
```

Copy the two lines it prints into your `.env` file.

---

## 3. Run the application

You need **two terminals open at the same time**.

**Terminal 1 — Backend (Express + SQLite + WatsonX)**
```
npm run server
```
Runs on http://localhost:3000

**Terminal 2 — Frontend (React + Vite)**
```
npm run dev
```
Runs on http://localhost:8080

Open **http://localhost:8080** in your browser.

---

## 4. Using the app

### Landing page (`/`)
The home page explains the product. Click **Open app** or **Go to my medications** to enter the dashboard.

### Dashboard (`/dashboard`)

**Medications tab**
- Add, edit, or remove medications using the buttons on each card
- Each medication has a name, dosage, one or more scheduled times, and optional notes
- Use the **Taken at [time]** buttons to quickly log a dose from this view

**Today tab**
- Shows every dose scheduled for today sorted by time
- Press **Taken** or **Missed** on each dose — it will dim and move to the bottom
- If you made a mistake, press the other button to correct it

**AI Insights tab**
- Press **Run analysis** to ask WatsonX to analyse the past 7 days of dose logs
- The AI returns a summary of adherence patterns and any recommended schedule changes
- Analysis also runs automatically every Sunday at 2:00 AM

**Alerts tab**
- Click **Enable notifications** to subscribe your browser to push reminders
- The backend checks every minute and sends a push notification when a dose is due
- Use **Send test** to verify notifications are working
- Notifications appear even when the browser tab is closed (service worker)

---

## 5. Project structure

```
src/              React frontend (TypeScript)
  pages/          Dashboard and landing page
  components/     UI components (shadcn/ui)
  lib/            API client and utilities
  hooks/          React hooks

server/           Express backend (Node.js)
  index.cjs       Entry point
  app.cjs         Express setup and middleware
  db.cjs          SQLite database schema
  routes/         API endpoints
  services/       WatsonX AI, push notifications, cron scheduler

public/           Static files served by Vite
  sw.js           Service worker for push notifications

data/             SQLite database file (auto-created on first run)
.env              Environment variables (never commit this file)
```

---

## 6. API endpoints (for reference)

| Method | Path | Description |
|---|---|---|
| GET | `/api/medications` | List all active medications |
| POST | `/api/medications` | Add a medication |
| PUT | `/api/medications/:id` | Update a medication |
| DELETE | `/api/medications/:id` | Remove a medication |
| POST | `/api/medications/:id/log` | Log a dose (taken / missed / pending) |
| GET | `/api/ai/analyses` | Get saved AI analyses |
| POST | `/api/ai/analyse` | Trigger an AI analysis now |
| GET | `/api/notifications/vapid-public-key` | Get the VAPID public key |
| POST | `/api/notifications/subscribe` | Subscribe to push notifications |
| POST | `/api/notifications/test` | Send a test push notification |
| GET | `/health` | Server health check |
