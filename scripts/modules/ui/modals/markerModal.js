// @file: /scripts/modules/ui/modals/markerModal.js
// @version: 12 — modal creation deferred until first open*

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
    if (!fldPredef) return; // not initialized yet
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

    // Create the modal shell
    const created = createModal({
      id:         "edit-marker-modal",
      title:      "Edit Marker",
      size:       "small",
      backdrop:   false,
      draggable:  true,
      withDivider:true,
      onClose:    () => closeModal(modal)
    });
    modal   = created.modal;
    content = created.content;

    // Only for admins
    modal.classList.add("admin-only");

    // Build form element
    form = document.createElement("form");
    form.id = "edit-form";

    // Type selector
    const { row: rowType, select: selectType } =
      createDropdownField("Type:", "fld-type", [
        { value: "Door", label: "Door" },
        { value: "Extraction Portal", label: "Extraction Portal" },
        { value: "Item", label: "Item" },
        { value: "Teleport", label: "Teleport" },
        { value: "Spawn Point", label: "Spawn Point" }
      ], { showColor: false });
    fldType = selectType;

    // Predefined‐item selector
    const { row: rowPredef, select: selectPredef } =
      createDropdownField("Item:", "fld-predef", [], { showColor: false });
    fldPredef = selectPredef;

    // Marker form API
    formApi    = createMarkerForm();
    rowButtons = createFormButtonRow(() => closeModal(modal));

    // Group item‐specific rows
    blockItem = document.createElement("div");
    blockItem.classList.add("item-gap");
    blockItem.append(
      formApi.fields.fldRarity.closest(".field-row"),
      formApi.fields.fldItemType.closest(".field-row"),
      formApi.fields.fldDesc.closest(".field-row")
    );

    // Assemble form DOM
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

    // Show/hide item block
    const toggleSections = (isItem) => {
      blockItem.style.display = isItem ? "block" : "none";
      rowPredef.style.display = isItem ? "flex"  : "none";
    };
    fldType.onchange = () => toggleSections(fldType.value === "Item");

    // Predef onchange
    fldPredef.onchange = () => {
      const def = defs[fldPredef.value] || {};
      formApi.setFromDefinition(def);
      formApi.initPickrs();
    };

    // Load defs now
    refreshPredefinedItems();
  }

  // The openEdit API
  function openEdit(markerObj, data, evt, onSave) {
    ensureBuilt();

    // Populate form
    populate(data);
    formApi.initPickrs();

    // Show modal
    openModalAt(modal, evt);

    // Handle save
    form.onsubmit = (e) => {
      e.preventDefault();
      Object.assign(data, harvest(data.coords));
      onSave(data);
      closeModal(modal);
    };
  }

  // The openCreate API
  function openCreate(coords, type, evt, onCreate) {
    ensureBuilt();

    populate({ type });
    formApi.initPickrs();
    openModalAt(modal, evt);

    form.onsubmit = (e) => {
      e.preventDefault();
      onCreate(harvest(coords));
      closeModal(modal);
    };
  }

  // Populate fields from data
  function populate(data = { type: "Item" }) {
    fldType.value = data.type;
    const isItem = data.type === "Item";
    blockItem.style.display = isItem ? "block" : "none";
    fldPredef.parentElement.style.display = isItem ? "flex" : "none";

    if (isItem && data.predefinedItemId && defs[data.predefinedItemId]) {
      const def = defs[data.predefinedItemId];
      fldPredef.value = def.id;
      formApi.setFromDefinition(def);
    } else {
      fldPredef.value = "";
      formApi.setFromDefinition(isItem ? {} : data);
    }
  }

  // Harvest the form back into a marker object
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
    return {
      type,
      coords,
      ...c,
      imageBig: c.imageBig || ""
    };
  }

  return {
    openEdit,
    openCreate,
    refreshPredefinedItems
  };
}
