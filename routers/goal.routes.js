import express from "express";
import { verifyOwnership, verifyToken, verifyUser } from "../middleware/authMiddleware.js";
import Goal from "../models/goal.js";

const app = express();

app.use(express.json());

const goalsRoute = express.Router();

goalsRoute.post(``, verifyToken, verifyUser, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const dataGoal = req.body;

    const resultAddGoal = await Goal.create({
      user_id: dataUserDB._id,
      title: dataGoal.title,
      targetGoal: dataGoal.targetGoal,
      currentBalance: dataGoal.currentBalance,
    });

    if (!resultAddGoal) throw new Error(`Failed to add goal`);

    const resultAddContributionToGoal = await Transaction.create({
      user_id: dataUserDB._id,
      amount: dataGoal.currentBalance,
      currency: dataUserDB.currency,
      type: "expense",
      category: null,
      date: null,
      paymentMethod: null,
      description: null,
      goalId: resultAddGoal._id,
      subsId: null,
    });

    if (!resultAddContributionToGoal) throw new Error(`Failed to add transaction goal`);

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Add goal success",
      data: {},
    });
  } catch (error) {
    next(new TransactionsError(`Error add goal: ${error.message}`, 400));
  }
});

goalsRoute.patch(`/contribute`, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
  try {
    const { dataUserDB } = req;
    const { dataActionTransactions } = req.body;

    const resultGetTransactions = await Goal.findOneAndUpdate({ _id: dataActionTransactions._id, user_id: dataUserDB._id },{});

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

goalsRoute.patch(`/:id`, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
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

goalsRoute.delete(`/:id`, verifyToken, verifyUser, verifyOwnership, async (req, res, next) => {
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
export default goalsRoute;
