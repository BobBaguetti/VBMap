// @fullfile: Send the entire file, no omissions or abridgments.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 6   The current file version is 6. Increase by 1 every time you update anything.
// @file:    /scripts/modules/ui/modals/itemDefinitionsModal.js

import {
  loadItemDefinitions,
  addItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "../../services/itemDefinitionsService.js";

/**
 * Initialise the Manage Items modal.
 * @param {firebase.firestore.Firestore} db
 * @param {Function} onDefinitionsChanged
 */
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

  let allDefinitions = [];

  function renderDefinitions(defs) {
    defs.sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() || a.updatedAt || a.createdAt?.toMillis?.() || 0;
      const bTime = b.updatedAt?.toMillis?.() || b.updatedAt || b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
    listWrap.innerHTML = "";
    defs.forEach(def => {
      const row = document.createElement("div");
      row.className = "item-def-entry";

      const rare = def.rarity ? def.rarity.charAt(0).toUpperCase() + def.rarity.slice(1) : "";
      const content = document.createElement("div");
      content.innerHTML = `
        <span class="def-name"><strong>${def.name}</strong></span>
        (<span class="def-type">${def.itemType||def.type}</span>)
        – <span class="def-rarity">${rare}</span>
        <br/><em>${def.description||""}</em>
      `;
      row.appendChild(content);

      const tf = document.createElement("div");
      tf.className = "add-filter-toggle";
      tf.innerHTML = `
        <label><input type="checkbox" data-show-filter="${def.id}"
          ${def.showInFilters?"checked":""}/> Add Filter</label>
      `;
      tf.querySelector("input").addEventListener("change", async e => {
        def.showInFilters = e.target.checked;
        await updateItemDefinition(db, { id: def.id, showInFilters: def.showInFilters });
        onDefinitionsChanged();
      });
      row.appendChild(tf);

      const btns = document.createElement("div");
      btns.className = "item-action-buttons";
      btns.innerHTML = `
        <button data-edit="${def.id}">Edit</button>
        <button data-delete="${def.id}">Delete</button>
        <button data-copy="${def.id}">Copy</button>
      `;
      btns.querySelector("[data-edit]").addEventListener("click", () => openEdit(def));
      btns.querySelector("[data-delete]").addEventListener("click", () => deleteDef(def.id));
      btns.querySelector("[data-copy]").addEventListener("click", () => copyDef(def));
      row.appendChild(btns);

      listWrap.appendChild(row);
    });
  }

  function applyFilters() {
    const q = (defSearch.value||"").toLowerCase();
    const filtered = allDefinitions.filter(def => {
      const name   = def.name?.toLowerCase() || "";
      const type   = (def.itemType || def.type || "").toLowerCase();
      const rarity = (def.rarity || "").toLowerCase();
      let show = q ? (name.includes(q) || type.includes(q) || rarity.includes(q)) : true;
      if (!q) {
        if (flags.name && !name.includes(q)) show = false;
        if (flags.type && !type.includes(q)) show = false;
        if (flags.rarity && !rarity.includes(q)) show = false;
      }
      return show;
    });
    renderDefinitions(filtered);
  }

  const flags = { name:false, type:false, rarity:false };
  filterNameBtn.addEventListener("click", () => { flags.name=!flags.name; filterNameBtn.classList.toggle("toggled"); applyFilters(); });
  filterTypeBtn.addEventListener("click", () => { flags.type=!flags.type; filterTypeBtn.classList.toggle("toggled"); applyFilters(); });
  filterRarityBtn.addEventListener("click", () => { flags.rarity=!flags.rarity; filterRarityBtn.classList.toggle("toggled"); applyFilters(); });
  defSearch.addEventListener("input", applyFilters);

  async function loadAndRender() {
    allDefinitions = await loadItemDefinitions(db);
    renderDefinitions(allDefinitions);
  }

  // Render the list of definitions
  async function loadAndRender() {
    listWrap.innerHTML = "";
    let defs = await loadItemDefinitions(db);

    // Sort so most recently added/edited items appear first (based on updatedAt or createdAt)
    defs.sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() || a.updatedAt || a.createdAt?.toMillis?.() || 0;
      const bTime = b.updatedAt?.toMillis?.() || b.updatedAt || b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    defs.forEach(def => {
      const row = document.createElement("div");
      row.className = "item-def-entry";

      // Name, type, rarity (capitalized), description
      const rare = def.rarity ? def.rarity.charAt(0).toUpperCase() + def.rarity.slice(1) : "";
      const content = document.createElement("div");
      content.innerHTML = `
        <span class="def-name"><strong>${def.name}</strong></span>
        (<span class="def-type">${def.itemType||def.type}</span>)
        – <span class="def-rarity">${rare}</span>
        <br/><em>${def.description||""}</em>
      `;
      row.appendChild(content);

      // Add Filter toggle
      const tf = document.createElement("div");
      tf.className = "add-filter-toggle";
      tf.innerHTML = `
        <label><input type="checkbox" data-show-filter="${def.id}"
          ${def.showInFilters?"checked":""}/> Add Filter</label>
      `;
      tf.querySelector("input").addEventListener("change", async e => {
        def.showInFilters = e.target.checked;
        await updateItemDefinition(db, { id: def.id, showInFilters: def.showInFilters });
        onDefinitionsChanged();
      });
      row.appendChild(tf);

      // Edit/Delete/Copy buttons
      const btns = document.createElement("div");
      btns.className = "item-action-buttons";
      btns.innerHTML = `
        <button data-edit="${def.id}">Edit</button>
        <button data-delete="${def.id}">Delete</button>
        <button data-copy="${def.id}">Copy</button>
      `;
      btns.querySelector("[data-edit]").addEventListener("click", () => openEdit(def));
      btns.querySelector("[data-delete]").addEventListener("click", () => deleteDef(def.id));
      btns.querySelector("[data-copy]").addEventListener("click", () => copyDef(def));
      row.appendChild(btns);

      listWrap.appendChild(row);
    });
  }

  // Search + tri-toggle logic
  const flags = { name:false, type:false, rarity:false };
  function applyFilters() {
    const q = (defSearch.value||"").toLowerCase();
    listWrap.childNodes.forEach(entry => {
      const name   = entry.querySelector(".def-name").innerText.toLowerCase();
      const type   = entry.querySelector(".def-type").innerText.toLowerCase();
      const rarity = entry.querySelector(".def-rarity").innerText.toLowerCase();
      // Always filter by search text first
      let show = q 
        ? (name.includes(q) || type.includes(q) || rarity.includes(q))
        : true;
      // If no search text, then apply tri-toggle flags:
      if (!q) {
        if (flags.name   && !name.includes(q))   show = false;
        if (flags.type   && !type.includes(q))   show = false;
        if (flags.rarity && !rarity.includes(q)) show = false;
      }
      entry.style.display = show ? "" : "none";
    });
  }
  // Wire up buttons
  filterNameBtn.addEventListener("click", () => { flags.name=!flags.name; filterNameBtn.classList.toggle("toggled"); applyFilters(); });
  filterTypeBtn.addEventListener("click", () => { flags.type=!flags.type; filterTypeBtn.classList.toggle("toggled"); applyFilters(); });
  filterRarityBtn.addEventListener("click", () => { flags.rarity=!flags.rarity; filterRarityBtn.classList.toggle("toggled"); applyFilters(); });
  defSearch.addEventListener("input", applyFilters);

  // Form handlers
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      name: defName.value.trim()||"Unnamed",
      type: defType.value,
      rarity: defRarity.value,
      description: defDescription.value,
      imageSmall: defImageSmall.value,
      imageBig: defImageBig.value,
      extraLines: JSON.parse(JSON.stringify(extraLines)),
      nameColor: window.pickrDefName.getColor()?.toHEXA()?.toString()||"#E5E6E8",
      itemTypeColor: window.pickrDefType.getColor()?.toHEXA()?.toString()||"#E5E6E8",
      rarityColor: window.pickrDefRarity.getColor()?.toHEXA()?.toString()||"#E5E6E8",
      descriptionColor: window.pickrDefDescription.getColor()?.toHEXA()?.toString()||"#E5E6E8",
      showInFilters: false
    };
    if (defName.dataset.editId) {
      payload.id = defName.dataset.editId;
      delete defName.dataset.editId;
      await updateItemDefinition(db, payload);
    } else {
      await addItemDefinition(db, payload);
    }
    await loadAndRender();
    onDefinitionsChanged();
    resetForm();
  });

  // Helpers for edit/delete/copy
  function openEdit(def) {
    defName.dataset.editId = def.id;
    defName.value = def.name;
    defType.value = def.type;
    defRarity.value = def.rarity;
    defDescription.value = def.description||"";
    defImageSmall.value = def.imageSmall||"";
    defImageBig.value = def.imageBig||"";
    extraLines = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
    renderExtraLines();
    window.pickrDefName.setColor(def.nameColor || "#E5E6E8");
    window.pickrDefType.setColor(def.itemTypeColor || "#E5E6E8");
    window.pickrDefRarity.setColor(def.rarityColor || "#E5E6E8");
    window.pickrDefDescription.setColor(def.descriptionColor || "#E5E6E8");    
    heading3.innerText = "Edit Item";
    openModal();
  }
  async function deleteDef(id) {
    if (!confirm("Delete this item definition?")) return;
    await deleteItemDefinition(db, id);
    await loadAndRender();
    onDefinitionsChanged();
  }
  function copyDef(def) {
    resetForm();
    heading3.innerText = "Add Item";
    defName.value = def.name;
    defType.value = def.type;
    defRarity.value = def.rarity;
    defDescription.value = def.description||"";
    defImageSmall.value = def.imageSmall||"";
    defImageBig.value = def.imageBig||"";
    extraLines = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
    renderExtraLines();
    openModal();
  }

  function resetForm() {
    form.reset();
    extraLines = [];
    renderExtraLines();
    [window.pickrDefName, window.pickrDefType, window.pickrDefRarity, window.pickrDefDescription]
      .forEach(p=>p.setColor("#E5E6E8"));
    heading3.innerText = "Add Item";
  }

  // Modal open/close
  function onKeyDown(e) {
    if (e.key === "Escape") closeModal();
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
  defCancelBtn.addEventListener("click", () => {
    resetForm();
  });
  // Initial load
  return { openModal, closeModal, refresh: loadAndRender };
}

// @version: 3