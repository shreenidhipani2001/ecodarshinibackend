import { pool } from "../db/pgClient.js";
import { attachImagesToProduct, attachImagesToProducts } from "../utils/payloadCMS.js";

// UPLOAD PRODUCT WITH IMAGES
export const uploadProduct = async (req, res) => {
  const { name, slug, description, price, stock, category_id, artist_name } = req.body;

  try {
    // Validation
    if (!name || !slug || !price || !stock || !category_id) {
      return res.status(400).json({
        message: "Name, slug, price, stock, and category_id are required"
      });
    }

    // Cloudinary public_ids from uploaded files
    const imageIds = req.files ? req.files.map((file) => file.filename) : [];

    // Check if category exists
    const categoryCheck = await pool.query(
      "SELECT * FROM categories WHERE id = $1",
      [category_id]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if slug already exists
    const slugCheck = await pool.query(
      "SELECT * FROM products WHERE slug = $1",
      [slug]
    );

    if (slugCheck.rows.length > 0) {
      return res.status(400).json({ message: "Product slug already exists" });
    }

    const result = await pool.query(
      `INSERT INTO products
       (name, slug, description, price, stock, category_id, cms_image_ids, artist_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, slug, description, price, stock, category_id, JSON.stringify(imageIds), artist_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// CREATE PRODUCT
export const createProduct = async (req, res) => {
  const {
    name, slug, description, price, stock,user_id,
    category_id, cms_image_ids, artist_name ,added_by
  } = req.body;
  console.log("Create product request body:", req.body);

  try {
    // Validation
    if (!name  || !price || !stock || !category_id || !user_id) {
      return res.status(400).json({
        message: "Name, slug, price, stock, and category_id are required"
      });
    }

    // Check if category exists
    const categoryCheck = await pool.query(
      "SELECT * FROM categories WHERE id = $1",
      [category_id]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if slug already exists
    const slugCheck = await pool.query(
      "SELECT * FROM products WHERE slug = $1",
      [slug]
    );

    if (slugCheck.rows.length > 0) {
      return res.status(400).json({ message: "Product slug already exists" });
    }

    const result = await pool.query(
      `INSERT INTO products
       (name, slug, description, price, stock, category_id, cms_image_ids, artist_name,added_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, slug, description, price, stock, category_id, cms_image_ids, artist_name,added_by]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL PRODUCTS
export const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true
       ORDER BY p.created_at DESC`
    );

    // Attach CMS images to each product
    const productsWithImages = await attachImagesToProducts(result.rows);
    res.json(productsWithImages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET PRODUCT BY ID
export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Attach CMS images to product
    const productWithImages = await attachImagesToProduct(result.rows[0]);
    res.json(productWithImages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, price, stock, category_id, cms_image_ids, artist_name, is_active } = req.body;
  console.log("Update product request body:", req.body);
  try {
    // Check if product exists
    const existing = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if slug is being changed to one that already exists
    if (slug && slug !== existing.rows[0].slug) {
      const slugCheck = await pool.query(
        "SELECT * FROM products WHERE slug = $1 AND id != $2",
        [slug, id]
      );

      if (slugCheck.rows.length > 0) {
        return res.status(400).json({ message: "Product slug already exists" });
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
      `UPDATE products
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           price = COALESCE($4, price),
           stock = COALESCE($5, stock),
           category_id = COALESCE($6, category_id),
           cms_image_ids = COALESCE($7, cms_image_ids),
           artist_name = COALESCE($8, artist_name),
           is_active = COALESCE($9, is_active)
       WHERE id = $10
       RETURNING *`,
      [name, slug, description, price, stock, category_id, cms_image_ids, artist_name, is_active, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if product exists
    const existing = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
