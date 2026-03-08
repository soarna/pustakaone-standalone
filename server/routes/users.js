/**
 * @fileoverview (i) package: routes
 * @module routes/users
 */
"use strict";
const express       = require("express");
const UserModel     = require("../models/UserModel");
const WishlistModel = require("../models/WishlistModel");
const { authenticate, librarianOnly } = require("../middleware/auth");

const router = express.Router();
const fail   = UserModel.fail.bind(UserModel);

/** GET / — semua pengguna */
router.get("/", authenticate, librarianOnly, async (req, res) => {
  try { res.json({ success: true, users: await UserModel.findAllSafe() }); } // (h) inheritance
  catch { fail(res, 500, "Gagal."); }
});

/** DELETE /:id — hapus pengguna */
router.delete("/:id", authenticate, librarianOnly, async (req, res) => {
  if (req.params.id === req.user.id) return fail(res, 400, "Tidak bisa menghapus akun sendiri.");
  try {
    await UserModel.deleteById(req.params.id); // (h) inheritance BaseModel
    res.json({ success: true, message: "Pengguna dihapus." });
  } catch { fail(res, 500, "Gagal."); }
});

/** GET /wishlist/my */
router.get("/wishlist/my", authenticate, async (req, res) => {
  try { res.json({ success: true, books: await WishlistModel.findByUser(req.user.id) }); }
  catch { fail(res, 500, "Gagal."); }
});

/** GET /wishlist/ids */
router.get("/wishlist/ids", authenticate, async (req, res) => {
  try { res.json({ success: true, ids: await WishlistModel.findIdsByUser(req.user.id) }); }
  catch { fail(res, 500, "Gagal."); }
});

/** POST /wishlist/:bookId */
router.post("/wishlist/:bookId", authenticate, async (req, res) => {
  try {
    const added = await WishlistModel.toggle(req.user.id, req.params.bookId);
    res.json({ success: true, added,
      message: added ? "Ditambahkan ke daftar." : "Dihapus dari daftar." });
  } catch { fail(res, 500, "Gagal."); }
});

module.exports = router;
