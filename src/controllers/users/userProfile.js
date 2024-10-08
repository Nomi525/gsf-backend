// controllers/userProfile.js
import { StatusCodes } from "http-status-codes";
import ResponseMessage from "../../utils/HTTPResponse.js";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const updateUserProfile = async (req, res) => {
    try {
        let updatedProfile = req.body;

        // If you are using a file upload middleware like multer, handle files accordingly.
        if (req?.files?.length > 0) {
            updatedProfile.image = req.files[0].filename;
        }

        const updatedUserProfile = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                name: updatedProfile.name,
                image: updatedProfile.image,
            },
        });

        return res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: ResponseMessage.USER_PROFILE_UPDATED,
            data: updatedUserProfile,
        });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: ResponseMessage.INTERNAL_SERVER_ERROR,
            data: err.message
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.user.id },
            data: { isDeleted: true }
        });
        return res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: ResponseMessage.USER_ACCOUNT_DELETED,
        });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: ResponseMessage.INTERNAL_SERVER_ERROR,
            data: err.message
        });
    }
};

export const viewUserProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });
        return res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            message: ResponseMessage.USER_PROFILE,
            data: user
        });
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: ResponseMessage.INTERNAL_SERVER_ERROR,
            data: err.message
        });
    }
};
