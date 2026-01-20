// import { pool } from '../db/pgClient.js';

// exports.addToCart = async (req, res) => {
//   const { product_id, quantity } = req.body;
//   const user_id = req.user.id;

//   // ── Input Validation ────────────────────────────────────────
//   if (!product_id || !quantity) {
//     return res.status(400).json({
//       success: false,
//       message: 'product_id and quantity are required',
//     });
//   }

 

//   if (!Number.isInteger(quantity) || quantity <= 0) {
//     return res.status(400).json({
//       success: false,
//       message: 'Quantity must be a positive integer',
//     });
//   }

//   try {
//     const result = await pool.query(
//       `INSERT INTO cart_items (user_id, product_id, quantity)
//        VALUES ($1, $2, $3)
//        ON CONFLICT (user_id, product_id)
//        DO UPDATE SET 
//          quantity = cart_items.quantity + $3,
//          created_at = CURRENT_TIMESTAMP  -- optional: touch timestamp
//        RETURNING id, user_id, product_id, quantity, created_at`,
//       [user_id, product_id, quantity]
//     );

//     // Optionally join with product for richer response
//     const enriched = await pool.query(
//       `SELECT 
//          ci.id, ci.quantity, ci.created_at,
//          p.id AS product_id, p.name, p.slug, p.price, p.stock
//        FROM cart_items ci
//        JOIN products p ON ci.product_id = p.id
//        WHERE ci.id = $1`,
//       [result.rows[0].id]
//     );

//     return res.status(201).json({
//       success: true,
//       data: enriched.rows[0] || result.rows[0],
//     });
//   } catch (err) {
//     console.error('Add to cart error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to add item to cart',
//       error: process.env.NODE_ENV === 'development' ? err.message : undefined,
//     });
//   }
// };

// // 2. Get All Cart Items (for current user)
// exports.getCart = async (req, res) => {
//   const user_id = req.user.id;

//   try {
//     const result = await pool.query(
//       `SELECT 
//          ci.id AS cart_item_id,
//          ci.quantity,
//          ci.created_at,
//          p.id AS product_id,
//          p.name,
//          p.slug,
//          p.price,
//          p.stock,
//          p.is_active,
//          p.cms_image_ids
//        FROM cart_items ci
//        JOIN products p ON ci.product_id = p.id
//        WHERE ci.user_id = $1
//        ORDER BY ci.created_at DESC`,
//       [user_id]
//     );

//     return res.json({
//       success: true,
//       count: result.rowCount,
//       data: result.rows,
//     });
//   } catch (err) {
//     console.error('Get cart error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch cart',
//     });
//   }
// };

// // 3. Update Cart Item Quantity (PATCH style - partial update)
// exports.updateCartItem = async (req, res) => {
//   const { quantity } = req.body;
//   const { productId: product_id } = req.params;
//   const user_id = req.user.id;

//   // ── Validation ──────────────────────────────────────────────
//   if (quantity === undefined) {
//     return res.status(400).json({
//       success: false,
//       message: 'quantity is required in body',
//     });
//   }

//   if (!Number.isInteger(quantity) || quantity < 1) {
//     return res.status(400).json({
//       success: false,
//       message: 'Quantity must be a positive integer (>= 1)',
//     });
//   }

//   try {
//     const result = await pool.query(
//       `UPDATE cart_items 
//        SET quantity = $1,
//            created_at = CURRENT_TIMESTAMP  -- optional
//        WHERE user_id = $2 
//          AND product_id = $3
//        RETURNING id, user_id, product_id, quantity, created_at`,
//       [quantity, user_id, product_id]
//     );

//     if (result.rowCount === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Cart item not found',
//       });
//     }

//     return res.json({
//       success: true,
//       message: 'Cart item updated',
//       data: result.rows[0],
//     });
//   } catch (err) {
//     console.error('Update cart error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update cart item',
//     });
//   }
// };

