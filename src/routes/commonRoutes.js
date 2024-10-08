import express from "express";
import {
  createControlFrom,
  getControlDetailsGroupedByExtractedText,
  getDetailsByExtractedText,
  uploadFunctionalPhoto,
  uploadMaterialPhoto,
} from "../controllers/common/controlFormPhotoController.js";
import { authCheck } from "../middleware/authMiddleware.js";
import uploadMiddleware from "../middleware/multer.js";
import { getControlFormsFilters } from "../controllers/admin/list.js";

const userCheck = authCheck("user");
const commonRoutes = express.Router();
// Route for uploading a functional photo
commonRoutes.post(
  "/functional-photo",
  userCheck,
  uploadMiddleware,
  uploadFunctionalPhoto
);

// Route for uploading a material photo
commonRoutes.post(
  "/material-photo",
  userCheck,
  uploadMiddleware,
  uploadMaterialPhoto
);
commonRoutes.post("/create-control-form", userCheck, createControlFrom);
commonRoutes.get(
  "/control-from-details/:extractedText",
  userCheck,
  getDetailsByExtractedText
);

commonRoutes.get(
  "/control-from-grouped-details",
  userCheck,
  getControlDetailsGroupedByExtractedText
);

commonRoutes.post("/control-form-filters", userCheck, getControlFormsFilters);

export default commonRoutes;
