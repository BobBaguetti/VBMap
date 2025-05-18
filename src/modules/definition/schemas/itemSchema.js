// @file: src/modules/definition/schemas/itemSchema.js
// @version: 1.2 — removed showInFilters; filter toggle now only in subheader

export const itemSchema = {
  name: {
    type:      "text",
    label:     "Name",
    colorable: "nameColor"
  },
  itemType: {
    type:      "select",
    label:     "Item Type",
    options:   ["Crafting Material", "Special", "Consumable", "Quest"],
    colorable: "itemTypeColor"
  },
  rarity: {
    type:      "select",
    label:     "Rarity",
    options:   ["common", "uncommon", "rare", "epic", "legendary"],
    colorable: "rarityColor"
  },
  description: {
    type:      "textarea",
    label:     "Description",
    colorable: "descriptionColor"
  },
  value: {
    type:      "number",
    label:     "Value",
    colorable: "valueColor"
  },
  quantity: {
    type:      "number",
    label:     "Quantity",
    colorable: "quantityColor"
  },
  imageSmall: {
    type:  "imageUrl",
    label: "Image S"
  },
  imageLarge: {
    type:  "imageUrl",
    label: "Image L"
  },
  extraLines: {
    type:         "extraInfo",
    label:        "Extra Info",
    withDividers: true
  }
};
