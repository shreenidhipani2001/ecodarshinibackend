import { pool } from "../db/pgClient.js";

// CREATE / ADD TO WISHLIST
export const addToWishlist = async (req, res) => {
  const userId = req.body.user_id;
  const { product_id } = req.body;

  try {
    // Validation
    if (!userId || !product_id) {
      return res.status(400).json({ message: "user_id and product_id are required" });
    }

    // Check if product exists
    const productCheck = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(200).json({ message: "Product not found" });
    }

    const result = await pool.query(
      `INSERT INTO wishlist_items (user_id, product_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, product_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Product already in wishlist" });
    }
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL WISHLIST ITEMS
export const getAllWishlistItems = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("Fetching wishlist items for user ID:", userId);

    const result = await pool.query(
      `SELECT w.*, p.name, p.price, p.cms_image_ids, p.slug
       FROM wishlist_items w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );
    console.log("Wishlist items fetched:", result.rows.length);

    res.json(result.rows);
  } catch (err) {
    console.error('error while fetching wishlist items',err);
    res.status(500).json({ message: err.message,error:"Error while fetching the wish list items" });
  }
};

// GET WISHLIST ITEM BY ID
export const getWishlistItemById = async (req, res) => {
   

  try {
    console.log("Fetching wishlist item by ID",req.params);
    const userId = req.params.id;
console.log("Fetching wishlist item for user ID 77:", userId);
    const result = await pool.query(
      `SELECT w.*, p.name, p.price, p.cms_image_ids, p.slug
       FROM wishlist_items w
       JOIN products p ON w.product_id = p.id
       WHERE  w.user_id = $1`,
      [ userId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "Wishlist item not found" });
    }
console.log("Wishlist item fetched:", result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('error while getting the wish list of',err);
    res.status(500).json({ message: err.message });
  }
};

// UPDATE WISHLIST ITEM
export const updateWishlistItem = async (req, res) => {
  const { id } = req.params;
  const { product_id } = req.body;

  try {
    const userId = req.user.id;

    // Check if wishlist item exists
    const existing = await pool.query(
      "SELECT * FROM wishlist_items WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(200).json({ message: "Wishlist item not found" });
    }

    // Check if product exists if being updated
    if (product_id) {
      const productCheck = await pool.query(
        "SELECT * FROM products WHERE id = $1",
        [product_id]
      );

      if (productCheck.rows.length === 0) {
        return res.status(200).json({ message: "Product not found" });
      }
    }

    const result = await pool.query(
      `UPDATE wishlist_items
       SET product_id = COALESCE($1, product_id)
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [product_id, id, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Product already in wishlist" });
    }
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE WISHLIST ITEM
export const deleteWishlistItem = async (req, res) => {
  console.log("Deleting wishlist item with params:", req.params);
  const id  = req.params.id;
  const userId=req.query.userId;
  console.log("Deleting wishlist item ID:", id, "for user ID:", userId);
  

  try {
    
console.log(`SELECT * FROM wishlist_items WHERE id =${id} AND user_id = ${userId}`);
    // Check if wishlist item exists
    const existing = await pool.query(
      "SELECT * FROM wishlist_items WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    console.log("Existing wishlist item check result:", existing.rows);

    if (existing.rows.length === 0) {

      return res.status(404).json({ message: "Wishlist item not found" });
    }

    await pool.query(
      "DELETE FROM wishlist_items WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    res.json({ message: "Wishlist item deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
