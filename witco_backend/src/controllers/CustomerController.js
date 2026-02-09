const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

exports.addCustomer = catchAsync(async (req, res, next) => {
  if(req.body.email===null){
    req.body.email = "";
  }
  if (req.body.email2 === null) {
    req.body.email2 = "";
  }
  const customer = new User(req.body);
  const AddCustomer = await customer.save();
    res.status(201).json({
      status: "success",
      message:"Customer Added Successfully",
      data:AddCustomer
    });
});

exports.editCustomer = catchAsync(async (req,res,next)=>{

    if(!req.params.id || req.params.id.length !== 24){
        return next(new AppError("Please Provide Valid Id",400));
    }

    const editCustomer =  await User.findOneAndUpdate(
        { _id: req.params.id,userRole:"customer"},
        req.body,
        {new:true}
      );

    if(!editCustomer){
        throw new AppError("Customer Does not Exist",404);
    }
      
      res.status(200).json({
        status: "success",
        message:"Updation Successfully",
        data:editCustomer
      });
});

exports.getAllCustomer = catchAsync(async (req, res, next) => {
  const pageSize = parseInt(req.query.pagesize) || 5;
  const page = parseInt(req.query.page) || 1;
  const type = req.query.type === 'ASCE' ? 1 : -1;
  const field = req.query.field && req.query.field !== 'None' ? req.query.field : 'updatedAt';
  const sort = { [field]: type };

  const [records, total] = await Promise.all([
    User.find({ userRole: 'customer' })
      .sort(sort)
      .skip(pageSize * (page - 1))
      .limit(pageSize)
      .lean(),
    User.countDocuments({ userRole: 'customer' }),
  ]);

  res.status(200).json({
    status: 'success',
    message: 'All Customer Fetched Successfully',
    data: records,
    total,
  });
});

exports.getCustomer = catchAsync(async (req,res,next)=>{

    if(!req.params.id || req.params.id.length !== 24){
        return next(new AppError("Please Provide Valid Id",404));
    }
    
    const getcustomer = await User.findOne({_id:req.params.id,userRole:"customer"});
    
    if(!getcustomer){
      throw new AppError("Requested Customer Does not Exist",404);
    }
    
      res.status(200).json({
        status: "success",
        message:"Customer Fetched Successfully",
        data:getcustomer
       });
});

exports.deleteCustomer = catchAsync(async (req,res,next)=>{

    if(!req.params.id || req.params.id.length !== 24){
        return next(new AppError("Please Provide Valid Id",400));
    }

    const deletecustomer = await User.findOneAndDelete({ _id: req.params.id,userRole:"customer" });

    if(!deletecustomer){
        return next(new AppError("Customer does not exists", 404));
    }

    res.status(200).json({
        status: "success",
        message:"Customer Deleted Successfully",
       });
});