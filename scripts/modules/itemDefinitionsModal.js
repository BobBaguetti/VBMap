import {
  loadItemDefinitions,
  addItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "./itemDefinitionsService.js";

export function initItemDefinitionsModal(db, onDefinitionsChanged = () => {}) {
  // DOM handles
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

  // Create or reuse Pickrs
  function createPicker(selector) {
    const el = document.querySelector(selector);
    if (!el) return { on: ()=>{}, setColor: ()=>{}, getColor: ()=>({toHEXA: ()=>["#E5E6E8"], toString: ()=>"#E5E6E8"}) };
    return Pickr.create({
      el: selector, theme: "nano", default: "#E5E6E8",
      components: { preview:true, opacity:true, hue:true, interaction:{hex:true,rgba:true,input:true,save:true} }
    }).on("save", (_i,p) => p.hide());
  }
  if (!window.pickrDefName) {
    window.pickrDefName        = createPicker("#pickr-def-name");
    window.pickrDefType        = createPicker("#pickr-def-type");
    window.pickrDefRarity      = createPicker("#pickr-def-rarity");
    window.pickrDefDescription = createPicker("#pickr-def-description");
  }

  // Extra-info lines
  let extraLines = [];
  function renderExtraLines() {
    defExtraLinesContainer.innerHTML = "";
    extraLines.forEach((line, idx) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.style.marginBottom = "5px";

      const txt = document.createElement("input");
      txt.type = "text";
      txt.value = line.text;
      txt.style.cssText = "width:100%; background:#303030; color:#e0e0e0; padding:4px 6px; border:1px solid #555;";
      txt.addEventListener("input", () => { extraLines[idx].text = txt.value; });

      const clr = document.createElement("div");
      clr.className = "color-btn";
      clr.style.marginLeft = "5px";
      try {
        Pickr.create({
          el: clr, theme: "nano", default: line.color || "#E5E6E8",
          components: { preview:true, opacity:true, hue:true, interaction:{hex:true,rgba:true,input:true,save:true} }
        })
        .on("change", c => { extraLines[idx].color = c.toHEXA().toString(); })
        .on("save", (_i,p) => p.hide())
        .setColor(line.color || "#E5E6E8");
      } catch {}
      const rm = document.createElement("button");
      rm.type = "button";
      rm.textContent = "×";
      rm.style.marginLeft = "5px";
      rm.addEventListener("click", () => {
        extraLines.splice(idx,1);
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

  // Load & render list
  async function loadAndRender() {
    listWrap.innerHTML = "";
    const defs = await loadItemDefinitions(db);
    defs.forEach(def => {
      const row = document.createElement("div");
      row.className = "item-def-entry";

      // Content with searchable spans + capitalized rarity
      const rarityText = def.rarity
        ? def.rarity.charAt(0).toUpperCase() + def.rarity.slice(1)
        : "";
      const content = document.createElement("div");
      content.innerHTML = `
        <span class="def-name"><strong>${def.name}</strong></span>
        (<span class="def-type">${def.itemType||def.type}</span>)
        – <span class="def-rarity">${rarityText}</span>
        <br/><em>${def.description||""}</em>
      `;
      row.appendChild(content);

      // Add Filter toggle
      const showDiv = document.createElement("div");
      showDiv.className = "add-filter-toggle";
      showDiv.innerHTML = `
        <label>
          <input type="checkbox" data-show-filter="${def.id}"
            ${def.showInFilters ? "checked" : ""}/>
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
      btns.querySelector("[data-edit]").addEventListener("click", () => {
        defName.dataset.editId    = def.id;
        defName.value             = def.name;
        defType.value             = def.type;
        defRarity.value           = def.rarity;
        defDescription.value      = def.description || "";
        defImageSmall.value       = def.imageSmall || "";
        defImageBig.value         = def.imageBig || "";
        extraLines = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
        renderExtraLines();
        window.pickrDefName.setColor(def.nameColor || "#E5E6E8");
        window.pickrDefType.setColor(def.itemTypeColor || "#E5E6E8");
        window.pickrDefRarity.setColor(def.rarityColor || "#E5E6E8");
        window.pickrDefDescription.setColor(def.descriptionColor || "#E5E6E8");
        heading3.innerText = "Edit Item";
      });
      // Delete
      btns.querySelector("[data-delete]").addEventListener("click", async () => {
        if (!confirm("Delete this item definition?")) return;
        await deleteItemDefinition(db, def.id);
        await loadAndRender();
        onDefinitionsChanged();
      });
      // Copy
      btns.querySelector("[data-copy]").addEventListener("click", () => {
        delete defName.dataset.editId;
        form.reset();
        extraLines = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
        renderExtraLines();
        heading3.innerText = "Add Item";
        defName.value       = def.name;
        defType.value       = def.type;
        defRarity.value     = def.rarity;
        defDescription.value= def.description || "";
        defImageSmall.value = def.imageSmall || "";
        defImageBig.value   = def.imageBig || "";
        window.pickrDefName.setColor(def.nameColor || "#E5E6E8");
        window.pickrDefType.setColor(def.itemTypeColor || "#E5E6E8");
        window.pickrDefRarity.setColor(def.rarityColor || "#E5E6E8");
        window.pickrDefDescription.setColor(def.descriptionColor || "#E5E6E8");
      });
      row.appendChild(btns);

      listWrap.appendChild(row);
    });
  }

  // Tri‑toggle + Search filtering
  const filterFlags = { name:false, type:false, rarity:false };
  [filterNameBtn, filterTypeBtn, filterRarityBtn].forEach(btn => btn.classList.remove("toggled"));
  filterNameBtn.addEventListener("click", () => { filterFlags.name = !filterFlags.name; btn.classList.toggle("toggled"); applyFilters(); });
  filterTypeBtn.addEventListener("click", () => { filterFlags.type = !filterFlags.type; btn.classList.toggle("toggled"); applyFilters(); });
  filterRarityBtn.addEventListener("click", () => { filterFlags.rarity = !filterFlags.rarity; btn.classList.toggle("toggled"); applyFilters(); });
  defSearch.addEventListener("input", applyFilters);

  function applyFilters() {
    const q = (defSearch.value || "").toLowerCase();
    Array.from(listWrap.children).forEach(entry => {
      const name   = entry.querySelector(".def-name")?.innerText.toLowerCase() || "";
      const type   = entry.querySelector(".def-type")?.innerText.toLowerCase() || "";
      const rarity = entry.querySelector(".def-rarity")?.innerText.toLowerCase() || "";

      let show;
      if (q) {
        // If user has typed, filter by text in any field
        show = name.includes(q) || type.includes(q) || rarity.includes(q);
      } else {
        // No search text: default to tri‑toggle filter
        show = true;
        if (filterFlags.name && !name.includes(q))   show = false;
        if (filterFlags.type && !type.includes(q))   show = false;
        if (filterFlags.rarity && !rarity.includes(q)) show = false;
      }
      entry.style.display = show ? "" : "none";
    });
  }

  // Form submit
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      name:             defName.value.trim() || "Unnamed",
      type:             defType.value,
      rarity:           defRarity.value,
      description:      defDescription.value,
      imageSmall:       defImageSmall.value,
      imageBig:         defImageBig.value,
      extraLines:       JSON.parse(JSON.stringify(extraLines)),
      nameColor:        window.pickrDefName.getColor()?.toHEXA()?.toString() || "#E5E6E8",
      itemTypeColor:    window.pickrDefType.getColor()?.toHEXA()?.toString() || "#E5E6E8",
      rarityColor:      window.pickrDefRarity.getColor()?.toHEXA()?.toString() || "#E5E6E8",
      descriptionColor: window.pickrDefDescription.getColor()?.toHEXA()?.toString() || "#E5E6E8",
      showInFilters:    false
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
    form.reset();
    extraLines = [];
    renderExtraLines();
    [window.pickrDefName, window.pickrDefType, window.pickrDefRarity, window.pickrDefDescription]
      .forEach(p => p.setColor("#E5E6E8"));
    heading3.innerText = "Add Item";
  });

  // Escape key closes modal
  function onKeyDown(e) {
    if (e.key === "Escape" && modal.style.display === "block") {
      closeModal();
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
