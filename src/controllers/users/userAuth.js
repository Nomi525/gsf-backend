// controllers/userAuth.js
import { PrismaClient } from '@prisma/client';
import { StatusCodes } from "http-status-codes";
import { alreadyExist, comaparePassword, generateOtp, generatePassword, generateToken } from "../../services/common.js";
import { forgotPasswordMailService } from "../../services/mailService.js";
import ResponseMessage from "../../utils/HTTPResponse.js";

const prisma = new PrismaClient();
export const sessions = {}; // Session store to track active sessions

export const userRegistration = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: StatusCodes.BAD_REQUEST,
                message: ResponseMessage.FIELDS_NOT_FOUND,
            });
        }

        const checkIfAlreadyExists = await alreadyExist(prisma.user, { email: email.toLowerCase() });
        if (checkIfAlreadyExists) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: StatusCodes.BAD_REQUEST,
                message: "User already exists with this email"
            });
        }

        const hashedPassword = await generatePassword(password);
        const createNewUser = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name: name,
            },
        });

        return res.status(StatusCodes.CREATED).json({
            status: StatusCodes.CREATED,
            message: "User Registered",
        });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: ResponseMessage.INTERNAL_SERVER_ERROR,
            data: err.message
        });
    }
};

export const userLogin = async (req, res) => {
    try {
        const { email, password, fcmToken } = req.body;
        if (!email || !password) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: StatusCodes.BAD_REQUEST,
                message: ResponseMessage.FIELDS_NOT_FOUND,
            });
        }

        let checkUser = await prisma.user.findFirst({
            where: {
                email: email,
                isDeleted: false,
                isActive: true
            }
        });

        if (!checkUser) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: StatusCodes.NOT_FOUND,
                message: ResponseMessage.USER_NOT_FOUND,
            });
        }
        if (checkUser.isActive === false) {
            return res.status(StatusCodes.OK).json({
                status: StatusCodes.OK,
                message: ResponseMessage.YOUR_ACCOUNT_IS_DEACTIVATED,
            });
        }

        let isMatch = await comaparePassword(password, checkUser.password);
        if (!isMatch) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: StatusCodes.UNAUTHORIZED,
                message: ResponseMessage.INVALID_LOGIN_CREDENTIALS,
            });
        }

        const payload = {
            id: checkUser.id,
            type: 'user'
        };

        const token = await generateToken(payload);

        // Store the token in the session
        if (sessions[checkUser.id]) {
            delete sessions[checkUser.id]; // Remove the previous session
        }
        sessions[checkUser.id] = token;

        return res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: ResponseMessage.LOGIN_SUCCESS,
            data: { token: token, type: 'user' }
        });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: ResponseMessage.INTERNAL_SERVER_ERROR,
            data: err.message
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

        let user = await prisma.user.findUnique({
            where: { email: email, isDeleted: false }
        });

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: StatusCodes.NOT_FOUND,
                message: ResponseMessage.USER_NOT_FOUND,
            });
        }

        let otp = generateOtp();
        await prisma.user.update({
            where: { id: user.id },
            data: { otp: otp }
        });

        await forgotPasswordMailService(user, otp);
        return res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: ResponseMessage.FORGOT_PASSWORD_EMAIL_SENT,
        });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: ResponseMessage.INTERNAL_SERVER_ERROR,
            data: err.message
        });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { OTP, email } = req.body;
        let user = await prisma.user.findUnique({
            where: { email: email, isDeleted: false }
        });

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                status: StatusCodes.NOT_FOUND,
                message: ResponseMessage.USER_NOT_FOUND,
            });
        }

        const userWithOtp = await prisma.user.findUnique({
            where: { email: email, otp: OTP }
        });

        if (!userWithOtp) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: StatusCodes.BAD_REQUEST,
                message: ResponseMessage.INVALID_OTP,
            });
        }

        const payload = {
            id: userWithOtp.id,
            type: 'user',
        };

        let token = await generateToken(payload);
        return res.status(StatusCodes.OK).json({ 
            status: StatusCodes.OK, 
            message: ResponseMessage.OTP_VERIFIED, 
            data: token 
        });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: ResponseMessage.INTERNAL_SERVER_ERROR,
            data: err.message
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

        let hashedNewPassword = await generatePassword(newPassword);
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedNewPassword }
        });

        return res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: ResponseMessage.PASSWORD_CHANGED,
        });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: ResponseMessage.INTERNAL_SERVER_ERROR,
            data: err.message
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { newPassword, oldPassword } = req.body;
        if (!newPassword && !oldPassword) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: StatusCodes.BAD_REQUEST,
                message: ResponseMessage.FIELDS_NOT_FOUND,
            });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });

        if (!(await comparePassword(oldPassword, user.password))) {
            return res.status(StatusCodes.BAD_REQUEST).json({ 
                status: StatusCodes.BAD_REQUEST, 
                message: ResponseMessage.OLDPASSWORD_DONT_MATCH 
            });
        }

        if ((await comparePassword(newPassword, user.password))) {
            return res.status(StatusCodes.CONFLICT).json({ 
                status: StatusCodes.CONFLICT, 
                message: ResponseMessage.NEW_PASSWORD_MATCHED_WITH_OLDPASSWORD 
            });
        }

        user.password = await generatePassword(newPassword);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: user.password }
        });

        return res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: ResponseMessage.PASSWORD_UPDATED_SUCCESSFULLY,
        });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: ResponseMessage.INTERNAL_SERVER_ERROR,
            data: err.message
        });
    }
};

// Uncomment this if needed
// export const userUpdateDeviceToken = async (req, res) => {
//     // Your implementation for device token update
// };
