// @file: src/modules/marker/modal/markerModal.js
// @version: 22.3 — add header, chrome, and .modal-body wrapper

import { markerTypes } from "../types.js";

export function initMarkerModal(db) {
  let modal, headerEl, bodyEl;
  let fldType, fldDef, btnCreate, btnCancel;
  let pendingCoords, onCreate, onSaveCallback;

  // ─── Lifecycle & ESC/backdrop-to-close ─────────────────────────────────────
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

  // ─── Show/hide ─────────────────────────────────────────────────────────────
  function openModal() {
    modal.style.display = "block";
    document.addEventListener("keydown", onKey);
  }
  function closeModal() {
    modal.style.display = "none";
    modal.dispatchEvent(new Event("close"));
    document.removeEventListener("keydown", onKey);
  }

  // ─── Build & style the modal shell ──────────────────────────────────────────
  function ensureBuilt() {
    if (modal) return;

    // Wrapper
    modal = document.createElement("div");
    modal.id = "marker-modal";
    modal.className = "modal--marker";
    Object.assign(modal.style, {
      position: "absolute",
      zIndex:   "1500",
      display:  "none"
    });
    document.body.append(modal);
    attachLifecycle(modal);

    // Header
    headerEl = document.createElement("div");
    headerEl.className = "modal-header";
    headerEl.style.cursor = "move";  // draggable by header
    const title = document.createElement("h2");
    title.textContent = "Marker";
    const closeBtn = document.createElement("span");
    closeBtn.className = "close";
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = closeModal;
    headerEl.append(title, closeBtn);
    modal.append(headerEl);

    // Body wrapper
    bodyEl = document.createElement("div");
    bodyEl.className = "modal-body";
    modal.append(bodyEl);

    // ─── Now build the form rows into bodyEl ──────────────────────────────

    // Type row
    const rowType = document.createElement("label");
    rowType.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.innerHTML = `
      <option value="" disabled selected>Select type…</option>
      ${Object.keys(markerTypes)
        .map(t => `<option value="${t}">${t}</option>`)
        .join("")}
    `;
    rowType.append(fldType);
    bodyEl.append(rowType);

    // Definition row
    const rowDef = document.createElement("label");
    rowDef.textContent = "Definition:";
    fldDef = document.createElement("select");
    fldDef.innerHTML = `<option value="" disabled>Select definition…</option>`;
    rowDef.append(fldDef);
    rowDef.style.display = "none";
    bodyEl.append(rowDef);

    // Button row
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
    bodyEl.append(btnRow);

    // ─── Event wiring ────────────────────────────────────────────────────
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
      const cfg  = markerTypes[type];
      const key  = cfg.defIdKey;
      const id   = fldDef.value;
      if (!type || !key || !id) return;
      const payload = { type, coords: pendingCoords, [key]: id };
      if (onCreate) onCreate(payload);
      else if (onSaveCallback) onSaveCallback(payload);
      closeModal();
    });

    // ─── Drag-to-move via header ─────────────────────────────────────────
    let dragging = false, offsetX = 0, offsetY = 0;
    headerEl.addEventListener("mousedown", e => {
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
      modal.style.top  = `${e.clientY - offsetY}px`;
    }
    function stopDrag() {
      dragging = false;
      document.removeEventListener("mousemove", onDrag);
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────
  return {
    openCreate(coords, type = "", evt, createCb) {
      pendingCoords = coords;
      onCreate      = createCb;
      onSaveCallback = null;
      ensureBuilt();
      fldType.value = type;
      fldType.dispatchEvent(new Event("change"));
      openAt(evt);
    },
    openEdit(markerObj, data, evt, saveCb) {
      pendingCoords  = data.coords;
      onCreate       = null;
      onSaveCallback = saveCb;
      ensureBuilt();
      fldType.value = data.type;
      fldType.dispatchEvent(new Event("change"));
      const key     = markerTypes[data.type].defIdKey;
      fldDef.value  = data[key] || "";
      openAt(evt);
    }
  };

  function openAt(evt) {
    openModal();
    const rect = modal.getBoundingClientRect();
    modal.style.left = `${evt.clientX - rect.width}px`;
    modal.style.top  = `${evt.clientY - rect.height / 2}px`;
  }
}
