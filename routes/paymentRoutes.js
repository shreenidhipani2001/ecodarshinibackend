import express from "express";
import {
  createPayment,
  getAllPayments,
  updatePayment,
  getPaymentById,
  deletePayment,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.get("/", getAllPayments);
router.get("/:id", getPaymentById);
router.post("/add", createPayment);
router.post("/create-order", createRazorpayOrder);
router.post("/verify", verifyRazorpayPayment);
router.put("/:id", updatePayment);
router.delete("/:id", deletePayment);

export default router;
