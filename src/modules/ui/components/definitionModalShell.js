// @file: src/modules/ui/components/definitionModalShell.js
// @version: 5.1 — dark‐style header search, and move close button to end

import { createModal, closeModal, openModal } from "../uiKit.js";
import { createLayoutSwitcher }              from "../uiKit.js";

/**
 * Shared modal shell:
 *  - uses uiKit.createModal (which injects its own close-button and backdrop)
 *  - header with title, layout switcher, optional search input
 *  - single close button always at far right
 */
export function createDefinitionModalShell({
  id,
  title,
  size = "large",
  searchable = false,
  layoutOptions = ["row", "stacked", "gallery"],
  onClose = () => {}
}) {
  // build the base modal (uiKit handles close button & backdrop)
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

  // arrange header as flex row
  header.style.display        = "flex";
  header.style.alignItems     = "center";
  header.style.justifyContent = "space-between";

  // build toolbar (layout switcher + optional search)
  const toolbar = document.createElement("div");
  toolbar.style.display    = "flex";
  toolbar.style.alignItems = "center";
  toolbar.style.gap        = "8px";

  // layout switcher buttons
  const layoutSwitcher = createLayoutSwitcher({
    available:   layoutOptions,
    defaultView: layoutOptions[0],
    onChange:    () => {}
  });
  toolbar.appendChild(layoutSwitcher);

  if (searchable) {
    const search = document.createElement("input");
    search.type        = "search";
    search.placeholder = "Search…";
    search.classList.add("modal__search", "ui-input"); 
    // ensure dark mode styling from ui-input
    toolbar.appendChild(search);
  }

  // inject toolbar immediately after title but before close-button
  // remove existing close-button and reappend after toolbar
  const closeBtn = header.querySelector(".modal__close");
  header.appendChild(toolbar);
  if (closeBtn) {
    header.appendChild(closeBtn);
  }

  return {
    modal,
    header,
    content,
    open:  () => openModal(modal),
    close: () => closeModal(modal)
  };
}
