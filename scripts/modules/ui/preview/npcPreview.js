// @comment: Comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed. Functions should include sufficient inline comments.
// @file: /scripts/modules/ui/preview/npcPreview.js
// @version: 4

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

  function renderNpcPreview(def) {
    const box = document.createElement("div");
    box.className = "popup-wrapper";

    const name = document.createElement("div");
    name.className = "popup-name";
    name.textContent = def.name || "Unnamed NPC";
    box.appendChild(name);

    const role = document.createElement("div");
    role.className = "popup-type";
    role.textContent = def.role || "No role specified.";
    box.appendChild(role);

    const desc = document.createElement("div");
    desc.className = "popup-description";
    desc.textContent = def.description || "No description.";
    box.appendChild(desc);

    return box;
  }

  function setFromDefinition(def) {
    current = def || { name: "Unnamed NPC" };

    subheading.textContent = `Preview for: ${current.name || "Unnamed NPC"}`;
    content.innerHTML = "";
    content.appendChild(renderNpcPreview(current));
  }

  function show() {
    wrap.style.display = "block";
  }

  function hide() {
    wrap.style.display = "none";
  }

  return { setFromDefinition, show, hide };
}
