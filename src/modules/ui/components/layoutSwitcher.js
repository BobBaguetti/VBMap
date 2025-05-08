// @version: 1
// @file: /src/modules/ui/components/layoutSwitcher.js

export function createLayoutSwitcher({ available, defaultView, onChange }) {
  const wrapper = document.createElement("div");
  wrapper.className = "layout-switcher";

  available.forEach((layout) => {
    const btn = document.createElement("button");
    btn.textContent = layout;
    btn.className = layout === defaultView ? "active" : "";
    btn.onclick = () => {
      wrapper.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      onChange(layout);
    };
    wrapper.appendChild(btn);
  });

  return wrapper;
}