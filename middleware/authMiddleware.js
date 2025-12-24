import { authenticateToken } from "../helpers/authHelper.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Transaction from "../models/transaction.js";
import Goal from "../models/goal.js";
import Subscription from "../models/subscription.js";

export const verifyToken = (req, res, next) => {
  // ambil access token di header
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader && authHeader.split(" ")[1];

  const refreshToken = req.cookies["refresh-token"];
  if (!accessToken && !refreshToken) return res.status(403).json({ message: "No token provided" });

  const result = authenticateToken(accessToken, refreshToken);

  if (result.success === false) return res.status(401).json({ message: result.error });

  if (result.status === "refresh") {
    req.status = "refresh";
    req.refreshToken = result.refreshToken;
    req.accessToken = result.accessToken;
    req.user = jwt.decode(result.accessToken);
  } else if (result.status === "ok") {
    req.status = "ok";
    req.user = result.payload;
  }

  next();
};

export const verifyUser = async (req, res, next) => {
  const { user } = req;

  if (!user)
    return res.status(404).json({
      status: "error",
      code: 404,
      message: "Data not found",
    });

  const dataUserDB = await User.findById(user._id);

  if (!dataUserDB)
    return res.status(404).json({
      status: "error",
      code: 404,
      message: "User not found",
      data: {
        otp: false,
      },
    });

  req.dataUserDB = dataUserDB;

  next();
};

export const verifyOwnership = async (req, res, next) => {
  const { user } = req;
  const { dataTransactions } = req.body;

  if (user._id !== dataTransactions.user_id)
    return res.status(403).json({
      status: "error",
      code: 403,
      message: "You don't have access",
    });

  next();
};

export const userByID = async (req, res, next) => {
  try {
    const { dataUser } = req.body;

    if (!dataUser)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Data not found",
      });

    const dataUserDB = await User.findById(dataUser._id);

    if (!dataUserDB)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "User not found",
        data: {
          otp: false,
        },
      });

    req.dataUserDB = dataUserDB;

    next();
  } catch (error) {
    next(new Error(`Error search user by id: ${error.message}`));
  }
};

export const userByEmail = async (req, res, next) => {
  try {
    const { dataUser } = req.body;
    const { email, token, ...rest } = dataUser;

    const dataUserDB = await User.findOne({ email });

    if (!dataUserDB)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "User not found",
        data: {
          otp: false,
        },
      });

    req.dataUserDB = dataUserDB;

    next();
  } catch (error) {
    next(new Error(`Error search user by email: ${error.message}`));
  }
};

export const verifyGoalExist = async (req, res, next) => {
  try {
    const { dataUserDB } = req;

    const resultGetGoal = await Goal.findOne({ user_id: dataUserDB._id, status: "active" });

    if (!resultGetGoal)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Goal not found",
      });

    next();
  } catch (error) {
    next(new Error(`Error verify goal exist: ${error.message}`));
  }
};

export const verifyTransactionGoalExist = async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const goalId = req.params.id;

    const resultTransactionGetGoal = await Transaction.findOne({ _id: goalId, user_id: dataUserDB._id });

    if (!resultTransactionGetGoal)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Transaction goal not found",
      });

    next();
  } catch (error) {
    next(new Error(`Error verify transaction goal exist: ${error.message}`));
  }
};

export const verifySubscriptionExist = async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const subscriptionId = req.params.id;

    const resultGetSubscription = await Subscription.findOne({ _id: subscriptionId, user_id: dataUserDB._id });

    if (!resultGetSubscription)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Subscription not found",
      });

    next();
  } catch (error) {
    next(new Error(`Error verify subscription exist: ${error.message}`));
  }
};
