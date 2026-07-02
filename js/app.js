const STORAGE_KEYS = {
  theme: "pickMeTheme",
  session: "pickMeSession",
  user: "pickMeUser",
  favorites: "pickMeFavorites",
  recent: "pickMeRecent",
  current: "pickMeCurrentRecommendation"
};

const appState = {
  page: document.body.dataset.page,
  user: readJSON(STORAGE_KEYS.user, null),
  session: readJSON(STORAGE_KEYS.session, { loggedIn: false }),
  currentRecommendation: readJSON(STORAGE_KEYS.current, null)
};

const onboardingSteps = [
  { key: "gender", title: "Choose your gender", options: ["Male", "Female", "Non-binary"] },
  { key: "bodyType", title: "Choose your body type", options: ["Pear", "Apple", "Rectangle", "Hourglass", "Athletic"] },
  { key: "skinTone", title: "Choose your skin tone", options: ["Fair", "Medium", "Wheatish", "Dark"] },
  { key: "occasion", title: "Choose the occasion", options: ["Casual", "College", "Office", "Party", "Wedding", "Date Night", "Festival", "Travel"] },
  { key: "budget", title: "Choose your budget tier", options: ["Under ₹1000", "₹1000-₹3000", "₹3000+"] }
];

const recommendationCatalog = buildRecommendationCatalog();

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  initTheme();
  initNavigation();

  const pageInit = {
    auth: initAuthPage,
    onboarding: initOnboardingPage,
    dashboard: initDashboardPage,
    favorites: initFavoritesPage,
    recent: initRecentPage
  };

  if (pageInit[appState.page]) {
    pageInit[appState.page]();
  }
}

function readJSON(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "light";
  document.documentElement.dataset.theme = savedTheme;
  updateThemeLabels(savedTheme);

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
      updateThemeLabels(nextTheme);
    });
  });
}

function updateThemeLabels(theme) {
  document.querySelectorAll("[data-theme-icon]").forEach((label) => {
    label.textContent = theme === "dark" ? "Light" : "Dark";
  });
}

function initNavigation() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    menu.classList.toggle("is-open");
  });
}

function requireUser() {
  if (!appState.session.loggedIn || !appState.user) {
    window.location.href = "auth.html";
    return null;
  }
  return appState.user;
}

function initAuthPage() {
  const form = document.querySelector("[data-auth-form]");
  const error = document.querySelector("[data-form-error]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const user = {
      name: clean(formData.get("name")),
      username: clean(formData.get("username")),
      gender: formData.get("gender"),
      status: formData.get("status"),
      identity: formData.get("identity"),
      profile: {}
    };

    if (!user.name || user.name.length < 2 || !user.username || user.username.length < 3 || !user.gender || !user.status || !user.identity) {
      error.textContent = "Please complete every field before continuing.";
      return;
    }

    writeJSON(STORAGE_KEYS.user, user);
    writeJSON(STORAGE_KEYS.session, { loggedIn: true, username: user.username });
    window.location.href = "onboarding.html";
  });
}

function initOnboardingPage() {
  const user = requireUser();
  if (!user) return;

  let stepIndex = 0;
  const selections = { gender: user.gender, ...user.profile };
  const form = document.querySelector("[data-onboarding-form]");
  const container = document.querySelector("[data-step-container]");
  const progress = document.querySelector("[data-wizard-progress]");
  const prevButton = document.querySelector("[data-prev-step]");
  const nextButton = document.querySelector("[data-next-step]");
  const finishButton = document.querySelector("[data-finish-step]");
  const error = document.querySelector("[data-form-error]");

  function renderStep() {
    const step = onboardingSteps[stepIndex];
    container.innerHTML = `
      <div class="wizard-step">
        <p class="eyebrow">Step ${stepIndex + 1} of ${onboardingSteps.length}</p>
        <h2>${step.title}</h2>
        <div class="option-grid" role="group" aria-label="${step.title}">
          ${step.options.map((option) => `
            <button class="option-card ${selections[step.key] === option ? "is-selected" : ""}" type="button" data-option="${escapeHTML(option)}">
              ${option}
            </button>
          `).join("")}
        </div>
      </div>
    `;

    progress.style.width = `${((stepIndex + 1) / onboardingSteps.length) * 100}%`;
    prevButton.style.visibility = stepIndex === 0 ? "hidden" : "visible";
    nextButton.hidden = stepIndex === onboardingSteps.length - 1;
    finishButton.hidden = stepIndex !== onboardingSteps.length - 1;
    error.textContent = "";

    container.querySelectorAll("[data-option]").forEach((button) => {
      button.addEventListener("click", () => {
        selections[step.key] = button.dataset.option;
        renderStep();
      });
    });
  }

  prevButton.addEventListener("click", () => {
    stepIndex = Math.max(0, stepIndex - 1);
    renderStep();
  });

  nextButton.addEventListener("click", () => {
    if (!selections[onboardingSteps[stepIndex].key]) {
      error.textContent = "Select one option to continue.";
      return;
    }
    stepIndex = Math.min(onboardingSteps.length - 1, stepIndex + 1);
    renderStep();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const missing = onboardingSteps.find((step) => !selections[step.key]);
    if (missing) {
      error.textContent = `Please complete: ${missing.title}.`;
      return;
    }

    const updatedUser = {
      ...user,
      gender: selections.gender,
      profile: {
        bodyType: selections.bodyType,
        skinTone: selections.skinTone,
        occasion: selections.occasion,
        budget: selections.budget
      }
    };

    writeJSON(STORAGE_KEYS.user, updatedUser);
    localStorage.removeItem(STORAGE_KEYS.current);
    window.location.href = "dashboard.html";
  });

  renderStep();
}

