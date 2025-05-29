// @file: src/modules/sidebar/filters/chestFilters.js
// @version: 1.2.1 — correct Phosphor class for chests

export function setupChestFilters(containerSelector, onChange) {
  const iconMap = {
    Small:       "ph ph-chest",    // all chest sizes use ph-chest
    Medium:      "ph ph-chest",
    Large:       "ph ph-chest",
    Dragonvault: "fas fa-dragon", // keep FA for Dragonvault if you like
    Normal:      "ph ph-chest"
  };

  const container = document.querySelector(containerSelector);
  if (!container || container.querySelector("input")) return;
  const opts = [
    { lbl: "Small",       filter: "size",     key: "Small" },
    { lbl: "Medium",      filter: "size",     key: "Medium" },
    { lbl: "Large",       filter: "size",     key: "Large" },
    { lbl: "Dragonvault", filter: "category", key: "Dragonvault" },
    { lbl: "Normal",      filter: "category", key: "Normal" }
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
