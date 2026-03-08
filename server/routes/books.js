/**
 * @fileoverview (i) package: routes 
 * @module routes/books
 */
"use strict";
const express   = require("express");
const fs        = require("fs");
const path      = require("path");
const BookModel = require("../models/BookModel");
const upload    = require("../middleware/upload"); // (j) multer
const { authenticate, librarianOnly } = require("../middleware/auth");

const router     = express.Router();
const fail       = BookModel.fail.bind(BookModel);
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");

/** GET / — semua buku dengan filter opsional */
router.get("/", authenticate, async (req, res) => {
  try {
    const books = await BookModel.findWithFilter(req.query); // (h) overloading
    res.json({ success: true, books });
  } catch { fail(res, 500, "Gagal mengambil buku."); }
});

/** GET /genres */
router.get("/genres", authenticate, async (req, res) => {
  try { res.json({ success: true, genres: await BookModel.getGenres() }); }
  catch { fail(res, 500, "Gagal."); }
});

/** GET /:id — satu buku */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.id); // (h) inheritance
    if (!book) return fail(res, 404, "Buku tidak ditemukan.");
    res.json({ success: true, book });
  } catch { fail(res, 500, "Gagal."); }
});

/** POST / — tambah buku (pustakawan) */
router.post("/upload-cover", authenticate, librarianOnly, (req, res) => {
  upload.single("coverFile")(req, res, err => {
    if (err) return fail(res, 400, err.message);
    if (!req.file) return fail(res, 400, "File gambar wajib dilampirkan.");
    res.json({ success: true, cover_url: `/uploads/${req.file.filename}` });
  });
});

router.post("/", authenticate, librarianOnly, async (req, res) => {
  const err = BookModel.validate(req.body);
  if (err) return fail(res, 400, err);
  try {
    const book = await BookModel.create({ ...req.body, added_by: req.user.id });
    res.status(201).json({ success: true, message: "Buku ditambahkan.", book });
  } catch (e) { console.error(e); fail(res, 500, "Gagal menambahkan buku."); }
});

/** PUT /:id,  edit buku */
router.put("/:id", authenticate, librarianOnly, async (req, res) => {
  const err = BookModel.validate(req.body);
  if (err) return fail(res, 400, err);
  try {
    const old = await BookModel.findById(req.params.id);
    if (req.body.cover_url && old?.cover_url?.startsWith("/uploads/") &&
        old.cover_url !== req.body.cover_url) {
      fs.unlink(path.join(UPLOAD_DIR, path.basename(old.cover_url)), () => {});
    }
    await BookModel.update(req.params.id, req.body);
    res.json({ success: true, message: "Buku diperbarui." });
  } catch { fail(res, 500, "Gagal."); }
});

/** DELETE /:id, hapus buku  */
router.delete("/:id", authenticate, librarianOnly, async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.id); // (h) inheritance
    if (book?.cover_url?.startsWith("/uploads/"))
      fs.unlink(path.join(UPLOAD_DIR, path.basename(book.cover_url)), () => {});
    await BookModel.deleteById(req.params.id); // (h) inheritance BaseModel
    res.json({ success: true, message: "Buku dihapus." });
  } catch { fail(res, 500, "Gagal."); }
});

/** POST /:id/download */
router.post("/:id/download", authenticate, async (req, res) => {
  try {
    const book = await BookModel.incrementDownload(req.params.id);
    res.json({ success: true, fileUrl: book?.file_url || null });
  } catch { fail(res, 500, "Gagal."); }
});

module.exports = router;
