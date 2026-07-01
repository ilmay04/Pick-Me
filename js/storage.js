/* ============================================================
   storage.js — thin localStorage helpers (client-side only).
   MySQL backend can replace these functions later.
   ============================================================ */

const PM = {
  keys: {
    user: "pm_user",
    prefs: "pm_prefs",
    favorites: "pm_favorites",
    recent: "pm_recent",
    theme: "pm_theme",
    current: "pm_current_look",
  },

  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },

  write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  /* ---- User / auth ---- */
  getUser() { return PM.read(PM.keys.user, null); },
  setUser(user) { PM.write(PM.keys.user, user); },
  isLoggedIn() { return !!PM.getUser(); },
  logout() { PM.remove(PM.keys.user); },

  requireAuth() {
    if (!PM.isLoggedIn()) {
      window.location.href = "auth.html";
      return false;
    }
    return true;
  },

  /* ---- Preferences ---- */
  getPrefs() { return PM.read(PM.keys.prefs, null); },
  setPrefs(prefs) { PM.write(PM.keys.prefs, prefs); },

  /* ---- Favorites ---- */
  getFavorites() { return PM.read(PM.keys.favorites, []); },
  isFavorite(id) { return PM.getFavorites().some((f) => f.id === id); },
  addFavorite(look) {
    const favs = PM.getFavorites();
    if (!favs.some((f) => f.id === look.id)) {
      favs.unshift({ ...look, savedAt: Date.now() });
      PM.write(PM.keys.favorites, favs);
    }
    return favs;
  },
  removeFavorite(id) {
    const favs = PM.getFavorites().filter((f) => f.id !== id);
    PM.write(PM.keys.favorites, favs);
    return favs;
  },
  toggleFavorite(look) {
    return PM.isFavorite(look.id) ? PM.removeFavorite(look.id) : PM.addFavorite(look);
  },

  /* ---- Recent looks (history) ---- */
  getRecent() { return PM.read(PM.keys.recent, []); },
  pushRecent(look) {
    let recent = PM.getRecent().filter((r) => r.id !== look.id);
    recent.unshift({ ...look, viewedAt: Date.now() });
    recent = recent.slice(0, 12); // keep last 12
    PM.write(PM.keys.recent, recent);
    return recent;
  },
  clearRecent() { PM.remove(PM.keys.recent); },

  /* ---- Current look on dashboard ---- */
  getCurrentLook() { return PM.read(PM.keys.current, null); },
  setCurrentLook(look) { PM.write(PM.keys.current, look); },
};

/* Simple toast helper */
function pmToast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add("show"));
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2200);
}

/* Relative time helper */
function pmTimeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}
