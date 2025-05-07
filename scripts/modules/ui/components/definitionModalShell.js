// @file: /scripts/modules/ui/components/definitionModalShell.js 
// @version: 3 — suppressed auto-show of preview, now shows only on open

import { createModal, closeModal, openModal } from "../uiKit.js";
import { createLayoutSwitcher } from "../uiKit.js";
import { createPreviewPanel } from "../preview/createPreviewPanel.js";

export function createDefinitionModalShell({
  id,
  title,
  size = "large",
  withPreview = false,
  previewType = null,
  layoutOptions = ["row", "stacked", "gallery"],
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

  // Header layout switcher
  const layoutSwitcher = createLayoutSwitcher({
    available: layoutOptions,
    defaultView: layoutOptions[0],
    onChange: () => {}
  });
  header.appendChild(layoutSwitcher);

  // Body wrapper
  const bodyWrap = document.createElement("div");
  Object.assign(bodyWrap.style, {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
    minHeight: "0"
  });
  content.appendChild(bodyWrap);

  let previewApi = null;
  let showPreview = null;

  if (withPreview && previewType) {
    const previewPanel = document.createElement("div");
    previewPanel.style.zIndex = "1101";
    document.body.appendChild(previewPanel);

    previewApi = createPreviewPanel(previewType, previewPanel);

    const positionPreview = () => {
      const mc = modal.querySelector(".modal-content")?.getBoundingClientRect();
      const pr = previewPanel.getBoundingClientRect();
      if (mc) {
        previewPanel.style.position = "absolute";
        previewPanel.style.left   = `${mc.right + 30}px`;
        previewPanel.style.top    = `${mc.top + (mc.height/2) - (pr.height/2)}px`;
      }
    };

    showPreview = () => {
      positionPreview();
      previewApi.show();
    };
  }

  return {
    modal,
    header,
    content,
    bodyWrap,
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
