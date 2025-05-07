// @file: /scripts/modules/ui/components/definitionModalShell.js
// @version: 5 — expose layoutSwitcher

import { createModal, closeModal, openModal } from "../uiKit.js";
import { createLayoutSwitcher }               from "../uiKit.js";

export function createDefinitionModalShell({
  id,
  title,
  size = "large",
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

  return {
    modal,
    header,
    content,
    bodyWrap,
    layoutSwitcher,        // now exposed
    open: () => openModal(modal),
    close: () => closeModal(modal)
  };
}
