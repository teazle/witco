const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const Job = require("../models/jobModel");
const Goods = require("../models/goodsModel");
const User = require("../models/userModel");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const Email = require("../utils/email");
const client = accountSid && authToken ? require("twilio")(accountSid, authToken) : null;
const pdf = require("pdf-creator-node");
const options = require("../utils/options");
const fs = require("fs");
const path = require("path");
const createPDFFromImages = require("../utils/pdfgenerator");
const date = require("date-and-time");
const s3 = require("../utils/awsconfig");
const get_do = require("./CounterController");

const UPLOAD_BASE_URL = process.env.UPLOAD_BASE_URL || "http://localhost:5000";
exports.addJob = catchAsync(async (req, res, next) => { 
    const {customer_firstName,
      customer_companyName,
      customer_email,
      customer_email2,
      customer_deliveryAddress,
      customer_address, 
      } = req.body;
    let {customer_phone} = req.body; 
    const gid = req.body.goods_id;
    const goods_id =await Goods.findOne({ _id: gid });
    if (!goods_id) {
      throw new AppError("Goods Not Found",404);
    }
    let do_number = goods_id.invoiceNumber;
    const job = new Job({
      customer_firstName,
      customer_companyName,
      customer_email,
      customer_email2,
      customer_phone,
      customer_deliveryAddress,
      customer_address,
      goods_id,
      do_number,
    });
    await job.save();
    res.status(201).send({
      status:"success",
      data:job
    })
    }
);

exports.editJob = catchAsync(async (req, res, next) => {
  if (!req.params.id || req.params.id.length !== 24) {
    return next(new AppError("Please Provide Valid Id", 400));
  }
  const editJob = await Job.findOneAndUpdate(
    { _id: req.params.id },
    req.body,
    { new: true }
  );
  res.status(200).json({
    status: "success",
    message: "Updation Successfully",
    data: editJob,
  });
});

exports.getJob = catchAsync(async (req, res, next) => {
    if (!req.params.id || req.params.id.length !== 24) {
      return next(new AppError("Please Provide Valid Id", 400));
    }
    const job =await Job.findOne({ _id: req.params.id });
    if (!job) {
        throw new AppError("Job Not Found",404);
    }
    res.send({
        status:"success",
        data:{
            job
        }
    })
});

