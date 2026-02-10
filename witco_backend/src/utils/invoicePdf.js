const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const s3 = require("./awsconfig");
const { blobHead, blobPut, isBlobEnabled } = require("./blob");

async function getBytesFromStorage(key) {
  if (isBlobEnabled()) {
    const meta = await blobHead(key);
    if (!meta || !meta.url) throw new Error(`Blob not found for key: ${key}`);
    const resp = await fetch(meta.url);
    if (!resp.ok) throw new Error(`Failed to fetch blob ${key}: ${resp.status}`);
    return Buffer.from(await resp.arrayBuffer());
  }

  if (s3) {
    const params = { Bucket: "witco", Key: key };
    const data = await s3.getObject(params).promise();
    return data.Body;
  }

  const localPath = path.join(__dirname, "..", "..", key);
  return fs.promises.readFile(localPath);
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function wrapText(text, font, size, maxWidth) {
  if (!text) return [""];
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    const width = font.widthOfTextAtSize(next, size);
    if (width <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

async function loadLogoBytes() {
  const logoPath = path.join(__dirname, "..", "assets", "logo.png");
  return fs.promises.readFile(logoPath);
}

module.exports = async function createInvoicePdf({
  job,
  goods,
  orderDate,
  deliveryDate,
  deliveryTime,
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const colorPrimary = rgb(0.255, 0.255, 0.62); // #41419e
  const colorBlack = rgb(0, 0, 0);

  const margin = 40;
  const lineHeight = 14;

  // Logo
  try {
    const logoBytes = await loadLogoBytes();
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoWidth = 60;
    const scale = logoWidth / logoImage.width;
    const logoHeight = logoImage.height * scale;
    page.drawImage(logoImage, {
      x: margin,
      y: height - margin - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
  } catch (err) {
    // Logo is optional; continue without it.
  }

  // Header left
  const headerX = margin + 75;
  let headerY = height - margin - 5;
  page.drawText("WITCO ENVIROTECH PTE LTD", {
    x: headerX,
    y: headerY,
    size: 12,
    font: bold,
    color: colorPrimary,
  });
  headerY -= lineHeight;
  page.drawText("ENVIRONMENTAL CONTROL EQUIPMENTS", {
    x: headerX,
    y: headerY,
    size: 9,
    font: bold,
    color: colorPrimary,
  });
  headerY -= lineHeight;
  page.drawText("7030 Ang Mo Kio Avenue 5 #05-33", {
    x: headerX,
    y: headerY,
    size: 9,
    font: regular,
    color: colorPrimary,
  });
  headerY -= lineHeight;
  page.drawText("Northstar@AMK, Singapore 569880", {
    x: headerX,
    y: headerY,
    size: 9,
    font: regular,
    color: colorPrimary,
  });
  headerY -= lineHeight;
  page.drawText("Tel: (65) 6482 0371, 6482 0630", {
    x: headerX,
    y: headerY,
    size: 9,
    font: regular,
    color: colorPrimary,
  });
  headerY -= lineHeight;
  page.drawText("Fax: (65) 6481 3364, 6286 4658", {
    x: headerX,
    y: headerY,
    size: 9,
    font: regular,
    color: colorPrimary,
  });
  headerY -= lineHeight;
  page.drawText("E-Mail: sales@witco.com.sg", {
    x: headerX,
    y: headerY,
    size: 9,
    font: regular,
    color: colorPrimary,
  });

  // Header right details
  const detailsX = width - margin - 200;
  const valueX = detailsX + 85;
  const valueMaxWidth = width - margin - valueX;
  let detailsY = height - margin - 5;
  page.drawText("DELIVERY ORDER", {
    x: detailsX,
    y: detailsY,
    size: 12,
    font: bold,
    color: colorPrimary,
  });
  detailsY -= lineHeight * 1.4;
  const details = [
    ["DO No.:", job.do_number || ""],
    ["Order Date:", orderDate || ""],
    ["Your P/O No.:", goods?.inv_temp || ""],
    ["Order By:", job.customer_firstName || ""],
    ["Delivery Date:", deliveryDate ? `${deliveryDate} ${deliveryTime || ""}` : ""],
  ];
  details.forEach(([label, value]) => {
    const lines = wrapText(String(value || ""), regular, 9, valueMaxWidth);
    const safeLines = lines.length ? lines : [""];
    page.drawText(label, {
      x: detailsX,
      y: detailsY,
      size: 9,
      font: bold,
      color: colorPrimary,
    });
    page.drawText(safeLines[0], {
      x: valueX,
      y: detailsY,
      size: 9,
      font: regular,
      color: colorPrimary,
    });
    detailsY -= lineHeight;
    for (let i = 1; i < safeLines.length; i++) {
      page.drawText(safeLines[i], {
        x: valueX,
        y: detailsY,
        size: 9,
        font: regular,
        color: colorPrimary,
      });
      detailsY -= lineHeight;
    }
  });

  // Messrs and address
  let messrsY = height - 220;
  page.drawText("Messers:", {
    x: margin,
    y: messrsY,
    size: 9,
    font: bold,
    color: colorBlack,
  });
  page.drawText(String(job.customer_companyName || ""), {
    x: margin + 55,
    y: messrsY,
    size: 9,
    font: regular,
    color: colorBlack,
  });
  messrsY -= lineHeight;
  page.drawText("Delivery Address:", {
    x: margin,
    y: messrsY,
    size: 9,
    font: bold,
    color: colorBlack,
  });
  const addressX = margin + 90;
  const addressMaxWidth = width - margin - addressX;
  const addressLines = wrapText(String(job.customer_deliveryAddress || ""), regular, 9, addressMaxWidth);
  const safeAddressLines = addressLines.length ? addressLines : [""];
  page.drawText(safeAddressLines[0], {
    x: addressX,
    y: messrsY,
    size: 9,
    font: regular,
    color: colorBlack,
  });
  for (let i = 1; i < safeAddressLines.length; i++) {
    messrsY -= lineHeight;
    page.drawText(safeAddressLines[i], {
      x: addressX,
      y: messrsY,
      size: 9,
      font: regular,
      color: colorBlack,
    });
  }

  // Table
  const tableX = margin;
  const tableWidth = width - margin * 2;
  const colItem = 40;
  const colQty = 80;
  const colDesc = tableWidth - colItem - colQty;
  const headerHeight = 20;
  let tableY = messrsY - 30;

  page.drawRectangle({
    x: tableX,
    y: tableY - headerHeight,
    width: tableWidth,
    height: headerHeight,
    color: colorPrimary,
    borderColor: colorBlack,
    borderWidth: 1,
  });
  page.drawText("Item", {
    x: tableX + 10,
    y: tableY - 14,
    size: 9,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Description", {
    x: tableX + colItem + 10,
    y: tableY - 14,
    size: 9,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Quantity", {
    x: tableX + colItem + colDesc + 10,
    y: tableY - 14,
    size: 9,
    font: bold,
    color: rgb(1, 1, 1),
  });

  // Column lines for header
  page.drawLine({
    start: { x: tableX + colItem, y: tableY },
    end: { x: tableX + colItem, y: tableY - headerHeight },
    thickness: 1,
    color: colorBlack,
  });
  page.drawLine({
    start: { x: tableX + colItem + colDesc, y: tableY },
    end: { x: tableX + colItem + colDesc, y: tableY - headerHeight },
    thickness: 1,
    color: colorBlack,
  });

  let rowTop = tableY - headerHeight;
  const items = (goods && goods.goods) || [];
  items.forEach((item, index) => {
    const descLines = wrapText(item.goodsName || "", regular, 9, colDesc - 10);
    const rowHeight = Math.max(18, descLines.length * 12 + 6);
    const rowBottom = rowTop - rowHeight;

    // Row border
    page.drawRectangle({
      x: tableX,
      y: rowBottom,
      width: tableWidth,
      height: rowHeight,
      borderColor: colorBlack,
      borderWidth: 1,
    });

    // Column lines
    page.drawLine({
      start: { x: tableX + colItem, y: rowTop },
      end: { x: tableX + colItem, y: rowBottom },
      thickness: 1,
      color: colorBlack,
    });
    page.drawLine({
      start: { x: tableX + colItem + colDesc, y: rowTop },
      end: { x: tableX + colItem + colDesc, y: rowBottom },
      thickness: 1,
      color: colorBlack,
    });

    // Item number
    page.drawText(String(index + 1), {
      x: tableX + 12,
      y: rowTop - 14,
      size: 9,
      font: regular,
      color: colorBlack,
    });

    // Description lines
    let textY = rowTop - 14;
    descLines.forEach((line) => {
      page.drawText(line, {
        x: tableX + colItem + 8,
        y: textY,
        size: 9,
        font: regular,
        color: colorBlack,
      });
      textY -= 12;
    });

    // Quantity
    page.drawText(String(item.quantity ?? ""), {
      x: tableX + colItem + colDesc + 20,
      y: rowTop - 14,
      size: 9,
      font: regular,
      color: colorBlack,
    });

    rowTop = rowBottom;
  });

  // Signatures
  const signatureY = Math.max(rowTop - 80, 110);
  const lineWidth = 160;
  const leftX = margin + 20;
  const rightX = width - margin - lineWidth - 20;

  page.drawLine({
    start: { x: leftX, y: signatureY },
    end: { x: leftX + lineWidth, y: signatureY },
    thickness: 1,
    color: colorBlack,
  });
  page.drawText("Authorized Signature", {
    x: leftX + 10,
    y: signatureY - 14,
    size: 9,
    font: regular,
    color: colorBlack,
  });

  page.drawLine({
    start: { x: rightX, y: signatureY },
    end: { x: rightX + lineWidth, y: signatureY },
    thickness: 1,
    color: colorBlack,
  });
  page.drawText("Received By", {
    x: rightX + 35,
    y: signatureY - 14,
    size: 9,
    font: regular,
    color: colorBlack,
  });

  // Company logo as authorized signature
  try {
    const logoBytes = await loadLogoBytes();
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const maxSigWidth = 120;
    const maxSigHeight = 40;
    const sigScale = Math.min(maxSigWidth / logoImage.width, maxSigHeight / logoImage.height);
    const sigWidth = logoImage.width * sigScale;
    const sigHeight = logoImage.height * sigScale;
    page.drawImage(logoImage, {
      x: leftX + (lineWidth - sigWidth) / 2,
      y: signatureY + 2,
      width: sigWidth,
      height: sigHeight,
    });
  } catch (err) {
    // Logo is optional; continue without it.
  }

  try {
    const signBytes = await getBytesFromStorage(
      `uploads/sign-${encodeURIComponent(job.do_number)}.png`
    );
    const signImage = await pdfDoc.embedPng(signBytes);
    const maxSignWidth = 140;
    const maxSignHeight = 40;
    const signScale = Math.min(maxSignWidth / signImage.width, maxSignHeight / signImage.height);
    const signWidth = signImage.width * signScale;
    const signHeight = signImage.height * signScale;
    page.drawImage(signImage, {
      x: rightX + (lineWidth - signWidth) / 2,
      y: signatureY + 2,
      width: signWidth,
      height: signHeight,
    });
  } catch (err) {
    // Signature is optional; continue without it.
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
