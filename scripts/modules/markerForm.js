// scripts/modules/markerForm.js
// Full implementation of the Edit / Create‑marker modal.
// For Item markers, all item‑specific fields are read‑only; you can only pick
// the predefined item from the dropdown.

import { makeDraggable, positionModal } from "./uiManager.js";
import { formatRarity } from "./utils.js";
import { loadItemDefinitions } from "./itemDefinitionsService.js";

/**
 * Initialise the marker‑form module.
 * @param {firebase.firestore.Firestore} db Firestore instance
 * @returns {{ openEdit:Function, openCreate:Function, refreshPredefinedItems:Function }}
 */
export function initMarkerForm(db) {
  /* -------------------------------------------------- *
   *  DOM references
   * -------------------------------------------------- */
  const modal            = document.getElementById("edit-modal");
  const modalHandle      = document.getElementById("edit-modal-handle");
  const form             = document.getElementById("edit-form");
  const btnCancel        = document.getElementById("edit-cancel");
  const addExtraLineBtn  = document.getElementById("add-extra-line");
  const extraLinesWrap   = document.getElementById("extra-lines");

  const fldName          = document.getElementById("edit-name");
  const fldType          = document.getElementById("edit-type");
  const fldImageS        = document.getElementById("edit-image-small");
  const fldImageL        = document.getElementById("edit-image-big");
  const fldVideo         = document.getElementById("edit-video-url");
  const fldRarity        = document.getElementById("edit-rarity");
  const fldItemType      = document.getElementById("edit-item-type");
  const fldDescItem      = document.getElementById("edit-description");
  const fldDescNonItem   = document.getElementById("edit-description-non-item");
  const itemFieldsBlock  = document.getElementById("item-extra-fields");
  const nonItemDescBlock = document.getElementById("non-item-description");
  const predefinedBlock  = document.getElementById("predefined-item-container");
  const predefinedDD     = document.getElementById("predefined-item-dropdown");

  /* -------------------------------------------------- *
   *  Draggable modal
   * -------------------------------------------------- */
  makeDraggable(modal, modalHandle);

  /* -------------------------------------------------- *
   *  Colour pickers
   * -------------------------------------------------- */
  function createPicker(sel) {
    return Pickr.create({
      el: sel, theme: "nano", default: "#E5E6E8",
      components: {
        preview: true, opacity: true, hue: true,
        interaction:{ hex:true,rgba:true,input:true,save:true }
      }
    }).on("save",(_,p)=>p.hide());
  }
  const pikName        = createPicker("#pickr-name");
  const pikRarity      = createPicker("#pickr-rarity");
  const pikItemType    = createPicker("#pickr-itemtype");
  const pikDescItem    = createPicker("#pickr-desc-item");
  const pikDescNonItem = createPicker("#pickr-desc-nonitem");

  /* -------------------------------------------------- *
   *  Pre‑defined item definitions
   * -------------------------------------------------- */
  let predefinedDefs = {};
  async function refreshPredefinedItems() {
    const list = await loadItemDefinitions(db);
    predefinedDefs = {};
    predefinedDD.innerHTML = `<option value=\"\">-- Select an item --</option>`;
    list.forEach(def => {
      predefinedDefs[def.id] = def;
      const opt = document.createElement(\"option\");
      opt.value = def.id; opt.textContent = def.name;
      predefinedDD.appendChild(opt);
    });
  }
  refreshPredefinedItems();

  /* -------------------------------------------------- *
   *  Extra‑info lines (for Items)
   * -------------------------------------------------- */
  let extraLines = [];
  /* (renderExtraLines unchanged – omitted for brevity, identical to previous) */
  function renderExtraLines() {
    extraLinesWrap.innerHTML = "";
    extraLines.forEach((lineObj, idx) => {
      const row = document.createElement(\"div\");
      row.className=\"field-row\"; row.style.marginBottom=\"5px\";

      const txt = document.createElement(\"input\");
      txt.type=\"text\"; txt.value=lineObj.text;
      txt.style.background=\"#E5E6E8\"; txt.style.color=\"#000\";
      txt.readOnly = true;                         // read‑only for Items
      txt.addEventListener(\"input\",()=>{ extraLines[idx].text = txt.value; });

      const colorBox = document.createElement(\"div\");
      colorBox.className=\"color-btn\"; colorBox.style.marginLeft=\"5px\";

      const rm = document.createElement(\"button\");
      rm.type=\"button\"; rm.textContent=\"x\"; rm.style.marginLeft=\"5px\";
      rm.addEventListener(\"click\",()=>{ extraLines.splice(idx,1); renderExtraLines(); });

      row.appendChild(txt); row.appendChild(colorBox); row.appendChild(rm);
      extraLinesWrap.appendChild(row);

      Pickr.create({
        el: colorBox, theme:\"nano\", default: lineObj.color||\"#E5E6E8\",
        components:{ preview:true,opacity:true,hue:true,
          interaction:{hex:true,rgba:true,input:true,save:true} }
      })
      .on(\"change\", c => { extraLines[idx].color = c.toHEXA().toString(); })
      .on(\"save\", (_,p)=>p.hide())
      .setColor(lineObj.color||\"#E5E6E8\");
    });
  }

  /* -------------------------------------------------- *
   *  Apply Item / Non‑Item UI rules
   * -------------------------------------------------- */
  function lockItemFields(isItem) {
    [fldName, fldRarity, fldItemType, fldDescItem].forEach(inp=>{
      inp.readOnly = isItem;
      inp.disabled = isItem;
    });
    // Also disable colour pickers for Item mode
    [pikName, pikRarity, pikItemType, pikDescItem].forEach(pik=>{
      pik.getRoot().style.pointerEvents = isItem ? \"none\" : \"auto\";
      pik.getRoot().style.opacity       = isItem ? 0.4   : 1;
    });
  }

  function applyTypeVisibility() {
    const isItem = fldType.value === \"Item\";
    itemFieldsBlock.style.display  = isItem ? \"block\" : \"none\";
    nonItemDescBlock.style.display = isItem ? \"none\"  : \"block\";
    predefinedBlock.style.display  = isItem ? \"block\" : \"none\";
    lockItemFields(isItem);
    if (isItem) predefinedDD.value = \"\";
  }
  fldType.addEventListener(\"change\", applyTypeVisibility);

  /* -------------------------------------------------- *
   *  Predefined‑item dropdown autofill
   * -------------------------------------------------- */
  predefinedDD.addEventListener(\"change\", () => {
    const id = predefinedDD.value;
    if (!id || !predefinedDefs[id]) return;
    const d = predefinedDefs[id];
    populateFromDefinition(d);
  });

  function populateFromDefinition(def) {
    fldName.value = def.name || \"\";        pikName.setColor(def.nameColor || \"#E5E6E8\");
    fldRarity.value = def.rarity || \"\";    pikRarity.setColor(def.rarityColor || \"#E5E6E8\");
    fldItemType.value = def.itemType || def.type || \"\";
    pikItemType.setColor(def.itemTypeColor || \"#E5E6E8\");
    fldDescItem.value = def.description || \"\";
    pikDescItem.setColor(def.descriptionColor || \"#E5E6E8\");
    extraLines = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
    renderExtraLines();
    fldImageS.value = def.imageSmall || \"\";
    fldImageL.value = def.imageBig   || \"\";
  }

  /* -------------------------------------------------- *
   *  Internal helpers: populateForm / harvestForm
   * -------------------------------------------------- */
  function populateForm(m) {
    fldType.value = m.type || \"Door\";
    applyTypeVisibility();

    if (m.type === \"Item\") {
      predefinedDD.value = m.predefinedItemId || \"\";
      const def = predefinedDefs[m.predefinedItemId];
      if (def) populateFromDefinition(def);
      else { fldName.value = m.name || \"\"; }   // fallback
    } else {
      fldName.value = m.name || \"\";  pikName.setColor(m.nameColor || \"#E5E6E8\");
      fldImageS.value = m.imageSmall || \"\";
      fldImageL.value = m.imageBig   || \"\";
      fldVideo.value  = m.videoURL  || \"\";
      fldDescNonItem.value = m.description || \"\";
      pikDescNonItem.setColor(m.descriptionColor || \"#E5E6E8\");
    }
  }

  function harvestForm(coords) {
    const out = {
      type: fldType.value,
      coords,
      predefinedItemId: predefinedDD.value || null
    };

    if (out.type === \"Item\") {
      const def = predefinedDefs[out.predefinedItemId];
      if (def) {
        out.name            = def.name;
        out.nameColor       = def.nameColor       || \"#E5E6E8\";
        out.rarity          = def.rarity;
        out.rarityColor     = def.rarityColor     || \"#E5E6E8\";
        out.itemType        = def.itemType || def.type;
        out.itemTypeColor   = def.itemTypeColor   || \"#E5E6E8\";
        out.description     = def.description;
        out.descriptionColor= def.descriptionColor|| \"#E5E6E8\";
        out.extraLines      = JSON.parse(JSON.stringify(def.extraLines || []));
        out.imageSmall      = def.imageSmall;
        out.imageBig        = def.imageBig;
      }
    } else {
      out.name            = fldName.value || \"New Marker\";
      out.nameColor       = pikName.getColor()?.toHEXA()?.toString() || \"#E5E6E8\";
      out.imageSmall      = fldImageS.value;
      out.imageBig        = fldImageL.value;
      out.videoURL        = fldVideo.value || \"\";
      out.description     = fldDescNonItem.value;
      out.descriptionColor= pikDescNonItem.getColor()?.toHEXA()?.toString() || \"#E5E6E8\";
    }
    return out;
  }

  /* -------------------------------------------------- *
   *  Modal openers (edit / create)
   * -------------------------------------------------- */
  let formSubmitHandler = null;  // keeps reference so we can remove old handler

  function openEdit(markerObj, data, pageEvent, onSave) {
    populateForm(data);
    positionModal(modal, pageEvent); modal.style.display = \"block\";

    /* -- attach form submit -- */
    if (formSubmitHandler) form.removeEventListener(\"submit\", formSubmitHandler);
    formSubmitHandler = (e) => {
      e.preventDefault();
      const updated = harvestForm(data.coords);
      Object.assign(data, updated);
      if (typeof onSave === \"function\") onSave(data);
      modal.style.display = \"none\";
    };
    form.addEventListener(\"submit\", formSubmitHandler);
  }

  function openCreate(coords, defaultType, pageEvent, onCreate) {
    populateForm({ type: defaultType || \"Item\" });
    positionModal(modal, pageEvent); modal.style.display = \"block\";

    if (formSubmitHandler) form.removeEventListener(\"submit\", formSubmitHandler);
    formSubmitHandler = (e) => {
      e.preventDefault();
      const newData = harvestForm(coords);
      if (typeof onCreate === \"function\") onCreate(newData);
      modal.style.display = \"none\";
    };
    form.addEventListener(\"submit\", formSubmitHandler);
  }

  /* -------------------------------------------------- *
   *  Cancel button hides modal
   * -------------------------------------------------- */
  btnCancel.addEventListener(\"click\", () => {
    modal.style.display = \"none\";
  });

  /* -------------------------------------------------- *
   *  API
   * -------------------------------------------------- */
  return { openEdit, openCreate, refreshPredefinedItems };
}
