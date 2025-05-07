// @file: src/modules/ui/preview/previewController.js
// @version: 1.4 — merge live form values over initial definition

import { createPreviewPanel } from "./createPreviewPanel.js";

export function createPreviewController(type) {
  const container = document.createElement("div");
  container.style.zIndex = "1101";
  document.body.appendChild(container);

  const previewApi = createPreviewPanel(type, container);

  // Holds the last full definition passed to show()
  let baseDef = {};

  function findForm() {
    const modal = document.getElementById(`${type}-definitions-modal`);
    return modal?.querySelector("form");
  }

  function getFormData() {
    const form = findForm();
    if (!form) return {};
    const fd = new FormData(form);
    return Object.fromEntries(fd.entries());
  }

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

  let wired = false;
  function wireLivePreview() {
    if (wired) return;
    const form = findForm();
    if (!form) return;

    form.querySelectorAll("input, select, textarea").forEach(el => {
      const evt = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evt, () => {
        // merge form data over baseDef
        const live = getFormData();
        const merged = { ...baseDef, ...live };
        positionAndShow(merged);
      });
    });

    wired = true;
  }

  return {
    show(def = {}) {
      baseDef = def;                  // capture initial
      const merged = { ...baseDef, ...getFormData() };
      positionAndShow(merged);
      wireLivePreview();
    },
    hide: () => previewApi.hide()
  };
}
