// @file: src/modules/definition/schemas/npcSchema.js
// @version: 1.1 — added disposition field

export const npcSchema = {
  name: {
    type:      "text",
    label:     "Name",
    colorable: "nameColor"
  },
  disposition: {
    type:      "select",
    label:     "Disposition",
    options:   ["Hostile", "Friendly"],
    colorable: "dispositionColor"
  },
  faction: {
    type:      "select",
    label:     "Faction",
    options:   ["Scrat", "Wild", "Bandit", "Werewolf", "Void"],
    colorable: "factionColor"
  },
  tier: {
    type:    "select",
    label:   "Tier",
    options: ["Normal", "Elite", "Boss"]
  },
  damage: {
    type:  "number",
    label: "Damage"
  },
  hp: {
    type:  "number",
    label: "HP"
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
  extraLines: {
    type:         "extraInfo",
    label:        "Extra Info",
    withDividers: true
  },
  imageSmall: {
    type:  "imageUrl",
    label: "Image URL (Small)"
  },
  imageLarge: {
    type:  "imageUrl",
    label: "Image URL (Large)"
  },
  isVendor: {
    type:  "checkbox",
    label: "Vendor"
  },
  isQuestGiver: {
    type:  "checkbox",
    label: "Quest Giver"
  }
};
