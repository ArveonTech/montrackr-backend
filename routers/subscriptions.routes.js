import express from "express";
import { verifyOwnership, verifyToken, verifyUser } from "../middleware/authMiddleware.js";
import { SubscriptionError } from "../helpers/errorHandler.js";
import Transaction from "../models/transaction.js";
import { validationTransactionsSubcriptions } from "../middleware/subscriptionMiddleware.js";
import Subscription from "../models/subscription.js";
import { nextPayment } from "../utils/nextPayment.js";

const app = express();

app.use(express.json());

const subscriptionsRoute = express.Router();

// add subscription
subscriptionsRoute.post(``, verifyToken, verifyUser, validationTransactionsSubcriptions, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const { dataTransactions } = req.dataTransactions;

    const resultAddSubscription = await Subscription.create({
      user_id: dataUserDB._id,
      title: dataTransactions.title,
      amount: dataTransactions.amount,
      currency: dataUserDB.currency,
      interval: dataTransactions.interval,
      date: dataTransactions.date,
      paymentMethod: dataTransactions.paymentMethod,
      nextPayment: nextPayment(dataTransactions.interval, dataTransactions.date),
      status: "active",
    });

    if (!resultAddGoal) throw new Error(`Failed to add subscription`);

    const resultAddTransactionSubscription = await Transaction.create({
      user_id: dataUserDB._id,
      amount: dataGoal.currentBalance,
      currency: dataUserDB.currency,
      type: "expense",
      category: null,
      date: null,
      paymentMethod: resultAddSubscription.paymentMethod,
      description: null,
      goalId: null,
      subsId: resultAddSubscription._id,
    });

    if (!resultAddTransactionSubscription) throw new Error(`Failed to add transaction subscription`);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Add subscription success",
      data: {},
    });
  } catch (error) {
    next(new SubscriptionError(`Error add subscription: ${error.message}`, 400));
  }
});

// get  all subscription
subscriptionsRoute.get(``, verifyToken, verifyUser, async (req, res, next) => {
  try {
    const { dataUserDB } = req;

    const resultGetAllSubscription = await Subscription.find({ user_id: dataUserDB._id });

    if (!resultGetAllSubscription)
      res.status(404).json({
        status: "error",
        code: 404,
        message: "Subscriptions not found",
      });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Get subscriptions success",
      data: {
        items: resultGetAllSubscription,
      },
    });
  } catch (error) {
    next(new SubscriptionError(`Error get subscriptions: ${error.message}`, 400));
  }
});

// get subscription
subscriptionsRoute.get(`/:id`, verifyToken, verifyUser, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const subscriptionId = req.params.id;

    const resultGetSubscription = await Subscription.findOne({ _id: subscriptionId, user_id: dataUserDB._id });

    if (!resultGetSubscription)
      res.status(404).json({
        status: "error",
        code: 404,
        message: "subscription not found",
      });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Get all subscription success",
      data: {
        items: resultGetSubscription,
      },
    });
  } catch (error) {
    next(new SubscriptionError(`Error get subscription: ${error.message}`, 400));
  }
});

// update subscription
subscriptionsRoute.patch(`/:id`, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const { dataActionTransactions } = req.body;
    const subscriptionId = req.params.id;

    const resultUpdateSubscription = await Subscription.findOneAndUpdate(
      { _id: subscriptionId, user_id: dataUserDB._id },
      {
        title: dataActionTransactions.title,
        amount: dataActionTransactions.amount,
        interval: dataActionTransactions.interval,
        paymentMethod: dataActionTransactions.paymentMethod,
        nextPayment: nextPayment(dataActionTransactions.interval),
        status: dataActionTransactions.status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!resultUpdateSubscription) throw new Error(`Failed to update subscription`);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Update subscription success",
      data: {
        items: resultUpdateSubscription,
      },
    });
  } catch (error) {
    next(new TransactionsError(`Error update subscription: ${error.message}`, 400));
  }
});

// delete subscription
subscriptionsRoute.delete(`/:id`, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
  try {
    const { dataUserDB } = req;

    const resultDeleteSubscription = await Subscription.deleteOne({ user_id: dataUserDB._id });

    if (resultDeleteSubscription.deletedCount === 0)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Failed to delete subscription",
      });

    res.status(204).json({
      status: "success",
      code: 204,
      message: "Delete subscription success",
      data: {},
    });
  } catch (error) {
    next(new TransactionsError(`Error delete subscription: ${error.message}`, 400));
  }
});

export default subscriptionsRoute;
