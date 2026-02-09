const express = require("express");
const router = express.Router();
const CustomerController = require('../controllers/CustomerController');
const UserController = require('../controllers/UserController');

router.use(UserController.verifyJWT);
router.post("/add",CustomerController.addCustomer);
router.patch("/edit/:id",CustomerController.editCustomer);
router.get("/getAll",CustomerController.getAllCustomer);
router.get("/get/:id",CustomerController.getCustomer);
router.delete("/delete/:id",CustomerController.deleteCustomer);

module.exports =router;