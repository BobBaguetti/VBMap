// @version: 1
// @file: /scripts/modules/ui/preview/itemPreview.js

import { createIcon } from "../../utils/iconUtils.js";

export function createItemPreviewPanel(container) {
  container.className = "item-preview-panel";

  const header = document.createElement("div");
  header.className = "preview-header";
  header.textContent = "Preview";

  const pinBtn = document.createElement("button");
  pinBtn.className = "preview-pin ui-button";
  pinBtn.title = "Pin preview panel";
  pinBtn.appendChild(createIcon("push-pin"));

  header.appendChild(pinBtn);
  container.appendChild(header);

  const previewBox = document.createElement("div");
  previewBox.className = "preview-content";
  container.appendChild(previewBox);

  let isPinned = false;
  pinBtn.addEventListener("click", () => {
    isPinned = !isPinned;
    container.classList.toggle("pinned", isPinned);
  });

  function renderPreview(data) {
    const rarity = data.rarity || "";
    const itemType = data.itemType || "";
    const nameColor = data.nameColor || "#fff";
    const rarityColor = data.rarityColor || "#bbb";
    const itemTypeColor = data.itemTypeColor || "#bbb";
    const value = data.value || "";
    const description = data.description || "";
    const quantity = data.quantity || "";

    previewBox.innerHTML = `
      <div class="popup-header" style="color: ${nameColor}">
        ${data.name} ${quantity ? `<span class="popup-qty">x${quantity}</span>` : ""}
      </div>
      <div class="popup-sub" style="color: ${itemTypeColor}">${itemType}</div>
      <div class="popup-sub" style="color: ${rarityColor}">${rarity.toUpperCase()}</div>
      <div class="popup-desc">${description}</div>
      ${value ? `<div class="popup-value">${value} ${createIcon("coins", { inline: true }).outerHTML}</div>` : ""}
    `;
  }

  return { renderPreview };
}
