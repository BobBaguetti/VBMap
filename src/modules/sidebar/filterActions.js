// @file: src/modules/sidebar/filterActions.js
// @version: 1.0 — shared Toggle and Show Only logic for Items, Chests, and NPCs

/**
 * Toggle the individual filter checkbox for the given type/id,
 * and ensure the corresponding Main layer toggle is on.
 *
 * @param {"Item"|"Chest"|"NPC"} type
 * @param {string} id
 */
export function toggleFilter(type, id) {
  const selectors = {
    Item:  `#item-filter-list input[data-item-id="${id}"]`,
    Chest: `${[ "size","category" ]
               .map(f => `[data-chest-filter="${f}"][data-chest-${f}="${id}"]`)
               .join(`],${"#chest-filter-list input"}`)}`,
    NPC:   `#npc-hostile-list input[data-npc-id="${id}"],#npc-friendly-list input[data-npc-id="${id}"]`
  };
  const input = document.querySelector(
    `${type === "Chest" ? "#chest-filter-list input" : type === "Item" ? selectors.Item : selectors.NPC}`
      .replace(/^#chest-filter-list input/, selectors.Chest)
  );

  if (input) input.click();

  // Ensure the Main layer toggle for this type is on
  const mainToggle = document.querySelector(
    `#main-filters .toggle-group input[data-layer="${type}"]`
  );
  if (mainToggle && !mainToggle.checked) mainToggle.click();
}

/**
 * “Show Only” this filter: 
 *   • turn off all other filters of the same type
 *   • for Chests, turn on the opposite group (all sizes if category chosen, or all categories if size chosen)
 *   • turn off every filter of the other two types
 *   • ensure the Main layer toggle is on for this type
 *
 * @param {"Item"|"Chest"|"NPC"} type
 * @param {string} id
 */
export function showOnlyFilter(type, id) {
  const sizeKeys = ["Small","Medium","Large"];
  const catKeys  = ["Normal","Dragonvault"];

  // 1) Main layers: only this type on
  document.querySelectorAll(
    `#main-filters .toggle-group input[data-layer]`
  ).forEach(i => {
    const want = (i.dataset.layer === type);
    if (i.checked !== want) i.click();
  });

  // 2) Item filters
  document.querySelectorAll(`#item-filter-list input[data-item-id]`)
    .forEach(i => {
      const keep = (type === "Item" && i.dataset.itemId === id);
      if (i.checked !== keep) i.click();
    });

  // 3) Chest filters
  if (type === "Chest") {
    const isSize = sizeKeys.includes(id);
    if (isSize) {
      // sizes: only id on
      sizeKeys.forEach(key => {
        const inp = document.querySelector(
          `#chest-filter-list input[data-chest-filter="size"][data-chest-size="${key}"]`
        );
        if (inp.checked !== (key === id)) inp.click();
      });
      // categories: all on
      catKeys.forEach(key => {
        const inp = document.querySelector(
          `#chest-filter-list input[data-chest-filter="category"][data-chest-category="${key}"]`
        );
        if (!inp.checked) inp.click();
      });
    } else {
      // category case: only this category on
      catKeys.forEach(key => {
        const inp = document.querySelector(
          `#chest-filter-list input[data-chest-filter="category"][data-chest-category="${key}"]`
        );
        if (inp.checked !== (key === id)) inp.click();
      });
      // sizes: all on
      sizeKeys.forEach(key => {
        const inp = document.querySelector(
          `#chest-filter-list input[data-chest-filter="size"][data-chest-size="${key}"]`
        );
        if (!inp.checked) inp.click();
      });
    }
  } else {
    // if not Chest, uncheck all chest filters
    document.querySelectorAll(`#chest-filter-list input`).forEach(i => {
      if (i.checked) i.click();
    });
  }

  // 4) NPC filters
  document.querySelectorAll(
    `#npc-hostile-list input[data-npc-id],#npc-friendly-list input[data-npc-id]`
  ).forEach(i => {
    const keep = (type === "NPC" && i.dataset.npcId === id);
    if (i.checked !== keep) i.click();
  });
}
