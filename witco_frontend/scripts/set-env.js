/**
 * Writes environment.prod.ts with apiUrl from env (for Vercel/build).
 * Set NG_APP_API_URL to your backend URL (e.g. https://witco-api.vercel.app).
 */
const fs = require("fs");
const path = require("path");

const rawApiUrl =
  process.env.NG_APP_API_URL ||
  process.env.VERCEL_APP_API_URL ||
  "https://YOUR_BACKEND_VERCEL_URL";

// Avoid accidental double slashes when the app appends paths like `/api/v1`.
const apiUrl = String(rawApiUrl).replace(/\/+$/, "");

const content = `export const environment = {
  production: true,
  /** Replace with your backend Vercel URL (e.g. https://witco-api.vercel.app) before deploy. */
  apiUrl: '${String(apiUrl).replace(/'/g, "\\'")}'
};
`;

const outPath = path.join(__dirname, "..", "src", "environments", "environment.prod.ts");
fs.writeFileSync(outPath, content, "utf8");
console.log("Set environment.prod.apiUrl to:", apiUrl);
