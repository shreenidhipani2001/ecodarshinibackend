import { pool } from "../db/pgClient.js"; 
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

export const uploadProduct = async (req, res) => {
  try {
    const { name, price, category_id } = req.body;

    // Cloudinary public_ids
    const imageIds = req.files.map((file) => file.filename);

    const result = await pool.query(
      `
      INSERT INTO products (name, price, category_id, cms_image_ids)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [name, price, category_id, imageIds]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Image upload failed" });
  }
};
export const createProduct = async (req, res) => {
  const {
    name, slug, description, price, stock,
    category_id, cms_image_ids, artist_name
  } = req.body;
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
  const result = await pool.query(
    `INSERT INTO products
     (name, slug, description, price, stock, category_id, cms_image_ids, artist_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [name, slug, description, price, stock, category_id, cms_image_ids, artist_name]
  );

  res.status(201).json(result.rows[0]);
};

export const getAllProducts = async (_, res) => {
  console.log("Generating tokens in getAllProducts");
   
  const result = await pool.query(
    `SELECT p.*, c.name as category_name
     FROM products p
     JOIN categories c ON p.category_id = c.id
     WHERE p.is_active = true`
  );
  res.json(result.rows);
};

export const getProductById = async (req, res) => {
     const accessToken = generateAccessToken(user);
     const refreshToken = generateRefreshToken(user);
  const result = await pool.query(
    "SELECT * FROM products WHERE id=$1",
    [req.params.id]
  );
  res.json(result.rows[0]);
};

export const updateProduct = async (req, res) => {
     const accessToken = generateAccessToken(user);
     const refreshToken = generateRefreshToken(user);
  const result = await pool.query(
    `UPDATE products SET price=$1, stock=$2, is_active=$3
     WHERE id=$4 RETURNING *`,
    [req.body.price, req.body.stock, req.body.is_active, req.params.id]
  );
  res.json(result.rows[0]);
};

export const deleteProduct = async (req, res) => {
     const accessToken = generateAccessToken(user);
     const refreshToken = generateRefreshToken(user);
  await pool.query("DELETE FROM products WHERE id=$1", [req.params.id]);
  res.json({ message: "Product deleted" });
};
