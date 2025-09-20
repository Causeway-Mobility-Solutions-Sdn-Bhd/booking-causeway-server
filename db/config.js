import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGOOSE_CONNECTION}`).then(() => {
      console.log("Db Connected")
    })
  } catch (error) {
    console.log("MONGODB connection error", error);
    process.exit(1);
  }
};