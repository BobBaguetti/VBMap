/* =========================================================
   VBMap – Item Form Controller
   ---------------------------------------------------------
   @file: /scripts/modules/ui/forms/controllers/itemFormController.js
   @version: 7.1  (2025-05-09) – exposes sub-header element
   ========================================================= */

   import { buildSubHeader }      from "../../components/subHeaderBuilder.js";
   import { usePickrs }           from "../../components/pickrMixin.js";
   import { applyColorPresets }   from "../../../utils/colorUtils.js";
   import { createItemForm }      from "../builders/itemFormBuilder.js";
   
   export function createItemFormController(cb = {}) {
     const { form, fields } = createItemForm();
     let _id = null;
   
     // Build the sub-header (Add/Edit toggle + Save, Clear, Delete)
     const header = buildSubHeader(form, {
       titleAdd : "Add Item",
       titleEdit: "Edit Item",
       onClear  : () => cb.onCancel?.(),
       onDelete : cb.onDelete ? () => cb.onDelete?.(_id) : undefined
     });
   
     // Pickr mixin for all color swatches
     const pickr = usePickrs(form, {
       name        : fields.colorName,
       itemType    : fields.colorType,
       rarity      : fields.colorRarity,
       description : fields.colorDesc,
       value       : fields.colorValue,
       quantity    : fields.colorQty
     });
   
     // Apply presets on type/rarity change
     function applyPresets() {
       const preset = applyColorPresets({
         itemType: fields.fldType.value,
         rarity:   fields.fldRarity.value
       });
       pickr.set({
         name     : preset.nameColor     || "",
         itemType : preset.itemTypeColor || "",
         rarity   : preset.rarityColor   || ""
       });
       form.dispatchEvent(new Event("input", { bubbles: true }));
     }
     fields.fldType.addEventListener("change", applyPresets);
     fields.fldRarity.addEventListener("change", applyPresets);
   
     // Helpers
     function reset() {
       form.reset();
       _id = null;
       pickr.reset();
       fields.extraInfo.setLines([], false);
       header.setMode("add");
     }
   
     function populate(def) {
       reset();
       _id = def.id || null;
   
       fields.fldName.value        = def.name        || "";
       fields.fldType.value        = def.itemType    || "";
       fields.fldRarity.value      = def.rarity      || "";
       fields.fldValue.value       = def.value       ?? "";
       fields.fldQty.value         = def.quantity    ?? "";
       fields.fldDesc.value        = def.description || "";
   
       pickr.set({
         name        : def.nameColor,
         itemType    : def.itemTypeColor,
         rarity      : def.rarityColor,
         description : def.descriptionColor,
         value       : def.valueColor,
         quantity    : def.quantityColor
       });
   
       fields.extraInfo.setLines(def.extraLines || [], false);
       header.setMode("edit");
     }
   
     function getCurrent() {
       const colors = pickr.get();
       return {
         id:             _id,
         name:           fields.fldName.value.trim(),
         itemType:       fields.fldType.value,
         rarity:         fields.fldRarity.value,
         value:          Number(fields.fldValue.value)    || 0,
         quantity:       Number(fields.fldQty.value)      || 0,
         description:    fields.fldDesc.value.trim(),
         nameColor:      colors.name,
         itemTypeColor:  colors.itemType,
         rarityColor:    colors.rarity,
         descriptionColor: colors.description,
         valueColor:     colors.value,
         quantityColor:  colors.quantity,
         extraLines:     fields.extraInfo.getLines()
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
   