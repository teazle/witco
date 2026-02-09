const catchAsync = require("../utils/catchAsync");
const Job = require("../models/jobModel");
require("dotenv/config");
const fs = require("fs");
const path = require("path");
const AppError = require("../utils/AppError");

const s3 = require("../utils/awsconfig");
const { blobPut, isBlobEnabled } = require("../utils/blob");

async function uploadImage(base64String, do_num, type) {
  let mime = "png";
  if (type === "proof") mime = "jpeg";
  const fileName = `${type}-${do_num}.${mime}`;
  const pathname = `uploads/${fileName}`;
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
    const uploadsDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFile(path.join(uploadsDir, fileName), buffer, (err) => {
      if (err) console.error("Error saving image locally:", err);
      else console.log("Image saved locally:", fileName);
    });
    return { provider: "local", pathname };
  }
}

exports.imageuploader = catchAsync(async (req, res) => {
  const type =req.body.type;
    const job = await Job.findOne({ _id: req.body.id });
    if (!job) {
      throw new AppError("Job not found", 400);
    }
    const result = await uploadImage(req.body.base64, job.do_number, type);
    if(type==="sign"){
       job.sign = `uploads/${type}-${job.do_number}.png`;
    }else{
      job.photo_proof = `uploads/${type}-${job.do_number}.jpeg`;
    }
    await job.save();
    res.status(201).json({message:"done", storage: result});
  });

