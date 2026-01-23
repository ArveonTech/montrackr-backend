import express from "express";
import { verifyOwnership, verifyToken, verifyUser } from "../middleware/authMiddleware.js";
import { UserError } from "../helpers/errorHandler.js";
import { createAccessToken, createRefreshToken } from "../utils/authToken.js";
import User from "../models/user.js";

const app = express();

app.use(express.json());

const usersRoute = express.Router();

usersRoute.get(`/me`, verifyToken, verifyUser, async (req, res, next) => {
  try {
    const { accessToken, refreshToken, status, user } = req;

    const dataUserDB = await User.findById(user._id);
    if (status === "refresh")
      res.cookie("refresh-token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.SAMESITE,
        maxAge: 1000 * 60 * 60 * 168,
        path: "/",
      });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Get profile success",
      data: {
        _id: dataUserDB?._id,
        username: dataUserDB?.username,
        email: dataUserDB?.email,
        profile: dataUserDB?.profile,
      },
      tokens: status === "refresh" ? { accessToken } : undefined,
    });
  } catch (error) {
    next(new UserError(`Error get profile user: ${error.message}`, 400));
  }
});

usersRoute.patch(`/change-profile`, verifyToken, verifyUser, async (req, res, next) => {
  try {
    const { user, dataUserDB } = req;
    const { fieldUser, value } = req.body;

    const resultUpdateUser = await User.findOneAndUpdate(
      { _id: user._id },
      { [fieldUser]: value },
      {
        new: true,
        runValidators: true,
      },
    );

    const userObj = resultUpdateUser.toObject();
    const { password, balance, currency, otp, createdAt, secret, __v, isVerified, updatedAt, ...payloadJWT } = userObj;

    const accessToken = createAccessToken(payloadJWT);
    const refreshToken = createRefreshToken(payloadJWT);

    res.cookie("refresh-token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.SAMESITE,
      maxAge: 1000 * 60 * 60 * 168,
      path: "/",
    });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "OTP register success",
      data: {
        _id: dataUserDB?._id,
        username: dataUserDB?.username,
        email: dataUserDB?.email,
        profile: dataUserDB?.profile,
      },
      tokens: {
        accessToken,
      },
    });
  } catch (error) {
    next(new UserError(`Error update change password: ${error.message}`, 400));
  }
});

export default usersRoute;
