// @comment: Comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed. Functions should include sufficient inline comments.
// @file: /scripts/modules/ui/preview/questPreview.js
// @version: 4

export function createQuestPreviewPanel(container) {
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

  function renderQuestPreview(def) {
    const box = document.createElement("div");
    box.className = "popup-wrapper";

    const title = document.createElement("div");
    title.className = "popup-name";
    title.textContent = def.name || "Unnamed Quest";
    box.appendChild(title);

    const desc = document.createElement("div");
    desc.className = "popup-description";
    desc.textContent = def.description || "No description.";
    box.appendChild(desc);

    return box;
  }

  function setFromDefinition(def) {
    current = def || { name: "Unnamed Quest" };

    subheading.textContent = `Preview for: ${current.name || "Unnamed Quest"}`;
    content.innerHTML = "";
    content.appendChild(renderQuestPreview(current));
  }

  function show() {
    wrap.style.display = "block";
  }

  function hide() {
    wrap.style.display = "none";
  }

  return { setFromDefinition, show, hide };
}
