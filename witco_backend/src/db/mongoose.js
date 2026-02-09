const mongoose = require("mongoose");
require('dotenv').config()
mongoose
  .connect(
  process.env.DB,
    {
      useNewUrlParser: true,
      // useCreateIndex: true,
      // useFindAndModify: false,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connection Successful"));
