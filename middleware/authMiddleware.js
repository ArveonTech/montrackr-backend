import { authenticateToken } from "../helper/authHelper.js";
import jwt from "jsonwebtoken";

export const verifyUser = (req, res, next) => {
  // ambil access token di header
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader && authHeader.split(" ")[1];

  const refreshToken = req.cookies["refresh-token"];

  if (!accessToken && !refreshToken) return res.status(403).json({ message: "No token provided" });

  const result = authenticateToken(accessToken, refreshToken);

  if (result.success === false) return res.status(401).json({ message: result.error });

  if (result.status === "refresh") {
    req.refreshToken = result.refreshToken;
    req.accessToken = result.accessToken;
    req.user = jwt.decode(result.accessToken);
  } else if (result.status === "ok") {
    req.user = result.payload;
  }

  next();
};
