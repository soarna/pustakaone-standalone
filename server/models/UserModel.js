/**
 * @fileoverview (i) package: models
 * @module models/UserModel
 */
"use strict";
const bcrypt    = require("bcryptjs"); //bcryptjs
const BaseModel = require("../base/BaseModel");
const DB        = require("../config/db");

class UserModel extends BaseModel {

  // (h) Property override
  static get tableName() { return "users"; }
  static get idPrefix()  { return "usr"; }

  /**
   * (h) validate() 
   * @param {Object} data - { name, email, password }
   * @returns {string|null} 
   */
  static validate({ name, email, password } = {}) {
    if (!name || !email || !password) return "Semua field wajib diisi.";
    if (password.length < 5)          return "Kata sandi minimal 5 karakter.";
    return null;
  }

  static async findByEmail(email) {
    const [row] = await DB.query("SELECT * FROM users WHERE email = ?", [email]);
    return row || null;
  }

  /** (e) create User */
  static async create({ name, email, password, role = "user" }) {
    const id   = this.generateId();
    const hash = await bcrypt.hash(password, 10);
    await DB.query(
      "INSERT INTO users (id,name,email,password,role) VALUES (?,?,?,?,?)",
      [id, name, email, hash, role] // (f) array parameter
    );
    return id;
  }

  /** (e) createLibrarian */
  static async createLibrarian({ name, email, password }) {
    const id   = this.generateId();
    const hash = await bcrypt.hash(password, 10);
    await DB.query(
      "INSERT INTO users (id,name,email,password,role,staff_id) VALUES (?,?,?,?,'librarian',?)",
      [id, name, email, hash, `STAFF_${Date.now()}`]
    );
    return id;
  }

  /**
   * (e) updateProfile 
   * (h) Overloading: dengan/tanpa password (perilaku berbeda)
   */
  static async updateProfile(id, name, password = null) {

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      return DB.query("UPDATE users SET name=?,password=? WHERE id=?", [name, hash, id]);
    }
    return DB.query("UPDATE users SET name=? WHERE id=?", [name, id]);
  }

  /** (e) findAllSafe, tanpa password */
  static async findAllSafe() {
    return DB.query(
      "SELECT id,name,email,role,created_at FROM users ORDER BY created_at DESC"
    );
  }
}

module.exports = UserModel;
