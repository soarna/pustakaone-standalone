/**
 * @fileoverview (i) package: ui 
 * @module ui/App
 */
"use strict";

class App extends BaseComponent {

  static currentUser = null; // (d) object
  static wishlistIds = [];   // (f) Array

  // (h) override render()
  static render() { App.navigateTo("dashboard"); }

  /** (e) init — cek token */
  static async init() {
    const token = ApiService.getToken();
    if (token) { // (d) if
      const res = await ApiService.getMe();
      if (res?.success) { App.currentUser = res.user; await App.showApp(); return; }
      ApiService.removeToken();
    }
    App.showAuth();
  }

  static showAuth() {
    document.getElementById("auth-page").classList.remove("hidden");
    document.getElementById("app-page").classList.add("hidden");
  }

  static async showApp() {
    document.getElementById("auth-page").classList.add("hidden");
    document.getElementById("app-page").classList.remove("hidden");
    if (App.currentUser.role === "user") { // (d) if
      const r = await ApiService.getWishlistIds();
      App.wishlistIds = r.success ? r.ids : []; // (f) Array
    }
    App.buildSidebar();
    App.navigateTo("dashboard");
  }

  /** (e) buildSidebar */
  static buildSidebar() {
    const u     = App.currentUser;
    const isLib = u.role === "librarian"; // (d) boolean
    document.getElementById("sb-avatar").textContent = u.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    document.getElementById("sb-name").textContent   = u.name;
    document.getElementById("sb-role").textContent   = isLib ? "Pustakawan" : "Pengguna";
    document.getElementById("net-info").textContent  = `Terhubung — ${u.name}`;

    // (f) Array menu 
    const items = [
      { view: "dashboard",    label: "Dashboard",       show: true   },
      { view: "catalog",      label: "Katalog Buku",    show: true   },
      { view: "manage-books", label: "Kelola Buku",     show: isLib  },
      { view: "manage-users", label: "Kelola Pengguna", show: isLib  },
      { view: "wishlist",     label: "Daftar Saya",     show: !isLib },
      { view: "profile",      label: "Profil Saya",     show: true   },
    ];
    let nav = `<div class="nav-section">Menu</div>`;
    items.forEach(item => { // (d) forEach
      if (item.show) nav += `<div class="nav-item" data-view="${item.view}" onclick="App.navigateTo('${item.view}')">${item.label}</div>`; // (d) if
    });
    document.getElementById("sidebar-nav").innerHTML = nav;
  }

