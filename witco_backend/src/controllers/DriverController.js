const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");


exports.addDriver = catchAsync(async (req, res, next) => {
  
  const user = await User.findOne({email:req.body.email});
  if(user){
    throw new AppError("Email Already Exists",400);
  }
  const driver = new User(req.body);
  const AddDriver = await driver.save();
  
    res.status(201).json({
      status: "success",
      message:"Driver Added Successfully",
      data:AddDriver
    });
  
  });

exports.getAllDriver = catchAsync(async(req,res,next)=>{
  const pageSize = parseInt(req.query.pagesize) || 5;
  const page = parseInt(req.query.page) || 1;

  // const allDriver = await User.find({userRole:"driver"}).limit(pageSize * 1).skip((page - 1) * pageSize);
  const allDriver = await User.aggregate([
    {
      $match: { 
        userRole:"driver"
       }
    },
    {
      $facet: {
        metaData: [
          {
            $count: 'total',
          },
        ],
        records: [{ $skip: pageSize * (page-1) }, { $limit: pageSize }],
      },
    }
    ]);
 
  res.status(200).json({
    status: "success",
    message:"Driver Fetched Successfully",
    data:allDriver.length>0?allDriver[0].records:allDriver,
    total:allDriver.length>0?allDriver[0].metaData.length>0?allDriver[0].metaData[0].total:'':'',
   });

});

exports.getSelectAll = catchAsync(async(req,res,next)=>{
  const selectAll = await User.find({userRole:"driver"});
  res.status(200).json({
    status: "success",
    message:"All Driver Fetched Successfully",
    data:selectAll
   });
});

exports.getDriver = catchAsync(async(req,res,next)=>{

  if(!req.params.id || req.params.id.length !== 24){
    return next(new AppError("Please Provide Valid Id",404));
  }

  const getdriver = await User.findOne({_id:req.params.id,userRole:"driver"});
 
  if(!getdriver){
    throw new AppError("Requested Driver Does not Exist",404);
    }
  
  res.status(200).json({
    status: "success",
    message:"Driver Fetched Successfully",
    data:getdriver
   });

});

exports.editDriver = catchAsync(async (req,res,next)=>{

  if(!req.params.id || req.params.id.length !== 24){
    return next(new AppError("Please Provide Valid Id",404));
  }
  if (req.body.email) {
    const user = await User.findOne({email:req.body.email});
    if(user && req.params.id!== user._id.toString()){
      throw new AppError("Email Already Exists",400);
    }
  }
  const editDriver =  await User.findOneAndUpdate(
    { _id: req.params.id,userRole:"driver"},
    req.body,
    {new:true}
  );

  if(!editDriver){
    throw new AppError("Driver Does not Exist",404);
    }

  res.status(200).json({
    status: "success",
    message:"Updation Successfully",
    data:editDriver
  });
 
});

exports.deleteDriver = catchAsync(async (req,res,next)=>{

  if(!req.params.id || req.params.id.length !== 24){
    return next(new AppError("Please Provide Valid Id",404));
  }

  const deletedriver = await User.findOneAndDelete({ _id: req.params.id,userRole:"driver" });

  if(!deletedriver){
    return next(new AppError("Driver does not exists", 404));
  }

  res.status(200).json({
    status: "success",
    message:"Driver Deleted Successfully",
   });

});

exports.adminaccess=catchAsync(async (req,res,next)=>{
  if(req.user.userRole!=='admin'){
    throw new AppError(`You don't have permision to access this route`,403);
  }
  next();
})