const Counter = require("../models/counterModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

 async function get_do(){ 
    try{
        const counter = await Counter.findOne(); 
        if (!counter) {
            const countnew = new Counter({ value: 1 }); // Replace with your desired initial value
            await countnew.save();
            return 1;
        }    
        counter.value += 1; // Increment the static number
        await counter.save();
        return counter.value;
    }catch(err){
        console.log(err);
    }    
        
  }
  module.exports = get_do;