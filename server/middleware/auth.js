/**
 * @fileoverview (i) package: middleware 
 * @module middleware/auth
 */
"use strict";
const jwt    = require("jsonwebtoken"); // (j) jsonwebtoken
const SECRET = process.env.JWT_SECRET || "pustakaone_secret_key_2026";

/**
 * (e) authenticate 
 */
function authenticate(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Token tidak ditemukan." });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(403).json({ success: false, message: "Token tidak valid." });
  }
}

/**
 * (e) librarianOnly
 * (h) Hak akses berdasarkan role
 */
function librarianOnly(req, res, next) {
  if (req.user.role !== "librarian")
    return res.status(403).json({ success: false, message: "Akses ditolak." });
  next();
}

/** (e) generateToken  */
function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

module.exports = { authenticate, librarianOnly, generateToken };