// // 4. Remove Single Item from Cart (DELETE by product_id)
// exports.removeFromCart = async (req, res) => {
//   const { productId: product_id } = req.params;
//   const user_id = req.user.id;

   

//   try {
//     const result = await pool.query(
//       `DELETE FROM cart_items 
//        WHERE user_id = $1 AND product_id = $2
//        RETURNING id`,
//       [user_id, product_id]
//     );

//     if (result.rowCount === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Item not found in cart',
//       });
//     }

//     return res.json({
//       success: true,
//       message: 'Item removed from cart',
//     });
//   } catch (err) {
//     console.error('Remove from cart error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to remove item',
//     });
//   }
// };

// // 5. Clear Entire Cart (DELETE all for user)
// exports.clearCart = async (req, res) => {
//   const user_id = req.user.id;

//   try {
//     const result = await pool.query(
//       `DELETE FROM cart_items WHERE user_id = $1`,
//       [user_id]
//     );

//     return res.json({
//       success: true,
//       message: `Cart cleared (${result.rowCount} items removed)`,
//       removedCount: result.rowCount,
//     });
//   } catch (err) {
//     console.error('Clear cart error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to clear cart',
//     });
//   }
// };

// // Bonus: Get single cart item by product_id (useful for frontend checks)
// exports.getCartItem = async (req, res) => {
//   const { productId: product_id } = req.params;
//   const user_id = req.user.id;

//   try {
//     const result = await pool.query(
//       `SELECT ci.*, p.name, p.price, p.stock
//        FROM cart_items ci
//        JOIN products p ON ci.product_id = p.id
//        WHERE ci.user_id = $1 AND ci.product_id = $2`,
//       [user_id, product_id]
//     );

//     if (result.rowCount === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Item not found in cart',
//       });
//     }

//     return res.json({
//       success: true,
//       data: result.rows[0],
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch cart item',
//     });
//   }
// };



import { pool } from "../db/pgClient.js";

/**
 * ADD TO CART
 * If product already exists, increment quantity
 */
export const addToCart = async (req, res) => {
  try {
    console.log("Add to cart request body:", req.body);
    const userId = req.body.user_id;
    console.log("User ID:", userId);
    const { product_id, quantity } = req.body;

    const result = await pool.query(
      `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE
        SET quantity = cart_items.quantity + EXCLUDED.quantity
      RETURNING *
      `,
      [userId, product_id, quantity || 1]
    );
console.log("Add to cart result:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
};

/**
 * GET ALL CART ITEMS (for logged-in user)
 */
export const getAllCartItems = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.quantity,
        c.created_at,
        p.id AS product_id,
        p.name,
        p.price,
        (p.price * c.quantity) AS total_price
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cart items" });
  }
};



export const getAllUserCartItems = async (req, res) => {
  try {
    console.log("Request params:", req.params);
    const userId = req.params.userId;
    console.log("Fetching cart items for user ID:", userId);

    const result = await pool.query(
      `
  
      SELECT *
FROM cart_items c
WHERE c.user_id = $1
ORDER BY c.created_at DESC
      `,
      [userId]
    );
console.log("User Cart Items:", result);
    res.json(result.rows);
  } catch (err) {
    console.log('Error in getAllUserCartItems:---',err);
    res.status(500).json({ error: "Failed to fetch cart items" });
  }
};

/**
 * GET CART ITEM BY ID
 */
export const getCartItemById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM cart_items
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cart item" });
  }
};

/**
 * PARTIAL UPDATE (quantity only)
 */
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity !== undefined && quantity <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0" });
    }

    const result = await pool.query(
      `
      UPDATE cart_items
      SET quantity = COALESCE($1, quantity)
      WHERE id = $2 AND user_id = $3
      RETURNING *
      `,
      [quantity, id, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update cart item" });
  }
};

/**
 * REMOVE ITEM FROM CART
 */
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM cart_items
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.json({ message: "Item removed from cart" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove cart item" });
  }
};
