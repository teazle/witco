const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const Job = require("../models/jobModel");
const Goods = require("../models/goodsModel");
const User = require("../models/userModel");
const DispatchPlan = require("../models/dispatchPlanModel");
const GeocodeCache = require("../models/geocodeCacheModel");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const Email = require("../utils/email");
const client = accountSid && authToken ? require("twilio")(accountSid, authToken) : null;
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const createPDFFromImages = require("../utils/pdfgenerator");
const createInvoicePdf = require("../utils/invoicePdf");
const { blobPut, isBlobEnabled } = require("../utils/blob");
const date = require("date-and-time");
const s3 = require("../utils/awsconfig");
const get_do = require("./CounterController");
const mongoose = require("mongoose");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { createWorker } = require("tesseract.js");
const fetch = require("node-fetch");

const ORS_API_KEY = process.env.ORS_API_KEY;
const ORS_BASE_URL =
  process.env.ORS_BASE_URL || "https://api.openrouteservice.org";
const ORS_DEFAULT_DEPOT_ADDRESS = process.env.ORS_DEFAULT_DEPOT_ADDRESS || "";
const geocodeCache = new Map();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});
const MIN_EXTRACTABLE_TEXT_LENGTH = 20;
const OCR_TIMEOUT_MS = 45 * 1000;
const BINARY_CHECK_CACHE = new Map();
const IDENTIFIER_TOKEN_STOPLIST = new Set([
  "NO",
  "NUMBER",
  "INVOICE",
  "PO",
  "DO",
  "DATE",
  "REF",
  "FORMAT",
  "FORM",
  "PAGE",
  "TOTAL",
  "N",
  "NA",
  "N/A",
]);

const ZIP_SG = /\b\d{6}\b/;
const ZIP_US = /\b\d{5}\b/;
const NON_EMPTY_LINE = /\S+/;
const GOODS_STOP_WORDS =
  /\b(subtotal|total|grand total|gst|tax|payment|remark|delivery\s*date)\b/i;

function extractZip(value) {
  if (!value) return "";
  const text = String(value);
  const matchSg = text.match(ZIP_SG);
  if (matchSg) return matchSg[0];
  const matchUs = text.match(ZIP_US);
  return matchUs ? matchUs[0] : "";
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function hasBinary(name) {
  if (BINARY_CHECK_CACHE.has(name)) return BINARY_CHECK_CACHE.get(name);
  const check = spawnSync("which", [name], { stdio: "ignore" });
  const available = check.status === 0;
  BINARY_CHECK_CACHE.set(name, available);
  return available;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdoutChunks = [];
    const stderrChunks = [];
    let timedOut = false;
    let settled = false;

    const timer =
      options.timeoutMs && options.timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            child.kill("SIGKILL");
          }, options.timeoutMs)
        : null;

    const done = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(result);
    };

    child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk) => stderrChunks.push(chunk));

    child.on("error", (error) => {
      done({
        code: -1,
        stdout: Buffer.alloc(0),
        stderr: Buffer.from(String(error && error.message ? error.message : error)),
        timedOut,
      });
    });

    child.on("close", (code) => {
      done({
        code: Number.isInteger(code) ? code : -1,
        stdout: Buffer.concat(stdoutChunks),
        stderr: Buffer.concat(stderrChunks),
        timedOut,
      });
    });

    if (options.input) {
      child.stdin.end(options.input);
      return;
    }
    child.stdin.end();
  });
}

async function extractTextFromPdfOcr(pdfBuffer) {
  const warnings = [];
  if (!hasBinary("magick") || !hasBinary("tesseract")) {
    warnings.push("pdf_ocr_dependencies_missing");
    return { text: "", warnings };
  }

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "witco-po-"));
  const pdfPath = path.join(tempDir, "upload.pdf");

  try {
    await fs.promises.writeFile(pdfPath, pdfBuffer);

    const image = await runCommand(
      "magick",
      [
        `${pdfPath}[0]`,
        "-density",
        "300",
        "-background",
        "white",
        "-alpha",
        "remove",
        "-alpha",
        "off",
        "-colorspace",
        "Gray",
        "png:-",
      ],
      { timeoutMs: OCR_TIMEOUT_MS }
    );

    if (image.code !== 0 || !image.stdout.length) {
      warnings.push(image.timedOut ? "pdf_to_image_timeout" : "pdf_to_image_failed");
      return { text: "", warnings };
    }

    const ocr = await runCommand(
      "tesseract",
      ["stdin", "stdout", "-l", "eng", "--oem", "1", "--psm", "4"],
      { input: image.stdout, timeoutMs: OCR_TIMEOUT_MS }
    );

    if (ocr.code !== 0) {
      warnings.push(ocr.timedOut ? "pdf_ocr_timeout" : "pdf_ocr_failed");
      return { text: "", warnings };
    }

    const text = normalizeText(ocr.stdout.toString("utf8"));
    if (!text) warnings.push("pdf_ocr_empty");
    return { text, warnings };
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

function extractBlockAfter(label, lines, maxLines = 4) {
  const index = lines.findIndex((line) =>
    line.toLowerCase().includes(label.toLowerCase())
  );
  if (index === -1) return [];
  const block = [];
  for (let i = index + 1; i < lines.length && block.length < maxLines; i += 1) {
    const line = lines[i].trim();
    if (!line) break;
    block.push(line);
  }
  return block;
}

function extractInlineOrBlock(label, lines, maxLines = 4) {
  const labelLower = label.toLowerCase();
  const index = lines.findIndex((line) =>
    line.toLowerCase().includes(labelLower)
  );
  if (index === -1) return [];
  const line = lines[index];
  const lower = line.toLowerCase();
  const pos = lower.indexOf(labelLower);
  let inline = line.slice(pos + labelLower.length).trim();
  inline = inline.replace(/^[:\-]\s*/, "").trim();
  if (inline) return [inline];
  return extractBlockAfter(label, lines, maxLines);
}

function cleanIdentifier(rawValue) {
  return String(rawValue || "")
    .toUpperCase()
    .replace(/^[^A-Z0-9]+/, "")
    .replace(/[^A-Z0-9/-]+$/g, "")
    .replace(/^[-/]+|[-/]+$/g, "")
    .trim();
}

function isLikelyIdentifier(value) {
  if (!value || value.length < 4) return false;
  const digitCount = (value.match(/\d/g) || []).length;
  if (digitCount < 2) return false;
  if (!/^[A-Z0-9][A-Z0-9/-]*$/.test(value)) return false;
  if (IDENTIFIER_TOKEN_STOPLIST.has(value)) return false;
  return true;
}

function normalizeFilenameIdentifier(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9/-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "")
    .trim();
}

