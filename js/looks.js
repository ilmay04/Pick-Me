/* looks.js — shared look-card renderer for recent + favorites pages */
function pmLookCard(look, opts) {
  opts = opts || {};
  const favActive = PM.isFavorite(look.id);
  const swatches = (look.palette || [])
    .map((hex) => `<span style="background:${hex}"></span>`)
    .join("");
  const time = opts.time ? `<span class="badge">${opts.time}</span>` : "";

  const favBtn = `<button class="icon-btn ${favActive ? "danger" : ""}" data-fav="${look.id}">${
    favActive ? "❤️ Remove" : "🤍 Save"
  }</button>`;
  const removeBtn = opts.removable
    ? `<button class="icon-btn danger" data-remove="${look.id}">🗑 Remove</button>`
    : "";
  const useBtn = `<button class="icon-btn" data-use="${look.id}">👁 View on dashboard</button>`;

  return `
  <article class="glass look-card reveal" data-id="${look.id}">
    <div class="look-top">
      <div>
        <h3>${look.occasion} Look</h3>
        <div class="look-meta">
          <span class="badge">${look.personality}</span>
          <span class="badge">Style ${look.styleScore}</span>
          <span class="badge">${look.paletteName}</span>
          ${time}
        </div>
      </div>
    </div>
    <ul>
      <li><span>Outfit:</span> ${look.outfit}</li>
      <li><span>Accessories:</span> ${look.accessories}</li>
      <li><span>Footwear:</span> ${look.footwear}</li>
      <li><span>Makeup:</span> ${look.makeup}</li>
      <li><span>Hair:</span> ${look.hairstyle}</li>
    </ul>
    <div class="mini-swatches">${swatches}</div>
    <div class="look-actions">${favBtn}${useBtn}${removeBtn}</div>
  </article>`;
}

/* Wire common look-card actions inside a container */
function pmWireLookActions(container, onChange) {
  container.addEventListener("click", (e) => {
    const favEl = e.target.closest("[data-fav]");
    const useEl = e.target.closest("[data-use]");
    const rmEl = e.target.closest("[data-remove]");

    if (favEl) {
      const id = favEl.dataset.fav;
      const all = PM.getRecent().concat(PM.getFavorites());
      const look = all.find((l) => l.id === id);
      if (look) {
        PM.toggleFavorite(look);
        pmToast(PM.isFavorite(id) ? "Added to favorites ❤️" : "Removed from favorites");
        if (onChange) onChange();
      }
    } else if (rmEl) {
      PM.removeFavorite(rmEl.dataset.remove);
      pmToast("Removed from favorites");
      if (onChange) onChange();
    } else if (useEl) {
      const id = useEl.dataset.use;
      const all = PM.getRecent().concat(PM.getFavorites());
      const look = all.find((l) => l.id === id);
      if (look) {
        PM.setCurrentLook(look);
        window.location.href = "dashboard.html";
      }
    }
  });
}
