import dotenv from "dotenv";
dotenv.config(); // ✅ LOAD ENV FIRST

import pkg from "pg";
const { Pool } = pkg;

console.log("Database URL on pgClient:", process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

