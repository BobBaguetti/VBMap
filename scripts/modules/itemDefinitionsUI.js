// scripts/modules/itemDefinitionsUI.js

import {
    loadItemDefinitions,
    addItemDefinition,
    updateItemDefinition,
    deleteItemDefinition
  } from "./itemDefinitionsService.js";
  
  export function initItemDefinitionsUI(db) {
    // DOM nodes
    const manageBtn     = document.getElementById("manage-item-definitions");
    const modal         = document.getElementById("item-definitions-modal");
    const closeBtn      = document.getElementById("close-item-definitions");
    const listContainer = document.getElementById("item-definitions-list");
    const form          = document.getElementById("item-definition-form");
    const defName       = document.getElementById("def-name");
    const defType       = document.getElementById("def-type");
    const defRarity     = document.getElementById("def-rarity");
    const defDesc       = document.getElementById("def-description");
    const defImgS       = document.getElementById("def-image-small");
    const defImgL       = document.getElementById("def-image-big");
    const extraLinesCt  = document.getElementById("def-extra-lines");
    const addExtraBtn   = document.getElementById("add-def-extra-line");
    const searchInput   = document.getElementById("def-search");
    const filterNameBtn = document.getElementById("filter-name");
    const filterTypeBtn = document.getElementById("filter-type");
    const filterRarityBtn = document.getElementById("filter-rarity");
    const headingMain   = document.getElementById("def-form-heading");
    const headingSub    = document.getElementById("def-form-subheading");
    const cancelBtn     = document.getElementById("def-cancel");
  
    // Pickr instances
    function makePicker(selector) {
      return Pickr.create({
        el: selector,
        theme: 'nano',
        default: '#E5E6E8',
        components: {
          preview: true, opacity: true, hue: true,
          interaction: { hex: true, rgba: true, input: true, save: true }
        }
      }).on('save', (c,p) => p.hide());
    }
    const pickrName  = makePicker('#pickr-def-name');
    const pickrType  = makePicker('#pickr-def-type');
    const pickrRarity= makePicker('#pickr-def-rarity');
    const pickrDesc  = makePicker('#pickr-def-description');
  
    // Internal state
    let extraDefLines = [];
    let filterSettings = { name:false, type:false, rarity:false };
  
    // Render extra‑info lines
    function renderExtraLines() {
      extraLinesCt.innerHTML = "";
      extraDefLines.forEach((ln, i) => {
        const row = document.createElement("div");
        row.className = "field-row"; row.style.marginBottom = "5px";
        const inp = document.createElement("input");
        inp.type = "text"; inp.value = ln.text;
        inp.style.background = "#E5E6E8"; inp.style.color="#000";
        inp.addEventListener("input", e => ln.text = e.target.value);
        const colorBtn = document.createElement("div");
        colorBtn.className = "color-btn"; colorBtn.style.marginLeft="5px";
        const rem = document.createElement("button");
        rem.type="button"; rem.textContent="x"; rem.style.marginLeft="5px";
        rem.addEventListener("click", () => {
          extraDefLines.splice(i,1); renderExtraLines();
        });
        row.append(inp, colorBtn, rem);
        extraLinesCt.append(row);
        const p = makePicker(colorBtn);
        p.setColor(ln.color||"#E5E6E8");
        p.on("change", c => ln.color = c.toHEXA().toString());
      });
    }
    addExtraBtn.addEventListener("click", () => {
      extraDefLines.push({ text:"", color:"#E5E6E8" });
      renderExtraLines();
    });
  
    // Load & display definitions
    async function loadAndRender() {
      listContainer.innerHTML = "";
      const defs = await loadItemDefinitions(db);
      defs.forEach(def => {
        const entry = document.createElement("div");
        entry.className = "item-def-entry";
        entry.style.borderBottom = "1px solid #555";
        entry.style.padding = "5px 0";
        entry.innerHTML = `
          <span class="def-name"><strong>${def.name}</strong></span>
          (<span class="def-type">${def.itemType||def.type}</span>) -
          <span class="def-rarity">${def.rarity||""}</span><br/>
          <em class="def-description">${def.description||""}</em><br/>
          <button data-edit="${def.id}">Edit</button>
          <button data-delete="${def.id}">Delete</button>
        `;
        listContainer.append(entry);
  
        entry.querySelector("[data-edit]").addEventListener("click", () => {
          // populate form
          defName.value = def.name;
          defType .value = def.type;
          defRarity.value = def.rarity||"";
          defDesc .value = def.description||"";
          defImgS .value = def.imageSmall||"";
          defImgL .value = def.imageBig||"";
          extraDefLines = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
          renderExtraLines();
          defName.dataset.editId = def.id;
          pickrName.setColor(def.nameColor||"#E5E6E8");
          pickrType.setColor(def.itemTypeColor||"#E5E6E8");
          pickrRarity.setColor(def.rarityColor||"#E5E6E8");
          pickrDesc.setColor(def.descriptionColor||"#E5E6E8");
          headingMain.innerText = "Edit Item";
          headingSub.innerText = "Edit Item";
        });
  
        entry.querySelector("[data-delete]").addEventListener("click", async () => {
          if (confirm("Delete this item?")) {
            await deleteItemDefinition(db, def.id);
            loadAndRender();
          }
        });
      });
    }
  
    // Filtering logic
    function updateFilterBtn(btn, on) {
      if (on) btn.classList.add("toggled");
      else   btn.classList.remove("toggled");
    }
    [ ['name',filterNameBtn], ['type',filterTypeBtn], ['rarity',filterRarityBtn] ]
      .forEach(([key,btn]) => {
        updateFilterBtn(btn, false);
        btn.addEventListener("click", () => {
          filterSettings[key] = !filterSettings[key];
          updateFilterBtn(btn, filterSettings[key]);
          filterList();
        });
      });
  
    function filterList() {
      const q = searchInput.value.toLowerCase();
      Array.from(listContainer.children).forEach(entry => {
        const nm = entry.querySelector(".def-name")?.innerText.toLowerCase()||"";
        const tp = entry.querySelector(".def-type")?.innerText.toLowerCase()||"";
        const rt = entry.querySelector(".def-rarity")?.innerText.toLowerCase()||"";
        let visible = (!filterSettings.name && !filterSettings.type && !filterSettings.rarity)
                      || (filterSettings.name && nm.includes(q))
                      || (filterSettings.type && tp.includes(q))
                      || (filterSettings.rarity && rt.includes(q));
        entry.style.display = visible ? "" : "none";
      });
    }
    searchInput.addEventListener("input", filterList);
  
    // Open/close modal handlers
    manageBtn.addEventListener("click", async () => {
      modal.style.display = "block";
      // initialize pickrs on first open
      if (!window.pickrDefName) {
        window.pickrDefName = pickrName;
        window.pickrDefType = pickrType;
        window.pickrDefRarity = pickrRarity;
        window.pickrDefDescription = pickrDesc;
      }
      defName.removeAttribute('data-edit-id');
      headingMain.innerText = "Add Item";
      headingSub.innerText = "Add Item";
      form.reset();
      extraDefLines = [];
      renderExtraLines();
      await loadAndRender();
    });
    closeBtn.addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", e => {
      if (e.target === modal) modal.style.display = "none";
    });
  
    // Form submission
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const payload = {
        name: defName.value,
        type: defType.value,
        rarity: defRarity.value,
        description: defDesc.value,
        imageSmall: defImgS.value,
        imageBig: defImgL.value,
        extraLines: JSON.parse(JSON.stringify(extraDefLines)),
        nameColor: pickrName.getColor().toHEXA().toString(),
        itemTypeColor: pickrType.getColor().toHEXA().toString(),
        rarityColor: pickrRarity.getColor().toHEXA().toString(),
        descriptionColor: pickrDesc.getColor().toHEXA().toString()
      };
      const editId = defName.dataset.editId;
      if (editId) {
        payload.id = editId;
        await updateItemDefinition(db, payload);
        delete defName.dataset.editId;
      } else {
        await addItemDefinition(db, payload);
      }
      form.reset();
      extraDefLines = [];
      renderExtraLines();
      headingMain.innerText = "Add Item";
      headingSub.innerText = "Add Item";
      await loadAndRender();
    });
  
    // Cancel form
    cancelBtn.addEventListener("click", () => {
      form.reset();
      extraDefLines = [];
      renderExtraLines();
      headingMain.innerText = "Add Item";
      headingSub.innerText = "Add Item";
    });
  }
  