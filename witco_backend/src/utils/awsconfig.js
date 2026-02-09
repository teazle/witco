require("dotenv").config();
const hasAws =
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_SECRET;
if (hasAws) {
  const AWS = require("aws-sdk");
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
    region: "ap-southeast-1",
  });
  module.exports = new AWS.S3();
} else {
  module.exports = null;
}
