import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config();


export const generatePassword = async (password) => {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(password, salt)
}

export const comaparePassword = async (password, oldPassword) => {
    return await bcrypt.compare(password, oldPassword)
}

export const generateToken = async (data) => {
    return jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '1d' })
}

export const generateOtp = () => {
    const otpLength = 4;
    let otp = '';
    for (let i = 0; i < otpLength; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
};



export const alreadyExist = async (model, parameters) => {
    try {
        const result = await model.findUnique({
            where: parameters, 
        });
        return result !== null;
    } catch (error) {
        // Handle error
        console.error("Error checking existence:", error);
        throw error;
    }
};



export const Response = (res, StatusCode, message, data) => {
    return res.status(StatusCode).json({
        status: StatusCode,
        message: message,
        data: data
    })
}



export const autoGeneratePassword = (length = 8) => {
    const Allowed = {
        Uppers: "QWERTYUIOPASDFGHJKLZXCVBNM",
        Lowers: "qwertyuiopasdfghjklzxcvbnm",
        Numbers: "1234567890",
        Symbols: "!@#$&",
    };
    const getRandomCharFromString = (str) =>
        str.charAt(Math.floor(Math.random() * str.length));
    let pwd = "";
    pwd += getRandomCharFromString(Allowed.Uppers);
    pwd += getRandomCharFromString(Allowed.Lowers);
    pwd += getRandomCharFromString(Allowed.Numbers);
    pwd += getRandomCharFromString(Allowed.Symbols);
    for (let i = pwd.length; i < length; i++)
        pwd += getRandomCharFromString(Object.values(Allowed).join(""));
    return pwd;
}


// export const TransactionIdGenerator = () => {
//     const randomNumber = Math.floor(Math.random() * 1000000000); // Multiplied by a large number to avoid getting 0
//     return 'TX_' + randomNumber.toString().padStart(5, '0'); // Pad the number with leading zeros if necessary to make it 5 digits long
// }




