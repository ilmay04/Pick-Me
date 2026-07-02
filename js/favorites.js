/* favorites.js — render bookmarked looks from localStorage */
document.addEventListener("DOMContentLoaded", function () {
  if (!PM.requireAuth()) return;
  const grid = document.getElementById("favGrid");

  function render() {
    const favs = PM.getFavorites();
    if (!favs.length) {
      grid.innerHTML = `
        <div class="empty" style="grid-column:1/-1">
          <span class="emoji">💔</span>
          <h3>No favorites yet</h3>
          <p>Tap “Save Favorite” on the dashboard to bookmark looks you love.</p>
          <a href="dashboard.html" class="btn btn-primary mt-2">Find a look</a>
        </div>`;
      return;
    }
    grid.innerHTML = favs
      .map((l) => pmLookCard(l, { time: pmTimeAgo(l.savedAt || l.createdAt), removable: true }))
      .join("");
  }

  render();
  pmWireLookActions(grid, render);
});
