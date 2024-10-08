import express from "express";
import {
  changePassword,
  forgotPassword,
  resetPassword,
  userLogin,
  userRegistration,
  verifyOtp,
} from "../controllers/users/userAuth.js";
import {
  deleteUser,
  updateUserProfile,
  viewUserProfile,
} from "../controllers/users/userProfile.js";
import { authCheck } from "../middleware/authMiddleware.js";
import uploadMiddleware from "../middleware/multer.js";

const userCheck = authCheck("user");

const userRoutes = express.Router();

userRoutes.post("/register", userRegistration);
userRoutes.post("/login", userLogin);
userRoutes.post("/forgotPassword", forgotPassword);
userRoutes.post("/verifyOtp", verifyOtp);
userRoutes.post("/resetPassword", userCheck, resetPassword);
userRoutes.post("/changePassword", userCheck, changePassword);
userRoutes.post("/deleteAccount", userCheck, deleteUser);
userRoutes.get("/profile", userCheck, viewUserProfile);
userRoutes.post(
  "/updateProfile",
  userCheck,
  uploadMiddleware,
  updateUserProfile
);

export default userRoutes;
