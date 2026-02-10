const mongoose = require("mongoose");
require("dotenv").config();

const Job = require("../src/models/jobModel");
const Goods = require("../src/models/goodsModel");

async function run() {
  const uri = process.env.DB;
  if (!uri) {
    throw new Error("DB env var not set");
  }

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const missingQuery = {
    $or: [
      { customer_deliveryAddress: { $exists: false } },
      { customer_deliveryAddress: null },
      { customer_deliveryAddress: "" },
    ],
  };

  const jobs = await Job.find(missingQuery).lean();
  if (!jobs.length) {
    console.log("No jobs missing customer_deliveryAddress");
    await mongoose.disconnect();
    return;
  }

  const goodsIds = jobs
    .map((job) => job.goods_id)
    .filter(Boolean);

  const goodsDocs = await Goods.find({ _id: { $in: goodsIds } }).lean();
  const goodsMap = new Map(goodsDocs.map((g) => [String(g._id), g]));

  const updates = [];
  let skipped = 0;

  for (const job of jobs) {
    const goods = goodsMap.get(String(job.goods_id));
    const candidate = goods && goods.deliveryAddress ? String(goods.deliveryAddress).trim() : "";
    if (candidate) {
      updates.push({
        updateOne: {
          filter: { _id: job._id },
          update: { $set: { customer_deliveryAddress: candidate } },
        },
      });
    } else {
      skipped += 1;
    }
  }

  if (updates.length) {
    const result = await Job.bulkWrite(updates);
    console.log(`Updated jobs: ${result.modifiedCount}`);
  } else {
    console.log("No jobs updated");
  }

  if (skipped) {
    console.log(`Skipped jobs (no delivery address found in goods): ${skipped}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
