// @version: 11
// @file: /scripts/modules/ui/modals/markerModal.js

import { createModal, closeModal, openModalAt } from "../uiKit.js";
import { loadItemDefinitions }                 from "../../services/itemDefinitionsService.js";
import { createFormButtonRow }                 from "../uiKit.js";
import { createDropdownField }                 from "../uiKit.js";
import { createMarkerForm }                    from "../forms/markerForm.js";

export function initMarkerModal(db) {
  const { modal, content } = createModal({
    id:         "edit-marker-modal",
    title:      "Edit Marker",
    size:       "small",
    backdrop:   false,
    draggable:  true,
    withDivider:true,
    onClose:    () => closeModal(modal)
  });

  // Build the form container
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
  const { row: rowPredef, select: ddPredef } =
    createDropdownField("Item:", "fld-predef", [], { showColor: false });

  // Our item‐fields form API
  const formApi    = createMarkerForm();
  const rowButtons = createFormButtonRow(() => closeModal(modal));

  // Group the item‐specific rows
  const blockItem = document.createElement("div");
  blockItem.classList.add("item-gap");
  blockItem.append(
    formApi.fields.fldRarity.closest(".field-row"),
    formApi.fields.fldItemType.closest(".field-row"),
    formApi.fields.fldDesc.closest(".field-row")
  );

  // Assemble everything
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

  // Predefined‐definitions store
  let defs = {};

  // Show/hide item block
  function toggleSections(isItem) {
    blockItem.style.display = isItem ? "block" : "none";
    rowPredef.style.display = isItem ? "flex"  : "none";
  }
  fldType.onchange = () => toggleSections(fldType.value === "Item");

  // When user picks a predefined item
  ddPredef.onchange = () => {
    const def = defs[ddPredef.value] || {};
    formApi.setFromDefinition(def);
    formApi.initPickrs();
  };

  // Load item definitions into the dropdown
  async function refreshPredefinedItems() {
    const list = await loadItemDefinitions(db);
    defs = Object.fromEntries(list.map(d => [d.id, d]));
    ddPredef.innerHTML = `<option value="">None (custom)</option>`;
    for (const d of list) {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.name;
      ddPredef.appendChild(o);
    }
  }
  refreshPredefinedItems(); // load immediately

  // Open existing‐marker editor
  function openEdit(markerObj, data, evt, onSave) {
    populate(data);
    formApi.initPickrs();
    openModalAt(modal, evt);

    form.onsubmit = e => {
      e.preventDefault();
      Object.assign(data, harvest(data.coords));
      onSave(data);
      closeModal(modal);
    };
  }

  // Open create‐new‐marker editor
  function openCreate(coords, type, evt, onCreate) {
    populate({ type });
    formApi.initPickrs();
    openModalAt(modal, evt);

    form.onsubmit = e => {
      e.preventDefault();
      onCreate(harvest(coords));
      closeModal(modal);
    };
  }

  // Fill in fields from an existing marker or custom data
  function populate(data = { type: "Item" }) {
    fldType.value = data.type;
    toggleSections(data.type === "Item");

    if (data.type === "Item" && data.predefinedItemId && defs[data.predefinedItemId]) {
      const def = defs[data.predefinedItemId];
      ddPredef.value = def.id;
      formApi.setFromDefinition(def);
    } else {
      ddPredef.value = "";
      formApi.setFromDefinition(data.type === "Item" ? {} : data);
    }
  }

  // Harvest form data into a save‐object
  function harvest(coords) {
    const type = fldType.value;
    const sel  = ddPredef.value;
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
    return {
      type,
      coords,
      ...c,
      imageBig: c.imageBig || ""
    };
  }

  // Public API for wiring up from script.js
  return {
    openEdit,
    openCreate,
    refreshPredefinedItems
  };
}
