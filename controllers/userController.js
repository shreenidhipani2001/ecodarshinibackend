import { PrismaClient } from '@prisma/client';
 

import { pool } from "../db/pgClient.js";

import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import e from 'express';
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
     
   
  const { email, password } = req.body;
  
  const email1 = req.body.email;
  console.log("Email:", email);
  console.log("Password:", password);

 try {
  const result = await pool.query(
    'SELECT id, email,name, password_hash,phone, role FROM users WHERE email = $1',
    [email]
  );


  

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
      email: user.email,
      phone: user.phone,
      name: user.name,
    });
} catch (err) {
    console.log("Error during login:", err);
    res.status(500).json({ message: err.message });
  }
};


export const getCurrentUser = async (req, res) => {
  try {
    console.log("Request body:", req.body);

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const result = await pool.query(
      `SELECT id, name, email, role ,phone
       FROM users
       WHERE id = $1`,
      [userId]
    );

     
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    console.log("Fetched user:", user);
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return res.status(500).json({ message: "Server error" });
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
  
  try {
    

    const  userId  = req.params;
    // console.log("Request body:", req.body);

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const result = await pool.query(
      `SELECT id, name, email, role,phone
       FROM users
       WHERE id = $1`,
      [userId]
    );

    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message  });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, password } = req.body;
  console.log("Update user request for ID:", id);
  console.log("Update data:", req.body);

  try {
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash password if provided
    let password_hash = null;
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    // Update user with raw SQL
    const result = await pool.query(
      `UPDATE users
       SET name = $1, email = $2, phone = $3, password_hash = COALESCE($4, password_hash)
       WHERE id = $5
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone, password_hash, id]
    );

    const updatedUser = result.rows[0];
    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Update user error:", err);
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

// LOGOUT USER
export const logoutUser = async (req, res) => {
  try {
    res
      .clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
