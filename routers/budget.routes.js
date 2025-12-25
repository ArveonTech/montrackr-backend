import express from "express";
import { verifyToken, verifyUser, verifyOwnership, verifyBudgetExist } from "../middleware/authMiddleware.js";
import { BudgetError } from "../helpers/errorHandler.js";
import { validationBudget } from "../middleware/budgetMiddleware.js";
import Budget from "../models/budget.js";

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

    const resultGetBudget = await Budget.findOne({ user_id: dataUserDB._id });

    if (!resultGetBudget)
      return res.status(404).json({
        status: "success",
        code: 404,
        message: "Budget not found",
      });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Get budget success",
      data: {
        items: resultGetBudget,
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
