// @file: src/modules/definition/schemas/chestSchema.js
// @version: 1.5 — added “Dev Name” field

export const chestSchema = {
  devName: {
    type:      "text",
    label:     "Dev Name"
  },
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
  imageSmall: {
    type:  "imageUrl",
    label: "Image S:"
  },
  imageLarge: {
    type:  "imageUrl",
    label: "Image L:"
  },
  extraLines: {
    type:         "extraInfo",
    label:        "Extra Info",
    withDividers: true
  }
};
