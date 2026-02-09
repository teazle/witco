const express = require("express");
var https = require("https");
var http = require("http");
const dotenv = require("dotenv");
const path = require("path");
var fs = require("fs");

// Load env first so NODE_ENV and PORT are available
dotenv.config();

require("./src/db/mongoose");

let app = require("./app.js");
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

app.set("port", port);

if (isProduction) {
  // Production: serve built frontend and redirect HTTP → HTTPS
  app.use(express.static(path.join(__dirname, "dist")));
  app.use((req, res, next) => {
    if (req.protocol === "http") {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  const privateKey = fs.readFileSync("privkey.pem", { encoding: "utf8" });
  const certificate = fs.readFileSync("cert.pem", { encoding: "utf8" });
  const ca = fs.readFileSync("chain.pem", { encoding: "utf8" });
  const credentials = { key: privateKey, cert: certificate, ca: ca };
  const httpsServer = https.createServer(credentials, app);

  http.createServer(app).listen(80, () => {
    console.log("HTTP (redirect) on port 80");
  });
  httpsServer.listen(443, () => {
    console.log("HTTPS on port 443");
  });
} else {
  // Development: API only, single HTTP server (no SSL)
  app.listen(port, () => {
    console.log(`Dev server running on http://localhost:${port}`);
    console.log(`API base: http://localhost:${port}/api/v1/`);
  });
}