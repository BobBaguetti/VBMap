/* =========================================================
   VBMap – Chest Form Controller
   ---------------------------------------------------------
   @file:    /scripts/modules/ui/forms/controllers/chestFormController.js
   @version: 4.0  (2025‑05‑08)
   ========================================================= */

   import { buildSubHeader }            from "../../components/subHeaderBuilder.js";
   import { createPickr }               from "../../pickrManager.js";
   import { getPickrHexColor }          from "../../../utils/colorUtils.js";
   import { createChestForm }           from "../builders/chestFormBuilder.js";
   import { openInventoryPicker }       from "../../components/inventoryPicker.js";
   import { loadItemDefinitions }       from "../../../services/itemDefinitionsService.js";
   
   export function createChestFormController(cb, db) {
     /* -------- form DOM -------- */
     const { form, fields } = createChestForm();
   
     /* -------- sub‑header (shared helper) -------- */
     const header = buildSubHeader(form, {
       titleAdd : "Add Chest Type",
       titleEdit: "Edit Chest Type",
       onClear  : () => cb?.onCancel?.(),
       onDelete : cb.onDelete ? () => cb.onDelete?.(_id) : undefined
     });
   
     /* -------- locals -------- */
     const pickrs = {};   // description only
     let   _id    = null;
     let   allItems = [];
   
     /* =========================================================
        1.  Pickr (description colour)
        ======================================================= */
     function initPickr() {
       if (pickrs.desc || !document.body.contains(form)) return;
       pickrs.desc = createPickr(`#${fields.colorDesc.id}`);
       const bubble = () => form.dispatchEvent(new Event("input", { bubbles: true }));
       pickrs.desc.on("change", bubble).on("save", bubble);
       fields.colorDesc.addEventListener("click", () => pickrs.desc.show());
     }
     const initPickrsPublic = () => initPickr();
   
     /* =========================================================
        2.  Inventory chip helpers
        ======================================================= */
     async function ensureItems() {
       if (!allItems.length) allItems = await loadItemDefinitions(db);
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
         x.className = "remove-chip"; x.textContent = "×";
         x.onclick = () => {
           const idx = fields.lootPool.indexOf(id);
           if (idx > -1) { fields.lootPool.splice(idx, 1); renderChips(); }
         };
   
         chip.appendChild(x);
         box.appendChild(chip);
       });
     }
   
     fields.openLootPicker.onclick = async () => {
       const ids = await openInventoryPicker(db, {
         selectedIds: fields.lootPool,
         title: "Select Loot Pool Items"
       });
       fields.lootPool.splice(0, fields.lootPool.length, ...ids);
       renderChips();
     };
   
     /* =========================================================
        3.  Form helpers
        ======================================================= */
     function reset() {
       form.reset();
       _id = null;
       fields.lootPool.length = 0;
       renderChips();
       initPickr();
       pickrs.desc?.setColor("#E5E6E8");
       fields.extraInfo.setLines([], false);
       header.setMode("add");
     }
   
     function populate(def) {
       reset();
       _id = def.id || null;
   
       /* basic fields (guard each) */
       if (fields.fldName)     fields.fldName.value     = def.name    || "";
       if (fields.fldSize)     fields.fldSize.value     = def.size    || "small";
       if (fields.fldCategory) fields.fldCategory.value = def.category|| "";
   
       const iconField = fields.fldIcon || fields.fldIconUrl;
       if (iconField) iconField.value   = def.iconUrl || "";
   
       /* inventories */
       fields.lootPool.push(...(def.lootPool || []));
       renderChips();
   
       /* description */
       fields.fldDesc.value = def.description || "";
       initPickr();
       pickrs.desc?.setColor(def.descriptionColor || "#E5E6E8");
       fields.extraInfo.setLines(def.extraLines || [], false);
   
       header.setMode("edit");
     }
   
     function getCurrent() {
       const iconField = fields.fldIcon || fields.fldIconUrl;
       return {
         id:            _id,
         name:          fields.fldName.value.trim(),
         iconUrl:       iconField ? iconField.value.trim() : "",
         size:          fields.fldSize.value,
         category:      fields.fldCategory.value.trim(),
         lootPool:      [...fields.lootPool],
         description:   fields.fldDesc.value.trim(),
         descriptionColor: getPickrHexColor(pickrs.desc),
         extraLines:    fields.extraInfo.getLines()
       };
     }
   
     /* =========================================================
        4.  Submit wiring
        ======================================================= */
     form.addEventListener("submit", e => {
       e.preventDefault();
       cb?.onSubmit?.(getCurrent());
     });
   
     /* public API */
     return {
       form,
       reset,
       populate,
       getCurrent,
       getId: () => _id,
       initPickrs: initPickrsPublic
     };
   }
   