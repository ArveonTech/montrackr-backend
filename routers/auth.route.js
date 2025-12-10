import express from "express";
import User from "../models/user.js";
import { google } from "googleapis";
import { createAccessToken, createRefreshToken } from "../utils/authToken.js";
import { AuthError } from "../helpers/errorHandler.js";

const app = express();
app.use(express.json());

const oauth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, "http://localhost:3000/auth/google/callback");

const scopes = ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"];

const authorizationUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
  include_granted_scopes: true,
});

const authRoute = express.Router();

authRoute.get(`/google`, (req, res) => {
  try {
    res.redirect(authorizationUrl);
  } catch (error) {
    throw new AuthError("Error register google", 500);
  }
});

authRoute.get(`/google/callback`, async (req, res) => {
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

    if (!user) {
      res.status(401).json({
        status: "register",
        user: {
          email: data.email,
          name: data.name,
        },
      });
    }

    const userObj = user.toObject();
    const { password, balance, currency, otp, createdAt, updatedAt, ...payloadJWT } = userObj;

    const accessToken = createAccessToken(payloadJWT);
    const refreshToken = createRefreshToken(payloadJWT);

    res.cookie("refresh-token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 168,
      path: "/",
    });

    res.status(200).json({
      status: "success",
      auth: "login",
      user: {
        email: user.email,
        username: user.username,
      },
      tokens: {
        accessToken,
      },
    });
  } catch (error) {
    throw new AuthError("Error callback google", 500);
  }
});

export default authRoute;
