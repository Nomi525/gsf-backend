import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import routes from "./src/routes/routes.js";
import { Server, app } from "./src/services/socket.js";
dotenv.config();

app.use(express.json());
app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use("/public/images", express.static("public/uploads"));
app.use("/api", routes);
const PORT = process.env.PORT || 5000;
export default app;
Server.listen(PORT, () => {
  console.log("listening on port", PORT);
});
