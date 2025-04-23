// @comment: Comments should not be deleted unless they need updating due to specific commented code changing or the code part is removed. Functions should include sufficient inline comments.
// @file: /scripts/modules/ui/preview/questPreview.js
// @version: 6

import { renderPopup } from "../../components/popupRenderer.js";

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

  function setFromDefinition(def) {
    current = def || { name: "unnamed quest" };

    subheading.textContent = `Preview for: ${current.name || "unnamed quest"}`;
    content.innerHTML = "";
    content.appendChild(renderPopup(current));
  }

  function show() {
    wrap.style.display = "block";
  }

  function hide() {
    wrap.style.display = "none";
  }

  return { setFromDefinition, show, hide };
}
