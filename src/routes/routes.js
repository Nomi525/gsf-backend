import express from "express";
import adminRoutes from "./adminRoutes.js";
import commonRoutes from "./commonRoutes.js";
import userRoutes from "./userRoutes.js";

const routes = express.Router();

routes.use("/admin", adminRoutes);
routes.use("/common", commonRoutes);
routes.use("/user", userRoutes);

export default routes;
