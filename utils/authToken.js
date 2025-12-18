import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config({ path: "./env/.env" });

const accessKey = process.env.ACCESS_SECRET_KEY;
const refreshKey = process.env.REFRESH_SECRET_KEY;

export const createAccessToken = (payload) => jwt.sign(payload, accessKey, { expiresIn: "7d" });

export const createRefreshToken = (payload) => jwt.sign(payload, refreshKey, { expiresIn: "7d" });
