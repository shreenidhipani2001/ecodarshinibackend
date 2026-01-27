import express from "express";
import {
  createUser,
  loginUser,
  logoutUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getCurrentUser,
} from "../controllers/userController.js";
 
const router = express.Router();

// PUBLIC
router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// PROTECTED
router.get("/", getAllUsers);
router.post("/me",getCurrentUser)
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
