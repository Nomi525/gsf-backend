// controllers/adminAuth.js
import { StatusCodes } from "http-status-codes";
import ResponseMessage from "../../utils/HTTPResponse.js";
import { PrismaClient } from "@prisma/client";
import {
  Response,
  comaparePassword,
  generateOtp,
  generatePassword,
  generateToken,
} from "../../services/common.js";
import { forgotPasswordMailService } from "../../services/mailService.js";
import { sessions } from "../users/userAuth.js"; // Session store

const prisma = new PrismaClient();


export const adminRegistration = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if all required fields are present
        if (!name || !email || !password) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: StatusCodes.BAD_REQUEST,
                message: ResponseMessage.FIELDS_NOT_FOUND,
            });
        }

        // Check if admin already exists
        const checkAdminExists = await prisma.admin.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (checkAdminExists) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: StatusCodes.BAD_REQUEST,
                message: "Admin with this email already exists.",
            });
        }

        // Hash the password before saving
        const hashedPassword = await generatePassword(password);

        // Create new admin
        const newAdmin = await prisma.admin.create({
            data: {
                name: name,
                email: email.toLowerCase(),
                password: hashedPassword,
            },
        });

        // Create a JWT token for the new admin
        const payload = {
            id: newAdmin.id,
            type: 'admin',
        };
        const token = await generateToken(payload);

        return res.status(StatusCodes.CREATED).json({
            status: StatusCodes.CREATED,
            message: "Admin registered successfully.",
            data: { token, type: 'admin' },
        });
    } catch (err) {
        console.error(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: ResponseMessage.INTERNAL_SERVER_ERROR,
            data: err.message,
        });
    }
};


export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: ResponseMessage.FIELDS_NOT_FOUND,
      });
    }

    const checkAdmin = await prisma.admin.findUnique({
      where: { email: email },
    });

    if (!checkAdmin) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: StatusCodes.NOT_FOUND,
        message: ResponseMessage.ADMIN_NOT_FOUND,
      });
    }

    const isMatch = await comaparePassword(password, checkAdmin.password);
    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: ResponseMessage.INVALID_LOGIN_CREDENTIALS,
      });
    }

    const payload = {
      id: checkAdmin.id,
      type: "admin",
    };

    const token = await generateToken(payload);

    // Manage admin session
    if (sessions[checkAdmin.id]) {
      delete sessions[checkAdmin.id]; // Remove any previous session
    }
    sessions[checkAdmin.id] = token;

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: ResponseMessage.LOGIN_SUCCESS,
      data: { token, type: "admin" },
    });
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: ResponseMessage.INTERNAL_SERVER_ERROR,
      data: err.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: ResponseMessage.FIELDS_NOT_FOUND,
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: email },
    });

    if (!admin) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: StatusCodes.NOT_FOUND,
        message: ResponseMessage.ADMIN_NOT_FOUND,
      });
    }

    const otp = generateOtp();
    await prisma.admin.update({
      where: { id: admin.id },
      data: { otp: otp },
    });

    await forgotPasswordMailService(admin, otp);

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: ResponseMessage.FORGOT_PASSWORD_EMAIL_SENT,
    });
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: ResponseMessage.INTERNAL_SERVER_ERROR,
      data: err.message,
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { OTP, email } = req.body;
    const admin = await prisma.admin.findFirst({
      where: { email: email, otp: OTP },
    });

    if (!admin) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: ResponseMessage.INVALID_OTP,
      });
    }

    const payload = {
      id: admin.id,
      type: "admin",
    };

    const token = await generateToken(payload);

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: ResponseMessage.OTP_VERIFIED,
      data: token,
    });
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: ResponseMessage.INTERNAL_SERVER_ERROR,
      data: err.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: ResponseMessage.FIELDS_NOT_FOUND,
      });
    }

    const hashedNewPassword = await generatePassword(newPassword);

    await prisma.admin.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword },
    });

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: ResponseMessage.PASSWORD_CHANGED,
    });
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: ResponseMessage.INTERNAL_SERVER_ERROR,
      data: err.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { newPassword, oldPassword } = req.body;
    if (!newPassword || !oldPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: ResponseMessage.FIELDS_NOT_FOUND,
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id },
    });

    const isMatch = await comparePassword(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: ResponseMessage.OLDPASSWORD_DONT_MATCH,
      });
    }

    const hashedNewPassword = await generatePassword(newPassword);
    await prisma.admin.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword },
    });

    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      message: ResponseMessage.PASSWORD_UPDATED_SUCCESSFULLY,
    });
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      message: ResponseMessage.INTERNAL_SERVER_ERROR,
      data: err.message,
    });
  }
};
