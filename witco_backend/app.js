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

handlebars.registerHelper('serialNumber', function(index) {
    return index + 1;
  });

const uploadsPath = path.join(__dirname, "uploads");
if (fs.existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
}
app.get('/uploads/pdfs/*', async (req, res) => {
  res.status(404).send("PDF NOT FOUND");
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
