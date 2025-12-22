import mongoose from "mongoose";
const { Schema, model } = mongoose;

const goalSchema = new Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: mongoose.Schema.Types.String, required: true },
    status: { type: mongoose.Schema.Types.String, required: true },
    currency: { type: mongoose.Schema.Types.String, required: true },
    targetGoal: { type: mongoose.Schema.Types.Int32, required: true },
    currentBalance: { type: mongoose.Schema.Types.Int32, required: true },
  },
  {
    timestamps: true,
  }
);

const Goal = mongoose.model("Goal", goalSchema);
export default Goal;
