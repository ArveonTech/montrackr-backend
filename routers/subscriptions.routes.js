import express from "express";
import { SubscriptionError } from "../helpers/errorHandler.js";
import Transaction from "../models/transaction.js";
import { getNextPaymentDate, validationTransactionsSubcriptions, validationUpdateTransactionsSubcriptions } from "../middleware/subscriptionMiddleware.js";
import Subscription from "../models/subscription.js";
import { verifyOwnership, verifySubscriptionExist, verifyToken, verifyUser } from "../middleware/authMiddleware.js";
import { nextPayment } from "../utils/nextPayment.js";
import User from "../models/user.js";

const app = express();

app.use(express.json());

const subscriptionsRoute = express.Router();

// add subscription
subscriptionsRoute.post(``, verifyToken, verifyUser, verifyOwnership, validationTransactionsSubcriptions, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const dataTransactions = req.dataTransactions;

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

    if (!resultAddSubscription) throw new Error(`Failed to add subscription`);

    const resultAddTransactionSubscription = await Transaction.create({
      user_id: dataUserDB._id,
      title: resultAddSubscription.title,
      amount: resultAddSubscription.amount,
      currency: dataUserDB.currency,
      type: "expense",
      category: "financial",
      date: resultAddSubscription.date,
      paymentMethod: resultAddSubscription.paymentMethod,
      description: null,
      goalId: null,
      subsId: resultAddSubscription._id,
    });

    if (!resultAddTransactionSubscription) throw new Error(`Failed to add transaction subscription`);

    const resultActionBalanceUser = await User.findByIdAndUpdate(dataUserDB._id, { $inc: { balance: -dataTransactions.amount } });

    if (!resultActionBalanceUser) throw new Error(`Failed to reduce balance`);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Add subscription success",
    });
  } catch (error) {
    next(new SubscriptionError(`Error add subscription: ${error.message}`, 400));
  }
});

// get  all subscription
subscriptionsRoute.get(``, verifyToken, verifyUser, async (req, res, next) => {
  try {
    const { dataUserDB } = req;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const startIndexPage = (page - 1) * limit;
    let limitPage = 0;

    if (isNaN(limit) || limit > 10 || limit < 1) {
      limitPage = 10;
    } else {
      limitPage = limit;
    }

    const resultGetAllSubscription = await Subscription.find({ user_id: dataUserDB._id }).skip(startIndexPage).limit(limitPage);
    const countTransactions = await Subscription.countDocuments({ user_id: dataUserDB._id });

    if (!resultGetAllSubscription)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Subscriptions not found",
      });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Get subscriptions success",
      data: {
        total: countTransactions,
        page,
        limit: limitPage,
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
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "subscription not found",
      });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Get subscription success",
      data: {
        items: resultGetSubscription,
      },
    });
  } catch (error) {
    next(new SubscriptionError(`Error get subscription: ${error.message}`, 400));
  }
});

// update subscription
subscriptionsRoute.patch(`/:id`, verifyToken, verifyUser, verifyOwnership, verifySubscriptionExist, validationUpdateTransactionsSubcriptions, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const dataTransactions = req.dataTransactions;
    const subscriptionId = req.params.id;

    const subscriptionOld = await Subscription.findOne({ _id: subscriptionId, user_id: dataUserDB._id });

    if (subscriptionOld.status === "canceled")
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Subscription status is inactive",
      });

    let resultUpdateSubscription = null;

    if (dataTransactions.date !== subscriptionOld.date || dataTransactions.interval !== subscriptionOld.interval) {
      resultUpdateSubscription = await Subscription.findOneAndUpdate(
        { _id: subscriptionId, user_id: dataUserDB._id },
        {
          title: dataTransactions.title,
          amount: dataTransactions.amount,
          interval: dataTransactions.interval,
          date: dataTransactions.date,
          nextPayment: nextPayment(dataTransactions.interval, dataTransactions.date || new Date()),
          paymentMethod: dataTransactions.paymentMethod,
          status: dataTransactions.status,
        },
        {
          new: true,
          runValidators: true,
        },
      );
    } else {
      resultUpdateSubscription = await Subscription.findOneAndUpdate(
        { _id: subscriptionId, user_id: dataUserDB._id },
        {
          title: dataTransactions.title,
          amount: dataTransactions.amount,
          paymentMethod: dataTransactions.paymentMethod,
          status: dataTransactions.status,
        },
        {
          new: true,
          runValidators: true,
        },
      );
    }

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
    next(new SubscriptionError(`Error update subscription: ${error.message}`, 400));
  }
});

// subscription payment
subscriptionsRoute.patch(`/payment/:id`, verifyToken, verifyUser, verifyOwnership, verifySubscriptionExist, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const subscriptionId = req.params.id;

    const subscriptionDetail = await Subscription.findById(subscriptionId);

    if (subscriptionDetail.status !== "active")
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Subscription status is inactive",
      });

    const resultReduceUserBalance = await User.findOneAndUpdate(
      { _id: dataUserDB._id },
      { $inc: { balance: -subscriptionDetail.amount } },
      {
        new: true,
        runValidators: true,
      },
    );

    const resultPaymentSubscription = await Subscription.findOneAndUpdate(
      { _id: subscriptionId, user_id: dataUserDB._id },
      { nextPayment: getNextPaymentDate(subscriptionDetail.nextPayment, subscriptionDetail.interval) },
      {
        new: true,
        runValidators: true,
      },
    );
    const dateNow = new Date();

    const resultAddTransactionPaymentSubscription = await Transaction.create({
      user_id: dataUserDB._id,
      title: subscriptionDetail.title,
      amount: subscriptionDetail.amount,
      currency: dataUserDB.currency,
      type: "expense",
      category: "financial",
      date: new Date(Date.UTC(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate())),
      paymentMethod: subscriptionDetail.paymentMethod,
      description: null,
      goalId: null,
      subsId: subscriptionDetail._id,
    });

    if (!resultAddTransactionPaymentSubscription) throw new Error(`Failed to add transaction subscription`);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Payment subscription success",
    });
  } catch (error) {
    next(new SubscriptionError(`Error payment subscription: ${error.message}`, 400));
  }
});

// delete subscription
subscriptionsRoute.delete(`/:id`, verifyToken, verifyUser, verifyOwnership, verifySubscriptionExist, async (req, res, next) => {
  try {
    const { dataUserDB } = req;

    const resultDeleteSubscription = await Subscription.findOneAndUpdate({ _id: req.params.id, user_id: dataUserDB._id }, { status: "canceled", endedAt: new Date() });

    if (resultDeleteSubscription.deletedCount === 0)
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Failed to cancel subscription",
      });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Cancel subscription success",
    });
  } catch (error) {
    next(new SubscriptionError(`Error cancel subscription: ${error.message}`, 400));
  }
});

export default subscriptionsRoute;
