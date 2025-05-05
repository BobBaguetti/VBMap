// @file: /scripts/modules/ui/forms/controllers/npcFormController.js
// @version: 3.0 – uses shared inventoryPicker (2025‑05‑05)

import { createPickr }              from "../../pickrManager.js";
import { getPickrHexColor }         from "../../../utils/colorUtils.js";
import { createNpcForm }            from "../builders/npcFormBuilder.js";
import { loadItemDefinitions }      from "../../../services/itemDefinitionsService.js";
import { openInventoryPicker }      from "../../components/inventoryPicker.js";

/**
 * NPC‑definition form controller
 * (colour pickers + shared inventory picker for loot & vendor).
 */
export function createNpcFormController(cb, db) {
  const { form, fields } = createNpcForm();
  const pickrs   = {};
  let   _id      = null;
  let   allItems = [];

  /* ──────────────── colour pickers ────────────────────── */
  function initPickrs() {
    const attach = (btn, key) => {
      if (pickrs[key] || !document.body.contains(btn)) return;
      pickrs[key] = createPickr(`#${btn.id}`);
      const bounce = () => form.dispatchEvent(new Event("input", { bubbles: true }));
      pickrs[key].on("change", bounce).on("save", bounce);
      btn.addEventListener("click", () => pickrs[key].show());
    };
    attach(fields.swName, "name");
    attach(fields.swHP,   "hp");
    attach(fields.swDMG,  "dmg");
    attach(fields.swDesc, "desc");
  }
  initPickrs();

  /* ──────────────── item defs cache for chip labels ──── */
  async function ensureItems() {
    if (!allItems.length) allItems = await loadItemDefinitions(db);
  }

  async function renderChips(which /* loot|vend */) {
    await ensureItems();
    const box = which === "loot" ? fields.lootChips : fields.vendChips;
    const ids = which === "loot" ? fields.lootPool  : fields.vendInv;
    box.innerHTML = "";
    ids.forEach(id => {
      const def  = allItems.find(i => i.id === id) || { name: id };
      const chip = document.createElement("span");
      chip.className = "loot-pool-chip";
      chip.textContent = def.name;

      const x = document.createElement("span");
      x.className = "remove-chip";
      x.textContent = "×";
      x.onclick = () => {
        ids.splice(ids.indexOf(id), 1);
        renderChips(which);
      };

      chip.appendChild(x);
      box.appendChild(chip);
    });
  }

  /* ─────────────── shared inventoryPicker hooks ──────── */
  fields.btnLoot.onclick = async () => {
    const ids = await openInventoryPicker(db, {
      selectedIds: fields.lootPool,
      title:       "Select Loot Pool Items"
    });
    fields.lootPool.splice(0, fields.lootPool.length, ...ids);
    renderChips("loot");
  };

  fields.btnVend.onclick = async () => {
    const ids = await openInventoryPicker(db, {
      selectedIds: fields.vendInv,
      title:       "Select Vendor Stock Items"
    });
    fields.vendInv.splice(0, fields.vendInv.length, ...ids);
    renderChips("vend");
  };

  /* ─────────────── form helpers ──────────────────────── */
  function reset() {
    form.reset();
    _id = null;
    fields.lootPool.length = 0;
    fields.vendInv.length  = 0;
    renderChips("loot");
    renderChips("vend");

    fields.roleCheckboxes.forEach(cb => (cb.checked = false));
    initPickrs();
    Object.values(pickrs).forEach(p => p.setColor("#E5E6E8"));
    fields.extraInfo.setLines([], false);
  }

  function populate(def) {
    reset();
    _id = def.id || null;

    fields.fldName.value     = def.name               || "";
    fields.fldHealth.value   = def.health             ?? "";
    fields.fldDamage.value   = def.damage             ?? "";
    fields.fldImgSmall.value = def.imageSmallUrl      || "";
    fields.fldImgLarge.value = def.imageLargeUrl      || "";

    /* roles */
    fields.roleCheckboxes.forEach(cb => {
      cb.checked = Array.isArray(def.roles) && def.roles.includes(cb.value);
    });

    /* inventories */
    fields.lootPool.splice(0, 0, ...(def.lootPool       || []));
    fields.vendInv.splice(0, 0, ...(def.vendorInventory || []));
    renderChips("loot");
    renderChips("vend");

    /* colours */
    def.nameColor        && pickrs.name?.setColor(  def.nameColor );
    def.healthColor      && pickrs.hp?.setColor(    def.healthColor );
    def.damageColor      && pickrs.dmg?.setColor(   def.damageColor );
    def.descriptionColor && pickrs.desc?.setColor(  def.descriptionColor );

    /* description & extras */
    fields.fldDesc.value = def.description || "";
    fields.extraInfo.setLines(def.extraLines || [], false);
  }

  function getCurrent() {
    initPickrs();
    return {
      id: _id,

      name:          fields.fldName.value.trim(),
      health:        Number(fields.fldHealth.value) || 0,
      damage:        Number(fields.fldDamage.value) || 0,
      roles:         fields.roleCheckboxes.filter(cb => cb.checked).map(cb => cb.value),

      imageSmallUrl: fields.fldImgSmall.value.trim(),
      imageLargeUrl: fields.fldImgLarge.value.trim(),

      lootPool:        [...fields.lootPool],
      vendorInventory: [...fields.vendInv],

      nameColor:   getPickrHexColor(pickrs.name),
      healthColor: getPickrHexColor(pickrs.hp),
      damageColor: getPickrHexColor(pickrs.dmg),

      description:      fields.fldDesc.value.trim(),
      descriptionColor: getPickrHexColor(pickrs.desc),
      extraLines:       fields.extraInfo.getLines()
    };
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    cb?.onSubmit?.(getCurrent());
  });

  return { form, reset, populate, getCurrent, getId: () => _id };
}
