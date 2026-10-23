# WatchTogether — Production Deployment Guide

This guide covers deploying the WatchTogether real-time platform to **Render** or **Railway**.

---

## 1. Architecture Overview

- **Frontend**: Static Site (Vite / React SPA)
- **Backend**: Persistent Web Service (Node.js LTS, WebSocket support, Express, Socket.IO)
- **Database**: Managed PostgreSQL
- **Cache / PubSub**: Managed Redis

---

## 2. Option A: Deploy on Render

### Step 1: Provision Managed PostgreSQL
1. In the Render Dashboard, click **New +** -> **PostgreSQL**.
2. Name: `watchtogether-postgres`.
3. Database: `watchtogether`, User: `postgres`.
4. Copy the **Internal Database URL** (e.g. `postgresql://postgres:...@dpg-...:5432/watchtogether`).

### Step 2: Provision Managed Redis
1. Click **New +** -> **Redis**.
2. Name: `watchtogether-redis`.
3. Copy the **Internal Redis URL** (e.g. `redis://red-...:6379`).

### Step 3: Deploy the Backend Web Service
1. Click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Root Directory: `server`.
4. Runtime: `Node`.
5. Build Command: `npm install && npm run build && npx prisma generate`.
6. Start Command: `npm start`.
7. Configure Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `4000`
   - `DATABASE_URL`: *(Paste Render PostgreSQL internal URL)*
   - `REDIS_URL`: *(Paste Render Redis internal URL)*
   - `FRONTEND_ORIGIN`: `https://your-frontend-app.onrender.com`
   - `SESSION_SECRET`: `your_random_32_character_cryptographic_secret`
   - `COOKIE_SECURE`: `true`
   - `LOG_LEVEL`: `info`
8. Set Health Check Path to `/health/live`.
9. Deploy service and copy its public URL (e.g. `https://watchtogether-api.onrender.com`).

### Step 4: Deploy the Frontend Static Site
1. Click **New +** -> **Static Site**.
2. Root Directory: `client`.
3. Build Command: `npm install && npm run build`.
4. Publish Directory: `dist`.
5. Environment Variables:
   - `VITE_API_BASE_URL`: `https://watchtogether-api.onrender.com`
6. Add Rewrite Rule:
   - Source: `/*` -> Destination: `/index.html` (Status: 200 Rewrite for SPA routing).
7. Update the backend's `FRONTEND_ORIGIN` environment variable with your actual frontend URL.

---

## 3. Option B: Deploy on Railway

1. Install Railway CLI or use the Railway Dashboard.
2. Run `railway init`.
3. Add **PostgreSQL** plugin from Railway templates.
4. Add **Redis** plugin from Railway templates.
5. Deploy Backend Service:
   - Root Directory: `server`
   - Build Command: `npm install && npm run build && npx prisma generate`
   - Start Command: `node dist/server.js`
   - Link `DATABASE_URL` and `REDIS_URL` from the plugins.
6. Deploy Frontend Service:
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s dist -l 3000`
   - Configure `VITE_API_BASE_URL` to point to the backend Railway URL.

---

## 4. Verification Checklist

- [ ] Backend health checks return `200 OK` at `/health/live` and `/health/ready`.
- [ ] Frontend loads and displays the Landing Page with live hero preview.
- [ ] Room creation generates a 6-character room code and assigns the creator as Host.
- [ ] Second client joins with room code and receives Participant role.
- [ ] Play, pause, seek, and video changes synchronize in real time.
- [ ] Participant commands are rejected by the server; action request queue functions.
- [ ] Host approves request; playback transition executes and updates both clients.
- [ ] Reconnecting a disconnected socket restores authoritative playback state without corruption.
