import { authenticateToken } from "../helpers/authHelper.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const verifyToken = (req, res, next) => {
  // ambil access token di header
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader && authHeader.split(" ")[1];

  const refreshToken = req.cookies["refresh-token"];
  if (!accessToken && !refreshToken) return res.status(403).json({ message: "No token provided" });

  const result = authenticateToken(accessToken, refreshToken);

  if (result.success === false) return res.status(401).json({ message: result.error });

  if (result.status === "refresh") {
    req.status = "refresh";
    req.refreshToken = result.refreshToken;
    req.accessToken = result.accessToken;
    req.user = jwt.decode(result.accessToken);
  } else if (result.status === "ok") {
    req.status = "ok";
    req.user = result.payload;
  }

  next();
};

export const verifyUser = async (req, res, next) => {
  const { user } = req;

  if (!user)
    return res.status(404).json({
      status: "error",
      code: 404,
      message: "Data not found",
    });

  const dataUserDB = await User.findById(user._id);

  if (!dataUserDB)
    return res.status(404).json({
      status: "error",
      code: 404,
      message: "User not found",
      data: {
        otp: false,
      },
    });

  req.dataUserDB = dataUserDB;

  next();
};

export const userByID = async (req, res, next) => {
  try {
    const { dataUser } = req.body;

    if (!dataUser)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Data not found",
      });

    const dataUserDB = await User.findById(dataUser._id);

    if (!dataUserDB)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "User not found",
        data: {
          otp: false,
        },
      });

    req.dataUserDB = dataUserDB;

    next();
  } catch (error) {
    next(new Error(`Error request otp: ${error.message}`));
  }
};

export const userByEmail = async (req, res, next) => {
  try {
    const { dataUser } = req.body;
    const { email, token, ...rest } = dataUser;

    const dataUserDB = await User.findOne({ email });

    if (!dataUserDB)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "User not found",
        data: {
          otp: false,
        },
      });

    req.dataUserDB = dataUserDB;

    next();
  } catch (error) {
    next(new Error(`Error request otp: ${error.message}`));
  }
};
