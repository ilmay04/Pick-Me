/* dashboard.js — render current look, warnings, personality, actions */
document.addEventListener("DOMContentLoaded", function () {
  if (!PM.requireAuth()) return;

  const prefs = PM.getPrefs();
  if (!prefs) {
    // no preferences yet → send to profile onboarding
    window.location.href = "profile.html";
    return;
  }

  let current = PM.getCurrentLook();

  function render(look) {
    current = look;
    PM.setCurrentLook(look);

    document.getElementById("occLabel").textContent = look.occasion;
    document.getElementById("persTag").textContent = look.personality;

    // Style score ring
    const ring = document.getElementById("scoreRing");
    document.getElementById("scoreVal").textContent = look.styleScore;
    requestAnimationFrame(() => ring.style.setProperty("--val", look.styleScore));

    // Recommendation cards
    const cards = [
      { icon: "👗", label: "Outfit", value: look.outfit },
      { icon: "👜", label: "Accessories", value: look.accessories },
      { icon: "👠", label: "Footwear", value: look.footwear },
      { icon: "💄", label: "Makeup", value: look.makeup },
      { icon: "💇", label: "Hairstyle", value: look.hairstyle },
    ];
    const grid = document.getElementById("recGrid");
    grid.innerHTML = cards
      .map(
        (c) => `
      <div class="glass rec-card reveal">
        <div class="rec-icon">${c.icon}</div>
        <div class="rec-label">${c.label}</div>
        <p style="color:var(--text);font-weight:600;margin-top:4px">${c.value}</p>
      </div>`
      )
      .join("");

    // Palette card appended
    const swatches = look.palette
      .map((hex) => `<div class="sw" style="background:${hex}"><span>${hex}</span></div>`)
      .join("");
    grid.innerHTML += `
      <div class="glass rec-card reveal" style="grid-column: span 1;">
        <div class="rec-icon">🎨</div>
        <div class="rec-label">Color Palette · ${look.paletteName}</div>
        <div class="palette-swatches">${swatches}</div>
      </div>`;

    // Warnings
    const warnBox = document.getElementById("warnings");
    if (look.warnings.length) {
      warnBox.innerHTML = look.warnings
        .map((w) => `<div class="warn"><span class="wicon">⚠️</span><p>${w}</p></div>`)
        .join("");
    } else {
      warnBox.innerHTML =
        '<div class="warn ok"><span class="wicon">✅</span><p>No styling conflicts detected — this look is well balanced!</p></div>';
    }

    // Personality bars
    const bars = Object.entries(look.personalityScores).sort((a, b) => b[1] - a[1]);
    document.getElementById("persBars").innerHTML = bars
      .map(
        ([name, val]) => `
      <div class="pbar-row">
        <span>${name}</span>
        <div class="pbar-track"><div class="pbar-fill" data-w="${val}"></div></div>
        <span class="pbar-val">${val}%</span>
      </div>`
      )
      .join("");
    requestAnimationFrame(() =>
      document.querySelectorAll(".pbar-fill").forEach((f) => (f.style.width = f.dataset.w + "%"))
    );

    updateFavBtn();
  }

  function updateFavBtn() {
    const btn = document.getElementById("favBtn");
    const isFav = PM.isFavorite(current.id);
    btn.classList.toggle("active", isFav);
    btn.innerHTML = isFav ? "❤️ Saved to Favorites" : "🤍 Save Favorite";
  }

  // Generate initial look if none stored
  if (!current) {
    current = ENGINE.recommend(prefs);
    PM.pushRecent(current);
  }
  render(current);

  // Regenerate — salt changes the deterministic seed for variety
  document.getElementById("regenBtn").addEventListener("click", () => {
    const look = ENGINE.recommend({ ...prefs, _salt: String(Date.now()) });
    PM.pushRecent(look);
    render(look);
    pmToast("Fresh look generated!");
  });

  // Save favorite
  document.getElementById("favBtn").addEventListener("click", () => {
    PM.toggleFavorite(current);
    updateFavBtn();
    pmToast(PM.isFavorite(current.id) ? "Added to favorites ❤️" : "Removed from favorites");
  });
});
