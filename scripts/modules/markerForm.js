// scripts/modules/markerForm.js
import { makeDraggable, positionModal } from "./uiManager.js";
import {
  loadItemDefinitions,
  addItemDefinition
} from "./itemDefinitionsService.js";

export function initMarkerForm(db) {
  /* ——— DOM ——— */
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

  /* ——— Pickrs ——— */
  const pickrs=[];
  function pk(sel){const p=Pickr.create({
    el:sel,theme:"nano",default:"#E5E6E8",
    components:{preview:true,opacity:true,hue:true,
      interaction:{hex:true,rgba:true,input:true,save:true}}
  }).on("save",(_,k)=>k.hide()); pickrs.push(p); return p;}
  const pkName=pk("#pickr-name"), pkRare=pk("#pickr-rarity"),
        pkITy=pk("#pickr-itemtype"), pkDIt=pk("#pickr-desc-item"),
        pkDNI=pk("#pickr-desc-nonitem");

  /* ——— Data ——— */
  let defs={}, customMode=false;
  async function loadDefs(){
    const list=await loadItemDefinitions(db);
    defs=Object.fromEntries(list.map(d=>[d.id,d]));
    ddPre.innerHTML='<option value="">None (custom)</option>';
    list.forEach(d=>{
      const o=document.createElement("option");o.value=d.id;o.textContent=d.name;
      ddPre.appendChild(o);
    });
  } loadDefs();

  /* ——— Extra‑info lines ——— */
  let lines=[];
  function renderLines(ro=false){
    wrapLines.innerHTML="";
    lines.forEach((ln,i)=>{
      const row=document.createElement("div"); row.className="field-row";
      const txt=document.createElement("input");
      txt.value=ln.text; txt.readOnly=ro;
      txt.style.cssText="width:100%;background:#E5E6E8;color:#000;padding:4px;border:1px solid #999;";
      if(ro){txt.style.background="#3b3b3b";txt.style.cursor="not-allowed";}
      txt.oninput=()=>{lines[i].text=txt.value;customMode=true;};
      const clr=document.createElement("div"); clr.className="color-btn";
      clr.style.pointerEvents=ro?"none":"auto"; clr.style.opacity=ro?0.5:1;
      const rm=document.createElement("button"); rm.textContent="x"; rm.type="button";
      rm.style.marginLeft="5px"; if(ro)rm.style.display="none";
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

  /* ——— UI helpers ——— */
  const dark="#3b3b3b";
  const allEditFields=[fldName,fldRare,fldITyp,fldDItm,fldImgS,fldImgL,fldVid];
  function setRO(el,on){
    el.disabled=on; el.readOnly=on;
    el.style.background=on?dark:"#E5E6E8"; el.style.cursor=on?"not-allowed":"text";
    if(el.tagName==="SELECT") el.style.pointerEvents=on?"none":"auto";
  }
  function lockItem(yes){
    allEditFields.forEach(e=>setRO(e,yes));
    pickrs.forEach(p=>{const r=p?.getRoot?.(); if(r&&r.style){
      r.style.opacity=yes?0.5:1; r.style.pointerEvents=yes?"none":"auto";}});
    btnAdd.style.display=yes?"none":"inline-block";
  }
  function showBlocks(isItem){
    blkItem.style.display=isItem?"block":"none";
    blkNI.style.display =isItem?"none":"block";
    blkPre.style.display=isItem?"block":"none";
  }
  function applyUI(){
    const isItem=fldType.value==="Item";
    showBlocks(isItem);
    lockItem(isItem && !customMode);
    if(!isItem) { ddPre.value=""; customMode=false; }
  }
  fldType.onchange=applyUI;

  /* ——— Dropdown ——— */
  ddPre.style.width="100%";
  ddPre.onchange=()=>{
    const id=ddPre.value;
    if(id){ customMode=false; fill(defs[id]); lockItem(true);}
    else { customMode=true; clearItemFields(); lockItem(false);}
  };

  function clearItemFields(){
    fldName.value=fldRare.value=fldITyp.value=fldDItm.value="";
    [pkName,pkRare,pkITy,pkDIt].forEach(p=>p.setColor("#E5E6E8"));
    fldImgS.value=fldImgL.value=fldVid.value="";
    lines=[]; renderLines(false);
  }
  function fill(d){
    fldName.value=d.name; pkName.setColor(d.nameColor||"#E5E6E8");
    fldRare.value=d.rarity||""; pkRare.setColor(d.rarityColor||"#E5E6E8");
    fldITyp.value=d.itemType||d.type||""; pkITy.setColor(d.itemTypeColor||"#E5E6E8");
    fldDItm.value=d.description||""; pkDIt.setColor(d.descriptionColor||"#E5E6E8");
    fldImgS.value=d.imageSmall||""; fldImgL.value=d.imageBig||""; fldVid.value="";
    lines=d.extraLines?JSON.parse(JSON.stringify(d.extraLines)):[]; renderLines(true);
  }

  /* ——— populate & harvest ——— */
  function populate(m={type:"Item"}){
    fldType.value=m.type; customMode=!m.predefinedItemId && m.type==="Item";
    applyUI();
    if(m.type==="Item"){
      if(m.predefinedItemId && defs[m.predefinedItemId]){ ddPre.value=m.predefinedItemId; fill(defs[m.predefinedItemId]); }
      else { ddPre.value=""; clearItemFields(); }
    }else{
      fldName.value=m.name||""; pkName.setColor(m.nameColor||"#E5E6E8");
      fldImgS.value=m.imageSmall||""; fldImgL.value=m.imageBig||""; fldVid.value=m.videoURL||"";
      fldDNI.value=m.description||""; pkDNI.setColor(m.descriptionColor||"#E5E6E8");
    }
  }
  function harvest(coords){
    const out={type:fldType.value,coords};
    if(out.type==="Item"){
      if(!customMode){
        const d=defs[ddPre.value]; if(d){Object.assign(out,{predefinedItemId:d.id,...stripUndef(cloneDef(d))});}
      }else{
        const def=createDef(); Object.assign(out,stripUndef(cloneDef(def)));
        if(def.name.trim()){ addItemDefinition(db,def).then(newDef=>{
            defs[newDef.id]=newDef; out.predefinedItemId=newDef.id; loadDefs(); }); }
      }
    }else{
      out.name=fldName.value||"New Marker";
      out.nameColor=pkName.getColor()?.toHEXA()?.toString()||"#E5E6E8";
      out.imageSmall=fldImgS.value; out.imageBig=fldImgL.value;
      out.videoURL=fldVid.value||"";
      out.description=fldDNI.value;
      out.descriptionColor=pkDNI.getColor()?.toHEXA()?.toString()||"#E5E6E8";
    }
    return stripUndef(out);
  }
  function stripUndef(o){Object.keys(o).forEach(k=>o[k]===undefined&&delete o[k]);return o;}
  function cloneDef(d){return{
    name:d.name,nameColor:d.nameColor,
    rarity:d.rarity,rarityColor:d.rarityColor,
    itemType:d.itemType,itemTypeColor:d.itemTypeColor,
    description:d.description,descriptionColor:d.descriptionColor,
    extraLines:JSON.parse(JSON.stringify(d.extraLines||[])),
    imageSmall:d.imageSmall,imageBig:d.imageBig
  };}
  function createDef(){return{
    name:fldName.value.trim()||"Unnamed",
    nameColor:pkName.getColor()?.toHEXA()?.toString()||"#E5E6E8",
    rarity:fldRare.value,rarityColor:pkRare.getColor()?.toHEXA()?.toString(),
    itemType:fldITyp.value,itemTypeColor:pkITy.getColor()?.toHEXA()?.toString(),
    description:fldDItm.value,descriptionColor:pkDIt.getColor()?.toHEXA()?.toString(),
    extraLines:JSON.parse(JSON.stringify(lines)),
    imageSmall:fldImgS.value,imageBig:fldImgL.value
  };}

  /* ——— modal openers ——— */
  let submitCB=null;
  function openEdit(obj,data,e,save){
    populate(data); positionModal(modal,e); modal.style.display="block";
    if(submitCB) form.removeEventListener("submit",submitCB);
    submitCB=ev=>{ev.preventDefault();Object.assign(data,harvest(data.coords));save(data);modal.style.display="none";};
    form.addEventListener("submit",submitCB);
  }
  function openCreate(coords,defT,e,add){
    populate({type:defT||"Item"}); positionModal(modal,e); modal.style.display="block";
    if(submitCB) form.removeEventListener("submit",submitCB);
    submitCB=ev=>{ev.preventDefault();add(harvest(coords));modal.style.display="none";};
    form.addEventListener("submit",submitCB);
  }
  btnX.onclick=()=>modal.style.display="none";

  return { openEdit, openCreate, refreshPredefinedItems:loadDefs };
}
