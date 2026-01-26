import { pool } from "../db/pgClient.js";

// CREATE ADDRESS
export const createAddress = async (req, res) => {
  const { user_id, address_line1, city, state, pincode, country } = req.body;

  try {
    // Validation
    if (!user_id || !address_line1 || !city || !state || !pincode) {
      return res.status(400).json({
        message: "user_id, address_line1, city, state, and pincode are required"
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

    const result = await pool.query(
      `INSERT INTO addresses (user_id, address_line1, city, state, pincode, country)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, address_line1, city, state, pincode, country || 'India']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.log('error in createAddress::::',err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL ADDRESSES
export const getAllAddresses = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM addresses a
       JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.log('error in getAllAddresses::::',err);
    res.status(500).json({ message: err.message });
  }
};

// GET ADDRESS BY ID
export const getAddressById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM addresses a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.log('error in getAddressById::::',err);
    res.status(500).json({ message: err.message,error:"Sorry" });
  }
};

// GET ADDRESSES BY USER ID
export const getAddressesByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM addresses
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.log('error in getAddressesByUserId::::',err);
    res.status(500).json({ message: err.message });
  }
};

// UPDATE ADDRESS
export const updateAddress = async (req, res) => {
  const { id } = req.params;
  const { address_line1, city, state, pincode, country } = req.body;

  try {
    // Check if address exists
    const existing = await pool.query(
      "SELECT * FROM addresses WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    const result = await pool.query(
      `UPDATE addresses
       SET address_line1 = COALESCE($1, address_line1),
           city = COALESCE($2, city),
           state = COALESCE($3, state),
           pincode = COALESCE($4, pincode),
           country = COALESCE($5, country)
       WHERE id = $6
       RETURNING *`,
      [address_line1, city, state, pincode, country, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.log('error in updateAddress::::',err);
     
    res.status(500).json({ message: err.message });
  }
};

// DELETE ADDRESS
export const deleteAddress = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if address exists
    const existing = await pool.query(
      "SELECT * FROM addresses WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    await pool.query("DELETE FROM addresses WHERE id = $1", [id]);
    res.json({ message: "Address deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
