import { pool } from "../db/pgClient.js";
import { attachImagesToProduct, attachImagesToProducts } from "../utils/payloadCMS.js";


export const createBlog = async (req, res) => {
    const { name, description, image, added_by } = req.body;
  
    try {
      if (!name || !description || !added_by) {
        return res.status(400).json({ message: "Name, description, added_by required" });
      }
  
      const result = await pool.query(
        `INSERT INTO blogs (name, description, image, added_by)
         VALUES ($1,$2,$3,$4)
         RETURNING *`,
        [name, description, image || null, added_by]
      );
  
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  
  export const getAllBlogs = async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT b.*, u.name AS added_by_name
        FROM blogs b
        LEFT JOIN users u ON b.added_by = u.id
        ORDER BY b.created_at DESC
      `);
      const blogsWithImages = await attachImagesToProducts(result.rows);
      res.json(blogsWithImages);
    } catch (err) {
        console.log("Error fetching blogs:", err);
      res.status(500).json({ message: err.message });
    }
  };

  
  export const getBlogById = async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        "SELECT * FROM blogs WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Blog not found" });
      }

      const blogWithImages = await attachImagesToProduct(result.rows[0]);
      res.json(blogWithImages);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  
  export const updateBlog = async (req, res) => {
    const { id } = req.params;
    const { name, description, image, edited_by } = req.body;
  
    try {
      const result = await pool.query(
        `UPDATE blogs
         SET name=$1,
             description=$2,
             image=$3,
             edited_by=$4,
             updated_at=NOW()
         WHERE id=$5
         RETURNING *`,
        [name, description, image, edited_by, id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Blog not found" });
      }
  
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  
  export const deleteBlog = async (req, res) => {
    const { id } = req.params;
  
    try {
      const result = await pool.query(
        "DELETE FROM blogs WHERE id=$1 RETURNING *",
        [id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Blog not found" });
      }
  
      res.json({ message: "Blog deleted" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  