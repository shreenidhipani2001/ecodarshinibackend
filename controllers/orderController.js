import { pool } from "../db/pgClient.js";

// CREATE ORDER
// export const createOrder = async (req, res) => {
//   const { user_id, total_amount, status, payment_id, product_id } = req.body;

//   try {
//     // Validation
//     if (!user_id || !total_amount) {
//       return res.status(400).json({
//         message: "user_id and total_amount are required"
//       });
//     }

//     // Check if user exists
//     const userCheck = await pool.query(
//       "SELECT * FROM users WHERE id = $1",
//       [user_id]
//     );

//     if (userCheck.rows.length === 0) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Check if product exists if provided
//     if (product_id) {
//       const productCheck = await pool.query(
//         "SELECT * FROM products WHERE id = $1",
//         [product_id]
//       );

//       if (productCheck.rows.length === 0) {
//         return res.status(404).json({ message: "Product not found" });
//       }
//     }

//     const result = await pool.query(
//       `INSERT INTO orders (user_id, total_amount, status, payment_id, product_id)
//        VALUES ($1, $2, $3, $4, $5)
//        RETURNING *`,
//       [user_id, total_amount, status || 'CREATED', payment_id, product_id]
//     );

//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };

export const createOrder = async (req, res) => {
  const { user_id, total_amount, status, payment_id, product_id } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ---------------- VALIDATION ----------------
    if (!user_id || !total_amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "user_id and total_amount are required"
      });
    }

    // ---------------- USER CHECK ----------------
    const userCheck = await client.query(
      "SELECT id FROM users WHERE id = $1",
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    // ---------------- PRODUCT CHECK (OPTIONAL) ----------------
    if (product_id) {
      const productCheck = await client.query(
        "SELECT id FROM products WHERE id = $1",
        [product_id]
      );

      if (productCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Product not found" });
      }
    }

    // ---------------- CREATE ORDER ----------------
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, status, payment_id, product_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, total_amount, status || "CREATED", payment_id, product_id]
    );

    const order = orderResult.rows[0];

    // ---------------- FETCH CART ITEMS ----------------
    const cartItemsResult = await client.query(
      `SELECT c.product_id, c.quantity, p.price
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1`,
      [user_id]
    );

    

    const cartItems = cartItemsResult.rows;

    // ---------------- BULK INSERT ORDER ITEMS ----------------
    if (cartItems.length > 0) {
      const values = [];
      const placeholders = [];

      cartItems.forEach((item, index) => {
        const base = index * 4;

        placeholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`
        );

        values.push(order.id, item.product_id, item.price, item.quantity);
      });

      await client.query(
        `INSERT INTO order_items (order_id, product_id, price, quantity)
         VALUES ${placeholders.join(",")}`,
        values
      );

      // ---------------- STOCK UPDATE (SEQUENTIAL SAFE) ----------------
      for (const item of cartItems) {
        await client.query(
          `UPDATE products
           SET stock = stock - $1,
               bought_by = $2
           WHERE id = $3`,
          [item.quantity, user_id, item.product_id]
        );
      }
    }

    // ---------------- CLEAR CART ----------------
    await client.query(
      `DELETE FROM cart_items WHERE user_id = $1`,
      [user_id]
    );

    await client.query("COMMIT");

    // SAME RESPONSE STYLE
    res.status(201).json(order);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
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


// export const cancelOrder = async (req, res) => {
//   const { orderId } = req.params;

//   try {
//     await pool.query(
//       `UPDATE orders
//        SET is_cancelled = TRUE,
//            cancel_desc = 'User Cancelled',status='CANCELLED'
//        WHERE id = $1`,
//       [orderId]
//     );

//     res.json({ message: 'Cancelled' });
//   } catch (err) {
//     console.log('error:-',err)
//     res.status(500).json({ message: err.message });
//   }
// };

// UPDATE ORDER
export const cancelOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    // 1. Cancel the order
    await pool.query(
      `UPDATE orders
       SET is_cancelled = TRUE,
           cancel_desc = 'User Cancelled',
           status = 'CANCELLED'
       WHERE id = $1`,
      [orderId]
    );

    // 2. Insert tracking event
    await pool.query(
      `INSERT INTO order_tracking (
        order_id,
        status,
        notes
      )
      VALUES ($1, $2, $3)`,
      [
        orderId,
        'FAILED_DELIVERY',
        'Order cancelled by user'
      ]
    );

    res.json({ message: 'Order Cancelled Successfully' });

  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ message: err.message });
  }
};






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
