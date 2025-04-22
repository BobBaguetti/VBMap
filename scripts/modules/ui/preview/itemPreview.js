// @version: 4
// @file: /scripts/modules/ui/preview/itemPreview.js

export function createItemPreviewPanel(container) {
  container.id = "item-preview-panel";
  container.classList.add("hidden");

  const content = document.createElement("div");
  content.className = "preview-content";
  container.appendChild(content);

  function renderPreview(data) {
    if (!data) return;

    content.innerHTML = "";

    const name = document.createElement("h4");
    name.textContent = data.name || "Unnamed Item";
    name.style.color = data.nameColor || "#fff";

    const typeLine = document.createElement("div");
    typeLine.className = "preview-line";
    typeLine.innerHTML = `<span class="label">Type:</span> <span class="value" style="color: ${data.itemTypeColor || "#ccc"}">${data.itemType || "—"}</span>`;

    const rarityLine = document.createElement("div");
    rarityLine.className = "preview-line";
    rarityLine.innerHTML = `<span class="label">Rarity:</span> <span class="value" style="color: ${data.rarityColor || "#ccc"}">${data.rarity?.toUpperCase() || "—"}</span>`;

    const valueLine = document.createElement("div");
    valueLine.className = "preview-line";
    valueLine.innerHTML = `<span class="label">Value:</span> <span class="value">${data.value || 0}</span>`;

    const qtyLine = document.createElement("div");
    qtyLine.className = "preview-line";
    qtyLine.innerHTML = `<span class="label">Quantity:</span> <span class="value">x${data.quantity || 0}</span>`;

    const desc = document.createElement("div");
    desc.className = "preview-description";
    desc.textContent = data.description || "";
    desc.style.color = data.descriptionColor || "#aaa";

    content.append(name, typeLine, rarityLine, valueLine, qtyLine, desc);
  }

  return {
    panel: container,
    renderPreview,
    setFromDefinition: renderPreview
  };
}
