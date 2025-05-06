/* =========================================================
   VBMap – Chest Form Controller
   ---------------------------------------------------------
   @file: /scripts/modules/ui/forms/controllers/chestFormController.js
   @version: 4.2  (2025-05-08) – exposes sub-header element
   ========================================================= */

   import { buildSubHeader }          from "../../components/subHeaderBuilder.js";
   import { usePickrs }               from "../../components/pickrMixin.js";
   import { createChestForm }         from "../builders/chestFormBuilder.js";
   import { openInventoryPicker }     from "../../components/inventoryPicker.js";
   import { loadItemDefinitions }     from "../../../services/itemDefinitionsService.js";
   
   export function createChestFormController(cb, db) {
     const { form, fields } = createChestForm();
     let _id = null;
   
     // Build the sub-header (Add/Edit toggle + Save, Clear, Delete)
     const header = buildSubHeader(form, {
       titleAdd : "Add Chest Type",
       titleEdit: "Edit Chest Type",
       onClear  : () => cb?.onCancel?.(),
       onDelete : cb.onDelete ? () => cb.onDelete?.(_id) : undefined
     });
   
     // Pickr instance for description color
     const pickr = usePickrs(form, { desc: fields.colorDesc });
   
     // Loot-pool chips
     let allItems = [];
     async function ensureItems() {
       if (!allItems.length) {
         allItems = await loadItemDefinitions(db);
       }
     }
   
     async function renderChips() {
       await ensureItems();
       const box = fields.chipContainer;
       box.innerHTML = "";
       fields.lootPool.forEach(id => {
         const def  = allItems.find(i => i.id === id) || { name: id };
         const chip = document.createElement("span");
         chip.className = "loot-pool-chip";
         chip.textContent = def.name;
         const x = document.createElement("span");
         x.className = "remove-chip";
         x.textContent = "×";
         x.onclick = () => {
           fields.lootPool.splice(fields.lootPool.indexOf(id), 1);
           renderChips();
         };
         chip.appendChild(x);
         box.appendChild(chip);
       });
     }
   
     // Inventory picker button
     fields.openLootPicker.onclick = async () => {
       const ids = await openInventoryPicker(db, {
         selectedIds: fields.lootPool,
         title:      "Select Loot Pool Items"
       });
       fields.lootPool.splice(0, fields.lootPool.length, ...ids);
       renderChips();
     };
   
     // Helpers
     function reset() {
       form.reset();
       _id = null;
       fields.lootPool.length = 0;
       renderChips();
       pickr.reset();
       fields.extraInfo.setLines([], false);
       header.setMode("add");
     }
   
     function populate(def) {
       reset();
       _id = def.id || null;
       fields.fldName.value      = def.name        || "";
       fields.fldSize.value      = def.size        || "Small";
       fields.fldCategory.value  = def.category    || "";
       const iconField = fields.fldIcon || fields.fldIconUrl;
       if (iconField) iconField.value = def.iconUrl || "";
   
       fields.lootPool.push(...(def.lootPool || []));
       renderChips();
       fields.fldDesc.value = def.description || "";
       pickr.set({ desc: def.descriptionColor });
       fields.extraInfo.setLines(def.extraLines || [], false);
       header.setMode("edit");
     }
   
     function getCurrent() {
       return {
         id:                _id,
         name:              fields.fldName.value.trim(),
         iconUrl:           (fields.fldIcon || fields.fldIconUrl)?.value.trim() || "",
         size:              fields.fldSize.value,
         category:          fields.fldCategory.value.trim(),
         lootPool:          [...fields.lootPool],
         description:       fields.fldDesc.value.trim(),
         descriptionColor:  pickr.get().desc,
         extraLines:        fields.extraInfo.getLines()
       };
     }
   
     form.addEventListener("submit", e => {
       e.preventDefault();
       cb.onSubmit?.(getCurrent());
     });
   
     return {
       form,
       reset,
       populate,
       getCurrent,
       getId: () => _id,
       initPickrs: () => {},
   
       /** Expose the sub-header element so the modal factory can relocate it */
       getSubHeaderElement: () => header.el || header.container || header
     };
   }
   