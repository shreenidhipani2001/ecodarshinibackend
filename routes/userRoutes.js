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
  checkEmail,
  getUserCredentials,
  sendPassword
} from "../controllers/userController.js";
 
const router = express.Router();

// PUBLIC
router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/check-email", checkEmail);
router.post("/get-credentials", getUserCredentials);
router.post("/send-password", sendPassword);
// PROTECTED
router.get("/", getAllUsers);
router.post("/me",getCurrentUser)
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
