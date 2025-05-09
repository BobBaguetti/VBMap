// @file: src/modules/ui/modals/markerModal.js
// @version: 20.6 — restore edit-form ID so CSS gap applies

import {
  createSmallModal,
  openSmallModalAt
} from "../uiKit.js";

import { loadItemDefinitions }  from "../../services/itemDefinitionsService.js";
import { loadChestDefinitions } from "../../services/chestDefinitionsService.js";
import { createMarkerForm }     from "../forms/markerForm.js";

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
    // ✏️ ensure the form has the old ID so the CSS gap rule applies
    form.id = "edit-form";

    // 2) Type selector
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
    fldType.innerHTML =
      `<option value="" disabled selected>Select type…</option>` +
      fldType.innerHTML;

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
    form.insertBefore(rowType, form.firstChild);
    form.insertBefore(rowPredefItem, form.firstChild.nextSibling);
    form.insertBefore(rowChestType, form.firstChild.nextSibling.nextSibling);
    form.appendChild(rowButtons);

    // 7) Create the small modal wrapper (draggable + divider)
    modalApi = createSmallModal(
      "edit-marker-modal",
      "Edit Marker",
      [form],
      () => modalApi.hide(),
      true,   // draggable
      true    // withDivider
    );
    modalApi.root.classList.add("admin-only");

    // 8) Wire type→visibility
    fldType.addEventListener("change", () => {
      const t = fldType.value;
      rowPredefItem.style.display = t === "Item"  ? "flex" : "none";
      rowChestType.style.display  = t === "Chest" ? "flex" : "none";
      formApi.fields.extraRow.style.display =
        t !== "Chest" ? "block" : "none";
    });

    // 9) Wire item‐pick to populate
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

    formApi.setFromDefinition({});
    formApi.initPickrs();
    fldPredefItem.value = "";
    fldChestType.value  = "";

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
      onSave(markerObj, harvest(data.coords), evt);
      modalApi.hide();
    };
  }

  // ── Open for create ─────────────────────────────────────────────
  async function openCreate(coords, type, evt, onCreate) {
    ensureBuilt();
    await Promise.all([refreshItems(), refreshChests()]);

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
