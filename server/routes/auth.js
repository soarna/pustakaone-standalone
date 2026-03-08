/**
 * @fileoverview (i) package: routes 
 * @module routes/auth
 */
"use strict";
const express   = require("express");
const bcrypt    = require("bcryptjs"); 
const UserModel = require("../models/UserModel");
const { generateToken, authenticate, librarianOnly } = require("../middleware/auth");

const router = express.Router();
const fail   = UserModel.fail.bind(UserModel);

/** (d) POST /register */
router.post("/register", async (req, res) => {
  const err = UserModel.validate(req.body); // (h) validate
  if (err) return fail(res, 400, err);
  try {
    if (await UserModel.findByEmail(req.body.email)) 
      return fail(res, 409, "Email sudah terdaftar.");
    await UserModel.create(req.body); // (h) inheritance dari BaseModel
    res.status(201).json({ success: true, message: "Akun berhasil dibuat!" });
  } catch { fail(res, 500, "Gagal mendaftar."); }
});

/** (d) POST /login  */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 400, "Email dan kata sandi wajib diisi.");
  try {
    const user = await UserModel.findByEmail(email); // (h) overloading
    if (!user || !await bcrypt.compare(password, user.password))
      return fail(res, 401, "Email atau kata sandi salah.");
    const token = generateToken({ id: user.id, name: user.name, email: user.email, role: user.role });
    res.json({ success: true, token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch { fail(res, 500, "Gagal login."); }
});

/** GET /me */
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id); // (h) inheritance
    if (!user) return fail(res, 404, "User tidak ditemukan.");
    const { password: _, ...safe } = user;
    res.json({ success: true, user: safe });
  } catch { fail(res, 500, "Gagal."); }
});

/** PUT /profile*/
router.put("/profile", authenticate, async (req, res) => {
  const { name, password } = req.body;
  if (!name) return fail(res, 400, "Nama tidak boleh kosong.");
  if (password && password.length < 5) return fail(res, 400, "Kata sandi minimal 5 karakter.");
  try {
    await UserModel.updateProfile(req.user.id, name, password || null); // (h) overloading
    res.json({ success: true, message: "Profil diperbarui." });
  } catch { fail(res, 500, "Gagal."); }
});

module.exports = router;
