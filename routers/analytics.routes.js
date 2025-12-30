import express from "express";
import { verifyToken, verifyUser, verifyOwnership } from "../middleware/authMiddleware.js";
import { AnalyticsError } from "../helpers/errorHandler.js";
import Transaction from "../models/transaction.js";
import { getMonthRange } from "../utils/getMonthRange.js";
import { chartAnalytics, currentDate, previousDate } from "../controllers/analyticsControllers.js";
import User from "../models/user.js";

const app = express();

app.use(express.json());

const analyticsRoute = express.Router();
const typeList = ["income", "expense"];

// home analytics
analyticsRoute.get(`/home`, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
  try {
    const { dataUserDB } = req;

    const dateNow = new Date();

    const year = dateNow.getFullYear();
    const monthComparassion = dateNow.getMonth();

    const dayInMonth = new Date(year, monthComparassion + 1, 0).getDate();

    const { startDate, endDate } = getMonthRange();

    const UserInDB = await User.findById(dataUserDB._id);
    const TransactionsIncomeMonthUser = await Transaction.find({ user_id: dataUserDB._id, type: "income", date: { $gte: startDate, $lte: endDate } });
    const TransactionsExpenseMonthUser = await Transaction.find({ user_id: dataUserDB._id, type: "expense", date: { $gte: startDate, $lte: endDate } });

    const balanceUser = UserInDB.balance;
    const incomeUser = TransactionsIncomeMonthUser.reduce((accumulator, currentAmount) => accumulator + currentAmount.amount, 0);
    const expenseUser = TransactionsExpenseMonthUser.reduce((accumulator, currentAmount) => accumulator + currentAmount.amount, 0);

    const TransactionsMonthUser = await Transaction.find({ user_id: dataUserDB._id, type: { $ne: "goal" }, date: { $gte: startDate, $lte: endDate } });

    const itemsChart = [];

    for (let i = 1; i <= dayInMonth; i++) {
      let amountIncomeDay = 0;
      let amountExpenseDay = 0;

      TransactionsMonthUser.forEach((transaction) => {
        const transactionDay = transaction.date.getDate();

        if (transactionDay === i) {
          if (transaction.type === "income") {
            amountIncomeDay += transaction.amount;
          } else {
            amountExpenseDay += transaction.amount;
          }
        }
      });

      itemsChart.push({
        day: i,
        income: amountIncomeDay,
        expense: amountExpenseDay,
      });
    }

    const previousTwoData = await Transaction.find({ user_id: dataUserDB._id }).sort({ date: -1 }).limit(2);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Get analytics home success",
      data: {
        balanceUser,
        incomeUser,
        expenseUser,
        itemsChart,
        previousTwoData,
      },
    });
  } catch (error) {
    next(new AnalyticsError(`Error analytics home analytics: ${error.message}`, 400));
  }
});

// analytics chart
analyticsRoute.get(`/chartAnalytics`, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
  try {
    const { dataUserDB } = req;

    const yearNow = new Date().getFullYear();
    const defaultStartRangeQuery = new Date(yearNow, 0, 1, 0, 0, 0, 0);
    const defaultEndRangeQuery = new Date(yearNow, 11, 31, 23, 59, 59, 999);

    const startRangeQuery = req.query.startRange || defaultStartRangeQuery;
    const endRangeQuery = req.query.endRange || defaultEndRangeQuery;
    const type = req.query.type;

    if (type !== undefined && type !== "" && !typeList.includes(type)) throw new Error("Invalid type query");

    const dateStartMonth = new Date(startRangeQuery).getFullYear() * 12 + new Date(startRangeQuery).getMonth();
    const dateEndMonth = new Date(endRangeQuery).getFullYear() * 12 + new Date(endRangeQuery).getMonth();

    let query = {
      user_id: dataUserDB._id,
      type: { $ne: "goal" },
    };

    if (typeList.includes(type)) {
      query.type = type;
    }

    if (startRangeQuery && endRangeQuery) {
      query.date = {
        $gte: new Date(startRangeQuery),
        $lte: new Date(endRangeQuery),
      };
    }

    const TransactionsUser = await Transaction.find(query);

    const resultChart = chartAnalytics(startRangeQuery, endRangeQuery, dateStartMonth, dateEndMonth, TransactionsUser, type);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Get chart analytics success",
      data: {
        resultChart,
      },
    });
  } catch (error) {
    next(new AnalyticsError(`Error chart analytics: ${error.message}`, 400));
  }
});

//  comparassion
analyticsRoute.get(`/comparassion`, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const period = req.query.period || "month";

    const dateNow = new Date(2026, 11, 31, 0, 0, 0, 0);

    let previousAmountIncome = 0;
    let previousAmountExpense = 0;
    let currentAmountIncome = 0;
    let currentAmountExpense = 0;

    const queryPrevious = previousDate(dataUserDB._id, dateNow, period);
    const queryNow = currentDate(dataUserDB._id, dateNow, period);

    const transactionsPrevious = await Transaction.find(queryPrevious);
    const transactionsCurrent = await Transaction.find(queryNow);

    transactionsPrevious.forEach((transaction) => {
      if (transaction.type === "income") {
        previousAmountIncome += transaction.amount;
      } else if (transaction.type === "expense") {
        previousAmountExpense += transaction.amount;
      }
    });

    transactionsCurrent.forEach((transaction) => {
      if (transaction.type === "income") {
        currentAmountIncome += transaction.amount;
      } else if (transaction.type === "expense") {
        currentAmountExpense += transaction.amount;
      }
    });

    const differenceIncome = previousAmountIncome === 0 ? 0 : (currentAmountIncome - previousAmountIncome) / previousAmountIncome;
    const differenceExpense = previousAmountExpense === 0 ? 0 : (currentAmountExpense - previousAmountExpense) / previousAmountExpense;

    const resultIncomeComparassion = differenceIncome * 100;
    const resultExpenseComparassion = differenceExpense * 100;

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Get comparassion success",
      data: {
        income: resultIncomeComparassion,
        expense: resultExpenseComparassion,
      },
    });
  } catch (error) {
    next(new AnalyticsError(`Error comparassion: ${error.message}`, 400));
  }
});

export default analyticsRoute;
