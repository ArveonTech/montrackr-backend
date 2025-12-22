import mongoose from "mongoose";
const { Schema, model } = mongoose;

const subscriptionSchema = new Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: mongoose.Schema.Types.String, required: true },
    amount: { type: mongoose.Schema.Types.Int32, required: true },
    currency: { type: mongoose.Schema.Types.String },
    interval: { type: mongoose.Schema.Types.String, required: true },
    paymentMethod: { type: mongoose.Schema.Types.String },
    date: { type: mongoose.Schema.Types.Date },
    nextPayment: { type: mongoose.Schema.Types.Date, required: true },
    status: { type: mongoose.Schema.Types.String },
  },
  {
    timestamps: true,
  }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
