/**
 * Seed inventory items for the goods autocomplete catalog.
 * Run: node scripts/seed-inventory.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const InventoryItem = require("../src/models/inventoryItemModel");

const items = [
  { category: "Chemicals", name: "Ecotreat L28 (20kg/bag)" },
  { category: "Chemicals", name: "Ecotreat L28 (25kg/bag)" },
  { category: "Chemicals", name: "Ecotreat A30 (25kg/drum)" },
  { category: "Chemicals", name: "Hexafoam 8005 (25kg/drum)" },
  { category: "Chemicals", name: "HCl (9%) (25kg/drum)" },
  { category: "Chemicals", name: "NaOH (17%) (25kg/drum)" },
  { category: "Chemicals", name: "Membrane Cleaning Chemical (25kg/bag)" },
  { category: "Chemicals", name: "Top up Ecotreat L28 Premix 1000L IBC Tank" },
  { category: "Chemicals", name: "Unload Ecotreat L28 Premix 1000L IBC Tank" },
  { category: "Chemicals", name: "Top up Ecotreat A30 Premix 1000L IBC Tank" },
  { category: "Chemicals", name: "Unload Ecotreat A30 Premix 1000L IBC Tank" },
  { category: "Chemicals", name: "Empty Drum Return" },

  { category: "WPC-05 (New)", name: "Install new WPC-05" },
  { category: "WPC-05 (New)", name: "Control Panel" },
  { category: "WPC-05 (New)", name: "25L Dosing Pump" },
  { category: "WPC-05 (New)", name: "32L Dosing Pump" },
  { category: "WPC-05 (New)", name: "3\" static mixer" },
  { category: "WPC-05 (New)", name: "100L PE Tank" },
  { category: "WPC-05 (New)", name: "0.37kW Submersible Pump" },
  { category: "WPC-05 (New)", name: "Level Sensor" },
  { category: "WPC-05 (New)", name: "Piping and electrical Work" },
  { category: "WPC-05 (New)", name: "Testing & Commissioning" },

  { category: "WPC-05 (Old)", name: "Reinstall existing WPC-05" },
  { category: "WPC-05 (Old)", name: "Injection valve" },
  { category: "WPC-05 (Old)", name: "Filter valve" },
  { category: "WPC-05 (Old)", name: "2\" sludge valve" },
  { category: "WPC-05 (Old)", name: "FRP repair work" },
  { category: "WPC-05 (Old)", name: "Change 25L Dosing Pump" },
  { category: "WPC-05 (Old)", name: "Change 32L Dosing Pump" },
  { category: "WPC-05 (Old)", name: "Change 25L Dosing Pump Injection Valve" },
  { category: "WPC-05 (Old)", name: "Change 25L Dosing Pump Filter" },
  { category: "WPC-05 (Old)", name: "Change 25L Dosing Pump Tubing (set)" },
  { category: "WPC-05 (Old)", name: "Change 0.37kW Submersible Pump" },
  { category: "WPC-05 (Old)", name: "Change Control Panel" },

  { category: "WPC-10 (New)", name: "Install new WPC-10" },
  { category: "WPC-10 (New)", name: "Control Panel" },
  { category: "WPC-10 (New)", name: "25L Dosing Pump" },
  { category: "WPC-10 (New)", name: "32L Dosing Pump" },
  { category: "WPC-10 (New)", name: "3\" static mixer" },
  { category: "WPC-10 (New)", name: "100L PE Tank" },
  { category: "WPC-10 (New)", name: "0.75kW Submersible Pump" },
  { category: "WPC-10 (New)", name: "Level Sensor" },
  { category: "WPC-10 (New)", name: "Piping and electrical Work" },
  { category: "WPC-10 (New)", name: "Testing & Commissioning" },

  { category: "WPC-10 (Old)", name: "Reinstall existing WPC-10" },
  { category: "WPC-10 (Old)", name: "Injection valve" },
  { category: "WPC-10 (Old)", name: "Filter valve" },
  { category: "WPC-10 (Old)", name: "2\" sludge valve" },
  { category: "WPC-10 (Old)", name: "FRP repair work" },
  { category: "WPC-10 (Old)", name: "Change 25L Dosing Pump" },
  { category: "WPC-10 (Old)", name: "Change 32L Dosing Pump" },
  { category: "WPC-10 (Old)", name: "Change 25L Dosing Pump Injection Valve" },
  { category: "WPC-10 (Old)", name: "Change 32L Dosing Pump Injection Valve" },
  { category: "WPC-10 (Old)", name: "Change 25L Dosing Pump Filter" },
  { category: "WPC-10 (Old)", name: "Change 0.75kW Submersible Pump" },
  { category: "WPC-10 (Old)", name: "Change Control Panel" },

  { category: "WPC-20 (New)", name: "Install new WPC-20" },
  { category: "WPC-20 (New)", name: "Control Panel" },
  { category: "WPC-20 (New)", name: "32L Dosing Pump" },
  { category: "WPC-20 (New)", name: "3\" static mixer" },
  { category: "WPC-20 (New)", name: "100L PE Tank" },
  { category: "WPC-20 (New)", name: "1.1kW Submersible Pump" },
  { category: "WPC-20 (New)", name: "Level Sensor" },
  { category: "WPC-20 (New)", name: "Piping and electrical Work" },
  { category: "WPC-20 (New)", name: "Testing & Commissioning" },

  { category: "WPC-20 (Old)", name: "Reinstall existing WPC-20" },
  { category: "WPC-20 (Old)", name: "Injection valve" },
  { category: "WPC-20 (Old)", name: "Filter valve" },
  { category: "WPC-20 (Old)", name: "3\" sludge valve" },
  { category: "WPC-20 (Old)", name: "FRP repair work" },
  { category: "WPC-20 (Old)", name: "Change 32L Dosing Pump" },
  { category: "WPC-20 (Old)", name: "Change 32L Dosing Pump Injection Valve" },
  { category: "WPC-20 (Old)", name: "Change 32L Dosing Pump Filter" },
  { category: "WPC-20 (Old)", name: "Change 1.1kW Submersible Pump" },
  { category: "WPC-20 (Old)", name: "Change Control Panel" },

  { category: "WPC-40 (New)", name: "Install new WPC-40" },
  { category: "WPC-40 (New)", name: "Control Panel" },
  { category: "WPC-40 (New)", name: "100L Dosing Pump" },
  { category: "WPC-40 (New)", name: "4\" static mixer" },
  { category: "WPC-40 (New)", name: "1000L IBC Tank" },
  { category: "WPC-40 (New)", name: "3.7kW Submersible Pump" },
  { category: "WPC-40 (New)", name: "3\" auto sludge valve" },
  { category: "WPC-40 (New)", name: "Piping and electrical Work" },
  { category: "WPC-40 (New)", name: "Safety Platform (set)" },
  { category: "WPC-40 (New)", name: "Testing & Commissioning" },

  { category: "WPC-40 (Old)", name: "Reinstall existing WPC-40" },
  { category: "WPC-40 (Old)", name: "Injection valve" },
  { category: "WPC-40 (Old)", name: "Filter valve" },
  { category: "WPC-40 (Old)", name: "3\" sludge valve" },
  { category: "WPC-40 (Old)", name: "FRP repair work" },
  { category: "WPC-40 (Old)", name: "Change 100L Dosing Pump" },
  { category: "WPC-40 (Old)", name: "Change 100L Dosing Pump Injection Valve" },
  { category: "WPC-40 (Old)", name: "Change 100L Dosing Pump Filter" },
  { category: "WPC-40 (Old)", name: "Change 100L Dosing Pump Tubing (set)" },
  { category: "WPC-40 (Old)", name: "Change 3.7kW Submersible Pump" },
  { category: "WPC-40 (Old)", name: "Change Control Panel" },

  { category: "WPC-60 (New)", name: "Install new WPC-60" },
  { category: "WPC-60 (New)", name: "Control Panel" },
  { category: "WPC-60 (New)", name: "100L Dosing Pump" },
  { category: "WPC-60 (New)", name: "4\" static mixer" },
  { category: "WPC-60 (New)", name: "1000L IBC Tank" },
  { category: "WPC-60 (New)", name: "3.7kW Submersible Pump" },
  { category: "WPC-60 (New)", name: "3\" auto sludge valve" },
  { category: "WPC-60 (New)", name: "Piping and electrical Work" },
  { category: "WPC-60 (New)", name: "Safety Platform (set)" },
  { category: "WPC-60 (New)", name: "Testing & Commissioning" },

  { category: "WPC-60 (Old)", name: "Reinstall existing WPC-60" },
  { category: "WPC-60 (Old)", name: "Injection valve" },
  { category: "WPC-60 (Old)", name: "Filter valve" },
  { category: "WPC-60 (Old)", name: "3\" sludge valve" },
  { category: "WPC-60 (Old)", name: "FRP repair work" },
  { category: "WPC-60 (Old)", name: "Change 100L Dosing Pump" },
  { category: "WPC-60 (Old)", name: "Change 100L Dosing Pump Injection Valve" },
  { category: "WPC-60 (Old)", name: "Change 100L Dosing Pump Filter" },
  { category: "WPC-60 (Old)", name: "Change 100L Dosing Pump Tubing (set)" },
  { category: "WPC-60 (Old)", name: "Change 3.7kW Submersible Pump" },
  { category: "WPC-60 (Old)", name: "Change Control Panel" },

  { category: "WPC-80 (New)", name: "Install new WPC-80" },
  { category: "WPC-80 (New)", name: "Control Panel" },
  { category: "WPC-80 (New)", name: "100L Dosing Pump" },
  { category: "WPC-80 (New)", name: "6\" static mixer" },
  { category: "WPC-80 (New)", name: "1000L IBC Tank" },
  { category: "WPC-80 (New)", name: "5.5kW Submersible Pump" },
  { category: "WPC-80 (New)", name: "3\" auto sludge valve" },
  { category: "WPC-80 (New)", name: "Piping and electrical Work" },
  { category: "WPC-80 (New)", name: "Safety Platform (set)" },
  { category: "WPC-80 (New)", name: "Testing & Commissioning" },

  { category: "WPC-80 (Old)", name: "Reinstall existing WPC-80" },
  { category: "WPC-80 (Old)", name: "Injection valve" },
  { category: "WPC-80 (Old)", name: "Filter valve" },
  { category: "WPC-80 (Old)", name: "3\" sludge valve" },
  { category: "WPC-80 (Old)", name: "FRP repair work" },
  { category: "WPC-80 (Old)", name: "Change 100L Dosing Pump" },
  { category: "WPC-80 (Old)", name: "Change 100L Dosing Pump Injection Valve" },
  { category: "WPC-80 (Old)", name: "Change 100L Dosing Pump Filter" },
  { category: "WPC-80 (Old)", name: "Change 100L Dosing Pump Tubing (set)" },
  { category: "WPC-80 (Old)", name: "Change 5.5kW Submersible Pump" },
  { category: "WPC-80 (Old)", name: "Change Control Panel" },

  { category: "Rental Machine", name: "Install Rental WPC-05" },
  { category: "Rental Machine", name: "Install Rental WPC-10" },
  { category: "Rental Machine", name: "Install Rental WPC-20" },
  { category: "Rental Machine", name: "Install Rental WPC-40" },
  { category: "Rental Machine", name: "Install Rental WPC-60" },
  { category: "Rental Machine", name: "Install Rental WPC-80" },
];

async function seed() {
  if (!process.env.DB) {
    console.error("Missing DB in .env");
    process.exit(1);
  }
  await mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  let created = 0;
  for (const item of items) {
    const existing = await InventoryItem.findOne({
      name: item.name,
      category: item.category,
    });
    if (!existing) {
      await InventoryItem.create(item);
      created += 1;
    }
  }

  console.log(`Seed complete: ${created} inventory items added.`);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
