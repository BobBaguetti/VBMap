// @file: src/modules/definition/form/controller/chestEnhancements.js
import { CHEST_RARITY } from "../../../map/marker/utils.js";
import { rarityColors } from "../../../../shared/utils/color/colorPresets.js";

/**
 * Auto-apply the chest Name color based on Category+Size selects.
 */
export function applyChestRarityLink(fields, pickrs) {
  const catEl = fields.category;
  const sizeEl = fields.size;
  if (!catEl || !sizeEl) return;

  const applyColor = () => {
    const cat = catEl.value;
    const size = sizeEl.value;
    const key = CHEST_RARITY[cat]?.[size];
    const preset = key ? rarityColors[key] : null;
    if (preset) {
      pickrs["nameColor"]?.setColor(preset);
      catEl.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  catEl.addEventListener("change", applyColor);
  sizeEl.addEventListener("change", applyColor);
}
