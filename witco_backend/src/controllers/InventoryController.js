const InventoryItem = require("../models/inventoryItemModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeKeywords = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter((entry) => entry.length > 0);
  }
  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const buildSearchFilter = (query) => {
  if (!query) return null;
  const terms = String(query)
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0);
  if (!terms.length) return null;
  const fields = ["name", "category", "keywords"];
  const termFilters = terms.map((term) => {
    const regex = { $regex: new RegExp(escapeRegex(term), "i") };
    return { $or: fields.map((field) => ({ [field]: regex })) };
  });
  return { $and: termFilters };
};

exports.addInventoryItem = catchAsync(async (req, res, next) => {
  const { name, category, keywords, isActive } = req.body;
  if (!name || !String(name).trim()) {
    throw new AppError("Please Provide Item Name", 400);
  }

  const item = await InventoryItem.create({
    name: String(name).trim(),
    category: category ? String(category).trim() : "",
    keywords: normalizeKeywords(keywords),
    isActive: typeof isActive === "boolean" ? isActive : true,
  });

  res.status(201).json({
    status: "success",
    message: "Inventory Item Added Successfully",
    data: item,
  });
});

exports.getAllInventory = catchAsync(async (req, res, next) => {
  const pageSize = parseInt(req.query.pagesize, 10) || 10;
  const page = parseInt(req.query.page, 10) || 1;
  const query = req.query.query ? String(req.query.query).trim() : "";
  const category = req.query.category ? String(req.query.category).trim() : "";
  const active = req.query.active;

  const filter = {};
  const searchFilter = buildSearchFilter(query);
  if (searchFilter) Object.assign(filter, searchFilter);
  if (category) filter.category = category;
  if (active === "true" || active === "false") {
    filter.isActive = active === "true";
  }

  const [records, total] = await Promise.all([
    InventoryItem.find(filter)
      .sort({ updatedAt: -1 })
      .skip(pageSize * (page - 1))
      .limit(pageSize)
      .lean(),
    InventoryItem.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    message: "Inventory Fetched Successfully",
    data: records,
    total,
  });
});

exports.searchInventory = catchAsync(async (req, res, next) => {
  const query = req.query.query ? String(req.query.query).trim() : "";
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const active = req.query.active;

  const filter = {};
  const searchFilter = buildSearchFilter(query);
  if (searchFilter) Object.assign(filter, searchFilter);
  if (active === "true" || active === "false") {
    filter.isActive = active === "true";
  } else {
    filter.isActive = true;
  }

  const items = await InventoryItem.find(filter)
    .sort({ name: 1 })
    .limit(limit)
    .lean();

  res.status(200).json({
    status: "success",
    message: "Inventory Search Success",
    data: items,
  });
});

exports.getInventoryItem = catchAsync(async (req, res, next) => {
  if (!req.params.id || req.params.id.length !== 24) {
    return next(new AppError("Please Provide Valid Id", 400));
  }

  const item = await InventoryItem.findOne({ _id: req.params.id });
  if (!item) {
    return next(new AppError("Requested Inventory Item Does Not Exist", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Inventory Item Fetched Successfully",
    data: item,
  });
});

exports.editInventoryItem = catchAsync(async (req, res, next) => {
  if (!req.params.id || req.params.id.length !== 24) {
    return next(new AppError("Please Provide Valid Id", 400));
  }

  const payload = {
    name: req.body.name ? String(req.body.name).trim() : undefined,
  };
  if (req.body.category !== undefined) {
    payload.category = req.body.category ? String(req.body.category).trim() : "";
  }
  if (req.body.keywords !== undefined) {
    payload.keywords = normalizeKeywords(req.body.keywords);
  }
  if (typeof req.body.isActive === "boolean") {
    payload.isActive = req.body.isActive;
  }

  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

  const updated = await InventoryItem.findOneAndUpdate(
    { _id: req.params.id },
    payload,
    { new: true }
  );

  if (!updated) {
    return next(new AppError("Inventory Item Does Not Exist", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Inventory Item Updated Successfully",
    data: updated,
  });
});

exports.deleteInventoryItem = catchAsync(async (req, res, next) => {
  if (!req.params.id || req.params.id.length !== 24) {
    return next(new AppError("Please Provide Valid Id", 400));
  }

  const deleted = await InventoryItem.findOneAndDelete({ _id: req.params.id });

  if (!deleted) {
    return next(new AppError("Inventory Item Does Not Exist", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Inventory Item Deleted Successfully",
  });
});
