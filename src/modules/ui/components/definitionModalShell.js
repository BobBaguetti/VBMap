// @file: src/modules/ui/components/definitionModalShell.js
// @version: 5.3 — use correct selector for the close “×” button

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
  // 1) Build base modal & grab header
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

  // 2) Locate the injected close-button (class "close" inside header)
  const closeBtn = header.querySelector("button.close");

  // 3) Wipe out header contents so we can rebuild two columns
  header.innerHTML = "";

  // 4) Left-side: title
  const left = document.createElement("div");
  left.style.flex = "1";
  left.style.display = "flex";
  left.style.alignItems = "center";
  const titleEl = document.createElement("h2");
  titleEl.textContent = title;
  titleEl.style.margin = 0;
  left.appendChild(titleEl);

  // 5) Right-side: controls
  const right = document.createElement("div");
  right.style.display = "flex";
  right.style.alignItems = "center";
  right.style.gap = "8px";

  // 5a) Layout switcher
  const layoutSwitcher = createLayoutSwitcher({
    available:   layoutOptions,
    defaultView: layoutOptions[0],
    onChange:    () => {}
  });
  right.appendChild(layoutSwitcher);

  // 5b) Optional search box
  if (searchable) {
    const search = document.createElement("input");
    search.type        = "search";
    search.placeholder = "Search…";
    search.classList.add("modal__search", "ui-input");
    right.appendChild(search);
  }

  // 5c) Re-append the close button at far right
  if (closeBtn) {
    right.appendChild(closeBtn);
  }

  // 6) Final header assembly
  header.style.display        = "flex";
  header.style.alignItems     = "center";
  header.style.justifyContent = "space-between";
  header.append(left, right);

  return {
    modal,
    header,
    content,
    open:  () => openModal(modal),
    close: () => closeModal(modal)
  };
}
