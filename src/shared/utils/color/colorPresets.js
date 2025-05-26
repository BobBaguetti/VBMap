// @file: src/shared/utils/color/colorPresets.js
// @version: 6 — added healthColor preset

/**
 * Default color for names when none is specified or on reset.
 */
export const defaultNameColor = "#E5E6E8";

/**
 * Gold coins color.
 */
export const goldColor = "#D4AF37";

/**
 * Health (HP) icon color.
 */
export const healthColor = "#70ca3d";  

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
 * NPC disposition colors
 */
export const dispositionColors = {
  Friendly: "#b0f0b0",
  Neutral:  "#f0f0b0",
  Hostile:  "#f0b0b0",
  "":       "#bbb"
};

/**
 * NPC type colors
 */
export const tierColors = {
  Normal: "#b4b4b4",
  Elite:  "#d4af37",
  Boss:   "#e05252",
  "":     "#bbb"
};
