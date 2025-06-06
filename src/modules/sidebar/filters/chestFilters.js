// @file: src/modules/sidebar/filters/chestFilters.js
// @version: 1.2.5 — use ph-fill for package icons and treasure-chest

export function setupChestFilters(containerSelector, onChange) {
  const iconMap = {
    Small:       "ph-fill ph-package",         // fill package
    Medium:      "ph-fill ph-package",
    Large:       "ph-fill ph-package",
    Dragonvault: "fas fa-dragon",              // remains FA
    Normal:      "ph-fill ph-treasure-chest"   // fill treasure-chest
  };

  const container = document.querySelector(containerSelector);
  if (!container || container.querySelector("input")) return;
  const opts = [
    { lbl: "Small",       filter: "size",     key: "Small" },
    { lbl: "Normal",      filter: "category", key: "Normal" },
    { lbl: "Medium",      filter: "size",     key: "Medium" },
    { lbl: "Dragonvault", filter: "category", key: "Dragonvault" },
    { lbl: "Large",       filter: "size",     key: "Large" }
  ];

  opts.forEach(o => {
    const lbl = document.createElement("label");
    lbl.innerHTML = `
      <input
        type="checkbox"
        checked
        data-chest-filter="${o.filter}"
        ${o.filter==="size"     ? `data-chest-size="${o.key}"`     : ""}
        ${o.filter==="category" ? `data-chest-category="${o.key}"` : ""}
      />
      <i class="filter-icon ${iconMap[o.key]}"></i>
      <span>${o.lbl}</span>
    `;
    container.appendChild(lbl);
    lbl.querySelector("input").addEventListener("change", onChange);
  });
}
