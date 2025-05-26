// @file: src/shared/utils/color/colorPresets.js
// @version: 3 — add chestCategoryColors & npcTierColors

/**
 * Default color for names when none is specified or on reset.
 */
export const defaultNameColor = "#E5E6E8";

export const rarityColors = {
  legendary: "#E6C200",
  epic:      "#a845d4",
  rare:      "#55acef",
  uncommon:  "#70ca3d",
  common:    "#b4b4b4"
};

export const goldColor = "#D4AF37";

export const itemTypeColors = {
  Weapon:            "#6F84AD",
  Armor:             "#6F84AD",
  Consumable:        "#6F84AD",
  Special:           "#6F84AD",
  Quest:             "#6F84AD",
  "Crafting Material":"#6F84AD",
  "":                "#bbb"
};

export const questTypeColors = {
  Main:  "#ffdf91",
  Side:  "#c1dfff",
  Daily: "#d1ffd1",
  "":    "#bbb"
};

/**
 * NPC tier presets: Normal, Elite, Boss
 */
export const npcTierColors = {
  Normal: "#b4b4b4",
  Elite:  "#55acef",
  Boss:   "#E6C200",
  "":     "#bbb"
};

/**
 * Chest category presets: Normal vs Dragonvault
 */
export const chestCategoryColors = {
  Normal:       "#70ca3d",
  Dragonvault:  "#a845d4",
  "":           "#bbb"
};

export const npcTypeColors = {
  Friendly: "#b0f0b0",
  Neutral:  "#f0f0b0",
  Hostile:  "#f0b0b0",
  "":       "#bbb"
};


