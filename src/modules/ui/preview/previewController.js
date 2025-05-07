// @file: src/modules/ui/preview/previewController.js
// @version: 1.2 — auto‐binds form inputs in the modal to live preview updates

import { createPreviewPanel } from "./createPreviewPanel.js";

/**
 * Encapsulates preview panel creation, positioning, show/hide,
 * *and* auto‐wires form inputs inside your modal to call show(data).
 *
 * @param {string} type  — preview type, e.g. "item" or "chest"
 */
export function createPreviewController(type) {
  // 1) panel container
  const container = document.createElement("div");
  container.style.zIndex = "1101";
  document.body.appendChild(container);

  // 2) raw preview API
  const previewApi = createPreviewPanel(type, container);

  // 3) helper to get modal & form
  function findForm() {
    // assumes your modal id is `${type}-definitions-modal`
    const modal = document.getElementById(`${type}-definitions-modal`);
    return modal ? modal.querySelector("form") : null;
  }

  // 4) attach live‐update wiring once
  let wired = false;
  function wireLivePreview() {
    if (wired) return;
    const form = findForm();
    if (!form) return;

    const onChange = () => {
      // read payload from previewApi’s underlying setter
      const data = previewApi.getCurrentDefinition
        ? previewApi.getCurrentDefinition()
        : {}; // fallback, previewApi.setFromDefinition already stores last def
      previewApi.setFromDefinition(data);
      positionAndShow(data);
    };

    form.querySelectorAll("input, select, textarea").forEach(el => {
      const evt = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evt, onChange);
    });
    wired = true;
  }

  // 5) positioning + show logic
  function positionAndShow(data) {
    previewApi.setFromDefinition(data);
    previewApi.show();

    // now measure & position centred
    const mc = document.querySelector(".modal-content")?.getBoundingClientRect();
    const pr = container.getBoundingClientRect();
    if (mc && pr.height) {
      container.style.position = "absolute";
      container.style.left     = `${mc.right + 30}px`;
      container.style.top      = `${mc.top + (mc.height/2) - (pr.height/2)}px`;
    }

    // ensure live‐wiring is in place
    wireLivePreview();
  }

  return {
    previewApi,
    show: positionAndShow,
    hide: () => previewApi.hide()
  };
}
