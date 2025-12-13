import { authenticator } from "otplib";
import { sendMeessage } from "./email.js";
authenticator.options = { step: 60 };

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

export const requestOTP = async (secret, email) => {
  try {
    const resultGenerateTokenOTP = generateTokenOTP(secret);

    const resutlSendMessageOTP = await sendMeessage(resultGenerateTokenOTP, email, 1);

    return resutlSendMessageOTP; // email enkripsi;
  } catch (error) {
    throw new Error(`Error request OTP : ${error.message}`, 401);
  }
};
