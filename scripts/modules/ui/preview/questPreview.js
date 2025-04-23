// @version: 1
// @file: /scripts/modules/ui/preview/questPreview.js

export function createQuestPreviewPanel(container) {
  container.innerHTML = "<div class='quest-preview'>Quest preview coming soon…</div>";
  return {
    setFromDefinition: (def) => {
      container.innerHTML = "<div class='quest-preview'>Preview for: " + (def?.name || "Untitled Quest") + "</div>";
    },
    show: () => container.style.display = "block",
    hide: () => container.style.display = "none"
  };
}