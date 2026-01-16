import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const token = req.cookies.accessToken || req.headers["authorization"]?.split(" ")[1];
    console.log("Auth Middleware - Token:", token);

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    console.log("Auth Middleware - Verifying token");
    console.log("Auth Middleware - Secret:", process.env.ACCESS_TOKEN_SECRET);
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("Auth Middleware - Decoded token:", decoded);
    req.user = decoded; // {id, email, role}
    console.log("Auth Middleware - User set on req:", req.user);
    next();
  } catch (err) {
    console.log("Auth Middleware - Token verification failed:", err);
    return res.status(403).json({ message: "Invalid token" });
  }
};
 