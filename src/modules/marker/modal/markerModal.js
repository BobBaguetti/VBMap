// @file: src/modules/marker/modal/markerModal.js
// @version: 22.4 — use .floating/.hidden and settingsModal-style chrome

import { markerTypes } from "../types.js";

export function initMarkerModal(db) {
  let panel, fldType, fldDef, btnCreate, btnCancel;
  let pendingCoords, onCreate, onSaveCallback;

  // Build the floating panel once
  function ensureBuilt() {
    if (panel) return;

    panel = document.createElement("div");
    panel.id = "marker-modal";
    panel.classList.add("floating", "hidden");
    panel.innerHTML = `
      <div class="modal-content">
        <header class="drag-handle modal-header">
          <h3>Create Marker</h3>
          <button class="modal-close" aria-label="Close">&times;</button>
        </header>
        <section class="modal-body">
          <label>
            Type:
            <select id="marker-type">
              <option value="" disabled selected>Select type…</option>
              ${Object.keys(markerTypes).map(
                t => `<option value="${t}">${t}</option>`
              ).join("")}
            </select>
          </label>
          <label id="marker-def-row" style="display:none">
            Definition:
            <select id="marker-def">
              <option value="" disabled>Select definition…</option>
            </select>
          </label>
          <div class="modal-buttons">
            <button type="button" id="marker-cancel">Cancel</button>
            <button type="button" id="marker-create">Create</button>
          </div>
        </section>
      </div>
    `.trim();

    document.body.appendChild(panel);

    // Wire close
    panel.querySelector(".modal-close").addEventListener("click", close);
    // Grab elements
    fldType   = panel.querySelector("#marker-type");
    fldDef    = panel.querySelector("#marker-def");
    btnCancel = panel.querySelector("#marker-cancel");
    btnCreate = panel.querySelector("#marker-create");

    btnCancel.addEventListener("click", close);

    // On type change, load defs
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
      panel.querySelector("#marker-def-row").style.display = "";
    });

    // Create button
    btnCreate.addEventListener("click", () => {
      const type = fldType.value;
      const cfg  = markerTypes[type];
      const key  = cfg.defIdKey;
      const id   = fldDef.value;
      if (!type || !key || !id) return;
      const payload = { type, coords: pendingCoords, [key]: id };
      if (onCreate) onCreate(payload);
      else if (onSaveCallback) onSaveCallback(payload);
      close();
    });

    // Draggable via header
    const handle = panel.querySelector(".drag-handle");
    let dragging = false, startX, startY, startLeft, startTop;
    handle.addEventListener("pointerdown", e => {
      e.preventDefault();
      dragging = true;
      const rect = panel.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY;
      startLeft = rect.left; startTop = rect.top;
      window.addEventListener("pointermove", onDrag);
      window.addEventListener("pointerup", () => {
        dragging = false;
        window.removeEventListener("pointermove", onDrag);
      }, { once: true });
    });
    function onDrag(e) {
      if (!dragging) return;
      panel.style.left = `${startLeft + (e.clientX - startX)}px`;
      panel.style.top  = `${startTop  + (e.clientY - startY)}px`;
    }
  }

  function open(coords, titleText = "Create Marker", evt, createCb, editPayload, saveCb) {
    pendingCoords   = coords;
    onCreate        = createCb;
    onSaveCallback  = saveCb;
    ensureBuilt();
    // Update header text
    panel.querySelector(".modal-header h3").textContent = titleText;
    // Reset form
    fldType.value = editPayload?.type || "";
    panel.querySelector("#marker-def-row").style.display = "none";
    fldDef.innerHTML = `<option value="" disabled>Select definition…</option>`;
    // If editing, prefill
    if (editPayload) {
      const { type, ...data } = editPayload;
      fldType.value = type;
      fldType.dispatchEvent(new Event("change"));
      window.setTimeout(() => {
        const key = markerTypes[type].defIdKey;
        fldDef.value = data[key] || "";
      }, 100);
    }
    // Show panel
    panel.classList.remove("hidden");
    // Position at click
    const rect = panel.getBoundingClientRect();
    panel.style.left = `${evt.clientX - rect.width}px`;
    panel.style.top  = `${evt.clientY - rect.height/2}px`;
  }

  function close() {
    panel.classList.add("hidden");
    panel.dispatchEvent(new Event("close"));
  }

  return {
    openCreate(coords, type = "", evt, createCb) {
      open(coords, "Create Marker", evt, createCb, null, null);
    },
    openEdit(markerObj, data, evt, saveCb) {
      open(data.coords, "Edit Marker", evt, null, data, saveCb);
    }
  };
}
