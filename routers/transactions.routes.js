import express from "express";
import { verifyOwnership, verifyToken, verifyUser } from "../middleware/authMiddleware.js";
import { TransactionsError } from "../helpers/errorHandler.js";
import Transaction from "../models/transaction.js";
import { validationTransactions } from "../middleware/transactionMiddleware.js";
import { monthYearToISO } from "../helpers/monthYearToISO.js";
import { yearToISO } from "../helpers/yearToISO.js";
import User from "../models/user.js";
import { rollbackBalance } from "../controllers/transactionControllers.js";
import ExcelJS from "exceljs";
import { formatDate } from "../utils/normalizeDate.js";

const app = express();

app.use(express.json());

const transactionsRoute = express.Router();

// add transactions
transactionsRoute.post(``, verifyToken, verifyUser, verifyOwnership, validationTransactions, async (req, res, next) => {
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
    });
  } catch (error) {
    next(new TransactionsError(`Error add transaction: ${error.message}`, 400));
  }
});

//get transactions filter
transactionsRoute.get(``, verifyToken, verifyUser, async (req, res, next) => {
  try {
    const { dataUserDB } = req;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const searchQuery = req.query.searchQuery || "";
    const type = req.query.type || "";
    const category = req.query.category || "";

    const month = req.query.month || "";
    const year = req.query.year || "";

    const sortBy = req.query.sortBy || "latest";

    let startDate = null;
    let endDate = null;

    const startIndexPage = (page - 1) * limit;
    let limitPage = 0;

    if (isNaN(limit) || limit > 10 || limit < 1) {
      limitPage = 10;
    } else {
      limitPage = limit;
    }

    if (month && year) {
      ({ startDate, endDate } = monthYearToISO(month, year));
    } else if (year) {
      ({ startDate, endDate } = yearToISO(year));
    }

    const sort = {};

    const query = {
      user_id: dataUserDB._id,
    };

    if (searchQuery) {
      query.title = new RegExp(searchQuery, "i");
    }

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

    if (sortBy === "oldest") {
      sort.updatedAt = 1;
    } else if (sortBy === "latest") {
      sort.updatedAt = -1;
    }

    const resultFIlteringTransaction = await Transaction.find(query).sort(sort).skip(startIndexPage).limit(limitPage);
    const countTransactions = await Transaction.countDocuments(query);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Get transaction success",
      data: {
        total: countTransactions,
        page,
        limit: limitPage,
        items: resultFIlteringTransaction,
      },
    });
  } catch (error) {
    next(new TransactionsError(`Error filtering transaction: ${error.message}`, 400));
  }
});

// get export
transactionsRoute.get(`/export`, verifyToken, verifyUser, async (req, res, next) => {
  try {
    const { dataUserDB } = req;

    const yearNow = new Date().getFullYear();
    const defaultStartRangeQuery = new Date(yearNow, 0, 1, 0, 0, 0, 0);
    const defaultEndRangeQuery = new Date(yearNow, 11, 31, 23, 59, 59, 999);

    const startRangeQuery = req.query.startRange || defaultStartRangeQuery;
    const endRangeQuery = req.query.endRange || defaultEndRangeQuery;

    const dateStartMonth = new Date(startRangeQuery).getFullYear() * 12 + new Date(startRangeQuery).getMonth();
    const dateEndMonth = new Date(endRangeQuery).getFullYear() * 12 + new Date(endRangeQuery).getMonth();

    const monthDifference = dateEndMonth - dateStartMonth;

    if (monthDifference < 0)
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "start date must be earlier than end date",
      });

    let query = {
      user_id: dataUserDB._id,
    };

    if (startRangeQuery && endRangeQuery) {
      query.date = {
        $gte: new Date(startRangeQuery),
        $lte: new Date(endRangeQuery),
      };
    }

    const TransactionsUser = await Transaction.find(query);

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet("MontTrackr");

    worksheet.columns = [
      { header: "Title", key: "title", width: 30 },
      { header: "Amount", key: "amount", width: 20 },
      { header: "Currency", key: "currency", width: 10 },
      { header: "Type", key: "type", width: 20 },
      { header: "Category", key: "category", width: 20 },
      { header: "Date", key: "date", width: 20 },
      { header: "Payment Method", key: "paymentMethod", width: 30 },
      { header: "Description", key: "description", width: 70 },
    ];

    TransactionsUser.forEach((transaction) => {
      const resultNormalizeDate = formatDate(transaction.date);

      const dataTransaction = {
        title: transaction.title,
        amount: transaction.amount,
        currency: transaction.currency,
        type: transaction.type,
        category: transaction.category,
        date: resultNormalizeDate,
        paymentMethod: transaction.paymentMethod,
        description: transaction.description,
      };

      const row = worksheet.addRow(dataTransaction);

      worksheet.getColumn(2).numFmt = "[$Rp-421]* #,##0";
      worksheet.getColumn(3).alignment = { horizontal: "center", vertical: "middle" };

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1) {
        if (rowNumber % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF0F0F0" },
            };
          });
        }
      }
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=MontTrackr.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.info(error);
    next(new TransactionsError(`Error export data: ${error.message}`, 400));
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
transactionsRoute.patch(`/:id`, verifyToken, verifyUser, verifyOwnership, validationTransactions, async (req, res, next) => {
  try {
    const idTransactions = req.params.id;
    const { dataUserDB, dataTransactions } = req;

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
        title: dataTransactions.title,
        amount: dataTransactions.amount,
        type: dataTransactions.type,
        category: dataTransactions.category,
        date: dataTransactions.date,
        paymentMethod: dataTransactions.paymentMethod,
        description: dataTransactions.description,
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

    const resultDeleteTransactions = await Transaction.deleteOne({ _id: idTransactions, user_id: dataUserDB._id });

    if (resultDeleteTransactions.deletedCount === 0) throw new Error(`Failed to delete transaction`);

    const deleteBalance = await User.findByIdAndUpdate(dataUserDB._id, { $inc: { balance: dataTransactions.type === "income" ? -dataTransactions.amount : +dataTransactions.amount } });

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
