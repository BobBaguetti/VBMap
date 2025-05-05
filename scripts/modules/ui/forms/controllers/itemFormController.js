/* =========================================================
   VBMap – Item Form Controller
   ---------------------------------------------------------
   @file: /scripts/modules/ui/forms/controllers/itemFormController.js
   @version: 5.2  (2025‑05‑06)
   ========================================================= */

   import { attachColorSwatch, swatchHex } from "../../components/colorSwatch.js";
   import { applyColorPresets }            from "../../../utils/colorUtils.js";
   import { createItemForm }               from "../builders/itemFormBuilder.js";
   import { createIcon }                   from "../../../utils/iconUtils.js";
   
   export function createItemFormController(cb = {}) {
     const { form, fields } = createItemForm();
     let _id = null;
     let saveBtn, headerTitle;
   
     /* ──────────── lazy swatch attachment ──────────── */
     const pickrs = {};
     function initPickrs() {
       if (!document.body.contains(form)) return;      // wait until DOM attached
       if (!pickrs.name) {  // only run once
         pickrs.name        = attachColorSwatch(fields.colorName,  form);
         pickrs.itemType    = attachColorSwatch(fields.colorType,  form);
         pickrs.rarity      = attachColorSwatch(fields.colorRarity,form);
         pickrs.description = attachColorSwatch(fields.colorDesc,  form);
         pickrs.value       = attachColorSwatch(fields.colorValue, form);
         pickrs.quantity    = attachColorSwatch(fields.colorQty,   form);
       }
     }
   
     /* expose for modal */
     const initPickrsPublic = () => initPickrs();
   
     /* ─────────────── sub‑header (title + buttons) ─────────────── */
     function ensureHeader() {
       if (headerTitle) return;
   
       const bar = document.createElement("div");
       bar.className = "form-subheader";
       bar.style.display = "flex";
       bar.style.alignItems = "center";
   
       headerTitle = document.createElement("span");
       headerTitle.className = "subheader-title";
       bar.appendChild(headerTitle);
   
       const btnRow = document.createElement("span");
       btnRow.className  = "subheader-btnrow";
       btnRow.style.display = "flex";
       btnRow.style.gap    = "6px";
       btnRow.style.marginLeft = "auto";               // push to right
   
       saveBtn = document.createElement("button");
       saveBtn.type = "submit";
       saveBtn.className = "ui-button-primary";
       btnRow.appendChild(saveBtn);
   
       const cancelBtn = document.createElement("button");
       cancelBtn.className = "ui-button";
       cancelBtn.textContent = "Cancel";
       cancelBtn.type = "button";
       cancelBtn.onclick = () => cb.onCancel?.();
       btnRow.appendChild(cancelBtn);
   
       if (cb.onDelete) {
         const delBtn = document.createElement("button");
         delBtn.className = "ui-button-delete";
         delBtn.appendChild(createIcon("trash"));
         delBtn.type = "button";
         delBtn.onclick = () => cb.onDelete?.(_id);
         btnRow.appendChild(delBtn);
       }
   
       bar.appendChild(btnRow);
       form.prepend(bar);
     }
     ensureHeader();
   
     function updateHeader() {
       if (_id) {
         headerTitle.textContent = "Edit Item";
         saveBtn.textContent     = "Save";
       } else {
         headerTitle.textContent = "Add Item";
         saveBtn.textContent     = "Create";
       }
     }
   
     /* ─────────────── presets & colour sync ─────────────── */
     function applyPresets() {
       initPickrs();  // ensure pickrs exist
       const preset = applyColorPresets({
         itemType: fields.fldType.value,
         rarity:   fields.fldRarity.value
       });
       preset.nameColor = preset.nameColor || preset.rarityColor || preset.itemTypeColor;
   
       Object.entries({
         name:        preset.nameColor,
         itemType:    preset.itemTypeColor,
         rarity:      preset.rarityColor
       }).forEach(([k, hex]) => hex && pickrs[k]?.setColor(hex));
   
       form.dispatchEvent(new Event("input", { bubbles: true }));
     }
     fields.fldType  .addEventListener("change", applyPresets);
     fields.fldRarity.addEventListener("change", applyPresets);
   
     /* ─────────────── reset / populate / getCurrent ─────── */
     function reset() {
       form.reset();
       _id = null;
       initPickrs();
       Object.values(pickrs).forEach(p => p?.setColor("#E5E6E8"));
       fields.extraInfo.setLines([], false);
       updateHeader();
     }
   
     function populate(def) {
       reset();
       _id = def.id || null;
   
       fields.fldName.value   = def.name     || "";
       fields.fldType.value   = def.itemType || "";
       fields.fldRarity.value = def.rarity   || "";
       fields.fldValue.value  = def.value    ?? "";
       fields.fldQty.value    = def.quantity ?? "";
       fields.fldDesc.value   = def.description || "";
   
       initPickrs();
       pickrs.name?.setColor(       def.nameColor        || "#E5E6E8");
       pickrs.itemType?.setColor(   def.itemTypeColor    || "#E5E6E8");
       pickrs.rarity?.setColor(     def.rarityColor      || "#E5E6E8");
       pickrs.description?.setColor(def.descriptionColor || "#E5E6E8");
       pickrs.value?.setColor(      def.valueColor       || "#E5E6E8");
       pickrs.quantity?.setColor(   def.quantityColor    || "#E5E6E8");
   
       fields.extraInfo.setLines(def.extraLines || [], false);
       updateHeader();
     }
   
     function getCurrent() {
       initPickrs();
       return {
         id:                _id,
         name:              fields.fldName.value.trim(),
         itemType:          fields.fldType.value,
         rarity:            fields.fldRarity.value,
         value:             Number(fields.fldValue.value) || 0,
         quantity:          Number(fields.fldQty.value)   || 0,
         description:       fields.fldDesc.value.trim(),
   
         nameColor:         swatchHex(fields.colorName),
         itemTypeColor:     swatchHex(fields.colorType),
         rarityColor:       swatchHex(fields.colorRarity),
         descriptionColor:  swatchHex(fields.colorDesc),
         valueColor:        swatchHex(fields.colorValue),
         quantityColor:     swatchHex(fields.colorQty),
   
         extraLines:        fields.extraInfo.getLines()
       };
     }
   
     /* ─────────────── submit wiring ─────────────────────── */
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
       initPickrs: initPickrsPublic     // modal hook
     };
   }
   