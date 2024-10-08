// controllers/users.js
import { StatusCodes } from "http-status-codes";
import ResponseMessage from "../../utils/HTTPResponse.js";
import { Response } from "../../services/common.js";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const deleteUser = async (req, res) => {
    try {
        const updateUser = await prisma.user.update({
            where: { id: req.params.id },
            data: { isDeleted: true },
        });

        if (updateUser) {
            return Response(res, StatusCodes.OK, ResponseMessage.USER_DELETED);
        } else {
            return Response(res, StatusCodes.NOT_FOUND, "User not found.");
        }
    } catch (err) {
        console.error(err);
        return Response(res, StatusCodes.INTERNAL_SERVER_ERROR, ResponseMessage.INTERNAL_SERVER_ERROR);
    }
};

export const changeStatusOfUser = async (req, res) => {
    try {
        const { id, status } = req.body;

        const updateUser = await prisma.user.update({
            where: { id: id },
            data: { isActive: status === "true" }, // Convert string to boolean
        });

        let responseMessage;

        if (status === "true") {
            responseMessage = ResponseMessage.USER_ACTIVATED_SUCCESSFULLY;
        } else {
            responseMessage = ResponseMessage.USER_DEACTIVATED_SUCCESSFULLY;
        }

        return Response(res, StatusCodes.OK, responseMessage);
    } catch (err) {
        console.error(err);
        return Response(res, StatusCodes.INTERNAL_SERVER_ERROR, ResponseMessage.INTERNAL_SERVER_ERROR);
    }
};
