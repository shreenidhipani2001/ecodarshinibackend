import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";


//route imports
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import wishRoutes from "./routes/wishRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import subcategoryRoutes from "./routes/subcategoryRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import orderTrackingRoutes from "./routes/orderTrackingRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";

import { pool } from "./db/pgClient.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// IMPORTANT: CORS must come BEFORE routes
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
 

app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api/blogs",blogRoutes)
app.use("/api/wishes", wishRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/categories",categoryRoutes);
app.use("/api/subcategories",subcategoryRoutes);
app.use("/api/payments",paymentRoutes);
app.use("/api/orders",orderRoutes);
app.use("/api/track",orderTrackingRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "EcoDarshini Backend is running 🚀",
    status: "OK",
  });
});

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
     console.log("DB TEST RESULT:", result.rows[0]);
    res.json({
      success: true,
      time: result.rows[0],
    });
  } catch (err) {
    console.error("DB TEST ERROR:", err);
    res.status(500).json({ error: err.message , message: "Database connection failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

