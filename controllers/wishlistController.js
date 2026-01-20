import { pool } from "../db/pgClient.js";

/**
 * ADD TO WISHLIST
 */
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.body.user_id;
    const { product_id } = req.body;

    const result = await pool.query(
      `
      INSERT INTO wishlist_items (user_id, product_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [userId, product_id]
    );
    console.log("Added to wishlist:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      // unique_user_product constraint
      return res.status(409).json({ error: "Product already in wishlist" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
};

/**
 * GET ALL WISHLIST ITEMS (for logged-in user)
 */
export const getAllWishlistItems = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT w.*, p.name, p.price
      FROM wishlist_items w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
};

/**
 * GET WISHLIST ITEM BY ID
 */
export const getWishlistItemById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM wishlist_items
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Wishlist item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch wishlist item" });
  }
};

/**
 * PARTIAL UPDATE (product_id only)
 */
export const updateWishlistItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { product_id } = req.body;

    const result = await pool.query(
      `
      UPDATE wishlist_items
      SET product_id = COALESCE($1, product_id)
      WHERE id = $2 AND user_id = $3
      RETURNING *
      `,
      [product_id, id, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Wishlist item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Product already in wishlist" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update wishlist item" });
  }
};

/**
 * DELETE WISHLIST ITEM
 */
export const deleteWishlistItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM wishlist_items
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Wishlist item not found" });
    }

    res.json({ message: "Wishlist item deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete wishlist item" });
  }
};
