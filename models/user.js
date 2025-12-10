import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    username: { type: mongoose.Schema.Types.String, required: true },
    password: { type: mongoose.Schema.Types.String, required: true },
    email: { type: mongoose.Schema.Types.String, required: true },
    profile: { type: mongoose.Schema.Types.String, default: "profile-1" },
    balance: { type: mongoose.Schema.Types.Number, default: 0 },
    currency: { type: mongoose.Schema.Types.String, default: "IDR" },
    otp: { type: mongoose.Schema.Types.String, default: "" },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
