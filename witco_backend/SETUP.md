# What you need to pass (env vars)

Put these in **`.env`** in `witco_backend/`. Copy from `.env.example` and fill in.

---

## 1. MongoDB (cloud) – **required**

You need **one value**: the **connection string (URI)**.

- **Where to get it**
  - **MongoDB Atlas**: Log in → your cluster → **Connect** → **Drivers** (or “Connect your application”) → copy the **connection string**.
  - It looks like:
    - `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority`
  - Replace `<username>`, `<password>`, and optionally `<dbname>` with your real values. If the password has special characters, URL-encode them.

- **What to put in `.env`**
  ```env
  DB=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/witco?retryWrites=true&w=majority
  ```
  That’s it. No need to pass anything else for MongoDB.

---

## 2. Twilio (SMS / OTP) – **optional**

If you want SMS (OTP, driver notifications), you need **three values** from the Twilio console.

- **Where to get them**
  1. Log in at [twilio.com/console](https://console.twilio.com).
  2. **Account SID** and **Auth Token**: Dashboard (home) or **Account** → **API keys & tokens**.
  3. **Phone number**: **Phone Numbers** → **Manage** → **Active numbers** (or buy a number). Use the number in E.164 form, e.g. `+1234567890`.

- **What to put in `.env`**
  ```env
  TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_AUTH_TOKEN=your_auth_token_here
  TWILIO_NUMBER=+1234567890
  ```
  If you leave these out, the app still runs; SMS features are just skipped.

---

## 3. AWS – **not used anymore**

AWS/S3 has been made **optional**. The app no longer requires AWS.

- **You don’t need to pass any AWS keys.**
- Uploads (signatures, proof images, invoice PDFs) use **local storage** (`witco_backend/uploads/` and `witco_backend/docs/`) when AWS is not configured.
- For production on **Vercel**, you can later add **Vercel Blob** (or another storage) and we can wire uploads to that; no AWS is needed.

---

## Summary

| Service   | What you need to pass                          | Where it goes in `.env` |
|----------|--------------------------------------------------|--------------------------|
| MongoDB  | Connection string (URI) from Atlas/cloud         | `DB=...`                 |
| Twilio   | Account SID, Auth Token, Twilio phone number    | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_NUMBER` |
| AWS      | Nothing                                         | Omit; app works without  |

You only **must** pass **MongoDB** (`DB`) (and `JWT_SECRET_KEY`) to run the app. Twilio and AWS are optional.
