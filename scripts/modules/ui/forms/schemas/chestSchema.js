// @file: /scripts/modules/ui/forms/schemas/chestSchema.js
// @version: 1.0 – schema for chest definition forms

export default [
    { key: "name",        type: "text",      label: "Name",        pickr: false },
    { key: "iconUrl",     type: "image",     label: "Icon URL",    pickr: false },
    { key: "size",        type: "select",    label: "Size",        options: ["Small", "Medium", "Large"], pickr: false },
    { key: "category",    type: "select",    label: "Category",    options: ["Normal", "Dragonvault"], pickr: false },
    { key: "lootPool",    type: "multiselect", label: "Loot Pool",   pickr: false },
    { key: "description", type: "textarea",  label: "Description", pickr: false },
    { key: "extraLines",  type: "list",      label: "Extra Lines", pickr: true }
  ];
  