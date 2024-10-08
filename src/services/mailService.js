import dotenv from "dotenv";
import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
dotenv.config();

let __dirname = path.resolve();

let transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_APPPASSWORD,
  },
});

export const forgotPasswordMailService = async (userDetails, otp) => {
  const html = await ejs.renderFile(
    path.join(__dirname + "/src/view/ForgotPassword.ejs"),
    { name: userDetails.email, otp }
  );
  let mailOptions = {
    from: "noman@gsf.com", // sender address
    to: userDetails.email, // list of receivers
    subject: `Forgot Password`, // Subject line
    html: html, // html body
  };
  await transporter.sendMail(mailOptions);
};
