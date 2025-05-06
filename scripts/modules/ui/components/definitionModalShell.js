// @file: /scripts/modules/ui/components/definitionModalShell.js
// @version: 4.1 – now delegates modal creation to modalCore.js

import { createModalCore }      from "./modalCore.js";
import { createLayoutSwitcher } from "./layoutSwitcher.js";
import { createPreviewPanel }   from "../preview/createPreviewPanel.js";

/**
 * Shell factory for all “definitions” modals.
 *
 * @param {object} opts
 * @param {string} opts.id             – DOM id for the modal
 * @param {string} opts.title          – Modal title text
 * @param {string} [opts.size]         – “small” or “large”
 * @param {boolean} [opts.withPreview] – whether to include the preview panel
 * @param {string|null} [opts.previewType]
 * @param {boolean} [opts.withDivider]
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
  // 1) Create the core modal (backdrop, header, close button, lifecycle)
  const { modal, content, header, open, close } = createModalCore({
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
  let listApi;  // will be set by the factory consumer
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
    open,
    close: () => {
      if (previewApi) previewApi.hide();
      close();
    },
    get previewApi() {
      return previewApi;
    },
    set listApi(api) {
      listApi = api;
    }
  };
}
