/* auth.js — login / signup handling with localStorage (MySQL later) */
document.addEventListener("DOMContentLoaded", function () {
  // If already logged in, skip to dashboard
  if (PM.isLoggedIn()) {
    window.location.href = "dashboard.html";
    return;
  }

  const tabs = document.querySelectorAll(".auth-tab");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  function show(tab) {
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    loginForm.classList.toggle("hidden", tab !== "login");
    signupForm.classList.toggle("hidden", tab !== "signup");
  }
  tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.tab)));
  document.querySelectorAll("[data-goto]").forEach((a) =>
    a.addEventListener("click", (e) => { e.preventDefault(); show(a.dataset.goto); })
  );

  // Single-select chip groups
  document.querySelectorAll(".chips[data-single]").forEach((group) => {
    group.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      group.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
      group.dataset.value = chip.dataset.value;
    });
  });

  // Login: username must match an existing account (or create-on-login fallback)
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = loginForm.username.value.trim();
    if (!username) return;
    const existing = PM.getUser();
    if (existing && existing.username.toLowerCase() === username.toLowerCase()) {
      pmToast(`Welcome back, ${existing.name || existing.username}!`);
    } else {
      // No server yet — treat as returning user by username
      PM.setUser({ ...(existing || {}), username, name: existing?.name || username, createdAt: Date.now() });
      pmToast(`Logged in as ${username}`);
    }
    setTimeout(() => (window.location.href = PM.getPrefs() ? "dashboard.html" : "profile.html"), 700);
  });

  // Signup
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    const status = document.getElementById("suStatus").dataset.value;
    const identity = document.getElementById("suIdentity").dataset.value;

    [signupForm.name, signupForm.username, signupForm.gender].forEach((input) => {
      const field = input.closest(".field");
      const valid = !!input.value.trim();
      field.classList.toggle("invalid", !valid);
      if (!valid) ok = false;
    });
    if (!status) { pmToast("Please select your status"); ok = false; }
    if (!identity) { pmToast("Please select your identity type"); ok = false; }
    if (!ok) return;

    const user = {
      name: signupForm.name.value.trim(),
      username: signupForm.username.value.trim(),
      gender: signupForm.gender.value,
      status,
      identity,
      createdAt: Date.now(),
    };
    PM.setUser(user);
    pmToast("Account created! Let's build your style profile.");
    setTimeout(() => (window.location.href = "profile.html"), 800);
  });
});
