// @file: src/modules/sidebar/filters/chestFilters.js
// @version: 1.3 — size‐vary package icons; use ph-chest for Normal

export function setupChestFilters(containerSelector, onChange) {
  const sizeMap = {
    Small:  "14px",
    Medium: "18px",
    Large:  "22px",
    Normal: "18px",
    Dragonvault: "18px"
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

    // choose icon class
    let iconClass;
    if (o.filter === "size") {
      iconClass = "ph ph-package";
    } else {
      // category: Dragonvault gets FA dragon, Normal gets phosphor chest
      iconClass = o.key === "Dragonvault" ? "fas fa-dragon" : "ph ph-chest";
    }

    const iconSize = sizeMap[o.key] || "18px";

    lbl.innerHTML = `
      <input
        type="checkbox"
        checked
        data-chest-filter="${o.filter}"
        ${o.filter==="size"     ? `data-chest-size="${o.key}"`     : ""}
        ${o.filter==="category" ? `data-chest-category="${o.key}"` : ""}
      />
      <i class="filter-icon ${iconClass}" style="font-size:${iconSize};"></i>
      <span>${o.lbl}</span>
    `;
    container.appendChild(lbl);
    lbl.querySelector("input").addEventListener("change", onChange);
  });
}
