/**
 * @fileoverview (i) package: base 
 * @module base/BaseModel
 */
"use strict";
const DB = require("../config/db");

/**
 * BaseModel
 * (h) Interface tableName, idPrefix, validate wajib di-override.
 * (h) method CRUD inheritance
 */
class BaseModel {

  // (h) override subclass
  static get tableName() { throw new Error(`${this.name}: tableName wajib diimplementasi`); }
  static get idPrefix()  { throw new Error(`${this.name}: idPrefix wajib diimplementasi`); }
  static validate()      { throw new Error(`${this.name}: validate() wajib diimplementasi`); }

  /** (h) Property + (e) Method: generate ID */
  static generateId() {
    return `${this.idPrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }
  /** (e) findAll */
  static async findAll(extraSql = "", params = []) {
    return DB.query(`SELECT * FROM ${this.tableName} ${extraSql}`, params);
  }

  /** (e) findById */
  static async findById(id) {
    const [row] = await DB.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
    return row || null;
  }

  /** (e) deleteById */
  static async deleteById(id) {
    return DB.query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  /** (e) fail */
  static fail(res, code, msg) {
    return res.status(code).json({ success: false, message: msg });
  }
}

module.exports = BaseModel;
