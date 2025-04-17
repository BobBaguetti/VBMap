// scripts/modules/itemDefinitionsModal.js

import {
  loadItemDefinitions,
  addItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "./itemDefinitionsService.js";

/**
 * Initialise the modal.
 * @param {firebase.firestore.Firestore} db   Firestore instance
 * @param {Function} onDefinitionsChanged     Callback after add/edit/delete
 * @returns {{ openModal: Function, closeModal: Function, refresh: Function }}
 */
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
  const heading2        = document.getElementById("def-form-heading");
  const heading3        = document.getElementById("def-form-subheading");
  const defCancelBtn    = document.getElementById("def-cancel");

  // Safe Pickr factory
  function createPicker(selector) {
    const container = document.querySelector(selector);
    if (!container) {
      console.warn(`itemDefinitionsModal: missing Pickr container ${selector}`);
      const stub = {
        on:        () => stub,
        setColor:  () => {},
        getColor:  () => ({ toHEXA: () => ["#E5E6E8"], toString: () => "#E5E6E8" })
      };
      return stub;
    }
    return Pickr.create({
      el: selector,
      theme: "nano",
      default: "#E5E6E8",
      components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: { hex: true, rgba: true, input: true, save: true }
      }
    }).on("save", (_, p) => p.hide());
  }

  // Initialize or reuse Pickrs
  if (!window.pickrDefName) {
    window.pickrDefName        = createPicker("#pickr-def-name");
    window.pickrDefType        = createPicker("#pickr-def-type");
    window.pickrDefRarity      = createPicker("#pickr-def-rarity");
    window.pickrDefDescription = createPicker("#pickr-def-description");
  }

  // Extra‑info lines state
  let extraLines = [];
  function renderExtraLines() {
    defExtraLinesContainer.innerHTML = "";
    extraLines.forEach((lineObj, idx) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.style.marginBottom = "5px";

      const txt = document.createElement("input");
      txt.type = "text";
      txt.value = lineObj.text;
      txt.style.background = "#E5E6E8";
      txt.style.color = "#000";
      txt.addEventListener("input", () => {
        extraLines[idx].text = txt.value;
      });

      const colorBox = document.createElement("div");
      colorBox.className = "color-btn";
      colorBox.style.marginLeft = "5px";

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "×";
      removeBtn.style.marginLeft = "5px";
      removeBtn.addEventListener("click", () => {
        extraLines.splice(idx, 1);
        renderExtraLines();
      });

      row.append(txt, colorBox, removeBtn);
      defExtraLinesContainer.appendChild(row);

      // Per‑line Pickr
      try {
        Pickr.create({
          el: colorBox,
          theme: "nano",
          default: lineObj.color || "#E5E6E8",
          components: {
            preview: true,
            opacity: true,
            hue: true,
            interaction: { hex: true, rgba: true, input: true, save: true }
          }
        })
          .on("change", c => {
            extraLines[idx].color = c.toHEXA().toString();
          })
          .on("save", (_, p) => p.hide())
          .setColor(lineObj.color || "#E5E6E8");
      } catch (e) {
        console.warn("itemDefinitionsModal: failed to init line Pickr", e);
      }
    });
  }

  addExtraLineBtn.addEventListener("click", () => {
    extraLines.push({ text: "", color: "#E5E6E8" });
    renderExtraLines();
  });

  // Load & render definitions list
  async function loadAndRender() {
    listWrap.innerHTML = "";
    const defs = await loadItemDefinitions(db);
    defs.forEach(def => {
      const row = document.createElement("div");
      row.className = "item-def-entry";
      row.style.position = "relative";
      row.style.paddingTop = "30px";

      // Top-right Show in sidebar
      const showDiv = document.createElement("div");
      showDiv.style.position = "absolute";
      showDiv.style.top = "5px";
      showDiv.style.right = "5px";
      showDiv.innerHTML = `
        <label>
          <input type="checkbox" data-show-filter="${def.id}"
            ${def.showInFilters ? "checked" : ""}/>
          Show
        </label>`;
      row.appendChild(showDiv);

      // Entry content
      const content = document.createElement("div");
      content.innerHTML = `
        <span class="def-name"><strong>${def.name}</strong></span>
        (<span class="def-type">${def.itemType || def.type}</span>) –
        <span class="def-rarity">${def.rarity || ""}</span>
        <br/><em class="def-description">${def.description || ""}</em>
        <br/>
        <button data-edit="${def.id}">Edit</button>
        <button data-delete="${def.id}">Delete</button>
      `;
      row.appendChild(content);

      listWrap.appendChild(row);

      // Show-in-sidebar toggle
      showDiv.querySelector("input").addEventListener("change", async e => {
        def.showInFilters = e.target.checked;
        await updateItemDefinition(db, { id: def.id, showInFilters: def.showInFilters });
        onDefinitionsChanged();
      });

      // Edit button
      row.querySelector("[data-edit]").addEventListener("click", () => {
        defName.value         = def.name;
        defType.value         = def.type;
        defRarity.value       = def.rarity || "";
        defDescription.value  = def.description || "";
        defImageSmall.value   = def.imageSmall || "";
        defImageBig.value     = def.imageBig   || "";
        extraLines            = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
        renderExtraLines();
        defName.dataset.editId = def.id;
        window.pickrDefName       .setColor(def.nameColor        || "#E5E6E8");
        window.pickrDefType       .setColor(def.itemTypeColor    || "#E5E6E8");
        window.pickrDefRarity     .setColor(def.rarityColor      || "#E5E6E8");
        window.pickrDefDescription.setColor(def.descriptionColor || "#E5E6E8");
        heading3.innerText        = "Edit Item";
      });

      // Delete button
      row.querySelector("[data-delete]").addEventListener("click", async () => {
        if (!confirm("Delete this item definition?")) return;
        await deleteItemDefinition(db, def.id);
        await loadAndRender();
        onDefinitionsChanged();
      });
    });
  }

  // Search & tri-toggle filters
  const filterFlags = { name: false, type: false, rarity: false };
  [filterNameBtn, filterTypeBtn, filterRarityBtn].forEach(btn => btn.classList.remove("toggled"));
  function toggleBtn(btn, flag) {
    btn.classList.toggle("toggled", flag);
  }
  function applyFilters() {
    const q = (defSearch.value || "").toLowerCase();
    Array.from(listWrap.children).forEach(entry => {
      const nameVal   = entry.querySelector(".def-name")   ?.innerText.toLowerCase() || "";
      const typeVal   = entry.querySelector(".def-type")   ?.innerText.toLowerCase() || "";
      const rarityVal = entry.querySelector(".def-rarity") ?.innerText.toLowerCase() || "";
      let match = !filterFlags.name && !filterFlags.type && !filterFlags.rarity;
      if (filterFlags.name   && nameVal.includes(q))   match = true;
      if (filterFlags.type   && typeVal.includes(q))   match = true;
      if (filterFlags.rarity && rarityVal.includes(q)) match = true;
      entry.style.display = match ? "" : "none";
    });
  }
  filterNameBtn.addEventListener("click", () => {
    filterFlags.name = !filterFlags.name;
    toggleBtn(filterNameBtn, filterFlags.name);
    applyFilters();
  });
  filterTypeBtn.addEventListener("click", () => {
    filterFlags.type = !filterFlags.type;
    toggleBtn(filterTypeBtn, filterFlags.type);
    applyFilters();
  });
  filterRarityBtn.addEventListener("click", () => {
    filterFlags.rarity = !filterFlags.rarity;
    toggleBtn(filterRarityBtn, filterFlags.rarity);
    applyFilters();
  });
  defSearch.addEventListener("input", applyFilters);

  // Form submit (add or edit)
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      name:             defName.value,
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
    resetForm();
  });

  // Reset form helper
  function resetForm() {
    form.reset();
    extraLines = [];
    defExtraLinesContainer.innerHTML = "";
    window.pickrDefName       .setColor("#E5E6E8");
    window.pickrDefType       .setColor("#E5E6E8");
    window.pickrDefRarity     .setColor("#E5E6E8");
    window.pickrDefDescription.setColor("#E5E6E8");
    heading3.innerText        = "Add Item";
  }
  defCancelBtn.addEventListener("click", resetForm);

  // Open/close modal
  function openModal() {
    modal.style.display = "block";
    loadAndRender();
    resetForm();
  }
  function closeModal() {
    modal.style.display = "none";
  }
  manageBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  window.addEventListener("click", e => {
    if (e.target === modal) closeModal();
  });

  // API
  return {
    openModal,
    closeModal,
    refresh: loadAndRender
  };
}
