// @version: 1
// @file: /scripts/modules/ui/preview/npcPreview.js

export function createNpcPreviewPanel(container) {
  container.innerHTML = "<div class='npc-preview'>NPC preview coming soon…</div>";
  return {
    setFromDefinition: (def) => {
      container.innerHTML = "<div class='npc-preview'>Preview for: " + (def?.name || "Unnamed NPC") + "</div>";
    },
    show: () => container.style.display = "block",
    hide: () => container.style.display = "none"
  };
}