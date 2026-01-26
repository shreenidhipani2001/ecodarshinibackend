import { pool } from "../db/pgClient.js";
import { reverseGeocode, searchAddress } from "../utils/nominatim.js";

// Valid tracking statuses
const VALID_STATUSES = [
  "ORDER_PLACED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED_DELIVERY",
  "RETURNED",
];

// ADD TRACKING UPDATE (with coordinates - uses reverse geocoding)
export const addTrackingUpdate = async (req, res) => {
  const { order_id, status, latitude, longitude, notes } = req.body;

  try {
    // Validation
    if (!order_id || !status) {
      return res.status(400).json({
        message: "order_id and status are required",
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    // Check if order exists
    const orderCheck = await pool.query("SELECT * FROM orders WHERE id = $1", [
      order_id,
    ]);

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    let addressData = null;

    // If coordinates provided, get address from Nominatim
    if (latitude && longitude) {
      try {
        addressData = await reverseGeocode(latitude, longitude);
      } catch (err) {
        console.error("Failed to fetch address from coordinates:", err);
        // Continue without address data
      }
    }

    const result = await pool.query(
      `INSERT INTO order_tracking (
        order_id, status, latitude, longitude,
        address_display, address_road, address_city,
        address_state, address_country, address_postcode,
        osm_id, osm_type, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        order_id,
        status,
        latitude || null,
        longitude || null,
        addressData?.display_name || null,
        addressData?.road || null,
        addressData?.city || null,
        addressData?.state || null,
        addressData?.country || null,
        addressData?.postcode || null,
        addressData?.osm_id || null,
        addressData?.osm_type || null,
        notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ADD TRACKING UPDATE WITH ADDRESS (uses search geocoding)
export const addTrackingWithAddress = async (req, res) => {
  const { order_id, status, address, notes } = req.body;

  try {
    // Validation
    if (!order_id || !status) {
      return res.status(400).json({
        message: "order_id and status are required",
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    // Check if order exists
    const orderCheck = await pool.query("SELECT * FROM orders WHERE id = $1", [
      order_id,
    ]);

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    let addressData = null;

    // If address provided, search for coordinates
    if (address) {
      try {
        addressData = await searchAddress(address);
      } catch (err) {
        console.error("Failed to geocode address:", err);
        // Continue without address data
      }
    }

    const result = await pool.query(
      `INSERT INTO order_tracking (
        order_id, status, latitude, longitude,
        address_display, address_road, address_city,
        address_state, address_country, address_postcode,
        osm_id, osm_type, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        order_id,
        status,
        addressData?.latitude || null,
        addressData?.longitude || null,
        addressData?.display_name || address || null,
        addressData?.road || null,
        addressData?.city || null,
        addressData?.state || null,
        addressData?.country || null,
        addressData?.postcode || null,
        addressData?.osm_id || null,
        addressData?.osm_type || null,
        notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({error:"We will get back to you soon", message: err.message });
  }
};

// GET TRACKING HISTORY FOR AN ORDER
export const getTrackingHistory = async (req, res) => {
  const { orderId } = req.params;
  

  try {
    // Check if order exists
    const orderCheck = await pool.query("SELECT * FROM orders WHERE id = $1", [
      orderId,
    ]);

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const result = await pool.query(
      `SELECT * FROM order_tracking
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [orderId]
    );

    res.json({
      order_id: orderId,
      tracking_count: result.rows.length,
      tracking_history: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};



// GET CURRENT/LATEST TRACKING STATUS FOR AN ORDER
export const getCurrentStatus = async (req, res) => {
  const { orderId } = req.params;

  try {
    // Check if order exists
    const orderCheck = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const result = await pool.query(
      `SELECT * FROM order_tracking
       WHERE order_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [orderId]
    );

    const order = orderCheck.rows[0];
    const currentTracking = result.rows[0] || null;

    res.json({
      order,
      current_tracking: currentTracking,
      current_status: currentTracking?.status || order.status,
      last_updated: currentTracking?.created_at || order.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL TRACKING ENTRIES (Admin)
export const getAllTrackingEntries = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, o.total_amount, o.status as order_status, u.name as user_name
       FROM order_tracking t
       JOIN orders o ON t.order_id = o.id
       JOIN users u ON o.user_id = u.id
       ORDER BY t.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


export const getAllTrackingEntriesForAUser = async (req, res) => {
  try {

    console.log('user id is::::',req.params.userId);
    const result = await pool.query(
      `SELECT 
          t.*,
          o.total_amount,
          o.status,
          o.user_id,
          u.name AS user_name
       FROM order_tracking t
       JOIN orders o 
         ON t.order_id = o.id
       JOIN users u
         ON o.user_id = u.id
       WHERE o.user_id = $1
       `,
      [req.params.userId]
    );
    

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE TRACKING ENTRY
export const deleteTrackingEntry = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await pool.query(
      "SELECT * FROM order_tracking WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Tracking entry not found" });
    }

    await pool.query("DELETE FROM order_tracking WHERE id = $1", [id]);
    res.json({ message: "Tracking entry deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// UPDATE TRACKING ENTRY
export const updateTrackingEntry = async (req, res) => {
  const { id } = req.params;
  const { status, latitude, longitude, notes } = req.body;

  try {
    const existing = await pool.query(
      "SELECT * FROM order_tracking WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Tracking entry not found" });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    let addressData = null;

    // If new coordinates provided, fetch new address
    if (latitude && longitude) {
      try {
        addressData = await reverseGeocode(latitude, longitude);
      } catch (err) {
        console.error("Failed to fetch address from coordinates:", err);
      }
    }

    const result = await pool.query(
      `UPDATE order_tracking
       SET status = COALESCE($1, status),
           latitude = COALESCE($2, latitude),
           longitude = COALESCE($3, longitude),
           address_display = COALESCE($4, address_display),
           address_road = COALESCE($5, address_road),
           address_city = COALESCE($6, address_city),
           address_state = COALESCE($7, address_state),
           address_country = COALESCE($8, address_country),
           address_postcode = COALESCE($9, address_postcode),
           osm_id = COALESCE($10, osm_id),
           osm_type = COALESCE($11, osm_type),
           notes = COALESCE($12, notes)
       WHERE id = $13
       RETURNING *`,
      [
        status || null,
        latitude || null,
        longitude || null,
        addressData?.display_name || null,
        addressData?.road || null,
        addressData?.city || null,
        addressData?.state || null,
        addressData?.country || null,
        addressData?.postcode || null,
        addressData?.osm_id || null,
        addressData?.osm_type || null,
        notes || null,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
