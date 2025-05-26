// @file: src/modules/definition/schemas/npcSchema.js
// @version: 1.3 — made “Tier” colorable so tierColor flows through presets & popups

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
    type:      "select",
    label:     "Tier",
    options:   ["Normal", "Elite", "Boss"],
    colorable: "tierColor"       
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
    label: "Image S:"
  },
  imageLarge: {
    type:  "imageUrl",
    label: "Image L:"
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
