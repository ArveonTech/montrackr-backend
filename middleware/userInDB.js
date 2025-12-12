import User from "../models/user.js";

export const userByID = async (req, res, next) => {
  try {
    const { dataUser } = req.body;

    const dataUserDB = await User.findById(dataUser?._id);

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
