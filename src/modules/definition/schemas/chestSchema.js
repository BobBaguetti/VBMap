// @file: src/modules/definition/schemas/chestSchema.js
// @version: 1.2 — removed showInFilters; filter toggle now only in subheader

export const chestSchema = {
  name:           { type: "text",     label: "Name",            colorable: "nameColor" },
  category:       { type: "select",   label: "Category",        options: ["Normal","Dragonvault"] },
  size:           { type: "select",   label: "Size",            options: ["Small","Medium","Large"] },
  lootPool:       {
    type:         "chipList",
    label:        "Loot Pool",
    idKey:        "id",
    labelKey:     "name",
    renderIcon:   item => item.imageSmall
  },
  description:    { type: "textarea", label: "Description",     colorable: "descriptionColor" },
  imageSmall:     { type: "imageUrl", label: "Icon URL" },
  extraLines:     { type: "extraInfo",label: "Extra Info",      withDividers: true }
};
