const intervalList = ["monthly", "yearly"];
const statusList = ["active", "pause"];
const paymentMethodList = ["cash", "bank", "debit card", "credit card", "e-wallet", "qris"];

export const validationTransactionsSubcriptions = (req, res, next) => {
  const { dataTransactions } = req.body;
  const { interval, paymentMethod, amount, ...rest } = dataTransactions;
  const normalizedInterval = interval.toLowerCase();
  const normalizedPaymentMethod = paymentMethod.toLowerCase();

  if (!intervalList.includes(normalizedInterval)) {
    return res.status(400).json({ message: "Invalid transaction interval" });
  }

  if (!paymentMethodList.includes(normalizedPaymentMethod)) {
    return res.status(400).json({ message: "Invalid transaction payment method" });
  }

  const normalizedAmount = amount.replace(/[^\d]/g, "");
  const amountNumber = Number(normalizedAmount);

  const selectedDate = rest.date ? new Date(rest.date) : new Date();

  const utcDate = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()));

  req.dataTransactions = {
    title: rest.title,
    amount: amountNumber,
    interval: normalizedInterval,
    date: utcDate,
    paymentMethod: normalizedPaymentMethod,
  };

  next();
};

export const validationUpdateTransactionsSubcriptions = (req, res, next) => {
  const { dataTransactions } = req.body;
  const { interval, paymentMethod, amount, status, ...rest } = dataTransactions;
  const normalizedInterval = interval.toLowerCase();
  const normalizedPaymentMethod = paymentMethod.toLowerCase();
  const normalizedStatus = status.toLowerCase();

  if (!intervalList.includes(normalizedInterval)) {
    return res.status(400).json({ message: "Invalid transaction interval" });
  }

  if (!paymentMethodList.includes(normalizedPaymentMethod)) {
    return res.status(400).json({ message: "Invalid transaction payment method" });
  }

  if (!statusList.includes(normalizedStatus)) {
    return res.status(400).json({ message: "Invalid transaction status" });
  }

  const normalizedAmount = amount.replace(/[^\d]/g, "");
  const amountNumber = Number(normalizedAmount);

  const selectedDate = rest.date ? new Date(rest.date) : new Date();

  const utcDate = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()));

  req.dataTransactions = {
    title: rest.title,
    amount: amountNumber,
    interval: normalizedInterval,
    date: utcDate,
    paymentMethod: normalizedPaymentMethod,
    status: normalizedStatus,
  };

  next();
};
