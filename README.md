# Witco

Full-stack app: **Angular** frontend + **Node/Express** backend (MongoDB, JWT, Twilio, AWS S3).

Monorepo: `witco_backend/` and `witco_frontend/` live in this single Git repo (root at `Witco/`).

## Git & remote

Repo is initialized at the monorepo root. To push to GitHub or GitLab:

1. Create a new repository (e.g. `witco` or `witco-app`). Do **not** initialize with a README if you already have one.
2. Add the remote and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/witco.git   # or your GitLab URL
git branch -M main
git push -u origin main
```

Use SSH if you prefer: `git@github.com:YOUR_USERNAME/witco.git`.

## What was missing to run in dev

- **Backend** was set up for production only (ports 80/443, SSL certs required). Dev mode is now added: when `NODE_ENV` is not `production`, the backend runs a single HTTP server on `PORT` (default 5000) with no SSL.
- **Environment variables** were not documented. Use `witco_backend/.env.example` as a template (copy to `.env` and fill in values).
- **Frontend proxy** was pointing at a hardcoded IP. It now points to `http://localhost:5000` for local development.

## Run in development

### 1. Backend

```bash
cd witco_backend
cp .env.example .env
# Edit .env: set at least DB (MongoDB URL) and JWT_SECRET_KEY
npm install
npm run dev
```

Backend will be at **http://localhost:5000** (API at `http://localhost:5000/api/v1/`).

### 2. Frontend

In another terminal:

```bash
cd witco_frontend
npm install
npm start
```

Frontend will be at **http://localhost:4200** and will proxy `/api/v1/*` to the backend.

### 3. What to put in `.env`

**Required:** `DB` (MongoDB connection string), `JWT_SECRET_KEY`.

**Optional:** Twilio (SMS/OTP) — see **`witco_backend/SETUP.md`** for exactly what to pass for MongoDB (cloud) and Twilio. AWS is no longer used; uploads use local storage (or you can add Vercel Blob later).

## Production

- Set `NODE_ENV=production`.
- Place SSL certs in `witco_backend/`: `privkey.pem`, `cert.pem`, `chain.pem`.
- Build the frontend: `cd witco_frontend && npm run build`.
- Copy `witco_frontend/dist/*` into `witco_backend/dist/` (or configure your deploy to serve the same app).
- Run the backend (e.g. `npm run prod`); it will listen on HTTP 80 (redirect) and HTTPS 443.

## Deploy to Vercel (monorepo: one repo, two projects)

Use **one GitHub repo** and create **two Vercel projects** (backend + frontend). Each project uses a different **Root Directory** so Vercel only builds and deploys that part.

### 1. Backend project

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. **Import** your Git repo (e.g. `teazle/witco`). Use the same repo for both projects.
3. **Root Directory:** click **Edit**, set to `witco_backend`, then **Continue**.
4. **Environment Variables** (add these in the project’s Settings → Environment Variables):
   - `DB` – MongoDB connection string (e.g. Atlas URI)
   - `JWT_SECRET_KEY` – secret for JWT
   - Optional: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_NUMBER` for SMS
5. **Deploy.** When it’s done, copy the backend URL (e.g. `https://witco-backend-xxx.vercel.app`). You need this for the frontend.

**Uploads:** The backend uses a local `uploads/` folder. On Vercel the filesystem is ephemeral, so uploads (signatures, photos) are not persisted. For production you’d store them in Vercel Blob or S3; until then they may not persist.

### 2. Frontend project

1. **Add New** → **Project** again and import the **same repo**.
2. **Root Directory:** set to `witco_frontend`, then **Continue**.
3. **Environment Variables:**
   - `NG_APP_API_URL` – set to your **backend URL** from step 1 (e.g. `https://witco-backend-xxx.vercel.app`). No trailing slash; the app adds `/api/v1` itself.
   - If the build fails with an OpenSSL error (Angular 8 on Node 18+), add `NODE_OPTIONS` = `--openssl-legacy-provider`.
4. **Deploy.** The frontend build runs `node scripts/set-env.js` (which reads `NG_APP_API_URL`) then builds; the app will call your backend API.

That’s it. Both projects will redeploy on every push to the repo (or on the branch you connected).

---

## Summary

| Item | Status |
|------|--------|
| Backend dev mode (HTTP, no SSL) | ✅ Added |
| `.env` / `.env.example` | ✅ Example added; create `.env` from it |
| Frontend proxy for local API | ✅ Points to localhost:3000 (see note below) |
| MongoDB + JWT required | ✅ Documented |
| Twilio / AWS optional | ✅ Documented |
| Vercel deploy (frontend + backend) | ✅ Documented |

**Note:** If ports 5000/5001 are in use (e.g. macOS AirPlay), run the backend on port 3000 and set the frontend proxy target in `witco_frontend/proxy.conf.json` to `http://localhost:3000`.

The code is runnable in dev once MongoDB is available and `.env` is set; optional services (Twilio, S3) are only needed for their features.
