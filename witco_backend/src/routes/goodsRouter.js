const express = require("express");
const router = express.Router();
const GoodsController = require('../controllers/GoodsController');
const UserController = require('../controllers/UserController');

router.use(UserController.verifyJWT);
router.post("/add",GoodsController.addGoods);
router.get("/getAll",GoodsController.getAllGoods);
router.get("/get/:id",GoodsController.getGoods);
router.patch("/edit/:id",GoodsController.editGoods);
router.delete("/delete/:id",GoodsController.deleteGoods);

module.exports =router;