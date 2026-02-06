import express from "express";
import {
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getAllTestimonials,
  getTestimonialById
} from "../controllers/testimonialController.js";

const router = express.Router();

// CREATE
router.post("/", createTestimonial);

// UPDATE
router.put("/:id", updateTestimonial);

// DELETE
router.delete("/:id", deleteTestimonial);

// GET ALL
router.get("/", getAllTestimonials);

// GET BY ID
router.get("/:id", getTestimonialById);

export default router;
