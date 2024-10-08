import dotenv from 'dotenv';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import ResponseMessage from '../utils/HTTPResponse.js';

dotenv.config();

const authCheck = (requiredRole) => (req, res, next) => {
    var token = req.headers?.authorization?.split('Bearer ')[1]
    if (!token) {
        return res.status(StatusCodes.NOT_FOUND).json({ status: StatusCodes.NOT_FOUND, message: ResponseMessage.ACCESS_TOKEN_NOTFOUND })
    }
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userRole = decodedToken.type;
        // console.log(userRole,"sjdgf");
       
         // Assuming the user role is included in the JWT payload
        // if (userRole == 'user') {
        //     if (sessions[decodedToken.id] !== token) {
        //         return res.status(StatusCodes.UNAUTHORIZED).json({ status: StatusCodes.UNAUTHORIZED, message: ResponseMessage.UNAUTHORIZED });
        //     }
        // }
        if (userRole !== requiredRole) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ status: StatusCodes.UNAUTHORIZED, message: ResponseMessage.UNAUTHORIZED });
        }
        req.user = decodedToken;
        console.log(req.user,"jjsjsj");
        next();
    } catch (err) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ status: StatusCodes.UNAUTHORIZED, message: ResponseMessage.UNAUTHORIZED });
    }
};


const commonAuth = async (req, res, next) => {
    var token = req.headers?.authorization?.split('Bearer ')[1]
    if (!token) {
        return res.status(StatusCodes.NOT_FOUND).json({ status: StatusCodes.NOT_FOUND, message: ResponseMessage.ACCESS_TOKEN_NOTFOUND })
    }
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userRole = decodedToken.type; // Assuming the user role is included in the JWT payload
        if (userRole == 'admin' || userRole == 'user' || userRole == 'business') {
            req.user = decodedToken;
            next();
        }
    } catch (err) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ status: StatusCodes.UNAUTHORIZED, message: ResponseMessage.UNAUTHORIZED });
    }
}


export { authCheck, commonAuth };
