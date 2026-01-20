import express from "express";
import {
  addToWishlist,
  getAllWishlistItems,
  getWishlistItemById,
  updateWishlistItem,
  deleteWishlistItem,
} from "../controllers/wishlistController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Add to wishlist
router.post("/add", addToWishlist);

// Get all wishlist items for logged-in user
router.get("/", getAllWishlistItems);

// Get wishlist item by ID
router.get("/:id", getWishlistItemById);

// Partial update (change product_id)
router.patch("/:id", updateWishlistItem);

// Delete wishlist item
router.delete("/:id", deleteWishlistItem);

export default router;
