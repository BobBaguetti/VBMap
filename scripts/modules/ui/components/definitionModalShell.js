// @file: /scripts/modules/ui/components/definitionModalShell.js
// @version: 4.2 – added toolbar & layoutOptions support

import { createModalCore }      from "./modalCore.js";
import { createLayoutSwitcher } from "./layoutSwitcher.js";
import { createPreviewPanel }   from "../preview/createPreviewPanel.js";

/**
 * Shell factory for all “definitions” modals.
 *
 * @param {object} opts
 * @param {string} opts.id
 * @param {string} opts.title
 * @param {string} [opts.size]
 * @param {boolean} [opts.withPreview]
 * @param {string|null} [opts.previewType]
 * @param {boolean} [opts.withDivider]
 * @param {Function} [opts.onClose]
 * @param {Array<{icon?:string,label:string,onClick:()=>void}>} [opts.toolbar]
 * @param {Array<string>} [opts.layoutOptions]
 */
export function createDefinitionModalShell({
  id,
  title,
  size = "large",
  withPreview = false,
  previewType = null,
  withDivider = true,
  onClose = () => {},
  toolbar = [],
  layoutOptions = ["row", "stacked", "gallery"]
}) {
  // 1) Core modal
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

  // 2) Toolbar buttons (insert before layout switcher)
  if (Array.isArray(toolbar) && toolbar.length) {
    const tb = document.createElement("div");
    tb.className = "modal-toolbar";
    toolbar.forEach(btnCfg => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = btnCfg.label;
      if (btnCfg.icon) btn.classList.add(`icon-${btnCfg.icon}`);
      btn.onclick = btnCfg.onClick;
      tb.appendChild(btn);
    });
    header.appendChild(tb);
  }

  // 3) Layout switcher
  let listApi;
  const layoutSwitcher = createLayoutSwitcher({
    available:   layoutOptions,
    defaultView: layoutOptions[0],
    onChange:    v => listApi?.setLayout(v)
  });
  header.appendChild(layoutSwitcher);

  // 4) Body wrapper
  const bodyWrap = document.createElement("div");
  Object.assign(bodyWrap.style, {
    display:       "flex",
    flexDirection: "column",
    flex:          "1 1 auto",
    minHeight:     "0"
  });
  content.appendChild(bodyWrap);

  // 5) Preview panel
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
