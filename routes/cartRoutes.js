import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";


 

const router = express.Router();


router.post("/", authMiddleware, addToCart);
router.get("/", authMiddleware, getCart);
router.put("/:productId", authMiddleware, updateCartItem);
router.delete("/:productId", authMiddleware, removeFromCart);