// @file: src/modules/ui/modals/markerModal.js
// @version: 20.4 — use createSmallModal & openSmallModalAt

import {
  createSmallModal,
  openSmallModalAt
} from "../uiKit.js";  // now re-exports smallModal.js

import { loadItemDefinitions }  from "../../services/itemDefinitionsService.js";
import { loadChestDefinitions } from "../../services/chestDefinitionsService.js";
import { createMarkerForm }     from "../forms/markerForm.js";

export function initMarkerModal(db) {
  let modalApi;        // { root, show, hide }
  let form, formApi;
  let fldType, fldPredefItem, fldChestType;
  let rowPredefItem, rowChestType, blockItem;
  let itemDefs = {}, chestDefs = {};

  // ─── Helpers to load & cache definitions ────────────────────────
  async function refreshPredefinedItems() {
    if (!fldPredefItem) return;
    const list = await loadItemDefinitions(db);
    itemDefs = Object.fromEntries(list.map(d => [d.id, d]));
    fldPredefItem.innerHTML = `<option value="">None (custom)</option>`;
    list.forEach(d => {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.name;
      fldPredefItem.appendChild(o);
    });
  }

  async function refreshChestTypes() {
    if (!fldChestType) return;
    const list = await loadChestDefinitions(db);
    chestDefs = Object.fromEntries(list.map(d => [d.id, d]));
    fldChestType.innerHTML = `<option value="">Select Chest Type</option>`;
    list.forEach(d => {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.name;
      fldChestType.appendChild(o);
    });
  }

  // ─── Build the small modal & form once ─────────────────────────
  function ensureBuilt() {
    if (modalApi) return;

    // Build the form fields
    formApi = createMarkerForm();
    form    = formApi.form;

    // Grab references to dynamic rows
    fldType        = form.querySelector("#marker-fld-type");
    rowPredefItem  = form.querySelector("#marker-fld-predef-item").closest(".field-row");
    fldPredefItem  = form.querySelector("#marker-fld-predef-item");
    rowChestType   = form.querySelector("#marker-fld-predef-chest").closest(".field-row");
    fldChestType   = form.querySelector("#marker-fld-predef-chest");

    // Item‐only block (reuse fields from formApi)
    blockItem = document.createElement("div");
    blockItem.classList.add("item-gap");
    blockItem.append(
      formApi.fields.fldItemType.closest(".field-row"),
      formApi.fields.fldRarity.closest(".field-row"),
      formApi.fields.fldDesc.closest(".field-row")
    );

    // Insert blockItem into form under the type selectors
    form.insertBefore(blockItem, formApi.fields.extraRow);

    // Create & register the small modal
    modalApi = createSmallModal(
      "edit-marker-modal",     // id
      "Edit Marker",           // title
      [form],                  // body nodes
      () => modalApi.hide(),   // onClose
      true                     // draggable
    );
    modalApi.root.classList.add("admin-only");

    // ─ Type change: show/hide relevant fields ────────────────────
    fldType.addEventListener("change", () => {
      const t = fldType.value;
      rowPredefItem.style.display = (t === "Item")  ? "flex" : "none";
      blockItem.style.display     = (t === "Item")  ? "block": "none";
      rowChestType.style.display  = (t === "Chest") ? "flex" : "none";
    });

    // ─ Predefined‐Item change: populate the Item sub‐form ───────
    fldPredefItem.addEventListener("change", () => {
      const def = itemDefs[fldPredefItem.value] || {};
      formApi.setFromDefinition(def);
      formApi.initPickrs();
    });
  }

  // ─── Open for editing an existing marker ────────────────────────
  async function openEdit(markerObj, data, evt, onSave) {
    ensureBuilt();
    await Promise.all([ refreshPredefinedItems(), refreshChestTypes() ]);

    // Reset form state
    fldPredefItem.value = "";
    fldChestType.value  = "";
    formApi.setFromDefinition({});
    formApi.initPickrs();

    // Pre-fill type & specific dropdowns
    fldType.value = data.type;
    fldType.dispatchEvent(new Event("change"));

    if (data.type === "Item" && data.predefinedItemId) {
      fldPredefItem.value = data.predefinedItemId;
      fldPredefItem.dispatchEvent(new Event("change"));
    }
    if (data.type === "Chest" && data.chestTypeId) {
      fldChestType.value = data.chestTypeId;
    }

    // Position & show modal
    openSmallModalAt(modalApi, evt);

    // Wire submit
    form.onsubmit = e => {
      e.preventDefault();
      const out = harvest(data.coords);
      onSave(markerObj, out, evt);
      modalApi.hide();
    };
  }

  // ─── Open for creating a new marker ────────────────────────────
  async function openCreate(coords, type, evt, onCreate) {
    ensureBuilt();
    await Promise.all([ refreshPredefinedItems(), refreshChestTypes() ]);

    // Reset everything
    fldPredefItem.value = "";
    fldChestType.value  = "";
    formApi.setFromDefinition({});
    formApi.initPickrs();

    fldType.value = type || "";
    fldType.dispatchEvent(new Event("change"));

    openSmallModalAt(modalApi, evt);

    form.onsubmit = e => {
      e.preventDefault();
      const out = harvest(coords);
      onCreate(out);
      modalApi.hide();
    };
  }

  // ─── Gather form values into a marker payload ────────────────
  function harvest(coords) {
    const type = fldType.value;
    if (type === "Chest" && fldChestType.value) {
      return { type, coords, chestTypeId: fldChestType.value };
    }
    if (type === "Item" && fldPredefItem.value) {
      return {
        type,
        coords,
        predefinedItemId: fldPredefItem.value,
        ...formApi.getCustom()
      };
    }
    return { type, coords, ...formApi.getCustom() };
  }

  return { openEdit, openCreate };
}
