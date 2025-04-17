// scripts/modules/itemDefinitionsModal.js
// All logic for the “Item Definitions” admin modal lives here.

import {
    loadItemDefinitions,
    addItemDefinition,
    updateItemDefinition,
    deleteItemDefinition
  } from "./itemDefinitionsService.js";
  
  /**
   * Initialise the modal.
   * @param {firebase.firestore.Firestore} db   Firestore instance
   * @param {Function} onDefinitionsChanged     Callback fired after add / edit / delete
   * @returns {{ openModal: Function }}
   */
  export function initItemDefinitionsModal(db, onDefinitionsChanged = () => {}) {
    /* ---------------------------------------------------- *
     *  Grab DOM handles
     * ---------------------------------------------------- */
    const manageBtn              = document.getElementById("manage-item-definitions");
    const modal                  = document.getElementById("item-definitions-modal");
    const closeBtn               = document.getElementById("close-item-definitions");
    const listWrap               = document.getElementById("item-definitions-list");
    const form                   = document.getElementById("item-definition-form");
    const defName                = document.getElementById("def-name");
    const defType                = document.getElementById("def-type");
    const defRarity              = document.getElementById("def-rarity");
    const defDescription         = document.getElementById("def-description");
    const defImageSmall          = document.getElementById("def-image-small");
    const defImageBig            = document.getElementById("def-image-big");
    const defExtraLinesContainer = document.getElementById("def-extra-lines");
    const addExtraLineBtn        = document.getElementById("add-def-extra-line");
    const defSearch              = document.getElementById("def-search");
    const filterNameBtn          = document.getElementById("filter-name");
    const filterTypeBtn          = document.getElementById("filter-type");
    const filterRarityBtn        = document.getElementById("filter-rarity");
    const defFormHeading         = document.getElementById("def-form-heading");
    const defFormSubheading      = document.getElementById("def-form-subheading");
    const defCancelBtn           = document.getElementById("def-cancel");
  
    /* ---------------------------------------------------- *
     *  Re‑usable colour picker factory
     * ---------------------------------------------------- */
    function createPicker(selector) {
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
  
    // Make modal Pickrs only once (reuse on every open)
    if (!window.pickrDefName) {
      window.pickrDefName        = createPicker("#pickr-def-name");
      window.pickrDefType        = createPicker("#pickr-def-type");
      window.pickrDefRarity      = createPicker("#pickr-def-rarity");
      window.pickrDefDescription = createPicker("#pickr-def-description");
    }
  
    /* ---------------------------------------------------- *
     *  Local state for “extra info” lines
     * ---------------------------------------------------- */
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
        removeBtn.textContent = "x";
        removeBtn.style.marginLeft = "5px";
        removeBtn.addEventListener("click", () => {
          extraLines.splice(idx, 1);
          renderExtraLines();
        });
  
        row.appendChild(txt);
        row.appendChild(colorBox);
        row.appendChild(removeBtn);
        defExtraLinesContainer.appendChild(row);
  
        // Per‑line Pickr
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
          .on("change", (c) => { extraLines[idx].color = c.toHEXA().toString(); })
          .on("save",  (_, p) => p.hide())
          .setColor(lineObj.color || "#E5E6E8");
      });
    }
  
    addExtraLineBtn.addEventListener("click", () => {
      extraLines.push({ text: "", color: "#E5E6E8" });
      renderExtraLines();
    });
  
    /* ---------------------------------------------------- *
     *  Firestore → list render
     * ---------------------------------------------------- */
    async function loadAndRender() {
      try {
        const defs = await loadItemDefinitions(db);
        listWrap.innerHTML = "";
        defs.forEach(def => {
          const row = document.createElement("div");
          row.className = "item-def-entry";
          row.style.borderBottom = "1px solid #555";
          row.style.padding = "5px 0";
          row.innerHTML = `
            <span class="def-name"><strong>${def.name}</strong></span>
            (<span class="def-type">${def.itemType || def.type}</span>) –
            <span class="def-rarity">${def.rarity || ""}</span>
            <br/><em class="def-description">${def.description || ""}</em>
            <br/>
            <button data-edit="${def.id}">Edit</button>
            <button data-delete="${def.id}">Delete</button>
          `;
          listWrap.appendChild(row);
  
          /* ----- EDIT button ----- */
          row.querySelector("[data-edit]").addEventListener("click", () => {
            defName.value        = def.name;
            defType.value        = def.type;
            defRarity.value      = def.rarity || "";
            defDescription.value = def.description || "";
            defImageSmall.value  = def.imageSmall || "";
            defImageBig.value    = def.imageBig || "";
            extraLines           = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
            renderExtraLines();
            defName.dataset.editId = def.id;
            window.pickrDefName       .setColor(def.nameColor        || "#E5E6E8");
            window.pickrDefType       .setColor(def.itemTypeColor    || "#E5E6E8");
            window.pickrDefRarity     .setColor(def.rarityColor      || "#E5E6E8");
            window.pickrDefDescription.setColor(def.descriptionColor || "#E5E6E8");
            defFormHeading.innerText    = "Edit Item";
            defFormSubheading.innerText = "Edit Item";
          });
  
          /* ----- DELETE button ----- */
          row.querySelector("[data-delete]").addEventListener("click", async () => {
            if (!confirm("Delete this item definition?")) return;
            await deleteItemDefinition(db, def.id);
            await loadAndRender();
            onDefinitionsChanged();
          });
        });
      } catch (err) { console.error("[ItemModal] load:", err); }
    }
  
    /* ---------------------------------------------------- *
     *  Helpers: search & tri‑toggle filter buttons
     * ---------------------------------------------------- */
    const filterFlags = { name: false, type: false, rarity: false };
    function toggleBtn(btn, flag) {
      if (flag) btn.classList.add("toggled"); else btn.classList.remove("toggled");
    }
    [filterNameBtn, filterTypeBtn, filterRarityBtn].forEach(btn => btn.classList.remove("toggled"));
  
    function applyFilters() {
      const q = defSearch.value.toLowerCase();
      Array.from(listWrap.children).forEach(entry => {
        const name   = entry.querySelector(".def-name")   ?.innerText.toLowerCase() || "";
        const type   = entry.querySelector(".def-type")   ?.innerText.toLowerCase() || "";
        const rarity = entry.querySelector(".def-rarity") ?.innerText.toLowerCase() || "";
        let match = !filterFlags.name && !filterFlags.type && !filterFlags.rarity;
        if (filterFlags.name   && name.includes(q))   match = true;
        if (filterFlags.type   && type.includes(q))   match = true;
        if (filterFlags.rarity && rarity.includes(q)) match = true;
        entry.style.display = match ? "" : "none";
      });
    }
  
    filterNameBtn.addEventListener("click", () => {
      filterFlags.name = !filterFlags.name; toggleBtn(filterNameBtn, filterFlags.name); applyFilters();
    });
    filterTypeBtn.addEventListener("click", () => {
      filterFlags.type = !filterFlags.type; toggleBtn(filterTypeBtn, filterFlags.type); applyFilters();
    });
    filterRarityBtn.addEventListener("click", () => {
      filterFlags.rarity = !filterFlags.rarity; toggleBtn(filterRarityBtn, filterFlags.rarity); applyFilters();
    });
    defSearch.addEventListener("input", applyFilters);
  
    /* ---------------------------------------------------- *
     *  FORM SUBMIT (add or edit)
     * ---------------------------------------------------- */
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        name: defName.value,
        type: defType.value,
        rarity: defRarity.value,
        description: defDescription.value,
        imageSmall: defImageSmall.value,
        imageBig: defImageBig.value,
        extraLines: JSON.parse(JSON.stringify(extraLines)),
        nameColor:        window.pickrDefName.getColor()       ?.toHEXA()?.toString() || "#E5E6E8",
        itemTypeColor:    window.pickrDefType.getColor()       ?.toHEXA()?.toString() || "#E5E6E8",
        rarityColor:      window.pickrDefRarity.getColor()     ?.toHEXA()?.toString() || "#E5E6E8",
        descriptionColor: window.pickrDefDescription.getColor()?.toHEXA()?.toString() || "#E5E6E8"
      };
  
      if (defName.dataset.editId) {
        payload.id = defName.dataset.editId;
        await updateItemDefinition(db, payload);
        delete defName.dataset.editId;
      } else {
        await addItemDefinition(db, payload);
      }
  
      await loadAndRender();
      onDefinitionsChanged();
      resetForm();
    });
  
    /* ---------------------------------------------------- *
     *  FORM CANCEL
     * ---------------------------------------------------- */
    defCancelBtn.addEventListener("click", resetForm);
  
    function resetForm() {
      form.reset();
      extraLines = [];
      defExtraLinesContainer.innerHTML = "";
      window.pickrDefName       .setColor("#E5E6E8");
      window.pickrDefType       .setColor("#E5E6E8");
      window.pickrDefRarity     .setColor("#E5E6E8");
      window.pickrDefDescription.setColor("#E5E6E8");
      defFormHeading.innerText    = "Add Item";
      defFormSubheading.innerText = "Add Item";
    }
  
    /* ---------------------------------------------------- *
     *  Open / close modal
     * ---------------------------------------------------- */
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
    window.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  
    /* ---------------------------------------------------- *
     *  API
     * ---------------------------------------------------- */
    return { openModal, closeModal, refresh: loadAndRender };
  }
  