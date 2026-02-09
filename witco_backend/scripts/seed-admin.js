/**
 * One-time script to create a default admin user for login.
 * Run: node scripts/seed-admin.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const User = require("../src/models/userModel");

const DEFAULT_EMAIL = "admin@witco.com";
const DEFAULT_PASSWORD = "Test123!";
const DEFAULT_PHONE = "+6500000001";

async function seed() {
  if (!process.env.DB) {
    console.error("Missing DB in .env");
    process.exit(1);
  }
  await mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const existing = await User.findOne({ email: DEFAULT_EMAIL });
  if (existing) {
    console.log("Admin user already exists. You can login with:");
    console.log("  Email:", DEFAULT_EMAIL);
    console.log("  Password: (whatever you set previously, or run this script after deleting the user)");
    await mongoose.connection.close();
    process.exit(0);
    return;
  }
  const user = new User({
    firstName: "Admin",
    lastName: "User",
    email: DEFAULT_EMAIL,
    password: DEFAULT_PASSWORD,
    phone: DEFAULT_PHONE,
    userRole: "admin",
  });
  await user.save();
  console.log("Default admin user created. Login with:");
  console.log("  Email:", DEFAULT_EMAIL);
  console.log("  Password:", DEFAULT_PASSWORD);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
