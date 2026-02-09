/**
 * Vercel serverless entry: load DB and export Express app.
 * Do not use server.js on Vercel (it starts HTTP/HTTPS servers).
 */
require("dotenv").config();
require("./src/db/mongoose");
const app = require("./app");
module.exports = app;
