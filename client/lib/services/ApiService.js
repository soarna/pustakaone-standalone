/**
 * @fileoverview (i) package: services
 * @module services/ApiService
 */
"use strict";

/**
 * BaseRequest
 * (h) Interface simulasi
 */
class BaseRequest {

  // (h) Interface — wajib di-override
  static get baseUrl() { throw new Error(`${this.name}: baseUrl wajib diimplementasi`); }


  static async send(url, opt = {}) {
    try {
      const tok     = this.getToken();
      const headers = { "Content-Type": "application/json" };
      if (tok) headers["Authorization"] = `Bearer ${tok}`; // (d) if
      const res  = await fetch(this.baseUrl + url, {
        ...opt,
        headers : { ...headers, ...opt.headers },
        body    : opt.body ? JSON.stringify(opt.body) : undefined,
      });
      const data = await res.json();
      if (res.status === 403) { this.removeToken(); location.reload(); }
      return { ok: res.ok, ...data };
    } catch { return { ok: false, success: false, message: "Tidak dapat terhubung ke server." }; }
  }

  /**
   * (e) sendForm — kirim FormData (upload file)
   */
  static async sendForm(url, fd) {
    try {
      const tok     = this.getToken();
      const headers = tok ? { Authorization: `Bearer ${tok}` } : {};
      const res     = await fetch(this.baseUrl + url, { method: "POST", headers, body: fd });
      const data    = await res.json();
      return { ok: res.ok, ...data };
    } catch { return { ok: false, success: false, message: "Tidak dapat terhubung ke server." }; }
  }
  // (g) sessionStorage browser
  static getToken()    { return sessionStorage.getItem("pustakaone_token"); }
  static setToken(t)   { sessionStorage.setItem("pustakaone_token", t); }
  static removeToken() { sessionStorage.removeItem("pustakaone_token"); }
}


class ApiService extends BaseRequest {

  // (h) Override property baseUrl
  static get baseUrl() { return window.location.origin + "/api"; }

  // Auth 
  static login(email, pass)          { return this.send("/auth/login",    { method: "POST", body: { email, password: pass } }); }
  static register(name, email, pass) { return this.send("/auth/register", { method: "POST", body: { name, email, password: pass } }); }
  static getMe()                     { return this.send("/auth/me"); }
  static updateProfile(name, pass)   { return this.send("/auth/profile",  { method: "PUT",  body: { name, password: pass } }); }

  // Buku (h) Overloading: getBooks vs getBookById, send vs sendForm
  static getBooks(p = {}) {
    const q = new URLSearchParams(p).toString(); // (j) URLSearchParams
    return this.send(`/books${q ? "?" + q : ""}`);
  }
  static getBookById(id)    { return this.send("/books/" + id); }
  static getGenres()        { return this.send("/books/genres"); }
  static addBook(payload)        { return this.send("/books",       { method: "POST", body: payload }); }
  static updateBook(id, payload) { return this.send("/books/" + id, { method: "PUT",  body: payload }); }
  static uploadCover(fd)         { return this.sendForm("/books/upload-cover", fd); }
  static deleteBook(id)     { return this.send("/books/" + id, { method: "DELETE" }); }
  static downloadBook(id)   { return this.send("/books/" + id + "/download", { method: "POST" }); }

  // Pengguna
  static getUsers()     { return this.send("/users"); }
  static deleteUser(id) { return this.send("/users/" + id, { method: "DELETE" }); }

  // Wishlist 
  static getWishlist()      { return this.send("/users/wishlist/my"); }
  static getWishlistIds()   { return this.send("/users/wishlist/ids"); }
  static toggleWishlist(id) { return this.send("/users/wishlist/" + id, { method: "POST" }); }
}
