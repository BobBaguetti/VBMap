// @file: /scripts/modules/ui/components/definitionModalShell.js
// @version: 4.0 – now delegates modal creation to modalShell.js

import { createModal, openModal, closeModal } from "./modalShell.js";
import { createLayoutSwitcher }              from "./layoutSwitcher.js";
import { createPreviewPanel }                from "../preview/createPreviewPanel.js";

/**
 * Shell factory for all “definitions” modals.
 *
 * @param {object} opts
 * @param {string} opts.id           – DOM id for the modal
 * @param {string} opts.title        – Modal title text
 * @param {string} [opts.size]       – “small” or “large”
 * @param {boolean} [opts.withPreview=false]
 * @param {string|null} [opts.previewType]
 * @param {boolean} [opts.withDivider=true]
 * @param {Function} [opts.onClose]
 */
export function createDefinitionModalShell({
  id,
  title,
  size = "large",
  withPreview = false,
  previewType = null,
  withDivider = true,
  onClose = () => {}
}) {
  // 1) Create the base modal (backdrop, header, close button)
  const { modal, content, header } = createModal({
    id,
    title,
    size,
    backdrop: true,
    draggable: false,
    withDivider,
    onClose
  });

  modal.classList.add("admin-only");

  // 2) Add the layout‐switcher into the header
  const layoutSwitcher = createLayoutSwitcher({
    available:   ["row", "stacked", "gallery"],
    defaultView: "row",
    onChange:    v => listApi?.setLayout(v)
  });
  header.appendChild(layoutSwitcher);

  // 3) Prepare the body wrapper for list + form
  const bodyWrap = document.createElement("div");
  Object.assign(bodyWrap.style, {
    display:       "flex",
    flexDirection: "column",
    flex:          "1 1 auto",
    minHeight:     "0"
  });
  content.appendChild(bodyWrap);

  // 4) Optionally create a floating preview panel
  let previewApi = null;
  if (withPreview && previewType) {
    previewApi = createPreviewPanel(previewType);
  }

  return {
    modal,
    header,
    content,
    bodyWrap,
    open: () => openModal(modal),
    close: () => {
      if (previewApi) previewApi.hide();
      closeModal(modal);
    },
    get previewApi() {
      return previewApi;
    },
    set listApi(api) {
      // allows wiring the layout switcher to the list manager later
      listApi = api;
    }
  };
}
