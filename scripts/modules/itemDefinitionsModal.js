// @fullfile: Send the entire file, no omissions or abridgments.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted.
// @version: 3   Increase by 1 every time you update anything.
// @file:    /scripts/modules/itemDefinitionsModal.js

import {
  loadItemDefinitions,
  addItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "./itemDefinitionsService.js";

/**
 * Initialise the Manage Items modal.
 * @param {firebase.firestore.Firestore} db
 * @param {Function} onDefinitionsChanged
 */
export function initItemDefinitionsModal(db, onDefinitionsChanged = () => {}) {
  // DOM handles
  const manageBtn               = document.getElementById("manage-item-definitions");
  const modal                   = document.getElementById("item-definitions-modal");
  const closeBtn                = document.getElementById("close-item-definitions");
  const listWrap                = document.getElementById("item-definitions-list");
  const form                    = document.getElementById("item-definition-form");
  const defName                 = document.getElementById("def-name");
  const defType                 = document.getElementById("def-type");
  const defRarity               = document.getElementById("def-rarity");
  const defDescription          = document.getElementById("def-description");
  const defImageSmall           = document.getElementById("def-image-small");
  const defImageBig             = document.getElementById("def-image-big");
  const defExtraLinesContainer  = document.getElementById("def-extra-lines");
  const addExtraLineBtn         = document.getElementById("add-def-extra-line");
  const defSearch               = document.getElementById("def-search");
  const filterNameBtn           = document.getElementById("filter-name");
  const filterTypeBtn           = document.getElementById("filter-type");
  const filterRarityBtn         = document.getElementById("filter-rarity");
  const heading3                = document.getElementById("def-form-subheading");
  const defCancelBtn            = document.getElementById("def-cancel");

  // Wire up the Cancel button
  defCancelBtn.addEventListener("click", closeModal);

  // Utility: create or reuse a Pickr instance
  function createPicker(selector) {
    const el = document.querySelector(selector);
    if (!el) {
      // stub
      return { on: ()=>{}, setColor: ()=>{}, getColor: ()=>({ toHEXA: ()=>["#E5E6E8"], toString: ()=>"#E5E6E8" }) };
    }
    return Pickr.create({
      el: selector,
      theme: "nano",
      default: "#E5E6E8",
      components: {
        preview: true, opacity: true, hue: true,
        interaction: { hex: true, rgba: true, input: true, save: true }
      }
    }).on("save", (_i, picker) => picker.hide());
  }

  // Global pickr instances for the form
  if (!window.pickrDefName) {
    window.pickrDefName        = createPicker("#pickr-def-name");
    window.pickrDefType        = createPicker("#pickr-def-type");
    window.pickrDefRarity      = createPicker("#pickr-def-rarity");
    window.pickrDefDescription = createPicker("#pickr-def-description");
  }

  // Manage extra‑info lines
  let extraLines = [];
  function renderExtraLines() {
    defExtraLinesContainer.innerHTML = "";
    extraLines.forEach((line, i) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.style.marginBottom = "5px";

      // Text input
      const txt = document.createElement("input");
      txt.type = "text";
      txt.value = line.text;
      txt.style.cssText = "width:100%; background:#303030; color:#e0e0e0; padding:4px 6px; border:1px solid #555;";
      txt.addEventListener("input", () => { extraLines[i].text = txt.value; });

      // Color button
      const clr = document.createElement("div");
      clr.className = "color-btn";
      clr.style.marginLeft = "5px";
      clr.style.background = line.color || "#E5E6E8";
      clr.id = `def-extra-color-${i}`;

      // Initialize Pickr on this button
      try {
        Pickr.create({
          el: clr,
          theme: "nano",
          default: line.color || "#E5E6E8",
          components: {
            preview: true, opacity: true, hue: true,
            interaction: { hex: true, rgba: true, input: true, save: true }
          }
        })
        .on("change", c => {
          extraLines[i].color = c.toHEXA().toString();
          clr.style.background = extraLines[i].color;
        })
        .on("save", (_i, p) => p.hide())
        .setColor(line.color || "#E5E6E8");
      } catch {}

      // Remove button
      const rm = document.createElement("button");
      rm.type = "button";
      rm.textContent = "×";
      rm.style.marginLeft = "5px";
      rm.addEventListener("click", () => {
        extraLines.splice(i, 1);
        renderExtraLines();
      });

      row.append(txt, clr, rm);
      defExtraLinesContainer.appendChild(row);
    });
  }
  addExtraLineBtn.addEventListener("click", () => {
    extraLines.push({ text: "", color: "#E5E6E8" });
    renderExtraLines();
  });

  // Render the list of definitions
  async function loadAndRender() {
    listWrap.innerHTML = "";
    const defs = await loadItemDefinitions(db);
    defs.forEach(def => {
      const row = document.createElement("div");
      row.className = "item-def-entry";

      // Content
      const rare = def.rarity ? def.rarity.charAt(0).toUpperCase() + def.rarity.slice(1) : "";
      const content = document.createElement("div");
      content.innerHTML = `
        <span class="def-name"><strong>${def.name}</strong></span>
        (<span class="def-type">${def.itemType||def.type}</span>)
        – <span class="def-rarity">${rare}</span>
        <br/><em>${def.description||""}</em>
      `;
      row.appendChild(content);

      // Add‑filter toggle
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

      // Action buttons
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
    applyFilters();
  }

  // Search + tri‑toggle logic
  const flags = { name:false, type:false, rarity:false };
  function applyFilters() {
    const q = (defSearch.value||"").toLowerCase();
    const anyFlag = flags.name || flags.type || flags.rarity;
    listWrap.childNodes.forEach(entry => {
      const nameTxt   = entry.querySelector(".def-name").innerText.toLowerCase();
      const typeTxt   = entry.querySelector(".def-type").innerText.toLowerCase();
      const rarityTxt = entry.querySelector(".def-rarity").innerText.toLowerCase();
      let show = false;
      if (!q) {
        show = true;
      } else if (!anyFlag) {
        show = nameTxt.includes(q) || typeTxt.includes(q) || rarityTxt.includes(q);
      } else {
        if (flags.name && nameTxt.includes(q)) show = true;
        if (flags.type && typeTxt.includes(q)) show = true;
        if (flags.rarity && rarityTxt.includes(q)) show = true;
      }
      entry.style.display = show ? "" : "none";
    });
  }
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
    // Explicitly set each picker
    window.pickrDefName.setColor(def.nameColor         || "#E5E6E8");
    window.pickrDefType.setColor(def.itemTypeColor    || "#E5E6E8");
    window.pickrDefRarity.setColor(def.rarityColor    || "#E5E6E8");
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
      .forEach(p => p.setColor("#E5E6E8"));
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

  // Initial load
  return { openModal, closeModal, refresh: loadAndRender };
}
