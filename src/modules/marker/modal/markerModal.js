// @file: src/modules/marker/modal/markerModal.js
// @version: 1.0 — rewrite using createModalShell for consistent open/close

import { createModalShell } from "../../definition/modal/lifecycle.js";
import { markerTypes }     from "../types.js";

/**
 * Initializes the Marker modal, returning openCreate and openEdit functions.
 *
 * openCreate(coords, type, evt, createCb)
 * openEdit(markerObj, data, evt, saveCb)
 */
export function initMarkerModal(db) {
  // 1) Create the shell
  const { modalEl, open, close } = createModalShell("marker-modal");
  modalEl.classList.add("modal--marker");

  // 2) Build static DOM
  const content = document.createElement("div");
  content.className = "modal-content";
  modalEl.append(content);

  // Type selector
  const lblType = document.createElement("label");
  lblType.textContent = "Type:";
  const fldType = document.createElement("select");
  fldType.innerHTML = `
    <option value="" disabled>Select type…</option>
    ${Object.keys(markerTypes).map(
      t => `<option value="${t}">${t}</option>`
    ).join("")}
  `;
  lblType.appendChild(fldType);
  content.appendChild(lblType);

  // Definition selector
  const lblDef = document.createElement("label");
  lblDef.textContent = "Definition:";
  const fldDef = document.createElement("select");
  fldDef.innerHTML = `<option value="" disabled>Select definition…</option>`;
  lblDef.style.display = "none";
  lblDef.appendChild(fldDef);
  content.appendChild(lblDef);

  // Buttons
  const btnRow = document.createElement("div");
  btnRow.className = "modal-buttons";
  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.textContent = "Cancel";
  btnCancel.onclick = () => { close(); };
  const btnAction = document.createElement("button");
  btnAction.type = "button";
  btnAction.textContent = "Create";
  btnRow.append(btnCancel, btnAction);
  content.append(btnRow);

  // 3) State
  let pendingCoords, onCreate, onSave;
  let currentMode = "create"; // or "edit"

  // 4) Handlers
  fldType.addEventListener("change", async () => {
    const type = fldType.value;
    if (!type) return;
    // Load definitions for this type
    const defs = await markerTypes[type].loadDefinitions(db);
    fldDef.innerHTML = `
      <option value="" disabled selected>Select ${type}…</option>
      ${defs
        .filter(markerTypes[type].showInSidebar)
        .map(d => `<option value="${d.id}">${d.name || d.id}</option>`)
        .join("")}
    `;
    lblDef.style.display = "";
  });

  btnAction.addEventListener("click", () => {
    const type = fldType.value;
    const defId = fldDef.value;
    if (!type || !defId) return;
    const key = markerTypes[type].defIdKey;
    const payload = { type, coords: pendingCoords, [key]: defId };

    if (currentMode === "create") {
      onCreate?.(payload);
    } else {
      onSave?.(payload);
    }
    close();
  });

  // 5) Public API
  function openCreate(coords, type = "", evt, createCb) {
    currentMode  = "create";
    onCreate     = createCb;
    onSave       = null;
    btnAction.textContent = "Create";

    pendingCoords = coords;
    fldType.value = type;
    fldType.dispatchEvent(new Event("change"));

    // Position & open
    open();
    positionAtEvent(evt);
  }

  function openEdit(_markerObj, data, evt, saveCb) {
    currentMode  = "edit";
    onCreate     = null;
    onSave       = saveCb;
    btnAction.textContent = "Save";

    pendingCoords = data.coords;
    fldType.value = data.type;
    fldType.dispatchEvent(new Event("change"));

    // After defs load, set the correct definition value
    setTimeout(() => {
      fldDef.value = data[markerTypes[data.type].defIdKey] || "";
    }, 0);

    open();
    positionAtEvent(evt);
  }

  function positionAtEvent(evt) {
    const rect = content.getBoundingClientRect();
    content.style.position = "absolute";
    content.style.left     = `${evt.clientX - rect.width}px`;
    content.style.top      = `${evt.clientY - rect.height / 2}px`;
  }

  return { openCreate, openEdit };
}
