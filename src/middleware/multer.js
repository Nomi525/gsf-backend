import multer from "multer";
import fs from "fs";
import { StatusCodes } from "http-status-codes";
import ResponseMessage from "../utils/HTTPResponse.js";

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    let path = "public/uploads/";
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
    callback(null, path);
  },
  filename: function (req, file, callback) {
    const ext = file.originalname.split(".");
    callback(
      null,
      Date.now() +
        (Math.random() + 1).toString(36).substring(7) +
        "." +
        ext[ext.length - 1]
    );
  },
});

const uploadMiddleware = multer({ storage }).any();

export default function (req, res, next) {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Handle multer errors
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        message: ResponseMessage.SOMETHING_WENT_WRONG,
        data: [err.message],
      });
    } else if (err) {
      // Handle other errors
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ResponseMessage.SOMETHING_WENT_WRONG,
        data: [err.message],
      });
    } else {
      // No error, move to the next middleware
      next();
    }
  });
}
