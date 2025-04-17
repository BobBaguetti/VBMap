// scripts/modules/markerForm.js
// Edit / Create Marker modal.
//
// • Markers linked to a predefined Item are read‑only (no Add/X buttons,
//   media fields read‑only, colour pickers disabled).
// • Free‑form markers remain fully editable.

import { makeDraggable, positionModal } from "./uiManager.js";
import { loadItemDefinitions } from "./itemDefinitionsService.js";

/* -------------------------------------------------- *
 * module init
 * -------------------------------------------------- */
export function initMarkerForm(db) {
  /* DOM refs -------------------------------------------------------- */
  const modal            = document.getElementById("edit-modal");
  const modalHandle      = document.getElementById("edit-modal-handle");
  const form             = document.getElementById("edit-form");
  const btnCancel        = document.getElementById("edit-cancel");

  const fldName          = document.getElementById("edit-name");
  const fldType          = document.getElementById("edit-type");
  const fldImageS        = document.getElementById("edit-image-small");
  const fldImageL        = document.getElementById("edit-image-big");
  const fldVideo         = document.getElementById("edit-video-url");
  const fldRarity        = document.getElementById("edit-rarity");
  const fldItemType      = document.getElementById("edit-item-type");
  const fldDescItem      = document.getElementById("edit-description");
  const fldDescNI        = document.getElementById("edit-description-non-item");

  const itemBlock        = document.getElementById("item-extra-fields");
  const nonItemBlock     = document.getElementById("non-item-description");
  const predefinedBlock  = document.getElementById("predefined-item-container");
  const predefinedLabel  = predefinedBlock.querySelector("label");
  const predefinedDD     = document.getElementById("predefined-item-dropdown");

  const addLineBtn       = document.getElementById("add-extra-line");
  const linesWrap        = document.getElementById("extra-lines");

  makeDraggable(modal, modalHandle);

  /* Tweak label text (“Predefined Item:”  ➜  “Item:”) */
  if (predefinedLabel) predefinedLabel.textContent = "Item:";

  /* Pickrs ---------------------------------------------------------- */
  function mk(sel) {
    return Pickr.create({
      el: sel,
      theme: "nano",
      default: "#E5E6E8",
      components: {
        preview:true, opacity:true, hue:true,
        interaction:{ hex:true,rgba:true,input:true,save:true }
      }
    }).on("save",(_,p)=>p.hide());
  }
  const pkName = mk("#pickr-name");
  const pkRat  = mk("#pickr-rarity");
  const pkTyp  = mk("#pickr-itemtype");
  const pkDI   = mk("#pickr-desc-item");
  const pkDN   = mk("#pickr-desc-nonitem");

  const pickrs = [pkName, pkRat, pkTyp, pkDI];

  /* Definitions ----------------------------------------------------- */
  let defs = {};
  async function refreshPredefinedItems() {
    const list = await loadItemDefinitions(db);
    defs = Object.fromEntries(list.map(d=>[d.id,d]));
    predefinedDD.innerHTML =
      '<option value="">-- Select an item --</option>';
    list.forEach(d=>{
      const o=document.createElement("option");
      o.value=d.id; o.textContent=d.name;
      predefinedDD.appendChild(o);
    });
  }
  refreshPredefinedItems();

  /* Extra lines ----------------------------------------------------- */
  let lines=[];
  function renderLines(readOnly=false){
    linesWrap.innerHTML="";
    lines.forEach((ln,i)=>{
      const row=document.createElement("div");
      row.className="field-row"; row.style.marginBottom="5px";
      const t=document.createElement("input");
      t.value=ln.text; t.readOnly=readOnly;
      t.style.background="#E5E6E8"; t.style.color="#000";
      t.oninput=()=>lines[i].text=t.value;
      const c=document.createElement("div");
      c.className="color-btn"; c.style.marginLeft="5px";
      c.style.pointerEvents=readOnly?"none":"auto";
      c.style.opacity=readOnly?0.4:1;
      const x=document.createElement("button");
      x.textContent="x"; x.type="button";
      x.style.marginLeft="5px";
      if (readOnly) {
        x.style.display = "none";          // hide X in Item mode
      } else {
        x.onclick=()=>{lines.splice(i,1);renderLines(false);};
      }
      row.append(t,c);
      if (!readOnly) row.append(x);
      linesWrap.appendChild(row);
      Pickr.create({
        el:c,theme:"nano",default:ln.color||"#E5E6E8",
        components:{preview:true,opacity:true,hue:true,
          interaction:{hex:true,rgba:true,input:true,save:true}}
      })
        .on("change",clr=>{lines[i].color=clr.toHEXA().toString();})
        .on("save",(_,p)=>p.hide())
        .setColor(ln.color||"#E5E6E8");
    });
  }
  addLineBtn.onclick=()=>{lines.push({text:"",color:"#E5E6E8"});renderLines(false);};

  /* UI helpers ------------------------------------------------------ */
  function lockItem(yes){
    const rd=(el)=>{el.disabled=yes;el.readOnly=yes;
      if(el.tagName==="SELECT")el.style.pointerEvents=yes?"none":"auto";};
    [fldName,fldRarity,fldItemType,fldDescItem,
     fldImageS,fldImageL,fldVideo].forEach(rd);

    pickrs.forEach(p=>{
      const root = p?.getRoot?.();
      if(root && root.style){
        root.style.pointerEvents = yes ? "none" : "auto";
        root.style.opacity       = yes ? 0.4   : 1;
      }
    });

    addLineBtn.style.display = yes ? "none" : "inline-block";
  }
  function showBlocks(itemMode){
    itemBlock.style.display       = itemMode?"block":"none";
    nonItemBlock.style.display    = itemMode?"none":"block";
    predefinedBlock.style.display = itemMode?"block":"none";
  }
  function applyUI(){
    const isItem=fldType.value==="Item";
    showBlocks(isItem); lockItem(isItem);
    if(isItem) predefinedDD.value="";
  }
  fldType.onchange=applyUI;

  /* Autofill -------------------------------------------------------- */
  function fill(def){
    fldName.value=def.name; pkName.setColor(def.nameColor||"#E5E6E8");
    fldRarity.value=def.rarity||""; pkRat.setColor(def.rarityColor||"#E5E6E8");
    fldItemType.value=def.itemType||def.type||"";
    pkTyp.setColor(def.itemTypeColor||"#E5E6E8");
    fldDescItem.value=def.description||"";
    pkDI.setColor(def.descriptionColor||"#E5E6E8");
    fldImageS.value=fldImageL.value=def.imageSmall||def.imageBig||"";
    lines=def.extraLines?JSON.parse(JSON.stringify(def.extraLines)):[];
    renderLines(true);
  }
  predefinedDD.onchange=()=>{const d=defs[predefinedDD.value];if(d)fill(d);};

  /* populate / harvest --------------------------------------------- */
  function populate(m={type:"Item"}){
    fldType.value=m.type; applyUI();
    if(m.type==="Item"){
      predefinedDD.value=m.predefinedItemId||"";
      const d=defs[m.predefinedItemId]; if(d)fill(d);
    }else{
      fldName.value=m.name||""; pkName.setColor(m.nameColor||"#E5E6E8");
      fldImageS.value=m.imageSmall||""; fldImageL.value=m.imageBig||"";
      fldVideo.value=m.videoURL||"";
      fldDescNI.value=m.description||"";
      pkDN.setColor(m.descriptionColor||"#E5E6E8");
    }
  }
  function harvest(coords){
    const m={type:fldType.value,coords};
    if(m.type==="Item"){
      const d=defs[predefinedDD.value];
      if(d){Object.assign(m,{
        predefinedItemId:d.id,name:d.name,nameColor:d.nameColor||"#E5E6E8",
        rarity:d.rarity,rarityColor:d.rarityColor||"#E5E6E8",
        itemType:d.itemType||d.type,itemTypeColor:d.itemTypeColor||"#E5E6E8",
        description:d.description,descriptionColor:d.descriptionColor||"#E5E6E8",
        extraLines:JSON.parse(JSON.stringify(d.extraLines||[])),
        imageSmall:d.imageSmall,imageBig:d.imageBig
      });}
    }else{
      m.name=fldName.value||"New Marker";
      m.nameColor=pkName.getColor()?.toHEXA()?.toString()||"#E5E6E8";
      m.imageSmall=fldImageS.value; m.imageBig=fldImageL.value;
      m.videoURL=fldVideo.value||"";
      m.description=fldDescNI.value;
      m.descriptionColor=pkDN.getColor()?.toHEXA()?.toString()||"#E5E6E8";
    }
    return m;
  }

  /* openers --------------------------------------------------------- */
  let subCB=null;
  function openEdit(markerObj,data,evt,save){
    populate(data); positionModal(modal,evt); modal.style.display="block";
    if(subCB)form.removeEventListener("submit",subCB);
    subCB=e=>{e.preventDefault();Object.assign(data,harvest(data.coords));
      save(data); modal.style.display="none";};
    form.addEventListener("submit",subCB);
  }
  function openCreate(coords,defType,evt,add){
    populate({type:defType||"Item"}); positionModal(modal,evt);
    modal.style.display="block";
    if(subCB)form.removeEventListener("submit",subCB);
    subCB=e=>{e.preventDefault();add(harvest(coords));modal.style.display="none";};
    form.addEventListener("submit",subCB);
  }

  btnCancel.onclick=()=>modal.style.display="none";

  return { openEdit, openCreate, refreshPredefinedItems };
}
