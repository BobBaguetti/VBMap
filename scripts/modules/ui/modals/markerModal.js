// @file: /scripts/modules/ui/modals/markerModal.js
// @version: 14 — restored backdrop:false and lazy build

import { createModal, closeModal, openModalAt } from "../uiKit.js";
import { loadItemDefinitions }                 from "../../services/itemDefinitionsService.js";
import { createFormButtonRow, createDropdownField } from "../uiKit.js";
import { createMarkerForm }                    from "../forms/markerForm.js";

export function initMarkerModal(db) {
  // these will be set on first use
  let modal, content, form;
  let fldType, fldPredef, blockItem, formApi, rowButtons;
  let defs = {};

  // Load definitions into the dropdown
  async function refreshPredefinedItems() {
    if (!fldPredef) return;
    const list = await loadItemDefinitions(db);
    defs = Object.fromEntries(list.map(d => [d.id, d]));
    fldPredef.innerHTML = `<option value="">None (custom)</option>`;
    for (const d of list) {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.name;
      fldPredef.appendChild(o);
    }
  }

  // Build the modal on first open
  function ensureBuilt() {
    if (modal) return;

    const created = createModal({
      id:         "edit-marker-modal",
      title:      "Edit Marker",
      size:       "small",
      backdrop:   false,    // no overlay
      draggable:  true,
      withDivider:true,
      onClose:    () => closeModal(modal)
    });
    modal   = created.modal;
    content = created.content;

    modal.classList.add("admin-only");

    // Form setup
    form = document.createElement("form");
    form.id = "edit-form";

    // Type dropdown
    const { row: rowType, select: selectType } =
      createDropdownField("Type:", "fld-type", [
        { value: "Door", label: "Door" },
        { value: "Extraction Portal", label: "Extraction Portal" },
        { value: "Item", label: "Item" },
        { value: "Teleport", label: "Teleport" },
        { value: "Spawn Point", label: "Spawn Point" }
      ], { showColor: false });
    fldType = selectType;

    // Predefined dropdown
    const { row: rowPredef, select: selectPredef } =
      createDropdownField("Item:", "fld-predef", [], { showColor: false });
    fldPredef = selectPredef;

    // Marker form API + button row
    formApi    = createMarkerForm();
    rowButtons = createFormButtonRow();
    // Hook Cancel
    const cancelBtn = rowButtons.querySelector('button[type="button"]');
    if (cancelBtn) cancelBtn.onclick = e => {
      e.preventDefault();
      closeModal(modal);
    };

    // Group item-specific rows
    blockItem = document.createElement("div");
    blockItem.classList.add("item-gap");
    blockItem.append(
      formApi.fields.fldRarity.closest(".field-row"),
      formApi.fields.fldItemType.closest(".field-row"),
      formApi.fields.fldDesc.closest(".field-row")
    );

    // Assemble form
    form.append(
      formApi.fields.fldName.closest(".field-row"),
      rowType,
      rowPredef,
      blockItem,
      formApi.fields.extraRow,
      formApi.fields.fldImgS.closest(".field-row"),
      formApi.fields.fldImgL.closest(".field-row"),
      formApi.fields.fldVid.closest(".field-row"),
      rowButtons
    );
    content.appendChild(form);

    // Toggle item-specific fields
    fldType.onchange = () => {
      const isItem = fldType.value === "Item";
      blockItem.style.display = isItem ? "block" : "none";
      rowPredef.style.display = isItem ? "flex"  : "none";
    };
    fldPredef.onchange = () => {
      const def = defs[fldPredef.value] || {};
      formApi.setFromDefinition(def);
      formApi.initPickrs();
    };

    // Initial load
    refreshPredefinedItems();
  }

  // Open existing-marker editor
  async function openEdit(markerObj, data, evt, onSave) {
    ensureBuilt();
    await refreshPredefinedItems();
    formApi.setFromDefinition(data);
    formApi.initPickrs();
    openModalAt(modal, evt);
    form.onsubmit = e => {
      e.preventDefault();
      Object.assign(data, harvest(data.coords));
      onSave(data);
      closeModal(modal);
    };
  }

  // Open create-new-marker editor
  async function openCreate(coords, type, evt, onCreate) {
    ensureBuilt();
    await refreshPredefinedItems();
    formApi.setFromDefinition({ type });
    formApi.initPickrs();
    openModalAt(modal, evt);
    form.onsubmit = e => {
      e.preventDefault();
      onCreate(harvest(coords));
      closeModal(modal);
    };
  }

  // Harvest form data
  function harvest(coords) {
    const type = fldType.value;
    const sel  = fldPredef.value;
    if (type === "Item" && sel && defs[sel]) {
      const d = defs[sel];
      return {
        type, coords,
        predefinedItemId: sel,
        name:             d.name,
        nameColor:        d.nameColor  || "#E5E6E8",
        itemType:         d.itemType   || "",
        itemTypeColor:    d.itemTypeColor || "#E5E6E8",
        rarity:           d.rarity     || "",
        rarityColor:      d.rarityColor  || "#E5E6E8",
        description:      d.description || "",
        descriptionColor: d.descriptionColor || "#E5E6E8",
        extraLines:       d.extraLines || [],
        imageSmall:       d.imageSmall || "",
        imageBig:         (d.imageBig ?? d.imageLarge) || "",
        video:            d.video || ""
      };
    }
    const c = formApi.getCustom();
    return { type, coords, ...c, imageBig: c.imageBig || "" };
  }

  return { openEdit, openCreate, refreshPredefinedItems };
}
