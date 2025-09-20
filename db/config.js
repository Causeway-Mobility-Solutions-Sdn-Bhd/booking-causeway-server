const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGOOSE_CONNECTION);
    console.log("Db Connected");
  } catch (error) {
    console.error("MONGODB connection error", error);
    process.exit(1);
  }
};

module.exports = connectDB;
