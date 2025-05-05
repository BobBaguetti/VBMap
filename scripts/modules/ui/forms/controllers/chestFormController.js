/* =========================================================
   VBMap – Chest Form Controller
   ---------------------------------------------------------
   @file:    /scripts/modules/ui/forms/controllers/chestFormController.js
   @version: 3.2  (2025‑05‑06)
   ========================================================= */

   import { createPickr }            from "../../pickrManager.js";
   import { getPickrHexColor }       from "../../../utils/colorUtils.js";
   import { createChestForm }        from "../builders/chestFormBuilder.js";
   import { openInventoryPicker }    from "../../components/inventoryPicker.js";
   import { loadItemDefinitions }    from "../../../services/itemDefinitionsService.js";
   
   /* ───────────────────────── factory ────────────────────── */
   export function createChestFormController(cb, db) {
     const { form, fields } = createChestForm();
     const pickrs = {};
     let   _id          = null;
     let   saveBtn      = null;
     let   headerTitle  = null;
     let   allItems     = [];
   
     /* ─────────────── Pickr (description only) ───────────── */
     function initPickrs() {
       if (pickrs.desc || !document.body.contains(fields.colorDesc)) return;
       pickrs.desc = createPickr(`#${fields.colorDesc.id}`);
       const bubble = () => form.dispatchEvent(new Event("input", { bubbles: true }));
       pickrs.desc.on("change", bubble).on("save", bubble);
       fields.colorDesc.addEventListener("click", () => pickrs.desc.show());
     }
     initPickrs();
   
     /* Expose to modal */
     const initPickrsPublic = () => initPickrs();
   
     /* ─────────────── header row (title + buttons) ───────── */
     function ensureHeader() {
       if (headerTitle) return;
   
       const bar = document.createElement("div");
       bar.className = "form-subheader";
   
       headerTitle = document.createElement("span");
       headerTitle.className = "subheader-title";
       bar.appendChild(headerTitle);
   
       const btnRow = document.createElement("span");
       btnRow.className = "subheader-btnrow";
   
       saveBtn = document.createElement("button");
       saveBtn.type = "submit";
       saveBtn.className = "ui-button-primary";
       btnRow.appendChild(saveBtn);
   
       const cancelBtn = document.createElement("button");
       cancelBtn.className = "ui-button";
       cancelBtn.textContent = "Clear";
       cancelBtn.type = "button";
       cancelBtn.onclick = () => cb?.onCancel?.();
       btnRow.appendChild(cancelBtn);
   
       if (cb.onDelete) {
         const delBtn = document.createElement("button");
         delBtn.className = "ui-button-delete";
         delBtn.textContent = "🗑";
         delBtn.type = "button";
         delBtn.onclick = () => cb.onDelete?.(_id);
         btnRow.appendChild(delBtn);
       }
   
       bar.appendChild(btnRow);
       form.prepend(bar);
     }
     ensureHeader();
   
     function updateHeader() {
       if (!_id) {
         headerTitle.textContent = "Add Chest Type";
         saveBtn.textContent     = "Create";
       } else {
         headerTitle.textContent = "Edit Chest Type";
         saveBtn.textContent     = "Save";
       }
     }
   
     /* ─────────────── inventory chips ────────────────────── */
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
         x.className = "remove-chip";
         x.textContent = "×";
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
         title:       "Select Loot Pool Items"
       });
       fields.lootPool.splice(0, fields.lootPool.length, ...ids);
       renderChips();
     };
   
     /* ─────────────── reset / populate ───────────────────── */
     function reset() {
       form.reset();
       _id = null;
       fields.lootPool.length = 0;
       renderChips();
       initPickrs();
       pickrs.desc?.setColor("#E5E6E8");
       fields.extraInfo.setLines([], false);
       updateHeader();
     }
   
     function populate(def) {
       reset();
       _id = def.id || null;
   
       // Field names may differ between builder versions; guard each.
       fields.fldName?.value       = def.name    || "";
       (fields.fldIcon  || fields.fldIconUrl)?.value = def.iconUrl || "";
       fields.fldSize?.value       = def.size    || "small";
       fields.fldCategory?.value   = def.category|| "";
   
       fields.lootPool.splice(0, 0, ...(def.lootPool || []));
       renderChips();
   
       fields.fldDesc.value = def.description || "";
       pickrs.desc?.setColor(def.descriptionColor || "#E5E6E8");
       fields.extraInfo.setLines(def.extraLines || [], false);
       updateHeader();
     }
   
     function getCurrent() {
       return {
         id:            _id,
         name:          fields.fldName.value.trim(),
         iconUrl:       (fields.fldIcon || fields.fldIconUrl).value.trim(),
         size:          fields.fldSize.value,
         category:      fields.fldCategory.value.trim(),
         lootPool:      [...fields.lootPool],
         description:   fields.fldDesc.value.trim(),
         descriptionColor: getPickrHexColor(pickrs.desc),
         extraLines:    fields.extraInfo.getLines()
       };
     }
   
     /* ─────────────── submit wiring ─────────────────────── */
     form.addEventListener("submit", e => {
       e.preventDefault();
       cb?.onSubmit?.(getCurrent());
     });
   
     return {
       form,
       reset,
       populate,
       getCurrent,
       getId: () => _id,
       /* hook for modal */
       initPickrs: initPickrsPublic
     };
   }
   