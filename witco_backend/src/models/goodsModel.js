const mongoose = require("mongoose");

const goodsSchema = new mongoose.Schema(
  {
    goods: [
      {
        goodsName: String,
        quantity: Number,
      },
    ],
    parcelID: {
      type: String,
      default: "",
      // required: true,
    },
    invoiceNumber: {
      type: String,
      unique: [true, "Duplicate Invoice Found"],
      required: true,
    },
    inv_temp: {
      type: String,
    },
    zipcode: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);
module.exports = new mongoose.model('Goods',goodsSchema)