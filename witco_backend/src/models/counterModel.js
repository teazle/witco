const mongoose = require("mongoose");

const CounterSchema = new mongoose.Schema({
    value: {
      type: Number,
      required: true,
    },
  });
  
  const Counter = mongoose.model('Counter', CounterSchema);
  module.exports = Counter;
  