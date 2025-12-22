import mongoose from "mongoose";
const { Schema, model } = mongoose;

const transactionSchema = new Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: mongoose.Schema.Types.String, required: true },
    amount: { type: mongoose.Schema.Types.Int32, required: true },
    currency: { type: mongoose.Schema.Types.String, required: true },
    type: { type: mongoose.Schema.Types.String, required: true },
    category: { type: mongoose.Schema.Types.String },
    date: { type: mongoose.Schema.Types.Date },
    paymentMethod: { type: mongoose.Schema.Types.String },
    description: { type: mongoose.Schema.Types.String },
    goalId: { type: mongoose.Schema.Types.ObjectId },
    subsId: { type: mongoose.Schema.Types.ObjectId },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
