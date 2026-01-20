// import express from "express";
// import { authMiddleware } from "../middlewares/authMiddleware.js";


 

// const router = express.Router();


// router.post("/", authMiddleware, addToCart);
// router.get("/", authMiddleware, getCart);
// router.put("/:productId", authMiddleware, updateCartItem);
// router.delete("/:productId", authMiddleware, removeFromCart);

import express from "express";
import {
  addToCart,
  getAllCartItems,
  getCartItemById,
  updateCartItem,
  removeCartItem,getAllUserCartItems
} from "../controllers/cartController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Add item to cart
router.post("/add",  addToCart);

// Get all cart items for logged-in user
router.get("/",  getAllCartItems);

// Get cart item by ID
router.get("/:id",  getCartItemById);
router.get("/user/:userId",  getAllUserCartItems);

// Partial update (quantity)
router.patch("/:id",  updateCartItem);

// Remove item from cart
router.delete("/:id",  removeCartItem);

export default router;
