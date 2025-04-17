// scripts/modules/markerForm.js
import { makeDraggable, positionModal } from "./uiManager.js";
import {
  loadItemDefinitions,
  addItemDefinition
} from "./itemDefinitionsService.js";

export function initMarkerForm(db) {
  /* ————— DOM ————— */
  const modal  = document.getElementById("edit-modal");
  const grip   = document.getElementById("edit-modal-handle");
  const form   = document.getElementById("edit-form");
  const btnX   = document.getElementById("edit-cancel");

  const fldName = document.getElementById("edit-name");
  const fldType = document.getElementById("edit-type");
  const fldImgS = document.getElementById("edit-image-small");
  const fldImgL = document.getElementById("edit-image-big");
  const fldVid  = document.getElementById("edit-video-url");
  const fldRare = document.getElementById("edit-rarity");
  const fldITyp = document.getElementById("edit-item-type");
  const fldDItm = document.getElementById("edit-description");
  const fldDNI  = document.getElementById("edit-description-non-item");

  const blkItem = document.getElementById("item-extra-fields");
  const blkNI   = document.getElementById("non-item-description");
  const blkPre  = document.getElementById("predefined-item-container");
  blkPre.querySelector("label").textContent = "Item:";
  const ddPre   = document.getElementById("predefined-item-dropdown");

  const btnAdd  = document.getElementById("add-extra-line");
  const wrapLines = document.getElementById("extra-lines");

  makeDraggable(modal, grip);

  /* ————— Pickrs ————— */
  const mk = sel => Pickr.create({
    el: sel, theme:"nano", default:"#E5E6E8",
    components:{preview:true,opacity:true,hue:true,
      interaction:{hex:true,rgba:true,input:true,save:true}}
  }).on("save",(_,p)=>p.hide());

  const pkName=mk("#pickr-name"), pkRare=mk("#pickr-rarity"),
        pkITy=mk("#pickr-itemtype"), pkDIt=mk("#pickr-desc-item"),
        pkDNI=mk("#pickr-desc-nonitem");
  const pickrs=[pkName,pkRare,pkITy,pkDIt];

  /* ————— Data ————— */
  let defs={}, customMode=false;   // customMode → we’re editing a new item

  async function refreshDefs() {
    const list=await loadItemDefinitions(db);
    defs=Object.fromEntries(list.map(d=>[d.id,d]));
    ddPre.innerHTML = `<option value="">None (custom)</option>`;
    list.forEach(d=>{
      const o=document.createElement("option");
      o.value=d.id; o.textContent=d.name; ddPre.appendChild(o);
    });
  }
  refreshDefs();

  /* ————— Extra‑info list ————— */
  let lines=[];
  function renderLines(ro=false){
    wrapLines.innerHTML="";
    lines.forEach((ln,i)=>{
      const row=document.createElement("div");
      row.className="field-row"; row.style.marginBottom="5px";

      const txt=document.createElement("input");
      txt.value=ln.text; txt.readOnly=ro; txt.style.cssText=
        "width:100%;background:#E5E6E8;color:#000;padding:4px 6px;border:1px solid #999;";
      if(ro){txt.style.background="#3b3b3b";txt.style.cursor="not-allowed";}
      txt.oninput=()=>{lines[i].text=txt.value;customMode=true;};

      const clr=document.createElement("div");
      clr.className="color-btn"; clr.style.marginLeft="5px";
      clr.style.pointerEvents=ro?"none":"auto"; clr.style.opacity=ro?0.5:1;

      const rm=document.createElement("button");
      rm.textContent="x"; rm.type="button"; rm.style.marginLeft="5px";
      if(ro)rm.style.display="none";
      else rm.onclick=()=>{lines.splice(i,1);renderLines(false);customMode=true;};

      row.append(txt,clr); if(!ro)row.append(rm); wrapLines.appendChild(row);

      Pickr.create({
        el:clr,theme:"nano",default:ln.color||"#E5E6E8",
        components:{preview:true,opacity:true,hue:true,
          interaction:{hex:true,rgba:true,input:true,save:true}}
      }).on("change",c=>{lines[i].color=c.toHEXA().toString();customMode=true;})
        .on("save",(_,p)=>p.hide())
        .setColor(ln.color||"#E5E6E8");
    });
  }
  btnAdd.onclick=()=>{lines.push({text:"",color:"#E5E6E8"});renderLines(false);customMode=true;};

  /* ————— UI helpers ————— */
  const dark="#3b3b3b";
  function setDisabled(el,on){
    el.disabled=on; el.readOnly=on;
    el.style.background=on?dark:"#E5E6E8"; el.style.cursor=on?"not-allowed":"text";
    if(el.tagName==="SELECT") el.style.pointerEvents=on?"none":"auto";
  }
  function lockItem(on){
    [fldName,fldRare,fldITyp,fldDItm,fldImgS,fldImgL,fldVid].forEach(e=>setDisabled(e,on));
    pickrs.forEach(pk=>{const r=pk?.getRoot?.(); if(r&&r.style){r.style.opacity=on?0.5:1;r.style.pointerEvents=on?"none":"auto";}});
    btnAdd.style.display=on?"none":"inline-block";
  }
  function showBlocks(item){blkItem.style.display=item?"block":"none";
    blkNI.style.display=item?"none":"block"; blkPre.style.display="block";}
  function applyUI(){const item=fldType.value==="Item"; showBlocks(item); lockItem(!customMode&&item);}
  fldType.onchange=applyUI;

  /* ————— Dropdown behaviour ————— */
  ddPre.style.width="100%";
  ddPre.onchange=()=>{
    const id=ddPre.value;
    if(id){ customMode=false; fill(defs[id]); }
    else { customMode=true; clearItemFields(); lockItem(false); }
  };

  /* clear fields for custom item */
  function clearItemFields(){
    fldName.value=fldRare.value=fldITyp.value=fldDItm.value="";
    pkName.setColor("#E5E6E8"); pkRare.setColor("#E5E6E8");
    pkITy.setColor("#E5E6E8");  pkDIt.setColor("#E5E6E8");
    fldImgS.value=fldImgL.value=fldVid.value="";
    lines=[]; renderLines(false);
  }

  /* fill fields from definition */
  function fill(d){
    fldName.value=d.name; pkName.setColor(d.nameColor||"#E5E6E8");
    fldRare.value=d.rarity||""; pkRare.setColor(d.rarityColor||"#E5E6E8");
    fldITyp.value=d.itemType||d.type||""; pkITy.setColor(d.itemTypeColor||"#E5E6E8");
    fldDItm.value=d.description||""; pkDIt.setColor(d.descriptionColor||"#E5E6E8");
    fldImgS.value=d.imageSmall||""; fldImgL.value=d.imageBig||""; fldVid.value="";
    lines=d.extraLines?JSON.parse(JSON.stringify(d.extraLines)):[];
    renderLines(true);
  }

  /* ————— populate / harvest ————— */
  function populate(m={type:"Item"}){ fldType.value=m.type; applyUI();
    if(m.type==="Item" && m.predefinedItemId){ ddPre.value=m.predefinedItemId; fill(defs[m.predefinedItemId]); }
    else if(m.type==="Item"){ customMode=true; clearItemFields(); }
    else { fldName.value=m.name||""; pkName.setColor(m.nameColor||"#E5E6E8");
      fldImgS.value=m.imageSmall||""; fldImgL.value=m.imageBig||""; fldVid.value=m.videoURL||"";
      fldDNI.value=m.description||""; pkDNI.setColor(m.descriptionColor||"#E5E6E8"); }}
  function harvest(coords){
    const m={type:fldType.value,coords};
    if(m.type==="Item"){
      if(!customMode){  // predefined path
        const d=defs[ddPre.value]; if(d)Object.assign(m,{predefinedItemId:d.id,...cloneDef(d)});
      }else{            // save new custom definition
        const def=createDefFromForm(); if(def.name.trim()){
          addItemDefinition(db,def).then(newDef=>{
            defs[newDef.id]=newDef; refreshDefsAfterAdd(newDef);
          });
          Object.assign(m,{predefinedItemId:undefined,...def});
        }}
    }else{  // non‑item marker
      m.name=fldName.value||"New Marker";
      m.nameColor=pkName.getColor()?.toHEXA()?.toString()||"#E5E6E8";
      m.imageSmall=fldImgS.value; m.imageBig=fldImgL.value; m.videoURL=fldVid.value||"";
      m.description=fldDNI.value;
      m.descriptionColor=pkDNI.getColor()?.toHEXA()?.toString()||"#E5E6E8";
    }
    return m;
  }
  function cloneDef(d){ return {
    name:d.name,nameColor:d.nameColor||"#E5E6E8",
    rarity:d.rarity,rarityColor:d.rarityColor||"#E5E6E8",
    itemType:d.itemType||d.type,itemTypeColor:d.itemTypeColor||"#E5E6E8",
    description:d.description,descriptionColor:d.descriptionColor||"#E5E6E8",
    extraLines:JSON.parse(JSON.stringify(d.extraLines||[])),
    imageSmall:d.imageSmall,imageBig:d.imageBig
  };}
  function createDefFromForm(){ return {
    name:fldName.value.trim()||"Unnamed",
    nameColor:pkName.getColor()?.toHEXA()?.toString()||"#E5E6E8",
    rarity:fldRare.value,rarityColor:pkRare.getColor()?.toHEXA()?.toString()||"#E5E6E8",
    itemType:fldITyp.value,itemTypeColor:pkITy.getColor()?.toHEXA()?.toString()||"#E5E6E8",
    description:fldDItm.value,descriptionColor:pkDIt.getColor()?.toHEXA()?.toString()||"#E5E6E8",
    extraLines:JSON.parse(JSON.stringify(lines)),
    imageSmall:fldImgS.value,imageBig:fldImgL.value
  };}
  function refreshDefsAfterAdd(newDef){ refreshPredefinedItems().then(()=>{
      ddPre.value=newDef.id; customMode=false; fill(newDef); lockItem(true); });
  }

  /* ————— openers ————— */
  let cb=null;
  function openEdit(obj,data,evt,save){
    populate(data); positionModal(modal,evt); modal.style.display="block";
    if(cb)form.removeEventListener("submit",cb);
    cb=e=>{e.preventDefault();Object.assign(data,harvest(data.coords));save(data);modal.style.display="none";};
    form.addEventListener("submit",cb);
  }
  function openCreate(coords,defType,evt,add){
    populate({type:defType||"Item"}); positionModal(modal,evt); modal.style.display="block";
    if(cb)form.removeEventListener("submit",cb);
    cb=e=>{e.preventDefault();add(harvest(coords));modal.style.display="none";};
    form.addEventListener("submit",cb);
  }
  btnX.onclick=()=>modal.style.display="none";

  return { openEdit, openCreate, refreshPredefinedItems:refreshDefs };
}
