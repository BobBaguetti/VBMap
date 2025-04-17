// scripts/modules/itemDefinitionsModal.js

import {
  loadItemDefinitions,
  addItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "./itemDefinitionsService.js";

export function initItemDefinitionsModal(db, onDefinitionsChanged = () => {}) {
  const manageBtn    = document.getElementById("manage-item-definitions");
  const modal        = document.getElementById("item-definitions-modal");
  const closeBtn     = document.getElementById("close-item-definitions");
  const listWrap     = document.getElementById("item-definitions-list");
  const form         = document.getElementById("item-definition-form");
  const defName      = document.getElementById("def-name");
  const defType      = document.getElementById("def-type");
  const defRarity    = document.getElementById("def-rarity");
  const defDescription = document.getElementById("def-description");
  const defImageSmall  = document.getElementById("def-image-small");
  const defImageBig    = document.getElementById("def-image-big");
  const defExtraLinesContainer = document.getElementById("def-extra-lines");
  const addExtraLineBtn = document.getElementById("add-def-extra-line");
  const defSearch       = document.getElementById("def-search");
  const filterNameBtn   = document.getElementById("filter-name");
  const filterTypeBtn   = document.getElementById("filter-type");
  const filterRarityBtn = document.getElementById("filter-rarity");
  const heading3        = document.getElementById("def-form-subheading");
  const defCancelBtn    = document.getElementById("def-cancel");

  // … (Pickr setup and extra-lines logic unchanged) …

  async function loadAndRender() {
    listWrap.innerHTML = "";
    const defs = await loadItemDefinitions(db);
    defs.forEach(def => {
      const row = document.createElement("div");
      row.className = "item-def-entry";

      // Content
      const content = document.createElement("div");
      content.innerHTML = `
        <strong>${def.name}</strong>
        (<span>${def.itemType||def.type}</span>)
        – <span>${def.rarity||""}</span><br/>
        <em>${def.description||""}</em>
      `;
      row.appendChild(content);

      // Add Filter toggle
      const showDiv = document.createElement("div");
      showDiv.className = "add-filter-toggle";
      showDiv.innerHTML = `
        <label>
          <input type="checkbox" data-show-filter="${def.id}"
            ${def.showInFilters?"checked":""}/>
          Add Filter
        </label>`;
      showDiv.querySelector("input").addEventListener("change", async e => {
        def.showInFilters = e.target.checked;
        await updateItemDefinition(db, { id: def.id, showInFilters: def.showInFilters });
        onDefinitionsChanged();
      });
      row.appendChild(showDiv);

      // Action buttons
      const btns = document.createElement("div");
      btns.className = "item-action-buttons";
      btns.innerHTML = `
        <button data-edit="${def.id}">Edit</button>
        <button data-delete="${def.id}">Delete</button>
        <button data-copy="${def.id}">Copy</button>
      `;
      // Edit
      btns.querySelector("[data-edit]").addEventListener("click", () => { /* …populate edit form… */ });
      // Delete
      btns.querySelector("[data-delete]").addEventListener("click", async () => {
        if (!confirm("Delete this item definition?")) return;
        await deleteItemDefinition(db, def.id);
        await loadAndRender();
        onDefinitionsChanged();
      });
      // Copy → prefill add form
      btns.querySelector("[data-copy]").addEventListener("click", () => { /* …populate add form…*/ });
      row.appendChild(btns);

      listWrap.appendChild(row);
    });
  }

  // Escape key to close modal
  function onKeyDown(e) {
    if (e.key === "Escape" && modal.style.display === "block") {
      modal.style.display = "none";
      document.removeEventListener("keydown", onKeyDown);
    }
  }

  function openModal() {
    modal.style.display = "block";
    loadAndRender();
    document.addEventListener("keydown", onKeyDown);
  }
  function closeModal() {
    modal.style.display = "none";
    document.removeEventListener("keydown", onKeyDown);
  }

  manageBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  window.addEventListener("click", e => { if (e.target === modal) closeModal(); });

  return { openModal, closeModal, refresh: loadAndRender };
}
