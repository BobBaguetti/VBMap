// @file: src/modules/ui/components/definitionModalShell.js
// @version: 5.4 — resilient close-button lookup by text/aria-label

import { createModal, closeModal, openModal } from "../uiKit.js";
import { createLayoutSwitcher }              from "../uiKit.js";

export function createDefinitionModalShell({
  id,
  title,
  size = "large",
  searchable = false,
  layoutOptions = ["row", "stacked", "gallery"],
  onClose = () => {}
}) {
  // 1) build base modal
  const { modal, content, header } = createModal({
    id,
    title,
    size,
    backdrop: true,
    draggable: false,
    withDivider: true,
    onClose: () => {
      onClose();
      closeModal(modal);
    }
  });

  // 2) find the “×” button by text or aria-label
  let closeBtn = Array.from(header.querySelectorAll("button")).find(b => {
    return b.textContent.trim() === "×"
        || b.getAttribute("aria-label") === "Close";
  });

  // 3) clear header so we can rebuild two sides
  header.innerHTML = "";

  // 4) Left side: title
  const left = document.createElement("div");
  left.style.flex = "1";
  left.style.display = "flex";
  left.style.alignItems = "center";
  const titleEl = document.createElement("h2");
  titleEl.textContent = title;
  titleEl.style.margin = 0;
  left.appendChild(titleEl);

  // 5) Right side: controls
  const right = document.createElement("div");
  right.style.display = "flex";
  right.style.alignItems = "center";
  right.style.gap = "8px";

  // a) layout switcher
  const layoutSwitcher = createLayoutSwitcher({
    available:   layoutOptions,
    defaultView: layoutOptions[0],
    onChange:    () => {}
  });
  right.appendChild(layoutSwitcher);

  // b) optional search
  if (searchable) {
    const search = document.createElement("input");
    search.type        = "search";
    search.placeholder = "Search…";
    search.classList.add("modal__search", "ui-input");
    right.appendChild(search);
  }

  // c) re-append the close button last
  if (closeBtn) {
    right.appendChild(closeBtn);
  }

  // 6) assemble header
  header.style.display        = "flex";
  header.style.alignItems     = "center";
  header.style.justifyContent = "space-between";
  header.append(left, right);

  return { modal, header, content, open: () => openModal(modal), close: () => closeModal(modal) };
}
