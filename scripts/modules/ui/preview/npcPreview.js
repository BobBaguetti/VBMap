// @comment: Comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed. Functions should include sufficient inline comments.
// @file: /scripts/modules/ui/preview/npcPreview.js
// @version: 3

export function createNpcPreviewPanel(container) {
  const wrap = document.createElement("div");
  wrap.className = "preview-panel";
  container.appendChild(wrap);

  const subheading = document.createElement("div");
  subheading.className = "preview-subheading";
  wrap.appendChild(subheading);

  const content = document.createElement("div");
  content.className = "preview-content";
  wrap.appendChild(content);

  let current = null;

  function setFromDefinition(def) {
    current = def || { name: "unnamed npc" };

    subheading.textContent = `Preview for: ${current.name || "unnamed npc"}`;
    content.innerHTML = `
      <div class="preview-box">
        <p><strong>Role:</strong> ${current.role || "Unknown"}</p>
        <p><strong>Faction:</strong> ${current.faction || "Neutral"}</p>
        <p><strong>Description:</strong> ${current.description || "No description"}</p>
      </div>
    `;
  }

  function show() {
    wrap.style.display = "block";
  }

  function hide() {
    wrap.style.display = "none";
  }

  return { setFromDefinition, show, hide };
}
