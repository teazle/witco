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

## Deploy to Vercel (frontend + backend)

You can deploy both the frontend and the backend as two separate Vercel projects.

### 1. Deploy the backend

1. In Vercel, create a **new project** and import your repo.
2. Set **Root Directory** to `witco_backend`.
3. Add **Environment Variables** (Settings → Environment Variables):
   - `DB` – MongoDB connection string (e.g. Atlas URI)
   - `JWT_SECRET_KEY` – secret for JWT
   - Optional: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_NUMBER` for SMS/OTP
4. Deploy. Note the backend URL (e.g. `https://witco-backend-xxx.vercel.app`).

**Uploads on Vercel:** The backend uses a local `uploads/` folder for signatures and photos. On Vercel the filesystem is ephemeral, so uploaded files are not persisted. For production you will need to store uploads in external storage (e.g. Vercel Blob or S3) and adapt the upload controller; until then, delivery signatures/photos may not persist across requests.

### 2. Deploy the frontend

1. In **`witco_frontend/src/environments/environment.prod.ts`**, set `apiUrl` to your backend Vercel URL (e.g. `https://witco-backend-xxx.vercel.app`). Do not add `/api/v1` — the app appends that.
2. In Vercel, create another **new project** and import the same repo.
3. Set **Root Directory** to `witco_frontend`.
4. Build and output are configured in `vercel.json` (production build, output `dist`). If the build fails with an OpenSSL-related error (common with Angular 8 on Node 18+), add an environment variable `NODE_OPTIONS` = `--openssl-legacy-provider` in the Vercel project settings. Deploy.

The frontend will call your backend at `apiUrl + '/api/v1/...'`.

### 3. Optional: single repo, two projects

If your repo is a monorepo at the root (e.g. `Witco/` with `witco_backend/` and `witco_frontend/`), add both projects in Vercel and set each project’s Root Directory to the corresponding folder.

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