function initDashboardPage() {
  const user = requireUser();
  if (!user) return;

  if (!user.profile || !user.profile.bodyType) {
    window.location.href = "onboarding.html";
    return;
  }

  renderProfilePanel(user);
  if (!appState.currentRecommendation) {
    appState.currentRecommendation = generateRecommendation(user);
    saveCurrentAndRecent(appState.currentRecommendation);
  }
  renderDashboardRecommendation(user, appState.currentRecommendation);

  document.querySelector("[data-generate]").addEventListener("click", () => {
    appState.currentRecommendation = generateRecommendation(user);
    saveCurrentAndRecent(appState.currentRecommendation);
    renderDashboardRecommendation(user, appState.currentRecommendation);
    showToast("Fresh recommendation generated.");
  });

  document.querySelector("[data-save-favorite]").addEventListener("click", () => {
    const favorites = readJSON(STORAGE_KEYS.favorites, []);
    const exists = favorites.some((item) => item.id === appState.currentRecommendation.id);
    if (!exists) {
      favorites.unshift(appState.currentRecommendation);
      writeJSON(STORAGE_KEYS.favorites, favorites);
      showToast("Saved to favorites.");
    } else {
      showToast("This look is already in favorites.");
    }
  });
}

function renderProfilePanel(user) {
  const panel = document.querySelector("[data-profile-panel]");
  const personality = getFashionPersonality(user);
  const styleScore = getStyleScore(user);
  const initials = user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  panel.innerHTML = `
    <div class="profile-top">
      <span class="avatar">${initials}</span>
      <div>
        <p class="eyebrow">Welcome</p>
        <h2>${escapeHTML(user.name)}</h2>
      </div>
    </div>
    <div class="meta-list">
      <span><strong>Username</strong><em>@${escapeHTML(user.username)}</em></span>
      <span><strong>Status</strong><em>${escapeHTML(user.status)}</em></span>
      <span><strong>Identity</strong><em>${escapeHTML(user.identity)}</em></span>
      <span><strong>Occasion</strong><em>${escapeHTML(user.profile.occasion)}</em></span>
    </div>
    <div class="score-list">
      <div class="meter">
        <div class="meter-row"><span>Style Score</span><strong>${styleScore}%</strong></div>
        <progress max="100" value="${styleScore}"></progress>
      </div>
      <div class="meter">
        <div class="meter-row"><span>${personality}</span><strong>${Math.max(72, styleScore - 4)}%</strong></div>
        <progress max="100" value="${Math.max(72, styleScore - 4)}"></progress>
      </div>
    </div>
  `;
}

function renderDashboardRecommendation(user, recommendation) {
  document.querySelector("[data-dashboard-title]").textContent = `${recommendation.personality} edit for ${user.profile.occasion}`;
  renderWarnings(user, recommendation);
  renderRecommendationCards(document.querySelector("[data-recommendation-grid]"), recommendation);
}

function renderWarnings(user, recommendation) {
  const stack = document.querySelector("[data-warning-stack]");
  const warnings = getWarnings(user, recommendation);
  stack.innerHTML = warnings.map((warning) => `<div class="warning">${warning}</div>`).join("");
}

function renderRecommendationCards(container, recommendation) {
  const cards = [
    ["Outfit", recommendation.outfit, recommendation.details],
    ["Makeup", recommendation.makeup, "A finish selected for your skin tone and occasion."],
    ["Accessories", recommendation.accessories, "Balanced accents that support the outfit."],
    ["Footwear", recommendation.footwear, "Comfort and silhouette considered together."],
    ["Hairstyle", recommendation.hair, "A hair direction that completes the look."],
    ["Color Palette", recommendation.palette.join(", "), "Tap into these tones across layers and accents."]
  ];

  container.innerHTML = cards.map(([title, value, detail]) => `
    <article class="glass reco-card">
      <span class="reco-kicker">${title}</span>
      <h3>${escapeHTML(value)}</h3>
      <p>${escapeHTML(detail)}</p>
      ${title === "Color Palette" ? renderPalette(recommendation.colors) : ""}
    </article>
  `).join("");
}

