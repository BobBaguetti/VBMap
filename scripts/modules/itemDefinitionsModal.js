// @fullfile: Send the entire file, no omissions or abridgments.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted.
// @version: 4
// @file:    /scripts/modules/itemDefinitionsModal.js

import {
  loadItemDefinitions,
  addItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from "./itemDefinitionsService.js";
import { Modal } from "./uiKit/modalManager.js";
import { pickerManager } from "./uiKit/pickerManager.js";

/**
 * Initialise the Manage Items modal.
 */
export function initItemDefinitionsModal(db, onDefinitionsChanged = () => {}) {
  const manageBtn = document.getElementById("manage-item-definitions");
  const modalEl   = document.getElementById("item-definitions-modal");
  const closeBtn  = document.getElementById("close-item-definitions");
  const listWrap  = document.getElementById("item-definitions-list");
  const form      = document.getElementById("item-definition-form");
  const defName   = document.getElementById("def-name");
  const defType   = document.getElementById("def-type");
  const defRarity = document.getElementById("def-rarity");
  const defDesc   = document.getElementById("def-description");
  const defImgS   = document.getElementById("def-image-small");
  const defImgL   = document.getElementById("def-image-big");
  const defExtra  = document.getElementById("def-extra-lines");
  const addExtra  = document.getElementById("add-def-extra-line");
  const defSearch = document.getElementById("def-search");
  const filterName   = document.getElementById("filter-name");
  const filterType   = document.getElementById("filter-type");
  const filterRarity = document.getElementById("filter-rarity");
  const heading3     = document.getElementById("def-form-subheading");
  const defCancel    = document.getElementById("def-cancel");

  const modal = new Modal(modalEl);

  /* ---------- Pickers ---------- */
  const pkName = pickerManager.create("#pickr-def-name");
  const pkType = pickerManager.create("#pickr-def-type");
  const pkRare = pickerManager.create("#pickr-def-rarity");
  const pkDesc = pickerManager.create("#pickr-def-description");

  /* ---------- Extra info lines ---------- */
  let extraLines = [];
  function renderExtraLines() {
    defExtra.innerHTML = "";
    extraLines.forEach((line, i) => {
      const row = document.createElement("div");
      row.className = "field-row";
      row.style.marginBottom = "5px";

      const txt = document.createElement("input");
      txt.type = "text";
      txt.value = line.text;
      txt.style.cssText =
        "width:100%; background:#303030; color:#e0e0e0; padding:4px 6px; border:1px solid #555;";
      txt.addEventListener("input", () => (extraLines[i].text = txt.value));

      const clr = document.createElement("div");
      clr.className = "color-btn";
      clr.style.marginLeft = "5px";

      const picker = pickerManager.create(clr);
      if (picker) {
        picker.setColor(line.color || "#E5E6E8");
        picker.on("change", c => {
          extraLines[i].color = c.toHEXA().toString();
        });
      }

      const rm = document.createElement("button");
      rm.type = "button";
      rm.textContent = "×";
      rm.style.marginLeft = "5px";
      rm.addEventListener("click", () => {
        extraLines.splice(i, 1);
        renderExtraLines();
      });

      row.append(txt, clr, rm);
      defExtra.appendChild(row);
    });
  }
  addExtra.addEventListener("click", () => {
    extraLines.push({ text: "", color: "#E5E6E8" });
    renderExtraLines();
  });

  /* ---------- List rendering & filters ---------- */
  const flags = { name: false, type: false, rarity: false };
  async function loadAndRender() {
    listWrap.innerHTML = "";
    const defs = await loadItemDefinitions(db);
    defs.forEach(def => {
      const row = document.createElement("div");
      row.className = "item-def-entry";
      const rare = def.rarity
        ? def.rarity[0].toUpperCase() + def.rarity.slice(1)
        : "";
      const content = document.createElement("div");
      content.innerHTML = `
        <span class="def-name"><strong>${def.name}</strong></span>
        (<span class="def-type">${def.itemType || def.type}</span>)
        – <span class="def-rarity">${rare}</span>
        <br/><em>${def.description || ""}</em>
      `;
      row.appendChild(content);

      const tf = document.createElement("div");
      tf.className = "add-filter-toggle";
      tf.innerHTML = `
        <label>
          <input 
            type="checkbox" 
            data-show-filter="${def.id}" 
            ${def.showInFilters ? "checked" : ""}/>
          Add Filter
        </label>`;
      tf
        .querySelector("input")
        .addEventListener("change", async e => {
          def.showInFilters = e.target.checked;
          await updateItemDefinition(db, {
            id: def.id,
            showInFilters: def.showInFilters
          });
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
      btns
        .querySelector("[data-edit]")
        .addEventListener("click", () => openEdit(def));
      btns
        .querySelector("[data-delete]")
        .addEventListener("click", () => deleteDef(def.id));
      btns
        .querySelector("[data-copy]")
        .addEventListener("click", () => copyDef(def));
      row.appendChild(btns);

      listWrap.appendChild(row);
    });
  }
  function applyFilters() {
    const q = defSearch.value.toLowerCase();
    listWrap.childNodes.forEach(entry => {
      const name = entry
        .querySelector(".def-name")
        .innerText.toLowerCase();
      const type = entry
        .querySelector(".def-type")
        .innerText.toLowerCase();
      const rarity = entry
        .querySelector(".def-rarity")
        .innerText.toLowerCase();
      let show = q
        ? name.includes(q) || type.includes(q) || rarity.includes(q)
        : true;
      if (!q) {
        if (flags.name && !name.includes(q)) show = false;
        if (flags.type && !type.includes(q)) show = false;
        if (flags.rarity && !rarity.includes(q)) show = false;
      }
      entry.style.display = show ? "" : "none";
    });
  }
  filterName.addEventListener("click", () => {
    flags.name = !flags.name;
    filterName.classList.toggle("toggled");
    applyFilters();
  });
  filterType.addEventListener("click", () => {
    flags.type = !flags.type;
    filterType.classList.toggle("toggled");
    applyFilters();
  });
  filterRarity.addEventListener("click", () => {
    flags.rarity = !flags.rarity;
    filterRarity.classList.toggle("toggled");
    applyFilters();
  });
  defSearch.addEventListener("input", applyFilters);

  /* ---------- Form submit ---------- */
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      name: defName.value.trim() || "Unnamed",
      type: defType.value,
      rarity: defRarity.value,
      description: defDesc.value,
      imageSmall: defImgS.value,
      imageBig: defImgL.value,
      extraLines: [...extraLines],
      nameColor: pkName.getColor().toHEXA().toString(),
      itemTypeColor: pkType.getColor().toHEXA().toString(),
      rarityColor: pkRare.getColor().toHEXA().toString(),
      descriptionColor: pkDesc.getColor().toHEXA().toString(),
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

  /* ---------- Helpers & Modal wiring ---------- */
  function openEdit(def) {
    defName.dataset.editId = def.id;
    defName.value = def.name;
    defType.value = def.type;
    defRarity.value = def.rarity;
    defDesc.value = def.description || "";
    defImgS.value = def.imageSmall || "";
    defImgL.value = def.imageBig || "";
    extraLines = JSON.parse(JSON.stringify(def.extraLines || []));
    renderExtraLines();
    heading3.innerText = "Edit Item";
    modal.open();
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
    defDesc.value = def.description || "";
    defImgS.value = def.imageSmall || "";
    defImgL.value = def.imageBig || "";
    extraLines = JSON.parse(JSON.stringify(def.extraLines || []));
    renderExtraLines();
    modal.open();
  }

  manageBtn.addEventListener("click", () => {
    console.log("🖱️ Manage Items clicked");
    modal.open();
  });
  closeBtn.addEventListener("click", () => modal.close());
  defCancel.addEventListener("click", () => modal.close());

  /* ---------- Initial load ---------- */
  loadAndRender();

  return { openModal: () => modal.open(), closeModal: () => modal.close(), refresh: loadAndRender };
}