function inferPoNumberFromFilename(fileName) {
  const base = normalizeFilenameIdentifier(path.parse(fileName || "").name);
  if (!base) return "";
  const poCandidate = base.match(/[A-Z0-9/-]*P[O0][A-Z0-9/-]*/);
  if (!poCandidate || !poCandidate[0]) return "";
  const normalized = cleanIdentifier(poCandidate[0].replace(/P0/g, "PO"));
  return isLikelyIdentifier(normalized) ? normalized : "";
}

function inferInvoiceNumberFromFilename(fileName) {
  const base = normalizeFilenameIdentifier(path.parse(fileName || "").name);
  if (!base) return "";
  if (isLikelyIdentifier(base)) return base;
  const tokens = base
    .split(/[^A-Z0-9/-]+/)
    .map((token) => cleanIdentifier(token))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  return tokens.find((token) => isLikelyIdentifier(token)) || "";
}

function findFirstIdentifier(text, patterns) {
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const candidate = cleanIdentifier(match && match[1] ? match[1] : "");
      if (isLikelyIdentifier(candidate)) return candidate;
    }
  }
  return "";
}

function extractPhone(lines) {
  const contactLines = lines.filter((line) =>
    /(phone|tel|mobile|contact|site contact|hp)/i.test(line)
  );
  const sgPhoneRegex = /(?:\+65[\s-]?)?(\d{8})\b/;
  for (const line of contactLines) {
    const sgPhone = line.match(sgPhoneRegex);
    if (sgPhone && sgPhone[1]) return sgPhone[1];
  }
  return "";
}

function parseGoodsLines(lines) {
  const goods = [];
  lines.forEach((line) => {
    const cleaned = line.replace(/\s{2,}/g, " ").trim();
    if (!cleaned || cleaned.length < 4 || GOODS_STOP_WORDS.test(cleaned)) return;

    const qtyFirst = cleaned.match(/^(\d{1,4})\s*(?:x|pcs|qty)?\s+(.+)$/i);
    if (qtyFirst) {
      const quantity = Number(qtyFirst[1]);
      const goodsName = qtyFirst[2].trim();
      if (quantity > 0 && goodsName.length > 3) {
        goods.push({ goodsName, quantity });
      }
      return;
    }

    const qtyLast = cleaned.match(/^(.+?)\s+(\d{1,4})\s*(?:x|pcs|qty)?$/i);
    if (qtyLast) {
      const quantity = Number(qtyLast[2]);
      const goodsName = qtyLast[1].trim();
      if (quantity > 0 && goodsName.length > 3) {
        goods.push({ goodsName, quantity });
      }
    }
  });
  return goods;
}

