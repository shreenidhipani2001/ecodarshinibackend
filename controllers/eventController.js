import { pool } from "../db/pgClient.js";
import { attachImagesToProducts } from "../utils/payloadCMS.js";


export const createEvent = async (req, res) => {
    try {
      const {
        title,
        short_description,
        full_description,
        event_date,
        location,
        video_url,
        video_title,
        cms_image_id,
        cms_image_ids,
        is_featured,
        status
      } = req.body;
  
      const result = await pool.query(
        `INSERT INTO events 
        (title, short_description, full_description, event_date, location,
         video_url, video_title, cms_image_id, cms_image_ids, is_featured, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
          title,
          short_description,
          full_description,
          event_date,
          location,
          video_url,
          video_title,
          cms_image_id,
          cms_image_ids,
          is_featured || false,
          status || "active"
        ]
      );
  
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };
  


  export const getAllEvents = async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM events WHERE status='active' ORDER BY created_at DESC"
      );
  
      let events = result.rows.map(e => {
        const gallery = Array.isArray(e.cms_image_ids) ? e.cms_image_ids : [];
        const allIds = e.cms_image_id ? [e.cms_image_id, ...gallery] : gallery;
  
        return { ...e, cms_image_ids: allIds };
      });
  
      const eventsWithImages = await attachImagesToProducts(events);
  
      res.json(eventsWithImages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };

  export const getEventById = async (req, res) => {
    try {
      const { id } = req.params;
  
      const result = await pool.query(
        "SELECT * FROM events WHERE id=$1",
        [id]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ message: "Event not found" });
      }
  
      let event = result.rows[0];
  
      const gallery = Array.isArray(event.cms_image_ids) ? event.cms_image_ids : [];
      const allIds = event.cms_image_id ? [event.cms_image_id, ...gallery] : gallery;
  
      event.cms_image_ids = allIds;
  
      const [eventWithImages] = await attachImagesToProducts([event]);
  
      res.json(eventWithImages);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };

  export const updateEvent = async (req, res) => {
    try {
      const { id } = req.params;
      const fields = req.body;
  
      const keys = Object.keys(fields);
      const values = Object.values(fields);
  
      const setClause = keys.map((k, i) => `${k}=$${i + 1}`).join(", ");
  
      const result = await pool.query(
        `UPDATE events SET ${setClause}, updated_at=CURRENT_TIMESTAMP
         WHERE id=$${keys.length + 1}
         RETURNING *`,
        [...values, id]
      );
  
      if (!result.rows.length) {
        return res.status(404).json({ message: "Event not found" });
      }
  
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };

  export const deleteEvent = async (req, res) => {
    try {
      const { id } = req.params;
  
      const existing = await pool.query(
        "SELECT id FROM events WHERE id=$1",
        [id]
      );
  
      if (!existing.rows.length) {
        return res.status(404).json({ message: "Event not found" });
      }
  
      await pool.query("DELETE FROM events WHERE id=$1", [id]);
  
      res.json({ message: "Event deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };
  