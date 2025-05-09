// @file: src/modules/ui/forms/controllers/markerFormController.js
// @version: 1.0 — wires up the builder, type switching, presets, and harvesting

import { createMarkerFormBuilder } from "../builders/markerFormBuilder.js";
import { loadItemDefinitions }     from "../../../services/itemDefinitionsService.js";
import { loadChestDefinitions }    from "../../../services/chestDefinitionsService.js";
import { createFormButtonRow }     from "../../components/uiKit.js";

export function createMarkerFormController({ onCancel, onSubmit }, db) {
  const { form, fields, blocks } = createMarkerFormBuilder();

  // loaders
  let itemDefs = {}, chestDefs = {};
  async function refreshItems() {
    const list = await loadItemDefinitions(db);
    itemDefs = Object.fromEntries(list.map(d => [d.id, d]));
    const sel = fields.fldPredefItem;
    sel.innerHTML = `<option value="">None (custom)</option>`;
    list.forEach(d => {
      const o = document.createElement("option");
      o.value = d.id; o.textContent = d.name;
      sel.appendChild(o);
    });
  }
  async function refreshChests() {
    const list = await loadChestDefinitions(db);
    chestDefs = Object.fromEntries(list.map(d => [d.id, d]));
    const sel = fields.fldChestType;
    sel.innerHTML = `<option value="">Select chest type</option>`;
    list.forEach(d => {
      const o = document.createElement("option");
      o.value = d.id; o.textContent = d.name;
      sel.appendChild(o);
    });
  }

  // buttons
  const btnRow = createFormButtonRow(onCancel, "Save", "Cancel");
  btnRow.querySelector('button[type="button"]').onclick = e => { e.preventDefault(); onCancel(); };
  form.appendChild(btnRow);

  // Type switcher
  fields.fldType.onchange = () => {
    const t = fields.fldType.value;
    // show/hide dropdowns
    fields.rowPredefItem.style.display = t === "Item"  ? "flex" : "none";
    fields.rowChestType .style.display = t === "Chest" ? "flex" : "none";
    // show/hide subforms
    blocks.item.container.style.display  = t === "Item"  ? "block" : "none";
    blocks.chest.container.style.display = t === "Chest" ? "block" : "none";
  };

  // Predefined Item
  fields.fldPredefItem.onchange = () => {
    const def = itemDefs[fields.fldPredefItem.value] || {};
    blocks.item.setFromDef(def);
    blocks.item.init();
  };

  // initial load
  refreshItems();
  refreshChests();
  blocks.item.setFromDef({});
  blocks.chest.setFromDef({});

  // public API
  function open(coords, type, evt) {
    form.dataset.coords = JSON.stringify(coords);
    fields.fldType.value = type || "";
    fields.fldType.dispatchEvent(new Event("change"));
    // show as needed...
  }

  form.onsubmit = e => {
    e.preventDefault();
    const coords = JSON.parse(form.dataset.coords || "[0,0]");
    const out = { coords, type: fields.fldType.value };
    if (out.type === "Item" && fields.fldPredefItem.value) {
      out.predefinedItemId = fields.fldPredefItem.value;
      Object.assign(out, blocks.item.getCustom());
    } else if (out.type === "Chest" && fields.fldChestType.value) {
      out.chestTypeId = fields.fldChestType.value;
      Object.assign(out, blocks.chest.getCustom());
    } else {
      Object.assign(out, blocks.item.getCustom()); // fallback
    }
    onSubmit(out);
  };

  return { form, open };
}
