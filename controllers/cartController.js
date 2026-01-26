import { pool } from "../db/pgClient.js";

// CREATE / ADD TO CART
export const addToCart = async (req, res) => {
  const userId = req.body.user_id;
  const { product_id, quantity } = req.body;

  console.log('addToCart called with:', { userId, product_id, quantity });
  try {
    // Validation
    if (!userId || !product_id) {
      return res.status(400).json({ message: "user_id and product_id are required" });
    }

    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity <= 0)) {
      return res.status(400).json({ message: "Quantity must be a positive integer" });
    }

    // Check if product exists
    const productCheck = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [product_id]
    );
console.log('productCheck::::',productCheck.rows);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       RETURNING *`,
      [userId, product_id, quantity || 1]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL CART ITEMS (for logged-in user)
export const getAllCartItems = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("Fetching cart items for user ID:", userId);

    const result = await pool.query(
      `SELECT
         c.id,
         c.quantity,
         c.created_at,
         p.id AS product_id,
         p.name,
         p.price,
         p.cms_image_ids,
         p.slug,
         (p.price * c.quantity) AS total_price
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.log('error in getAllCartItems',err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL USER CART ITEMS (by userId from params)
export const getAllUserCartItems = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const result = await pool.query(
      `SELECT
         c.id,
         c.quantity,
         c.created_at,
         c.product_id,
         p.name,
         p.price,
         p.cms_image_ids,
         p.slug,
         (p.price * c.quantity) AS total_price
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET CART ITEM BY ID
export const getCartItemById = async (req, res) => {
  const { id } = req.params;
  console.log("Fetching cart item with ID:", id);

  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT
         c.id,
         c.quantity,
         c.created_at,
         p.id AS product_id,
         p.name,
         p.price,
         p.cms_image_ids,
         p.slug,
         (p.price * c.quantity) AS total_price
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
export const getCartItemOfUserById = async (req, res) => {
  const { id } = req.params;
  console.log("Fetching cart item with ID:", id);

  try {
    // const userId = req.user.id;

    const result = await pool.query(
      `SELECT
         c.id,
         c.quantity,
         c.created_at,
         p.id AS product_id,
         p.name,
         p.price,
         p.cms_image_ids,
         p.slug,
         (p.price * c.quantity) AS total_price
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE  c.user_id = $1`,
      [ id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    console.log("Cart item found:", result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// UPDATE CART ITEM
export const updateCartItem = async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  try {
    const userId = req.user.id;

    // Validation
    if (quantity !== undefined && (!Number.isInteger(quantity) || quantity <= 0)) {
      return res.status(400).json({ message: "Quantity must be greater than 0" });
    }

    // Check if cart item exists
    const existing = await pool.query(
      "SELECT * FROM cart_items WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const result = await pool.query(
      `UPDATE cart_items
       SET quantity = COALESCE($1, quantity)
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [quantity, id, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE / REMOVE CART ITEM
export const removeCartItem = async (req, res) => {
  console.log("removeCartItem called",req.params);
  console.log("removeCartItem called 1", req.query);
  const { id } = req.params;
  const userId=req.query.userId;
  console.log("Removing cart item with ID:", id);

  try {
    

    // Check if cart item exists
    const existing = await pool.query(
      "SELECT * FROM cart_items WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    console.log('existing::::',existing.rows);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    await pool.query(
      "DELETE FROM cart_items WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    res.json({ message: "Cart item removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
