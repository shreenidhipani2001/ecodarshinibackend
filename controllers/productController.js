import { pool } from "../db/pgClient.js";
import { attachImagesToProduct, attachImagesToProducts } from "../utils/payloadCMS.js";

// UPLOAD PRODUCT WITH IMAGES
export const uploadProduct = async (req, res) => {
  const { name, slug, description, price, stock, sub_category_id, artist_name } = req.body;

  try {
    // Validation
    if (!name || !slug || !price || !stock || !sub_category_id) {
      return res.status(400).json({
        message: "Name, slug, price, stock, and sub_category_id are required"
      });
    }

    // Cloudinary public_ids from uploaded files
    const imageIds = req.files ? req.files.map((file) => file.filename) : [];

    // Check if subcategory exists and get its category_id
    const subcategoryCheck = await pool.query(
      "SELECT * FROM sub_categories WHERE id = $1",
      [sub_category_id]
    );

    if (subcategoryCheck.rows.length === 0) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    const derivedCategoryId = subcategoryCheck.rows[0].category_id;

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
       (name, slug, description, price, stock, category_id, sub_category_id, cms_image_ids, artist_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, slug, description, price, stock, derivedCategoryId, sub_category_id, JSON.stringify(imageIds), artist_name]
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
    name, slug, description, price, stock, user_id,
    sub_category_id, cms_image_ids, artist_name, added_by
  } = req.body;
  console.log("Create product request body:", req.body);

  try {
    // Validation
    if (!name || !price || !stock || !sub_category_id || !user_id) {
      return res.status(400).json({
        message: "Name, price, stock, sub_category_id, and user_id are required"
      });
    }

    // Check if subcategory exists and get its category_id
    const subcategoryCheck = await pool.query(
      "SELECT * FROM sub_categories WHERE id = $1",
      [sub_category_id]
    );

    if (subcategoryCheck.rows.length === 0) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    const derivedCategoryId = subcategoryCheck.rows[0].category_id;

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
       (name, slug, description, price, stock, category_id, sub_category_id, cms_image_ids, artist_name, added_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, slug, description, price, stock, derivedCategoryId, sub_category_id, cms_image_ids, artist_name, added_by]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL PRODUCTS
// export const getAllProducts = async (req, res) => {
//   try {
//     const result = await pool.query(
//       `SELECT p.*, c.name as category_name, s.name as subcategory_name
//        FROM products p
//        JOIN categories c ON p.category_id = c.id
//        LEFT JOIN sub_categories s ON p.sub_category_id = s.id
//        WHERE p.is_active = true
//        ORDER BY p.created_at DESC`
//     );

//     // Attach CMS images to each product
//     const productsWithImages = await attachImagesToProducts(result.rows);
//     res.json(productsWithImages);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };

// GET ALL PRODUCTS (now with pagination)
export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const search = req.query.search || "";
    const category_id = req.query.category_id || null;
    const sub_category_id = req.query.sub_category_id || null;

    // Build WHERE conditions
    let whereClause = "WHERE p.is_active = true";
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND p.name ILIKE '%' || $${paramIndex} || '%'`;
      queryParams.push(search);
      paramIndex++;
    }
    if (category_id) {
      whereClause += ` AND p.category_id = $${paramIndex}`;
      queryParams.push(category_id);
      paramIndex++;
    }
    if (sub_category_id) {
      whereClause += ` AND p.sub_category_id = $${paramIndex}`;
      queryParams.push(sub_category_id);
      paramIndex++;
    }

    // 1. Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM products p
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // 2. Get paginated products
    const dataQuery = `
      SELECT p.*, 
             c.name as category_name, 
             s.name as subcategory_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN sub_categories s ON p.sub_category_id = s.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataResult = await pool.query(dataQuery, [
      ...queryParams,
      limit,
      offset,
    ]);
    // console.log('dataResult:--'+JSON.stringify(dataResult.rows));
    // 3. Attach images ONLY for this page's products (max ~100 fetches)
    const productsWithImages = await attachImagesToProducts(dataResult.rows);
    // console.log('productsWithImages:-',productsWithImages);

    res.json({
      products: productsWithImages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: err.message });
  }
};

