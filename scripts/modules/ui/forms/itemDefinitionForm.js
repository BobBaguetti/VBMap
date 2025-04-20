// @version: 16
// @file: /scripts/modules/ui/forms/itemDefinitionForm.js

import { createTopAlignedFieldRow } from "../../utils/formUtils.js";
import { createColorButton } from "../uiKit.js";
import { createIcon } from "../../utils/iconUtils.js";

export function createItemDefinitionForm({ onCancel, onSubmit }) {
  const form = document.createElement("form");
  form.id = "item-definition-form";

  let currentId = null;

  const buttonRow = document.createElement("div");
  buttonRow.className = "field-row";
  buttonRow.style.justifyContent = "flex-end";

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.className = "ui-button";
  saveBtn.textContent = "Save";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "ui-button";
  cancelBtn.id = "def-cancel";
  cancelBtn.textContent = "Clear";
  cancelBtn.addEventListener("click", () => reset());

  buttonRow.appendChild(saveBtn);
  buttonRow.appendChild(cancelBtn);
  form.appendChild(buttonRow);

  const subheading = document.createElement("h3");
  subheading.id = "def-form-subheading";
  subheading.textContent = "Add Item";
  form.appendChild(subheading);

  const nameRow = createTopAlignedFieldRow("Name:");
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.required = true;
  const nameColorBtn = createColorButton("pickr-def-name", "#E5E6E8");
  nameRow.appendChild(nameInput);
  nameRow.appendChild(nameColorBtn);
  form.appendChild(nameRow);

  const typeRow = createTopAlignedFieldRow("Item Type:");
  const typeSelect = document.createElement("select");
  ["Crafting Material", "Special", "Consumable", "Quest"].forEach(type => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = type;
    typeSelect.appendChild(opt);
  });
  const typeColorBtn = createColorButton("pickr-def-type", "#E5E6E8");
  typeRow.appendChild(typeSelect);
  typeRow.appendChild(typeColorBtn);
  form.appendChild(typeRow);

  const rarityRow = createTopAlignedFieldRow("Rarity:");
  const raritySelect = document.createElement("select");
  ["", "Common", "Uncommon", "Rare", "Epic", "Legendary"].forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.toLowerCase();
    opt.textContent = r;
    raritySelect.appendChild(opt);
  });
  const rarityColorBtn = createColorButton("pickr-def-rarity", "#E5E6E8");
  rarityRow.appendChild(raritySelect);
  rarityRow.appendChild(rarityColorBtn);
  form.appendChild(rarityRow);

  const descRow = createTopAlignedFieldRow("Description:");
  const descTextarea = document.createElement("textarea");
  descTextarea.rows = 2;
  const descColorBtn = createColorButton("pickr-def-description", "#E5E6E8");
  descRow.appendChild(descTextarea);
  descRow.appendChild(descColorBtn);
  form.appendChild(descRow);

  // ✅ Sidebar toggle checkbox
  const toggleRow = createTopAlignedFieldRow("");
  const toggleWrapper = document.createElement("div");
  toggleWrapper.style.display = "flex";
  toggleWrapper.style.alignItems = "center";
  toggleWrapper.style.gap = "8px";

  const toggleInput = document.createElement("input");
  toggleInput.type = "checkbox";
  toggleInput.id = "def-visible";
  toggleInput.style.marginLeft = "2px";

  const toggleLabel = document.createElement("label");
  toggleLabel.textContent = "Visible in Sidebar";
  toggleLabel.setAttribute("for", "def-visible");
  toggleLabel.style.color = "#ccc";

  toggleWrapper.appendChild(toggleInput);
  toggleWrapper.appendChild(toggleLabel);
  toggleRow.appendChild(toggleWrapper);
  form.appendChild(toggleRow);

  const extraRow = createTopAlignedFieldRow("Extra Info:");
  extraRow.classList.add("extra-row");
  const extraBlock = document.createElement("div");
  extraBlock.className = "extra-info-block";
  const addExtraBtn = document.createElement("button");
  addExtraBtn.type = "button";
  addExtraBtn.textContent = "+";
  addExtraBtn.className = "ui-button";
  extraBlock.appendChild(addExtraBtn);
  extraRow.appendChild(extraBlock);
  form.appendChild(extraRow);

  const extraLinesContainer = document.createElement("div");
  form.appendChild(extraLinesContainer);

  addExtraBtn.addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "field-row";
    const input = document.createElement("input");
    const color = createColorButton(null, "#E5E6E8");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "−";
    remove.className = "ui-button";
    remove.addEventListener("click", () => extraLinesContainer.removeChild(row));
    row.appendChild(input);
    row.appendChild(color);
    row.appendChild(remove);
    extraLinesContainer.appendChild(row);
  });

  const imgSmallRow = createTopAlignedFieldRow("Image S:");
  const imgSmallInput = document.createElement("input");
  imgSmallRow.appendChild(imgSmallInput);
  form.appendChild(imgSmallRow);

  const imgBigRow = createTopAlignedFieldRow("Image L:");
  const imgBigInput = document.createElement("input");
  imgBigRow.appendChild(imgBigInput);
  form.appendChild(imgBigRow);

  form.addEventListener("submit", ev => {
    ev.preventDefault();
    const payload = {
      id: currentId,
      name: nameInput.value.trim(),
      nameColor: nameColorBtn.dataset.color,
      itemType: typeSelect.value,
      itemTypeColor: typeColorBtn.dataset.color,
      rarity: raritySelect.value,
      rarityColor: rarityColorBtn.dataset.color,
      description: descTextarea.value.trim(),
      descriptionColor: descColorBtn.dataset.color,
      imageSmall: imgSmallInput.value.trim(),
      imageBig: imgBigInput.value.trim(),
      visibleInSidebar: toggleInput.checked, // ✅ Include in payload
      extraLines: Array.from(extraLinesContainer.children).map(row => ({
        text: row.querySelector("input").value.trim(),
        color: row.querySelector(".color-btn").dataset.color
      }))
    };
    onSubmit(payload);
  });

  function populate(def) {
    currentId = def.id;
    subheading.textContent = "Edit Item";
    cancelBtn.textContent = "Cancel Edit";
    nameInput.value = def.name || "";
    nameColorBtn.dataset.color = def.nameColor || "#E5E6E8";
    typeSelect.value = def.itemType || "Crafting Material";
    typeColorBtn.dataset.color = def.itemTypeColor || "#E5E6E8";
    raritySelect.value = def.rarity || "";
    rarityColorBtn.dataset.color = def.rarityColor || "#E5E6E8";
    descTextarea.value = def.description || "";
    descColorBtn.dataset.color = def.descriptionColor || "#E5E6E8";
    imgSmallInput.value = def.imageSmall || "";
    imgBigInput.value = def.imageBig || "";
    toggleInput.checked = !!def.visibleInSidebar;

    extraLinesContainer.innerHTML = "";
    (def.extraLines || []).forEach(line => {
      const row = document.createElement("div");
      row.className = "field-row";
      const input = document.createElement("input");
      input.value = line.text;
      const color = createColorButton(null, line.color || "#E5E6E8");
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "−";
      remove.className = "ui-button";
      remove.addEventListener("click", () => extraLinesContainer.removeChild(row));
      row.appendChild(input);
      row.appendChild(color);
      row.appendChild(remove);
      extraLinesContainer.appendChild(row);
    });
  }

  function reset() {
    currentId = null;
    subheading.textContent = "Add Item";
    cancelBtn.textContent = "Clear";
    nameInput.value = "";
    typeSelect.value = "Crafting Material";
    raritySelect.value = "";
    descTextarea.value = "";
    imgSmallInput.value = "";
    imgBigInput.value = "";
    toggleInput.checked = false;
    extraLinesContainer.innerHTML = "";
    [nameColorBtn, typeColorBtn, rarityColorBtn, descColorBtn].forEach(btn => {
      btn.dataset.color = "#E5E6E8";
    });
  }

  return { form, populate, reset };
}
