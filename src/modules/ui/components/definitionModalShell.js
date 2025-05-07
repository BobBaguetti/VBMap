// @file: src/modules/ui/components/definitionModalShell.js
// @version: 5.2 — two-column header: [Title] … [Switcher • Search • Close]

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
  // 1) Base modal & raw header
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

  // 2) Grab and remove the auto-close button
  const closeBtn = header.querySelector(".modal__close");
  if (closeBtn) header.removeChild(closeBtn);

  // 3) Clear out the header to rebuild
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

  // 5a) Layout switcher
  const layoutSwitcher = createLayoutSwitcher({
    available:   layoutOptions,
    defaultView: layoutOptions[0],
    onChange:    () => {}
  });
  right.appendChild(layoutSwitcher);

  // 5b) Optional search
  if (searchable) {
    const search = document.createElement("input");
    search.type        = "search";
    search.placeholder = "Search…";
    search.classList.add("modal__search", "ui-input");
    right.appendChild(search);
  }

  // 5c) Re-append the close button, last
  if (closeBtn) {
    right.appendChild(closeBtn);
  }

  // 6) Assemble header
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
