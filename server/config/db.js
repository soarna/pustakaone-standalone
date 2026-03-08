/**
 * @fileoverview Database — sql.js (Pure JS SQLite, zero native deps)
 * Handles wasm loading correctly when bundled with pkg.
 */
"use strict";
const path = require("path");
const fs   = require("fs");
const os   = require("os");

function getDbPath() {
  if (process.pkg) {
    return path.join(path.dirname(process.execPath), "pustakaone.db");
  }
  return path.join(__dirname, "../../pustakaone.db");
}

class DB {
  static _db     = null;
  static _SQL    = null;
  static _dbPath = null;

  static async init() {
    if (DB._db) return DB._db;

    const initSqlJs = require("sql.js");

    let sqlOpts = {};

    if (process.pkg) {
      // Saat dibundle pkg, baca .wasm langsung dari snapshot sebagai Buffer
      // lalu pass sebagai wasmBinary agar tidak perlu fetch/locate file
      try {
        const wasmPath = path.join(
          path.dirname(require.resolve("sql.js")),
          "sql-wasm.wasm"
        );
        const wasmBinary = fs.readFileSync(wasmPath);
        sqlOpts = { wasmBinary };
      } catch (e) {
        // Fallback: cari di samping exe
        const wasmNear = path.join(path.dirname(process.execPath), "sql-wasm.wasm");
        if (fs.existsSync(wasmNear)) {
          sqlOpts = { wasmBinary: fs.readFileSync(wasmNear) };
        }
      }
    }

    DB._SQL    = await initSqlJs(sqlOpts);
    DB._dbPath = getDbPath();

    let fileBuffer = null;
    if (fs.existsSync(DB._dbPath)) {
      fileBuffer = fs.readFileSync(DB._dbPath);
    }

    DB._db = fileBuffer
      ? new DB._SQL.Database(fileBuffer)
      : new DB._SQL.Database();

    DB._db.run("PRAGMA foreign_keys = ON;");
    return DB._db;
  }

  static save() {
    if (!DB._db || !DB._dbPath) return;
    try {
      const data = DB._db.export();
      fs.writeFileSync(DB._dbPath, Buffer.from(data));
    } catch (e) {
      console.error("[DB] Gagal simpan:", e.message);
    }
  }

  static getDb() {
    if (!DB._db) throw new Error("[DB] Belum diinisialisasi.");
    return DB._db;
  }

  static async query(sql, params = []) {
    const db     = DB.getDb();
    const isRead = /^\s*(SELECT|WITH|PRAGMA)/i.test(sql);
    if (isRead) {
      const stmt = db.prepare(sql);
      const rows = [];
      if (params.length) stmt.bind(params);
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    } else {
      db.run(sql, params);
      DB.save();
      return [];
    }
  }

  static async exec(sqlText) {
    DB.getDb().run(sqlText);
    DB.save();
  }

  static async testConnection() {
    try {
      const rows = await DB.query("SELECT 1 AS ok");
      return rows[0]?.ok === 1;
    } catch (e) {
      console.error("[DB]", e.message);
      return false;
    }
  }
}

module.exports = DB;
