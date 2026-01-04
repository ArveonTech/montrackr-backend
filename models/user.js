import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    username: { type: mongoose.Schema.Types.String, required: true },
    password: { type: mongoose.Schema.Types.String, required: true },
    email: { type: mongoose.Schema.Types.String, required: true },
    profile: { type: mongoose.Schema.Types.String },
    balance: { type: mongoose.Schema.Types.Int32 },
    currency: { type: mongoose.Schema.Types.String },
    isVerified: { type: mongoose.Schema.Types.Boolean },
    secret: { type: mongoose.Schema.Types.String },
    otp: { type: mongoose.Schema.Types.String },
    otpExpiredAt: { type: mongoose.Schema.Types.Date },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