function renderPalette(colors) {
  return `<div class="palette-row">${colors.map((color) => `<span class="palette-swatch" style="background:${color.hex}">${escapeHTML(color.name)}</span>`).join("")}</div>`;
}

function initFavoritesPage() {
  renderSavedCollection({
    key: STORAGE_KEYS.favorites,
    selector: "[data-favorites-grid]",
    emptyTitle: "No favorites yet",
    emptyText: "Generate a dashboard look and save it to build your personal edit.",
    allowRemove: true
  });
}

function initRecentPage() {
  renderSavedCollection({
    key: STORAGE_KEYS.recent,
    selector: "[data-recent-grid]",
    emptyTitle: "No recent looks yet",
    emptyText: "Your generated recommendations will appear here automatically.",
    allowRemove: false
  });
}

function renderSavedCollection({ key, selector, emptyTitle, emptyText, allowRemove }) {
  const grid = document.querySelector(selector);
  const items = readJSON(key, []);

  if (!items.length) {
    grid.innerHTML = `<article class="glass empty-state"><h2>${emptyTitle}</h2><p>${emptyText}</p><a class="btn btn-primary" href="dashboard.html">Open Dashboard</a></article>`;
    return;
  }

  grid.innerHTML = items.map((item) => `
    <article class="glass saved-card">
      <div class="saved-card-head">
        <span class="reco-kicker">${escapeHTML(item.occasion)}</span>
        <strong>${escapeHTML(item.budget)}</strong>
      </div>
      <h3>${escapeHTML(item.outfit)}</h3>
      <p class="saved-meta">${escapeHTML(item.footwear)} · ${escapeHTML(item.accessories)}</p>
      ${renderPalette(item.colors)}
      <div class="saved-actions">
        <button class="btn btn-ghost" type="button" data-view="${item.id}">View</button>
        ${allowRemove ? `<button class="btn btn-ghost" type="button" data-remove="${item.id}">Remove</button>` : ""}
      </div>
    </article>
  `).join("");

  grid.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = items.find((entry) => entry.id === button.dataset.view);
      writeJSON(STORAGE_KEYS.current, item);
      window.location.href = "dashboard.html";
    });
  });

  grid.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = items.filter((entry) => entry.id !== button.dataset.remove);
      writeJSON(key, next);
      renderSavedCollection({ key, selector, emptyTitle, emptyText, allowRemove });
    });
  });
}

function generateRecommendation(user) {
  const profile = user.profile || {};
  const personality = getFashionPersonality(user);
  const preferred = recommendationCatalog.filter((item) => (
    item.occasions.includes(profile.occasion) &&
    item.budgets.includes(profile.budget)
  ));
  const fallback = preferred.length ? preferred : recommendationCatalog;
  const seed = `${user.username}-${profile.bodyType}-${profile.skinTone}-${profile.occasion}-${Date.now()}-${Math.random()}`;
  const index = Math.abs(hashCode(seed)) % fallback.length;
  const picked = fallback[index];

  return {
    ...picked,
    id: `${picked.baseId}-${Date.now()}`,
    personality,
    occasion: profile.occasion,
    budget: profile.budget,
    generatedAt: new Date().toISOString()
  };
}

function saveCurrentAndRecent(recommendation) {
  writeJSON(STORAGE_KEYS.current, recommendation);
  const recent = readJSON(STORAGE_KEYS.recent, []);
  const nextRecent = [recommendation, ...recent.filter((item) => item.baseId !== recommendation.baseId)].slice(0, 18);
  writeJSON(STORAGE_KEYS.recent, nextRecent);
}

function getWarnings(user, recommendation) {
  const profile = user.profile || {};
  const warnings = [];

  if (profile.bodyType === "Apple" && /oversized|boxy/i.test(recommendation.details)) {
    warnings.push("Avoid oversized jackets for an Apple body type; choose gentle structure at the shoulder and a clean vertical line.");
  }
  if (profile.bodyType === "Pear" && /skinny|narrow/i.test(recommendation.details)) {
    warnings.push("For a Pear body type, balance narrow bottoms with a stronger neckline or layered top.");
  }
  if (profile.bodyType === "Rectangle" && /straight/i.test(recommendation.details)) {
    warnings.push("Rectangle body types benefit from waist definition; add a belt or cropped layer.");
  }
  if (profile.skinTone === "Fair" && recommendation.palette.includes("Icy Silver")) {
    warnings.push("Icy silver can wash out fair skin tones; soften it with rose, pearl, or warm blush.");
  }
  if (profile.skinTone === "Dark" && recommendation.palette.includes("Muted Taupe")) {
    warnings.push("Muted taupe may read flat on dark skin tones; add jewel-toned contrast near the face.");
  }
  if (profile.skinTone === "Wheatish" && recommendation.palette.includes("Neon Lime")) {
    warnings.push("Neon lime can overpower wheatish undertones; use it as a small accent only.");
  }

  return warnings.length ? warnings : ["This recommendation is profile-safe: proportions, tones, and occasion are aligned."];
}

