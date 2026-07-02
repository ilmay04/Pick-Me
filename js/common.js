/* ============================================================
   common.js — shared navbar behavior across all pages.
   - highlights active link
   - hamburger menu toggle
   - theme toggle wiring
   - shows/hides auth-only links + login/logout
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  if (window.pmInitThemeIcon) window.pmInitThemeIcon();

  // Theme toggle buttons
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => window.pmToggleTheme());
  });

  // Hamburger
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("open"))
    );
  }

  // Active link highlight
  const page = (location.pathname.split("/").pop() || "index.html");
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === page) a.classList.add("active");
  });

  // Auth-aware nav
  const loggedIn = window.PM && PM.isLoggedIn();
  document.querySelectorAll("[data-auth-only]").forEach((el) => {
    el.classList.toggle("hidden", !loggedIn);
  });
  document.querySelectorAll("[data-guest-only]").forEach((el) => {
    el.classList.toggle("hidden", !!loggedIn);
  });

  // Logout buttons
  document.querySelectorAll("[data-logout]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      PM.logout();
      window.location.href = "index.html";
    });
  });

  // Greet user where requested
  const user = window.PM && PM.getUser();
  if (user) {
    document.querySelectorAll("[data-user-name]").forEach((el) => {
      el.textContent = user.name || user.username;
    });
  }
});
