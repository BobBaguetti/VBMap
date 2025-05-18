// @file: src/modules/definition/schemas/itemSchema.js
// @version: 1.3 — reordered image fields to bottom

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
  extraLines: {
    type:         "extraInfo",
    label:        "Extra Info",
    withDividers: true
  },
  imageSmall: {
    type:  "imageUrl",
    label: "Image S"
  },
  imageLarge: {
    type:  "imageUrl",
    label: "Image L"
  }
};
