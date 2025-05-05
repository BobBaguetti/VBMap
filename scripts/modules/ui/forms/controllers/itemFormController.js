/* =========================================================
   VBMap – Item Form Controller
   ---------------------------------------------------------
   DO NOT REMOVE OR EDIT THIS HEADER WITHOUT UPDATING CODE.
   Handles colour pickers, preset sync, reset / populate /
   getCurrent helpers, and submit / delete callbacks for
   the Item‑definition modal form.
   ---------------------------------------------------------
   @file:    /scripts/modules/ui/forms/controllers/itemFormController.js
   @version: 5.0  (2025‑05‑05)
   ========================================================= */

   import { attachColorSwatch, swatchHex } from "../../components/colorSwatch.js";
   import { applyColorPresets }            from "../../../utils/colorUtils.js";
   import { createItemForm }               from "../builders/itemFormBuilder.js";
   import { createIcon }                   from "../../../utils/iconUtils.js";
   
   /**
    * Builds the controller around the Item definition form.
    *
    * @param {{ onCancel?:Function, onSubmit?:Function, onDelete?:Function }} cb
    * @returns {{ form:HTMLFormElement, reset:Function, populate:Function, getCurrent:Function, getId:Function }}
    */
   export function createItemFormController(cb = {}) {
     const { form, fields } = createItemForm();
     let _id = null;
   
     /* ─────────────────────── colour swatches ─────────────────────── */
     const pickrs = {
       name:        attachColorSwatch(fields.colorName,  form),
       itemType:    attachColorSwatch(fields.colorType,  form),
       rarity:      attachColorSwatch(fields.colorRarity,form),
       description: attachColorSwatch(fields.colorDesc,  form),
       value:       attachColorSwatch(fields.colorValue, form),
       quantity:    attachColorSwatch(fields.colorQty,   form)
     };
   
     /* ─────────────────────── preset sync logic ───────────────────── */
     function applyPresets() {
       const type   = fields.fldType.value;
       const rarity = fields.fldRarity.value;
       if (!type || !rarity) return;
   
       const preset = applyColorPresets({ itemType: type, rarity });
       // Defaults: name picks rarity colour if not explicitly mapped
       preset.nameColor = preset.nameColor || preset.rarityColor || preset.itemTypeColor;
   
       // Update pickrs & emit form input to trigger live preview
       Object.entries({
         name:        preset.nameColor,
         itemType:    preset.itemTypeColor,
         rarity:      preset.rarityColor
       }).forEach(([k, hex]) => hex && pickrs[k]?.setColor(hex));
   
       form.dispatchEvent(new Event("input", { bubbles: true }));
     }
     fields.fldType  .addEventListener("change", applyPresets);
     fields.fldRarity.addEventListener("change", applyPresets);
   
     /* ───────────────────────── form helpers ───────────────────────── */
     function reset() {
       form.reset();
       _id = null;
       Object.values(pickrs).forEach(p => p?.setColor("#E5E6E8"));
       fields.extraInfo.setLines([], false);
     }
   
     function populate(def) {
       reset();
       _id = def.id || null;
   
       // Basic fields
       fields.fldName.value   = def.name        || "";
       fields.fldType.value   = def.itemType    || "";
       fields.fldRarity.value = def.rarity      || "";
       fields.fldValue.value  = def.value       ?? "";
       fields.fldQty.value    = def.quantity    ?? "";
       fields.fldDesc.value   = def.description || "";
   
       // Colours
       pickrs.name       && def.nameColor        && pickrs.name.setColor(def.nameColor);
       pickrs.itemType   && def.itemTypeColor    && pickrs.itemType.setColor(def.itemTypeColor);
       pickrs.rarity     && def.rarityColor      && pickrs.rarity.setColor(def.rarityColor);
       pickrs.description&& def.descriptionColor && pickrs.description.setColor(def.descriptionColor);
       pickrs.value      && def.valueColor       && pickrs.value.setColor(def.valueColor);
       pickrs.quantity   && def.quantityColor    && pickrs.quantity.setColor(def.quantityColor);
   
       // Extra info lines
       fields.extraInfo.setLines(def.extraLines || [], false);
     }
   
     function getCurrent() {
       return {
         id:                _id,
         name:              fields.fldName.value.trim(),
         itemType:          fields.fldType.value,
         rarity:            fields.fldRarity.value,
         value:             Number(fields.fldValue.value)  || 0,
         quantity:          Number(fields.fldQty.value)    || 0,
         description:       fields.fldDesc.value.trim(),
   
         // Hex colours from swatches
         nameColor:         swatchHex(fields.colorName),
         itemTypeColor:     swatchHex(fields.colorType),
         rarityColor:       swatchHex(fields.colorRarity),
         descriptionColor:  swatchHex(fields.colorDesc),
         valueColor:        swatchHex(fields.colorValue),
         quantityColor:     swatchHex(fields.colorQty),
   
         extraLines:        fields.extraInfo.getLines()
       };
     }
   
     /* ─────────────────── header buttons / actions ────────────────── */
     const btnRow = document.createElement("div");
     btnRow.className = "form-btn-row";
   
     const saveBtn = document.createElement("button");
     saveBtn.type = "submit";
     saveBtn.className = "ui-button-primary";
     saveBtn.textContent = _id ? "Save" : "Create";
     btnRow.appendChild(saveBtn);
   
     if (cb.onDelete) {
       const delBtn = document.createElement("button");
       delBtn.type = "button";
       delBtn.className = "ui-button-delete";
       delBtn.appendChild(createIcon("trash"));
       delBtn.onclick = () => cb.onDelete?.(_id);
       btnRow.appendChild(delBtn);
     }
   
     const cancelBtn = document.createElement("button");
     cancelBtn.type = "button";
     cancelBtn.className = "ui-button";
     cancelBtn.textContent = "Cancel";
     cancelBtn.onclick = () => cb.onCancel?.();
     btnRow.appendChild(cancelBtn);
   
     form.prepend(btnRow);
   
     /* ──────────────────── submit wiring ──────────────────── */
     form.addEventListener("submit", e => {
       e.preventDefault();
       cb.onSubmit?.(getCurrent());
     });
   
     return { form, reset, populate, getCurrent, getId: () => _id };
   }
   