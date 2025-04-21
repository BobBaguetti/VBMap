// @version: 19
// @file: /scripts/modules/ui/forms/itemDefinitionForm.js

import { createTopAlignedFieldRow } from "../../utils/formUtils.js";
import { createColorButton } from "../uiKit.js";
import { createPickr } from "../pickrManager.js";

export function createItemDefinitionForm({ onCancel, onSubmit }) {
  const form = document.createElement("form");
  form.id = "item-definition-form";

  let currentId = null;

  // ─── Header: Title + “Visible in Sidebar” toggle + Save/Clear buttons ───────────────────
  const headerRow = document.createElement("div");
  headerRow.style.display = "flex";
  headerRow.style.alignItems = "center";
  headerRow.style.justifyContent = "space-between";
  headerRow.style.marginBottom = "12px";

  const subheading = document.createElement("h3");
  subheading.id = "def-form-subheading";
  subheading.textContent = "Add / Edit Item";
  subheading.style.fontSize = "1.3em";

  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.alignItems = "center";
  controls.style.gap = "8px";

  const visLabel = document.createElement("label");
  visLabel.style.display = "flex";
  visLabel.style.alignItems = "center";
  const visCb = document.createElement("input");
  visCb.type = "checkbox";
  visCb.id = "def-show-in-filter";
  visLabel.append(visCb, document.createTextNode(" Visible in Sidebar"));

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.className = "ui-button";
  saveBtn.textContent = "Save";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "ui-button";
  cancelBtn.textContent = "Clear";
  cancelBtn.addEventListener("click", reset);

  controls.append(visLabel, saveBtn, cancelBtn);
  headerRow.append(subheading, controls);
  form.append(headerRow);

  // ─── Name ────────────────────────────────────────────────────────────────────────────────
  const nameRow = createTopAlignedFieldRow("Name:");
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.required = true;
  const nameColorBtn = createColorButton("pickr-def-name", "#E5E6E8");
  nameRow.append(nameInput, nameColorBtn);
  form.append(nameRow);

  // ─── Item Type ─────────────────────────────────────────────────────────────────────────
  const typeRow = createTopAlignedFieldRow("Item Type:");
  const typeSelect = document.createElement("select");
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "Select Item Type";
  opt0.disabled = true;
  opt0.selected = true;
  typeSelect.appendChild(opt0);
  ["Crafting Material", "Special", "Consumable", "Quest"].forEach(type => {
    const o = document.createElement("option");
    o.value = o.textContent = type;
    typeSelect.appendChild(o);
  });
  const typeColorBtn = createColorButton("pickr-def-type", "#E5E6E8");
  typeRow.append(typeSelect, typeColorBtn);
  form.append(typeRow);

  // ─── Rarity ─────────────────────────────────────────────────────────────────────────────
  const rarityRow = createTopAlignedFieldRow("Rarity:");
  const raritySelect = document.createElement("select");
  const optR0 = document.createElement("option");
  optR0.value = "";
  optR0.textContent = "Select Rarity";
  optR0.disabled = true;
  optR0.selected = true;
  raritySelect.appendChild(optR0);
  ["common", "uncommon", "rare", "epic", "legendary"].forEach(r => {
    const o = document.createElement("option");
    o.value = r;
    o.textContent = r.charAt(0).toUpperCase() + r.slice(1);
    raritySelect.appendChild(o);
  });
  const rarityColorBtn = createColorButton("pickr-def-rarity", "#E5E6E8");
  rarityRow.append(raritySelect, rarityColorBtn);
  form.append(rarityRow);

  // ─── Description ────────────────────────────────────────────────────────────────────────
  const descRow = createTopAlignedFieldRow("Description:");
  const descTextarea = document.createElement("textarea");
  descTextarea.rows = 2;
  const descColorBtn = createColorButton("pickr-def-description", "#E5E6E8");
  descRow.append(descTextarea, descColorBtn);
  form.append(descRow);

  form.append(document.createElement("hr"));

  // ─── Extra Info ──────────────────────────────────────────────────────────────────────────
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
  form.append(extraRow);

  addExtraBtn.addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "field-row";
    const input = document.createElement("input");
    input.type = "text";
    const colorBtn = createColorButton(`pickr-extra-${Date.now()}`, "#E5E6E8");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ui-button";
    remove.textContent = "−";
    remove.onclick = () => extraBlock.removeChild(row);
    row.append(input, colorBtn, remove);
    extraBlock.appendChild(row);

    // initialize pickr for this extra‑line
    setTimeout(() => {
      const p = createPickr(`#${colorBtn.id}`);
      colorBtn.dataset.color = p.getColor().toHEXA().toString();
      p.on("save", (color, inst) => {
        colorBtn.dataset.color = color.toHEXA().toString();
        inst.hide();
      });
    }, 0);
  });

  form.append(document.createElement("hr"));

  // ─── Value & Quantity ───────────────────────────────────────────────────────────────────
  const valueRow = createTopAlignedFieldRow("Value:");
  const valueInput = document.createElement("input");
  valueRow.append(valueInput);
  form.append(valueRow);

  const qtyRow = createTopAlignedFieldRow("Quantity:");
  const qtyInput = document.createElement("input");
  qtyRow.append(qtyInput);
  form.append(qtyRow);

  // ─── Image S & L ─────────────────────────────────────────────────────────────────────────
  const imgSmallRow = createTopAlignedFieldRow("Image S:");
  imgSmallRow.classList.add("image-row");
  const imgSmallInput = document.createElement("input");
  imgSmallRow.append(imgSmallInput);
  form.append(imgSmallRow);

  const imgBigRow = createTopAlignedFieldRow("Image L:");
  imgBigRow.classList.add("image-row");
  const imgBigInput = document.createElement("input");
  imgBigRow.append(imgBigInput);
  form.append(imgBigRow);

  // ─── Form submission & payload gathering ────────────────────────────────────────────────
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
      visibleInSidebar: visCb.checked,
      extraLines: Array.from(extraBlock.querySelectorAll(".field-row")).map(row => ({
        text: row.querySelector("input").value.trim(),
        color: row.querySelector(".color-btn").dataset.color
      })),
      value: valueInput.value.trim(),
      quantity: qtyInput.value.trim(),
      imageSmall: imgSmallInput.value.trim(),
      imageBig: imgBigInput.value.trim()
    };
    onSubmit(payload);
  });

  // ─── Initialize Pickr on the four header color buttons ─────────────────────────────────
  setTimeout(() => {
    [nameColorBtn, typeColorBtn, rarityColorBtn, descColorBtn].forEach(btn => {
      const p = createPickr(`#${btn.id}`);
      // seed initial dataset
      btn.dataset.color = p.getColor().toHEXA().toString();
      // handle save event
      p.on("save", (color, inst) => {
        const hex = color.toHEXA().toString();
        btn.dataset.color = hex;
        // apply to associated field
        if (btn === nameColorBtn)    nameInput.style.color = hex;
        else if (btn === typeColorBtn)    typeSelect.style.color = hex;
        else if (btn === rarityColorBtn)  raritySelect.style.color = hex;
        else if (btn === descColorBtn)    descTextarea.style.color = hex;
        inst.hide();
      });
    });
  }, 0);

  // ─── Helpers: populate / reset ─────────────────────────────────────────────────────────
  function populate(def) {
    currentId = def.id;
    subheading.textContent = "Edit Item";
    cancelBtn.textContent = "Cancel";
    nameInput.value = def.name || "";
    nameColorBtn.dataset.color = def.nameColor || "#E5E6E8";
    typeSelect.value = def.itemType || "";
    typeColorBtn.dataset.color = def.itemTypeColor || "#E5E6E8";
    raritySelect.value = def.rarity || "";
    rarityColorBtn.dataset.color = def.rarityColor || "#E5E6E8";
    descTextarea.value = def.description || "";
    descColorBtn.dataset.color = def.descriptionColor || "#E5E6E8";
    visCb.checked = !!def.visibleInSidebar;

    extraBlock.innerHTML = "";
    (def.extraLines || []).forEach(line => {
      const row = document.createElement("div");
      row.className = "field-row";
      const input = document.createElement("input");
      input.value = line.text;
      const colorBtn = createColorButton(`pickr-extra-${Date.now()}`, line.color);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ui-button";
      remove.textContent = "−";
      remove.onclick = () => extraBlock.removeChild(row);
      row.append(input, colorBtn, remove);
      extraBlock.appendChild(row);

      // init pickr for this existing extra line
      setTimeout(() => {
        const p = createPickr(`#${colorBtn.id}`);
        colorBtn.dataset.color = p.getColor().toHEXA().toString();
        p.on("save", (color, inst) => {
          colorBtn.dataset.color = color.toHEXA().toString();
          inst.hide();
        });
      }, 0);
    });

    valueInput.value = def.value || "";
    qtyInput.value = def.quantity || "";
    imgSmallInput.value = def.imageSmall || "";
    imgBigInput.value = def.imageBig || "";
  }

  function reset() {
    currentId = null;
    subheading.textContent = "Add / Edit Item";
    cancelBtn.textContent = "Clear";
    nameInput.value = "";
    typeSelect.value = "";
    raritySelect.value = "";
    descTextarea.value = "";
    visCb.checked = false;
    extraBlock.innerHTML = "";
    valueInput.value = "";
    qtyInput.value = "";
    imgSmallInput.value = "";
    imgBigInput.value = "";
    [nameColorBtn, typeColorBtn, rarityColorBtn, descColorBtn].forEach(btn => {
      btn.dataset.color = "#E5E6E8";
    });
    nameInput.focus();
  }

  return { form, populate, reset };
}
