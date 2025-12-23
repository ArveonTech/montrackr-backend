const intervalList = ["monthly", "yearly"];
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

  req.dataTransactions = {
    title: rest.title,
    amount: amountNumber,
    interval: normalizedInterval,
    date: rest.date || new Date(),
    paymentMethod: normalizedPaymentMethod,
    description: rest.description,
  };

  next();
};
