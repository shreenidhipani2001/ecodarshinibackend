import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUserId,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController.js";

const router = express.Router();

router.get("/", getAllOrders);
router.get("/:id", getOrderById);
router.get("/user/:userId", getOrdersByUserId);
router.post("/add", createOrder);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

export default router;
