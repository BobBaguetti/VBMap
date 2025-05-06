// @file: /scripts/modules/ui/modals/markerModal.js
// @version: 20.4 – fully integrated with modalHelpers, fieldBuilders, formButtonRow, layoutSwitcher

import {
  createModal,
  closeModal,
  openModalAt
} from "../components/modalHelpers.js";
import { createDropdownField }  from "../components/fieldBuilders.js";
import { createFormButtonRow }  from "../components/formButtonRow.js";
import { createLayoutSwitcher } from "../components/layoutSwitcher.js";

import { loadItemDefinitions }  from "../../services/itemDefinitionsService.js";
import { loadChestDefinitions } from "../../services/chestDefinitionsService.js";
import { createMarkerForm }     from "../forms/markerForm.js";

export function initMarkerModal(db) {
  let modal, content, form;
  let fldType, fldPredefItem, fldChestType, blockItem, formApi, rowButtons;
  let itemDefs = {}, chestDefs = {};

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

  function ensureBuilt() {
    if (modal) return;

    // create modal shell
    const created = createModal({
      id:          "edit-marker-modal",
      title:       "Edit Marker",
      size:        "small",
      backdrop:    false,
      draggable:   true,
      withDivider: true,
      onClose:     () => closeModal(modal)
    });
    modal   = created.modal;
    content = created.content;
    modal.classList.add("admin-only");

    // layout switcher into header
    const layoutSwitcher = createLayoutSwitcher({
      available:   ["form"],
      defaultView: "form",
      onChange:    () => {}
    });
    content.insertBefore(layoutSwitcher, content.firstChild);

    // form
    form = document.createElement("form");
    form.id = "edit-form";

    // Type dropdown
    const { row: rowType, select: selectType } = createDropdownField(
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
    );
    selectType.insertAdjacentHTML("afterbegin", `<option value="" disabled selected>Select type…</option>`);
    fldType = selectType;

    // Predef item
    const {
      row: rowPredefItem,
      select: fldPredefItem
    } = createDropdownField("Item:", "fld-predef-item", [], { showColor: false });

    // Chest type
    const {
      row: rowChestType,
      select: fldChestType
    } = createDropdownField("Chest Type:", "fld-predef-chest", [], { showColor: false });

    // markerForm
    formApi = createMarkerForm();
    blockItem = document.createElement("div");
    blockItem.classList.add("item-gap");
    blockItem.append(
      formApi.fields.fldItemType.closest(".field-row"),
      formApi.fields.fldRarity.closest(".field-row"),
      formApi.fields.fldDesc.closest(".field-row")
    );

    // buttons
    rowButtons = createFormButtonRow(
      () => closeModal(modal),
      "Save",
      "Cancel"
    );

    // assemble
    form.append(
      formApi.fields.fldName.closest(".field-row"),
      rowType,
      rowPredefItem,
      rowChestType,
      blockItem,
      formApi.fields.extraRow,
      formApi.fields.fldImgS.closest(".field-row"),
      formApi.fields.fldImgL.closest(".field-row"),
      formApi.fields.fldVid.closest(".field-row"),
      rowButtons
    );
    content.appendChild(form);

    // show/hide logic
    fldType.onchange = () => {
      const t = fldType.value;
      rowPredefItem.style.display = t === "Item"  ? "flex" : "none";
      blockItem.style.display     = t === "Item"  ? "block": "none";
      rowChestType.style.display  = t === "Chest" ? "flex" : "none";
    };

    fldPredefItem.onchange = () => {
      const def = itemDefs[fldPredefItem.value] || {};
      formApi.setFromDefinition(def);
      formApi.initPickrs();
    };

    // initial load
    refreshPredefinedItems();
    refreshChestTypes();
    formApi.setFromDefinition({});
    formApi.initPickrs();
  }

  async function openEdit(markerObj, data, evt, onSave) {
    ensureBuilt();
    await Promise.all([ refreshPredefinedItems(), refreshChestTypes() ]);

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
    if (data.type !== "Item") {
      formApi.setFromDefinition({});
      formApi.initPickrs();
    }

    openModalAt(modal, evt);
    form.onsubmit = e => {
      e.preventDefault();
      const out = harvest(data.coords);
      onSave(markerObj, out, evt);
      closeModal(modal);
    };
  }

  async function openCreate(coords, type, evt, onCreate) {
    ensureBuilt();
    await Promise.all([ refreshPredefinedItems(), refreshChestTypes() ]);

    fldPredefItem.value = "";
    fldChestType.value  = "";
    formApi.setFromDefinition({});
    formApi.initPickrs();

    fldType.value = type || "";
    fldType.dispatchEvent(new Event("change"));

    openModalAt(modal, evt);
    form.onsubmit = e => {
      e.preventDefault();
      const out = harvest(coords);
      onCreate(out);
      closeModal(modal);
    };
  }

  function harvest(coords) {
    const type = fldType.value;
    if (type === "Chest" && fldChestType.value) {
      return { type, coords, chestTypeId: fldChestType.value };
    }
    if (type === "Item" && fldPredefItem.value) {
      return { type, coords, predefinedItemId: fldPredefItem.value, ...formApi.getCustom() };
    }
    return { type, coords, ...formApi.getCustom() };
  }

  return { openEdit, openCreate };
}
