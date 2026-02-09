const express = require("express");
const router = express.Router();
const DriverController = require('../controllers/DriverController');
const UserController = require('../controllers/UserController');

router.use(UserController.verifyJWT);
router.use(DriverController.adminaccess);
router.post("/add",DriverController.addDriver);
router.get("/getAll",DriverController.getAllDriver);
router.get("/getSelectAll",DriverController.getSelectAll);
router.get("/get/:id",DriverController.getDriver);
router.patch("/edit/:id",DriverController.editDriver);
router.delete("/delete/:id",DriverController.deleteDriver);

module.exports =router;