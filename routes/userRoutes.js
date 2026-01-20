import express from "express";
import {
  createUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getCurrentUser,
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// PUBLIC
router.post("/register", createUser);
router.post("/login", loginUser);

// PROTECTED
router.get("/", authMiddleware, getAllUsers);
router.post("/me",getCurrentUser)
router.get("/:id", authMiddleware, getUserById);
router.put("/:id", authMiddleware, updateUser);
router.delete("/:id", authMiddleware, deleteUser);

export default router;
