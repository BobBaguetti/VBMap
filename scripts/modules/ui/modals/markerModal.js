// @file: /scripts/modules/ui/modals/markerModal.js
// @version: 13 — improved backdrop and close behavior

import { createModal, closeModal, openModalAt } from "../uiKit.js";
import { loadItemDefinitions }                 from "../../services/itemDefinitionsService.js";
import { createFormButtonRow, createDropdownField } from "../uiKit.js";
import { createMarkerForm }                    from "../forms/markerForm.js";

export function initMarkerModal(db) {
  // Create the modal container once
  const { modal, content } = createModal({
    id:         "edit-marker-modal",
    title:      "Edit Marker",
    size:       "small",
    backdrop:   true,       // enable backdrop click to close
    draggable:  true,
    withDivider:true
  });
  modal.classList.add("admin-only");

  // Build the form
  const form = document.createElement("form");
  form.id = "edit-form";

  // Type selector
  const { row: rowType, select: fldType } =
    createDropdownField("Type:", "fld-type", [
      { value: "Door", label: "Door" },
      { value: "Extraction Portal", label: "Extraction Portal" },
      { value: "Item", label: "Item" },
      { value: "Teleport", label: "Teleport" },
      { value: "Spawn Point", label: "Spawn Point" }
    ], { showColor: false });

  // Predefined item selector
  const { row: rowPredef, select: fldPredef } =
    createDropdownField("Item:", "fld-predef", [], { showColor: false });

  // Marker form API
  const formApi    = createMarkerForm();
  // Buttons: Save (submit), Cancel
  const rowButtons = createFormButtonRow();
  // Hook Cancel button
  const cancelBtn = rowButtons.querySelector('button[type="button"]');
  if (cancelBtn) {
    cancelBtn.addEventListener("click", e => {
      e.preventDefault();
      closeModal(modal);
    });
  }

  // Group item-specific rows in a container
  const blockItem = document.createElement("div");
  blockItem.classList.add("item-gap");
  blockItem.append(
    formApi.fields.fldRarity.closest(".field-row"),
    formApi.fields.fldItemType.closest(".field-row"),
    formApi.fields.fldDesc.closest(".field-row")
  );

  // Assemble form fields
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

  // Show/hide item block on type change
  fldType.addEventListener("change", () => {
    const isItem = fldType.value === "Item";
    blockItem.style.display = isItem ? "block" : "none";
    rowPredef.style.display = isItem ? "flex" : "none";
  });

  // Load and refresh predefined item list
  let defs = {};
  async function refreshPredefinedItems() {
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

  // Populate form from existing data
  function populate(data = { type: "Item" }) {
    fldType.value = data.type;
    fldType.dispatchEvent(new Event("change"));
    if (data.type === "Item" && data.predefinedItemId && defs[data.predefinedItemId]) {
      fldPredef.value = data.predefinedItemId;
      formApi.setFromDefinition(defs[data.predefinedItemId]);
    } else {
      fldPredef.value = "";
      formApi.setFromDefinition(data.type === "Item" ? {} : data);
    }
    formApi.initPickrs();
  }

  // Harvest form values into marker object
  function harvest(coords) {
    const type = fldType.value;
    const sel  = fldPredef.value;
    if (type === "Item" && sel && defs[sel]) {
      const d = defs[sel];
      return {
        type,
        coords,
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

  // Open modal to edit existing marker
  async function openEdit(markerObj, data, evt, onSave) {
    await refreshPredefinedItems();
    populate(data);
    openModalAt(modal, evt);
    form.onsubmit = e => {
      e.preventDefault();
      Object.assign(data, harvest(data.coords));
      onSave(data);
      closeModal(modal);
    };
  }

  // Open modal to create a new marker
  async function openCreate(coords, type, evt, onCreate) {
    await refreshPredefinedItems();
    populate({ type });
    openModalAt(modal, evt);
    form.onsubmit = e => {
      e.preventDefault();
      onCreate(harvest(coords));
      closeModal(modal);
    };
  }

  return {
    openEdit,
    openCreate,
    refreshPredefinedItems
  };
}
