// @version: 17
// @file: /scripts/modules/ui/forms/itemDefinitionForm.js

import { createTopAlignedFieldRow } from "../../utils/formUtils.js";
import { createColorButton } from "../uiKit.js";
import { createIcon } from "../../utils/iconUtils.js";
// ─── Add this import ─────────────────────────────────────────────
import { createPickr } from "../../ui/pickrManager.js";

export function createItemDefinitionForm({ onCancel, onSubmit }) {
  const form = document.createElement("form");
  form.id = "item-definition-form";

  let currentId = null;

  // ─────────────────────────────────────────────────────────────
  // Save / Cancel Button Row (Top-Right)
  // ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // Section Heading
  // ─────────────────────────────────────────────────────────────
  const subheading = document.createElement("h3");
  subheading.id = "def-form-subheading";
  subheading.textContent = "Add Item";
  form.appendChild(subheading);

  // ─────────────────────────────────────────────────────────────
  // Name
  // ─────────────────────────────────────────────────────────────
  const nameRow = createTopAlignedFieldRow("Name:");
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.required = true;
  const nameColorBtn = createColorButton("pickr-def-name", "#E5E6E8");
  nameRow.append(nameInput, nameColorBtn);
  form.appendChild(nameRow);

  // ─────────────────────────────────────────────────────────────
  // Item Type
  // ─────────────────────────────────────────────────────────────
  const typeRow = createTopAlignedFieldRow("Item Type:");
  const typeSelect = document.createElement("select");
  ["Crafting Material", "Special", "Consumable", "Quest"].forEach(type => {
    const option = document.createElement("option");
    option.value = option.textContent = type;
    typeSelect.appendChild(option);
  });
  const typeColorBtn = createColorButton("pickr-def-type", "#E5E6E8");
  typeRow.append(typeSelect, typeColorBtn);
  form.appendChild(typeRow);

  // ─────────────────────────────────────────────────────────────
  // Rarity
  // ─────────────────────────────────────────────────────────────
  const rarityRow = createTopAlignedFieldRow("Rarity:");
  const raritySelect = document.createElement("select");
  ["", "Common", "Uncommon", "Rare", "Epic", "Legendary"].forEach(r => {
    const option = document.createElement("option");
    option.value = r.toLowerCase();
    option.textContent = r;
    raritySelect.appendChild(option);
  });
  const rarityColorBtn = createColorButton("pickr-def-rarity", "#E5E6E8");
  rarityRow.append(raritySelect, rarityColorBtn);
  form.appendChild(rarityRow);

  // ─────────────────────────────────────────────────────────────
  // Description
  // ─────────────────────────────────────────────────────────────
  const descRow = createTopAlignedFieldRow("Description:");
  const descTextarea = document.createElement("textarea");
  descTextarea.rows = 2;
  const descColorBtn = createColorButton("pickr-def-description", "#E5E6E8");
  descRow.append(descTextarea, descColorBtn);
  form.appendChild(descRow);

  // ─────────────────────────────────────────────────────────────
  // Sidebar Visibility Toggle
  // ─────────────────────────────────────────────────────────────
  const sidebarRow = document.createElement("div");
  sidebarRow.className = "sidebar-toggle-row";
  const sidebarCheckbox = document.createElement("input");
  sidebarCheckbox.type = "checkbox";
  sidebarCheckbox.id = "def-show-in-filter";
  const sidebarLabel = document.createElement("label");
  sidebarLabel.textContent = "Visible in Sidebar";
  sidebarRow.append(sidebarCheckbox, sidebarLabel);
  form.appendChild(sidebarRow);

  // ─────────────────────────────────────────────────────────────
  // Extra Info Block
  // ─────────────────────────────────────────────────────────────
  const extraRow = document.createElement("div");
  extraRow.className = "field-row extra-row";
  const extraLabel = document.createElement("label");
  extraLabel.textContent = "Extra Info:";
  const extraBlock = document.createElement("div");
  extraBlock.className = "extra-info-block";
  const addExtraBtn = document.createElement("button");
  addExtraBtn.type = "button";
  addExtraBtn.textContent = "+";
  addExtraBtn.className = "ui-button";
  extraBlock.appendChild(addExtraBtn);
  extraRow.append(extraLabel, extraBlock);
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
    remove.className = "ui-button";
    remove.textContent = "−";
    remove.addEventListener("click", () => extraLinesContainer.removeChild(row));
    row.append(input, color, remove);
    extraLinesContainer.appendChild(row);
  });

  // ─────────────────────────────────────────────────────────────
  // Images
  // ─────────────────────────────────────────────────────────────
  const imgSmallRow = createTopAlignedFieldRow("Image S:");
  const imgSmallInput = document.createElement("input");
  imgSmallRow.append(imgSmallInput);
  form.appendChild(imgSmallRow);

  const imgBigRow = createTopAlignedFieldRow("Image L:");
  const imgBigInput = document.createElement("input");
  imgBigRow.append(imgBigInput);
  form.appendChild(imgBigRow);

  // ─────────────────────────────────────────────────────────────
  // Form submission handler
  // ─────────────────────────────────────────────────────────────
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
      visibleInSidebar: sidebarCheckbox.checked,
      extraLines: Array.from(extraLinesContainer.children).map(row => ({
        text: row.querySelector("input").value.trim(),
        color: row.querySelector(".color-btn").dataset.color
      }))
    };
    onSubmit(payload);
  });

  // ─────────────────────────────────────────────────────────────
  // ─── Initialise Pickr on the four swatches ─────────────────────
  // ─────────────────────────────────────────────────────────────
  setTimeout(() => {
    [nameColorBtn, typeColorBtn, rarityColorBtn, descColorBtn].forEach(btn => {
      const p = createPickr(`#${btn.id}`);
      // seed initial value
      btn.dataset.color = p.getColor().toHEXA().toString();
      p.on("save", (color, instance) => {
        btn.dataset.color = color.toHEXA().toString();
        instance.hide();
      });
    });
  }, 0);

  // ─────────────────────────────────────────────────────────────
  // Helpers: populate/reset
  // ─────────────────────────────────────────────────────────────
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
    sidebarCheckbox.checked = !!def.visibleInSidebar;
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
      row.append(input, color, remove);
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
    sidebarCheckbox.checked = false;
    extraLinesContainer.innerHTML = "";
    [nameColorBtn, typeColorBtn, rarityColorBtn, descColorBtn].forEach(btn => {
      btn.dataset.color = "#E5E6E8";
    });
    nameInput.focus();
  }

  return { form, populate, reset };
}