  /** (e) navigateTo */
  static navigateTo(viewId) {
    document.querySelectorAll(".view").forEach(v    => v.classList.remove("active")); // (d) forEach
    document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.view === viewId));
    document.getElementById("view-" + viewId)?.classList.add("active");
    // (d) object lookup
    const views = { dashboard: App.renderDashboard, catalog: App.renderCatalog, wishlist: App.renderWishlist, "manage-books": App.renderManageBooks, "manage-users": App.renderManageUsers, profile: App.renderProfile };
    views[viewId]?.();
  }

  // ===== RENDER =====

  static async renderDashboard() {
    document.getElementById("topbar-title").textContent = "Dashboard";
    const r = await ApiService.getBooks({ sort: "newest" });
    document.getElementById("recent-books").innerHTML =
      r.success && r.books.length ? r.books.slice(0, 6).map(b => App.cardHtml(b)).join("") : App.emptyHtml("Belum ada buku"); // (f) slice, map
  }

  static async renderCatalog() {
    document.getElementById("topbar-title").textContent = "Katalog Buku";
    const genre = document.getElementById("filter-genre").value;
    const sort  = document.getElementById("filter-sort").value;
    const gr    = await ApiService.getGenres();
    if (gr.success)
      document.getElementById("filter-genre").innerHTML = `<option value="">Semua Genre</option>` +
        gr.genres.map(g => `<option value="${g}"${g === genre ? " selected" : ""}>${g}</option>`).join(""); // (f) map
    const r = await ApiService.getBooks(genre ? { sort, genre } : { sort });
    document.getElementById("catalog-books").innerHTML =
      r.success && r.books.length ? r.books.map(b => App.cardHtml(b)).join("") : App.emptyHtml("Tidak ada buku"); // (f) map
  }

  static async renderWishlist() {
    document.getElementById("topbar-title").textContent = "Daftar Buku Saya";
    const r = await ApiService.getWishlist();
    document.getElementById("wishlist-books").innerHTML =
      r.success && r.books.length ? r.books.map(b => App.cardHtml(b)).join("") : App.emptyHtml("Belum ada buku disimpan");
  }

  static async renderManageBooks() {
    document.getElementById("topbar-title").textContent = "Kelola Buku";
    const r = await ApiService.getBooks();
    document.getElementById("manage-books-body").innerHTML = r.success && r.books.length
      ? r.books.map(b => `<tr>
          <td>${b.cover_url ? `<img src="${b.cover_url}" style="width:38px;height:54px;object-fit:cover;border-radius:3px" onerror="this.style.display='none'">` : ""}</td>
          <td><strong>${b.title}</strong></td><td>${b.author}</td>
          <td><span class="badge badge-genre">${b.genre}</span></td>
          <td>${b.year || ""}</td><td>${b.file_url ? "Ya" : "-"}</td>
          <td style="display:flex;gap:5px;padding:8px 12px">
            <button class="btn btn-sm btn-outline" onclick="App.openEditBook('${b.id}')">Edit</button>
            <button class="btn btn-sm btn-danger"  onclick="App.confirmDelete('${b.id}','book')">Hapus</button>
          </td></tr>`).join("")
      : `<tr><td colspan="7" style="text-align:center;padding:40px;color:#aaa">Belum ada buku.</td></tr>`; // (f) map
  }

  static async renderManageUsers() {
    document.getElementById("topbar-title").textContent = "Kelola Pengguna";
    const r = await ApiService.getUsers();
    document.getElementById("users-body").innerHTML = r.success
      ? r.users.map(u => `<tr>
          <td><strong>${u.name}</strong></td><td>${u.email}</td>
          <td><span class="badge ${u.role === "librarian" ? "badge-librarian" : "badge-user"}">${u.role === "librarian" ? "Pustakawan" : "Pengguna"}</span></td>
          <td>${new Date(u.created_at).toLocaleDateString("id-ID")}</td>
          <td>${u.id === App.currentUser.id ? `<span style="font-size:12px;color:#aaa">Anda</span>` : `<button class="btn btn-sm btn-danger" onclick="App.confirmDelete('${u.id}','user')">Hapus</button>`}</td>
        </tr>`).join("") : ""; // (f) map
  }

  static renderProfile() {
    document.getElementById("topbar-title").textContent = "Profil Saya";
    const u = App.currentUser;
    document.getElementById("prof-avatar").textContent = u.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    document.getElementById("prof-name").textContent   = u.name;
    document.getElementById("prof-email").textContent  = u.email;
    const badge = document.getElementById("prof-role-badge");
    badge.textContent = u.role === "librarian" ? "Pustakawan" : "Pengguna";
    badge.className   = "badge " + (u.role === "librarian" ? "badge-librarian" : "badge-user");
    document.getElementById("edit-name").value     = u.name;
    document.getElementById("edit-password").value = "";
  }

  static async saveProfile() {
    const name = document.getElementById("edit-name").value.trim();
    const pass = document.getElementById("edit-password").value;
    if (!name) return alert("Nama tidak boleh kosong"); // (d) if
    if (pass && pass.length < 5) return alert("Kata sandi minimal 5 karakter");
    const r = await ApiService.updateProfile(name, pass || undefined);
    if (r.success) { App.currentUser.name = name; App.buildSidebar(); App.renderProfile(); alert("Profil diperbarui"); }
    else alert(r.message);
  }

  // ===== MODAL BUKU =====

  static openAddBook() {
    document.getElementById("modal-book-title").textContent = "Tambah Buku Baru";
    document.getElementById("book-edit-id").value = "";
    ["book-f-title","book-f-author","book-f-publisher","book-f-year","book-f-isbn","book-f-desc","book-f-cover","book-f-file"]
      .forEach(id => document.getElementById(id).value = ""); // (f) Array forEach
    document.getElementById("book-f-genre").value      = "Fiksi";
    document.getElementById("book-f-cover-file").value = "";
    document.querySelector('input[name="cover-method"][value="url"]').checked = true;
    App.toggleCoverMethod("url");
    App.openModal("modal-book");
  }

  static async openEditBook(bookId) {
    const r = await ApiService.getBookById(bookId);
    if (!r.success) return;
    const b = r.book;
    document.getElementById("modal-book-title").textContent = "Edit Buku";
    // (f) Array Object.entries forEach
    const fields = { "book-edit-id": b.id, "book-f-title": b.title, "book-f-author": b.author, "book-f-publisher": b.publisher||"", "book-f-year": b.year||"", "book-f-genre": b.genre||"Lainnya", "book-f-isbn": b.isbn||"", "book-f-desc": b.description||"", "book-f-cover": b.cover_url||"", "book-f-file": b.file_url||"" };
    Object.entries(fields).forEach(([id, val]) => document.getElementById(id).value = val);
    document.getElementById("book-f-cover-file").value = "";
    document.querySelector('input[name="cover-method"][value="url"]').checked = true;
    App.toggleCoverMethod("url");
    App.previewCoverUrl(b.cover_url);
    App.openModal("modal-book");
  }

  static previewCoverUrl(url) {
    const wrap = document.getElementById("cover-prev-wrap");
    if (url) { document.getElementById("cover-prev-img").src = url; wrap.style.display = "block"; } // (d) if
    else wrap.style.display = "none";
  }

  /** (e) toggleCoverMethod  */
  static toggleCoverMethod(val) {
    document.getElementById("cover-url-wrap").style.display  = val === "url"  ? "block" : "none"; // (d) if
    document.getElementById("cover-file-wrap").style.display = val === "file" ? "block" : "none";
    document.getElementById("cover-prev-wrap").style.display = "none";
    document.getElementById("cover-prev-img").src = "";
  }

  /** (e) previewCoverFile  */
  static previewCoverFile(input) {
    if (!input.files || !input.files[0]) return; // (d) if
    const url = URL.createObjectURL(input.files[0]); // URL sementara untuk preview
    document.getElementById("cover-prev-img").src = url;
    document.getElementById("cover-prev-wrap").style.display = "block";
  }

  static async saveBook() {
    const title  = document.getElementById("book-f-title").value.trim();
    const author = document.getElementById("book-f-author").value.trim();
    if (!title || !author) return alert("Judul dan penulis wajib diisi!");

    const method    = document.querySelector('input[name="cover-method"]:checked').value;
    const fileInput = document.getElementById("book-f-cover-file");
    let cover_url   = document.getElementById("book-f-cover").value;

    if (method === "file" && fileInput.files && fileInput.files[0]) {
      const fd = new FormData();
      fd.append("coverFile", fileInput.files[0]);
      const up = await ApiService.uploadCover(fd);
      if (!up.success) return alert("Upload sampul gagal: " + up.message);
      cover_url = up.cover_url;
    }

    const payload = {
      title, author,
      publisher   : document.getElementById("book-f-publisher").value,
      year        : document.getElementById("book-f-year").value,
      genre       : document.getElementById("book-f-genre").value,
      isbn        : document.getElementById("book-f-isbn").value,
      description : document.getElementById("book-f-desc").value,
      cover_url,
      file_url    : document.getElementById("book-f-file").value,
    };
    const editId = document.getElementById("book-edit-id").value;
    const r = editId
      ? await ApiService.updateBook(editId, payload)
      : await ApiService.addBook(payload);
    if (r.success) { alert(r.message); App.closeModal("modal-book"); App.renderManageBooks(); }
    else alert(r.message);
  }

  static async confirmDelete(id, type) {
    if (!confirm(`Hapus ${type === "book" ? "buku" : "pengguna"} ini?`)) return; // (d) if
    const r = type === "book" ? await ApiService.deleteBook(id) : await ApiService.deleteUser(id);
    alert(r.message);
    if (r.success) type === "book" ? App.renderManageBooks() : App.renderManageUsers();
  }

  // ===== DETAIL =====

  static async openBookDetail(bookId) {
    const r = await ApiService.getBookById(bookId);
    if (!r.success) return;
    const b    = r.book;
    const inWL = App.wishlistIds.includes(bookId); // (f) includes
    const isU  = App.currentUser.role === "user";
    // (f) Array metadata
    const meta = [
      { label: "Penerbit", val: b.publisher || "-" },
      { label: "Tahun",    val: b.year || "-" },
      { label: "Genre",    val: `<span class="badge badge-genre">${b.genre}</span>` },
      { label: "ISBN",     val: b.isbn || "-" },
      { label: "Unduhan",  val: (b.download_count || 0) + "x" },
    ];
    let actions = `<button class="btn btn-outline" onclick="App.printBook('${b.id}')">Cetak</button>`;
    if (isU) actions += `<button class="btn ${inWL ? "btn-danger" : "btn-success"}" onclick="App.toggleWishlistDetail('${b.id}',this)">${inWL ? "Hapus dari Daftar" : "Tambah ke Daftar"}</button>`;
    if (b.file_url) actions += `<button class="btn btn-gold" onclick="App.downloadBook('${b.id}')">Unduh</button>`;
    document.getElementById("modal-detail-body").innerHTML = `
      <div class="book-detail-cover">${b.cover_url ? `<img src="${b.cover_url}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">` : ""}</div>
      <h2 style="font-size:20px;margin-bottom:4px">${b.title}</h2>
      <p style="color:#7C6A55;font-size:13px;margin-bottom:10px">oleh <strong>${b.author}</strong></p>
      <div class="book-meta">${meta.map(m => `<div class="book-meta-item"><label>${m.label}</label><p>${m.val}</p></div>`).join("")}</div>
      ${b.description ? `<div class="book-desc-box">${b.description}</div>` : ""}
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">${actions}</div>`;
    App.openModal("modal-book-detail");
  }

  static async printBook(bookId) {
    const r = await ApiService.getBookById(bookId);
    if (!r.success) return;
    const b = r.book;
    const w = window.open("", "_blank", "width=680,height=860");
    w.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>${b.title}</title>
      <style>body{font-family:Arial,sans-serif;padding:36px;color:#222;max-width:580px;margin:0 auto}
      h1{font-size:22px;text-align:center}p.sub{text-align:center;color:#666;margin-bottom:16px}
      .cover{text-align:center;margin-bottom:16px}.cover img{width:100px;height:140px;object-fit:cover;border-radius:6px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f9f9f9;padding:14px;border-radius:8px;margin-bottom:14px}
      label{font-size:10px;text-transform:uppercase;color:#999;font-weight:700}p{font-size:13px;margin-top:2px}
      .desc{background:#f5f5f5;border-radius:8px;padding:14px;font-size:13px;line-height:1.7}
      .foot{text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:14px;margin-top:16px}</style></head><body>
      <div class="cover">${b.cover_url ? `<img src="${b.cover_url}">` : ""}</div>
      <h1>${b.title}</h1><p class="sub">oleh ${b.author}</p>
      <div class="grid">
        <div><label>Penerbit</label><p>${b.publisher||"-"}</p></div><div><label>Tahun</label><p>${b.year||"-"}</p></div>
        <div><label>Genre</label><p>${b.genre}</p></div><div><label>ISBN</label><p>${b.isbn||"-"}</p></div>
        <div><label>Unduhan</label><p>${b.download_count||0}x</p></div><div><label>File</label><p>${b.file_url?"Tersedia":"Tidak ada"}</p></div>
      </div>${b.description ? `<div class="desc">${b.description}</div>` : ""}
      <div class="foot">PustakaOne — Dicetak ${new Date().toLocaleDateString("id-ID",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
    </body></html>`);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  }

  // ===== WISHLIST =====

  static async toggleWishlist(bookId, btn) {
    const r = await ApiService.toggleWishlist(bookId);
    if (!r.success) return;
    if (r.added) App.wishlistIds.push(bookId); // (f) push
    else App.wishlistIds = App.wishlistIds.filter(id => id !== bookId); // (f) filter
    btn.className   = "btn btn-sm " + (r.added ? "btn-danger" : "btn-success");
    btn.textContent = r.added ? "Hapus" : "Simpan";
  }

  static async toggleWishlistDetail(bookId, btn) {
    const r = await ApiService.toggleWishlist(bookId);
    if (!r.success) return;
    if (r.added) App.wishlistIds.push(bookId); // (f)
    else App.wishlistIds = App.wishlistIds.filter(id => id !== bookId); // (f)
    btn.className   = "btn " + (r.added ? "btn-danger" : "btn-success");
    btn.textContent = r.added ? "Hapus dari Daftar" : "Tambah ke Daftar";
  }

  static async downloadBook(bookId) {
    const r = await ApiService.downloadBook(bookId);
    if (r.success && r.fileUrl) window.open(r.fileUrl, "_blank");
    else alert("File tidak tersedia");
  }

  static async globalSearch(query) {
    if (!query || query.length < 2) return; // (d) if
    const r = await ApiService.getBooks({ search: query });
    document.getElementById("search-results").innerHTML =
      r.success && r.books.length ? r.books.map(b => App.cardHtml(b)).join("") : App.emptyHtml("Tidak ditemukan"); // (f) map
    App.navigateTo("search");
    document.getElementById("topbar-title").textContent = `Hasil: "${query}"`;
  }

  // ===== HELPER =====

  /** (e) cardHtml */
  static cardHtml(b) {
    const inWL  = App.wishlistIds.includes(b.id); // (f)
    const isU   = App.currentUser.role === "user";
    const cover = b.cover_url
      ? `<img src="${b.cover_url}" alt="${b.title}" onerror="this.style.display='none'">`
      : `<div style="font-size:40px;color:#ccc;display:flex;align-items:center;justify-content:center;height:100%">?</div>`;
    let actions = `<button class="btn btn-sm btn-outline" onclick="App.openBookDetail('${b.id}')">Detail</button>`;
    if (isU)     actions += `<button class="btn btn-sm ${inWL ? "btn-danger" : "btn-success"}" onclick="App.toggleWishlist('${b.id}',this)">${inWL ? "Hapus" : "Simpan"}</button>`;
    if (b.file_url) actions += `<button class="btn btn-sm btn-gold" onclick="App.downloadBook('${b.id}')">Unduh</button>`;
    return `<div class="book-card">
      <div class="book-cover">${cover}</div>
      <div class="book-info"><div class="book-title">${b.title}</div><div class="book-author">${b.author}${b.year ? " · " + b.year : ""}</div><div class="tag-row"><span class="badge badge-genre">${b.genre}</span></div></div>
      <div class="book-actions">${actions}</div></div>`;
  }

  static emptyHtml(msg) { return `<div class="empty-state"><h3>${msg}</h3></div>`; }
  static openModal(id)  { document.getElementById(id).classList.remove("hidden"); }
  static closeModal(id) { document.getElementById(id).classList.add("hidden"); }
}
