/**
 * @fileoverview (i) package: ui 
 * @module ui/ui
 */
"use strict";

class BaseComponent {
  static render() { throw new Error(`${this.name}: render() wajib diimplementasi`); }
}


class UI extends BaseComponent {
  static render() { /* tdk */ }
}

/** (e) switchAuthTab*/
function switchAuthTab(tab) {
  document.querySelectorAll(".auth-tab").forEach((t, i) =>
    t.classList.toggle("active", i === (tab === "login" ? 0 : 1))
  );
  document.getElementById("tab-login").classList.toggle("hidden",    tab !== "login");
  document.getElementById("tab-register").classList.toggle("hidden", tab !== "register");
}

/** (c)(d) login  */
async function login() {
  const email = document.getElementById("login-email").value.trim();
  const pass  = document.getElementById("login-password").value;
  if (!email || !pass) return alert("Isi semua field!"); 
  const btn = document.getElementById("btn-login");
  btn.textContent = "Memproses..."; btn.disabled = true;
  const res = await ApiService.login(email, pass);
  btn.textContent = "Masuk"; btn.disabled = false;
  if (res.success) { 
    ApiService.setToken(res.token);
    App.currentUser = res.user;
    await App.showApp();
  } else {
    alert(res.message || "Login gagal");
  }
}

/** (c)(d) register  */
async function register() {
  const name  = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const pass  = document.getElementById("reg-password").value;
  const btn   = document.getElementById("btn-register");
  btn.textContent = "Memproses..."; btn.disabled = true;
  const res = await ApiService.register(name, email, pass);
  btn.textContent = "Buat Akun"; btn.disabled = false;
  if (res.success) {
    alert(res.message);
    switchAuthTab("login");
    document.getElementById("login-email").value = email;
  } else {
    alert(res.message || "Registrasi gagal");
  }
}

/** (e) logout  */
function logout() {
  ApiService.removeToken();
  App.currentUser = null;
  App.wishlistIds = [];
  App.showAuth();
}
