import express from "express";
import { verifyOwnership, verifyToken, verifyUser } from "../middleware/authMiddleware.js";
import { TransactionsError } from "../helpers/errorHandler.js";
import Transaction from "../models/transaction.js";
import { validationTransactions } from "../middleware/transactionMiddleware.js";
import { monthYearToISO } from "../helpers/monthYearToISO.js";
import { yearToISO } from "../helpers/yearToISO.js";
import User from "../models/user.js";
import { rollbackBalance } from "../controllers/transactionControllers.js";

const app = express();

app.use(express.json());

const transactionsRoute = express.Router();

// add transactions
transactionsRoute.post(``, verifyToken, verifyUser, validationTransactions, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const dataTransactions = req.dataTransactions;

    const resultAddTransactions = await Transaction.create({
      user_id: dataUserDB._id,
      title: dataTransactions.title,
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

    const resultActionBalanceUser = await User.findByIdAndUpdate(dataUserDB._id, { $inc: { balance: dataTransactions.type === "income" ? +Number(dataTransactions.amount) : -Number(dataTransactions.amount) } });

    if (!resultActionBalanceUser) throw new Error(`Failed to add balance`);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Add transactions success",
      data: {},
    });
  } catch (error) {
    next(new TransactionsError(`Error add transaction: ${error.message}`, 400));
  }
});

//get transactions filter
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
      query.date = {
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

    const resultFIlteringTransaction = await Transaction.find(query);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Get transaction success",
      data: {
        items: resultFIlteringTransaction,
      },
    });
  } catch (error) {
    next(new TransactionsError(`Error filtering transaction: ${error.message}`, 400));
  }
});

// get one transactions
transactionsRoute.get(`/:id`, verifyToken, verifyUser, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const idTransactions = req.params.id;

    const resultGetTransaction = await Transaction.findOne({ _id: idTransactions, user_id: dataUserDB._id });

    if (!resultGetTransaction)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Transaction not found",
      });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Add transaction success",
      data: {
        items: resultGetTransaction,
      },
    });
  } catch (error) {
    next(new TransactionsError(`Error get transaction: ${error.message}`, 400));
  }
});

// update transactions
transactionsRoute.patch(`/:id`, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
  try {
    const idTransactions = req.params.id;
    const dataUserDB = req.dataUserDB;

    const { dataActionTransactions } = req.body;
    const dataOld = await Transaction.findById(idTransactions);

    if (!dataOld)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Transaction not found",
      });

    const resultUpdateTransaction = await Transaction.findOneAndUpdate(
      { _id: idTransactions, user_id: dataUserDB._id },
      {
        title: dataActionTransactions.title,
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

    if (!resultUpdateTransaction) throw new Error(`Failed to update transaction`);

    let resultActionBalanceUser = null;

    if (dataOld.amount !== resultUpdateTransaction.amount || dataOld.type !== resultUpdateTransaction.type) {
      if (dataOld.type !== resultUpdateTransaction.type) {
        rollbackBalance(dataUserDB._id, resultUpdateTransaction.type, dataOld.type, dataOld.amount, resultUpdateTransaction.amount);
      } else {
        const delta = resultUpdateTransaction.amount - dataOld.amount;

        resultActionBalanceUser = await User.findByIdAndUpdate(
          dataUserDB._id,
          { $inc: { balance: resultUpdateTransaction.type === "income" ? +delta : -delta } },
          {
            new: true,
            runValidators: true,
          }
        );

        if (!resultActionBalanceUser) throw new Error(`Failed to update balance for transactions`);
      }
    }

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Update transaction success",
      data: {
        items: resultUpdateTransaction,
      },
    });
  } catch (error) {
    next(new TransactionsError(`Error update transaction: ${error.message}`, 400));
  }
});

// delete transactions
transactionsRoute.delete(`/:id`, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const idTransactions = req.params.id;
    const dataTransactions = await Transaction.findById(idTransactions);

    if (!dataTransactions)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Transaction not found",
      });

    const amountTransactions = dataTransactions.amount;

    const resultDeleteTransactions = await Transaction.deleteOne({ _id: idTransactions, user_id: dataUserDB._id });

    if (resultDeleteTransactions.deletedCount === 0) throw new Error(`Failed to delete transaction`);

    const deleteBalance = await User.findByIdAndUpdate(dataUserDB._id, { $inc: { balance: dataTransactions.type === "income" ? -amountTransactions : +amountTransactions } });

    if (deleteBalance.deletedCount === 0) throw new Error(`Failed to delete amount transaction in balance`);

    res.status(204).json({
      status: "success",
      code: 204,
      message: "Delete transaction success",
      data: {
        items: resultDeleteTransactions,
      },
    });
  } catch (error) {
    next(new TransactionsError(`Error delete transaction: ${error.message}`, 400));
  }
});

export default transactionsRoute;
