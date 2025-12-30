import express from "express";
import User from "../models/user.js";
import { google } from "googleapis";
import { createAccessToken, createRefreshToken } from "../utils/authToken.js";
import { AuthError } from "../helpers/errorHandler.js";
import { validateUser } from "../utils/validateUser.js";
import { addUserAccountGoogle, addUserAccountVerified } from "../controllers/userControllers.js";
import { requestOTP, verifyTokenOTP } from "../utils/OTP.js";
import { userByEmail, userByID } from "../middleware/authMiddleware.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const app = express();
app.use(express.json());
const authRoute = express.Router();

const oauth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, "http://localhost:3000/auth/google/callback");

const scopes = ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"];

const authorizationUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
  include_granted_scopes: true,
});

// Login or Register with Google
authRoute.get(`/google`, (req, res) => {
  try {
    res.redirect(authorizationUrl);
  } catch (error) {
    throw new AuthError("Error register google", 500);
  }
});

authRoute.get(`/google/callback`, async (req, res, next) => {
  try {
    const { code } = req.query;

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });
    const { data } = await oauth2.userinfo.get();

    if (!data.email || !data.name) {
      return res.status(404).json({ data });
    }

    const user = await User.findOne({ email: data?.email });

    if (!user)
      return res.status(401).json({
        status: "register",
        user: {
          email: data.email,
          username: data.name,
        },
      });

    const userObj = user.toObject();
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
      auth: "login",
      data: {
        _id: user?._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
      },
      tokens: {
        accessToken,
      },
    });
  } catch (error) {
    next(new AuthError(`Error callback google ${error.message}`, 500));
  }
});

authRoute.post(`/set-password`, async (req, res, next) => {
  try {
    const { dataUser } = req.body;

    if (dataUser.status !== "register")
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Invalid status register",
      });

    const dataUserRegister = dataUser.user;

    if (!dataUserRegister.email || !dataUserRegister.username || !dataUserRegister.password)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Data not found",
      });

    // validate user
    const errorMsgValidateUser = validateUser({ username: dataUser.user.username, email: dataUser.user.email, password: dataUser.user.password });
    if (errorMsgValidateUser) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: errorMsgValidateUser,
      });
    }

    const dataUserDB = await User.findOne({ email: dataUserRegister?.email });

    if (dataUserDB)
      return res.status(409).json({
        status: "error",
        code: 409,
        message: "User is already exists",
      });

    const userDBComplate = await addUserAccountGoogle(dataUserRegister);

    const userObj = userDBComplate.toObject();
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

    res.status(201).json({
      status: "success",
      code: 201,
      message: "Register google success",
      data: {
        _id: userObj?._id,
        username: userObj?.username,
        email: userObj?.email,
        profile: userObj?.profile,
      },
      tokens: {
        accessToken,
      },
    });
  } catch (error) {
    next(new AuthError(`Error set password: ${error.message}`, 400));
  }
});

// Register manual
authRoute.post(`/register`, async (req, res, next) => {
  try {
    const { dataUser } = req.body;

    if (!dataUser.email || !dataUser.username || !dataUser.password)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Data not found",
      });

    // validate user
    const { username, email, password } = dataUser;
    const errorMsgValidateUser = validateUser({ username, email, password });
    if (errorMsgValidateUser) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: errorMsgValidateUser,
      });
    }

    // account is arlready and verified
    const userIsVerified = await User.findOne({ email: dataUser?.email, isVerified: true });
    if (userIsVerified) {
      return res.status(409).json({
        status: "error",
        code: 409,
        message: "Email already exists",
      });
    }

    // account is already but not verified
    const userNotVerified = await User.findOne({ email: dataUser?.email, isVerified: false });
    if (userNotVerified) {
      return res.status(200).json({
        status: "pending",
        code: 200,
        message: "Account exists but not verified. Please verify your email.",
        data: {
          _id: userNotVerified?._id,
          username: userNotVerified?.username,
          email: userNotVerified?.email,
        },
      });
    }

    const newAccountVerified = await addUserAccountVerified(dataUser);

    res.status(201).json({
      status: "success",
      code: 200,
      message: "Account verified created",
      data: {
        _id: newAccountVerified?._id,
        username: newAccountVerified?.username,
        email: newAccountVerified?.email,
      },
    });
  } catch (error) {
    next(new AuthError(`Error verify user: ${error.message}`, 400));
  }
});

authRoute.post(`/request-otp/register`, userByID, async (req, res, next) => {
  try {
    const dataUserDB = req.dataUserDB;

    const resutlSendMessageOTP = await requestOTP(dataUserDB.secret, dataUserDB.email);

    res.status(202).json({
      status: "success",
      code: 202,
      message: "OTP register success",
      data: {
        otp: resutlSendMessageOTP,
      },
    });
  } catch (error) {
    next(new AuthError(`Error request otp register: ${error.message}`, 400));
  }
});

