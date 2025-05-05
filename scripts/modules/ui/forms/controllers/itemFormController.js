/* =========================================================
   VBMap – Item Form Controller
   ---------------------------------------------------------
   @file: /scripts/modules/ui/forms/controllers/itemFormController.js
   @version: 6.0  (2025‑05‑08)
   ========================================================= */

   import { buildSubHeader }            from "../../components/subHeaderBuilder.js";
   import { attachColorSwatch, swatchHex } from "../../components/colorSwatch.js";
   import { applyColorPresets }            from "../../../utils/colorUtils.js";
   import { createItemForm }               from "../builders/itemFormBuilder.js";
   
   export function createItemFormController(cb = {}) {
     const { form, fields } = createItemForm();
     let _id = null;
   
     /* ────────────── shared sub‑header ────────────── */
     const header = buildSubHeader(form, {
       titleAdd : "Add Item",
       titleEdit: "Edit Item",
       onClear  : () => cb.onCancel?.(),
       onDelete : cb.onDelete ? () => cb.onDelete?.(_id) : undefined
     });
   
     /* ────────────── colour pickers (lazy) ─────────── */
     const pickrs = {};
     function initPickrs() {
       if (pickrs.name || !document.body.contains(form)) return;
       pickrs.name        = attachColorSwatch(fields.colorName,  form);
       pickrs.itemType    = attachColorSwatch(fields.colorType,  form);
       pickrs.rarity      = attachColorSwatch(fields.colorRarity,form);
       pickrs.description = attachColorSwatch(fields.colorDesc,  form);
       pickrs.value       = attachColorSwatch(fields.colorValue, form);
       pickrs.quantity    = attachColorSwatch(fields.colorQty,   form);
     }
     const initPickrsPublic = () => initPickrs();
   
     /* ────────────── presets & sync ─────────────── */
     function applyPresets() {
       initPickrs();
       const preset = applyColorPresets({
         itemType: fields.fldType.value,
         rarity:   fields.fldRarity.value
       });
       preset.nameColor = preset.nameColor || preset.rarityColor || preset.itemTypeColor;
       Object.entries({
         name:     preset.nameColor,
         itemType: preset.itemTypeColor,
         rarity:   preset.rarityColor
       }).forEach(([k, hex]) => hex && pickrs[k]?.setColor(hex));
       form.dispatchEvent(new Event("input", { bubbles: true }));
     }
     fields.fldType  .addEventListener("change", applyPresets);
     fields.fldRarity.addEventListener("change", applyPresets);
   
     /* ────────────── helpers ─────────────── */
     function reset() {
       form.reset();
       _id = null;
       initPickrs();
       Object.values(pickrs).forEach(p => p?.setColor("#E5E6E8"));
       fields.extraInfo.setLines([], false);
       header.setMode("add");
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
       header.setMode("edit");
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
   
     /* ─────────────── submit wiring ─────────────── */
     form.addEventListener("submit", e => {
       e.preventDefault();
       cb.onSubmit?.(getCurrent());
     });
   
     /* controller API */
     return {
       form,
       reset,
       populate,
       getCurrent,
       getId: () => _id,
       initPickrs: initPickrsPublic
     };
   }
   