// scripts/modules/markerForm.js
import { makeDraggable, positionModal } from "./uiManager.js";
import { loadItemDefinitions } from "./itemDefinitionsService.js";

export function initMarkerForm(db) {
  /* ----------  DOM refs ---------- */
  const modal  = document.getElementById("edit-modal");
  const handle = document.getElementById("edit-modal-handle");
  const form   = document.getElementById("edit-form");
  const btnX   = document.getElementById("edit-cancel");

  const fldName   = document.getElementById("edit-name");
  const fldType   = document.getElementById("edit-type");
  const fldImgS   = document.getElementById("edit-image-small");
  const fldImgL   = document.getElementById("edit-image-big");
  const fldVideo  = document.getElementById("edit-video-url");
  const fldRare   = document.getElementById("edit-rarity");
  const fldIType  = document.getElementById("edit-item-type");
  const fldDescIt = document.getElementById("edit-description");
  const fldDescNI = document.getElementById("edit-description-non-item");

  const blkItem   = document.getElementById("item-extra-fields");
  const blkNI     = document.getElementById("non-item-description");
  const blkPre    = document.getElementById("predefined-item-container");
  blkPre.querySelector("label").textContent = "Item:";
  const ddPre     = document.getElementById("predefined-item-dropdown");

  const btnAddLine = document.getElementById("add-extra-line");
  const linesWrap  = document.getElementById("extra-lines");

  makeDraggable(modal, handle);

  /* ----------  colour pickers ---------- */
  const makePK = sel => Pickr.create({
    el: sel, theme: "nano", default: "#E5E6E8",
    components:{ preview:true,opacity:true,hue:true,
      interaction:{hex:true,rgba:true,input:true,save:true} }
  }).on("save",(_,p)=>p.hide());

  const pkName = makePK("#pickr-name"),
        pkRare = makePK("#pickr-rarity"),
        pkItyp = makePK("#pickr-itemtype"),
        pkDesc = makePK("#pickr-desc-item"),
        pkDescNI = makePK("#pickr-desc-nonitem");
  const pickrs = [pkName, pkRare, pkItyp, pkDesc];

  /* ----------  item definitions ---------- */
  let defs = {};
  async function refreshPredefinedItems() {
    const list = await loadItemDefinitions(db);
    defs = Object.fromEntries(list.map(d=>[d.id,d]));
    ddPre.innerHTML = '<option value="">-- Select an item --</option>';
    list.forEach(d=>{
      const o = document.createElement("option");
      o.value = d.id; o.textContent = d.name;
      ddPre.appendChild(o);
    });
  }
  refreshPredefinedItems();

  /* ----------  extra‑info lines ---------- */
  let lines = [];
  function renderLines(ro=false) {
    linesWrap.innerHTML = "";
    lines.forEach((ln,i)=>{
      const row = document.createElement("div");
      row.className = "field-row"; row.style.marginBottom = "5px";

      const txt = document.createElement("input");
      txt.value=ln.text; txt.readOnly=ro;
      txt.style.cssText = "width:100%;background:#E5E6E8;color:#000;" +
        "padding:4px 6px;border:1px solid #999;";
      if(ro){ txt.style.background="#d8d8d8"; txt.style.cursor="not-allowed"; }
      txt.oninput = () => lines[i].text = txt.value;

      const clr = document.createElement("div");
      clr.className="color-btn"; clr.style.marginLeft="5px";
      clr.style.pointerEvents = ro ? "none" : "auto";
      clr.style.opacity       = ro ? 0.5  : 1;

      const rm = document.createElement("button");
      rm.textContent="x"; rm.type="button";
      rm.style.marginLeft="5px";
      if(ro) rm.style.display="none";
      else rm.onclick = () => { lines.splice(i,1); renderLines(false); };

      row.append(txt, clr); if(!ro) row.append(rm);
      linesWrap.appendChild(row);

      Pickr.create({
        el: clr, theme:"nano", default: ln.color || "#E5E6E8",
        components:{preview:true,opacity:true,hue:true,
          interaction:{hex:true,rgba:true,input:true,save:true}}
      })
        .on("change",c=>ln.color=c.toHEXA().toString())
        .on("save",(_,p)=>p.hide())
        .setColor(ln.color || "#E5E6E8");
    });
  }
  btnAddLine.onclick = () => {
    lines.push({ text:"", color:"#E5E6E8" });
    renderLines(false);
  };

  /* ----------  UI helpers ---------- */
  function setRO(el,on){
    el.disabled=on; el.readOnly=on;
    el.style.background = on ? "#d8d8d8" : "#E5E6E8";
    el.style.cursor     = on ? "not-allowed" : "text";
    if(el.tagName==="SELECT") el.style.pointerEvents = on ? "none":"auto";
  }
  function lockItem(yes){
    [fldName,fldRare,fldIType,fldDescIt,
     fldImgS,fldImgL,fldVideo].forEach(e=>setRO(e,yes));
    pickrs.forEach(pk=>{
      const r=pk?.getRoot?.(); if(r&&r.style){
        r.style.pointerEvents=yes?"none":"auto";
        r.style.opacity      =yes?0.5:1;
      }
    });
    btnAddLine.style.display = yes ? "none" : "inline-block";
  }
  function toggleBlocks(itemMode){
    blkItem.style.display = itemMode?"block":"none";
    blkNI.style.display   = itemMode?"none":"block";
    blkPre.style.display  = itemMode?"block":"none";
  }
  function applyUI(){
    const item = fldType.value === "Item";
    toggleBlocks(item); lockItem(item);
    if(item) ddPre.value="";
  }
  fldType.onchange = applyUI;

  /* ----------  autofill ---------- */
  function fill(def){
    fldName.value = def.name;      pkName.setColor(def.nameColor||"#E5E6E8");
    fldRare.value = def.rarity||""; pkRare.setColor(def.rarityColor||"#E5E6E8");
    fldIType.value= def.itemType||def.type||"";
    pkItyp.setColor(def.itemTypeColor||"#E5E6E8");
    fldDescIt.value = def.description||"";
    pkDesc.setColor(def.descriptionColor||"#E5E6E8");
    fldImgS.value = def.imageSmall||""; fldImgL.value=def.imageBig||"";
    fldVideo.value="";
    lines = def.extraLines ? JSON.parse(JSON.stringify(def.extraLines)) : [];
    renderLines(true);
  }
  ddPre.onchange = () => { const d=defs[ddPre.value]; if(d) fill(d); };

  /* ----------  populate / harvest ---------- */
  function populate(m={type:"Item"}){
    fldType.value = m.type; applyUI();
    if(m.type==="Item"){
      ddPre.value=m.predefinedItemId||"";
      const d=defs[m.predefinedItemId]; if(d) fill(d);
    }else{
      fldName.value = m.name||""; pkName.setColor(m.nameColor||"#E5E6E8");
      fldImgS.value = m.imageSmall||""; fldImgL.value=m.imageBig||"";
      fldVideo.value= m.videoURL||"";
      fldDescNI.value= m.description||""; pkDescNI.setColor(m.descriptionColor||"#E5E6E8");
    }
  }
  function harvest(coords){
    const m={type:fldType.value,coords};
    if(m.type==="Item"){
      const d=defs[ddPre.value];
      if(d){
        Object.assign(m,{
          predefinedItemId:d.id,
          name:d.name,nameColor:d.nameColor||"#E5E6E8",
          rarity:d.rarity,rarityColor:d.rarityColor||"#E5E6E8",
          itemType:d.itemType||d.type,itemTypeColor:d.itemTypeColor||"#E5E6E8",
          description:d.description,descriptionColor:d.descriptionColor||"#E5E6E8",
          extraLines:JSON.parse(JSON.stringify(d.extraLines||[])),
          imageSmall:d.imageSmall,imageBig:d.imageBig
        });
      }
    }else{
      m.name=fldName.value||"New Marker";
      m.nameColor=pkName.getColor()?.toHEXA()?.toString()||"#E5E6E8";
      m.imageSmall=fldImgS.value; m.imageBig=fldImgL.value;
      m.videoURL=fldVideo.value||"";
      m.description=fldDescNI.value;
      m.descriptionColor=pkDescNI.getColor()?.toHEXA()?.toString()||"#E5E6E8";
    }
    return m;
  }

  /* ----------  openers ---------- */
  let cbSubmit=null;
  function openEdit(obj,data,evt,save){
    populate(data); positionModal(modal,evt); modal.style.display="block";
    if(cbSubmit) form.removeEventListener("submit",cbSubmit);
    cbSubmit=e=>{e.preventDefault();Object.assign(data,harvest(data.coords));
      save(data); modal.style.display="none";};
    form.addEventListener("submit",cbSubmit);
  }
  function openCreate(coords,defType,evt,add){
    populate({type:defType||"Item"}); positionModal(modal,evt); modal.style.display="block";
    if(cbSubmit) form.removeEventListener("submit",cbSubmit);
    cbSubmit=e=>{e.preventDefault();add(harvest(coords));modal.style.display="none";};
    form.addEventListener("submit",cbSubmit);
  }
  btnX.onclick = ()=>modal.style.display="none";

  return { openEdit, openCreate, refreshPredefinedItems };
}
