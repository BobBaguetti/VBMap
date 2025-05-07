// @file: src/modules/ui/preview/previewController.js
// @version: 2.0 — pluggable data extractor

import { createPreviewPanel } from "./createPreviewPanel.js";

export function createPreviewController(type, extractData) {
  // panel container
  const container = document.createElement("div");
  container.style.zIndex = "1101";
  document.body.appendChild(container);

  // raw panel API
  const previewApi = createPreviewPanel(type, container);

  // we’ll store the last “base” definition
  let baseDef = {};

  // show + position helper
  function positionAndShow(def) {
    previewApi.setFromDefinition(def);
    previewApi.show();

    const mc = document.querySelector(".modal-content")?.getBoundingClientRect();
    const pr = container.getBoundingClientRect();
    if (mc && pr.height) {
      container.style.position = "absolute";
      container.style.left     = `${mc.right + 30}px`;
      container.style.top      = `${mc.top + (mc.height/2) - (pr.height/2)}px`;
    }
  }

  // public API
  return {
    show(def = {}) {
      baseDef = def;
      // get live data from the callback, merge over base
      const live     = (typeof extractData === "function" ? extractData() : {});
      const merged   = { ...baseDef, ...live };
      positionAndShow(merged);

      // wire live updates: whenever extractData is called, just re-show
      // (modals can call liveReShow() on their own on input handlers)
    },
    // for modals that do manual wiring:
    liveReShow() {
      const live   = (typeof extractData === "function" ? extractData() : {});
      const merged = { ...baseDef, ...live };
      positionAndShow(merged);
    },
    hide: () => previewApi.hide()
  };
}
