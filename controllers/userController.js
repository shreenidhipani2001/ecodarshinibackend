import { PrismaClient } from '@prisma/client';
 

import { pool } from "../db/pgClient.js";

import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
const prisma = new PrismaClient();
 
 
export default prisma;
// CREATE / REGISTER USER
export const createUser = async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password_hash, phone, role },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .status(201)
      .json({ message: "User created", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

    

export const loginUser = async (req, res) => {

    console.log("DB URL:", process.env.DATABASE_URL);
    console.log("Login request received");
     
    
      if (!req.body.email || !req.body.password_hash) {
      return res.status(400).json({ message: "Email and password are required" });
    }
  const { email, password } = req.body;
  
  const email1 = req.body.email;
  console.log("Email:", email);
  console.log("Password:", password);

 try {
  const result = await pool.query(
    'SELECT id, email, password_hash, role FROM users WHERE email = $1',
    [email]
  );
  console.log("Raw SQL query result:", result);

  

  if(result?.rows[0]?.email != email1 || result.rows.length === 0 ) {
    console.log("Email mismatch");
    return res.status(404).json({ message: "Please check the credentials" });
  }

  if (result.rows.length === 0 ) {
    console.log("User not found");
    return res.status(404).json({ message: "User not found" });
  }

  const user = result.rows[0];
  console.log("User fetched from raw SQL:", user);
 

  const accessToken = generateAccessToken(user);
  console.log('accessToken:-',JSON.stringify(accessToken));
  const refreshToken = generateRefreshToken(user);

  return res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })
    .json({
      message: "Logged in",
      role: user.role,
      userId: user.id,
    });
} catch (err) {
    console.log("Error during login:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL USERS
export const getAllUsers = async (req, res) => {
    console.log("Fetching all users");
  try {
    
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message , message1: "Error fetching users"});
  }
};

// GET USER BY ID
export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message  });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, password } = req.body;
  try {
    const data = { name, email, phone, role };
    if (password) {
      data.password_hash = await bcrypt.hash(password, 10);
    }
    const updated = await prisma.user.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
