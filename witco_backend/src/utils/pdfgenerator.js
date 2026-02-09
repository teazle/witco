const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const AppError = require("../utils/AppError");
const AWS = require("aws-sdk");
require("dotenv").config();

// require("aws-sdk/lib/maintenance_mode_message").suppress = true;
const s3 = require('./awsconfig');

async function getImage(key){
  const params = {
    Bucket: "witco",
    Key: key,
  };

  try {
    const data = await s3.getObject(params).promise();
    return data.Body;
  } catch (err) {throw err;}
}

   module.exports= async function createPDFFromImages(do_num = "Do-236FBmM") {
   const outputFilePath = `uploads/pdfs/${do_num}.pdf`;
   const pdfDoc = await PDFDocument.create();

   let imageBytes = await getImage(`uploads/proof-${do_num}.jpeg`);
   let image = await pdfDoc.embedJpg(imageBytes);
   const page = pdfDoc.addPage();
   page.drawImage(image, {
     x: 100,
     y: 250,
     width: 400,
     height: 300,
   });
   imageBytes = await getImage(`uploads/sign-${do_num}.png`);
   image = await pdfDoc.embedPng(imageBytes);

   page.drawImage(image, {
     x: 100,
     y: 650,
     width: 150,
     height: 150,
   });
   const pdfBytes = await pdfDoc.save();
   const params = {
     Bucket: "witco",
     Key: `uploads/pdfs/${do_num}.pdf`,
     Body: pdfBytes,
     ACL: "public-read-write",
     ContentType: `application/pdf`,
   };
   await s3.putObject(params, (err, data) => {
     if (err) {
       console.error("Error uploading image to S3:", err);
     } else {
       console.log("Image uploaded to S3 successfully:");
     }
   });
 }