// import express from 'express';
// import dotenv from 'dotenv';
// import cors from 'cors';
// import cookieParser from "cookie-parser";
// import userRoutes from '../ecodarshinibackend/routes/userRoutes.js';

// dotenv.config();

// const app = express();
// app.use(cookieParser());
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());
// app.use('/api/users', userRoutes);
// app.get('/', (req, res) => {
//   res.json({
//     message: 'EcoDarshini Backend is running 🚀',
//     status: 'OK'
//   });
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });


import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import { pool } from "./db/pgClient.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// IMPORTANT: CORS must come BEFORE routes
app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
 

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "EcoDarshini Backend is running 🚀",
    status: "OK",
  });
});

app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    const wwww = await pool.query(`SELECT tablename
FROM pg_tables
WHERE tablename ILIKE '%user%';`);
    console.log("Tables with 'user' in name:", wwww.rows);

     const xxxx = await pool.query(`SELECT tablename
FROM pg_tables
WHERE tablename ILIKE '%user%';`);
    console.log("Tables with 'user' in name:", xxxx.rows);
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

