import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import { pool } from "./db/pgClient.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// IMPORTANT: CORS must come BEFORE routes
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
 

app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/products", productRoutes);

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
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

