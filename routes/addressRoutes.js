import express from "express";
import {
  createAddress,
  getAllAddresses,
  getAddressById,
  getAddressesByUserId,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";

const router = express.Router();

router.post("/add", createAddress);
router.get("/", getAllAddresses);
router.get("/user/:userId", getAddressesByUserId);
router.get("/:id", getAddressById);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

export default router;
