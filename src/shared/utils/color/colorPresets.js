// @file: src/shared/utils/color/colorPresets.js
// @version: 4 — added npcTypeColors and tierColors

/**
 * Default color for names when none is specified or on reset.
 */
export const defaultNameColor = "#E5E6E8";

/**
 * Gold coins color.
 */
export const goldColor = "#D4AF37";

/**
 * Rarity colors
 */
export const rarityColors = {
  legendary: "#E6C200",
  epic:      "#a845d4",
  rare:      "#55acef",
  uncommon:  "#70ca3d",
  common:    "#b4b4b4"
};

/**
 * Item Type colors
 */
export const itemTypeColors = {
  Weapon:             "#6F84AD",
  Armor:              "#6F84AD",
  Consumable:         "#6F84AD",
  Special:            "#6F84AD",
  Quest:              "#6F84AD",
  "Crafting Material":"#6F84AD",
  "":                 "#bbb"
};

/**
 * Quest type colors
 */
export const questTypeColors = {
  Main:  "#ffdf91",
  Side:  "#c1dfff",
  "":    "#bbb"
};

/**
 * Chest Category colors
 */
export const chestCategoryColors = {
  Normal:     "#8cb369",
  Dragonvault:"#d45f5f",
  "":         "#bbb"
};

/**
 * Preset colors for NPC dispositions (“type”).
 */
export const npcTypeColors = {
  Friendly: "#b0f0b0",
  Neutral:  "#f0f0b0",
  Hostile:  "#f0b0b0",
  "":       "#bbb"
};

/**
 * Preset colors for NPC tiers.
 */
export const tierColors = {
  Normal: "#b4b4b4",
  Elite:  "#70ca3d",
  Boss:   "#a845d4",
  "":      "#bbb"
};