//get for the catalouge:--
export const getAllProductsCat = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;

    const offset = (page - 1) * limit;

    const search         = req.query.search || "";
    const category_id    = req.query.category_id    || null;
    const sub_category_id = req.query.sub_category_id || null;

    // Build WHERE conditions
    let whereClause = "WHERE p.is_active = true";
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND p.name ILIKE '%' || $${paramIndex} || '%'`;
      queryParams.push(search);
      paramIndex++;
    }
    if (category_id) {
      whereClause += ` AND p.category_id = $${paramIndex}`;
      queryParams.push(category_id);
      paramIndex++;
    }
    if (sub_category_id) {
      whereClause += ` AND p.sub_category_id = $${paramIndex}`;
      queryParams.push(sub_category_id);
      paramIndex++;
    }

    // 1. Total count (always needed so frontend knows when to stop)
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM products p
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // 2. Fetch only current page's products
    const dataQuery = `
      SELECT p.*, 
             c.name as category_name, 
             s.name as subcategory_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN sub_categories s ON p.sub_category_id = s.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataResult = await pool.query(dataQuery, [
      ...queryParams,
      limit,
      offset,
    ]);

    const productsWithImages = await attachImagesToProducts(dataResult.rows);

    res.json({
      products: productsWithImages,
      total,              // important for knowing last page
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error in catalogue products:", err);
    res.status(500).json({ message: err.message });
  }
};


