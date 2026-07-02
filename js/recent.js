/* recent.js — render recent looks history */
document.addEventListener("DOMContentLoaded", function () {
  if (!PM.requireAuth()) return;
  const grid = document.getElementById("recentGrid");

  function render() {
    const recent = PM.getRecent();
    if (!recent.length) {
      grid.innerHTML = `
        <div class="empty" style="grid-column:1/-1">
          <span class="emoji">🕑</span>
          <h3>No recent looks yet</h3>
          <p>Generate a look on your dashboard and it'll show up here.</p>
          <a href="dashboard.html" class="btn btn-primary mt-2">Go to Dashboard</a>
        </div>`;
      return;
    }
    grid.innerHTML = recent
      .map((l) => pmLookCard(l, { time: pmTimeAgo(l.viewedAt || l.createdAt) }))
      .join("");
  }

  render();
  pmWireLookActions(grid, render);

  document.getElementById("clearRecent").addEventListener("click", () => {
    PM.clearRecent();
    pmToast("Recent history cleared");
    render();
  });
});
