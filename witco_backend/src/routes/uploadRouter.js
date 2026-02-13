const { imageuploader, getFile } = require("../controllers/UploadController");
const express = require("express");
const router = express.Router();

router.post("/image-add", imageuploader);
router.get("/file", getFile);

module.exports = router;
