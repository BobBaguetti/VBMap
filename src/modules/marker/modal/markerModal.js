// @file: src/modules/marker/modal/markerModal.js
// @version: 22.8 — apply marker-specific CSS from styles/components/modal/marker/marker.css

import { markerTypes } from "../types.js";

/**
 * Initializes the Create/Edit Marker panel.
 * Returns { openCreate, openEdit }.
 */
export function initMarkerModal(db) {
  let panel, fldType, fldDef, btnCreate, btnCancel, titleEl;
  let pendingCoords, onCreate, onSaveCallback;
  let outsideClickListener;

  function ensureBuilt() {
    if (panel) return;

    // Container
    panel = document.createElement("div");
    panel.id = "marker-modal";
    panel.classList.add("floating", "hidden");
    document.body.append(panel);

    // Inner structure
    panel.innerHTML = `
      <div class="modal-content">
        <header class="modal-header drag-handle">
          <h3>Create Marker</h3>
          <button class="modal-close" aria-label="Close">&times;</button>
        </header>
        <section class="modal-body">
          <div class="form-row">
            <label for="marker-type">Type:</label>
            <select id="marker-type" class="form-control">
              <option value="" disabled selected>Select type…</option>
              ${Object.keys(markerTypes)
                .map(t => `<option value="${t}">${t}</option>`)
                .join("")}
            </select>
          </div>
          <div class="form-row" id="marker-def-row">
            <label for="marker-def">Definition:</label>
            <select id="marker-def" class="form-control">
              <option value="" disabled selected>Select definition…</option>
            </select>
          </div>
          <div class="modal-buttons">
            <button type="button" class="ui-button secondary" id="marker-cancel">Cancel</button>
            <button type="button" class="ui-button primary" id="marker-create">Save</button>
          </div>
        </section>
      </div>
    `.trim();

    // Element refs
    titleEl   = panel.querySelector(".modal-header h3");
    fldType   = panel.querySelector("#marker-type");
    fldDef    = panel.querySelector("#marker-def");
    btnCancel = panel.querySelector("#marker-cancel");
    btnCreate = panel.querySelector("#marker-create");
    const closeBtn = panel.querySelector(".modal-close");
    const defRow   = panel.querySelector("#marker-def-row");

    // Initially hide definition row
    defRow.style.display = "none";

    // Close handlers
    closeBtn.addEventListener("click", hide);
    btnCancel.addEventListener("click", hide);

    // Type → Definition wiring
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
      defRow.style.display = "";
      titleEl.textContent = onCreate
        ? `Create ${type} Marker`
        : `Edit ${type} Marker`;
    });

    // Save/Create
    btnCreate.addEventListener("click", () => {
      const type = fldType.value;
      const cfg  = markerTypes[type];
      const key  = cfg.defIdKey;
      const id   = fldDef.value;
      if (!type || !key || !id) return;
      const payload = { type, coords: pendingCoords, [key]: id };
      if (onCreate) onCreate(payload);
      else if (onSaveCallback) onSaveCallback(payload);
      hide();
    });

    // Draggable via header
    const handle = panel.querySelector(".drag-handle");
    let startX, startY, startLeft, startTop, dragging = false;
    handle.addEventListener("pointerdown", e => {
      e.preventDefault();
      dragging = true;
      const rect = panel.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop  = rect.top;
      window.addEventListener("pointermove", onDrag);
      window.addEventListener("pointerup", onUp, { once: true });
    });
    function onDrag(e) {
      if (!dragging) return;
      panel.style.left = `${startLeft + e.clientX - startX}px`;
      panel.style.top  = `${startTop  + e.clientY - startY}px`;
    }
    function onUp() {
      dragging = false;
      window.removeEventListener("pointermove", onDrag);
    }
  }

  function showAt(evt, mode) {
    ensureBuilt();
    // Close any existing
    hide();

    panel.classList.remove("hidden");

    // Position to left of click
    const rect = panel.getBoundingClientRect();
    panel.style.left = `${evt.clientX - rect.width}px`;
    panel.style.top  = `${evt.clientY - rect.height / 2}px`;

    // Outside click closes
    outsideClickListener = e => {
      if (!panel.contains(e.target)) hide();
    };
    document.addEventListener("mousedown", outsideClickListener);

    // Esc closes
    document.addEventListener("keydown", onKey);
  }

  function hide() {
    if (!panel || panel.classList.contains("hidden")) return;
    panel.classList.add("hidden");
    document.removeEventListener("mousedown", outsideClickListener);
    document.removeEventListener("keydown", onKey);
  }

  function onKey(e) {
    if (e.key === "Escape") hide();
  }

  return {
    openCreate(coords, type = "", evt, createCb) {
      pendingCoords  = coords;
      onCreate       = createCb;
      onSaveCallback = null;
      showAt(evt, "create");
      fldType.value = type;
      fldType.dispatchEvent(new Event("change"));
    },
    openEdit(markerObj, data, evt, saveCb) {
      pendingCoords  = data.coords;
      onCreate       = null;
      onSaveCallback = saveCb;
      showAt(evt, "edit");
      fldType.value = data.type;
      fldType.dispatchEvent(new Event("change"));
      fldDef.value  = data[markerTypes[data.type].defIdKey] || "";
    }
  };
}
 