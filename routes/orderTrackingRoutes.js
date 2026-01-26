import express from "express";
import {
  addTrackingUpdate,
  addTrackingWithAddress,
  getTrackingHistory,
  getCurrentStatus,
  getAllTrackingEntries,
  deleteTrackingEntry,
  updateTrackingEntry,getAllTrackingEntriesForAUser
} from "../controllers/orderTrackingController.js";

const router = express.Router();

// Get all tracking entries (Admin)
router.get("/", getAllTrackingEntries);
router.get("/my/:userId", getAllTrackingEntriesForAUser);

// Get tracking history for an order
router.get("/order/:orderId", getTrackingHistory);

// Get current/latest status for an order
router.get("/order/:orderId/current", getCurrentStatus);

// Add tracking update with coordinates (reverse geocoding)
router.post("/add", addTrackingUpdate);

// Add tracking update with address text (search geocoding)
router.post("/add-with-address", addTrackingWithAddress);

// Update tracking entry
router.put("/:id", updateTrackingEntry);

// Delete tracking entry
router.delete("/:id", deleteTrackingEntry);

export default router;
