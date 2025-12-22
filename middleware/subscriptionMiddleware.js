const intervalList = ["monthly", "yearly"];
const statusList = ["active", "paused", "cancel"];
const paymentMethodList = ["cash", "bank", "debit card", "credit card", "e-wallet", "qris"];

export const validationTransactionsSubcriptions = (req, res, next) => {
  const { formDataTransactions } = req.body;
  const { interval, status, paymentMethod, amount, ...rest } = formDataTransactions;
  const normalizedInterval = interval.toLowerCase();
  const normalizedStatus = status.toLowerCase();
  const normalizedPaymentMethod = paymentMethod.toLowerCase();

  if (!intervalList.includes(normalizedInterval)) {
    return res.status(400).json({ message: "Invalid transaction interval" });
  }

  if (!statusList.includes(normalizedStatus)) {
    return res.status(400).json({ message: "Invalid transaction status" });
  }

  if (!paymentMethodList.includes(normalizedPaymentMethod)) {
    return res.status(400).json({ message: "Invalid transaction payment method" });
  }

  const normalizedAmount = amount.replace(/[^\d]/g, "");
  const amountNumber = Number(normalizedAmount);

  req.dataTransactions = {
    title: rest.title,
    amount: amountNumber,
    type: normalizedInterval,
    date: rest.date,
    paymentMethod: normalizedPaymentMethod,
    description: rest.description,
    status: normalizedStatus,
  };

  next();
};
