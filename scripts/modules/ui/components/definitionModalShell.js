// @file: /scripts/modules/ui/components/definitionModalShell.js
// @version: 5.0 – uses shared modalHeader.js

import { createModalCore }    from "./modalCore.js";
import { buildModalHeader }   from "./modalHeader.js";
import { defaultToolbar }     from "./modalToolbar.js";
import { defaultLayoutOptions } from "./modalDefaults.js"; // or move layoutOptions into modalToolbar.js if desired

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
 */
export function createDefinitionModalShell({
  id,
  title,
  size = "large",
  withDivider = true,
  onClose = () => {},
  toolbar = defaultToolbar,
  layoutOptions = defaultLayoutOptions
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

  // 2) Build header with shared helper
  buildModalHeader(header, {
    title,
    toolbar,
    layoutOptions,
    onLayoutChange: view => shell.listApi?.setLayout(view),
    // searchEl and subHeaderEl get wired later in the factory
  });

  // 3) Body wrapper
  const bodyWrap = document.createElement("div");
  Object.assign(bodyWrap.style, {
    display:       "flex",
    flexDirection: "column",
    flex:          "1 1 auto",
    minHeight:     "0"
  });
  content.appendChild(bodyWrap);

  return {
    modal,
    header,
    content,
    bodyWrap,
    open,
    close: () => {
      close();
    },
    set listApi(api) {
      // allow factory to wire layout change callback
      this._listApi = api;
    }
  };
}
