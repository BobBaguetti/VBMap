/* =========================================================
   VBMap – Item Form Builder
   ---------------------------------------------------------
   @file: /scripts/modules/ui/forms/builders/itemFormBuilder.js
   @version: 2.1  (2025‑05‑07)
   ========================================================= */

   import {
    createDescriptionField,
    createExtraInfoField
  } from "../universalForm.js";
  
  function makeRow(label, input, widget = null) {
    const row = document.createElement("div");
    row.classList.add("field-row");
    const lbl = document.createElement("label");
    lbl.textContent = label;
    row.append(lbl, input);
    widget && row.append(widget);
    return row;
  }
  
  function swatch(id) {
    return Object.assign(document.createElement("button"), {
      type: "button",
      className: "color-swatch",
      id
    });
  }
  
  export function createItemForm() {
    const form = document.createElement("form");
  
    /* basic inputs */
    const fldName   = Object.assign(document.createElement("input"), { type:"text"  });
    const fldType   = Object.assign(document.createElement("select"));
    const fldRarity = Object.assign(document.createElement("select"));
    const fldValue  = Object.assign(document.createElement("input"), { type:"number", min:"0" });
    const fldQty    = Object.assign(document.createElement("input"), { type:"number", min:"0" });
  
    /* populate selects (static options kept short here) */
    ["", "Crafting Material", "Consumable"].forEach(t => {
      const o = new Option(t, t); fldType.append(o);
    });
    ["", "Common", "Uncommon", "Rare"].forEach(r => {
      const o = new Option(r, r); fldRarity.append(o);
    });
  
    /* colour swatches */
    const swName  = swatch("sw-name");
    const swType  = swatch("sw-type");
    const swRarity= swatch("sw-rarity");
    const swDesc  = swatch("sw-desc");
    const swVal   = swatch("sw-val");
    const swQty   = swatch("sw-qty");
  
    /* description & extra lines */
    const { row: rowDesc, textarea: fldDesc } = createDescriptionField();
    rowDesc.append(swDesc);
    const { row: rowExtra, extraInfo } = createExtraInfoField({ withDividers:true });
  
    /* assemble */
    form.append(
      makeRow("Name:",      fldName,   swName),
      makeRow("Item Type:", fldType,   swType),
      makeRow("Rarity:",    fldRarity, swRarity),
      rowDesc,
      rowExtra,
      makeRow("Value:",     fldValue,  swVal),
      makeRow("Quantity:",  fldQty,    swQty)
    );
  
    return {
      form,
      fields: {
        /* inputs */
        fldName, fldType, fldRarity, fldValue, fldQty, fldDesc,
        /* swatches */
        colorName: swName,
        colorType: swType,
        colorRarity: swRarity,
        colorDesc: swDesc,
        colorValue: swVal,
        colorQty: swQty,
        /* extra */
        extraInfo
      }
    };
  }
  