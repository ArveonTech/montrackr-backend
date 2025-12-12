import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    username: { type: mongoose.Schema.Types.String, required: true },
    password: { type: mongoose.Schema.Types.String, required: true },
    email: { type: mongoose.Schema.Types.String, required: true },
    profile: { type: mongoose.Schema.Types.String },
    balance: { type: mongoose.Schema.Types.Number },
    currency: { type: mongoose.Schema.Types.String },
    isVerified: { type: mongoose.Schema.Types.Boolean },
    secret: { type: mongoose.Schema.Types.String },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
