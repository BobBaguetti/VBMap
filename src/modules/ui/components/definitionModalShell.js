// @file: src/modules/ui/components/definitionModalShell.js
// @version: 5.5 — correctly select and re-append the span.close element

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
  // 1) build the base modal and get header
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

  // 2) grab the span.close element (the ×) before we clear header
  const closeBtn = header.querySelector(".close");

  // 3) clear header and rebuild two sections
  header.innerHTML = "";

  // 4) Left: the title
  const left = document.createElement("div");
  left.style.flex = "1";
  left.style.display = "flex";
  left.style.alignItems = "center";
  const titleEl = document.createElement("h2");
  titleEl.textContent = title;
  titleEl.style.margin = 0;
  left.appendChild(titleEl);

  // 5) Right: layout switcher, search, then close
  const right = document.createElement("div");
  right.style.display = "flex";
  right.style.alignItems = "center";
  right.style.gap = "8px";

  // a) layout buttons
  const layoutSwitcher = createLayoutSwitcher({
    available:   layoutOptions,
    defaultView: layoutOptions[0],
    onChange:    () => {}
  });
  right.appendChild(layoutSwitcher);

  // b) optional search input
  if (searchable) {
    const search = document.createElement("input");
    search.type        = "search";
    search.placeholder = "Search…";
    search.classList.add("modal__search", "ui-input");
    right.appendChild(search);
  }

  // c) re-attach the original close <span>
  if (closeBtn) {
    right.appendChild(closeBtn);
  }

  // 6) finalize header layout
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
