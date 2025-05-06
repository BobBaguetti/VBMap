// @file: /scripts/modules/ui/forms/schemas/itemSchema.js
// @version: 1.0 – schema for item definition forms

export default [
    { key: "name",           type: "text",       label: "Name",           pickr: false },
    { key: "itemType",       type: "select",     label: "Type",           options: ["Weapon","Armor","Consumable","Special","Quest","Crafting Material"], pickr: false },
    { key: "rarity",         type: "select",     label: "Rarity",         options: ["common","uncommon","rare","epic","legendary"], pickr: false },
    { key: "value",          type: "number",     label: "Value",          pickr: false },
    { key: "quantity",       type: "number",     label: "Quantity",       pickr: false },
    { key: "description",    type: "textarea",   label: "Description",    pickr: false },
    { key: "extraLines",     type: "list",       label: "Extra Lines",    pickr: true },
    { key: "imageSmall",     type: "image",      label: "Small Image",    pickr: false },
    { key: "imageBig",       type: "image",      label: "Big Image",      pickr: false },
    { key: "showInFilters",  type: "checkbox",   label: "Show in Filters", pickr: false }
  ];
  