// @file: src/modules/ui/modals/markerModal.js
// @version: 22.0 — simplified, registry‐driven marker creation modal

import { createModal, closeModal, openModalAt } from "../components/uiKit/modalKit.js";
import { markerTypes }                           from "../../modules/marker/types.js";

export function initMarkerModal(db) {
  let modal, content, fldType, fldDef, btnCreate;
  let pendingCoords, pendingType, onCreate, onEdit, onSaveCallback;

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
      // Load definitions for this type
      const cfg = markerTypes[type];
      const defs = await cfg.loadDefinitions(db);
      // Populate dropdown
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
      const defIdKey = markerTypes[type]?.defIdKey;
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
    /**
     * Open the modal for creating a new marker.
     * @param {[number,number]} coords – [lat, lng]
     * @param {string} type            – optional preselected type
     * @param {MouseEvent} evt         – original event for positioning
     * @param {Function} createCb      – callback receiving payload
     */
    openCreate(coords, type, evt, createCb) {
      pendingCoords = coords;
      onCreate      = createCb;
      onSaveCallback= null;
      pendingType   = type || "";
      ensureBuilt().then(() => {
        fldType.value = pendingType;
        fldType.dispatchEvent(new Event("change"));
        openModalAt(modal, evt);
      });
    },

    /**
     * Open the modal for editing an existing marker instance.
     * (prepopulates type/definition and uses onSaveCallback)
     * @param {L.Marker} markerObj
     * @param {object} data – marker data with type & defIdKey
     * @param {MouseEvent} evt
     * @param {Function} saveCb
     */
    openEdit(markerObj, data, evt, saveCb) {
      pendingCoords  = data.coords;
      onCreate       = null;
      onSaveCallback = saveCb;
      ensureBuilt().then(async () => {
        fldType.value = data.type;
        fldType.dispatchEvent(new Event("change"));
        const key = markerTypes[data.type].defIdKey;
        fldDef.value  = data[key] || "";
        openModalAt(modal, evt);
      });
    }
  };
}
