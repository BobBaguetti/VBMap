// @fullfile: Send the entire file, no omissions or abridgments.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted.
// @version: 2
// @file:    /scripts/modules/markerForm.js

import { makeDraggable, positionModal } from "./uiManager.js";
import { loadItemDefinitions, addItemDefinition } from "./modules/itemDefinitionsService.js";

/**
 * Initializes the “Create/Edit Marker” form modal.
 * @param {firebase.firestore.Firestore} db
 */
export function initMarkerForm(db) {
  // DOM handles
  const modal       = document.getElementById("edit-modal");
  const grip        = document.getElementById("edit-modal-handle");
  const form        = document.getElementById("edit-form");
  const btnCancel   = document.getElementById("edit-cancel");
  const fldName     = document.getElementById("edit-name");
  const fldType     = document.getElementById("edit-type");
  const fldImgS     = document.getElementById("edit-image-small");
  const fldImgL     = document.getElementById("edit-image-big");
  const fldVid      = document.getElementById("edit-video-url");
  const fldRare     = document.getElementById("edit-rarity");
  const fldIType    = document.getElementById("edit-item-type");
  const fldDescIt   = document.getElementById("edit-description");
  const fldDescNI   = document.getElementById("edit-description-non-item");
  const blockItem   = document.getElementById("item-extra-fields");
  const blockNI     = document.getElementById("non-item-description");
  const blockPre    = document.getElementById("predefined-item-container");
  const ddPre       = document.getElementById("predefined-item-dropdown");
  const btnAddLine  = document.getElementById("add-extra-line");
  const wrapLines   = document.getElementById("extra-lines");

  makeDraggable(modal, grip);

  // Basic Pickr factory
  function mkPicker(selector) {
    const el = document.querySelector(selector);
    if (!el) return { on:()=>{}, setColor:()=>{}, getColor:()=>({ toHEXA:()=>["#E5E6E8"] }) };
    const p = Pickr.create({
      el,
      theme: "nano",
      default: "#E5E6E8",
      components: {
        preview: true, opacity: true, hue: true,
        interaction: { hex:true, rgba:true, input:true, save:true }
      }
    });
    p.setColor("#E5E6E8");
    p.on("save", (_inst, picker) => picker.hide());
    return p;
  }

  // Top‐level pickers
  const pkName = mkPicker("#pickr-name");
  const pkRare = mkPicker("#pickr-rarity");
  const pkItyp = mkPicker("#pickr-itemtype");
  const pkDitm = mkPicker("#pickr-desc-item");
  const pkDni  = mkPicker("#pickr-desc-nonitem");

  // Load definitions for dropdown
  let defs = {}, customMode = false;
  async function refreshItems() {
    const list = await loadItemDefinitions(db);
    defs = Object.fromEntries(list.map(d=>[d.id,d]));
    ddPre.innerHTML = `<option value="">None (custom)</option>`;
    list.forEach(d => {
      const o = document.createElement("option");
      o.value = d.id; o.textContent = d.name;
      ddPre.appendChild(o);
    });
  }
  refreshItems();

  // Extra‐info lines
  let lines = [];
  function mkPickerElement(container, color) {
    const p = Pickr.create({
      el: container,
      theme: "nano",
      default: color,
      components: {
        preview:true, opacity:true, hue:true,
        interaction:{ hex:true, rgba:true, input:true, save:true }
      }
    });
    p.setColor(color);
    p.on("change", c => container._color = c.toHEXA().toString())
     .on("save", (_i, pickr) => pickr.hide());
    return p;
  }
  function renderLines(readOnly = false) {
    wrapLines.innerHTML = "";
    lines.forEach((ln,i) => {
      const row = document.createElement("div");
      row.className = "field-row"; row.style.marginBottom = "5px";

      const txt = document.createElement("input");
      txt.value = ln.text; txt.readOnly = readOnly;
      txt.style.cssText = "width:100%;background:#E5E6E8;color:#000;padding:4px 6px;border:1px solid #999;";
      if (readOnly) { txt.style.background="#3b3b3b"; txt.style.cursor="not-allowed"; }
      txt.oninput = () => { lines[i].text = txt.value; customMode=true; };

      const clr = document.createElement("div");
      clr.className = "color-btn"; clr.style.marginLeft="5px";
      row.append(txt, clr);

      if (!readOnly) {
        const rm = document.createElement("button");
        rm.textContent="×"; rm.type="button"; rm.style.marginLeft="5px";
        rm.onclick = () => { lines.splice(i,1); renderLines(false); customMode=true; };
        row.append(rm);
      }

      wrapLines.appendChild(row);
      // attach a Pickr for this line
      const p = mkPickerElement(clr, ln.color||"#E5E6E8");
      clr._picker = p;
    });
  }
  btnAddLine.onclick = () => { lines.push({text:"",color:"#E5E6E8"}); renderLines(false); customMode=true; };

  // UI toggle helpers
  function setRO(el,on) {
    el.disabled=on; el.readOnly=on;
    el.style.background=on?"#3b3b3b":"#E5E6E8";
    el.style.cursor=on?"not-allowed":"text";
    if(el.tagName==="SELECT") el.style.pointerEvents=on?"none":"auto";
  }
  function toggleSections(isItem) {
    blockItem.style.display=isItem?"block":"none";
    blockNI.style.display=isItem?"none":"block";
    blockPre.style.display=isItem?"block":"none";
  }
  function applyUI() {
    const isItem = fldType.value==="Item";
    toggleSections(isItem);
    const lock = isItem && !customMode;
    [fldName,fldRare,fldIType,fldDescIt,fldImgS,fldImgL,fldVid].forEach(e=>setRO(e,lock));
    if(!isItem){ ddPre.value=""; customMode=false; }
  }
  fldType.onchange = applyUI;
  ddPre.onchange = () => {
    if(ddPre.value){
      customMode=false;
      fillForm(defs[ddPre.value]);
      applyUI();
    } else {
      customMode=true;
      clearForm();
      applyUI();
    }
  };
  function clearForm(){
    [fldName,fldRare,fldIType,fldDescIt].forEach(e=>e.value="");
    [pkName,pkRare,pkItyp,pkDitm].forEach(p=>p.setColor("#E5E6E8"));
    [fldImgS,fldImgL,fldVid].forEach(e=>e.value="");
    lines=[]; renderLines(false);
  }
  function fillForm(d){
    fldName.value=d.name; pkName.setColor(d.nameColor);
    fldRare.value=d.rarity; pkRare.setColor(d.rarityColor);
    fldIType.value=d.itemType||d.type; pkItyp.setColor(d.itemTypeColor);
    fldDescIt.value=d.description; pkDitm.setColor(d.descriptionColor);
    fldImgS.value=d.imageSmall; fldImgL.value=d.imageBig;
    lines = JSON.parse(JSON.stringify(d.extraLines||[]));
    renderLines(true);
  }

  // Harvest form + persist
  function harvest(coords) {
    const out = { type: fldType.value, coords };
    if(out.type==="Item"){
      if(!customMode){
        const d = defs[ddPre.value];
        return { ...out, predefinedItemId:d.id, ...d };
      } else {
        const payload = {
          name: fldName.value||"Unnamed",
          nameColor: pkName.getColor().toHEXA().toString(),
          rarity: fldRare.value,
          rarityColor: pkRare.getColor().toHEXA().toString(),
          itemType: fldIType.value,
          itemTypeColor: pkItyp.getColor().toHEXA().toString(),
          description: fldDescIt.value,
          descriptionColor: pkDitm.getColor().toHEXA().toString(),
          extraLines: [...lines],
          imageSmall: fldImgS.value,
          imageBig: fldImgL.value
        };
        addItemDefinition(db,payload).then(nd=>{
          defs[nd.id]=nd;
          ddPre.value=nd.id;
          customMode=false;
          fillForm(nd);
          applyUI();
        });
        return { ...out, ...payload };
      }
    } else {
      return {
        ...out,
        name: fldName.value||"New Marker",
        nameColor: pkName.getColor().toHEXA().toString(),
        imageSmall: fldImgS.value,
        imageBig: fldImgL.value,
        videoURL: fldVid.value,
        description: fldDescNI.value,
        descriptionColor: pkDni.getColor().toHEXA().toString()
      };
    }
  }

  // Open/Edit/Create
  let submitCb;
  function openEdit(_, data, e, onSave){
    clearForm(); fillForm(data); customMode = !data.predefinedItemId;
    applyUI();
    positionModal(modal, e);
    if(submitCb) form.removeEventListener("submit",submitCb);
    submitCb = ev => {
      ev.preventDefault();
      Object.assign(data, harvest(data.coords));
      onSave(data);
      modal.style.display="none";
    };
    form.addEventListener("submit", submitCb);
  }
  function openCreate(coords, _, e, onCreate){
    clearForm(); customMode=true; applyUI();
    positionModal(modal, e);
    if(submitCb) form.removeEventListener("submit",submitCb);
    submitCb = ev => {
      ev.preventDefault();
      onCreate(harvest(coords));
      modal.style.display="none";
    };
    form.addEventListener("submit", submitCb);
  }
  btnCancel.onclick = () => modal.style.display="none";

  return { openEdit, openCreate, refreshPredefinedItems: refreshItems };
}
