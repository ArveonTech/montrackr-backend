import { normalizeDate, formatYearMonth } from "../utils/normalizeDate.js";

export const chartAnalytics = (startRangeQuery, endRangeQuery, dateStartMonth, dateEndMonth, TransactionsUser, type) => {
  const incomeCategory = {
    salary: 0,
    bonus: 0,
    freelance: 0,
    business: 0,
    gift: 0,
    others: 0,
  };

  const expenseCategory = {
    essentials: 0,
    lifestyle: 0,
    health: 0,
    "family & social": 0,
    financial: 0,
    others: 0,
  };

  const monthDifference = dateEndMonth - dateStartMonth;

  const latestDate = new Date(endRangeQuery);

  let category = null;

  if (type === "income") {
    category = incomeCategory;
  } else if (type === "expense") {
    category = expenseCategory;
  } else {
    category = {
      income: incomeCategory,
      expense: expenseCategory,
    };
  }

  let resultChart = [];

  if (monthDifference < 0) {
    return res.status(400).json({
      status: "error",
      code: 400,
      message: "start date must be earlier than end date",
    });
  } else if (monthDifference >= 0 && monthDifference <= 1) {
    const currentDate = new Date(startRangeQuery);

    const dateRange = [];

    while (currentDate <= latestDate) {
      dateRange.push(currentDate.toISOString());
      currentDate.setDate(currentDate.getDate() + 1);
    }

    for (let i = 0; i < dateRange.length; i++) {
      let amountIncomeDay = 0;
      let amountExpenseDay = 0;

      TransactionsUser.forEach((transaction) => {
        const transactionDay = transaction.date;
        const normalizeDay = normalizeDate(transactionDay);

        if (normalizeDay.getTime() === new Date(normalizeDate(dateRange[i])).getTime()) {
          if (transaction.type === "income") {
            amountIncomeDay += transaction.amount;
          } else {
            amountExpenseDay += transaction.amount;
          }
        }
      });

      resultChart.push({
        day: new Date(dateRange[i]).getDate(),
        income: amountIncomeDay,
        expense: amountExpenseDay,
      });
    }

    TransactionsUser.forEach((transaction) => {
      if (type === "income") {
        category[transaction.category] += transaction.amount;
      } else if (type === "expense") {
        category[transaction.category] += transaction.amount;
      } else {
        category[transaction.type][transaction.category] += transaction.amount;
      }
    });

    resultChart.push({ category });
  } else if (monthDifference > 1 && monthDifference <= 12) {
    const currentDate = new Date(startRangeQuery);

    const dateRange = [];

    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();

    while (currentYear < latestDate.getFullYear() || (currentYear === latestDate.getFullYear() && currentMonth <= latestDate.getMonth())) {
      const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
      dateRange.push(monthStr);

      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }

    for (let i = 0; i < dateRange.length; i++) {
      let amountIncomeMonth = 0;
      let amountExpenseMonth = 0;

      TransactionsUser.forEach((transaction) => {
        const transactionDate = transaction.date;

        const resultNormalizeDate = normalizeDate(transactionDate).toISOString().slice(0, 7);

        if (resultNormalizeDate === dateRange[i]) {
          if (transaction.type === "income") {
            amountIncomeMonth += transaction.amount;
          } else {
            amountExpenseMonth += transaction.amount;
          }
        }
      });

      resultChart.push({
        month: formatYearMonth(dateRange[i]),
        income: amountIncomeMonth,
        expense: amountExpenseMonth,
      });
    }

    TransactionsUser.forEach((transaction) => {
      if (type === "income") {
        category[transaction.category] += transaction.amount;
      } else if (type === "expense") {
        category[transaction.category] += transaction.amount;
      } else {
        category[transaction.type][transaction.category] += transaction.amount;
      }
    });

    resultChart.push({ category });
  } else {
    const currentDate = new Date(startRangeQuery);

    const dateRange = [];

    let currentYear = currentDate.getFullYear();

    while (currentYear <= latestDate.getFullYear()) {
      dateRange.push(`${currentYear}`);

      currentYear++;
    }

    for (let i = 0; i < dateRange.length; i++) {
      let amountIncomeYear = 0;
      let amountExpenseYear = 0;

      TransactionsUser.forEach((transaction) => {
        const transactionDate = transaction.date;

        const resultNormalizeDate = normalizeDate(transactionDate).toISOString().slice(0, 4);

        if (resultNormalizeDate === dateRange[i]) {
          if (transaction.type === "income") {
            amountIncomeYear += transaction.amount;
          } else {
            amountExpenseYear += transaction.amount;
          }
        }
      });

      resultChart.push({
        year: dateRange[i],
        income: amountIncomeYear,
        expense: amountExpenseYear,
      });
    }

    TransactionsUser.forEach((transaction) => {
      if (type === "income") {
        category[transaction.category] += transaction.amount;
      } else if (type === "expense") {
        category[transaction.category] += transaction.amount;
      } else {
        category[transaction.type][transaction.category] += transaction.amount;
      }
    });

    resultChart.push({ category });
  }

  return resultChart;
};

