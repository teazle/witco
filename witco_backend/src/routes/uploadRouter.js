const { imageuploader } = require("../controllers/UploadController");
const express = require("express");
const router = express.Router();

router.post("/image-add", imageuploader);

module.exports = router;