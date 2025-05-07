// @file: src/modules/ui/components/definitionModalShell.js
// @version: 5.0 — shell only, no built-in preview, single close button from uiKit

import { createModal, closeModal, openModal } from "../uiKit.js";
import { createLayoutSwitcher }              from "../uiKit.js";

/**
 * Shared modal shell:
 *  - uses uiKit.createModal (which injects its own close-button and backdrop)
 *  - header with title, layout switcher, optional search input
 *  - content container you fill in your modal init
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

  // header layout
  header.style.display        = "flex";
  header.style.alignItems     = "center";
  header.style.justifyContent = "space-between";

  // toolbar (layout switcher + optional search)
  const toolbar = document.createElement("div");
  toolbar.style.display    = "flex";
  toolbar.style.alignItems = "center";
  toolbar.style.gap        = "8px";

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
    search.classList.add("modal__search");
    toolbar.appendChild(search);
  }

  header.appendChild(toolbar);

  return {
    modal,
    header,
    content,
    open:  () => openModal(modal),
    close: () => closeModal(modal)
  };
}
