const express = require("express");
const bodyParser = require('body-parser');
const fs = require("fs");
const path = require("path");
const app = express();
var cors = require("cors");
const UserRouter = require("./src/routes/userRouter");
const DriveRouter = require("./src/routes/driverRouter");
const CustomerRouter = require("./src/routes/customerRouter");
const GoodsRouter = require("./src/routes/goodsRouter");
const JobRouter = require("./src/routes/jobRouter");
const globalErrorHandler = require("./src/controllers/ErrorController");
const UploadRouter = require("./src/routes/uploadRouter");
const handlebars = require('handlebars');
const s3 = require("./src/utils/awsconfig");
const { blobHead, isBlobEnabled } = require("./src/utils/blob");

handlebars.registerHelper('serialNumber', function(index) {
    return index + 1;
  });

const uploadsPath = path.join(__dirname, "uploads");
// Local dev: serve from disk if present. On Vercel, this will fall through and our
// handler below will redirect to Blob/S3 if configured.
app.use("/uploads", express.static(uploadsPath));

// Fallback for production (Vercel): redirect /uploads/* to Blob (preferred) or S3.
app.get("/uploads/*", async (req, res) => {
  try {
    // Convert "/uploads/foo/bar.png" -> "uploads/foo/bar.png"
    const key = String(req.path || "").replace(/^\/+/, "");

    if (isBlobEnabled()) {
      const meta = await blobHead(key);
      if (meta && meta.url) return res.redirect(302, meta.url);
    }

    if (s3) {
      const url = s3.getSignedUrl("getObject", {
        Bucket: "witco",
        Key: key,
        Expires: 60,
      });
      return res.redirect(302, url);
    }

    return res.status(404).send("FILE NOT FOUND");
  } catch (e) {
    return res.status(404).send("FILE NOT FOUND");
  }
});
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(express.json());

app.use(cors({ origin: "*" }));
app.use('/api/v1/user',UserRouter);
app.use('/api/v1/customer',CustomerRouter);
app.use('/api/v1/driver',DriveRouter);
app.use('/api/v1/goods',GoodsRouter);
app.use("/api/v1/jobs", JobRouter);
app.use("/api/v1/upload", UploadRouter);
app.use(globalErrorHandler);
module.exports = app;
