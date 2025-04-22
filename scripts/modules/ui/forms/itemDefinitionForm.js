/** @version: 35
 *  @file: /scripts/modules/ui/forms/itemDefinitionForm.js
 */

import { createTopAlignedFieldRow } from "../../utils/formUtils.js";
import { getPickrHexColor } from "../../ui/pickrManager.js";
import { rarityColors, itemTypeColors, goldColor } from "../../utils/colorPresets.js";
import { createIcon } from "../../utils/iconUtils.js";

export function createItemDefinitionForm(formEl, onSave, onDelete, onPreviewUpdate) {
  const fields = {
    name: formEl.querySelector("#def-name"),
    itemType: formEl.querySelector("#def-type"),
    rarity: formEl.querySelector("#def-rarity"),
    description: formEl.querySelector("#def-description"),
    value: formEl.querySelector("#def-value"),
    quantity: formEl.querySelector("#def-quantity"),
    imageS: formEl.querySelector("#def-image-s"),
    imageL: formEl.querySelector("#def-image-l"),
  };

  const pickrs = {
    name: Pickr.create({ el: "#color-name", theme: "nano", default: "#e5e6e8" }),
    itemType: Pickr.create({ el: "#color-type", theme: "nano", default: "#e5e6e8" }),
    rarity: Pickr.create({ el: "#color-rarity", theme: "nano", default: "#e5e6e8" }),
    description: Pickr.create({ el: "#color-description", theme: "nano", default: "#e5e6e8" }),
    value: Pickr.create({ el: "#color-value", theme: "nano", default: goldColor }),
    quantity: Pickr.create({ el: "#color-quantity", theme: "nano", default: "#e5e6e8" }),
  };

  const extraLines = [];
  const extraBtn = formEl.querySelector("#add-extra-line");
  const extraContainer = formEl.querySelector("#extra-lines");

  const plusSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#e5e6e8" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg>`;
  const xSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#e5e6e8" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z"></path></svg>`;
  extraBtn.innerHTML = plusSVG;

  extraBtn.addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "field-row extra-info-line";
    row.style.alignItems = "center";
    const label = document.createElement("input");
    label.type = "text";
    label.placeholder = "Label";
    const value = document.createElement("input");
    value.type = "text";
    value.placeholder = "Value";
    const colorBtn = document.createElement("div");
    colorBtn.className = "color-btn";
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-line-btn";
    removeBtn.innerHTML = xSVG;
    row.append(label, value, colorBtn, removeBtn);
    extraContainer.appendChild(row);

    const pickr = Pickr.create({ el: colorBtn, theme: "nano", default: "#e5e6e8" });
    extraLines.push({ row, label, value, colorBtn, pickr });

    removeBtn.addEventListener("click", () => {
      row.remove();
      const index = extraLines.findIndex((x) => x.row === row);
      if (index !== -1) extraLines.splice(index, 1);
      updatePreview();
    });

    updatePreview();
  });

  function getColors() {
    return {
      name: getPickrHexColor(pickrs.name),
      itemType: getPickrHexColor(pickrs.itemType),
      rarity: getPickrHexColor(pickrs.rarity),
      description: getPickrHexColor(pickrs.description),
      value: getPickrHexColor(pickrs.value),
      quantity: getPickrHexColor(pickrs.quantity),
    };
  }

  function getExtraLines() {
    return extraLines.map((x) => ({
      label: x.label.value,
      value: x.value.value,
      color: getPickrHexColor(x.pickr),
    })).filter((x) => x.label || x.value);
  }

  function updatePreview() {
    if (onPreviewUpdate) onPreviewUpdate(getData());
  }

  function getData() {
    return {
      name: fields.name.value,
      itemType: fields.itemType.value,
      rarity: fields.rarity.value,
      description: fields.description.value,
      value: fields.value.value,
      quantity: fields.quantity.value,
      imageS: fields.imageS.value,
      imageL: fields.imageL.value,
      colors: getColors(),
      extraLines: getExtraLines(),
    };
  }

  function setData(def) {
    fields.name.value = def.name || "";
    fields.itemType.value = def.itemType || "";
    fields.rarity.value = def.rarity || "";
    fields.description.value = def.description || "";
    fields.value.value = def.value || "";
    fields.quantity.value = def.quantity || "";
    fields.imageS.value = def.imageS || "";
    fields.imageL.value = def.imageL || "";

    pickrs.name.setColor(def.colors?.name || "#e5e6e8");
    pickrs.itemType.setColor(def.colors?.itemType || "#e5e6e8");
    pickrs.rarity.setColor(def.colors?.rarity || "#e5e6e8");
    pickrs.description.setColor(def.colors?.description || "#e5e6e8");
    pickrs.value.setColor(def.colors?.value || goldColor);
    pickrs.quantity.setColor(def.colors?.quantity || "#e5e6e8");

    extraContainer.innerHTML = "";
    extraLines.length = 0;
    (def.extraLines || []).forEach((line) => {
      extraBtn.click();
      const latest = extraLines[extraLines.length - 1];
      latest.label.value = line.label;
      latest.value.value = line.value;
      latest.pickr.setColor(line.color || "#e5e6e8");
    });
  }

  return {
    getData,
    setData,
    getColors,
    getExtraLines,
    updatePreview,
  };
}