export const getAllProductsCategorywise = async (req, res) => {
  const { id } = req.params; // category id
 
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const search = req.query.search || "";
    const sub_category_id = req.query.sub_category_id || null;

    let queryParams = [];
    let paramIndex = 1;

    // BASE WHERE
    let whereClause = `WHERE p.is_active = true AND p.category_id = $${paramIndex}`;
    queryParams.push(id);
    paramIndex++;

    // SEARCH
    if (search) {
      whereClause += ` AND p.name ILIKE '%' || $${paramIndex} || '%'`;
      queryParams.push(search);
      paramIndex++;
    }

    // SUB CATEGORY
    if (sub_category_id) {
      whereClause += ` AND p.sub_category_id = $${paramIndex}`;
      queryParams.push(sub_category_id);
      paramIndex++;
    }

    // COUNT QUERY
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM products p
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // DATA QUERY
    const dataQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        s.name as subcategory_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN sub_categories s ON p.sub_category_id = s.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataResult = await pool.query(dataQuery, [
      ...queryParams,
      limit,
      offset,
    ]);

    const productsWithImages = await attachImagesToProducts(dataResult.rows);

    res.json({
      products: productsWithImages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    console.error("Error in catalogue products:", err);
    res.status(500).json({ message: err.message });
  }
};




export const getAllProductsCategorywisequery = async (req, res) => {
  const id = req.query.id; // <-- changed
console.log('id came:-',id)
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const search = req.query.search || "";
    const sub_category_id = req.query.sub_category_id || null;

    let queryParams = [];
    let paramIndex = 1;

    let whereClause = `WHERE p.is_active = true AND p.category_id = $${paramIndex}`;
    queryParams.push(id);
    paramIndex++;

    if (search) {
      whereClause += ` AND p.name ILIKE '%' || $${paramIndex} || '%'`;
      queryParams.push(search);
      paramIndex++;
    }

    if (sub_category_id) {
      whereClause += ` AND p.sub_category_id = $${paramIndex}`;
      queryParams.push(sub_category_id);
      paramIndex++;
    }

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM products p
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    const dataQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        s.name as subcategory_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN sub_categories s ON p.sub_category_id = s.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataResult = await pool.query(dataQuery, [
      ...queryParams,
      limit,
      offset,
    ]);

    const productsWithImages = await attachImagesToProducts(dataResult.rows);
    
    res.json({
      products: productsWithImages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({error:'error in fetching', message: err.message });
  }

};


// export const getAll5Latest = async (req, res) => {
//   try {
//     const page  = parseInt(req.query.page)  || 1;
//     const limit = parseInt(req.query.limit) || 20;

//     const offset = (page - 1) * limit;

//     const search         = req.query.search || "";
//     const category_id    = req.query.category_id    || null;
//     const sub_category_id = req.query.sub_category_id || null;

//     // Build WHERE conditions
//     let whereClause = "WHERE p.is_active = true";
//     const queryParams = [];
//     let paramIndex = 1;

//     if (search) {
//       whereClause += ` AND p.name ILIKE '%' || $${paramIndex} || '%'`;
//       queryParams.push(search);
//       paramIndex++;
//     }
//     if (category_id) {
//       whereClause += ` AND p.category_id = $${paramIndex}`;
//       queryParams.push(category_id);
//       paramIndex++;
//     }
//     if (sub_category_id) {
//       whereClause += ` AND p.sub_category_id = $${paramIndex}`;
//       queryParams.push(sub_category_id);
//       paramIndex++;
//     }

//     // 1. Total count (always needed so frontend knows when to stop)
//     const countQuery = `
//       SELECT COUNT(*) as total 
//       FROM products p
//       ${whereClause}
//     `;
//     const countResult = await pool.query(countQuery, queryParams);
//     const total = parseInt(countResult.rows[0].total);

//     // 2. Fetch only current page's products
//     const dataQuery = `
//       SELECT p.*, 
//              c.name as category_name, 
//              s.name as subcategory_name
//       FROM products p
//       JOIN categories c ON p.category_id = c.id
//       LEFT JOIN sub_categories s ON p.sub_category_id = s.id
//       ${whereClause}
//       ORDER BY p.created_at DESC
//       LIMIT 5
//     `;

//     const dataResult = await pool.query(dataQuery, [
//       ...queryParams,
//       limit,
//       offset,
//     ]);

//     const productsWithImages = await attachImagesToProducts(dataResult.rows);

//     res.json({
//       products: productsWithImages,
//       total,              // important for knowing last page
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//     });
//   } catch (err) {
//     console.error("Error in catalogue products:", err);
//     res.status(500).json({ message: err.message });
//   }
// };




// GET PRODUCT BY ID


export const getAll5Latest = async (req, res) => {
  try {
    const search = req.query.search || "";
    const category_id = req.query.category_id || null;
    const sub_category_id = req.query.sub_category_id || null;

    // Build WHERE conditions
    let whereClause = "WHERE p.is_active = true";
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND p.name ILIKE '%' || $${paramIndex} || '%'`;
      queryParams.push(search);
      paramIndex++;
    }
    if (category_id) {
      whereClause += ` AND p.category_id = $${paramIndex}`;
      queryParams.push(category_id);
      paramIndex++;
    }
    if (sub_category_id) {
      whereClause += ` AND p.sub_category_id = $${paramIndex}`;
      queryParams.push(sub_category_id);
      paramIndex++;
    }

    // Fetch only 5 latest products
    const dataQuery = `
      SELECT p.*, 
             c.name as category_name, 
             s.name as subcategory_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN sub_categories s ON p.sub_category_id = s.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT 5
    `;

    // Only pass queryParams (no limit/offset since LIMIT 5 is hardcoded)
    const dataResult = await pool.query(dataQuery, queryParams);

    const productsWithImages = await attachImagesToProducts(dataResult.rows);

    res.json({
      products: productsWithImages,
      total: productsWithImages.length,
    });
  } catch (err) {
    console.error("Error in getAll5Latest:", err);
    res.status(500).json({ message: err.message });
  }
};





export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name, s.name as subcategory_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       LEFT JOIN sub_categories s ON p.sub_category_id = s.id
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
export const getAllOrdersProductsCategorywise = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT p.*, o.*
       FROM orders o
       JOIN products p ON p.id = o.product_id
       
       WHERE o.product_id = $1`,
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
  const { name, slug, description, price, stock, sub_category_id, cms_image_ids, artist_name, is_active } = req.body;
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

    // Check if subcategory exists if being updated and derive category_id
    let derivedCategoryId = null;
    if (sub_category_id) {
      const subcategoryCheck = await pool.query(
        "SELECT * FROM sub_categories WHERE id = $1",
        [sub_category_id]
      );

      if (subcategoryCheck.rows.length === 0) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      derivedCategoryId = subcategoryCheck.rows[0].category_id;
    }

    const result = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           price = COALESCE($4, price),
           stock = COALESCE($5, stock),
           sub_category_id = COALESCE($6, sub_category_id),
           category_id = COALESCE($7, category_id),
           cms_image_ids = COALESCE($8, cms_image_ids),
           artist_name = COALESCE($9, artist_name),
           is_active = COALESCE($10, is_active)
       WHERE id = $11
       RETURNING *`,
      [name, slug, description, price, stock, sub_category_id, derivedCategoryId, cms_image_ids, artist_name, is_active, id]
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

// GET PRODUCTS BY IDS (for cart/wishlist - with pagination for images)
// POST /api/products/by-ids
// Body: { product_ids: [...], page: 1, limit: 10 }
export const getProductsByIds = async (req, res) => {
  try {
    const { product_ids } = req.body;
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.json({ products: [], total: 0, page, limit, totalPages: 0 });
    }

    // Remove duplicates
    const uniqueIds = [...new Set(product_ids)];
    const total = uniqueIds.length;
    const totalPages = Math.ceil(total / limit);

    // Get the slice of IDs for this page
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const pageIds = uniqueIds.slice(startIndex, endIndex);

    if (pageIds.length === 0) {
      return res.json({ products: [], total, page, limit, totalPages });
    }

    // Build placeholders for SQL IN clause
    const placeholders = pageIds.map((_, i) => `$${i + 1}`).join(', ');

    const dataQuery = `
      SELECT p.*,
             c.name as category_name,
             s.name as subcategory_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN sub_categories s ON p.sub_category_id = s.id
      WHERE p.id IN (${placeholders})
    `;

    const dataResult = await pool.query(dataQuery, pageIds);

    // Attach images ONLY for this page's products
    const productsWithImages = await attachImagesToProducts(dataResult.rows);

    // Return in the same order as requested
    const orderedProducts = pageIds.map(id =>
      productsWithImages.find(p => p.id === id)
    ).filter(Boolean);

    res.json({
      products: orderedProducts,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err) {
    console.error("Error fetching products by IDs:", err);
    res.status(500).json({ message: err.message });
  }
};
