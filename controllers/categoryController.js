import { pool } from "../db/pgClient.js";

export const createCategory = async (req, res) => {
  const { name, slug, cms_image_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO categories (name, slug, cms_image_id)
       VALUES ($1,$2,$3) RETURNING *`,
      [name, slug, cms_image_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllCategories = async (_, res) => {
  const result = await pool.query("SELECT * FROM categories ORDER BY created_at DESC");
  res.json(result.rows);
};

export const getCategoryById = async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM categories WHERE id=$1",
    [req.params.id]
  );
  res.json(result.rows[0]);
};

export const updateCategory = async (req, res) => {
  const { name, slug, cms_image_id } = req.body;
  const result = await pool.query(
    `UPDATE categories SET name=$1, slug=$2, cms_image_id=$3 WHERE id=$4 RETURNING *`,
    [name, slug, cms_image_id, req.params.id]
  );
  res.json(result.rows[0]);
};

export const deleteCategory = async (req, res) => {
  await pool.query("DELETE FROM categories WHERE id=$1", [req.params.id]);
  res.json({ message: "Category deleted" });
};
