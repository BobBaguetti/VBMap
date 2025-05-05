// @file:    /scripts/modules/ui/forms/controllers/chestFormController.js
// @version: 3.0 – refactored to use shared inventoryPicker module (2025‑05‑05)

import { createPickr }            from "../../pickrManager.js";
import { getPickrHexColor }       from "../../../utils/colorUtils.js";
import { createChestForm }        from "../builders/chestFormBuilder.js";
import { loadItemDefinitions }    from "../../../services/itemDefinitionsService.js";
import { openInventoryPicker }    from "../../components/inventoryPicker.js";

/**
 * Chest‑definition form controller driven by the **shared inventoryPicker**.
 */
export function createChestFormController(cb, db) {
  const { form, fields } = createChestForm();
  const pickrs   = {};
  let   _id      = null;
  let   allItems = [];

  /* ── Pickr for description colour ────────────────────── */
  function initPickr() {
    if (pickrs.desc || !document.body.contains(fields.colorDesc)) return;
    pickrs.desc = createPickr(`#${fields.colorDesc.id}`);
    const bubble = () => form.dispatchEvent(new Event("input", { bubbles: true }));
    pickrs.desc.on("change", bubble).on("save", bubble);
    fields.colorDesc.addEventListener("click", () => pickrs.desc.show());
  }
  initPickr();

  /* ── load item defs once for chip labels ─────────────── */
  async function ensureItems() {
    if (!allItems.length) allItems = await loadItemDefinitions(db);
  }

  /* ── chip renderer ───────────────────────────────────── */
  async function renderChips() {
    await ensureItems();
    const box = fields.chipContainer;
    box.innerHTML = "";
    fields.lootPool.forEach(id => {
      const def  = allItems.find(i => i.id === id) || { name: id };
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = def.name;

      const x = document.createElement("span");
      x.className  = "remove-chip";
      x.textContent = "×";
      x.onclick = () => {
        const idx = fields.lootPool.indexOf(id);
        if (idx > -1) {
          fields.lootPool.splice(idx, 1);
          renderChips();
        }
      };

      chip.appendChild(x);
      box.appendChild(chip);
    });
  }

  /* ── ⚙︎ button opens the shared picker ───────────────── */
  fields.openLootPicker.onclick = async () => {
    const ids = await openInventoryPicker(db, {
      selectedIds: fields.lootPool,
      title:       "Select Loot Pool Items"
    });
    fields.lootPool.splice(0, fields.lootPool.length, ...ids);
    renderChips();
  };

  /* ── form helpers ────────────────────────────────────── */
  function reset() {
    form.reset();
    _id = null;
    fields.lootPool.length = 0;
    renderChips();
    initPickr();
    pickrs.desc?.setColor("#E5E6E8");
    fields.extraInfo.setLines([], false);
  }

  function populate(def) {
    reset();
    _id = def.id || null;

    fields.fldName.value     = def.name    || "";
    fields.fldIcon.value     = def.iconUrl || "";
    fields.fldSubtext.value  = def.subtext || "";
    fields.fldSize.value     = def.size    || "small";
    fields.fldCategory.value = def.category|| "";

    fields.lootPool.splice(0, 0, ...(def.lootPool || []));
    renderChips();

    fields.fldDesc.value = def.description || "";
    pickrs.desc?.setColor(def.descriptionColor || "#E5E6E8");
    fields.extraInfo.setLines(def.extraLines || [], false);
  }

  function getCurrent() {
    return {
      id:            _id,
      name:          fields.fldName.value.trim(),
      iconUrl:       fields.fldIcon.value.trim(),
      subtext:       fields.fldSubtext.value.trim(),
      size:          fields.fldSize.value,
      category:      fields.fldCategory.value.trim(),
      lootPool:      [...fields.lootPool],
      description:   fields.fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(pickrs.desc),
      extraLines:    fields.extraInfo.getLines()
    };
  }

  /* ── submit wiring ───────────────────────────────────── */
  form.addEventListener("submit", e => {
    e.preventDefault();
    cb?.onSubmit?.(getCurrent());
  });

  return { form, reset, populate, getCurrent, getId: () => _id };
}
