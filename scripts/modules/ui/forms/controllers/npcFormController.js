/* =========================================================
   VBMap – NPC Form Controller
   ---------------------------------------------------------
   @file: /scripts/modules/ui/forms/controllers/npcFormController.js
   @version: 3.3  (2025‑05‑07)
   ========================================================= */

   import { attachColorSwatch, swatchHex }  from "../../components/colorSwatch.js";
   import { createNpcForm }                 from "../builders/npcFormBuilder.js";
   import { loadItemDefinitions }           from "../../../services/itemDefinitionsService.js";
   import { openInventoryPicker }           from "../../components/inventoryPicker.js";
   
   export function createNpcFormController(cb, db) {
     const { form, fields } = createNpcForm();
     let _id = null;
     let saveBtn, headerTitle;
     const pickrs = {};
     let allItems = [];
   
     /* ─────────────── sub‑header row ─────────────── */
     (function buildHeader() {
       const bar = document.createElement("div");
       bar.className = "form-subheader";
       Object.assign(bar.style, { display: "flex", alignItems: "center" });
   
       headerTitle = document.createElement("span");
       headerTitle.className = "subheader-title";
       bar.appendChild(headerTitle);
   
       const btnRow = document.createElement("span");
       Object.assign(btnRow.style, { display: "flex", gap: "6px", marginLeft: "auto" });
   
       saveBtn = Object.assign(document.createElement("button"), {
         type: "submit",
         className: "ui-button-primary"
       });
       btnRow.appendChild(saveBtn);
   
       const clear = Object.assign(document.createElement("button"), {
         className: "ui-button",
         type: "button",
         textContent: "Clear"
       });
       clear.onclick = () => cb?.onCancel?.();
       btnRow.appendChild(clear);
   
       if (cb.onDelete) {
         const del = Object.assign(document.createElement("button"), {
           className: "ui-button-delete",
           type: "button",
           textContent: "🗑"
         });
         del.onclick = () => cb.onDelete?.(_id);
         btnRow.appendChild(del);
       }
   
       bar.appendChild(btnRow);
       form.prepend(bar);
     })();
   
     function headerUpdate() {
       if (_id) {
         headerTitle.textContent = "Edit NPC";
         saveBtn.textContent     = "Save";
       } else {
         headerTitle.textContent = "Add NPC";
         saveBtn.textContent     = "Create";
       }
     }
   
     /* ─────────────── colour swatches ─────────────── */
     function initPickrs() {
       if (pickrs.name || !document.body.contains(form)) return;
       pickrs.name = attachColorSwatch(fields.swName, form);
       pickrs.hp   = attachColorSwatch(fields.swHP,   form);
       pickrs.dmg  = attachColorSwatch(fields.swDMG,  form);
       pickrs.desc = attachColorSwatch(fields.swDesc, form);
     }
     const initPickrsPublic = () => initPickrs();
   
     /* ─────────────── chip helpers ─────────────── */
     async function ensureItems() {
       if (!allItems.length) allItems = await loadItemDefinitions(db);
     }
     async function renderChips(which) {
       await ensureItems();
       const box = which === "loot" ? fields.lootChips : fields.vendChips;
       const ids = which === "loot" ? fields.lootPool  : fields.vendInv;
       box.innerHTML = "";
       ids.forEach(id => {
         const def  = allItems.find(i => i.id === id) || { name: id };
         const chip = document.createElement("span");
         chip.className = "loot-pool-chip";
         chip.textContent = def.name;
         const x = document.createElement("span");
         x.className = "remove-chip"; x.textContent = "×";
         x.onclick = () => { ids.splice(ids.indexOf(id), 1); renderChips(which); };
         chip.appendChild(x);
         box.appendChild(chip);
       });
     }
   
     fields.btnLoot.onclick = async () => {
       const ids = await openInventoryPicker(db, {
         selectedIds: fields.lootPool,
         title: "Select Loot Pool Items"
       });
       fields.lootPool.splice(0, fields.lootPool.length, ...ids);
       renderChips("loot");
     };
     fields.btnVend.onclick = async () => {
       const ids = await openInventoryPicker(db, {
         selectedIds: fields.vendInv,
         title: "Select Vendor Stock Items"
       });
       fields.vendInv.splice(0, fields.vendInv.length, ...ids);
       renderChips("vend");
     };
   
     /* ─────────────── reset / populate ─────────────── */
     function reset() {
       form.reset();
       _id = null;
       fields.lootPool.length = fields.vendInv.length = 0;
       renderChips("loot"); renderChips("vend");
       initPickrs();
       Object.values(pickrs).forEach(p => p?.setColor("#E5E6E8"));
       fields.extraInfo.setLines([], false);
       headerUpdate();
     }
   
     function populate(def) {
       reset();
       _id = def.id || null;
   
       /* basics */
       fields.fldName.value   = def.name   || "";
       fields.fldHealth.value = def.health ?? "";
       fields.fldDamage.value = def.damage ?? "";
   
       /* roles */
       fields.roleCheckboxes.forEach(cb => { cb.checked = false; });
       (def.roles || []).forEach(role => {
         const cb = fields.roleCheckboxes.find(c => c.value === role);
         if (cb) cb.checked = true;
       });
   
       /* inventories */
       fields.lootPool.push(...(def.lootPool || []));  renderChips("loot");
       fields.vendInv.push(...(def.vendorInventory || [])); renderChips("vend");
   
       /* description & colours */
       fields.fldDesc.value = def.description || "";
       initPickrs();
       pickrs.name?.setColor(def.nameColor        || "#E5E6E8");
       pickrs.hp?.setColor(  def.healthColor      || "#E5E6E8");
       pickrs.dmg?.setColor( def.damageColor      || "#E5E6E8");
       pickrs.desc?.setColor(def.descriptionColor || "#E5E6E8");
   
       fields.extraInfo.setLines(def.extraLines || [], false);
   
       /* images */
       fields.fldImgSmall.value = def.imageSmallUrl || "";
       fields.fldImgLarge.value = def.imageLargeUrl || "";
   
       headerUpdate();
     }
   
     function getCurrent() {
       initPickrs();
       return {
         id: _id,
         name:   fields.fldName.value.trim(),
         health: Number(fields.fldHealth.value) || 0,
         damage: Number(fields.fldDamage.value) || 0,
         roles:  fields.roleCheckboxes.filter(cb => cb.checked).map(cb => cb.value),
   
         lootPool:        [...fields.lootPool],
         vendorInventory: [...fields.vendInv],
   
         description:      fields.fldDesc.value.trim(),
         imageSmallUrl:    fields.fldImgSmall.value.trim(),
         imageLargeUrl:    fields.fldImgLarge.value.trim(),
   
         nameColor:        swatchHex(fields.swName),
         healthColor:      swatchHex(fields.swHP),
         damageColor:      swatchHex(fields.swDMG),
         descriptionColor: swatchHex(fields.swDesc),
   
         extraLines: fields.extraInfo.getLines()
       };
     }
   
     /* ─────────────── submit wiring ─────────────── */
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
       initPickrs: initPickrsPublic
     };
   }
   