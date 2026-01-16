export const addToCart = async (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user.id;

  const result = await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     VALUES ($1,$2,$3)
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + $3
     RETURNING *`,
    [user_id, product_id, quantity]
  );

  res.json(result.rows[0]);
};

export const getCart = async (req, res) => {
  const result = await pool.query(
    `SELECT c.*, p.name, p.price
     FROM cart_items c
     JOIN products p ON c.product_id = p.id
     WHERE c.user_id=$1`,
    [req.user.id]
  );
  res.json(result.rows);
};

export const updateCartItem = async (req, res) => {
  await pool.query(
    `UPDATE cart_items SET quantity=$1
     WHERE user_id=$2 AND product_id=$3`,
    [req.body.quantity, req.user.id, req.params.productId]
  );
  res.json({ message: "Cart updated" });
};

export const removeFromCart = async (req, res) => {
  await pool.query(
    `DELETE FROM cart_items WHERE user_id=$1 AND product_id=$2`,
    [req.user.id, req.params.productId]
  );
  res.json({ message: "Removed from cart" });
};


    
export const clearCart = async (req, res) => {
  await pool.query(
    `DELETE FROM cart_items WHERE user_id=$1`,  
    [req.user.id]
  );
  res.json({ message: "Cart cleared" });
};