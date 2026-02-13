const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    customer_firstName: {
      type: String,
      required: true,
    },
    customer_companyName: {
      type: String,
      default: "",
    },
    customer_email: {
      type: String,
      trim: true,
    },
    customer_email2: {
      type: String,
      trim: true,
    },
    customer_phone: {
      type: String,
      trim: true,
    },
    customer_address: {
      type: String,
      default: "",
    },
    customer_deliveryAddress:{
      type:String,
      default:""
    },
    goods_id: {
      type: mongoose.Schema.ObjectId,
      ref: "goods",
      required: [true, "Please Enter Goods"],
    },
    map_pinpoint_delivery: {
      type: [],
      default: ["", ""],
    },
    delivery_time: {
      type: Date,
    },
    status: {
      type: ["Created", "Delivering", "Delivered"],
      default: "Created",
    },
    do_number: {
      type: String,
      unique: true,
      required: true,
    },
    sign: { type: String, default: "" },
    photo_proof: { type: String, default: "" },
    photo_proof_images: { type: [String], default: [] },
    // driver_id: {
    //   type: mongoose.Schema.ObjectId,
    //   ref: "users",
    // },
    driver_firstName: {
      type: String,
      default: "",
    },
    driver_lastName: {
      type: String,
      default: "",
    },
    driver_vehicleNumber: {
      type: String,
    },
    driver_licenceNumber: {
      type: String,
      default: "",
    },
    driver_governmentIDs: {
      type: String,
      default: "",
    },
    driver_email: {
      type: String,
      trim: true,
    },
    driver_phone: {
      type: String,
      trim: true,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    invoice_no:{
      type:String,
      default:""
    }
  },
  { timestamps: true }
);
const Job = new mongoose.model("Job", JobSchema);

module.exports = Job;
