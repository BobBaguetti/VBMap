// @file: src/modules/ui/components/definitionModalShell.js
// @version: 4 — unified header toolbar, search input, layout switcher, preview, close-button, and color-picker wiring

import { createModal, closeModal, openModal } from "../uiKit.js";
import { createLayoutSwitcher }              from "../uiKit.js";
import { createPreviewPanel }                from "../preview/createPreviewPanel.js";
import { createPickrForInput }               from "../../pickrManager.js";

export function createDefinitionModalShell({
  id,
  title,
  size = "large",
  withPreview = false,
  previewType = null,
  layoutOptions = ["row", "stacked", "gallery"],
  searchable = false,
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
      if (withPreview) previewApi?.hide();
      closeModal(modal);
    }
  });

  // Ensure header is flex container
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";

  // Left side: title is already in place

  // Middle toolbar container
  const toolbar = document.createElement("div");
  toolbar.classList.add("modal__toolbar");
  toolbar.style.display = "flex";
  toolbar.style.alignItems = "center";
  toolbar.style.gap = "8px";

  // Layout switcher
  const layoutSwitcher = createLayoutSwitcher({
    available:   layoutOptions,
    defaultView: layoutOptions[0],
    onChange:    () => {}
  });
  toolbar.appendChild(layoutSwitcher);

  // Optional search input
  if (searchable) {
    const search = document.createElement("input");
    search.type        = "search";
    search.placeholder = "Search…";
    search.classList.add("modal__search");
    toolbar.appendChild(search);
  }

  header.appendChild(toolbar);

  // Right side: createPreviewPanel toggle and close button
  let previewApi, showPreview;
  if (withPreview && previewType) {
    const previewContainer = document.createElement("div");
    previewContainer.style.zIndex = "1101";
    document.body.appendChild(previewContainer);

    previewApi = createPreviewPanel(previewType, previewContainer);

    showPreview = () => {
      const mc = modal.querySelector(".modal-content")?.getBoundingClientRect();
      const pr = previewContainer.getBoundingClientRect();
      if (mc) {
        previewContainer.style.position = "absolute";
        previewContainer.style.left     = `${mc.right + 30}px`;
        previewContainer.style.top      = `${mc.top + (mc.height/2) - (pr.height/2)}px`;
      }
      previewApi.show();
    };
  }

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.classList.add("modal__close");
  closeBtn.innerHTML = "&times;";
  closeBtn.type      = "button";
  closeBtn.addEventListener("click", () => {
    if (withPreview && previewApi) previewApi.hide();
    closeModal(modal);
  });
  header.appendChild(closeBtn);

  // Content area is ready
  // Export helpers
  return {
    modal,
    header,
    content,
    layoutSwitcher,
    previewApi,
    open: () => {
      openModal(modal);
      if (withPreview && showPreview) showPreview();
    },
    close: () => {
      if (withPreview && previewApi) previewApi.hide();
      closeModal(modal);
    }
  };
}

/**
 * Initialize color-pickers on any input with [data-color-picker]
 */
export function initModalColorPickers(containerEl) {
  containerEl
    .querySelectorAll("[data-color-picker]")
    .forEach(input => createPickrForInput(input));
}
