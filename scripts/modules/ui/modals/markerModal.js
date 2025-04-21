// @version: 9
// @file: /scripts/modules/ui/modals/markerModal.js

import { createModal, closeModal, openModalAt } from "../uiKit.js";
import { loadItemDefinitions } from "../../services/itemDefinitionsService.js";
import { createFormButtonRow } from "../uiKit.js";
import { createDropdownField } from "../uiKit.js";
import { createMarkerForm } from "../forms/markerForm.js";

export function initMarkerModal(db) {
  const { modal, content } = createModal({
    id: "edit-marker-modal",
    title: "Edit Marker",
    size: "small",
    backdrop: false,
    draggable: true,
    withDivider: true,
    onClose: () => closeModal(modal)
  });

  const form = document.createElement("form");
  form.id = "edit-form";

  const { row: rowType, select: fldType } =
    createDropdownField("Type:", "fld-type", [
      { value: "Door", label: "Door" },
      { value: "Extraction Portal", label: "Extraction Portal" },
      { value: "Item", label: "Item" },
      { value: "Teleport", label: "Teleport" },
      { value: "Spawn Point", label: "Spawn Point" }
    ], { showColor: false });

  const { row: rowPredef, select: ddPredef } =
    createDropdownField("Item:", "fld-predef", [], { showColor: false });

  const formApi = createMarkerForm();
  const rowButtons = createFormButtonRow(() => closeModal(modal));

  const blockItem = document.createElement("div");
  blockItem.classList.add("item-gap");
  blockItem.append(
    formApi.fields.fldRarity.closest(".field-row"),
    formApi.fields.fldItemType.closest(".field-row"),
    formApi.fields.fldDesc.closest(".field-row")
  );

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
  document.body.appendChild(modal);

  let defs = {};
  let customMode = false;

  function toggleSections(isItem) {
    blockItem.style.display = isItem ? "block" : "none";
    rowPredef.style.display = isItem ? "flex" : "none";
  }

  fldType.onchange = () => toggleSections(fldType.value === "Item");
  ddPredef.onchange = () => {
    const def = defs[ddPredef.value];
    if (def) {
      formApi.setFromDefinition(def);
      customMode = false;
    } else {
      formApi.setFromDefinition({});
      customMode = true;
    }
  };

  async function refreshPredefinedItems() {
    const list = await loadItemDefinitions(db);
    defs = Object.fromEntries(list.map(d => [d.id, d]));
    ddPredef.innerHTML = `<option value="">None (custom)</option>`;
    list.forEach(d => {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.name;
      ddPredef.appendChild(o);
    });
  }

  function openEdit(markerObj, data, evt, onSave) {
    populate(data);
    openModalAt(modal, evt);
    form.onsubmit = e => {
      e.preventDefault();
      Object.assign(data, harvest(data.coords));
      onSave(data);
      closeModal(modal);
    };
  }

  function openCreate(coords, type, evt, onCreate) {
    populate({ type });
    openModalAt(modal, evt);
    form.onsubmit = e => {
      e.preventDefault();
      onCreate(harvest(coords));
      closeModal(modal);
    };
  }

  function populate(data = { type: "Item" }) {
    fldType.value = data.type;
    toggleSections(data.type === "Item");

    if (data.type === "Item") {
      if (data.predefinedItemId && defs[data.predefinedItemId]) {
        const def = defs[data.predefinedItemId];
        ddPredef.value = def.id;
        formApi.setFromDefinition(def);
        customMode = false;
      } else {
        ddPredef.value = "";
        formApi.setFromDefinition(null);
        customMode = true;
      }
    } else {
      formApi.setFromNonItem(data);
    }
  }

  function harvest(coords) {
    const type = fldType.value;
    const selectedId = ddPredef.value;

    if (type === "Item" && selectedId && defs[selectedId]) {
      const def = defs[selectedId];
      return {
        type,
        coords,
        predefinedItemId: selectedId,
        name: def.name,
        nameColor: def.nameColor || "#E5E6E8",
        itemType: def.itemType || "",
        itemTypeColor: def.itemTypeColor || "#E5E6E8",
        rarity: def.rarity || "",
        rarityColor: def.rarityColor || "#E5E6E8",
        description: def.description || "",
        descriptionColor: def.descriptionColor || "#E5E6E8",
        extraLines: def.extraLines || [],
        imageSmall: def.imageSmall || "",
        imageBig: def.imageBig || "",
        video: def.video || "",
        value: def.value || "",
        quantity: def.quantity || ""
      };
    }

    return { type, coords, ...formApi.getCustom() };
  }

  return {
    openEdit,
    openCreate,
    refreshPredefinedItems
  };
}
