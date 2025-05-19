// @file: src/modules/marker/modal/markerModal.js
// @version: 22.2 — undock from definition modal, add draggable, fix z-index

import { markerTypes } from "../types.js";

export function initMarkerModal(db) {
  let modal, content;
  let fldType, fldDef, rowType, rowDef, btnCreate, btnCancel;
  let pendingCoords, onCreate, onSaveCallback;

  // Lifecycle & ESC-to-close
  function attachLifecycle(modalEl) {
    const prevFocused = document.activeElement;
    const scrollY = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    modalEl.addEventListener(
      "close",
      () => {
        document.documentElement.style.overflow = "";
        window.scrollTo(0, scrollY);
        prevFocused?.focus();
      },
      { once: true }
    );
  }
  function onKey(e) {
    if (e.key === "Escape" && modal) closeModal();
  }

  // Show/hide
  function openModal() {
    modal.style.display = "block";
    document.addEventListener("keydown", onKey);
  }
  function closeModal() {
    modal.style.display = "none";
    modal.dispatchEvent(new Event("close"));
    document.removeEventListener("keydown", onKey);
  }

  // Build the modal shell once
  function ensureBuilt() {
    if (modal) return;

    // Wrapper container (no full-screen backdrop)
    modal = document.createElement("div");
    modal.id = "marker-modal";
    modal.className = "modal--marker";
    // Always on top
    modal.style.position = "absolute";
    modal.style.zIndex = "1500";
    modal.style.display = "none";
    document.body.append(modal);
    attachLifecycle(modal);

    // Content box
    content = document.createElement("div");
    content.className = "modal-content";
    // Make it clear it's draggable
    content.style.cursor = "move";
    modal.append(content);

    // Type row (also serves as drag handle)
    rowType = document.createElement("label");
    rowType.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.innerHTML = `
      <option value="" disabled selected>Select type…</option>
      ${Object.keys(markerTypes)
        .map(type => `<option value="${type}">${type}</option>`)
        .join("")}
    `;
    rowType.append(fldType);
    content.append(rowType);

    // Definition row
    rowDef = document.createElement("label");
    rowDef.textContent = "Definition:";
    fldDef = document.createElement("select");
    fldDef.innerHTML = `<option value="" disabled>Select definition…</option>`;
    rowDef.append(fldDef);
    rowDef.style.display = "none";
    content.append(rowDef);

    // Buttons
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

    // Populate definitions when type changes
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

    // Create/Save logic
    btnCreate.addEventListener("click", () => {
      const type = fldType.value;
      const cfg = markerTypes[type];
      const defIdKey = cfg.defIdKey;
      const defId = fldDef.value;
      if (!type || !defIdKey || !defId) return;
      const payload = { type, coords: pendingCoords, [defIdKey]: defId };
      if (onCreate) onCreate(payload);
      else if (onSaveCallback) onSaveCallback(payload);
      closeModal();
    });

    // ─── Drag logic ─────────────────────────────────────
    let dragging = false, offsetX = 0, offsetY = 0;
    rowType.addEventListener("mousedown", e => {
      dragging = true;
      const rect = modal.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      document.addEventListener("mousemove", onDrag);
      document.addEventListener("mouseup", stopDrag, { once: true });
      e.preventDefault();
    });
    function onDrag(e) {
      if (!dragging) return;
      modal.style.left = `${e.clientX - offsetX}px`;
      modal.style.top = `${e.clientY - offsetY}px`;
    }
    function stopDrag() {
      dragging = false;
      document.removeEventListener("mousemove", onDrag);
    }
  }

  // API
  return {
    openCreate(coords, type = "", evt, createCb) {
      pendingCoords = coords;
      onCreate = createCb;
      onSaveCallback = null;
      ensureBuilt();
      fldType.value = type;
      fldType.dispatchEvent(new Event("change"));
      // Position left of mouse
      openModalAt(evt);
    },

    openEdit(markerObj, data, evt, saveCb) {
      pendingCoords = data.coords;
      onCreate = null;
      onSaveCallback = saveCb;
      ensureBuilt();
      fldType.value = data.type;
      fldType.dispatchEvent(new Event("change"));
      const defIdKey = markerTypes[data.type].defIdKey;
      fldDef.value = data[defIdKey] || "";
      openModalAt(evt);
    }
  };

  // Position & open
  function openModalAt(evt) {
    // Place modal wrapper itself
    openModal();
    const rect = content.getBoundingClientRect();
    modal.style.left = `${evt.clientX - rect.width}px`;
    modal.style.top = `${evt.clientY - rect.height / 2}px`;
  }
}
