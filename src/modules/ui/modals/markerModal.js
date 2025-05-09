// @file: src/modules/ui/modals/markerModal.js
// @version: 20.5 — restore type/predef rows & fieldKit imports

import {
  createSmallModal,
  openSmallModalAt
} from "../uiKit.js";  // façade for smallModal.js

import { loadItemDefinitions }      from "../../services/itemDefinitionsService.js";
import { loadChestDefinitions }     from "../../services/chestDefinitionsService.js";
import { createMarkerForm }         from "../forms/markerForm.js";

// pull in the dropdown & button helpers from fieldKit
import {
  createDropdownField,
  createFormButtonRow
} from "../components/uiKit/fieldKit.js";

export function initMarkerModal(db) {
  let modalApi, form, formApi;
  let fldType, fldPredefItem, fldChestType;
  let rowType, rowPredefItem, rowChestType, rowButtons;
  let itemDefs = {}, chestDefs = {};

  // ── Loaders ───────────────────────────────────────────────────
  async function refreshItems() {
    if (!fldPredefItem) return;
    const list = await loadItemDefinitions(db);
    itemDefs = Object.fromEntries(list.map(d => [d.id, d]));
    fldPredefItem.innerHTML = `<option value="">None (custom)</option>`;
    list.forEach(d => {
      const o = document.createElement("option");
      o.value = d.id; o.textContent = d.name;
      fldPredefItem.appendChild(o);
    });
  }
  async function refreshChests() {
    if (!fldChestType) return;
    const list = await loadChestDefinitions(db);
    chestDefs = Object.fromEntries(list.map(d => [d.id, d]));
    fldChestType.innerHTML = `<option value="">Select Chest Type</option>`;
    list.forEach(d => {
      const o = document.createElement("option");
      o.value = d.id; o.textContent = d.name;
      fldChestType.appendChild(o);
    });
  }

  // ── Build once ─────────────────────────────────────────────────
  function ensureBuilt() {
    if (modalApi) return;

    // 1) Build the inner form via the old createMarkerForm
    formApi = createMarkerForm();
    form    = formApi.form;

    // 2) Manual type selector row
    ({ row: rowType, select: fldType } = createDropdownField(
      "Type:", "fld-type",
      [
        { value: "Door",              label: "Door" },
        { value: "Extraction Portal", label: "Extraction Portal" },
        { value: "Item",              label: "Item" },
        { value: "Chest",             label: "Chest" },
        { value: "Teleport",          label: "Teleport" },
        { value: "Spawn Point",       label: "Spawn Point" }
      ],
      { showColor: false }
    ));
    // placeholder option
    fldType.innerHTML = `<option value="" disabled selected>Select type…</option>` + fldType.innerHTML;

    // 3) Predefined‐Item selector
    ({ row: rowPredefItem, select: fldPredefItem } = createDropdownField(
      "Item:", "fld-predef-item", [], { showColor: false }
    ));

    // 4) Chest‐Type selector
    ({ row: rowChestType, select: fldChestType } = createDropdownField(
      "Chest Type:", "fld-predef-chest", [], { showColor: false }
    ));

    // 5) Buttons
    rowButtons = createFormButtonRow(
      () => modalApi.hide(),
      "Save",
      "Cancel"
    );

    // 6) Assemble form layout
    // Insert Type and predefs at the top
    form.insertBefore(rowType, form.firstChild);
    form.insertBefore(rowPredefItem, form.firstChild.nextSibling);
    form.insertBefore(rowChestType, form.firstChild.nextSibling.nextSibling);

    // Finally append buttons at bottom
    form.appendChild(rowButtons);

    // 7) Create the small modal wrapper
    modalApi = createSmallModal(
      "edit-marker-modal",
      "Edit Marker",
      [form],
      () => modalApi.hide(),
      true  // draggable
    );
    modalApi.root.classList.add("admin-only");

    // 8) Wire type→visibility
    fldType.addEventListener("change", () => {
      const t = fldType.value;
      rowPredefItem.style.display = t === "Item"  ? "flex" : "none";
      formApi.fields.extraRow.style.display = t !== "Chest" ? "block" : "none";
      rowChestType.style.display  = t === "Chest" ? "flex" : "none";
    });

    // 9) Wire item pick → load into formApi
    fldPredefItem.addEventListener("change", () => {
      const def = itemDefs[fldPredefItem.value] || {};
      formApi.setFromDefinition(def);
      formApi.initPickrs();
    });
  }

  // ── Open for edit ────────────────────────────────────────────────
  async function openEdit(markerObj, data, evt, onSave) {
    ensureBuilt();
    await Promise.all([refreshItems(), refreshChests()]);

    // reset
    formApi.setFromDefinition({});
    formApi.initPickrs();
    fldPredefItem.value = "";
    fldChestType.value  = "";

    // pre-fill
    fldType.value = data.type;
    fldType.dispatchEvent(new Event("change"));
    if (data.type === "Item" && data.predefinedItemId) {
      fldPredefItem.value = data.predefinedItemId;
      fldPredefItem.dispatchEvent(new Event("change"));
    }
    if (data.type === "Chest" && data.chestTypeId) {
      fldChestType.value = data.chestTypeId;
    }

    openSmallModalAt(modalApi, evt);

    form.onsubmit = e => {
      e.preventDefault();
      const out = harvest(data.coords);
      onSave(markerObj, out, evt);
      modalApi.hide();
    };
  }

  // ── Open for create ─────────────────────────────────────────────
  async function openCreate(coords, type, evt, onCreate) {
    ensureBuilt();
    await Promise.all([refreshItems(), refreshChests()]);

    // reset & type
    formApi.setFromDefinition({});
    formApi.initPickrs();
    fldPredefItem.value = "";
    fldChestType.value  = "";
    fldType.value       = type || "";
    fldType.dispatchEvent(new Event("change"));

    openSmallModalAt(modalApi, evt);

    form.onsubmit = e => {
      e.preventDefault();
      onCreate(harvest(coords));
      modalApi.hide();
    };
  }

  // ── Harvest values ─────────────────────────────────────────────
  function harvest(coords) {
    const t = fldType.value;
    if (t === "Chest" && fldChestType.value) {
      return { type: t, coords, chestTypeId: fldChestType.value };
    }
    if (t === "Item" && fldPredefItem.value) {
      return {
        type: t,
        coords,
        predefinedItemId: fldPredefItem.value,
        ...formApi.getCustom()
      };
    }
    return { type: t, coords, ...formApi.getCustom() };
  }

  return { openEdit, openCreate };
}
