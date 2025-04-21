// @version: 1
// @file: /scripts/modules/ui/preview/itemPreview.js

export function createItemPreviewPanel(container) {
  container.classList.add("item-preview");
  container.classList.add("hidden");

  const content = document.createElement("div");
  content.className = "preview-content";
  container.appendChild(content);

  const pinBtn = document.createElement("button");
  pinBtn.className = "pin-button";
  pinBtn.title = "Pin preview";
  pinBtn.innerHTML = "📌";

  pinBtn.addEventListener("click", () => {
    container.classList.toggle("pinned");
  });

  container.appendChild(pinBtn);

  return {
    renderPreview(data) {
      if (!data) return;

      content.innerHTML = "";

      const name = document.createElement("div");
      name.className = "preview-name";
      name.textContent = data.name || "Unnamed Item";
      name.style.color = data.nameColor || "#fff";

      const desc = document.createElement("div");
      desc.className = "preview-description";
      desc.textContent = data.description || "";
      desc.style.color = data.descriptionColor || "#aaa";

      content.append(name, desc);
    }
  };
}
