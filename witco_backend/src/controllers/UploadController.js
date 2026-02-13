const catchAsync = require("../utils/catchAsync");
const Job = require("../models/jobModel");
require("dotenv/config");
const fs = require("fs");
const path = require("path");
const AppError = require("../utils/AppError");

const s3 = require("../utils/awsconfig");
const { blobHead, blobPut, isBlobEnabled } = require("../utils/blob");

async function uploadImage(base64String, pathname, mime) {
  const fileName = path.basename(pathname);
  const base64Data = base64String.replace(
    /^data:image\/(png|jpeg|jpg);base64,/,
    ""
  );
  const buffer = Buffer.from(base64Data, "base64");

  if (isBlobEnabled()) {
    await blobPut(pathname, buffer, `image/${mime}`);
    return { provider: "vercel-blob", pathname };
  }

  if (s3) {
    const params = {
      Bucket: "witco",
      Key: pathname,
      Body: buffer,
      ACL: "public-read-write",
      ContentType: `image/${mime}`,
    };
    s3.putObject(params, (err, data) => {
      if (err) console.error("Error uploading image to S3:", err);
      else console.log("Image uploaded to S3 successfully:", data);
    });
    return { provider: "s3", pathname };
  } else {
    const localUploadPath = path.join(__dirname, "..", "..", pathname);
    const uploadsDir = path.dirname(localUploadPath);
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFile(path.join(uploadsDir, fileName), buffer, (err) => {
      if (err) console.error("Error saving image locally:", err);
      else console.log("Image saved locally:", fileName);
    });
    return { provider: "local", pathname };
  }
}

function getProofImages(job) {
  const photos = [];
  if (Array.isArray(job.photo_proof_images)) {
    photos.push(...job.photo_proof_images.filter(Boolean));
  }
  if (!photos.length && job.photo_proof) {
    photos.push(job.photo_proof);
  }
  return photos;
}

exports.imageuploader = catchAsync(async (req, res) => {
  const type = req.body.type;
  if (!["sign", "proof"].includes(type)) {
    throw new AppError("Invalid upload type", 400);
  }
  if (!req.body.base64) {
    throw new AppError("Image payload missing", 400);
  }
    const job = await Job.findOne({ _id: req.body.id });
    if (!job) {
      throw new AppError("Job not found", 400);
    }

    const mime = type === "sign" ? "png" : "jpeg";
    let pathname;
    if (type === "sign") {
      pathname = `uploads/sign-${job.do_number}.png`;
    } else {
      const proofImages = getProofImages(job);
      const proofIndex = proofImages.length + 1;
      pathname = `uploads/proof-${job.do_number}-${proofIndex}.jpeg`;
    }

    const result = await uploadImage(req.body.base64, pathname, mime);
    if(type==="sign"){
       job.sign = pathname;
    }else{
      const proofImages = getProofImages(job);
      proofImages.push(pathname);
      job.photo_proof_images = proofImages;
      if (!job.photo_proof) {
        job.photo_proof = proofImages[0];
      }
    }
    await job.save();
    res.status(201).json({message:"done", storage: result});
  });

exports.getFile = catchAsync(async (req, res) => {
  const rawPath = String(req.query.path || "").trim();
  const normalizedPath = path.posix.normalize(rawPath.replace(/^\/+/, ""));

  if (!normalizedPath || !normalizedPath.startsWith("uploads/")) {
    throw new AppError("Invalid file path", 400);
  }

  if (isBlobEnabled()) {
    const meta = await blobHead(normalizedPath);
    if (meta && meta.url) {
      return res.redirect(302, meta.url);
    }
  }

  if (s3) {
    const signedUrl = s3.getSignedUrl("getObject", {
      Bucket: "witco",
      Key: normalizedPath,
      Expires: 60,
    });
    return res.redirect(302, signedUrl);
  }

  const localFilePath = path.join(__dirname, "..", "..", normalizedPath);
  if (!fs.existsSync(localFilePath)) {
    throw new AppError("File not found", 404);
  }
  return res.sendFile(localFilePath);
});

