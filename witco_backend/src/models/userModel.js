const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

const userSchema = new mongoose.Schema(
  {
    firstName:{
      type:String,
      required:true,
    },
    lastName:{
      type:String,
      default:""
    },
    companyName:{
      type:String,
      default:""
    },
    email: {
      type: String,
      trim:true,
      lowercase: true
    },
    email2:{
      type: String,
      trim:true,
      lowercase: true
    },
    password: {
      type: String,
    },
    phone: {
      type: String,
      trim:true,
      unique: true, // Set the 'unique' option to true
      sparse: true, // Set the 'sparse' option to true
      required:true,
    },
    address:{
      type:String,
      default:""
    },
    deliveryAddress: {
      type: String,
      default: "", 
    },
    vehicleNumber:{
      type:String,
      default:""
    },
    licenceNumber:{
      type:String,
      default:""
    },
    governmentIDs:{
      type:String,
      default:""
    },
    userRole: {
      type: String,
      enum: ["admin", "driver","customer"],
      default: "driver",
    },
    loc : { 
      type: [],
      default: ["", ""]
    },
    otp: {
      type: String,
    },
    expiresIn: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password =await bcrypt.hash(user.password, 8);
  }
  next();
});
module.exports = new mongoose.model('User',userSchema)
