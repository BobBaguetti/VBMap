// @file: src/modules/ui/components/uiKit/layoutSwitcher.js
// @version: 1.0 — header view‐mode toggles

export function createLayoutSwitcher({
    available   = ["row","stacked","gallery"],
    onChange    = () => {},
    defaultView = "row"
  } = {}) {
    const wrap = document.createElement("div");
    wrap.className = "layout-switcher";
    wrap.style.display = "flex";
    wrap.style.gap     = "4px";
  
    const layouts = {
      row:     { icon:"📄",  label:"Row View"     },
      stacked: { icon:"🧾",  label:"Stacked View" },
      gallery: { icon:"🖼️",  label:"Gallery View" }
    };
  
    available.forEach(name => {
      const btn = document.createElement("button");
      btn.className = "ui-button layout-button";
      btn.title = layouts[name]?.label || name;
      btn.textContent = layouts[name]?.icon || name;
      btn.dataset.layout = name;
      btn.onclick = () => {
        wrap.querySelectorAll(".layout-button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        onChange(name);
      };
      wrap.append(btn);
      if (name === defaultView) btn.classList.add("active");
    });
  
    return wrap;
  }
  