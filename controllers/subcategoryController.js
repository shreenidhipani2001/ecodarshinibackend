import { pool } from "../db/pgClient.js";

// CREATE SUBCATEGORY
export const createSubcategory = async (req, res) => {
  const { name, slug, category_id, cms_image_id } = req.body;

  try {
    // Validation
    if (!name || !slug || !category_id) {
      return res.status(400).json({ message: "Name, slug, and category_id are required" });
    }

    // Check if category exists
    const categoryCheck = await pool.query(
      "SELECT * FROM categories WHERE id = $1",
      [category_id]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if slug already exists for this category
    const existing = await pool.query(
      "SELECT * FROM sub_categories WHERE category_id = $1 AND slug = $2",
      [category_id, slug]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Slug already exists for this category" });
    }

    const result = await pool.query(
      `INSERT INTO sub_categories (name, slug, category_id, cms_image_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, slug, category_id, cms_image_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL SUBCATEGORIES
export const getAllSubcategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, c.name as category_name
       FROM sub_categories s
       JOIN categories c ON s.category_id = c.id
       ORDER BY s.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET SUBCATEGORY BY ID
export const getSubcategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT s.*, c.name as category_name
       FROM sub_categories s
       JOIN categories c ON s.category_id = c.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET SUBCATEGORIES BY CATEGORY ID
export const getSubcategoriesByCategoryId = async (req, res) => {
  const { categoryId } = req.params;

  try {
    // Check if category exists
    const categoryCheck = await pool.query(
      "SELECT * FROM categories WHERE id = $1",
      [categoryId]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    const result = await pool.query(
      `SELECT s.*, c.name as category_name
       FROM sub_categories s
       JOIN categories c ON s.category_id = c.id
       WHERE s.category_id = $1
       ORDER BY s.created_at DESC`,
      [categoryId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// UPDATE SUBCATEGORY
export const updateSubcategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, category_id, cms_image_id } = req.body;

  try {
    // Check if subcategory exists
    const existing = await pool.query(
      "SELECT * FROM sub_categories WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    // Check if slug is being changed to one that already exists in the same category
    const targetCategoryId = category_id || existing.rows[0].category_id;
    if (slug && (slug !== existing.rows[0].slug || category_id)) {
      const slugCheck = await pool.query(
        "SELECT * FROM sub_categories WHERE category_id = $1 AND slug = $2 AND id != $3",
        [targetCategoryId, slug, id]
      );

      if (slugCheck.rows.length > 0) {
        return res.status(400).json({ message: "Slug already exists for this category" });
      }
    }

    // Check if category exists if being updated
    if (category_id) {
      const categoryCheck = await pool.query(
        "SELECT * FROM categories WHERE id = $1",
        [category_id]
      );

      if (categoryCheck.rows.length === 0) {
        return res.status(404).json({ message: "Category not found" });
      }
    }

    const result = await pool.query(
      `UPDATE sub_categories
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           category_id = COALESCE($3, category_id),
           cms_image_id = COALESCE($4, cms_image_id)
       WHERE id = $5
       RETURNING *`,
      [name, slug, category_id, cms_image_id, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE SUBCATEGORY
export const deleteSubcategory = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if subcategory exists
    const existing = await pool.query(
      "SELECT * FROM sub_categories WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    // Check if any products are using this subcategory
    const productsCheck = await pool.query(
      "SELECT COUNT(*) FROM products WHERE subcategory_id = $1",
      [id]
    );

    if (parseInt(productsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        message: "Cannot delete subcategory with associated products"
      });
    }

    await pool.query("DELETE FROM sub_categories WHERE id = $1", [id]);
    res.json({ message: "Subcategory deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET PRODUCTS BY SUBCATEGORY ID
export const getProductsBySubcategoryId = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if subcategory exists
    const subcategoryCheck = await pool.query(
      "SELECT * FROM sub_categories WHERE id = $1",
      [id]
    );

    if (subcategoryCheck.rows.length === 0) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    const result = await pool.query(
      `SELECT p.*, s.name as subcategory_name, c.name as category_name
       FROM products p
       JOIN sub_categories s ON p.subcategory_id = s.id
       JOIN categories c ON s.category_id = c.id
       WHERE p.subcategory_id = $1 AND p.is_active = true
       ORDER BY p.created_at DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
