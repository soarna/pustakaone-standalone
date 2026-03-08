/**
 * @fileoverview Middleware upload file (multer)
 * @module middleware/upload
 */
"use strict";
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

// Gunakan UPLOAD_DIR dari env (di-set oleh index.js) atau fallback ke folder lokal
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `cover_${Date.now()}${ext}`);
  },
});

const ALLOWED = [".jpg", ".jpeg", ".png", ".webp"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED.includes(ext)) cb(null, true);
  else cb(new Error("Hanya file gambar (jpg, png, webp)"), false);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
