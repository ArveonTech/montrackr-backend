import mongoose from "mongoose";
import dotenv from "dotenv";
import { DatabaseError } from "../helpers/errorHandler.js";

dotenv.config({ path: "./env/.env" });

const uri = process.env.MONGO_URL;

mongoose.connection.on("connected", () => console.log("MongoDB Connected"));
mongoose.connection.on("disconnected", () => console.log("MongoDB Disconnected"));
mongoose.connection.on("error", (error) => console.log("MongoDB Error", error));

export const connectDB = async () => {
  try {
    await mongoose.connect(uri);
  } catch (error) {
    throw new DatabaseError("DatabaseError", 500);
  }
};
