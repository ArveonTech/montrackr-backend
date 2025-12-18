import express from "express";
import { verifyOwnership, verifyToken, verifyUser } from "../middleware/authMiddleware.js";
import { TransactionsError } from "../helpers/errorHandler.js";
import Transactions from "../models/transaction.js";
import { validationTransactions } from "../middleware/transactionsMiddleware.js";
import { monthYearToISO } from "../helpers/monthYearToISO.js";
import { yearToISO } from "../helpers/yearToISO.js";

const app = express();

app.use(express.json());

const transactionsRoute = express.Router();

transactionsRoute.post(``, verifyToken, verifyUser, validationTransactions, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const dataTransactions = req.dataTransactions;

    const resultAddTransactions = await Transactions.create({
      user_id: dataUserDB._id,
      amount: dataTransactions.amount,
      currency: dataUserDB.currency,
      type: dataTransactions.type,
      category: dataTransactions.category,
      date: dataTransactions.date,
      paymentMethod: dataTransactions.paymentMethod,
      description: dataTransactions.description,
      goalId: null,
      subsId: null,
    });

    if (!resultAddTransactions) throw new Error(`Failed to add transaction`);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Add transactions success",
      data: {},
    });
  } catch (error) {
    next(new TransactionsError(`Error add transactions: ${error.message}`, 400));
  }
});

transactionsRoute.get(``, verifyToken, verifyUser, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const { filters } = req.body;
    const { type, category, date } = filters;

    let startDate = null;
    let endDate = null;

    if (date.month && date.year) {
      ({ startDate, endDate } = monthYearToISO(date.month, date.year));
    } else if (date.year) {
      ({ startDate, endDate } = yearToISO(date.year));
    }

    const query = {
      user_id: dataUserDB._id,
    };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    const resultFIlteringTransactions = await Transactions.find(query);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Get transactions success",
      data: {
        items: resultFIlteringTransactions,
      },
    });
  } catch (error) {
    next(new TransactionsError(`Error filtering transactions: ${error.message}`, 400));
  }
});

transactionsRoute.get(`/:id`, verifyToken, verifyUser, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const idTransactions = req.params.id;

    const resultGetTransactions = await Transactions.findOne({ _id: idTransactions, user_id: dataUserDB._id });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Add transactions success",
      data: {
        items: resultGetTransactions,
      },
    });
  } catch (error) {
    next(new TransactionsError(`Error get transactions: ${error.message}`, 400));
  }
});

transactionsRoute.patch(`/:id`, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
  try {
    const idTransactions = req.params.id;
    const { dataActionTransactions } = req.body;
    const { dataUserDB } = req.dataUserDB;

    const resultUpdateTransactions = await Transactions.findOneAndUpdate(
      { _id: idTransactions, user_id: dataUserDB._id },
      {
        amount: dataActionTransactions.amount,
        type: dataActionTransactions.type,
        category: dataActionTransactions.category,
        paymentMethod: dataActionTransactions.paymentMethod,
        date: dataActionTransactions.date,
        description: dataActionTransactions.description,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!resultUpdateTransactions)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Failed to update transaction",
      });

    console.info(resultUpdateTransactions);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Update transactions success",
      data: {
        items: resultUpdateTransactions,
      },
    });
  } catch (error) {
    next(new TransactionsError(`Error update transactions: ${error.message}`, 400));
  }
});

transactionsRoute.delete(`/:id`, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const idTransactions = req.params.id;

    const resultDeleteTransactions = await Transactions.deleteOne({ _id: idTransactions, user_id: dataUserDB._id });

    if (resultDeleteTransactions.deletedCount === 0)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Failed to delete transaction",
      });

    res.status(204).json({
      status: "success",
      code: 204,
      message: "Delete transactions success",
      data: {
        items: resultDeleteTransactions,
      },
    });
  } catch (error) {
    next(new TransactionsError(`Error delete transactions: ${error.message}`, 400));
  }
});

export default transactionsRoute;
