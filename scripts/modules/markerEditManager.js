// scripts/modules/markerEditManager.js

import { updateMarker as firebaseUpdateMarker, addMarker as firebaseAddMarker } from "./firebaseService.js";
import { createPopupContent } from "./markerManager.js";
import { formatRarity } from "./utils.js";

/**
 * Handles the marker edit/create modal:
 *  - opening/positioning
 *  - populating form fields
 *  - wiring up Save & Cancel
 *  - wiring up copy/paste mode
 */
export function initMarkerEditManager({
  map,
  layers,
  onNewMarker,
  onUpdateMarker,
  getCopiedData,
  setCopiedData,
  enablePasteMode
}) {
  // DOM elements
  const editModal = document.getElementById("edit-modal");
  const editHandle = document.getElementById("edit-modal-handle");
  const editForm = document.getElementById("edit-form");
  const nameInput = document.getElementById("edit-name");
  const typeSelect = document.getElementById("edit-type");
  const imgSmallInput = document.getElementById("edit-image-small");
  const imgBigInput = document.getElementById("edit-image-big");
  const videoInput = document.getElementById("edit-video-url");
  const itemFields = document.getElementById("item-extra-fields");
  const nonItemDesc = document.getElementById("non-item-description");
  const raritySelect = document.getElementById("edit-rarity");
  const itemTypeSelect = document.getElementById("edit-item-type");
  const descInput = document.getElementById("edit-description");
  const nonItemDescInput = document.getElementById("edit-description-non-item");
  const extraLinesContainer = document.getElementById("extra-lines");
  const addExtraBtn = document.getElementById("add-extra-line");
  const predefinedContainer = document.getElementById("predefined-item-container");
  const predefinedDropdown = document.getElementById("predefined-item-dropdown");
  const cancelBtn = document.getElementById("edit-cancel");

  // Pickr instances
  function makePicker(selector) {
    return Pickr.create({
      el: selector,
      theme: 'nano',
      default: '#E5E6E8',
      components: { preview: true, opacity: true, hue: true,
        interaction: { hex: true, rgba: true, input: true, save: true } }
    }).on('save', (c, p) => p.hide());
  }
  const pickrName = makePicker('#pickr-name');
  const pickrRarity = makePicker('#pickr-rarity');
  const pickrItemType = makePicker('#pickr-itemtype');
  const pickrDescItem = makePicker('#pickr-desc-item');
  const pickrDescNonItem = makePicker('#pickr-desc-nonitem');

  // Draggable
  let dragging = false, offsetX, offsetY;
  editHandle.addEventListener("mousedown", e => {
    dragging = true;
    const rect = editModal.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    e.preventDefault();
  });
  document.addEventListener("mousemove", e => {
    if (dragging) {
      editModal.style.left = `${e.clientX - offsetX}px`;
      editModal.style.top  = `${e.clientY - offsetY}px`;
    }
  });
  document.addEventListener("mouseup", () => dragging = false);

  // Show/Hide item vs non-item fields
  function updateFields() {
    if (typeSelect.value === "Item") {
      itemFields.style.display = "block";
      nonItemDesc.style.display = "none";
      predefinedContainer.style.display = "block";
    } else {
      itemFields.style.display = "none";
      nonItemDesc.style.display = "block";
      predefinedContainer.style.display = "none";
    }
  }
  typeSelect.addEventListener("change", updateFields);

  // Extra Info lines logic
  let extraLines = [];
  function renderExtraLines() {
    extraLinesContainer.innerHTML = "";
    extraLines.forEach((ln, i) => {
      const row = document.createElement("div");
      row.className = "field-row"; row.style.marginBottom = "5px";
      const input = document.createElement("input");
      input.type = "text"; input.value = ln.text;
      input.style.background="#E5E6E8"; input.style.color="#000";
      input.addEventListener("input", e => ln.text = e.target.value);
      const colorDiv = document.createElement("div");
      colorDiv.className="color-btn"; colorDiv.style.marginLeft="5px";
      const removeBtn = document.createElement("button");
      removeBtn.type="button"; removeBtn.textContent="x";
      removeBtn.style.marginLeft="5px";
      removeBtn.addEventListener("click", () => {
        extraLines.splice(i,1); renderExtraLines();
      });
      row.append(input, colorDiv, removeBtn);
      extraLinesContainer.append(row);
      const p = makePicker(colorDiv);
      p.setColor(ln.color||"#E5E6E8");
      p.on("change", c => ln.color = c.toHEXA().toString());
    });
  }
  addExtraBtn.addEventListener("click", () => {
    extraLines.push({ text:"", color:"#E5E6E8" });
    renderExtraLines();
  });

  // Current marker being edited
  let current = null;

  // Populate form fields from marker data
  function populateForm(m) {
    current = m;
    nameInput.value   = m.name||"";
    pickrName.setColor(m.nameColor||"#E5E6E8");
    typeSelect.value  = m.type;
    imgSmallInput.value = m.imageSmall||"";
    imgBigInput.value   = m.imageBig||"";
    videoInput.value    = m.videoURL||"";
    updateFields();
    if (m.type==="Item") {
      predefinedDropdown.value = m.predefinedItemId||"";
      raritySelect.value  = m.rarity?.toLowerCase()||"";
      pickrRarity.setColor(m.rarityColor||"#E5E6E8");
      itemTypeSelect.value = m.itemType||"Crafting Material";
      pickrItemType.setColor(m.itemTypeColor||"#E5E6E8");
      descInput.value     = m.description||"";
      pickrDescItem.setColor(m.descriptionColor||"#E5E6E8");
      extraLines = m.extraLines?JSON.parse(JSON.stringify(m.extraLines)):[];
      renderExtraLines();
    } else {
      nonItemDescInput.value = m.description||"";
      pickrDescNonItem.setColor(m.descriptionColor||"#E5E6E8");
    }
  }

  // Open modal at event position
  function openModal(evt) {
    editModal.style.display = "block";
    const w = editModal.offsetWidth, h = editModal.offsetHeight;
    editModal.style.left = `${evt.pageX - w + 10}px`;
    editModal.style.top  = `${evt.pageY - h/2}px`;
  }

  // Form submission
  editForm.addEventListener("submit", e => {
    e.preventDefault();
    if (!current) return;
    // gather data back
    const d = current.data;
    d.name  = nameInput.value;
    d.nameColor = pickrName.getColor().toHEXA().toString();
    d.type  = typeSelect.value;
    d.imageSmall = imgSmallInput.value;
    d.imageBig   = imgBigInput.value;
    d.videoURL   = videoInput.value||"";
    d.predefinedItemId = predefinedDropdown.value||null;

    if (d.type==="Item") {
      d.rarity = formatRarity(raritySelect.value);
      d.rarityColor = pickrRarity.getColor().toHEXA().toString();
      d.itemType = itemTypeSelect.value;
      d.itemTypeColor = pickrItemType.getColor().toHEXA().toString();
      d.description = descInput.value;
      d.descriptionColor = pickrDescItem.getColor().toHEXA().toString();
      d.extraLines = JSON.parse(JSON.stringify(extraLines));
    } else {
      d.description = nonItemDescInput.value;
      d.descriptionColor = pickrDescNonItem.getColor().toHEXA().toString();
      delete d.rarity; delete d.rarityColor;
      delete d.itemType; delete d.itemTypeColor;
      delete d.extraLines;
    }

    // Update popup & Firestore
    current.marker.setPopupContent(createPopupContent(d));
    firebaseUpdateMarker(d);
    editModal.style.display="none";
    current = null;
    onUpdateMarker && onUpdateMarker(d);
  });

  // Cancel button clears form
  cancelBtn.addEventListener("click", () => {
    editModal.style.display = "none";
    current = null;
    extraLines = [];
  });

  // Contextmenu "Create New" and click-> paste logic
  map.on("contextmenu", evt => {
    const opts = [{
      text: "Create New Marker",
      action: () => {
        current = null;
        nameInput.value=""; pickrName.setColor("#E5E6E8");
        typeSelect.value="Item"; updateFields();
        imgSmallInput.value=""; imgBigInput.value="";
        videoInput.value=""; raritySelect.value="";
        pickrRarity.setColor("#E5E6E8");
        itemTypeSelect.value="Crafting Material"; pickrItemType.setColor("#E5E6E8");
        descInput.value=""; pickrDescItem.setColor("#E5E6E8");
        extraLines=[]; renderExtraLines();
        predefinedDropdown.value="";
        openModal(evt.originalEvent);
        editForm.onsubmit = ev2 => {
          ev2.preventDefault();
          const data = {
            type: typeSelect.value,
            name: nameInput.value||"New Marker",
            nameColor: pickrName.getColor().toHEXA().toString(),
            coords: [evt.latlng.lat, evt.latlng.lng],
            imageSmall: imgSmallInput.value,
            imageBig: imgBigInput.value,
            videoURL: videoInput.value||"",
            predefinedItemId: predefinedDropdown.value||null
          };
          if (data.type==="Item") {
            data.rarity = formatRarity(raritySelect.value);
            data.rarityColor = pickrRarity.getColor().toHEXA().toString();
            data.itemType = itemTypeSelect.value;
            data.itemTypeColor = pickrItemType.getColor().toHEXA().toString();
            data.description = descInput.value;
            data.descriptionColor = pickrDescItem.getColor().toHEXA().toString();
            data.extraLines = JSON.parse(JSON.stringify(extraLines));
          } else {
            data.description = nonItemDescInput.value;
            data.descriptionColor = pickrDescNonItem.getColor().toHEXA().toString();
          }
          onNewMarker(data);
          firebaseAddMarker(data);
          editModal.style.display="none";
          editForm.onsubmit = null;
        };
      }
    }];
    // your showContextMenu(x,y,opts) here...
  });

  map.on("click", evt => {
    const copied = getCopiedData();
    if (copied && pasteMode) {
      const copy = JSON.parse(JSON.stringify(copied));
      delete copy.id;
      copy.coords = [evt.latlng.lat, evt.latlng.lng];
      copy.name += " (copy)";
      onNewMarker(copy);
      firebaseAddMarker(copy);
    }
  });

  // Expose methods
  return {
    setCopied: setCopiedData,
    enablePaste: () => { pasteMode=true; },
    disablePaste: () => { pasteMode=false; },
    populate: populateForm,
    open: openModal
  };
}
