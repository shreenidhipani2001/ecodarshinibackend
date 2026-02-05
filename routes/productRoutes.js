import express from "express";
import {
  createProduct,
  uploadProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllProductsCat,
  getProductsByIds,
  getAll5Latest,getAllProductsCategorywise
} from "../controllers/productController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { uploadProductImages } from "../config/multerCloudinary.js";

const router = express.Router();

router.post(
  "/",
  uploadProductImages.array("images", 5), // max 5 images
  uploadProduct
);

router.post("/add", createProduct);
router.post("/by-ids", getProductsByIds); // New route for cart/wishlist products
router.get("/", getAllProducts);
router.get("/cat", getAllProductsCat);
router.get("/five-latest", getAll5Latest); // Must be BEFORE /:id
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.get("/category/:id", getAllProductsCategorywise);

export default router;