function getFashionPersonality(user) {
  const occasion = user.profile?.occasion || "";
  const identity = user.identity || "";
  const map = {
    Wedding: "Royal",
    Festival: "Boho",
    Office: "Classic",
    College: "Streetwear",
    Party: "Elegant",
    "Date Night": "Elegant",
    Travel: "Minimalist",
    Casual: identity === "Influencer" ? "Streetwear" : "Minimalist"
  };
  return map[occasion] || "Classic";
}

function getStyleScore(user) {
  const base = 76;
  const profileBonus = user.profile && Object.keys(user.profile).length * 4;
  const identityBonus = user.identity === "Influencer" ? 6 : 2;
  return Math.min(98, base + profileBonus + identityBonus);
}

function buildRecommendationCatalog() {
  const occasions = ["Casual", "College", "Office", "Party", "Wedding", "Date Night", "Festival", "Travel"];
  const budgets = ["Under ₹1000", "₹1000-₹3000", "₹3000+"];
  const palettes = [
    { names: ["Rosy Brown", "Ivory", "Midnight Green"], hexes: ["#D3968C", "#FFF6F4", "#105666"] },
    { names: ["Emerald", "Champagne", "Soft Black"], hexes: ["#0f6b5f", "#f4dec2", "#171717"] },
    { names: ["Berry", "Pearl", "Charcoal"], hexes: ["#8f3f55", "#f7eee9", "#333a3d"] },
    { names: ["Saffron", "Cocoa", "Cream"], hexes: ["#d89b35", "#5a3b32", "#fff5df"] },
    { names: ["Icy Silver", "Dusty Rose", "Ink"], hexes: ["#bfc7ca", "#c98792", "#102b35"] },
    { names: ["Neon Lime", "Stone", "White"], hexes: ["#b6d934", "#8d8a82", "#ffffff"] },
    { names: ["Muted Taupe", "Copper", "Deep Teal"], hexes: ["#9b8b7e", "#b66a45", "#105666"] }
  ];
  const outfits = [
    ["Tailored co-ord set", "straight lines with a defined waist and polished drape"],
    ["Fluid midi dress", "soft movement with a gently shaped waist"],
    ["Cropped blazer with wide-leg trousers", "structured top volume with elongated legs"],
    ["Linen shirt dress", "easy structure and breathable layers"],
    ["Satin blouse with tapered pants", "light sheen with a clean vertical line"],
    ["Embroidered kurta set", "ornate neckline with balanced proportions"],
    ["Denim jacket with pleated skirt", "boxy layer over soft movement"],
    ["Monochrome jumpsuit", "straight silhouette with statement accessories"],
    ["Wrap top with palazzo pants", "waist focus and flowing lower volume"],
    ["Silk saree-inspired drape", "elevated festive drama with graceful fall"]
  ];
  const makeup = ["Soft rose glow", "Bronzed nude finish", "Berry lip and clean liner", "Dewy peach highlight", "Matte skin with bold kajal"];
  const accessories = ["Rose-gold hoops and slim cuff", "Pearl studs with a structured mini bag", "Layered chains and a sleek watch", "Statement jhumkas with a potli bag", "Minimal silver hoops and a belt"];
  const footwear = ["Block heels", "Pointed flats", "White sneakers", "Strappy sandals", "Polished loafers"];
  const hair = ["Soft waves", "Low sleek bun", "Textured ponytail", "Half-up volume", "Clean side part"];

  return Array.from({ length: 50 }, (_, index) => {
    const outfit = outfits[index % outfits.length];
    const palette = palettes[index % palettes.length];
    return {
      baseId: `look-${index + 1}`,
      outfit: outfit[0],
      details: outfit[1],
      makeup: makeup[index % makeup.length],
      accessories: accessories[index % accessories.length],
      footwear: footwear[index % footwear.length],
      hair: hair[index % hair.length],
      palette: palette.names,
      colors: palette.names.map((name, colorIndex) => ({ name, hex: palette.hexes[colorIndex] })),
      occasions: [occasions[index % occasions.length], occasions[(index + 3) % occasions.length]],
      budgets: [budgets[index % budgets.length], budgets[(index + 1) % budgets.length]]
    };
  });
}

function clean(value) {
  return String(value || "").trim();
}

function hashCode(value) {
  return value.split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function escapeHTML(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 220);
  }, 2200);
}
