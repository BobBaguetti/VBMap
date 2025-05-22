// @file: src/modules/definition/schemas/chestSchema.js
// @version: 1.3 — add colorable fields for category & size

export const chestSchema = {
  name: {
    type:      "text",
    label:     "Name",
    colorable: "nameColor"
  },
  category: {
    type:      "select",
    label:     "Category",
    options:   ["Normal", "Dragonvault"],
    colorable: "categoryColor"
  },
  size: {
    type:      "select",
    label:     "Size",
    options:   ["Small", "Medium", "Large"],
    colorable: "sizeColor"
  },
  lootPool: {
    type:       "chipList",
    label:      "Loot Pool",
    idKey:      "id",
    labelKey:   "name",
    renderIcon: item => item.imageSmall
  },
  description: {
    type:      "textarea",
    label:     "Description",
    colorable: "descriptionColor"
  },
  imageSmall:    { type: "imageUrl", label: "Icon URL" },
  extraLines:    { type: "extraInfo", label: "Extra Info", withDividers: true }
};
