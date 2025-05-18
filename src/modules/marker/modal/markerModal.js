// @file: src/modules/ui/modals/markerModal.js
// @version: 22.3 — switch from modalFactory to createMarkerModal

import { createMarkerModal } from "../../../shared/ui/core/createMarkerModal.js";
import { markerTypes }       from "../types.js";

export function initMarkerModal(db) {
  let modalApi, content, fldType, fldDef, btnCreate;
  let pendingCoords, onCreate, onSaveCallback;

  async function ensureBuilt() {
    if (modalApi) return;

    // 1) Instantiate via factory
    modalApi = createMarkerModal({
      id:      "marker-modal",
      title:   "Marker",
      onClose: () => modalApi.close()
    });
    const { modal, content: cnt, openAt } = modalApi;
    content = cnt;
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

    // 4) Button row
    const btnRow = document.createElement("div");
    const btnCancel = document.createElement("button");
    btnCancel.textContent = "Cancel";
    btnCancel.type = "button";
    btnCancel.onclick = () => modalApi.close();

    btnCreate = document.createElement("button");
    btnCreate.textContent = "Create";
    btnCreate.type = "button";

    btnRow.append(btnCancel, btnCreate);

    content.append(rowType, rowDef, btnRow);

    // 5) Load definitions on type change
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

    // 6) Create / Save handler
    btnCreate.addEventListener("click", () => {
      const type = fldType.value;
      const cfg  = markerTypes[type];
      const key  = cfg.defIdKey;
      const def  = fldDef.value;
      if (!type || !key || !def) return;
      const payload = { type, coords: pendingCoords, [key]: def };
      if (onCreate) {
        onCreate(payload);
      } else if (onSaveCallback) {
        onSaveCallback(payload);
      }
      modalApi.close();
    });

    // Expose openAt for outside use
    modalApi.openAt = openAt;
  }

  return {
    openCreate(coords, type, evt, createCb) {
      pendingCoords   = coords;
      onCreate        = createCb;
      onSaveCallback  = null;
      ensureBuilt().then(() => {
        fldType.value = type || "";
        fldType.dispatchEvent(new Event("change"));
        modalApi.openAt(evt);
      });
    },

    openEdit(markerObj, data, evt, saveCb) {
      pendingCoords   = data.coords;
      onCreate        = null;
      onSaveCallback  = saveCb;
      ensureBuilt().then(() => {
        fldType.value = data.type;
        fldType.dispatchEvent(new Event("change"));
        const defKey = markerTypes[data.type].defIdKey;
        fldDef.value = data[defKey] || "";
        modalApi.openAt(evt);
      });
    }
  };
}
