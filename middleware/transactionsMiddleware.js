const typeList = ["income", "expense"];
const categoryList = ["essentials", "lifestyle", "health", "family & social", "financial", "salary", "bonus", "freelance", "business", "gift", "others"];
const paymentMethodList = ["cash", "bank", "debit card", "credit card", "e-wallet", "qris"];

export const validationTransactions = (req, res, next) => {
  const { formDataTransactions } = req.body;
  const { type, category, paymentMethod, amount, ...rest } = formDataTransactions;
  const normalizedType = type.toLowerCase();
  const normalizedCate = category.toLowerCase();
  const normalizedPaymentMethod = paymentMethod.toLowerCase();

  if (!typeList.includes(normalizedType)) {
    return res.status(400).json({ message: "Invalid transaction type" });
  }

  if (!categoryList.includes(normalizedCate)) {
    return res.status(400).json({ message: "Invalid transaction category" });
  }

  if (!paymentMethodList.includes(normalizedPaymentMethod)) {
    return res.status(400).json({ message: "Invalid transaction payment method" });
  }

  const normalizedAmount = amount.replace(/[^\d]/g, "");
  const amountNumber = Number(normalizedAmount);

  req.dataTransactions = {
    amount: amountNumber,
    type: normalizedType,
    category: normalizedCate,
    date: rest.date,
    paymentMethod: normalizedPaymentMethod,
    description: rest.description,
  };

  next();
};
