import express from "express";
import {
  createProduct,uploadProduct,
  getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} from "../controllers/productController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {uploadProductImages} from "../config/multerCloudinary.js";


 

const router = express.Router();


router.post(
  "/",
  uploadProductImages.array("images", 5), // max 5 images
  uploadProduct
);

router.post("/", authMiddleware,   createProduct);
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.put("/:id", authMiddleware,   updateProduct);
router.delete("/:id", authMiddleware,  deleteProduct);

export default router;