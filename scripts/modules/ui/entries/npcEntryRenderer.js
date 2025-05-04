// @file: /scripts/modules/ui/entries/npcEntryRenderer.js
// @version: 3.0 – now uses makeEntryRenderer

import { makeEntryRenderer } from "../../utils/entryRendererFactory.js";
import { createIcon }        from "../../utils/iconUtils.js";

export const renderNpcEntry = makeEntryRenderer({
  baseClass: "npc-def-entry",
  headerHtml: def => `
    <div class="entry-name">${def.name}</div>
    <div class="entry-delete-wrapper">
      ${createIcon("trash", { inline: true }).outerHTML}
    </div>`,
  metaHtml: def => {
    const roles = (def.typeFlags||[])
      .map(f=>`<span class="entry-role-badge">${f}</span>`).join(" ");
    return `
      <div class="entry-roles">${roles}</div>
      <span class="entry-stat">HP: ${def.health}</span>
      <span class="entry-stat">DMG: ${def.damage}</span>
    `;
  },
  extraHtml: def => def.extraLines?.length
    ? `<div class="entry-extra">${def.extraLines[0].text}</div>`
    : "",
  deleteIcon: { icon: "trash", inline: true }
});
