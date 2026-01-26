import { pool } from "../db/pgClient.js";

// CREATE CATEGORY
export const createCategory = async (req, res) => {
  const { name, slug, cms_image_id } = req.body;

  try {
    // Validation
    if (!name || !slug) {
      return res.status(400).json({ message: "Name and slug are required" });
    }

    // Check if slug already exists
    const existing = await pool.query(
      "SELECT * FROM categories WHERE slug = $1",
      [slug]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Slug already exists" });
    }

    const result = await pool.query(
      `INSERT INTO categories (name, slug, cms_image_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, slug, cms_image_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL CATEGORIES
export const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories ORDER BY created_at DESC"
    );
    console.log("Fetched categories:", result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET CATEGORY BY ID
export const getCategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM categories WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// UPDATE CATEGORY
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, cms_image_id } = req.body;

  try {
    // Check if category exists
    const existing = await pool.query(
      "SELECT * FROM categories WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if slug is being changed to one that already exists
    if (slug && slug !== existing.rows[0].slug) {
      const slugCheck = await pool.query(
        "SELECT * FROM categories WHERE slug = $1 AND id != $2",
        [slug, id]
      );

      if (slugCheck.rows.length > 0) {
        return res.status(400).json({ message: "Slug already exists" });
      }
    }

    const result = await pool.query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           cms_image_id = COALESCE($3, cms_image_id)
       WHERE id = $4
       RETURNING *`,
      [name, slug, cms_image_id, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE CATEGORY
export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if category exists
    const existing = await pool.query(
      "SELECT * FROM categories WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