authRoute.post(`/verify-otp/register`, userByID, async (req, res, next) => {
  try {
    const { dataUser } = req.body;
    const dataUserDB = req.dataUserDB;

    const resultVerifyTokenOTP = verifyTokenOTP(dataUser?.token, dataUserDB?.secret);
    if (resultVerifyTokenOTP === false)
      return res.status(422).json({
        status: "error",
        code: 422,
        message: "OTP register invalid",
        data: {
          otp: false,
        },
      });

    const userDBComplate = await User.findOneAndUpdate(
      { _id: dataUserDB._id },
      { isVerified: true, balance: 0, profile: "profile-1", currency: "IDR" },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!userDBComplate)
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Failed account verification",
      });

    const userObj = userDBComplate.toObject();
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

    res.status(202).json({
      status: "success",
      code: 202,
      message: "OTP register success",
      data: {
        otp: true,
        _id: userObj?._id,
        username: userObj?.username,
        email: userObj?.email,
        profile: userObj?.profile,
      },
      tokens: {
        accessToken,
      },
    });
  } catch (error) {
    next(new AuthError(`Error request otp register: ${error.message}`, 400));
  }
});

authRoute.post(`/login`, userByEmail, async (req, res, next) => {
  try {
    const dataUserDB = req.dataUserDB;
    const { dataUser } = req.body;

    if (dataUser?.password !== dataUserDB.password)
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Wrong password",
      });

    // account is already but not verified
    if (dataUserDB.isVerified === false) {
      return res.status(200).json({
        status: "pending",
        code: 200,
        message: "Account exists but not verified. Please verify your email.",
        data: {
          _id: dataUserDB?._id,
          username: dataUserDB?.username,
          email: dataUserDB?.email,
        },
      });
    }

    const userObj = dataUserDB.toObject();
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

    res.status(202).json({
      status: "success",
      code: 202,
      message: "OTP register success",
      data: {
        _id: userObj?._id,
        username: userObj?.username,
        email: userObj?.email,
        profile: userObj?.profile,
      },
      tokens: {
        accessToken,
      },
    });
  } catch (error) {
    next(new AuthError(`Error login: ${error.message}`, 400));
  }
});

authRoute.post(`/request-otp/login`, userByID, async (req, res, next) => {
  try {
    const dataUserDB = req.dataUserDB;

    const resutlSendMessageOTP = await requestOTP(dataUserDB.secret, dataUserDB.email);

    res.status(202).json({
      status: "success",
      code: 202,
      message: "OTP login success",
      data: {
        otp: resutlSendMessageOTP,
      },
    });
  } catch (error) {
    next(new AuthError(`Error request otp login: ${error.message}`, 400));
  }
});

authRoute.post(`/verify-otp/login`, userByID, async (req, res, next) => {
  try {
    const { dataUser } = req.body;
    const dataUserDB = req.dataUserDB;

    const resultVerifyTokenOTP = verifyTokenOTP(dataUser?.token, dataUserDB?.secret);
    if (resultVerifyTokenOTP === false)
      return res.status(422).json({
        status: "error",
        code: 422,
        message: "OTP login invalid",
        data: {
          otp: false,
        },
      });

    const userDBComplate = await User.findOneAndUpdate(
      { _id: dataUserDB._id },
      { isVerified: true },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!userDBComplate)
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Failed account verification",
      });

    const userObj = userDBComplate.toObject();
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

    res.status(202).json({
      status: "success",
      code: 202,
      message: "OTP login success",
      data: {
        otp: true,
        _id: userObj?._id,
        username: userObj?.username,
        email: userObj?.email,
        profile: userObj?.profile,
      },
      tokens: {
        accessToken,
      },
    });
  } catch (error) {
    next(new AuthError(`Error request otp login: ${error.message}`, 400));
  }
});

authRoute.post(`/request-otp/forgot-password`, userByEmail, async (req, res, next) => {
  try {
    const { dataUser } = req.body;
    const dataUserDB = req.dataUserDB;

    const resutlSendMessageOTP = await requestOTP(dataUserDB.secret, dataUser?.email);

    res.status(202).json({
      status: "success",
      code: 202,
      message: "OTP forgot password success",
      data: {
        otp: resutlSendMessageOTP,
      },
    });
  } catch (error) {
    next(new AuthError(`Error request otp forgot password: ${error.message}`, 400));
  }
});

authRoute.post(`/verify-otp/forgot-password`, userByEmail, async (req, res, next) => {
  try {
    const { dataUser } = req.body;
    const dataUserDB = req.dataUserDB;

    const resultVerifyTokenOTP = verifyTokenOTP(dataUser?.token, dataUserDB.secret);

    if (resultVerifyTokenOTP === false)
      return res.status(422).json({
        status: "error",
        code: 422,
        message: "OTP forgot password invalid",
        data: {
          otp: false,
        },
      });

    res.status(200).json({
      status: "pending",
      code: 200,
      message: "OTP forgot password success",
      data: {
        otp: true,
        _id: dataUserDB?._id,
        username: dataUserDB?.username,
        email: dataUserDB?.email,
        profile: dataUserDB?.profile,
      },
    });
  } catch (error) {
    next(new AuthError(`Error request otp forgot password: ${error.message}`, 400));
  }
});

