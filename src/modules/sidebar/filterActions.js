// @file: src/modules/sidebar/filterActions.js
// @version: 1.0 — centralize checkbox lookup and toggle/show-only logic

/**
 * Locate the sidebar filter checkbox for a given type+key.
 *
 * @param {string} type  – "Item" | "Chest" | "NPC"
 * @param {string} key   – definition ID, or chest size/category key
 * @param {object} selectors
 * @param {string} selectors.itemFilterListSelector
 * @param {string} selectors.chestFilterListSelector
 * @param {string} selectors.npcHostileListSelector
 * @param {string} selectors.npcFriendlyListSelector
 * @returns {HTMLInputElement|null}
 */
export function getFilterInput(type, key, {
  itemFilterListSelector,
  chestFilterListSelector,
  npcHostileListSelector,
  npcFriendlyListSelector
}) {
  if (type === "Item") {
    return document.querySelector(
      `${itemFilterListSelector} input[data-item-id="${key}"]`
    );
  }
  if (type === "Chest") {
    return document.querySelector(
      `${chestFilterListSelector} input[data-chest-filter="size"][data-chest-size="${key}"],` +
      `${chestFilterListSelector} input[data-chest-filter="category"][data-chest-category="${key}"]`
    );
  }
  if (type === "NPC") {
    return document.querySelector(
      `${npcHostileListSelector} input[data-npc-id="${key}"],` +
      `${npcFriendlyListSelector} input[data-npc-id="${key}"]`
    );
  }
  return null;
}

/**
 * Toggle a single filter checkbox.
 */
export function toggleFilter(type, key, selectors) {
  const input = getFilterInput(type, key, selectors);
  if (input) input.click();
}

/**
 * “Show only” this filter: uncheck everything else, check this one, and
 * leave the complementary group on for chests.
 *
 * @param {string} type
 * @param {string} key
 * @param {object} selectors same as getFilterInput
 * @param {string} mainFiltersSelector
 */
export function showOnlyFilter(type, key, selectors, mainFiltersSelector) {
  // 1) Main layers: only this type
  document.querySelectorAll(`${mainFiltersSelector} input[data-layer]`)
    .forEach(i => {
      const want = (i.dataset.layer === type);
      if (i.checked !== want) i.click();
    });

  // 2) Item filters
  if (type === "Item") {
    document.querySelectorAll(`${selectors.itemFilterListSelector} input[data-item-id]`)
      .forEach(i => {
        const keep = (i.dataset.itemId === key);
        if (i.checked !== keep) i.click();
      });
  } else {
    document.querySelectorAll(`${selectors.itemFilterListSelector} input[data-item-id]`)
      .forEach(i => { if (i.checked) i.click(); });
  }

  // 3) Chest filters
  const sizeKeys = ["Small","Medium","Large"];
  const catKeys  = ["Normal","Dragonvault"];
  if (type === "Chest") {
    const isSize = sizeKeys.includes(key);
    if (isSize) {
      // sizes: only key on; categories: all on
      sizeKeys.forEach(k => {
        const inp = getFilterInput("Chest", k, selectors);
        if (inp.checked !== (k === key)) inp.click();
      });
      catKeys.forEach(k => {
        const inp = getFilterInput("Chest", k, selectors);
        if (!inp.checked) inp.click();
      });
    } else {
      // categories: only key on; sizes: all on
      catKeys.forEach(k => {
        const inp = getFilterInput("Chest", k, selectors);
        if (inp.checked !== (k === key)) inp.click();
      });
      sizeKeys.forEach(k => {
        const inp = getFilterInput("Chest", k, selectors);
        if (!inp.checked) inp.click();
      });
    }
  } else {
    // none of this type: clear all chest filters
    [...sizeKeys, ...catKeys].forEach(k => {
      const inp = getFilterInput("Chest", k, selectors);
      if (inp && inp.checked) inp.click();
    });
  }

  // 4) NPC filters
  if (type === "NPC") {
    document.querySelectorAll(
      `${selectors.npcHostileListSelector} input[data-npc-id],` +
      `${selectors.npcFriendlyListSelector} input[data-npc-id]`
    ).forEach(i => {
      const keep = (i.dataset.npcId === key);
      if (i.checked !== keep) i.click();
    });
  } else {
    document.querySelectorAll(
      `${selectors.npcHostileListSelector} input[data-npc-id],` +
      `${selectors.npcFriendlyListSelector} input[data-npc-id]`
    ).forEach(i => { if (i.checked) i.click(); });
  }
}
