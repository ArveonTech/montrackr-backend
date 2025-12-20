import express from "express";
import { verifyOwnership, verifyToken, verifyUser } from "../middleware/authMiddleware.js";
import Goal from "../models/goal.js";
import { GoalError } from "../helpers/errorHandler.js";
import Transaction from "../models/transaction.js";

const app = express();

app.use(express.json());

const goalsRoute = express.Router();

// add goal
goalsRoute.post(``, verifyToken, verifyUser, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const { dataGoal } = req.body;

    const chackGoalUser = await Goal.findOne({ user_id: dataUserDB._id });

    if (chackGoalUser)
      res.status(409).json({
        status: "success",
        code: 409,
        message: "The goal is there",
        data: {},
      });

    const resultAddGoal = await Goal.create({
      user_id: dataUserDB._id,
      title: dataGoal.title,
      targetGoal: Number(dataGoal.targetGoal),
      currentBalance: Number(dataGoal.currentBalance),
    });

    if (!resultAddGoal) throw new Error(`Failed to add goal`);

    const resultAddContributionToGoal = await Transaction.create({
      user_id: dataUserDB._id,
      amount: dataGoal.currentBalance,
      currency: dataUserDB.currency,
      type: "expense",
      category: null,
      date: null,
      paymentMethod: null,
      description: null,
      goalId: resultAddGoal._id,
      subsId: null,
    });

    if (!resultAddContributionToGoal) throw new Error(`Failed to add transaction goal`);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Add goal success",
      data: {},
    });
  } catch (error) {
    next(new GoalError(`Error add goal: ${error.message}`, 400));
  }
});

// get goal
goalsRoute.get(``, verifyToken, verifyUser, async (req, res, next) => {
  try {
    const { dataUserDB } = req;

    const resultGetGoal = await Goal.findOne({ user_id: dataUserDB._id });

    if (!resultGetGoal)
      res.status(404).json({
        status: "success",
        code: 404,
        message: "Goal not found",
        data: {},
      });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Get goal success",
      data: {
        items: resultGetGoal,
      },
    });
  } catch (error) {
    next(new GoalError(`Error get goal: ${error.message}`, 400));
  }
});

// update goal
goalsRoute.patch(``, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const { dataActionTransactions } = req.body;

    const resultUpdateGoalUser = await Goal.findOneAndUpdate(
      { user_id: dataUserDB._id },
      {
        title: dataActionTransactions.title,
        targetGoal: dataActionTransactions.targetGoal,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!resultUpdateGoalUser) throw new Error(`Failed to update goal user`);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Update goal user success",
      data: {
        items: resultUpdateGoalUser,
      },
    });
  } catch (error) {
    next(new TransactionsError(`Error update goal user: ${error.message}`, 400));
  }
});

// delete goal
goalsRoute.delete(``, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
  try {
    const { dataUserDB } = req;

    const resultDeleteGoalUser = await Goal.deleteOne({ user_id: dataUserDB._id });

    if (resultDeleteGoalUser.deletedCount === 0)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Failed to delete goal user",
      });

    const resultDeleteAllTransactionGoal = await Transaction.deleteMany({ user_id: dataUserDB._id });

    res.status(204).json({
      status: "success",
      code: 204,
      message: "Delete goal success",
      data: {},
    });
  } catch (error) {
    next(new TransactionsError(`Error delete goal: ${error.message}`, 400));
  }
});

// contribute goal
goalsRoute.patch(`/contribute`, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const { dataActionTransactions } = req.body;

    const resultAddContributionGoal = await Goal.findOneAndUpdate(
      { user_id: dataUserDB._id },
      { $inc: { currentBalance: dataActionTransactions.amount } },
      {
        new: true,
        runValidators: true,
      }
    );

    const resultAddTransactionContributionGoal = await Transaction.create({
      user_id: dataUserDB._id,
      amount: dataActionTransactions.amount,
      currency: dataUserDB.currency,
      type: "expense",
      category: null,
      date: null,
      paymentMethod: null,
      description: null,
      goalId: resultAddContributionGoal._id,
      subsId: null,
    });

    if (!resultAddTransactionContributionGoal) throw new Error(`Failed to add transaction goal`);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Contribute goal success",
      data: {
        items: resultAddContributionGoal,
      },
    });
  } catch (error) {
    next(new GoalError(`Error contribute goal: ${error.message}`, 400));
  }
});

// update transaction contribute goal
goalsRoute.patch(`/:id`, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
  try {
    const idTransactions = req.params.id;
    const { dataUserDB } = req;
    const { dataActionTransactions } = req.body;

    const dataTransactionsOldGoal = await Transaction.findById(idTransactions);

    const resultUpdateTransactionNewGoal = await Transaction.findOneAndUpdate(
      { _id: idTransactions, user_id: dataUserDB._id },
      {
        amount: dataActionTransactions.amount,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!resultUpdateTransactionNewGoal)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Failed to update transaction",
      });

    let resultActionGoalUser = null;

    if (dataTransactionsOldGoal.amount !== resultUpdateTransactionNewGoal.amount) {
      const delta = resultUpdateTransactionNewGoal.amount - dataTransactionsOldGoal.amount;

      resultActionGoalUser = await Goal.findOneAndUpdate({ user_id: dataUserDB._id }, { $inc: { currentBalance: delta } });
    }

    if (!resultActionGoalUser) throw new Error(`Error update goal`);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Update goal success",
      data: {
        items: resultUpdateTransactionNewGoal,
      },
    });
  } catch (error) {
    next(new TransactionsError(`Error update transactions: ${error.message}`, 400));
  }
});

// delete transaction contribute goal
goalsRoute.delete(`/:id`, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const idTransactions = req.params.id;
    const dataTransactions = await Transaction.findById(idTransactions);

    const resultDeleteTransactions = await Transaction.deleteOne({ _id: idTransactions, user_id: dataUserDB._id });

    if (resultDeleteTransactions.deletedCount === 0) throw new Error(`Failed to delete transaction goal`);

    const deleteBalanceGoal = await Goal.findOneAndUpdate(
      { user_id: dataUserDB._id },
      { $inc: { currentBalance: -dataTransactions.amount } },
      {
        new: true,
        runValidators: true,
      }
    );

    if (resultDeleteTransactions.deletedCount === 0) throw new Error(`Failed to delete amount goal in balance`);

    res.status(204).json({
      status: "success",
      code: 204,
      message: "Delete transactions goal success",
      data: {
        items: deleteBalanceGoal,
      },
    });
  } catch (error) {
    next(new GoalError(`Error delete transactions goal: ${error.message}`, 400));
  }
});
export default goalsRoute;
