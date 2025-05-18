// @file: src/modules/definition/schemas/chestSchema.js
// @version: 1.3 — reordered imageSmall to bottom

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
  extraLines:     { type: "extraInfo",label: "Extra Info",      withDividers: true },
  imageSmall:     { type: "imageUrl", label: "Icon URL" }      // moved to bottom
};
