// @version: 4
// @file: /scripts/modules/ui/preview/itemPreview.js

import { renderPopup } from "../../map/markerManager.js";

export function createItemPreviewPanel(container) {
  container.id = "item-preview-panel";
  container.classList.add("hidden");

  // Set background + container styles
  container.style.backgroundImage = "url('media/images/itemPreview.png')";
  container.style.backgroundSize = "cover";
  container.style.backgroundPosition = "center";
  container.style.width = "432px";
  container.style.height = "432px";
  container.style.position = "fixed";
  container.style.zIndex = "1101";
  container.style.borderRadius = "12px";
  container.style.overflow = "hidden";
  container.style.pointerEvents = "auto";
  container.style.display = "none"; // default hidden

  // Create popup wrapper centered inside panel
  const popupWrapper = document.createElement("div");
  popupWrapper.className = "preview-popup-wrapper";
  popupWrapper.style.position = "absolute";
  popupWrapper.style.top = "50%";
  popupWrapper.style.left = "50%";
  popupWrapper.style.transform = "translate(-50%, -50%)";
  popupWrapper.style.zIndex = "1"; // ensure above bg
  container.appendChild(popupWrapper);

  return {
    setFromDefinition(def) {
      popupWrapper.innerHTML = ""; // clear previous
      if (def) {
        const popup = renderPopup(def); // generate marker-style popup
        popupWrapper.appendChild(popup);
      }
    },
    show() {
      container.classList.remove("hidden");
      container.classList.add("visible");
      container.style.display = "block";
    },
    hide() {
      container.classList.remove("visible");
      container.classList.add("hidden");
      container.style.display = "none";
    }
  };
}
