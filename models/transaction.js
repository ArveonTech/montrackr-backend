import mongoose from "mongoose";
const { Schema, model } = mongoose;

const transactionsSchema = new Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: { type: mongoose.Schema.Types.Int32, required: true },
    currency: { type: mongoose.Schema.Types.String, required: true },
    type: { type: mongoose.Schema.Types.String, required: true },
    category: { type: mongoose.Schema.Types.String, required: true },
    date: { type: mongoose.Schema.Types.Date, required: true },
    paymentMethod: { type: mongoose.Schema.Types.String, required: true },
    description: { type: mongoose.Schema.Types.String },
    goalId: { type: mongoose.Schema.Types.ObjectId },
    subsId: { type: mongoose.Schema.Types.ObjectId },
  },
  {
    timestamps: true,
  }
);

const Transactions = mongoose.model("Transactions", transactionsSchema);
export default Transactions;
