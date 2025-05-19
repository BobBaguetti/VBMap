// @file: src/modules/ui/modals/markerModal.js
// @version: 22.3 — fully self-contained modal (inlined factory + lifecycle)

import { markerTypes } from "../types.js";
import { createDefListContainer } from "../../../shared/utils/listUtils.js"; // if needed
// Note: markerModal doesn’t use listUtils; remove import if unused.

export function initMarkerModal(db) {
  let modal, content;
  let fldType, fldDef, btnCreate, btnCancel;
  let pendingCoords, onCreate, onSaveCallback;

  // Lifecycle & ESC-to-close
  function attachLifecycle(modalEl) {
    const prevFocused = document.activeElement;
    const scrollY     = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    modalEl.addEventListener("close", () => {
      document.documentElement.style.overflow = "";
      window.scrollTo(0, scrollY);
      prevFocused?.focus?.();
    }, { once: true });
  }
  function onKey(e) {
    if (e.key === "Escape" && modal) closeModal();
  }

  // Show/hide
  function openModal() {
    modal.classList.add("is-open");
    document.addEventListener("keydown", onKey);
  }
  function closeModal() {
    modal.classList.remove("is-open");
    modal.dispatchEvent(new Event("close"));
    document.removeEventListener("keydown", onKey);
  }

  // Build the modal shell once
  function ensureBuilt() {
    if (modal) return;

    // 1) Modal backdrop container
    modal = document.createElement("div");
    modal.id = "marker-modal";
    modal.className = "modal--marker";
    document.body.append(modal);
    attachLifecycle(modal);

    // 2) Content wrapper
    content = document.createElement("div");
    content.className = "modal-content";
    modal.append(content);

    // 3) Make modal draggable if desired
    // (optional: replicate draggable logic from shared modalSmall)

    // 4) Type selector
    const rowType = document.createElement("label");
    rowType.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.innerHTML = `
      <option value="" disabled selected>Select type…</option>
      ${Object.keys(markerTypes).map(
        type => `<option value="${type}">${type}</option>`
      ).join("")}
    `;
    rowType.append(fldType);
    content.append(rowType);

    // 5) Definition selector
    const rowDef = document.createElement("label");
    rowDef.textContent = "Definition:";
    fldDef = document.createElement("select");
    fldDef.innerHTML = `<option value="" disabled>Select definition…</option>`;
    rowDef.append(fldDef);
    rowDef.style.display = "none";
    content.append(rowDef);

    // 6) Buttons row
    const btnRow = document.createElement("div");
    btnRow.className = "modal-buttons";

    btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.textContent = "Cancel";
    btnCancel.onclick = closeModal;

    btnCreate = document.createElement("button");
    btnCreate.type = "button";
    btnCreate.textContent = "Create";

    btnRow.append(btnCancel, btnCreate);
    content.append(btnRow);

    // 7) Handlers
    fldType.addEventListener("change", async () => {
      const type = fldType.value;
      if (!type) return;
      const cfg = markerTypes[type];
      const defs = await cfg.loadDefinitions(db);
      fldDef.innerHTML = `
        <option value="" disabled selected>Select ${type}…</option>
        ${defs
          .filter(cfg.showInSidebar)
          .map(d => `<option value="${d.id}">${d.name || d.id}</option>`)
          .join("")}
      `;
      rowDef.style.display = "";
    });

    btnCreate.addEventListener("click", () => {
      const type = fldType.value;
      const cfg = markerTypes[type];
      const defIdKey = cfg.defIdKey;
      const defId = fldDef.value;
      if (!type || !defIdKey || !defId) return;
      const payload = { type, coords: pendingCoords, [defIdKey]: defId };
      if (onCreate) {
        onCreate(payload);
      } else if (onSaveCallback) {
        onSaveCallback(payload);
      }
      closeModal();
    });
  }

  return {
    openCreate(coords, type = "", evt, createCb) {
      pendingCoords  = coords;
      onCreate       = createCb;
      onSaveCallback = null;
      ensureBuilt();
      fldType.value = type;
      fldType.dispatchEvent(new Event("change"));
      // Position near event
      openModalAt(evt);
    },

    openEdit(markerObj, data, evt, saveCb) {
      pendingCoords  = data.coords;
      onCreate       = null;
      onSaveCallback = saveCb;
      ensureBuilt();
      fldType.value = data.type;
      fldType.dispatchEvent(new Event("change"));
      const defIdKey = markerTypes[data.type].defIdKey;
      fldDef.value   = data[defIdKey] || "";
      openModalAt(evt);
    }
  };

  // Helper to position and open
  function openModalAt(evt) {
    openModal();
    const rect = content.getBoundingClientRect();
    content.style.position = "absolute";
    content.style.left     = `${evt.clientX - rect.width}px`;
    content.style.top      = `${evt.clientY - rect.height / 2}px`;
  }
}
