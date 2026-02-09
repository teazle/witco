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

module.exports = async function createPDFFromImages(do_num = "Do-236FBmM") {
  const pdfKey = `uploads/pdfs/${do_num}.pdf`;
  const pdfDoc = await PDFDocument.create();

  let imageBytes = await getBytesFromStorage(`uploads/proof-${do_num}.jpeg`);
  let image = await pdfDoc.embedJpg(imageBytes);
  const page = pdfDoc.addPage();
  page.drawImage(image, {
    x: 100,
    y: 250,
    width: 400,
    height: 300,
  });

  imageBytes = await getBytesFromStorage(`uploads/sign-${do_num}.png`);
  image = await pdfDoc.embedPng(imageBytes);
  page.drawImage(image, {
    x: 100,
    y: 650,
    width: 150,
    height: 150,
  });

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
  await fs.promises.writeFile(path.join(outDir, `${do_num}.pdf`), pdfBytes);
  return { provider: "local", pathname: pdfKey };
};
