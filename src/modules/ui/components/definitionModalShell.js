// @file: src/modules/ui/components/definitionModalShell.js
// @version: 5.8 — remove horizontal padding so content sits flush

import { createModal, closeModal, openModal } from "../uiKit.js";
import { createLayoutSwitcher }              from "../uiKit.js";
import { activateFloatingScrollbars }        from "../../utils/scrollUtils.js";

export function createDefinitionModalShell({
  id,
  title,
  size = "large",
  searchable = false,
  layoutOptions = ["row", "stacked", "gallery"],
  onClose = () => {}
}) {
  // 1) Build base modal with header & close-span
  const { modal, content, header } = createModal({
    id,
    title,
    size,
    backdrop: true,
    draggable: false,
    withDivider: true,
    onClose: () => {
      onClose();
      closeModal(modal);
    }
  });

  // 2) Grab the original close “×” button (span.close)
  const closeBtn = header.querySelector(".close");

  // 3) Clear out the header so we can rebuild it
  header.innerHTML = "";

  // 4) Left side: Title
  const left = document.createElement("div");
  left.style.flex = "1";
  left.style.display = "flex";
  left.style.alignItems = "center";
  const titleEl = document.createElement("h2");
  titleEl.textContent = title;
  titleEl.style.margin = 0;
  left.appendChild(titleEl);

  // 5) Right side: layout switcher, optional search, then close
  const right = document.createElement("div");
  right.style.display = "flex";
  right.style.alignItems = "center";
  right.style.gap = "8px";

  // layout‐switcher buttons
  const layoutSwitcher = createLayoutSwitcher({
    available:   layoutOptions,
    defaultView: layoutOptions[0],
    onChange:    () => {}
  });
  right.appendChild(layoutSwitcher);

  // optional header search
  if (searchable) {
    const search = document.createElement("input");
    search.type        = "search";
    search.placeholder = "Search…";
    search.classList.add("modal__search", "ui-input");
    right.appendChild(search);
  }

  // re-append the close button at the far right
  if (closeBtn) {
    right.appendChild(closeBtn);
  }

  // 6) Final header assembly
  header.style.display        = "flex";
  header.style.alignItems     = "center";
  header.style.justifyContent = "space-between";
  header.append(left, right);

  // ─── Create a scrollable body wrapper ───────────────────────────────
  const bodyWrap = document.createElement("div");
  bodyWrap.classList.add("ui-scroll-float");
  Object.assign(bodyWrap.style, {
    flex:      "1 1 auto",
    overflowY: "auto",
    padding:   "0",        // ← removed horizontal (and vertical) padding
    boxSizing: "border-box"
  });

  // Move any existing contents (divider, etc.) into bodyWrap
  while (content.childNodes.length > 1) {
    bodyWrap.appendChild(content.childNodes[1]);
  }
  content.appendChild(bodyWrap);

  // Re-activate your floating scrollbar logic
  activateFloatingScrollbars(bodyWrap);

  return {
    modal,
    header,
    content: bodyWrap,
    open:  () => openModal(modal),
    close: () => closeModal(modal)
  };
}
