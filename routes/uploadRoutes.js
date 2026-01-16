import express from "express";
import { uploadProductImages } from "../config/multerCloudinary.js";
import { uploadProductImagesController } from "../controllers/uploadController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/products",
  authMiddleware,
 
  uploadProductImages.array("images", 5),
  uploadProductImagesController
);

export default router;
