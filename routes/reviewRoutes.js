import express from "express";
import {
    createReview,getAllReviews,
    getReviewById,
    getReviewsByProductId,
    getReviewsByUserId,
    updateReview,deleteReview,
} from "../controllers/reviewController.js";
import {uploadProductImages} from "../config/multerCloudinary.js";


 

const router = express.Router();


router.post(
  "/",
  uploadProductImages.array("images", 5), 
  updateReview
);

router.post("/add",   createReview);
router.get("/", getAllReviews);
router.get("/review-for-this/:id", getReviewsByProductId);
router.get("/:id", getReviewById);
router.get("/user/:id", getReviewsByUserId);
router.put("/:id",   updateReview);
router.delete("/:id",  deleteReview);

export default router;