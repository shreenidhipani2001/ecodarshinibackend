import { pool } from "../db/pgClient.js";

// CREATE ORDER
export const createOrder = async (req, res) => {
  const { user_id, total_amount, status, payment_id, product_id } = req.body;

  try {
    // Validation
    if (!user_id || !total_amount) {
      return res.status(400).json({
        message: "user_id and total_amount are required"
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

    // Check if product exists if provided
    if (product_id) {
      const productCheck = await pool.query(
        "SELECT * FROM products WHERE id = $1",
        [product_id]
      );

      if (productCheck.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
    }

    const result = await pool.query(
      `INSERT INTO orders (user_id, total_amount, status, payment_id, product_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, total_amount, status || 'CREATED', payment_id, product_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL ORDERS
export const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    console.log("Fetched orders:", result.rows[0]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET ORDER BY ID
export const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Get order items for this order
    const orderItems = await pool.query(
      `SELECT oi.*, p.name as product_name, p.slug as product_slug
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    const order = result.rows[0];
    order.items = orderItems.rows;

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET ORDERS BY USER ID
export const getOrdersByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// UPDATE ORDER
export const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { total_amount, status, payment_id, product_id } = req.body;

  try {
    // Check if order exists
    const existing = await pool.query(
      "SELECT * FROM orders WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if product exists if being updated
    if (product_id) {
      const productCheck = await pool.query(
        "SELECT * FROM products WHERE id = $1",
        [product_id]
      );

      if (productCheck.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
    }

    const result = await pool.query(
      `UPDATE orders
       SET total_amount = COALESCE($1, total_amount),
           status = COALESCE($2, status),
           payment_id = COALESCE($3, payment_id),
           product_id = COALESCE($4, product_id)
       WHERE id = $5
       RETURNING *`,
      [total_amount, status, payment_id, product_id, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE ORDER
export const deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if order exists
    const existing = await pool.query(
      "SELECT * FROM orders WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    await pool.query("DELETE FROM orders WHERE id = $1", [id]);
    res.json({ message: "Order deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
