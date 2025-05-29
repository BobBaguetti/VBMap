// @file: src/modules/sidebar/filters/chestFilters.js
// @version: 1.1 — add filter-icon <i> before each chest label

export function setupChestFilters(containerSelector, onChange) {
  const iconMap = {
    Small:       "fa-box",
    Medium:      "fa-box",
    Large:       "fa-box",
    Dragonvault: "fa-dragon",
    Normal:      "fa-box"
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
      <i class="filter-icon fas ${iconMap[o.key]}"></i>
      <span>${o.lbl}</span>
    `;

    container.appendChild(lbl);
    lbl.querySelector("input").addEventListener("change", onChange);
  });
}
