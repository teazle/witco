const express = require("express");
const router = express.Router();
const InventoryController = require("../controllers/InventoryController");
const UserController = require("../controllers/UserController");

router.use(UserController.verifyJWT);
router.post("/add", InventoryController.addInventoryItem);
router.get("/getAll", InventoryController.getAllInventory);
router.get("/search", InventoryController.searchInventory);
router.get("/get/:id", InventoryController.getInventoryItem);
router.patch("/edit/:id", InventoryController.editInventoryItem);
router.delete("/delete/:id", InventoryController.deleteInventoryItem);

module.exports = router;
