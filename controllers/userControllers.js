import User from "../models/user.js";
import crypto from "crypto";

export const addUserAccountVerified = async (dataUser) => {
  try {
    const { username, email, password } = dataUser;

    const newAccount = await User.create({
      username,
      email,
      password,
      isVerified: false,
      secret: crypto.randomBytes(32).toString("hex"),
    });

    return newAccount;
  } catch (error) {
    throw new AuthError(`Error verify user: ${error.message}`, 400);
  }
};

export const addUserAccountGoogle = async (dataUser) => {
  try {
    const userDBComplate = await User.create({
      username: dataUser?.username,
      email: dataUser?.email,
      password: dataUser?.password,
      profile: "profile-1",
      balance: 0,
      currency: "IDR",
      isVerified: true,
      secret: crypto.randomBytes(32).toString("hex"),
    });

    return userDBComplate;
  } catch (error) {
    throw new Error(`Error add user google: ${error.message}`);
  }
};
