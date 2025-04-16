// scripts/modules/itemDefinitionsUI.js
import {
    loadItemDefinitions,
    addItemDefinition,
    updateItemDefinition,
    deleteItemDefinition
  } from "./itemDefinitionsService.js";
  
  /**
   * Extracted “Manage Items” modal logic.
   *
   * @param {firebase.firestore.Firestore} db
   * @param {Function} onDefinitionsChanged – called after any add/update/delete
   */
  export function initItemDefinitionsUI(db, onDefinitionsChanged) {
    // DOM refs
    const manageBtn     = document.getElementById("manage-item-definitions");
    const modal         = document.getElementById("item-definitions-modal");
    const closeBtn      = document.getElementById("close-item-definitions");
    const listContainer = document.getElementById("item-definitions-list");
    const form          = document.getElementById("item-definition-form");
    const defName       = document.getElementById("def-name");
    const defType       = document.getElementById("def-type");
    const defRarity     = document.getElementById("def-rarity");
    const defDescription= document.getElementById("def-description");
    const defImageSmall = document.getElementById("def-image-small");
    const defImageBig   = document.getElementById("def-image-big");
    const defExtraLinesContainer = document.getElementById("def-extra-lines");
    const addDefLineBtn = document.getElementById("add-def-extra-line");
    const searchInput   = document.getElementById("def-search");
    const filterNameBtn   = document.getElementById("filter-name");
    const filterTypeBtn   = document.getElementById("filter-type");
    const filterRarityBtn = document.getElementById("filter-rarity");
    const formHeading   = document.getElementById("def-form-heading");
    const formSubhead   = document.getElementById("def-form-subheading");
    const cancelBtn     = document.getElementById("def-cancel");
  
    // Internal state
    let extraDefLines = [];
    let editId        = null;
    const filterSettings = { name:false, type:false, rarity:false };
  
    // Color‑picker factory
    function createPicker(selector) {
      return Pickr.create({
        el: selector,
        theme: 'nano',
        default: '#E5E6E8',
        components: { preview:true, opacity:true, hue:true,
          interaction:{ hex:true, rgba:true, input:true, save:true } }
      }).on('save', (c,p) => p.hide());
    }
    let pickrName, pickrType, pickrRarity, pickrDesc;
  
    // Render the extra‑info lines in the form
    function renderDefExtraLines() {
      defExtraLinesContainer.innerHTML = "";
      extraDefLines.forEach((line, idx) => {
        const row = document.createElement("div");
        row.className = "field-row"; row.style.marginBottom = "5px";
  
        const txt = document.createElement("input");
        txt.type = "text"; txt.value = line.text;
        txt.style.background = "#E5E6E8"; txt.style.color = "#000";
        txt.addEventListener("input", () => line.text = txt.value);
  
        const colorDiv = document.createElement("div");
        colorDiv.className = "color-btn"; colorDiv.style.marginLeft = "5px";
  
        const rem = document.createElement("button");
        rem.type = "button"; rem.textContent = "x"; rem.style.marginLeft = "5px";
        rem.addEventListener("click", () => {
          extraDefLines.splice(idx,1);
          renderDefExtraLines();
        });
  
        row.append(txt, colorDiv, rem);
        defExtraLinesContainer.appendChild(row);
  
        Pickr.create({
          el: colorDiv,
          theme: 'nano',
          default: line.color || "#E5E6E8",
          components: { preview:true, opacity:true, hue:true,
            interaction:{ hex:true, rgba:true, input:true, save:true } }
        })
        .on('change', c => line.color = c.toHEXA().toString())
        .on('save', (c,p) => p.hide());
      });
    }
  
    function updateFilterBtn(btn, active) {
      btn.classList.toggle("toggled", active);
    }
  
    // Show/hide definitions matching filters & search
    function filterDefinitions() {
      const q = searchInput.value.toLowerCase();
      Array.from(listContainer.children).forEach(entry => {
        const nameText   = entry.querySelector('.def-name')?.innerText.toLowerCase()   || "";
        const typeText   = entry.querySelector('.def-type')?.innerText.toLowerCase()   || "";
        const rarityText = entry.querySelector('.def-rarity')?.innerText.toLowerCase() || "";
        let match = !filterSettings.name && !filterSettings.type && !filterSettings.rarity;
        if (filterSettings.name   && nameText.includes(q))   match = true;
        if (filterSettings.type   && typeText.includes(q))   match = true;
        if (filterSettings.rarity && rarityText.includes(q)) match = true;
        entry.style.display = match ? "" : "none";
      });
    }
  
    // Load from Firestore and render list
    async function loadAndRenderDefinitions() {
      listContainer.innerHTML = "";
      const defs = await loadItemDefinitions(db);
      defs.forEach(def => {
        const div = document.createElement("div");
        div.className = "item-def-entry";
        div.style.borderBottom = "1px solid #555";
        div.style.padding = "5px 0";
        div.innerHTML = `
          <span class="def-name"><strong>${def.name}</strong></span>
          (<span class="def-type">${def.itemType||def.type}</span>) -
          <span class="def-rarity">${def.rarity||""}</span>
          <br/><em class="def-description">${def.description||""}</em><br/>
          <button data-edit="${def.id}">Edit</button>
          <button data-delete="${def.id}">Delete</button>
        `;
        listContainer.appendChild(div);
  
        div.querySelector("[data-edit]").addEventListener("click", () => {
          editId = def.id;
          defName.value        = def.name;
          defType.value        = def.type;
          defRarity.value      = def.rarity||"";
          defDescription.value = def.description||"";
          defImageSmall.value  = def.imageSmall||"";
          defImageBig.value    = def.imageBig||"";
          extraDefLines        = def.extraLines? JSON.parse(JSON.stringify(def.extraLines)) : [];
          renderDefExtraLines();
          formHeading.innerText = "Edit Item";
          formSubhead.innerText = "Edit Item";
          pickrName.setColor(def.nameColor||"#E5E6E8");
          pickrType.setColor(def.itemTypeColor||"#E5E6E8");
          pickrRarity.setColor(def.rarityColor||"#E5E6E8");
          pickrDesc.setColor(def.descriptionColor||"#E5E6E8");
        });
  
        div.querySelector("[data-delete]").addEventListener("click", async () => {
          if (confirm("Delete this definition?")) {
            await deleteItemDefinition(db, def.id);
            await loadAndRenderDefinitions();
            onDefinitionsChanged();
          }
        });
      });
    }
  
    // — Event wiring —
    manageBtn.addEventListener("click", async () => {
      modal.style.display = "block";
      await loadAndRenderDefinitions();
      formHeading.innerText = "Add Item";
      formSubhead.innerText = "Add Item";
      if (!pickrName) {
        pickrName   = createPicker('#pickr-def-name');
        pickrType   = createPicker('#pickr-def-type');
        pickrRarity = createPicker('#pickr-def-rarity');
        pickrDesc   = createPicker('#pickr-def-description');
      }
    });
  
    closeBtn.addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });
  
    addDefLineBtn.addEventListener("click", () => {
      extraDefLines.push({ text:"", color:"#E5E6E8" });
      renderDefExtraLines();
    });
  
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const data = {
        name: defName.value,
        type: defType.value,
        rarity: defRarity.value,
        description: defDescription.value,
        imageSmall: defImageSmall.value,
        imageBig: defImageBig.value,
        extraLines: JSON.parse(JSON.stringify(extraDefLines)),
        nameColor: pickrName.getColor()?.toHEXA()?.toString()||"#E5E6E8",
        itemTypeColor: pickrType.getColor()?.toHEXA()?.toString()||"#E5E6E8",
        rarityColor: pickrRarity.getColor()?.toHEXA()?.toString()||"#E5E6E8",
        descriptionColor: pickrDesc.getColor()?.toHEXA()?.toString()||"#E5E6E8"
      };
      if (editId) {
        data.id = editId;
        await updateItemDefinition(db, data);
        editId = null;
      } else {
        await addItemDefinition(db, data);
      }
      form.reset();
      extraDefLines = [];
      defExtraLinesContainer.innerHTML = "";
      pickrName.setColor("#E5E6E8");
      pickrType.setColor("#E5E6E8");
      pickrRarity.setColor("#E5E6E8");
      pickrDesc.setColor("#E5E6E8");
      await loadAndRenderDefinitions();
      onDefinitionsChanged();
      formHeading.innerText = "Add Item";
      formSubhead.innerText = "Add Item";
    });
  
    cancelBtn.addEventListener("click", () => {
      form.reset();
      extraDefLines = [];
      defExtraLinesContainer.innerHTML = "";
      pickrName.setColor("#E5E6E8");
      pickrType.setColor("#E5E6E8");
      pickrRarity.setColor("#E5E6E8");
      pickrDesc.setColor("#E5E6E8");
      formHeading.innerText = "Add Item";
      formSubhead.innerText = "Add Item";
    });
  
    filterNameBtn.addEventListener("click", () => {
      filterSettings.name = !filterSettings.name;
      updateFilterBtn(filterNameBtn, filterSettings.name);
      filterDefinitions();
    });
    filterTypeBtn.addEventListener("click", () => {
      filterSettings.type = !filterSettings.type;
      updateFilterBtn(filterTypeBtn, filterSettings.type);
      filterDefinitions();
    });
    filterRarityBtn.addEventListener("click", () => {
      filterSettings.rarity = !filterSettings.rarity;
      updateFilterBtn(filterRarityBtn, filterSettings.rarity);
      filterDefinitions();
    });
    if (searchInput) searchInput.addEventListener("input", filterDefinitions);
  
    // initialize filter buttons appearance
    updateFilterBtn(filterNameBtn, filterSettings.name);
    updateFilterBtn(filterTypeBtn, filterSettings.type);
    updateFilterBtn(filterRarityBtn, filterSettings.rarity);
  }
  