// @fullfile: Send the entire file, no omissions or abridgments.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted.
// @version: 2
// @file:    /scripts/modules/itemDefinitionsModal.js

import {
  loadItemDefinitions,
  addItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "./itemDefinitionsService.js";

export function initItemDefinitionsModal(db, onDefinitionsChanged = () => {}) {
  const manageBtn     = document.getElementById("manage-item-definitions");
  const modal         = document.getElementById("item-definitions-modal");
  const closeBtn      = document.getElementById("close-item-definitions");
  const listWrap      = document.getElementById("item-definitions-list");
  const form          = document.getElementById("item-definition-form");
  const defName       = document.getElementById("def-name");
  const defType       = document.getElementById("def-type");
  const defRarity     = document.getElementById("def-rarity");
  const defDescription= document.getElementById("def-description");
  const defImgS       = document.getElementById("def-image-small");
  const defImgL       = document.getElementById("def-image-big");
  const defExtraLines = document.getElementById("def-extra-lines");
  const addExtraBtn   = document.getElementById("add-def-extra-line");
  const defSearch     = document.getElementById("def-search");
  const filterNameBtn = document.getElementById("filter-name");
  const filterTypeBtn = document.getElementById("filter-type");
  const filterRarityBtn = document.getElementById("filter-rarity");
  const heading3      = document.getElementById("def-form-subheading");
  const defCancelBtn  = document.getElementById("def-cancel");

  // Factory for top‐level Pickrs
  function createPicker(selector) {
    const el = document.querySelector(selector);
    if (!el) return { on:()=>{}, setColor:()=>{}, getColor:()=>({ toHEXA:()=>["#E5E6E8"] }) };
    const p = Pickr.create({
      el: selector,
      theme: "nano",
      default: "#E5E6E8",
      components: {
        preview:true, opacity:true, hue:true,
        interaction:{ hex:true, rgba:true, input:true, save:true }
      }
    });
    p.setColor("#E5E6E8");
    p.on("save", (_i, pickr) => pickr.hide());
    return p;
  }
  const pkName = createPicker("#pickr-def-name");
  const pkType = createPicker("#pickr-def-type");
  const pkRare = createPicker("#pickr-def-rarity");
  const pkDesc = createPicker("#pickr-def-description");

  // Extra‐info lines
  let extraLines = [];
  function renderExtraLines() {
    defExtraLines.innerHTML = "";
    extraLines.forEach((line,i) => {
      const row = document.createElement("div");
      row.className = "field-row"; row.style.marginBottom="5px";

      const txt = document.createElement("input");
      txt.type="text"; txt.value=line.text;
      txt.style.cssText="width:100%;background:#303030;color:#e0e0e0;padding:4px 6px;border:1px solid #555;";
      txt.addEventListener("input", ()=> extraLines[i].text = txt.value);

      const clr = document.createElement("div");
      clr.className="color-btn"; clr.style.marginLeft="5px";

      // dynamic picker on this line
      const p = Pickr.create({
        el: clr, theme:"nano", default:line.color||"#E5E6E8",
        components: {
          preview:true, opacity:true, hue:true,
          interaction:{ hex:true, rgba:true, input:true, save:true }
        }
      });
      p.setColor(line.color||"#E5E6E8");
      p.on("change", c=> extraLines[i].color = c.toHEXA().toString())
       .on("save", (_i, pr)=> pr.hide());

      const rm = document.createElement("button");
      rm.type="button"; rm.textContent="×"; rm.style.marginLeft="5px";
      rm.addEventListener("click", () => {
        extraLines.splice(i,1);
        renderExtraLines();
      });

      row.append(txt, clr, rm);
      defExtraLines.appendChild(row);
    });
  }
  addExtraBtn.addEventListener("click", () => {
    extraLines.push({ text:"", color:"#E5E6E8" });
    renderExtraLines();
  });

  // Filter & list logic
  const flags = { name:false, type:false, rarity:false };
  async function loadAndRender() {
    listWrap.innerHTML = "";
    const defs = await loadItemDefinitions(db);
    defs.forEach(def => {
      const row = document.createElement("div");
      row.className = "item-def-entry";
      const rare = def.rarity ? def.rarity[0].toUpperCase()+def.rarity.slice(1) : "";
      row.innerHTML = `
        <div>
          <strong>${def.name}</strong>
          (<em>${def.itemType||def.type}</em>)
          – <span>${rare}</span><br/>
          <em>${def.description||""}</em>
        </div>
        <div class="add-filter-toggle">
          <label>
            <input type="checkbox" data-show-filter="${def.id}" ${def.showInFilters?"checked":""}/> Add Filter
          </label>
        </div>
        <div class="item-action-buttons">
          <button data-edit="${def.id}">Edit</button>
          <button data-delete="${def.id}">Delete</button>
          <button data-copy="${def.id}">Copy</button>
        </div>`;
      // wire up filter toggle
      row.querySelector("[data-show-filter]").addEventListener("change", async e=>{
        def.showInFilters = e.target.checked;
        await updateItemDefinition(db,{ id:def.id, showInFilters:def.showInFilters });
        onDefinitionsChanged();
      });
      // wire action buttons
      row.querySelector("[data-edit]").addEventListener("click",()=>openEdit(def));
      row.querySelector("[data-delete]").addEventListener("click",()=>deleteDef(def.id));
      row.querySelector("[data-copy]").addEventListener("click",()=>copyDef(def));
      listWrap.appendChild(row);
    });
  }
  function applyFilters() {
    const q = defSearch.value.toLowerCase();
    listWrap.childNodes.forEach(entry => {
      const name   = entry.querySelector("strong").innerText.toLowerCase();
      const type   = entry.querySelector("em").innerText.toLowerCase();
      const rarity = entry.querySelector("span").innerText.toLowerCase();
      let show = q ? (name.includes(q)||type.includes(q)||rarity.includes(q)) : true;
      if(!q){
        if(flags.name   && !name.includes(q))   show=false;
        if(flags.type   && !type.includes(q))   show=false;
        if(flags.rarity && !rarity.includes(q)) show=false;
      }
      entry.style.display = show?"":"none";
    });
  }
  filterNameBtn.addEventListener("click", () => { flags.name=!flags.name; filterNameBtn.classList.toggle("toggled"); applyFilters(); });
  filterTypeBtn.addEventListener("click", () => { flags.type=!flags.type; filterTypeBtn.classList.toggle("toggled"); applyFilters(); });
  filterRarityBtn.addEventListener("click", () => { flags.rarity=!flags.rarity; filterRarityBtn.classList.toggle("toggled"); applyFilters(); });
  defSearch.addEventListener("input", applyFilters);

  // Form submit handler
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      name: defName.value.trim()||"Unnamed",
      type: defType.value,
      rarity: defRarity.value,
      description: defDescription.value,
      imageSmall: defImgS.value,
      imageBig: defImgL.value,
      extraLines: [...extraLines],
      nameColor: pkName.getColor().toHEXA().toString(),
      itemTypeColor: pkType.getColor().toHEXA().toString(),
      rarityColor: pkRare.getColor().toHEXA().toString(),
      descriptionColor: pkDesc.getColor().toHEXA().toString(),
      showInFilters: false
    };
    if(defName.dataset.editId){
      payload.id = defName.dataset.editId;
      delete defName.dataset.editId;
      await updateItemDefinition(db,payload);
    } else {
      await addItemDefinition(db,payload);
    }
    await loadAndRender();
    onDefinitionsChanged();
    resetForm();
  });

  // Helpers
  function openEdit(def) {
    defName.dataset.editId = def.id;
    defName.value = def.name;
    defType.value = def.type;
    defRarity.value = def.rarity;
    defDescription.value = def.description||"";
    defImgS.value = def.imageSmall||"";
    defImgL.value = def.imageBig||"";
    extraLines = JSON.parse(JSON.stringify(def.extraLines||[]));
    renderExtraLines();
    heading3.innerText = "Edit Item";
    modal.style.display = "block";
  }
  async function deleteDef(id){
    if(!confirm("Delete this item definition?")) return;
    await deleteItemDefinition(db,id);
    await loadAndRender();
    onDefinitionsChanged();
  }
  function copyDef(def){
    resetForm();
    heading3.innerText = "Add Item";
    defName.value = def.name;
    defType.value = def.type;
    defRarity.value = def.rarity;
    defDescription.value = def.description||"";
    defImgS.value = def.imageSmall||"";
    defImgL.value = def.imageBig||"";
    extraLines = JSON.parse(JSON.stringify(def.extraLines||[]));
    renderExtraLines();
    modal.style.display = "block";
  }
  function resetForm(){
    form.reset();
    extraLines = [];
    renderExtraLines();
    [pkName,pkType,pkRare,pkDesc].forEach(p=>p.setColor("#E5E6E8"));
    heading3.innerText = "Add Item";
  }

  // Show/hide wiring
  manageBtn.addEventListener("click", () => {
    console.log("🖱️ Manage Items clicked");
    modal.style.display = "block";
    loadAndRender();
  });
  closeBtn.addEventListener("click", () => modal.style.display="none");
  defCancelBtn.addEventListener("click", () => modal.style.display="none");
  window.addEventListener("click", e => {
    if(e.target === modal) modal.style.display="none";
  });

  // Initial render
  loadAndRender();

  return { openModal:()=>modal.style.display="block", closeModal:()=>modal.style.display="none", refresh: loadAndRender };
}
