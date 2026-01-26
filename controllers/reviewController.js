import { pool } from "../db/pgClient.js";

// CREATE REVIEW
export const createReview = async (req, res) => {
  const { user_id, product_id, rating, comment } = req.body;

  try {
    // Validation
    if (!user_id || !product_id || !rating) {
      return res.status(400).json({
        message: "user_id, product_id, and rating are required"
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5"
      });
    }

    // Check if user exists
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if product exists
    const productCheck = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const result = await pool.query(
      `INSERT INTO reviews (user_id, product_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, product_id, rating, comment]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        message: "User has already reviewed this product"
      });
    }
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL REVIEWS
export const getAllReviews = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as user_name, p.name as product_name ,p.slug as product_slug, p.cms_image_ids as product_cms_image_ids
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN products p ON r.product_id = p.id
       ORDER BY r.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET REVIEW BY ID
export const getReviewById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT r.*, u.name as user_name, p.name as product_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN products p ON r.product_id = p.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET REVIEWS BY PRODUCT ID
export const getReviewsByProductId = async (req, res) => {
  const { productId } = req.params;

  try {
    const result = await pool.query(
      `SELECT r.*, u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [productId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET REVIEWS BY USER ID
export const getReviewsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT r.*, p.name as product_name, p.slug as product_slug
       FROM reviews r
       JOIN products p ON r.product_id = p.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// UPDATE REVIEW
export const updateReview = async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  try {
    // Check if review exists
    const existing = await pool.query(
      "SELECT * FROM reviews WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Validate rating range if being updated
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5"
      });
    }

    const result = await pool.query(
      `UPDATE reviews
       SET rating = COALESCE($1, rating),
           comment = COALESCE($2, comment)
       WHERE id = $3
       RETURNING *`,
      [rating, comment, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE REVIEW
export const deleteReview = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if review exists
    const existing = await pool.query(
      "SELECT * FROM reviews WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    await pool.query("DELETE FROM reviews WHERE id = $1", [id]);
    res.json({ message: "Review deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
