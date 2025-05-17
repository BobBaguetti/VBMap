// @file: src/modules/ui/modals/markerModal.js
// @version: 22.1 — corrected import path for markerTypes registry

import { createModal, closeModal, openModalAt } from "../../../shared/ui/core/modalKit.js";
import { markerTypes }                         from "../types.js";

export function initMarkerModal(db) {
  let modal, content, fldType, fldDef, btnCreate;
  let pendingCoords, onCreate, onSaveCallback;

  async function ensureBuilt() {
    if (modal) return;

    // 1) Create the modal shell
    const m = createModal({
      id:        "marker-modal",
      title:     "Marker",
      size:      "small",
      draggable: true,
      onClose:   () => closeModal(modal)
    });
    modal   = m.modal;
    content = m.content;
    modal.classList.add("admin-only");

    // 2) Type selector
    const rowType = document.createElement("label");
    rowType.textContent = "Type:";
    fldType = document.createElement("select");
    fldType.innerHTML = `
      <option value="" disabled selected>Select type…</option>
      ${Object.keys(markerTypes)
        .map(type => `<option value="${type}">${type}</option>`)
        .join("")}
    `;
    rowType.appendChild(fldType);

    // 3) Definition selector
    const rowDef = document.createElement("label");
    rowDef.textContent = "Definition:";
    fldDef = document.createElement("select");
    fldDef.innerHTML = `<option value="" disabled>Select definition…</option>`;
    rowDef.appendChild(fldDef);
    rowDef.style.display = "none";

    // 4) Buttons
    const btnRow = document.createElement("div");
    const btnCancel = document.createElement("button");
    btnCancel.textContent = "Cancel";
    btnCancel.type = "button";
    btnCancel.onclick = () => closeModal(modal);

    btnCreate = document.createElement("button");
    btnCreate.textContent = "Create";
    btnCreate.type = "button";

    btnRow.append(btnCancel, btnCreate);

    content.append(rowType, rowDef, btnRow);

    // 5) Handlers
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
      closeModal(modal);
    });
  }

  return {
    openCreate(coords, type, evt, createCb) {
      pendingCoords = coords;
      onCreate      = createCb;
      onSaveCallback= null;
      ensureBuilt().then(() => {
        fldType.value = type || "";
        fldType.dispatchEvent(new Event("change"));
        openModalAt(modal, evt);
      });
    },

    openEdit(markerObj, data, evt, saveCb) {
      pendingCoords  = data.coords;
      onCreate       = null;
      onSaveCallback = saveCb;
      ensureBuilt().then(async () => {
        fldType.value = data.type;
        fldType.dispatchEvent(new Event("change"));
        const defIdKey = markerTypes[data.type].defIdKey;
        fldDef.value   = data[defIdKey] || "";
        openModalAt(modal, evt);
      });
    }
  };
}
