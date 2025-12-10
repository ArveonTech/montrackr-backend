import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { createAccessToken } from "../utils/authToken.js";

dotenv.config({ path: "./env/.env" });

const accessKey = process.env.ACCESS_SECRET_KEY;
const refreshKey = process.env.REFRESH_SECRET_KEY;

export const authenticateToken = (accessToken, refreshToken) => {
  try {
    const decodeAccess = jwt.verify(accessToken, accessKey);
    return { success: true, code: 200, status: "ok", refreshToken: refreshToken, accessToken: accessToken, payload: decodeAccess };
  } catch (err) {
    try {
      const decodeRefresh = jwt.verify(refreshToken, refreshKey);
      const { password, exp, iat, ...rest } = decodeRefresh;
      return { success: true, code: 200, status: "refresh", refreshToken: refreshToken, accessToken: createAccessToken(rest) };
    } catch (err2) {
      return { success: false, code: 500, error: err2 };
    }
  }
};
