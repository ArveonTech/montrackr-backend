import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./database/db.js";
import cookieParser from "cookie-parser";

// routers
import authRoute from "./routers/auth.routes.js";
import usersRoute from "./routers/users.routes.js";
import transactionsRoute from "./routers/transactions.routes.js";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRoute);
app.use("/users", usersRoute);
app.use("/transactions", transactionsRoute);

app.get("/", (req, res) => {
  res.json({ message: "Backend up and running" });
});

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  console.info(err);
  const message = err.isOperational ? err.message : "Something went wrong";
  res.status(status).json({
    status: "error",
    code: status,
    message: message,
  });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
