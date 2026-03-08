/**
 * @fileoverview PustakaOne v2 — Entry Point (Standalone)
 * @module server/index
 */
"use strict";

const path = require("path");
const fs   = require("fs");

/* ------ Tentukan folder uploads (harus writable) ------ */
let UPLOADS_DIR;
if (process.pkg) {
  UPLOADS_DIR = path.join(path.dirname(process.execPath), "uploads");
} else {
  UPLOADS_DIR = path.join(__dirname, "uploads");
}
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
process.env.UPLOAD_DIR = UPLOADS_DIR;

/* ------ Imports ------ */
const express       = require("express");
const DB            = require("./config/db");
const { initDb }    = require("./config/initDb");

const app  = express();
const PORT = process.env.PORT || 3000;

/* ------ Middleware ------ */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------ Static Files ------ */
let CLIENT_DIR;
if (process.pkg) {
  // Coba di samping exe dulu, lalu fallback ke dalam bundle
  const outside = path.join(path.dirname(process.execPath), "client");
  CLIENT_DIR = fs.existsSync(outside) ? outside : path.join(__dirname, "../client");
} else {
  CLIENT_DIR = path.join(__dirname, "../client");
}
app.use(express.static(CLIENT_DIR));
app.use("/uploads", express.static(UPLOADS_DIR));

/* ------ Routes ------ */
app.use("/api/auth",  require("./routes/auth"));
app.use("/api/books", require("./routes/books"));
app.use("/api/users", require("./routes/users"));

app.get("/api/health", async (req, res) => {
  const ok = await DB.testConnection();
  res.json({ status: "ok", db: ok ? "connected" : "error", engine: "SQLite (sql.js)" });
});

app.get("*", (req, res) =>
  res.sendFile(path.join(CLIENT_DIR, "index.html"))
);

/* ------ Buka browser ------ */
function openBrowser(url) {
  const { exec } = require("child_process");
  const cmds = {
    win32:  `start ${url}`,
    darwin: `open ${url}`,
    linux:  `xdg-open ${url}`,
  };
  const cmd = cmds[process.platform] || cmds.linux;
  exec(cmd, (err) => {
    if (err) console.log(`  Buka manual: ${url}`);
  });
}

/* ------ Start ------ */
async function start() {
  console.log("\n========================================");
  console.log("  PustakaOne v2 — Perpustakaan Digital");
  console.log("========================================\n");

  try {
    console.log("[DB] Memulai database SQLite...");
    await DB.init();
    await initDb();
  } catch (err) {
    console.error("[ERROR] Gagal inisialisasi database:", err.message);
    console.error(err.stack);
    console.log("\nTekan Enter untuk keluar...");
    process.stdin.resume();
    process.stdin.once("data", () => process.exit(1));
    return;
  }

  app.listen(PORT, "127.0.0.1", () => {
    const url = `http://localhost:${PORT}`;
    console.log(`\n✓ Server berjalan di ${url}`);
    console.log(`✓ Database : SQLite embedded (tanpa MySQL)`);
    console.log(`\n  Login default:`);
    console.log(`  Email    : admin@pustakaone.com`);
    console.log(`  Password : admin123`);
    console.log(`\n  Browser terbuka otomatis...`);
    console.log(`  (Tutup jendela ini untuk menghentikan)\n`);

    setTimeout(() => openBrowser(url), 1500);
  });
}

start();
