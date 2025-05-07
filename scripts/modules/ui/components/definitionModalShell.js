// @file: /scripts/modules/ui/components/definitionModalShell.js
// @version: 5.1 – restored previewApi support

import { createModalCore }      from "./modalCore.js";
import { buildModalHeader }     from "./modalHeader.js";
import { defaultToolbar }       from "./modalToolbar.js";
import { defaultLayoutOptions } from "./modalDefaults.js";
import { createLayoutSwitcher } from "./layoutSwitcher.js";
import { createPreviewPanel }   from "../preview/createPreviewPanel.js";

/**
 * Shell factory for all “definitions” modals.
 *
 * @param {object} opts
 * @param {string} opts.id
 * @param {string} opts.title
 * @param {string} [opts.size]
 * @param {boolean} [opts.withDivider]
 * @param {Function} [opts.onClose]
 * @param {Array} [opts.toolbar]
 * @param {Array<string>} [opts.layoutOptions]
 * @param {boolean} [opts.withPreview]
 * @param {string|null} [opts.previewType]
 */
export function createDefinitionModalShell({
  id,
  title,
  size = "large",
  withDivider = true,
  onClose = () => {},
  toolbar = defaultToolbar,
  layoutOptions = defaultLayoutOptions,
  withPreview = true,
  previewType = null
}) {
  // 1) Core modal
  const { modal, header, content, open, close } = createModalCore({
    id,
    title,
    size,
    backdrop: true,
    draggable: false,
    withDivider,
    onClose
  });
  modal.classList.add("admin-only");

  // 2) Body wrapper
  const bodyWrap = document.createElement("div");
  Object.assign(bodyWrap.style, {
    display:       "flex",
    flexDirection: "column",
    flex:          "1 1 auto",
    minHeight:     "0"
  });
  content.appendChild(bodyWrap);

  // 3) Preview panel
  let previewApi = null;
  if (withPreview && previewType) {
    previewApi = createPreviewPanel(previewType);
  }

  // 4) Layout switcher (needs to go in header after toolbar)
  let listApi;
  const layoutSwitcher = createLayoutSwitcher({
    available:   layoutOptions,
    defaultView: layoutOptions[0],
    onChange:    v => listApi?.setLayout(v)
  });

  // 5) Build header with shared helper
  buildModalHeader(header, {
    title,
    toolbar,
    layoutOptions,
    onLayoutChange: v => listApi?.setLayout(v),
    // searchEl and subHeaderEl are wired later
  });
  // insert layout switcher after header content
  header.appendChild(layoutSwitcher);

  // API object to return
  const api = {
    modal,
    header,
    content,
    bodyWrap,
    open,
    close: () => {
      previewApi?.hide();
      close();
    },
    get previewApi() {
      return previewApi;
    },
    set listApi(x) {
      listApi = x;
    }
  };

  return api;
}
