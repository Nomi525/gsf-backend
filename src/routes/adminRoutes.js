import { Router } from "express";
import {
  adminLogin,
  adminRegistration,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyOtp,
} from "../controllers/admin/adminAuth.js";
import {
  createEquipmentType,
  dashboard,
  getEquipmentList,
  updateAdminProfile,
  viewAdminProfile,
} from "../controllers/admin/adminProfile.js";
import { changeStatusOfUser, deleteUser } from "../controllers/admin/users.js";
import { authCheck } from "../middleware/authMiddleware.js";
import uploadMiddleware from "../middleware/multer.js";
import {
  bulkImportControlForms,
  exportControlForms,
  getControlFormsFilters,
  getDistinctExtractedTextWithUserDetails,
  usersList,
} from "../controllers/admin/list.js";

import { body } from "express-validator";
import multer from "multer";

const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage });

const adminCheck = authCheck("admin");
const adminRouter = Router();

// admin authentication routes
adminRouter.post("/register", adminRegistration); // Admin registration route
adminRouter.post("/login", adminLogin);
adminRouter.post("/forgotPassword", forgotPassword);
adminRouter.post("/verifyOtp", verifyOtp);
adminRouter.post("/resetPassword", adminCheck, resetPassword);
adminRouter.post("/changePassword", adminCheck, changePassword);

adminRouter.post(
  "/updateProfile",
  adminCheck,
  uploadMiddleware,
  updateAdminProfile
);
adminRouter.get("/viewProfile", adminCheck, viewAdminProfile);
adminRouter.get("/userList", adminCheck, usersList);
adminRouter.delete("/user/:id", adminCheck, deleteUser);
adminRouter.post("/user/status", adminCheck, changeStatusOfUser);
adminRouter.post("/dashboard", adminCheck, dashboard);

// Route for retrieving control details grouped by extractedText for admin
adminRouter.get(
  "/control-grouped-details",
  adminCheck,
  getDistinctExtractedTextWithUserDetails
);

adminRouter.post("/control-form-filters", adminCheck, getControlFormsFilters);
adminRouter.get("/control-form-export", adminCheck, exportControlForms);

adminRouter.post(
  "/bulk-import-control-form-data",
  // [
  //   body("functionalPhotoId")
  //     .notEmpty()
  //     .withMessage("Functional photo ID is required"),
  //   body("materialPhotoId")
  //     .notEmpty()
  //     .withMessage("Material photo ID is required"),
  //   body("referenceText").notEmpty().withMessage("Extracted text is required"),
  //   body("controlForms")
  //     .isArray()
  //     .withMessage("Control forms must be an array"),
  // ],
  upload.single("file"),
  bulkImportControlForms
);

adminRouter.post("/create-equipment", adminCheck, createEquipmentType);
adminRouter.get("/list-equipment", adminCheck, getEquipmentList);
// end of admin authentication routes
export default adminRouter;