function parseDocumentText(rawText) {
  const text = normalizeText(rawText);
  const lines = text.split("\n").map((line) => line.trim());
  const nonEmptyLines = lines.filter((line) => NON_EMPTY_LINE.test(line));

  const invoicePatterns = [
    /\binvoice\s*(?:no\.?|number|#|num|n[o0])\s*[:\-]?\s*([A-Z0-9][A-Z0-9/-]{2,})/gi,
    /\bdo\s*(?:no\.?|number|#|num|n[o0])\s*[:\-]?\s*([A-Z0-9][A-Z0-9/-]{2,})/gi,
  ];
  const poPatterns = [
    /\bpo\s*(?:no\.?|number|#|num|n[o0])\s*[:\-]?\s*([A-Z0-9][A-Z0-9/-]{2,})/gi,
    /\bpurchase\s*order\s*(?:no\.?|number|#|num|n[o0])\s*[:\-]?\s*([A-Z0-9][A-Z0-9/-]{2,})/gi,
    /\bour\s*ref(?:erence)?\s*[:\-]?\s*([A-Z0-9/-]*PO[A-Z0-9/-]*)/gi,
  ];

  let invoiceNumber = findFirstIdentifier(text, invoicePatterns);
  const poNumber = findFirstIdentifier(text, poPatterns);

  const deliveryCandidates = [
    extractInlineOrBlock("Delivery Address", nonEmptyLines),
    extractInlineOrBlock("Ship To", nonEmptyLines),
    extractInlineOrBlock("Deliver To", nonEmptyLines),
    extractInlineOrBlock("Delivery Location", nonEmptyLines),
    extractInlineOrBlock("Site Address", nonEmptyLines),
  ];
  const deliveryBlock = deliveryCandidates.find((block) => block.length) || [];
  const deliveryAddress = deliveryBlock.length ? deliveryBlock.join(", ") : "";

  const billToBlock = extractInlineOrBlock("Bill To", nonEmptyLines);
  const customerLine = billToBlock[0] || "";
  const companyLine = billToBlock[1] || "";

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = extractPhone(nonEmptyLines);

  const goodsStartIndex = nonEmptyLines.findIndex((line) =>
    /description|item|product|qty|quantity/i.test(line)
  );
  const goodsLines =
    goodsStartIndex >= 0
      ? nonEmptyLines.slice(goodsStartIndex + 1, goodsStartIndex + 25)
      : [];
  const goods = parseGoodsLines(goodsLines);

  const warnings = [];
  if (!invoiceNumber && poNumber) {
    invoiceNumber = poNumber;
    warnings.push("invoice_fallback_from_po");
  }
  if (!invoiceNumber) warnings.push("invoiceNumber_not_found");
  if (!deliveryAddress) warnings.push("deliveryAddress_not_found");
  if (!goods.length) warnings.push("goods_not_found");

  return {
    invoiceNumber,
    poNumber,
    deliveryAddress,
    customerName: customerLine,
    customerCompany: companyLine,
    customerEmail: emailMatch ? emailMatch[0] : "",
    customerPhone: phoneMatch || "",
    goods,
    warnings,
  };
}

function parseDriverCoord(loc) {
  if (!Array.isArray(loc) || loc.length < 2) return null;
  const lat = Number(loc[0]);
  const lon = Number(loc[1]);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  return [lon, lat];
}

function haversineKm(a, b) {
  if (!a || !b) return Number.MAX_VALUE;
  const toRad = (value) => (value * Math.PI) / 180;
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const aa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return 6371 * c;
}

async function geocodeAddress(address) {
  if (!address || !ORS_API_KEY) return null;
  const key = String(address).trim().toLowerCase();
  if (!key) return null;
  if (geocodeCache.has(key)) return geocodeCache.get(key);
  const cached = await GeocodeCache.findOne({ address: key }).lean();
  if (cached && Array.isArray(cached.coords) && cached.coords.length === 2) {
    await GeocodeCache.updateOne(
      { address: key },
      { $set: { lastUsedAt: new Date() } }
    );
    geocodeCache.set(key, cached.coords);
    return cached.coords;
  }
  try {
    const url = `${ORS_BASE_URL}/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(
      address
    )}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const coord = data?.features?.[0]?.geometry?.coordinates || null;
    if (Array.isArray(coord) && coord.length === 2) {
      geocodeCache.set(key, coord);
      await GeocodeCache.findOneAndUpdate(
        { address: key },
        {
          $set: {
            address: key,
            coords: coord,
            provider: "ors",
            lastUsedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
      return coord;
    }
  } catch (error) {
    return null;
  }
  return null;
}

async function getRouteSegments(coordinates) {
  if (!ORS_API_KEY || !Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }
  try {
    const response = await fetch(`${ORS_BASE_URL}/v2/directions/driving-car`, {
      method: "POST",
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates,
        instructions: false,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.features?.[0]?.properties?.segments || null;
  } catch (error) {
    return null;
  }
}

function orderByNearest(startCoord, jobs) {
  if (!startCoord) return buildRouteOrder(jobs);
  const remaining = [...jobs];
  const ordered = [];
  let current = startCoord;
  while (remaining.length) {
    let bestIndex = 0;
    let bestDistance = Number.MAX_VALUE;
    remaining.forEach((job, idx) => {
      const dist = job.coord ? haversineKm(current, job.coord) : Number.MAX_VALUE;
      if (dist < bestDistance) {
        bestDistance = dist;
        bestIndex = idx;
      }
    });
    const nextJob = remaining.splice(bestIndex, 1)[0];
    ordered.push(nextJob);
    if (nextJob && nextJob.coord) current = nextJob.coord;
  }
  return ordered;
}

function buildRouteOrder(jobs) {
  const sortable = jobs.map((job) => {
    const zip = extractZip(
      job.zipcode || job.customer_deliveryAddress || job.customer_address
    );
    const numeric = zip ? Number(zip) : NaN;
    return {
      ...job,
      zipKey: zip,
      zipNumeric: Number.isNaN(numeric) ? null : numeric,
    };
  });
  sortable.sort((a, b) => {
    if (a.zipNumeric != null && b.zipNumeric != null) return a.zipNumeric - b.zipNumeric;
    if (a.zipNumeric != null) return -1;
    if (b.zipNumeric != null) return 1;
    return String(a.customer_deliveryAddress || a.customer_address || "").localeCompare(
      String(b.customer_deliveryAddress || b.customer_address || "")
    );
  });
  return sortable;
}

function assignJobsToDrivers(jobs, drivers) {
  const driverBuckets = drivers.map((driver) => ({
    driver,
    jobs: [],
    count: 0,
  }));
  if (!driverBuckets.length) return [];

  const grouped = jobs.reduce((acc, job) => {
    const zipKey =
      extractZip(job.zipcode || job.customer_deliveryAddress || job.customer_address) ||
      "unknown";
    if (!acc[zipKey]) acc[zipKey] = [];
    acc[zipKey].push(job);
    return acc;
  }, {});

  const groups = Object.keys(grouped)
    .map((zipKey) => ({ zipKey, jobs: grouped[zipKey] }))
    .sort((a, b) => b.jobs.length - a.jobs.length);

  groups.forEach((group) => {
    driverBuckets.sort((a, b) => a.count - b.count);
    const bucket = driverBuckets[0];
    bucket.jobs.push(...group.jobs);
    bucket.count += group.jobs.length;
  });

  return driverBuckets;
}
exports.addJob = catchAsync(async (req, res, next) => { 
    const {customer_firstName,
      customer_companyName,
      customer_email,
      customer_email2,
      customer_deliveryAddress,
      customer_address, 
      } = req.body;
    let {customer_phone} = req.body; 
    const gid = req.body.goods_id;
    const goods_id =await Goods.findOne({ _id: gid });
    if (!goods_id) {
      throw new AppError("Goods Not Found",404);
    }
    let do_number = goods_id.invoiceNumber;
    const job = new Job({
      customer_firstName,
      customer_companyName,
      customer_email,
      customer_email2,
      customer_phone,
      customer_deliveryAddress,
      customer_address,
      goods_id,
      do_number,
    });
    await job.save();
    res.status(201).send({
      status:"success",
      data:job
    })
    }
);

exports.editJob = catchAsync(async (req, res, next) => {
  if (!req.params.id || req.params.id.length !== 24) {
    return next(new AppError("Please Provide Valid Id", 400));
  }
  const updateData = { ...req.body };
  if (
    Object.prototype.hasOwnProperty.call(updateData, "deliveryAddress") &&
    !Object.prototype.hasOwnProperty.call(updateData, "customer_deliveryAddress")
  ) {
    updateData.customer_deliveryAddress = updateData.deliveryAddress;
  }
  delete updateData.deliveryAddress;
  const editJob = await Job.findOneAndUpdate(
    { _id: req.params.id },
    { $set: updateData },
    { new: true }
  );
  res.status(200).json({
    status: "success",
    message: "Updation Successfully",
    data: editJob,
  });
});

exports.getJob = catchAsync(async (req, res, next) => {
    if (!req.params.id || req.params.id.length !== 24) {
      return next(new AppError("Please Provide Valid Id", 400));
    }
    const job =await Job.findOne({ _id: req.params.id });
    if (!job) {
        throw new AppError("Job Not Found",404);
    }
    res.send({
        status:"success",
        data:{
            job
        }
    })
});

exports.getAllJob = catchAsync(async (req, res, next) => {
  var pageSize = parseInt(req.query.pagesize) || 5;
  var page = parseInt(req.query.page) || 1;
  let type = req.query.type === 'ASCE' ? 1 : -1;
  let field = req.query.field;
  const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const searchField = req.query.searchField;
  const searchValueRaw = req.query.searchValue;
  const allowedSearchFields = new Set([
    "invoiceNumber",
    "do_number",
    "inv_temp",
    "invoice_no",
    "customer_companyName",
    "customer_firstName",
    "customer_lastName",
    "driver_firstName",
    "driver_lastName",
    "driver_email",
    "deliveryAddress",
    "customer_deliveryAddress",
    "customer_address",
  ]);
  let queryStatus = req.query.status;
  const andFilters = [];
  if (queryStatus) {
    andFilters.push({ status: queryStatus });
  }
  const driverEmail =
    req.user.userRole === 'driver' ? req.user.email : req.query.driver_email;
  if (driverEmail) {
    andFilters.push({ driver_email: driverEmail });
  }
  if (req.user.userRole === 'driver') {
    pageSize = 100;
  }
  if (req.query.invoiceNumber) {
    const invoiceNumber = req.query.invoiceNumber;
    andFilters.push({
      $or: [{ invoiceNumber }, { do_number: invoiceNumber }],
    });
  }
  if (searchField && searchValueRaw && allowedSearchFields.has(searchField)) {
    const searchValue = String(searchValueRaw).trim().replace(/\s+/g, " ");
    if (searchValue.length) {
      const regex = new RegExp(escapeRegex(searchValue).replace(/\s+/g, "\\s+"), "i");
      if (searchField === "deliveryAddress") {
        andFilters.push({
          $or: [
            { deliveryAddress: regex },
            { customer_deliveryAddress: regex },
            { customer_address: regex },
          ],
        });
      } else if (searchField === "invoiceNumber") {
        andFilters.push({
          $or: [{ invoiceNumber: regex }, { do_number: regex }],
        });
      } else {
        andFilters.push({ [searchField]: regex });
      }
    }
  }
  if (req.query.fromDate && req.query.toDate) {
    const fromDate = new Date(req.query.fromDate);
    const toDate = new Date(req.query.toDate);
    if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
      const startDate = new Date(
        Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate() - 1, 16, 0)
      );
      const endDate = new Date(
        Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate(), 16, 0)
      );
      const dateField = queryStatus === "Delivered" ? "delivery_time" : "updatedAt";
      andFilters.push({ [dateField]: { $gte: startDate, $lte: endDate } });
    }
  }
  const where = andFilters.length ? { $and: andFilters } : {};
  if (!field || field === "None") {
    field = queryStatus === "Delivered" ? "delivery_time" : "updatedAt";
    type = -1;
  }
  const sortFieldExprMap = {
    invoiceNumber: { $ifNull: ["$invoiceNumber", "$do_number"] },
    do_number: { $ifNull: ["$do_number", "$invoiceNumber"] },
    deliveryAddress: {
      $ifNull: ["$deliveryAddress", { $ifNull: ["$customer_deliveryAddress", "$customer_address"] }],
    },
    customer_deliveryAddress: {
      $ifNull: ["$customer_deliveryAddress", { $ifNull: ["$deliveryAddress", "$customer_address"] }],
    },
    inv_temp: { $ifNull: ["$inv_temp", ""] },
  };
  const sortFieldExpr = sortFieldExprMap[field] || `$${field}`;

  const joball = await Job.aggregate( [
  {
    $lookup:{
      from: 'goods',
      localField: 'goods_id',
      foreignField: '_id',
      as: 'goods',
      pipeline: [
          { $project:{
                  _id:0,
                  parcelID:1,
                  deliveryAddress:1,
                  invoiceNumber:1,
                  zipcode:1,
                  inv_temp:1,
                  invoice_no:1
                } 
        } 
      ]
  },    
},   
{
  $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$goods" , 0 ] }, "$$ROOT" ] }}
},{
  $match: where
},{
  $set:{field: sortFieldExpr}
},
{
  $addFields: {
    lowercaseField: {
      $cond: {
        if: {
          $in: [{ $type: "$field" }, ["date", "long", "int", "double", "decimal"]]
        },
        then: "$field",
        else: { $toLower: { $convert: { input: "$field", to: "string", onError: "", onNull: "" } } }
      }
    }
  }
},
{
  $sort: {
    lowercaseField: type  // 1 for ascending, -1 for descending
  }
},
    { $project: { goods: 0,
      //  lowercaseField :0,field:0
      } },
{
  $facet: {
    metaData: [
      {
        $count: 'total',
      },
    ],
    records: [{ $skip: pageSize * (page-1) }, { $limit: pageSize }],
  },
},
]).collation({ locale: "en", strength: 2, numericOrdering: true });

  if (!joball) {
    throw new AppError("Jobs Not Found",404);
  }else{
 
    joball[0].records.forEach((job) => {
      if (!job.createdAt) return;
      const createdAt = new Date(job.createdAt);
      if (isNaN(createdAt.getTime())) return;
      createdAt.setTime(createdAt.getTime() + 8 * 60 * 60 * 1000);
      job.createdAt = createdAt;
    });
  }
  res.send({
    status: "success",
    data: joball.length>0?joball[0].records:joball,
    total: joball.length>0?joball[0].metaData.length>0?joball[0].metaData[0].total:'':'',
  });
});

exports.jobFiltered = catchAsync(async (req, res, next) => {
  var pageSize = parseInt(req.query.pagesize) || 5;
  var page = parseInt(req.query.page) || 1;

  let where={};
  
  let queryStatus = req.query.status;

  if (queryStatus) {
    where.status = queryStatus;
  }

  if(req.query.fromDate && req.query.toDate){
      where.updatedAt = {
        $gte: new Date(new Date(req.query.fromDate).setHours(00, 00, 00)),
        $lte: new Date(new Date(req.query.toDate).setHours(23, 58, 00))
      }
  }

  if(req.query.driver_email){
    where.driver_email = req.query.driver_email
  }
  
  const joball = await Job.aggregate( [
  {
    $lookup:{
      from: 'goods',
      localField: 'goods_id',
      foreignField: '_id',
      as: 'goods',
      pipeline: [
          { $project:{
                  _id:0,
                  parcelID:1,
                  deliveryAddress:1,
                  invoiceNumber:1,
                  zipcode:1,
                  inv_temp:1
                } 
        } 
      ]
  },    
},   
{
  $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$goods" , 0 ] }, "$$ROOT" ] }}
},
{ $sort:{createdAt:-1}},
{$match:where},
{ $project: { goods:0, } },
{
  $facet: {
    metaData: [
      {
        $count: 'total',
      },
    ],
    records: [{ $skip: pageSize * (page-1) }, { $limit: pageSize }],
  },
},
]);

  if (!joball) {
    throw new AppError("Jobs Not Found",404);
  }

  res.send({
    status: "success",
    data: joball.length>0?joball[0].records:joball,
    total: joball.length>0?joball[0].metaData.length>0?joball[0].metaData[0].total:'':'',
  });
});

exports.deleteJob = catchAsync(async (req, res, next) => {
if (!req.params.id || req.params.id.length !== 24) {
  return next(new AppError("Please Provide Valid Id", 404));
}
const job =await Job.findOneAndDelete({ _id: req.params.id });

if (!job) {
  throw new AppError("Job Does Not Found",404);
}
  res.status(200).json({
    status: "success",
    message: "Job Deleted Successfully",
  });
});

exports.addDo = catchAsync(async (req, res, next) => {
  const jobs = req.body.jobs;
  const driver_id = req.body.driver_id;
  const driver = await User.findOne({ _id: driver_id });
  if (!driver) {
    throw new AppError("Driver Not Found", 404);
  }
    await Job.updateMany({ _id:{$in:jobs} },
      { $set: {
        driver_firstName : driver.firstName,
        driver_lastName: driver.lastName, 
        driver_vehicleNumber:driver.vehicleNumber,
        // driver_licenceNumber:driver.vehicleNumber,
        driver_governmentIDs:driver.governmentIDs,
        driver_email:driver.email,
        driver_phone:driver.phone,
        status : "Delivering"
      }},{multi:true,upsert: true,new: true});
  if (client && process.env.TWILIO_NUMBER && driver.phone) {
    client.messages
      .create({
        body: `Hi ${driver.firstName}, new delivery orders have been assigned to you. Check your app for details.`,
        from: process.env.TWILIO_NUMBER,
        to: driver.phone,
      })
      .then((message) => console.log("Twilio SMS sent:", message.sid))
      .catch((err) => {
        console.warn("Twilio SMS failed:", err.message || err.code);
      });
  }
  res.status(201).send({
    status: "success",
    message: "  Delivery Created SuccessFully",
  });
});

exports.changeDriver = catchAsync(async (req, res, next) => {
  const job = req.body.job_id;
  const driver_id = req.body.driver_id;
  const driver = await User.findOne({ _id: driver_id });
  if (!driver) {
    throw new AppError("Driver Not Found", 404);
  }
  await Job.findByIdAndUpdate(
    { _id: job },
    {
      $set: {
        driver_firstName: driver.firstName,
        driver_lastName: driver.lastName,
        driver_vehicleNumber: driver.vehicleNumber,
        // driver_licenceNumber: driver.vehicleNumber,
        driver_governmentIDs: driver.governmentIDs,
        driver_email: driver.email,
        driver_phone: driver.phone,
      },
    },
    { multi: true, upsert: true, new: true }
  );
  if (client && process.env.TWILIO_NUMBER && driver.phone) {
    client.messages
      .create({
        body: `Hi ${driver.firstName}, new delivery orders have been assigned to you. Check your app for details.`,
        from: process.env.TWILIO_NUMBER,
        to: driver.phone,
      })
      .then((message) => console.log("Twilio SMS sent:", message.sid))
      .catch((err) => {
        console.warn("Twilio SMS failed:", err.message || err.code);
      });
  }
  res.status(200).send({
    status: "success",
    message: "Driver Changed SuccessFully",
  });
});


/* exports.paymentStatus = catchAsync(async (req,res,next)=>{

  if(!req.body.jobid || req.body.jobid.length !== 24){
    return next(new AppError("Please Provide job id",400));
  }

  if(!req.body.hasOwnProperty('paid')){
    return next(new AppError("Please Provide paid or unpaid status",400));
  }

  const job = await Job.findById(req.body.jobid);

  if(!job){
    return next(new AppError("requested job not found",404));
  }

  job.paid = req.body.paid;

  job.save();

  res.status(200).send({
    status: "success",
    message: "Payment Status Changed SuccessFully",
  });

}); */

exports.delivered = catchAsync(async (req, res, next) => {
    const map_pinpoint_delivery = req.body.loc;
    if(!map_pinpoint_delivery.length){
      throw new AppError("Delivery Location not found", 404);
    }
    const job_id = req.body.job_id; 

    const job = await Job.findOne({_id:job_id});

    if(!job){
      throw new AppError('Delivery Order Not Found',404);
    }
    if(!job.sign && !job.photo_proof){
       throw new AppError("Please Upload Required proof first", 400);
    }
    await createPDFFromImages(job.do_number);
    job.status = "Delivered";
    job.map_pinpoint_delivery=map_pinpoint_delivery;
    let dd= new Date(job.updatedAt);  
    dd.setTime(dd.getTime() + 8 * 60 * 60 * 1000);
    job.delivery_time=dd;
    if(req.body.paid){
      job.paid=true;
    }
    await job.save();

    res.status(200).send({
      status: "success",
      message: "Order Delivered SuccessFully",
      data:job
    });
});

exports.updateInvoice =  catchAsync(async (req, res, next) => {
    const job = await Job.findOne({_id:req.body.job_id});
    if(!job){
      throw new AppError('Delivery Order Not Found',404);
    }

    job.invoice_no=req.body.invoice_no;

    await job.save();

    res.status(200).send({
      status: "success",
      message: "Invoice Updated SuccessFully",
    });
});

exports.invoice = catchAsync(async (req,res,next)=>{
  if (!req.body.job_id || req.body.job_id.length !== 24) {
    return next(new AppError("Please Provide Valid Job Id", 400));
  }
  const jobinvoice =  await Job.findOne({_id:req.body.job_id}).lean();
  if(!jobinvoice){
    throw new AppError("invoice not found", 404);
  }
  const goodsAll = await Goods.findOne({_id:jobinvoice.goods_id}).lean();
  if(!goodsAll){
    throw new AppError("Goods not found", 404);
  }

  const createdAt = new Date(jobinvoice.createdAt);
  createdAt.setTime(createdAt.getTime() + 8 * 60 * 60 * 1000);
  const orderDate = createdAt.toISOString().slice(0, 10);

  let deliveryDate = "";
  let deliveryTime = "";
  if (jobinvoice.delivery_time) {
    const delivery = new Date(jobinvoice.delivery_time);
    deliveryDate = delivery.toISOString().slice(0, 10);
    const hh = String(delivery.getUTCHours()).padStart(2, "0");
    const mm = String(delivery.getUTCMinutes()).padStart(2, "0");
    deliveryTime = `${hh}:${mm}`;
  }

  const do_number = jobinvoice.do_number;
  const invoiceKey = `uploads/invoice/invoice-${do_number}.pdf`;

  let pdfBytes;
  try {
    pdfBytes = await createInvoicePdf({
      job: jobinvoice,
      goods: goodsAll,
      orderDate,
      deliveryDate,
      deliveryTime,
    });
  } catch (error) {
    console.error("Invoice PDF generation failed:", error);
    return next(new AppError("Failed to generate invoice", 500));
  }

  if (isBlobEnabled()) {
    await blobPut(invoiceKey, pdfBytes, "application/pdf");
  } else if (s3) {
    await s3
      .putObject({
        Bucket: "witco",
        Key: invoiceKey,
        Body: pdfBytes,
        ACL: "public-read-write",
        ContentType: "application/pdf",
      })
      .promise();
  } else {
    const outDir = path.join(__dirname, "..", "..", "uploads", "invoice");
    await fs.promises.mkdir(outDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(outDir, `invoice-${do_number}.pdf`),
      pdfBytes
    );
  }

  if (jobinvoice.customer_email && jobinvoice.customer_email != "") {
    let myUser = {
      name: jobinvoice.customer_firstName,
      email: jobinvoice.customer_email,
      do_number: jobinvoice.do_number,
    };

    await new Email(myUser, "orderDelivered").orderDelivered(
      "orderdelivered",
      "Order Delivered Successfully",
      {
        filename: `invoice-${do_number}.pdf`,
        content: pdfBytes,
        contentType: "application/pdf",
      }
    );
  }

  if (jobinvoice.customer_email2 && jobinvoice.customer_email2 != "") {
    let myUser = {
      name: jobinvoice.customer_firstName,
      email: jobinvoice.customer_email2,
      do_number: jobinvoice.do_number,
    };

    await new Email(myUser, "orderDelivered").orderDelivered(
      "orderdelivered",
      "Order Delivered Successfully",
      {
        filename: `invoice-${do_number}.pdf`,
        content: pdfBytes,
        contentType: "application/pdf",
      }
    );
  }

  res.status(200).send({
    status: "success",
    message: "Invoice generated",
  });
});

exports.suggestDispatch = catchAsync(async (req, res, next) => {
  const { jobIds, driverIds, perStopMinutes, startTime, depotAddress, saveDraft } =
    req.body || {};
  const match = { status: "Created" };

  if (Array.isArray(jobIds) && jobIds.length) {
    const ids = jobIds
      .filter((id) => typeof id === "string" && id.length === 24)
      .map((id) => new mongoose.Types.ObjectId(id));
    if (ids.length) match._id = { $in: ids };
  }

  const jobs = await Job.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "goods",
        localField: "goods_id",
        foreignField: "_id",
        as: "goods",
      },
    },
    {
      $addFields: {
        goods: { $arrayElemAt: ["$goods", 0] },
      },
    },
    {
      $project: {
        customer_deliveryAddress: 1,
        customer_address: 1,
        do_number: 1,
        createdAt: 1,
        goods_id: 1,
        zipcode: "$goods.zipcode",
        invoiceNumber: "$goods.invoiceNumber",
        inv_temp: "$goods.inv_temp",
      },
    },
  ]);

  const driverQuery = { userRole: "driver" };
  if (Array.isArray(driverIds) && driverIds.length) {
    const ids = driverIds
      .filter((id) => typeof id === "string" && id.length === 24)
      .map((id) => new mongoose.Types.ObjectId(id));
    if (ids.length) driverQuery._id = { $in: ids };
  }
  const drivers = await User.find(driverQuery).lean();

  const perStop = Number(perStopMinutes) > 0 ? Number(perStopMinutes) : 15;
  const baseTime = startTime ? new Date(startTime) : new Date();
  const depotText = depotAddress || ORS_DEFAULT_DEPOT_ADDRESS || "";
  const depotCoord = depotText ? await geocodeAddress(depotText) : null;

  const driversWithCoords = drivers.map((driver) => ({
    ...driver,
    startCoord: parseDriverCoord(driver.loc) || depotCoord,
  }));

  const jobsWithCoords = await Promise.all(
    jobs.map(async (job) => {
      const address =
        job.customer_deliveryAddress || job.customer_address || "";
      const coord = address ? await geocodeAddress(address) : null;
      return {
        ...job,
        address,
        coord,
      };
    })
  );

  const hasGeo =
    ORS_API_KEY &&
    driversWithCoords.some((driver) => driver.startCoord) &&
    jobsWithCoords.some((job) => job.coord);

  let strategy = "zipcode-balance";
  let routing = "heuristic";
  let buckets = [];

  if (hasGeo) {
    strategy = "geo-balance";
    buckets = driversWithCoords.map((driver) => ({
      driver,
      jobs: [],
      count: 0,
    }));

    jobsWithCoords.forEach((job) => {
      let bestIndex = 0;
      let bestScore = Number.MAX_VALUE;
      buckets.forEach((bucket, index) => {
        const distance = job.coord && bucket.driver.startCoord
          ? haversineKm(bucket.driver.startCoord, job.coord)
          : Number.MAX_VALUE;
        const score = distance + bucket.count * 2;
        if (score < bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });
      buckets[bestIndex].jobs.push(job);
      buckets[bestIndex].count += 1;
    });
  } else {
    buckets = assignJobsToDrivers(jobsWithCoords, driversWithCoords);
  }

  const assignments = [];

  for (const bucket of buckets) {
    const ordered = hasGeo
      ? orderByNearest(bucket.driver.startCoord, bucket.jobs)
      : buildRouteOrder(bucket.jobs);

    let jobsWithEta = [];
    if (
      hasGeo &&
      bucket.driver.startCoord &&
      ordered.length &&
      ordered.every((job) => job.coord)
    ) {
      const coordinates = [
        bucket.driver.startCoord,
        ...ordered.map((job) => job.coord),
      ];
      const segments = await getRouteSegments(coordinates);
      if (segments && segments.length) {
        routing = "ors-directions";
        let elapsed = 0;
        jobsWithEta = ordered.map((job, index) => {
          const segment = segments[index];
          if (segment && segment.duration) elapsed += segment.duration;
          elapsed += perStop * 60;
          const etaTime = new Date(baseTime.getTime() + elapsed * 1000);
          return {
            job_id: job._id,
            do_number: job.do_number,
            invoiceNumber: job.invoiceNumber || job.inv_temp || "",
            deliveryAddress:
              job.customer_deliveryAddress || job.customer_address || "",
            zipcode: job.zipcode || "",
            sequence: index + 1,
            etaMinutes: Math.round(elapsed / 60),
            etaTime: etaTime.toISOString(),
          };
        });
      }
    }

    if (!jobsWithEta.length) {
      jobsWithEta = ordered.map((job, index) => {
        const etaMinutes = perStop * (index + 1);
        const etaTime = new Date(baseTime.getTime() + etaMinutes * 60 * 1000);
        return {
          job_id: job._id,
          do_number: job.do_number,
          invoiceNumber: job.invoiceNumber || job.inv_temp || "",
          deliveryAddress:
            job.customer_deliveryAddress || job.customer_address || "",
          zipcode: job.zipcode || "",
          sequence: index + 1,
          etaMinutes,
          etaTime: etaTime.toISOString(),
        };
      });
    }

    assignments.push({
      driver_id: bucket.driver._id,
      driver_name: `${bucket.driver.firstName || ""} ${
        bucket.driver.lastName || ""
      }`.trim(),
      driver_email: bucket.driver.email || "",
      jobs: jobsWithEta,
    });
  }

  let planId = null;
  if (saveDraft !== false) {
    const plan = await DispatchPlan.create({
      createdBy: req.user ? req.user._id : undefined,
      status: "draft",
      assignments: assignments.map((assignment) => ({
        driver_id: assignment.driver_id,
        driver_email: assignment.driver_email,
        jobs: (assignment.jobs || []).map((job) => ({
          job_id: job.job_id,
          sequence: job.sequence,
        })),
      })),
    });
    planId = plan._id;
  }

  res.status(200).json({
    status: "success",
    data: {
      strategy,
      assumptions: {
        startPoint: depotText || "driver-gps",
        routing,
        etaMinutesPerStop: perStop,
      },
      totalJobs: jobs.length,
      totalDrivers: drivers.length,
      assignments,
      planId,
    },
  });
});

exports.parseDocument = [
  upload.single("document"),
  catchAsync(async (req, res, next) => {
    if (!req.file) {
      return next(new AppError("Please upload a document", 400));
    }

    const name = req.file.originalname || "";
    const mime = req.file.mimetype || "";
    const isPdf = mime.includes("pdf") || name.toLowerCase().endsWith(".pdf");
    const isImage =
      mime.startsWith("image/") ||
      /\.(png|jpe?g|bmp|tiff)$/i.test(name.toLowerCase());

    if (!isPdf && !isImage) {
      return next(
        new AppError("Unsupported file type. Use PDF or image.", 400)
      );
    }

    let text = "";
    const parsingWarnings = [];
    if (isPdf) {
      const parsed = await pdfParse(req.file.buffer);
      text = parsed.text || "";
      if (normalizeText(text).length < MIN_EXTRACTABLE_TEXT_LENGTH) {
        const ocr = await extractTextFromPdfOcr(req.file.buffer);
        parsingWarnings.push(...(ocr.warnings || []));
        if (ocr.text) {
          text = [normalizeText(text), ocr.text].filter(Boolean).join("\n");
          parsingWarnings.push("pdf_ocr_applied");
        }
      }
      if (normalizeText(text).length < MIN_EXTRACTABLE_TEXT_LENGTH) {
        parsingWarnings.push("pdf_text_not_extractable");
        parsingWarnings.push("upload_image_for_ocr");
      }
    } else if (isImage) {
      const worker = await createWorker("eng");
      try {
        const result = await worker.recognize(req.file.buffer);
        text = (result && result.data && result.data.text) || "";
      } finally {
        await worker.terminate();
      }
    }

    const parsed = parseDocumentText(text);
    if (!parsed.poNumber) {
      const poFromFilename = inferPoNumberFromFilename(name);
      if (poFromFilename) {
        parsed.poNumber = poFromFilename;
        parsed.warnings.push("po_inferred_from_filename");
      }
    }
    if (!parsed.invoiceNumber) {
      const invoiceFromFilename = inferInvoiceNumberFromFilename(name);
      if (invoiceFromFilename) {
        parsed.invoiceNumber = invoiceFromFilename;
        parsed.warnings.push("invoice_inferred_from_filename");
      } else if (parsed.poNumber) {
        parsed.invoiceNumber = parsed.poNumber;
        parsed.warnings.push("invoice_fallback_from_po");
      }
    }
    if (parsed.invoiceNumber) {
      parsed.warnings = (parsed.warnings || []).filter(
        (warning) => warning !== "invoiceNumber_not_found"
      );
    }
    parsed.warnings = Array.from(
      new Set([...(parsed.warnings || []), ...parsingWarnings])
    );
    res.status(200).json({
      status: "success",
      data: parsed,
    });
  }),
];

exports.applyDispatchPlan = catchAsync(async (req, res, next) => {
  if (!req.params.id || req.params.id.length !== 24) {
    return next(new AppError("Please Provide Valid Plan Id", 400));
  }
  const plan = await DispatchPlan.findById(req.params.id);
  if (!plan) {
    throw new AppError("Dispatch plan not found", 404);
  }

  for (const assignment of plan.assignments || []) {
    const driver = await User.findById(assignment.driver_id);
    if (!driver) continue;
    const jobIds = (assignment.jobs || []).map((job) => job.job_id);
    if (!jobIds.length) continue;

    await Job.updateMany(
      { _id: { $in: jobIds } },
      {
        $set: {
          driver_firstName: driver.firstName,
          driver_lastName: driver.lastName,
          driver_vehicleNumber: driver.vehicleNumber,
          driver_licenceNumber: driver.licenceNumber,
          driver_governmentIDs: driver.governmentIDs,
          driver_email: driver.email,
          driver_phone: driver.phone,
          status: "Delivering",
        },
      }
    );

    if (client && process.env.TWILIO_NUMBER && driver.phone) {
      client.messages
        .create({
          body: `Hi ${driver.firstName}, new delivery orders have been assigned to you. Check your app for details.`,
          from: process.env.TWILIO_NUMBER,
          to: driver.phone,
        })
        .then((message) => console.log("Twilio SMS sent:", message.sid))
        .catch((err) => {
          console.warn("Twilio SMS failed:", err.message || err.code);
        });
    }
  }

  plan.status = "applied";
  plan.appliedAt = new Date();
  await plan.save();

  res.status(200).json({
    status: "success",
    message: "Dispatch plan applied",
  });
});

exports.undoDispatchPlan = catchAsync(async (req, res, next) => {
  if (!req.params.id || req.params.id.length !== 24) {
    return next(new AppError("Please Provide Valid Plan Id", 400));
  }
  const plan = await DispatchPlan.findById(req.params.id);
  if (!plan) {
    throw new AppError("Dispatch plan not found", 404);
  }

  const jobIds = (plan.assignments || []).flatMap((assignment) =>
    (assignment.jobs || []).map((job) => job.job_id)
  );
  if (jobIds.length) {
    await Job.updateMany(
      { _id: { $in: jobIds } },
      {
        $set: {
          status: "Created",
          driver_firstName: "",
          driver_lastName: "",
          driver_vehicleNumber: "",
          driver_licenceNumber: "",
          driver_governmentIDs: "",
          driver_email: "",
          driver_phone: "",
        },
      }
    );
  }

  plan.status = "undone";
  plan.undoneAt = new Date();
  await plan.save();

  res.status(200).json({
    status: "success",
    message: "Dispatch plan undone",
  });
});

exports.dispatchStatus = catchAsync(async (req, res, next) => {
  const now = Date.now();
  const last24h = new Date(now - 24 * 60 * 60 * 1000);
  const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [total, recent24h, recent7d] = await Promise.all([
    GeocodeCache.countDocuments(),
    GeocodeCache.countDocuments({ lastUsedAt: { $gte: last24h } }),
    GeocodeCache.countDocuments({ lastUsedAt: { $gte: last7d } }),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      ors: {
        enabled: Boolean(ORS_API_KEY),
        baseUrl: ORS_BASE_URL,
        defaultDepot: ORS_DEFAULT_DEPOT_ADDRESS || "",
      },
      geocodeCache: {
        total,
        recent24h,
        recent7d,
      },
    },
  });
});
// function get_do_number(){
        
//   let key="Do-";
//   let dateObj = new Date();
//         let arr=[dateObj.getUTCMonth()+1,dateObj.getUTCDate(),dateObj.getHours(),dateObj.getMinutes(),dateObj.getSeconds()];
//         const year = dateObj.getUTCFullYear();
//         key+=(year%100);
//          arr.forEach((num) => {
//            if (num >= 0 && num <= 9) {
//              key += num;
//            } else if (num >= 10 && num <= 35) {
//              key += String.fromCharCode(65 + num - 10);
//            } else {
//              key += String.fromCharCode(97 + num - 36);
//            }
//          });
//         return key;
// }

// exports.nothing = catchAsync(async (req, res, next) => {

//   const jobs = await Job.find();
  
//   jobs.forEach(async  (job)=>{
//     const good = await Goods.findOne({_id:job.goods_id});
//     console.log(job._id)
//     job.customer_deliveryAddress = good.deliveryAddress;
//     console.log(job.customer_deliveryAddress, good.deliveryAddress)
//     await job.save();
//   })
//   res.send({
//     message:"dsd"
//   })

// });
