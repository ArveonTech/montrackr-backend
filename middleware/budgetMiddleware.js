const categoryList = ["essentials", "lifestyle", "health", "family & social", "financial", "others"];

export const validationBudget = (req, res, next) => {
  const { dataTransactions } = req.body;

  if (!dataTransactions.categories || typeof dataTransactions.categories !== "object" || !dataTransactions) {
    return res.status(400).json({ message: "Budget data must be an object" });
  }

  const normalizedBudget = {};

  for (const category of categoryList) {
    if (!(category in dataTransactions.categories)) {
      return res.status(400).json({ message: `Missing budget category: ${category}` });
    }

    const rawAmount = dataTransactions.categories[category];
    const normalizedAmount = String(rawAmount).replace(/[^\d]/g, "");
    const amountNumber = Number(normalizedAmount);

    normalizedBudget[category] = amountNumber || 0;
  }

  const normalizedAmount = String(dataTransactions.budget).replace(/[^\d]/g, "");
  const amountBudgetNumber = Number(normalizedAmount);

  req.dataTransactions = { categories: normalizedBudget, budget: amountBudgetNumber };
  next();
};