authRoute.post(`/forgot-password`, userByID, async (req, res) => {
  try {
    const dataUserDB = req.dataUserDB;
    const { dataUser } = req.body;

    if (!dataUser._id || !dataUser.username || !dataUser.email || !dataUser.otp || !dataUser.profile)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Data not found",
        data: {
          otp: false,
        },
      });

    const resultUpdateForgotPassword = await User.findOneAndUpdate(
      { _id: dataUserDB._id },
      { password: dataUser?.newPassword },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!resultUpdateForgotPassword)
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Error update password",
        data: {
          otp: false,
        },
      });

    const userObj = resultUpdateForgotPassword.toObject();
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
      message: "Update password success",
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
    next(new AuthError(`Error update forgot password: ${error.message}`, 400));
  }
});

authRoute.post(`/request-otp/change-password`, userByEmail, async (req, res, next) => {
  try {
    const dataUserDB = req.dataUserDB;

    const resutlSendMessageOTP = await requestOTP(dataUserDB.secret, email);

    res.status(202).json({
      status: "success",
      code: 202,
      message: "OTP change password success",
      data: {
        otp: resutlSendMessageOTP,
      },
    });
  } catch (error) {
    next(new AuthError(`Error requ est otp change password: ${error.message}`, 400));
  }
});

authRoute.post(`/verify-otp/change-password`, userByEmail, async (req, res, next) => {
  try {
    const { dataUser } = req.body;
    const dataUserDB = req.dataUserDB;

    const resultVerifyTokenOTP = verifyTokenOTP(dataUser.token, dataUserDB.secret);

    if (resultVerifyTokenOTP === false)
      return res.status(422).json({
        status: "error",
        code: 422,
        message: "OTP change password invalid",
        data: {
          otp: false,
        },
      });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "OTP change password success",
      data: {
        otp: true,
        _id: dataUserDB?._id,
        username: dataUserDB?.username,
        email: dataUserDB?.email,
        profile: dataUserDB?.profile,
      },
    });
  } catch (error) {
    next(new AuthError(`Error request otp change password: ${error.message}`, 400));
  }
});

authRoute.post(`/verify-old-password`, userByID, async (req, res, next) => {n
  try {
    const dataUserDB = req.dataUserDB;
    const { dataUser } = req.body;

    if (!dataUser._id || !dataUser.username || !dataUser.email || !dataUser.otp || !dataUser.profile)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Data not found",
        data: {
          otp: false,
        },
      });

    if (dataUser.newPassword !== dataUserDB.password)
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Old password is incorrect.",
        data: {
          otp: false,
        },
      });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "Verify old password success",
      data: {
        _id: dataUserDB?._id,
        username: dataUserDB?.username,
        email: dataUserDB?.email,
        profile: dataUserDB?.profile,
      },
    });
  } catch (error) {
    next(new AuthError(`Error verify old password: ${error.message}`, 400));
  }
});

authRoute.post(`/change-password`, userByID, async (req, res, next) => {
  try {
    const dataUserDB = req.dataUserDB;
    const { dataUser } = req.body;

    if (!dataUser._id || !dataUser.username || !dataUser.email || !dataUser.otp || !dataUser.profile)
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Data not found",
        data: {
          otp: false,
        },
      });

    const resultChangePassword = await User.findOneAndUpdate(
      { _id: dataUserDB._id },
      { password: dataUser?.newPassword },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!resultChangePassword)
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Error change password",
      });

    const userObj = resultChangePassword.toObject();
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
      message: "Update password success",
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
    next(new AuthError(`Error update change password: ${error.message}`, 400));
  }
});

authRoute.post(`/refresh`, verifyToken, (req, res) => {
  try {
    const { accessToken, refreshToken, status } = req;

    if (status === "refresh")
      res.cookie("refresh-token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.SAMESITE,
        maxAge: 1000 * 60 * 60 * 168,
        path: "/",
      });

    res.status(202).json({
      status: "success",
      code: 202,
      message: "OTP register success",
      tokens: {
        tokens: status === "refresh" ? { accessToken } : undefined,
      },
    });
  } catch (error) {
    next(new AuthError(`Error refresh token: ${error.message}`, 400));
  }
});

authRoute.post(`/logout`, verifyToken, userByID, (req, res) => {
  try {
    res.clearCookie("refresh-token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.SAMESITE,
      maxAge: 1000 * 60 * 60 * 168,
      path: "/",
    });

    res.status(204).json({
      status: "success",
      code: 204,
      message: "Logout success",
    });
  } catch (error) {
    next(new AuthError(`Error logout: ${error.message}`, 400));
  }
});

export default authRoute;
