// @file: src/modules/map/marker/popups/npcPopup.js
// @version: 1.0 — popup renderer for NPC markers

import { formatRarity } from "../../../utils/utils.js";
import { rarityColors, defaultNameColor } from "../../../utils/colorPresets.js";

/**
 * Render a custom-popup for an NPC definition.
 * @param {Object} def NPC definition, including:
 *   - name, description, extraLines, iconLargeUrl, isHostile, health, damage, faction
 */
export function renderNpcPopup(def) {
  const closeBtn = `<span class="popup-close-btn">✖</span>`;

  // Header icon
  const imgHTML = def.iconLargeUrl
    ? `<img src="${def.iconLargeUrl}" class="popup-image" onerror="this.style.display='none'">`
    : "";

  // Name & faction
  const nameColor = def.nameColor || defaultNameColor;
  const nameHTML = `<div class="popup-name" style="color:${nameColor};">${def.name || ""}</div>`;
  const factionHTML = def.faction
    ? `<div class="popup-type">${def.faction}</div>`
    : "";

  // Hostility badge
  const hostilityLabel = def.isHostile ? "Hostile" : "Friendly";
  const hostilityColor = def.isHostile
    ? varOrDefault("--accent-error", "#c0392b")
    : varOrDefault("--accent-success", "#27ae60");
  const hostileHTML = `<div class="popup-rarity" style="color:${hostilityColor};">${hostilityLabel}</div>`;

  // Stats
  const statsHTML = `
    <div class="popup-info-box">
      <p><strong>Health:</strong> ${def.health ?? "—"}</p>
      <p><strong>Damage:</strong> ${def.damage ?? "—"}</p>
    </div>`;

  // Description & extra
  const descHTML = def.description
    ? `<p class="popup-desc">${def.description}</p>`
    : "";
  const extraHTML = (def.extraLines || [])
    .map(l => `<p class="popup-extra-line">${l.label}: ${l.value}</p>`)
    .join("");
  const infoHTML = (descHTML || extraHTML)
    ? `<div class="popup-info-box">${descHTML}${extraHTML}</div>`
    : "";

  return `
    <div class="custom-popup">
      ${closeBtn}
      <div class="popup-header">
        <div class="popup-header-left">
          ${imgHTML}
          <div class="popup-info">
            ${nameHTML}${factionHTML}${hostileHTML}
          </div>
        </div>
      </div>
      ${statsHTML}
      ${infoHTML}
    </div>`;
}

/**
 * Fallback for CSS variable or default
 */
function varOrDefault(token, fallback) {
  const val = getComputedStyle(document.documentElement).getPropertyValue(token);
  return val ? val.trim() : fallback;
}
