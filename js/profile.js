/* profile.js — user summary + preference onboarding form */
document.addEventListener("DOMContentLoaded", function () {
  if (!PM.requireAuth()) return;

  const user = PM.getUser();
  // Fill account summary
  document.getElementById("sumUsername").textContent = "@" + (user.username || "user");
  document.getElementById("sumGender").textContent = user.gender || "—";
  document.getElementById("sumStatus").textContent = user.status || "—";
  document.getElementById("sumIdentity").textContent = user.identity || "—";

  // Avatar picker
  const avatar = document.getElementById("avatar");
  if (user.avatar) avatar.textContent = user.avatar;
  document.getElementById("avatarOptions").addEventListener("click", (e) => {
    const opt = e.target.closest("[data-a]");
    if (!opt) return;
    avatar.textContent = opt.dataset.a;
    document.querySelectorAll("#avatarOptions span").forEach((s) => s.classList.remove("active"));
    opt.classList.add("active");
    PM.setUser({ ...PM.getUser(), avatar: opt.dataset.a });
  });

  // Render chip groups from engine options
  const groups = {
    gender: "pGender", bodyType: "pBody", skinTone: "pSkin",
    occasion: "pOccasion", budget: "pBudget",
  };
  const prefs = PM.getPrefs() || {};
  // default gender from account
  if (!prefs.gender && user.gender) prefs.gender = user.gender;

  Object.entries(groups).forEach(([key, id]) => {
    const el = document.getElementById(id);
    ENGINE.OPTIONS[key].forEach((val) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.dataset.value = val;
      chip.textContent = val;
      if (prefs[key] === val) { chip.classList.add("selected"); el.dataset.value = val; }
      el.appendChild(chip);
    });
  });

  function updateProgress() {
    const filled = Object.keys(groups).filter((k) => {
      const el = document.getElementById(groups[k]);
      return !!el.dataset.value;
    }).length;
    document.getElementById("stepBar").style.width =
      Math.round((filled / Object.keys(groups).length) * 100) + "%";
  }
  updateProgress();

  // Single-select behavior
  document.querySelectorAll(".chips[data-single]").forEach((group) => {
    group.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      group.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
      group.dataset.value = chip.dataset.value;
      updateProgress();
    });
  });

  // Submit
  document.getElementById("prefForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const collected = {};
    let missing = [];
    Object.entries(groups).forEach(([key, id]) => {
      const val = document.getElementById(id).dataset.value;
      if (!val) missing.push(key);
      collected[key] = val;
    });
    if (missing.length) {
      pmToast("Please complete all preferences to continue");
      return;
    }
    PM.setPrefs(collected);
    // generate + store current look, push to recent
    const look = ENGINE.recommend(collected);
    PM.setCurrentLook(look);
    PM.pushRecent(look);
    pmToast("Profile saved! Generating your look…");
    setTimeout(() => (window.location.href = "dashboard.html"), 800);
  });
});
