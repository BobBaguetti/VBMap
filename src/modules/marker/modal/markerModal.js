// @file: src/modules/marker/modal/markerModal.js
// @version: 22.6 — explicit inline styling for visible surface + draggable

import { markerTypes } from "../types.js";

/**
 * Initializes the Create/Edit Marker panel.
 * Returns an object with openCreate and openEdit methods.
 */
export function initMarkerModal(db) {
  let panel, fldType, fldDef, btnCreate, btnCancel, titleEl;
  let pendingCoords, onCreate, onSaveCallback;

  function ensureBuilt() {
    if (panel) return;

    // 1) Container
    panel = document.createElement("div");
    panel.id = "marker-modal";
    Object.assign(panel.style, {
      position: "absolute",
      zIndex:   "2000",
      display:  "none",
      background: "#fff",
      border: "1px solid #ccc",
      borderRadius: "6px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      fontFamily: "sans-serif",
      minWidth: "240px"
    });
    document.body.append(panel);

    // 2) Header (drag handle)
    const header = document.createElement("div");
    header.style.cssText = `
      cursor: move;
      padding: 0.5em 0.75em;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    titleEl = document.createElement("span");
    titleEl.textContent = "Create Marker";
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      font-size: 1.2em;
      line-height: 1;
      cursor: pointer;
    `;
    closeBtn.onclick = hide;
    header.append(titleEl, closeBtn);
    panel.append(header);

    // 3) Body
    const body = document.createElement("div");
    body.style.padding = "0.75em";
    panel.append(body);

    // Type row
    const rowType = document.createElement("div");
    rowType.style.marginBottom = "0.6em";
    rowType.innerHTML = `
      <label style="display:block; margin-bottom:0.3em;">Type:</label>
      <select id="marker-type" style="width:100%; padding:0.4em;">
        <option value="" disabled selected>Select type…</option>
        ${Object.keys(markerTypes)
          .map(t => `<option value="${t}">${t}</option>`)
          .join("")}
      </select>
    `;
    body.append(rowType);

    // Definition row
    const rowDef = document.createElement("div");
    rowDef.id = "marker-def-row";
    rowDef.style.marginBottom = "0.6em";
    rowDef.style.display = "none";
    rowDef.innerHTML = `
      <label style="display:block; margin-bottom:0.3em;">Definition:</label>
      <select id="marker-def" style="width:100%; padding:0.4em;">
        <option value="" disabled>Select definition…</option>
      </select>
    `;
    body.append(rowDef);

    // Buttons
    const btnRow = document.createElement("div");
    btnRow.style.textAlign = "right";
    btnCreate = document.createElement("button");
    btnCreate.textContent = "Save";
    btnCreate.style.cssText = `
      margin-left:0.5em; padding:0.4em 0.8em; 
      background:#2a6; color:#fff; border:none; border-radius:4px;
      cursor:pointer;
    `;
    btnCancel = document.createElement("button");
    btnCancel.textContent = "Cancel";
    btnCancel.style.cssText = `
      padding:0.4em 0.8em; background:#eee; border:none; border-radius:4px;
      cursor:pointer;
    `;
    btnCancel.onclick = hide;
    btnRow.append(btnCancel, btnCreate);
    body.append(btnRow);

    // Wire events
    fldType = panel.querySelector("#marker-type");
    fldDef  = panel.querySelector("#marker-def");

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
      titleEl.textContent = onCreate
        ? `Create ${type} Marker`
        : `Edit ${type} Marker`;
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
      hide();
    });

    // Drag-to-move
    let dragging = false, startX, startY, startLeft, startTop;
    header.addEventListener("pointerdown", e => {
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
    panel.style.display = "block";
    // Position to the left of click
    const rect = panel.getBoundingClientRect();
    panel.style.left = `${evt.clientX - rect.width}px`;
    panel.style.top  = `${evt.clientY - rect.height / 2}px`;
  }

  function hide() {
    if (panel) panel.style.display = "none";
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
      fldDef.value = data[markerTypes[data.type].defIdKey] || "";
    }
  };
}
