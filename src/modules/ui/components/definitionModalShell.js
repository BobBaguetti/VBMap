// @file: src/modules/ui/components/definitionModalShell.js
// @version: 5.6 — reintroduce a scrollable body wrapper for content

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
  // Build the base modal
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

  // Grab and remove the close “×” (span.close)
  const closeBtn = header.querySelector(".close");

  // Clear header and rebuild it in two columns
  header.innerHTML = "";
  const left = document.createElement("div");
  left.style.flex = "1";
  left.style.display = "flex";
  left.style.alignItems = "center";
  const titleEl = document.createElement("h2");
  titleEl.textContent = title;
  titleEl.style.margin = 0;
  left.appendChild(titleEl);

  const right = document.createElement("div");
  right.style.display = "flex";
  right.style.alignItems = "center";
  right.style.gap = "8px";

  // Layout switcher
  const layoutSwitcher = createLayoutSwitcher({
    available:   layoutOptions,
    defaultView: layoutOptions[0],
    onChange:    () => {}
  });
  right.appendChild(layoutSwitcher);

  // Optional search input
  if (searchable) {
    const search = document.createElement("input");
    search.type        = "search";
    search.placeholder = "Search…";
    search.classList.add("modal__search", "ui-input");
    right.appendChild(search);
  }

  // Re-append close button at far right
  if (closeBtn) {
    right.appendChild(closeBtn);
  }

  header.style.display        = "flex";
  header.style.alignItems     = "center";
  header.style.justifyContent = "space-between";
  header.append(left, right);

  // ─── Create a scrollable body wrapper ───────────────────────────────
  const bodyWrap = document.createElement("div");
  Object.assign(bodyWrap.style, {
    flex:        "1 1 auto",
    overflowY:   "auto",
    padding:     "1rem",      // optional padding
    boxSizing:   "border-box"
  });

  // Move any existing children after header into bodyWrap
  while (content.childNodes.length > 1) {
    bodyWrap.appendChild(content.childNodes[1]);
  }
  content.appendChild(bodyWrap);

  // Return the body wrapper as the "content" target for modals
  return {
    modal,
    header,
    content: bodyWrap,
    open:  () => openModal(modal),
    close: () => closeModal(modal)
  };
}
