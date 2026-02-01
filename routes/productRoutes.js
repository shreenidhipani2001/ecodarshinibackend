import express from "express";
import {
  createProduct,uploadProduct,
  getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getAllProductsCat
} from "../controllers/productController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {uploadProductImages} from "../config/multerCloudinary.js";


 

const router = express.Router();


router.post(
  "/",
  uploadProductImages.array("images", 5), // max 5 images
  uploadProduct
);

router.post("/add",   createProduct);
router.get("/", getAllProducts);
router.get("/cat", getAllProductsCat);
router.get("/:id", getProductById);
router.put("/:id",   updateProduct);
router.delete("/:id",  deleteProduct);

export default router;