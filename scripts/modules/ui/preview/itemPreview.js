// @version: 4
// @file: /scripts/modules/ui/preview/itemPreview.js

import { renderPopup } from "../../map/markerManager.js";

export function createItemPreviewPanel(container) {
  container.id = "item-preview-panel";
  container.classList.add("hidden");

  container.style.backgroundImage = "url('media/images/itemPreview.png')";
  container.style.backgroundSize = "cover";
  container.style.backgroundPosition = "center";
  container.style.width = "432px";
  container.style.height = "432px";
  container.style.position = "absolute"; // ensures we can position it beside modal
  container.style.zIndex = "1101";
  container.style.borderRadius = "12px";
  container.style.overflow = "hidden";
  container.style.pointerEvents = "auto";
  container.style.display = "none";

  const popupWrapper = document.createElement("div");
  popupWrapper.className = "preview-popup-wrapper";
  popupWrapper.style.position = "absolute";
  popupWrapper.style.top = "50%";
  popupWrapper.style.left = "50%";
  popupWrapper.style.transform = "translate(-50%, -50%)";
  popupWrapper.style.zIndex = "1";
  container.appendChild(popupWrapper);

  return {
    setFromDefinition(def) {
      popupWrapper.innerHTML = "";
      if (def) {
        const popupHTML = renderPopup(def);
        popupWrapper.innerHTML = popupHTML;
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
