import { pool } from "../db/pgClient.js";
import { attachImagesToProducts } from "../utils/payloadCMS.js";
export const createTestimonial = async (req, res) => {
    const {
      customer_name,
      customer_role,
      company_name,
      testimonial_text,
      short_highlight,
      rating,
      cms_image_id,
      cms_image_ids,
      location,
      is_featured,
      status
    } = req.body;
  
    try {
      const result = await pool.query(
        `INSERT INTO testimonials
        (customer_name, customer_role, company_name, testimonial_text,
         short_highlight, rating, cms_image_id, cms_image_ids,
         location, is_featured, status)
        VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *`,
        [
          customer_name,
          customer_role,
          company_name,
          testimonial_text,
          short_highlight,
          rating,
          cms_image_id,
          cms_image_ids ? JSON.stringify(cms_image_ids) : null,
          location,
          is_featured ?? false,
          status ?? "active"
        ]
      );
  
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };
  

  export const updateTestimonial = async (req, res) => {
    const { id } = req.params;
    const {
      customer_name,
      customer_role,
      company_name,
      testimonial_text,
      short_highlight,
      rating,
      cms_image_id,
      cms_image_ids,
      location,
      is_featured,
      status
    } = req.body;
  
    try {
      const existing = await pool.query(
        "SELECT * FROM testimonials WHERE id = $1",
        [id]
      );
  
      if (existing.rows.length === 0) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
  
      const result = await pool.query(
        `UPDATE testimonials SET
          customer_name=$1,
          customer_role=$2,
          company_name=$3,
          testimonial_text=$4,
          short_highlight=$5,
          rating=$6,
          cms_image_id=$7,
          cms_image_ids=$8,
          location=$9,
          is_featured=$10,
          status=$11,
          updated_at=CURRENT_TIMESTAMP
         WHERE id=$12
         RETURNING *`,
        [
          customer_name,
          customer_role,
          company_name,
          testimonial_text,
          short_highlight,
          rating,
          cms_image_id,
          cms_image_ids ? JSON.stringify(cms_image_ids) : null,
          location,
          is_featured,
          status,
          id
        ]
      );
  
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };
  
  export const deleteTestimonial = async (req, res) => {
    const { id } = req.params;
  
    try {
      const existing = await pool.query(
        "SELECT * FROM testimonials WHERE id = $1",
        [id]
      );
  
      if (existing.rows.length === 0) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
  
      await pool.query("DELETE FROM testimonials WHERE id = $1", [id]);
  
      res.json({ message: "Testimonial deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };
  

//   export const getAllTestimonials = async (req, res) => {
//     try {
//       const result = await pool.query(
//         "SELECT * FROM testimonials ORDER BY created_at DESC"
//       );
  
//       res.json(result.rows);
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: err.message });
//     }
//   };
  


export const getAllTestimonials = async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM testimonials WHERE status = 'active' ORDER BY created_at DESC"
      );
  
      let testimonials = result.rows;
      console.log('testimonials:-',testimonials)
  
      // Normalize image fields so utility can work
      testimonials = testimonials.map(t => {
        const galleryIds = Array.isArray(t.cms_image_ids) ? t.cms_image_ids : [];
  
        // merge avatar + gallery
        const allIds = t.cms_image_id
          ? [t.cms_image_id, ...galleryIds]
          : galleryIds;
  
        return {
          ...t,
          cms_image_ids: allIds, // utility expects this field
        };
      });
  
      // Attach images using existing utility
      const testimonialsWithImages = await attachImagesToProducts(testimonials);
      console.log('testimonialsWithImages:-'+JSON.stringify(testimonialsWithImages));
  
      res.json(testimonialsWithImages);
    } catch (err) {
      console.error("Error fetching testimonials:", err);
      res.status(500).json({ message: err.message });
    }
  };
  export const getTestimonialById = async (req, res) => {
    const { id } = req.params;
  
    try {
      const result = await pool.query(
        "SELECT * FROM testimonials WHERE id = $1",
        [id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
  
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };
  