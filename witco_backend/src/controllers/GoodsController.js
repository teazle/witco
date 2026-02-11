const User = require("../models/userModel");
const Goods = require("../models/goodsModel");
const Jobs =  require("../models/jobModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");

exports.addGoods = catchAsync(async (req, res, next) => {
    const {goods,invoiceNumber,zipcode,inv_temp} = req.body
    if(!goods || !invoiceNumber){
      throw new AppError("Please Provide All the details",400);
    }
    const invoiceCheck = await Goods.findOne({invoiceNumber});
    if(invoiceCheck){
      throw new AppError("DO Number Already Exists",400);
    }
    const good = new Goods({goods,invoiceNumber,zipcode,inv_temp});
    await good.save();

    res.status(201).json({
      status: "success",
      message:"Goods Added Successfully",
      data:good
    });
});

exports.getAllGoods = catchAsync(async (req,res,next)=>{

  const allGoods = await Goods.find({});

  res.status(201).json({
    status: "success",
    message:"Goods Fetched Successfully",
    data:allGoods
   });
});

exports.getGoods = catchAsync(async (req,res,next)=>{

  if(!req.params.id || req.params.id.length !== 24){
    return next(new AppError("Please Provide Valid Id",400));
  }

  const getgoods = await Goods.findOne({_id:req.params.id});

  if(!getgoods){
    return next(new AppError("Requested Goods Does Not Exist",404));
  }
  
  res.status(200).json({
    status: "success",
    message:"Goods Fetched Successfully",
    data:getgoods
   });

});

exports.editGoods = catchAsync(async (req,res,next)=>{

  if(!req.params.id || req.params.id.length !== 24){
    return next(new AppError("Please Provide Valid Id",400));
  }
  const goodsObjectId = new mongoose.Types.ObjectId(req.params.id);
  const legacyGoodsDoc = await Goods.collection.findOne(
    { _id: goodsObjectId },
    { projection: { deliveryAddress: 1 } }
  );
  const legacyDeliveryAddress = legacyGoodsDoc && legacyGoodsDoc.deliveryAddress
    ? String(legacyGoodsDoc.deliveryAddress).trim()
    : "";
  const job = await Jobs.findOne({goods_id:req.params.id});
  if(!job){
    return next(new AppError("Job Does Not Exist",400));
  }
  if (req.body.invoiceNumber) {
    job.do_number = req.body.invoiceNumber;
  }
  if (
    (!job.customer_deliveryAddress || !String(job.customer_deliveryAddress).trim()) &&
    legacyDeliveryAddress
  ) {
    job.customer_deliveryAddress = legacyDeliveryAddress;
  }
  await job.save();
  const editGoods =  await Goods.findOneAndUpdate(
    { _id: req.params.id },
    { $set: req.body },
    {new:true}
  );
  
  if(!editGoods){
    return next(new AppError("Goods Does Not Exist",404));
  }
  
  res.status(200).json({
    status: "success",
    message:"Updation Successfully",
    data:editGoods
  });

});

exports.deleteGoods = catchAsync(async (req,res,next)=>{
  if(!req.params.id || req.params.id.length !== 24){
    return next(new AppError("Please Provide Valid Id",400))
  }

  const deleteGoods = await Goods.findOneAndDelete({ _id: req.params.id});

  if(!deleteGoods){
    return next(new AppError("Goods does not exists", 404));
  }

  res.status(200).json({
    status: "success",
    message:"Goods Deleted Successfully",
   });

});
