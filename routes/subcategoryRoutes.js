import express from "express";
import {
  createSubcategory,
  getAllSubcategories,
  getSubcategoryById,
  getSubcategoriesByCategoryId,
  updateSubcategory,
  deleteSubcategory,
  getProductsBySubcategoryId,
} from "../controllers/subcategoryController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getAllSubcategories);
router.get("/:id", getSubcategoryById);
router.get("/:id/products", getProductsBySubcategoryId);
router.get("/category/:categoryId", getSubcategoriesByCategoryId);
router.post("/", authMiddleware, createSubcategory);
router.put("/:id", authMiddleware, updateSubcategory);
router.delete("/:id", authMiddleware, deleteSubcategory);

export default router;
