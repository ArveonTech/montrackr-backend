import User from "../models/user.js";

export const rollbackBalance = async (idUser, typeUpdate, typeOld, amountOld, amountNew) => {
  try {
    const deleteBalanceOld = await User.findByIdAndUpdate(idUser, { $inc: { balance: typeOld === "income" ? -amountOld : +amountOld } });
    if (!deleteBalanceOld) throw new Error(`Failed to rollback balance`);

    const addBalanceNew = await User.findByIdAndUpdate(idUser, { $inc: { balance: typeUpdate === "income" ? +amountNew : -amountNew } });
    if (!addBalanceNew) throw new Error(`Failed to add transaction new after rollback`);
  } catch (error) {
    throw new Error(`Error rollback balance : ${error.message}`);
  }
};
