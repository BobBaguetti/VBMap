// @file: src/modules/sidebar/filters/chestFilters.js
// @version: 1.3 — use correct Phosphor class for treasure chest

export function setupChestFilters(containerSelector, onChange) {
  const iconMap = {
    Small:       "fas fa-box",             // keep FA for generic sizes
    Medium:      "fas fa-box",
    Large:       "fas fa-box",
    Dragonvault: "fas fa-dragon",
    Normal:      "fas fa-box"
  };

  // Use Phosphor regular weight for all chest types
  ["Small", "Medium", "Large", "Normal", "Dragonvault"].forEach(key => {
    iconMap[key] = "ph-regular ph-treasure-chest";
  });

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