export const previousDate = (idUser, dateNow, period) => {
  let queryPrevious = {
    user_id: idUser,
  };

  const yearPrevious = dateNow.getFullYear();
  const monthPrevious = dateNow.getMonth();
  const datePrevious = dateNow.getDate();

  if (period === "today") {
    queryPrevious.date = {
      $gte: new Date(yearPrevious, monthPrevious, datePrevious - 1, 0, 0, 0, 0),
      $lte: new Date(yearPrevious, monthPrevious, datePrevious - 1, 23, 59, 59, 999),
    };
  } else if (period === "weak") {
    const day = dateNow.getDay();

    const normalizedDay = day === 0 ? 7 : day;

    const startOfThisWeek = new Date(yearPrevious, monthPrevious, datePrevious - (normalizedDay - 1), 0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek.getFullYear(), startOfThisWeek.getMonth(), startOfThisWeek.getDate() - 7, 0, 0, 0, 0);

    const endOfLastWeek = new Date(startOfThisWeek.getFullYear(), startOfThisWeek.getMonth(), startOfThisWeek.getDate() - 1, 23, 59, 59, 999);

    queryPrevious.date = {
      $gte: startOfLastWeek,
      $lte: endOfLastWeek,
    };
  } else if (period === "month") {
    const finalDay = new Date(yearPrevious, monthPrevious, 0).getDate();

    queryPrevious.date = {
      $gte: new Date(yearPrevious, monthPrevious - 1, 1, 0, 0, 0, 0),
      $lte: new Date(yearPrevious, monthPrevious - 1, finalDay, 23, 59, 59, 999),
    };
  } else if (period === "year") {
    queryPrevious.date = {
      $gte: new Date(yearPrevious - 1, 0, 1, 0, 0, 0, 0),
      $lte: new Date(yearPrevious - 1, 11, 31, 23, 59, 59, 999),
    };
  } else {
    throw new Error("Invalid monthly previous");
  }

  return queryPrevious;
};

export const currentDate = (idUser, dateNow, period) => {
  let queryCurrent = {
    user_id: idUser,
  };

  const yearCurrent = dateNow.getFullYear();
  const monthCurrent = dateNow.getMonth();
  const dateCurrent = dateNow.getDate();

  if (period === "today") {
    queryCurrent.date = {
      $gte: new Date(yearCurrent, monthCurrent, dateCurrent, 0, 0, 0, 0),
      $lte: new Date(yearCurrent, monthCurrent, dateCurrent, 23, 59, 59, 999),
    };
  } else if (period === "weak") {
    const day = dateNow.getDay();

    const normalizedDay = day === 0 ? 7 : day;

    const startOfThisWeek = new Date(yearCurrent, monthCurrent, dateCurrent - (normalizedDay - 1), 0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek.getFullYear(), startOfThisWeek.getMonth(), startOfThisWeek.getDate(), 0, 0, 0, 0);

    const endOfLastWeek = new Date(startOfThisWeek.getFullYear(), startOfThisWeek.getMonth(), startOfThisWeek.getDate() + 6, 23, 59, 59, 999);

    queryCurrent.date = {
      $gte: startOfLastWeek,
      $lte: endOfLastWeek,
    };
  } else if (period === "month") {
    const finalDay = new Date(yearCurrent, monthCurrent + 1, 0).getDate();

    queryCurrent.date = {
      $gte: new Date(yearCurrent, monthCurrent, 1, 0, 0, 0, 0),
      $lte: new Date(yearCurrent, monthCurrent, finalDay, 23, 59, 59, 999),
    };
  } else if (period === "year") {
    queryCurrent.date = {
      $gte: new Date(yearCurrent, 0, 1, 0, 0, 0, 0),
      $lte: new Date(yearCurrent, 11, 31, 23, 59, 59, 999),
    };
  } else {
    throw new Error("Invalid monthly now");
  }

  return queryCurrent;
};
