// @file: /scripts/modules/ui/components/definitionModalShell.js

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

  const layoutSwitcher = createLayoutSwitcher({
    available: layoutOptions,
    defaultView: layoutOptions[0],
    onChange: () => {}
  });
  header.appendChild(layoutSwitcher);

  const bodyWrap = document.createElement("div");
  bodyWrap.style.display = "flex";
  bodyWrap.style.flexDirection = "column";
  bodyWrap.style.flex = "1 1 auto";
  bodyWrap.style.minHeight = 0;
  content.appendChild(bodyWrap);

  let previewApi = null;

  if (withPreview && previewType) {
    const previewPanel = document.createElement("div");
    previewPanel.style.zIndex = 1101;
    document.body.appendChild(previewPanel);

    previewApi = createPreviewPanel(previewType, previewPanel);

    const positionPreview = () => {
      const modalRect = modal.querySelector(".modal-content")?.getBoundingClientRect();
      const previewRect = previewPanel.getBoundingClientRect();
      if (modalRect) {
        previewPanel.style.left = `${modalRect.right + 30}px`;
        previewPanel.style.top = `${modalRect.top + (modalRect.height / 2) - (previewRect.height / 2)}px`;
        previewPanel.style.position = "absolute";
      }
    };

    const showPreview = () => {
      positionPreview();
      previewApi?.show();
    };

    setTimeout(showPreview, 0);
  }

  return {
    modal,
    header,
    content,
    bodyWrap,
    layoutSwitcher,
    previewApi,
    open: () => openModal(modal),
    close: () => closeModal(modal)
  };
}