/**
 * Seed sample goods and jobs so the Jobs / Delivery Order pages show data.
 * Run: node scripts/seed-jobs.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Job = require("../src/models/jobModel");
const Goods = require("../src/models/goodsModel");
const User = require("../src/models/userModel");

async function seed() {
  if (!process.env.DB) {
    console.error("Missing DB in .env");
    process.exit(1);
  }
  await mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const existingJobs = await Job.countDocuments();
  if (existingJobs > 0) {
    console.log("Jobs already exist in the database (" + existingJobs + " jobs). Skipping seed.");
    await mongoose.connection.close();
    process.exit(0);
    return;
  }

  // Get a driver for Delivering/Delivered jobs (optional)
  let driver = await User.findOne({ userRole: "driver" });
  const driverEmail = driver ? driver.email : "";
  const driverFirstName = driver ? driver.firstName : "Sample";
  const driverLastName = driver ? driver.lastName : "Driver";

  const goodsList = [
    { parcelID: "PARCEL-001", invoiceNumber: "DO-SEED-001", inv_temp: "INV-001", zipcode: "100001" },
    { parcelID: "PARCEL-002", invoiceNumber: "DO-SEED-002", inv_temp: "INV-002", zipcode: "100002" },
    { parcelID: "PARCEL-003", invoiceNumber: "DO-SEED-003", inv_temp: "INV-003", zipcode: "100003" },
  ];

  const createdGoods = [];
  for (const g of goodsList) {
    const existing = await Goods.findOne({ invoiceNumber: g.invoiceNumber });
    if (existing) {
      createdGoods.push(existing);
    } else {
      const good = await Goods.create({
        goods: [{ goodsName: "Sample item", quantity: 1 }],
        ...g,
      });
      createdGoods.push(good);
    }
  }

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  await Job.create([
    {
      customer_firstName: "Alice",
      customer_companyName: "Acme Corp",
      customer_email: "alice@acme.com",
      customer_deliveryAddress: "123 Main St, Singapore",
      customer_address: "123 Main St",
      goods_id: createdGoods[0]._id,
      do_number: createdGoods[0].invoiceNumber,
      status: "Created",
    },
    {
      customer_firstName: "Bob",
      customer_companyName: "Beta Ltd",
      customer_email: "bob@beta.com",
      customer_deliveryAddress: "456 Oak Ave, Singapore",
      customer_address: "456 Oak Ave",
      goods_id: createdGoods[1]._id,
      do_number: createdGoods[1].invoiceNumber,
      status: "Delivering",
      driver_email: driverEmail,
      driver_firstName,
      driver_lastName,
    },
    {
      customer_firstName: "Carol",
      customer_companyName: "Gamma Inc",
      customer_email: "carol@gamma.com",
      customer_deliveryAddress: "789 Pine Rd, Singapore",
      customer_address: "789 Pine Rd",
      goods_id: createdGoods[2]._id,
      do_number: createdGoods[2].invoiceNumber,
      status: "Delivered",
      delivery_time: yesterday,
      driver_email: driverEmail,
      driver_firstName,
      driver_lastName,
    },
  ]);

  console.log("Seed complete: 3 goods and 3 jobs created.");
  console.log("  - Jobs (Delivery Order) page: 1 job with status Created");
  console.log("  - All Delivery Orders (Delivering): 1 job");
  console.log("  - All Delivery Orders (Delivered): 1 job");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
