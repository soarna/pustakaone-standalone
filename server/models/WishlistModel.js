/**
 * @fileoverview (i) package: models 
 * @module models/WishlistModel
 */
"use strict";
const BaseModel = require("../base/BaseModel");
const DB        = require("../config/db");


class WishlistModel extends BaseModel {

  // (h) Property override
  static get tableName() { return "wishlist"; }
  static get idPrefix()  { return "wl"; }

  /** (h) validate() */
  static validate({ user_id, book_id } = {}) {
    if (!user_id || !book_id) return "user_id dan book_id wajib ada.";
    return null;
  }

  /** (e) findByUser */
  static async findByUser(userId) {
    return DB.query(
      `SELECT b.* FROM books b
       INNER JOIN wishlist w ON b.id = w.book_id
       WHERE w.user_id = ? ORDER BY w.added_at DESC`,
      [userId]
    );
  }

  /** (e) findIdsByUser */
  static async findIdsByUser(userId) {
    const rows = await DB.query("SELECT book_id FROM wishlist WHERE user_id = ?", [userId]);
    return rows.map(r => r.book_id); // (f) Array
  }

  /**
   * (e) toggle, tambah jika belum ada, hapus jika sudah ada
   * @returns {boolean}
   */
  static async toggle(userId, bookId) {
    const [row] = await DB.query(
      "SELECT id FROM wishlist WHERE user_id = ? AND book_id = ?", [userId, bookId]
    );
    if (row) {
      await DB.query("DELETE FROM wishlist WHERE user_id = ? AND book_id = ?", [userId, bookId]);
      return false;
    }
    await DB.query("INSERT INTO wishlist (user_id,book_id) VALUES (?,?)", [userId, bookId]);
    return true;
  }
}

module.exports = WishlistModel;
