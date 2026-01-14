import express from "express";
import { verifyToken, verifyUser, verifyOwnership, verifyBudgetExist } from "../middleware/authMiddleware.js";
import { BudgetError } from "../helpers/errorHandler.js";
import { validationBudget } from "../middleware/budgetMiddleware.js";
import Budget from "../models/budget.js";
import Transaction from "../models/transaction.js";
import { getMonthRange } from "../utils/getMonthRange.js";

const app = express();

app.use(express.json());

const budgetRoute = express.Router();

// add budget
budgetRoute.post(``, verifyToken, verifyUser, verifyOwnership, validationBudget, async (req, res, next) => {
  try {
    const { dataUserDB, dataTransactions } = req;

    const checkBudgetUser = await Budget.findOne({ user_id: dataUserDB._id });

    if (checkBudgetUser)
      return res.status(409).json({
        status: "error",
        code: 409,
        message: "The budget is there",
      });

    const resultAddBudget = await Budget.create({
      user_id: dataUserDB._id,
      categories: dataTransactions.categories,
    });

    if (!resultAddBudget) throw new Error(`Failed to add budget`);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Add budget success",
    });
  } catch (error) {
    next(new BudgetError(`Error add budget: ${error.message}`, 400));
  }
});

// get budget
budgetRoute.get(``, verifyToken, verifyUser, async (req, res, next) => {
  try {
    const { dataUserDB } = req;

    const dateNow = new Date();
    const year = dateNow.getFullYear();
    const monthComparassion = dateNow.getMonth();

    const dayInMonth = new Date(year, monthComparassion + 1, 0).getDate();

    const { startDate, endDate } = getMonthRange();
    const TransactionsMonthUser = await Transaction.find({ user_id: dataUserDB._id, type: { $ne: "goal" }, date: { $gte: startDate, $lte: endDate } });
    const resultGetBudget = await Budget.findOne({ user_id: dataUserDB._id });

    let amountExpenseMonth = 0;

    for (let i = 1; i <= dayInMonth; i++) {
      TransactionsMonthUser.forEach((transaction) => {
        const transactionDay = transaction.date.getDate();

        if (transactionDay === i) {
          if (transaction.type === "expense") {
            amountExpenseMonth += transaction.amount;
          }
        }
      });
    }

    if (!resultGetBudget) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Budget not created yet",
        data: {
          hasBudget: false,
          resultGetBudget: null,
          amountExpenseMonth,
        },
      });
    }

    return res.status(200).json({
      status: "success",
      code: 200,
      message: "Get budget success",
      data: {
        hasBudget: true,
        resultGetBudget,
        amountExpenseMonth,
      },
    });
  } catch (error) {
    next(new BudgetError(`Error get budget: ${error.message}`, 400));
  }
});

// update budget
budgetRoute.patch(``, verifyToken, verifyUser, verifyOwnership, verifyBudgetExist, validationBudget, async (req, res, next) => {
  try {
    const { dataUserDB, dataTransactions } = req;

    const resultUpdateBudgetUser = await Budget.findOneAndUpdate(
      { user_id: dataUserDB._id },
      {
        categories: dataTransactions.categories,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!resultUpdateBudgetUser) throw new Error(`Failed to update budget`);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Update goal user success",
      data: {
        items: resultUpdateBudgetUser,
      },
    });
  } catch (error) {
    next(new BudgetError(`Error update budget: ${error.message}`, 400));
  }
});

// delete budget
budgetRoute.delete(``, verifyToken, verifyUser, verifyOwnership, verifyBudgetExist, async (req, res, next) => {
  try {
    const { dataUserDB } = req;

    const resultSetBudgetDelete = await Budget.updateOne(
      { user_id: dataUserDB._id },
      {
        categories: {
          essentials: 0,
          lifestyle: 0,
          health: 0,
          "family & social": 0,
          financial: 0,
          others: 0,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (resultSetBudgetDelete.modifiedCount === 0)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Failed to delete budget",
      });

    res.status(204).json({
      status: "success",
      code: 204,
      message: "Delete budget success",
    });
  } catch (error) {
    next(new BudgetError(`Error delete budget: ${error.message}`, 400));
  }
});

export default budgetRoute;
