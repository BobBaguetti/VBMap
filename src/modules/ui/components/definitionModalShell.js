// @file: src/modules/ui/components/definitionModalShell.js
// @version: 4.1 — fixed pickrManager import path

import { createModal, closeModal, openModal } from "../uiKit.js";
import { createLayoutSwitcher }              from "../uiKit.js";
import { createPreviewPanel }                from "../preview/createPreviewPanel.js";
// Correct path to pickrManager
import { createPickrForInput }               from "../pickrManager.js";

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

  // Flex header for title, toolbar, and close
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";

  // Toolbar container
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

  // Preview panel toggle
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

  // Close button (always rightmost)
  const closeBtn = document.createElement("button");
  closeBtn.classList.add("modal__close");
  closeBtn.type = "button";
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", () => {
    if (withPreview && previewApi) previewApi.hide();
    closeModal(modal);
  });
  header.appendChild(closeBtn);

  // Expose API
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
