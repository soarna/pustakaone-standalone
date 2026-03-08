/**
 * @fileoverview Inisialisasi database SQLite via sql.js
 * @module config/initDb
 */
"use strict";
const DB     = require("./db");
const bcrypt = require("bcryptjs");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id         TEXT     PRIMARY KEY,
  name       TEXT     NOT NULL,
  email      TEXT     NOT NULL UNIQUE,
  password   TEXT     NOT NULL,
  role       TEXT     NOT NULL DEFAULT 'user'
             CHECK(role IN ('user','librarian')),
  staff_id   TEXT,
  created_at TEXT     NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT     NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS books (
  id             TEXT     PRIMARY KEY,
  title          TEXT     NOT NULL,
  author         TEXT     NOT NULL,
  publisher      TEXT,
  year           INTEGER,
  genre          TEXT     NOT NULL DEFAULT 'Lainnya',
  isbn           TEXT,
  description    TEXT,
  cover_url      TEXT,
  file_url       TEXT,
  download_count INTEGER  NOT NULL DEFAULT 0,
  added_by       TEXT,
  created_at     TEXT     NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT     NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS wishlist (
  id       INTEGER  PRIMARY KEY AUTOINCREMENT,
  user_id  TEXT     NOT NULL,
  book_id  TEXT     NOT NULL,
  added_at TEXT     NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, book_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT,
  action     TEXT     NOT NULL,
  table_name TEXT     NOT NULL,
  record_id  TEXT,
  created_at TEXT     NOT NULL DEFAULT (datetime('now'))
);
`;

const SEED_BOOKS = [
  ["book_001","Laskar Pelangi","Andrea Hirata","Bentang Pustaka",2005,"Sastra","978-979-1261-57-7","Novel persahabatan anak Belitung penuh semangat.","https://upload.wikimedia.org/wikipedia/en/5/5f/Laskar_Pelangi.jpg","","usr_admin_001"],
  ["book_002","Bumi Manusia","Pramoedya Ananta Toer","Hasta Mitra",1980,"Sastra","978-979-407-090-4","Kisah Minke di era penjajahan Belanda.","https://upload.wikimedia.org/wikipedia/en/0/0c/Bumi_manusia.jpg","","usr_admin_001"],
  ["book_003","Filosofi Teras","Henry Manampiring","Kompas",2018,"Non-Fiksi","978-602-412-405-3","Panduan hidup Stoic untuk dunia yang tidak sempurna.","https://images.gr-assets.com/books/1561254481l/46190686.jpg","","usr_admin_001"],
  ["book_004","Sapiens","Yuval Noah Harari","Alvabet",2014,"Sejarah","978-602-0875-13-6","Riwayat singkat umat manusia dari zaman purba hingga kini.","https://upload.wikimedia.org/wikipedia/en/0/06/%E2%80%99Sapiens_A_Brief_History_of_Humankind%E2%80%99.jpg","","usr_admin_001"],
  ["book_005","Clean Code","Robert C. Martin","Prentice Hall",2008,"Teknologi","978-0-13-235088-4","Panduan menulis kode yang bersih dan terstruktur.","https://m.media-amazon.com/images/I/51E2055ZGUL._SY342_.jpg","https://ia904508.us.archive.org/35/items/clean-code-robert-c.-martin-book_202204/Clean%20Code%20-%20Robert%20C.%20Martin%20Book.pdf","usr_admin_001"],
  ["book_006","Atomic Habits","James Clear","Random House",2018,"Non-Fiksi","978-0-7352-1129-2","Cara kecil membangun perubahan luar biasa.","https://m.media-amazon.com/images/I/81wgcld4wxL._SY425_.jpg","","usr_admin_001"],
  ["book_007","Harry Potter dan Batu Bertuah","J.K. Rowling","Gramedia",1997,"Fiksi","978-979-22-3687-1","Bocah yatim piatu yang ternyata penyihir terkenal.","https://upload.wikimedia.org/wikipedia/en/6/6b/Harry_Potter_and_the_Philosopher%27s_Stone_Book_Cover.jpg","","usr_admin_001"],
  ["book_008","Introduction to Algorithms","Thomas H. Cormen","MIT Press",2009,"Teknologi","978-0-262-03384-8","Referensi komprehensif algoritma dan struktur data.","https://m.media-amazon.com/images/I/61Pgdn8Ys-L._SY425_.jpg","","usr_admin_001"],
  ["book_009","Negeri 5 Menara","Ahmad Fuadi","Gramedia",2009,"Sastra","978-979-22-4940-6","Kisah santri yang bermimpi menggapai dunia.","https://images-na.ssl-images-amazon.com/images/I/51MFdNT3pXL.jpg","","usr_admin_001"],
  ["book_010","The Psychology of Money","Morgan Housel","Harriman House",2020,"Non-Fiksi","978-0-857-19776-9","Pelajaran tentang cara berpikir tentang uang.","https://m.media-amazon.com/images/I/71g2ednj0JL._SY425_.jpg","","usr_admin_001"],
  ["book_011","Dilan 1990","Pidi Baiq","Pastel Books",2014,"Fiksi","978-602-8-87225-9","Kisah cinta remaja di Bandung tahun 1990.","https://images-na.ssl-images-amazon.com/images/I/81bsRFPorGL.jpg","","usr_admin_001"],
  ["book_012","Sejarah Peradaban Islam","Badri Yatim","Rajawali Pers",2014,"Sejarah","978-979-769-390-3","Kajian perkembangan peradaban Islam dari masa Nabi.","https://images-na.ssl-images-amazon.com/images/I/41Z7TNF6oWL.jpg","","usr_admin_001"],
];

async function initDb() {
  // Jalankan schema
  DB.getDb().run(SCHEMA);
  DB.save();

  // Cek apakah data awal sudah ada
  const rows = await DB.query("SELECT id FROM users WHERE id = ?", ["usr_admin_001"]);
  if (rows.length > 0) return; // sudah ada, skip

  console.log("[DB] Membuat data awal...");

  // Buat akun pustakawan default
  const hash = await bcrypt.hash("admin123", 10);
  await DB.query(
    "INSERT OR IGNORE INTO users (id,name,email,password,role,staff_id) VALUES (?,?,?,?,?,?)",
    ["usr_admin_001","Admin Pustakawan","admin@pustakaone.com",hash,"librarian","STAFF_ADMIN_001"]
  );

  // Seed buku
  for (const b of SEED_BOOKS) {
    await DB.query(
      "INSERT OR IGNORE INTO books (id,title,author,publisher,year,genre,isbn,description,cover_url,file_url,added_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      b
    );
  }

  console.log("[DB] Data awal berhasil dibuat.");
  console.log("[DB] Login: admin@pustakaone.com / admin123");
}

module.exports = { initDb };