exports.getAllJob = catchAsync(async (req, res, next) => {
  var pageSize = parseInt(req.query.pagesize) || 5;
  var page = parseInt(req.query.page) || 1;
  let type = req.query.type === 'ASCE' ? 1 : -1;
  let field = req.query.field 
  let where = {};

  let sort ;
  if (field &&  field !== 'None') { sort = {}; sort[field]=type;}
  else{type= -1;}

  let queryStatus = req.query.status;
  if (queryStatus) {
    where.status = queryStatus;
  }
  if (queryStatus==='Delivered') {
    where.status = queryStatus;
    if(!sort) {
        sort = {
        delivery_time : -1
      }
      if(!field)field = 'delivery_time'
    }
  }
  if (!sort) {
    sort = {
      updatedAt: -1
    }
    if(!field)field = 'updatedAt'
  }
  if (req.query.driver_email) {
    where.driver_email = req.query.driver_email;
  }
  if (req.query.fromDate && req.query.toDate) {
    const fromDate = new Date(req.query.fromDate);
    const toDate = new Date(req.query.toDate);
    if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
      const startDate = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate() - 1, 16, 0));
      const endDate = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate(), 16, 0));
      if (where.status !== 'Delivered') {
        where.updatedAt = { $gte: startDate, $lte: endDate };
      } else {
        where.delivery_time = { $gte: startDate, $lte: endDate };
      }
    }
  }


  if(req.user.userRole=='driver'){
    where.driver_email = req.user.email;
    pageSize=100;
  }

  const joball = await Job.aggregate( [
  {
    $lookup:{
      from: 'goods',
      localField: 'goods_id',
      foreignField: '_id',
      as: 'goods',
      pipeline: [
          { $project:{
                  _id:0,
                  parcelID:1,
                  deliveryAddress:1,
                  invoiceNumber:1,
                  zipcode:1,
                  inv_temp:1,
                  invoice_no:1
                } 
        } 
      ]
  },    
},   
{
  $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$goods" , 0 ] }, "$$ROOT" ] }}
},{
  $set:{field:`$${field}`}
},
{
  $addFields: {
    lowercaseField: {
      $cond: {
        if: { $or: [{ $eq: [{ $type: "$field" }, "date"] }, { $eq: [{ $type: "$field" }, "long"] }] },
        then: "$field",
        else: {
          $cond: {
            if: { $or: [{ $eq: ["$field", ""] }, { $not: "$field" }] },
            then: "",
            else: {
              $cond: {
                if: { $regexMatch: { input: { $convert: { input: "$field", to: "string", onError: "", onNull: "" } }, regex: /^[0-9]+$/ } },
                then: { $toInt: "$field" },
                else: {
                  $cond: {
                    if: { $regexMatch: { input: { $convert: { input: "$field", to: "string", onError: "", onNull: "" } }, regex: /^[0-9 ]+$/ } },
                    then: { $toInt: { $trim: { input: { $convert: { input: "$field", to: "string" } } } } },
                    else: { $toLower: { $convert: { input: "$field", to: "string", onError: "", onNull: "" } } }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
},
{
  $sort: {
    lowercaseField: type  // 1 for ascending, -1 for descending
  }
},
{$match:where},
    { $project: { goods: 0,
      //  lowercaseField :0,field:0
      } },
{
  $facet: {
    metaData: [
      {
        $count: 'total',
      },
    ],
    records: [{ $skip: pageSize * (page-1) }, { $limit: pageSize }],
  },
},
]);

  if (!joball) {
    throw new AppError("Jobs Not Found",404);
  }else{
 
    joball[0].records.forEach((job) => {
      job.createdAt.setTime(job.createdAt.getTime() + 8 * 60 * 60 * 1000);
    });
  }
  res.send({
    status: "success",
    data: joball.length>0?joball[0].records:joball,
    total: joball.length>0?joball[0].metaData.length>0?joball[0].metaData[0].total:'':'',
  });
});

exports.jobFiltered = catchAsync(async (req, res, next) => {
  var pageSize = parseInt(req.query.pagesize) || 5;
  var page = parseInt(req.query.page) || 1;

  let where={};
  
  let queryStatus = req.query.status;

  if (queryStatus) {
    where.status = queryStatus;
  }

  if(req.query.fromDate && req.query.toDate){
      where.updatedAt = {
        $gte: new Date(new Date(req.query.fromDate).setHours(00, 00, 00)),
        $lte: new Date(new Date(req.query.toDate).setHours(23, 58, 00))
      }
  }

  if(req.query.driver_email){
    where.driver_email = req.query.driver_email
  }
  
  const joball = await Job.aggregate( [
  {
    $lookup:{
      from: 'goods',
      localField: 'goods_id',
      foreignField: '_id',
      as: 'goods',
      pipeline: [
          { $project:{
                  _id:0,
                  parcelID:1,
                  deliveryAddress:1,
                  invoiceNumber:1,
                  zipcode:1,
                  inv_temp:1
                } 
        } 
      ]
  },    
},   
{
  $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$goods" , 0 ] }, "$$ROOT" ] }}
},
{ $sort:{createdAt:-1}},
{$match:where},
{ $project: { goods:0, } },
{
  $facet: {
    metaData: [
      {
        $count: 'total',
      },
    ],
    records: [{ $skip: pageSize * (page-1) }, { $limit: pageSize }],
  },
},
]);

  if (!joball) {
    throw new AppError("Jobs Not Found",404);
  }

  res.send({
    status: "success",
    data: joball.length>0?joball[0].records:joball,
    total: joball.length>0?joball[0].metaData.length>0?joball[0].metaData[0].total:'':'',
  });
});

exports.deleteJob = catchAsync(async (req, res, next) => {
if (!req.params.id || req.params.id.length !== 24) {
  return next(new AppError("Please Provide Valid Id", 404));
}
const job =await Job.findOneAndDelete({ _id: req.params.id });

if (!job) {
  throw new AppError("Job Does Not Found",404);
}
  res.status(200).json({
    status: "success",
    message: "Job Deleted Successfully",
  });
});

exports.addDo = catchAsync(async (req, res, next) => {
  const jobs = req.body.jobs;
  const driver_id = req.body.driver_id;
  const driver = await User.findOne({ _id: driver_id });
  if (!driver) {
    throw new AppError("Driver Not Found", 404);
  }
    await Job.updateMany({ _id:{$in:jobs} },
      { $set: {
        driver_firstName : driver.firstName,
        driver_lastName: driver.lastName, 
        driver_vehicleNumber:driver.vehicleNumber,
        // driver_licenceNumber:driver.vehicleNumber,
        driver_governmentIDs:driver.governmentIDs,
        driver_email:driver.email,
        driver_phone:driver.phone,
        status : "Delivering"
      }},{multi:true,upsert: true,new: true});
  if (client && process.env.TWILIO_NUMBER && driver.phone) {
    client.messages
      .create({
        body: `Hi ${driver.firstName}, new delivery orders have been assigned to you. Check your app for details.`,
        from: process.env.TWILIO_NUMBER,
        to: driver.phone,
      })
      .then((message) => console.log("Twilio SMS sent:", message.sid))
      .catch((err) => {
        console.warn("Twilio SMS failed:", err.message || err.code);
      });
  }
  res.status(201).send({
    status: "success",
    message: "  Delivery Created SuccessFully",
  });
});

exports.changeDriver = catchAsync(async (req, res, next) => {
  const job = req.body.job_id;
  const driver_id = req.body.driver_id;
  const driver = await User.findOne({ _id: driver_id });
  if (!driver) {
    throw new AppError("Driver Not Found", 404);
  }
  await Job.findByIdAndUpdate(
    { _id: job },
    {
      $set: {
        driver_firstName: driver.firstName,
        driver_lastName: driver.lastName,
        driver_vehicleNumber: driver.vehicleNumber,
        // driver_licenceNumber: driver.vehicleNumber,
        driver_governmentIDs: driver.governmentIDs,
        driver_email: driver.email,
        driver_phone: driver.phone,
      },
    },
    { multi: true, upsert: true, new: true }
  );
  if (client && process.env.TWILIO_NUMBER && driver.phone) {
    client.messages
      .create({
        body: `Hi ${driver.firstName}, new delivery orders have been assigned to you. Check your app for details.`,
        from: process.env.TWILIO_NUMBER,
        to: driver.phone,
      })
      .then((message) => console.log("Twilio SMS sent:", message.sid))
      .catch((err) => {
        console.warn("Twilio SMS failed:", err.message || err.code);
      });
  }
  res.status(200).send({
    status: "success",
    message: "Driver Changed SuccessFully",
  });
});


/* exports.paymentStatus = catchAsync(async (req,res,next)=>{

  if(!req.body.jobid || req.body.jobid.length !== 24){
    return next(new AppError("Please Provide job id",400));
  }

  if(!req.body.hasOwnProperty('paid')){
    return next(new AppError("Please Provide paid or unpaid status",400));
  }

  const job = await Job.findById(req.body.jobid);

  if(!job){
    return next(new AppError("requested job not found",404));
  }

  job.paid = req.body.paid;

  job.save();

  res.status(200).send({
    status: "success",
    message: "Payment Status Changed SuccessFully",
  });

}); */

exports.delivered = catchAsync(async (req, res, next) => {
    const map_pinpoint_delivery = req.body.loc;
    if(!map_pinpoint_delivery.length){
      throw new AppError("Delivery Location not found", 404);
    }
    const job_id = req.body.job_id; 

    const job = await Job.findOne({_id:job_id});

    if(!job){
      throw new AppError('Delivery Order Not Found',404);
    }
    if(!job.sign && !job.photo_proof){
       throw new AppError("Please Upload Required proof first", 400);
    }
    await createPDFFromImages(job.do_number);
    job.status = "Delivered";
    job.map_pinpoint_delivery=map_pinpoint_delivery;
    let dd= new Date(job.updatedAt);  
    dd.setTime(dd.getTime() + 8 * 60 * 60 * 1000);
    job.delivery_time=dd;
    if(req.body.paid){
      job.paid=true;
    }
    await job.save();

    res.status(200).send({
      status: "success",
      message: "Order Delivered SuccessFully",
      data:job
    });
});

exports.updateInvoice =  catchAsync(async (req, res, next) => {
    const job = await Job.findOne({_id:req.body.job_id});
    if(!job){
      throw new AppError('Delivery Order Not Found',404);
    }

    job.invoice_no=req.body.invoice_no;

    await job.save();

    res.status(200).send({
      status: "success",
      message: "Invoice Updated SuccessFully",
    });
});

exports.invoice = catchAsync(async (req,res,next)=>{
  if (!req.body.job_id || req.body.job_id.length !== 24) {
    return next(new AppError("Please Provide Valid Job Id", 400));
  }
  const html = fs.readFileSync(path.join(__dirname, '../templates/invoice.html'), 'utf-8');
  const jobinvoice =  await Job.findOne({_id:req.body.job_id}).lean();
  if(!jobinvoice){
    throw new AppError("invoice not found", 404);
  }
  let time = "";
  time += jobinvoice.delivery_time.getUTCHours();
  time+=":"
  time += jobinvoice.delivery_time.getUTCMinutes();
  jobinvoice.delivery_time = jobinvoice.delivery_time
    .toISOString()
    .slice(0, 10);
  jobinvoice.createdAt.setTime(
    jobinvoice.createdAt.getTime() + 8 * 60 * 60 * 1000
  );
   jobinvoice.createdAt = jobinvoice.createdAt.toISOString().slice(0, 10);

  const do_number = jobinvoice.do_number;
  const filename =  'invoice'+'-'+do_number + '.pdf';
  const pdfpath = path.join(__dirname, `../../docs/${filename}`);
  const goodsAll = await Goods.findOne({_id:jobinvoice.goods_id}).lean();
const document = {
  html: html,
  data: {
    time,
    job: jobinvoice,
    good: goodsAll,
    customerSignUrl: `${UPLOAD_BASE_URL}/uploads/sign-${encodeURIComponent(do_number)}.png`,
  },
  path: "./docs/" + filename,
};

pdf.create(document, options)
  .then((data) => {
    const pdfBytes = fs.readFileSync(pdfpath);
    if (s3) {
      const params = {
        Bucket: "witco",
        Key: `uploads/invoice/invoice-${do_number}.pdf`,
        Body: pdfBytes,
        ACL: "public-read-write",
        ContentType: "application/pdf",
      };
      s3.putObject(params, (err, data) => {
        if (err) console.error("Error uploading PDF to S3:", err);
        else console.log("PDF uploaded to S3 successfully");
      });
    }
  })
.catch(error => {
    console.log(error);
  });

  if (jobinvoice.customer_email && jobinvoice.customer_email!=""){
  let myUser = {
     name: jobinvoice.customer_firstName,
     email: jobinvoice.customer_email,do_number:jobinvoice.do_number 
  };

  await new Email(myUser, "orderDelivered").orderDelivered(
    "orderdelivered",
    "Order Delivered Successfully"
  );
  }

  if (jobinvoice.customer_email2 && jobinvoice.customer_email2 != "") {
    let myUser = {
      name: jobinvoice.customer_firstName,
      email: jobinvoice.customer_email2, do_number: jobinvoice.do_number
    };

    await new Email(myUser, "orderDelivered").orderDelivered(
      "orderdelivered",
      "Order Delivered Successfully"
    );
  }

  deletePdf(pdfpath);
});
function deletePdf(filePath) {
  setTimeout(() => {
    try {
      fs.unlinkSync(filePath);
      console.log("file deleted");
    } catch (err) {
      return err;
    }
  }, 10000);
}
// function get_do_number(){
        
//   let key="Do-";
//   let dateObj = new Date();
//         let arr=[dateObj.getUTCMonth()+1,dateObj.getUTCDate(),dateObj.getHours(),dateObj.getMinutes(),dateObj.getSeconds()];
//         const year = dateObj.getUTCFullYear();
//         key+=(year%100);
//          arr.forEach((num) => {
//            if (num >= 0 && num <= 9) {
//              key += num;
//            } else if (num >= 10 && num <= 35) {
//              key += String.fromCharCode(65 + num - 10);
//            } else {
//              key += String.fromCharCode(97 + num - 36);
//            }
//          });
//         return key;
// }

// exports.nothing = catchAsync(async (req, res, next) => {

//   const jobs = await Job.find();
  
//   jobs.forEach(async  (job)=>{
//     const good = await Goods.findOne({_id:job.goods_id});
//     console.log(job._id)
//     job.customer_deliveryAddress = good.deliveryAddress;
//     console.log(job.customer_deliveryAddress, good.deliveryAddress)
//     await job.save();
//   })
//   res.send({
//     message:"dsd"
//   })

// });