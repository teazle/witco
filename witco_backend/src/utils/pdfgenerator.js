const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
require("dotenv").config();

const s3 = require("./awsconfig");
const { blobHead, blobPut, isBlobEnabled } = require("./blob");

async function getBytesFromStorage(key) {
  // Vercel Blob: resolve to a public URL via head(), then fetch bytes.
  if (isBlobEnabled()) {
    const meta = await blobHead(key);
    if (!meta || !meta.url) throw new Error(`Blob not found for key: ${key}`);
    const resp = await fetch(meta.url);
    if (!resp.ok) throw new Error(`Failed to fetch blob ${key}: ${resp.status}`);
    return Buffer.from(await resp.arrayBuffer());
  }

  // S3 (legacy): fetch directly by key.
  if (s3) {
    const params = { Bucket: "witco", Key: key };
    const data = await s3.getObject(params).promise();
    return data.Body;
  }

  // Local dev: read from disk relative to witco_backend/.
  const localPath = path.join(__dirname, "..", "..", key);
  return fs.promises.readFile(localPath);
}

function resolveDoNumber(jobOrDoNum) {
  if (jobOrDoNum && typeof jobOrDoNum === "object") {
    return jobOrDoNum.do_number || "Do-236FBmM";
  }
  return jobOrDoNum || "Do-236FBmM";
}

function resolveProofPaths(jobOrDoNum, doNum) {
  if (jobOrDoNum && typeof jobOrDoNum === "object") {
    const proofImages = Array.isArray(jobOrDoNum.photo_proof_images)
      ? jobOrDoNum.photo_proof_images.filter(Boolean)
      : [];
    if (proofImages.length) {
      return proofImages;
    }
    if (jobOrDoNum.photo_proof) {
      return [jobOrDoNum.photo_proof];
    }
  }
  return [`uploads/proof-${doNum}.jpeg`];
}

function resolveSignPath(jobOrDoNum, doNum) {
  if (jobOrDoNum && typeof jobOrDoNum === "object" && jobOrDoNum.sign) {
    return jobOrDoNum.sign;
  }
  return `uploads/sign-${doNum}.png`;
}

async function embedImage(pdfDoc, storagePath) {
  const imageBytes = await getBytesFromStorage(storagePath);
  const lowerPath = String(storagePath || "").toLowerCase();
  if (lowerPath.endsWith(".png")) {
    return pdfDoc.embedPng(imageBytes);
  }
  return pdfDoc.embedJpg(imageBytes);
}

function drawImageFitted(page, image, x, y, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const drawX = x + (maxWidth - width) / 2;
  const drawY = y + (maxHeight - height) / 2;
  page.drawImage(image, {
    x: drawX,
    y: drawY,
    width,
    height,
  });
}

module.exports = async function createPDFFromImages(jobOrDoNum = "Do-236FBmM") {
  const doNum = resolveDoNumber(jobOrDoNum);
  const proofPaths = resolveProofPaths(jobOrDoNum, doNum);
  const signPath = resolveSignPath(jobOrDoNum, doNum);
  const pdfKey = `uploads/pdfs/${doNum}.pdf`;
  const pdfDoc = await PDFDocument.create();
  const signImage = await embedImage(pdfDoc, signPath);

  for (let index = 0; index < proofPaths.length; index += 1) {
    const proofImage = await embedImage(pdfDoc, proofPaths[index]);
    const page = pdfDoc.addPage();
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    if (index === 0) {
      drawImageFitted(page, signImage, 40, pageHeight - 180, 180, 130);
      drawImageFitted(page, proofImage, 40, 40, pageWidth - 80, pageHeight - 240);
    } else {
      drawImageFitted(page, proofImage, 40, 40, pageWidth - 80, pageHeight - 80);
    }
  }

  const pdfBytes = await pdfDoc.save();

  if (isBlobEnabled()) {
    await blobPut(pdfKey, Buffer.from(pdfBytes), "application/pdf");
    return { provider: "vercel-blob", pathname: pdfKey };
  }

  if (s3) {
    const params = {
      Bucket: "witco",
      Key: pdfKey,
      Body: pdfBytes,
      ACL: "public-read-write",
      ContentType: "application/pdf",
    };
    await s3.putObject(params).promise();
    return { provider: "s3", pathname: pdfKey };
  }

  // Local fallback
  const outDir = path.join(__dirname, "..", "..", "uploads", "pdfs");
  await fs.promises.mkdir(outDir, { recursive: true });
  await fs.promises.writeFile(path.join(outDir, `${doNum}.pdf`), pdfBytes);
  return { provider: "local", pathname: pdfKey };
};
