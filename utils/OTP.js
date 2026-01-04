import { authenticator } from "otplib";
import { sendMeessage } from "./email.js";
import User from "../models/user.js";
authenticator.options = { step: 300 };

export const generateTokenOTP = (secret) => {
  const token = authenticator.generate(secret);

  return token; // token
};

export const verifyTokenOTP = (token, secret) => {
  try {
    const isValid = authenticator.check(token, secret);
    return isValid; // boolean
  } catch (error) {
    throw new Error(`Error verify OTP : ${error.message}`);
  }
};

export const requestOTP = async ({ userId, secret, email }) => {
  try {
    const now = new Date();
    const expiredAt = new Date(now.getTime() + 60 * 1000);

    const resultGenerateTokenOTP = generateTokenOTP(secret);

    const user = await User.findOneAndUpdate({ _id: userId, $or: [{ otpExpiredAt: { $lt: now } }, { otpExpiredAt: null }] }, { otp: resultGenerateTokenOTP, otpExpiredAt: expiredAt }, { new: true });

    if (!user) return { statusOTP: "ok", message: "Request processed" };

    const resutlSendMessageOTP = await sendMeessage(resultGenerateTokenOTP, email, 1);

    return { statusOTP: "ok", otpGenerate: resultGenerateTokenOTP };
  } catch (error) {
    throw new Error(`Error request OTP : ${error.message}`, 401);
  }
};
