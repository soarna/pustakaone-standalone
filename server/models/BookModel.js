/**
 * @fileoverview (i) package: models 
 * @module models/BookModel
 */
"use strict";
const BaseModel = require("../base/BaseModel");
const DB        = require("../config/db");

/**
 * BookModel
 * (h) Inheritance dari BaseModel.
 */
class BookModel extends BaseModel {

  // (h) Property override
  static get tableName() { return "books"; }
  static get idPrefix()  { return "book"; }

  /** (h) Polymorphism: validate() khusus buku */
  static validate({ title, author } = {}) {
    if (!title)  return "Judul wajib diisi.";
    if (!author) return "Penulis wajib diisi.";
    return null;
  }

  static async findWithFilter({ genre, sort, search } = {}) {
    let sql          = "SELECT * FROM books WHERE 1=1";
    const params     = []; // (f) Array
    const sortOrders = { title: "title ASC", author: "author ASC", oldest: "year ASC" };

    // (d) filter
    if (search) {
      sql += " AND (title LIKE ? OR author LIKE ? OR genre LIKE ?)";
      const q = `%${search}%`;
      params.push(q, q, q);
    }
    if (genre) { sql += " AND genre = ?"; params.push(genre); }

    sql += ` ORDER BY ${sortOrders[sort] || "created_at DESC"}`;
    return DB.query(sql, params);
  }

  /** (e) create buku */
  static async create({ title, author, publisher, year, genre, isbn, description, cover_url, file_url, added_by }) {
    const id = this.generateId();
    await DB.query(
      "INSERT INTO books (id,title,author,publisher,year,genre,isbn,description,cover_url,file_url,added_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      [id, title, author, publisher||null, year||null, genre||"Lainnya",
       isbn||null, description||null, cover_url||null, file_url||null, added_by]
    );
    return this.findById(id);
  }

  /** (e) perbarui data buku */
  static async update(id, { title, author, publisher, year, genre, isbn, description, cover_url, file_url }) {
    await DB.query(
      "UPDATE books SET title=?,author=?,publisher=?,year=?,genre=?,isbn=?,description=?,cover_url=?,file_url=? WHERE id=?",
      [title, author, publisher||null, year||null, genre||"Lainnya",
       isbn||null, description||null, cover_url||null, file_url||null, id]
    );
  }

  /** (e) getGenres */
  static async getGenres() {
    const rows = await DB.query("SELECT DISTINCT genre FROM books ORDER BY genre ASC");
    return rows.map(r => r.genre); // (f) Array map
  }

  /** (e) incrementDownload */
  static async incrementDownload(id) {
    await DB.query("UPDATE books SET download_count = download_count + 1 WHERE id = ?", [id]);
    return this.findById(id);
  }
}

module.exports = BookModel;
