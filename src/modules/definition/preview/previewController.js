// @file: src/modules/definition/preview/previewController.js
// @version: 1.5 — Step 5b: lazy-load createPreviewPanel implementation

export function createPreviewController(type) {
  // Create the floating container up front
  const container = document.createElement("div");
  container.classList.add("definition-preview-panel");
  container.style.position = "absolute";
  container.style.zIndex   = "1101";
  document.body.append(container);

  let previewApi = null;

  // Ensure the heavy preview panel module is loaded once
  async function ensureLoaded() {
    if (!previewApi) {
      const { createPreviewPanel } = await import("./createPreviewPanel.js");
      previewApi = createPreviewPanel(type, container);
    }
  }

  // Show and position the panel; dynamic-import on first call
  async function show(def) {
    await ensureLoaded();
    previewApi.setFromDefinition(def);
    previewApi.show();

    const modalContent = document.querySelector(
      ".modal.modal--definition .modal-content"
    );
    if (!modalContent) return;

    const mc = modalContent.getBoundingClientRect();
    const pr = container.getBoundingClientRect();
    container.style.left = `${mc.right + 16}px`;
    container.style.top  = `${mc.top + (mc.height - pr.height) / 2}px`;
  }

  // Hide (safe even if not yet loaded)
  function hide() {
    previewApi?.hide();
  }

  return { show, hide };
}
