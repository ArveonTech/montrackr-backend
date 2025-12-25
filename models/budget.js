import mongoose from "mongoose";
const { Schema, model } = mongoose;

const BudgetSchema = new Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    categories: {
      essentials: { type: Number, required: true },
      lifestyle: { type: Number, required: true },
      health: { type: Number, required: true },
      "family & social": { type: Number, required: true },
      financial: { type: Number, required: true },
      others: { type: Number, required: true },
    },
  },
  {
    timestamps: true,
  }
);

const Budget = mongoose.model("Budget", BudgetSchema);
export default Budget;
