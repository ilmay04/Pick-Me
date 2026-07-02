/* ============================================================
   theme.js — dark / light mode toggle (persisted in localStorage)
   Loaded early to avoid flash of wrong theme.
   ============================================================ */
(function () {
  const KEY = "pm_theme";
  const stored = localStorage.getItem(KEY);
  const prefersDark = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = stored ? JSON.parse(stored) : (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);

  window.pmToggleTheme = function () {
    const next =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(KEY, JSON.stringify(next));
    document.querySelectorAll("[data-theme-icon]").forEach((el) => {
      el.textContent = next === "dark" ? "☀️" : "🌙";
    });
  };

  window.pmInitThemeIcon = function () {
    const cur = document.documentElement.getAttribute("data-theme");
    document.querySelectorAll("[data-theme-icon]").forEach((el) => {
      el.textContent = cur === "dark" ? "☀️" : "🌙";
    });
  };
})();
