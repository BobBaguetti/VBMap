// @file: src/modules/sidebar/filters/chestFilters.js
// @version: 1.2 — swap chest icons to Phosphor

export function setupChestFilters(containerSelector, onChange) {
  const iconMap = {
    Small:       "fas fa-box",          // you can leave these or pick Phosphor
    Medium:      "fas fa-box",
    Large:       "fas fa-box",
    Dragonvault: "fas fa-dragon",
    Normal:      "fas fa-box"
  };

  // override just the “Small/Medium/Large/Normal” if you like,
  // but here we’ll swap the generic chest icon in the Main group only
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
      <i class="filter-icon ${o.key === "Dragonvault"
           ? iconMap[o.key]
           : "ph-regular ph-chest"}"></i>
      <span>${o.lbl}</span>
    `;
    container.appendChild(lbl);
    lbl.querySelector("input").addEventListener("change", onChange);
  });
}
