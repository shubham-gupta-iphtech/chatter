const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const dbconnect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MONGO DB CONNECTED");
  } catch (error) {
    console.log("there was some error while connecting the database.");
  }
};

module.exports = dbconnect;
