// scripts/script.js
//
// Coordinates map, Firebase, markerFormManager, copy/paste,
// sidebar search, and the Item‑Definitions modal.

import { initializeMap }            from "./modules/map.js";
import {
  showContextMenu,
  attachContextMenuHider,
  attachRightClickCancel
}                                   from "./modules/uiManager.js";
import {
  initializeFirebase,
  loadMarkers,
  addMarker    as fbAdd,
  updateMarker as fbUpdate,
  deleteMarker as fbDelete
}                                   from "./modules/firebaseService.js";
import {
  createMarker,
  createPopupContent
}                                   from "./modules/markerManager.js";
import {
  initMarkerFormManager,
  showEditForm,
  showCreateForm,
  refreshPredefinedItems
}                                   from "./modules/markerFormManager.js";
import {
  loadItemDefinitions,
  addItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
}                                   from "./modules/itemDefinitionsService.js";

document.addEventListener("DOMContentLoaded", async () => {

  /* Firebase setup -------------------------------------------------------- */
  const db = initializeFirebase({
    apiKey:"AIzaSyDwEdPN5MB8YAuM_jb0K1iXfQ-tGQ",
    authDomain:"vbmap-cc834.firebaseapp.com",
    projectId:"vbmap-cc834",
    storageBucket:"vbmap-cc834.firebasestorage.app",
    messagingSenderId:"244112699360",
    appId:"1:244112699360:web:95f50adb6e10b438238585",
    measurementId:"G-7FDNWLRM95"
  });

  /* Map & layers ---------------------------------------------------------- */
  const { map } = initializeMap();
  const itemCluster = L.markerClusterGroup();
  const layers = {
    "Door":              L.layerGroup().addTo(map),
    "Extraction Portal": L.layerGroup().addTo(map),
    "Item":              itemCluster.addTo(map),
    "Teleport":          L.layerGroup().addTo(map)
  };

  /* Form manager ---------------------------------------------------------- */
  await initMarkerFormManager(db);

  /* State ----------------------------------------------------------------- */
  let allMarkers = [];
  let copiedData = null, pasteMode = false;
  attachContextMenuHider();
  attachRightClickCancel(()=>{copiedData=null; pasteMode=false;});

  /* Helper to place marker & wire callbacks ------------------------------- */
  function placeMarker(m) {
    const mo = createMarker(m, map, layers, {
      onEdit: (markerObj, data, clickEvt) => {
        showEditForm(
          data,
          { x: clickEvt.pageX, y: clickEvt.pageY },    // exact click point
          updated => { markerObj.setPopupContent(createPopupContent(updated)); fbUpdate(db,updated); }
        );
      },
      onCopy: (_,data)=>{copiedData={...data};delete copiedData.id; pasteMode=true;},
      onDragEnd: (_,data)=> fbUpdate(db,data),
      onDelete: (_,data)=>{
        layers[data.type].removeLayer(_);
        allMarkers = allMarkers.filter(o=>o.data.id!==data.id);
        fbDelete(db,data.id);
      }
    });
    allMarkers.push({ markerObj: mo, data: m });
  }

  /* Load stored markers --------------------------------------------------- */
  (await loadMarkers(db)).forEach(placeMarker);

  /* Map context‑menu → Create New Marker ---------------------------------- */
  map.on("contextmenu", evt => {
    showContextMenu(evt.originalEvent.pageX, evt.originalEvent.pageY, [
      {
        text:"Create New Marker",
        action: clickEvt => {
          const defaults = { type:"Item", name:"", imageSmall:"", imageBig:"", videoURL:"" };
          showCreateForm(
            evt.latlng,
            defaults,
            { x: clickEvt.pageX, y: clickEvt.pageY },  // use click point
            newMarker => { placeMarker(newMarker); fbAdd(db,newMarker); }
          );
        }
      }
    ]);
  });

  /* Paste‑mode click ------------------------------------------------------ */
  map.on("click", ev => {
    if (pasteMode && copiedData) {
      const dup = { ...copiedData, coords:[ev.latlng.lat,ev.latlng.lng], name:`${copiedData.name} (copy)` };
      placeMarker(dup); fbAdd(db,dup);
    }
  });

  /* Sidebar search + toggle (unchanged) ----------------------------------- */
  const search = document.getElementById("search-bar");
  const sbToggle = document.getElementById("sidebar-toggle");
  const sidebar  = document.getElementById("sidebar");

  search.addEventListener("input",function(){
    const q=this.value.toLowerCase();
    allMarkers.forEach(({markerObj,data})=>{
      const match = data.name.toLowerCase().includes(q);
      match ? layers[data.type].addLayer(markerObj)
            : layers[data.type].removeLayer(markerObj);
    });
  });
  sbToggle.addEventListener("click",()=>{
    sidebar.classList.toggle("hidden");
    document.getElementById("map").style.marginLeft =
      sidebar.classList.contains("hidden") ? "0" : "300px";
    map.invalidateSize();
  });

  /* ───────────────────────────────────────────────────────────────────────
     Manage Item Definitions modal  (***unchanged*** from your original file)
     The entire block is left intact below so you don’t lose any features.
  ─────────────────────────────────────────────────────────────────────── */

  const manageItemDefinitionsBtn = document.getElementById("manage-item-definitions");
  const itemDefinitionsModal     = document.getElementById("item-definitions-modal");
  const closeItemDefinitionsBtn  = document.getElementById("close-item-definitions");
  const itemDefinitionsList      = document.getElementById("item-definitions-list");
  const itemDefinitionForm       = document.getElementById("item-definition-form");
  const defName        = document.getElementById("def-name");
  const defType        = document.getElementById("def-type");
  const defRarity      = document.getElementById("def-rarity");
  const defDescription = document.getElementById("def-description");
  const defImageSmall  = document.getElementById("def-image-small");
  const defImageBig    = document.getElementById("def-image-big");
  const defExtraLinesContainer = document.getElementById("def-extra-lines");
  const addDefExtraLineBtn     = document.getElementById("add-def-extra-line");
  const defSearch      = document.getElementById("def-search");
  const filterNameBtn  = document.getElementById("filter-name");
  const filterTypeBtn  = document.getElementById("filter-type");
  const filterRarityBtn= document.getElementById("filter-rarity");
  const defFormHeading = document.getElementById("def-form-heading");
  const defFormSubheading = document.getElementById("def-form-subheading");
  const defCancelBtn   = document.getElementById("def-cancel");

  /* Pickr helper for modal */
  function createPicker(selector) {
    return Pickr.create({
      el: selector, theme:'nano', default:'#E5E6E8',
      components:{preview:true,opacity:true,hue:true,interaction:{hex:true,rgba:true,input:true,save:true}}
    }).on('save',(_,p)=>p.hide());
  }

  /* Extra info lines in modal */
  let extraDefLines=[];
  addDefExtraLineBtn.addEventListener("click",()=>{
    extraDefLines.push({text:"",color:"#E5E6E8"}); renderDefExtraLines();
  });
  function renderDefExtraLines() {
    defExtraLinesContainer.innerHTML="";
    extraDefLines.forEach((ln,idx)=>{
      const row=document.createElement("div"); row.className="field-row"; row.style.marginBottom="5px";
      const txt=document.createElement("input"); txt.type="text"; txt.value=ln.text;
      txt.style.background="#E5E6E8"; txt.style.color="#000";
      txt.addEventListener("input",e=>extraDefLines[idx].text=e.target.value);
      const clr=document.createElement("div"); clr.className="color-btn"; clr.style.marginLeft="5px";
      const rm=document.createElement("button"); rm.type="button"; rm.textContent="x"; rm.style.marginLeft="5px";
      rm.addEventListener("click",()=>{extraDefLines.splice(idx,1); renderDefExtraLines();});
      row.append(txt,clr,rm); defExtraLinesContainer.appendChild(row);
      const p=Pickr.create({
        el:clr, theme:'nano', default:ln.color,
        components:{preview:true,opacity:true,hue:true,interaction:{hex:true,rgba:true,input:true,save:true}}
      })
        .on("change",c=>extraDefLines[idx].color=c.toHEXA().toString())
        .on("save",(_,p)=>p.hide());
      p.setColor(ln.color);
    });
  }

  /* Load & render item definitions */
  async function loadAndRenderItemDefinitions() {
    try {
      const defs = await loadItemDefinitions(db);
      itemDefinitionsList.innerHTML="";
      defs.forEach(def=>{
        const entry=document.createElement("div");
        entry.className="item-def-entry";
        entry.style.borderBottom="1px solid #555";
        entry.style.padding="5px 0";
        entry.innerHTML=`
          <span class="def-name"><strong>${def.name}</strong></span>
          (<span class="def-type">${def.itemType||def.type}</span>) -
          <span class="def-rarity">${def.rarity||""}</span>
          <br><em class="def-description">${def.description||""}</em>
          <br>
          <button data-edit="${def.id}">Edit</button>
          <button data-delete="${def.id}">Delete</button>`;
        itemDefinitionsList.appendChild(entry);

        entry.querySelector("[data-edit]").addEventListener("click",()=>{
          defName.value=def.name; defType.value=def.type; defRarity.value=def.rarity||"";
          defDescription.value=def.description||""; defImageSmall.value=def.imageSmall||"";
          defImageBig.value=def.imageBig||""; extraDefLines=def.extraLines?JSON.parse(JSON.stringify(def.extraLines)):[];
          renderDefExtraLines(); defName.dataset.editId=def.id;
          if(window.pickrDefName)       window.pickrDefName.setColor(def.nameColor||"#E5E6E8");
          if(window.pickrDefType)       window.pickrDefType.setColor(def.itemTypeColor||"#E5E6E8");
          if(window.pickrDefRarity)     window.pickrDefRarity.setColor(def.rarityColor||"#E5E6E8");
          if(window.pickrDefDescription)window.pickrDefDescription.setColor(def.descriptionColor||"#E5E6E8");
          defFormHeading.innerText = defFormSubheading.innerText = "Edit Item";
        });

        entry.querySelector("[data-delete]").addEventListener("click",async()=>{
          if(confirm("Delete this item definition?")) {
            await deleteItemDefinition(db,def.id);
            loadAndRenderItemDefinitions();
            await refreshPredefinedItems();
          }
        });
      });
    } catch(err){console.error(err);}
  }

  /* Open / close modal */
  manageItemDefinitionsBtn.addEventListener("click",async()=>{
    itemDefinitionsModal.style.display="block";
    await loadAndRenderItemDefinitions();
    defFormHeading.innerText = defFormSubheading.innerText = "Add Item";
    if(!window.pickrDefName) {
      window.pickrDefName       = createPicker("#pickr-def-name");
      window.pickrDefType       = createPicker("#pickr-def-type");
      window.pickrDefRarity     = createPicker("#pickr-def-rarity");
      window.pickrDefDescription= createPicker("#pickr-def-description");
    }
  });
  closeItemDefinitionsBtn.addEventListener("click",()=>itemDefinitionsModal.style.display="none");
  window.addEventListener("click",e=>{if(e.target===itemDefinitionsModal)itemDefinitionsModal.style.display="none";});

  /* Submit definition form */
  itemDefinitionForm.addEventListener("submit",async e=>{
    e.preventDefault();
    const defData={
      name:defName.value, type:defType.value, rarity:defRarity.value, description:defDescription.value,
      imageSmall:defImageSmall.value, imageBig:defImageBig.value,
      extraLines:JSON.parse(JSON.stringify(extraDefLines)),
      nameColor:window.pickrDefName?.getColor()?.toHEXA()?.toString()||"#E5E6E8",
      itemTypeColor:window.pickrDefType?.getColor()?.toHEXA()?.toString()||"#E5E6E8",
      rarityColor:window.pickrDefRarity?.getColor()?.toHEXA()?.toString()||"#E5E6E8",
      descriptionColor:window.pickrDefDescription?.getColor()?.toHEXA()?.toString()||"#E5E6E8"
    };
    if(defName.dataset.editId) { defData.id=defName.dataset.editId; await updateItemDefinition(db,defData); delete defName.dataset.editId; }
    else                       { await addItemDefinition(db,defData); }
    itemDefinitionForm.reset(); extraDefLines=[]; defExtraLinesContainer.innerHTML="";
    ["pickrDefName","pickrDefType","pickrDefRarity","pickrDefDescription"].forEach(k=>{if(window[k])window[k].setColor("#E5E6E8");});
    await loadAndRenderItemDefinitions(); await refreshPredefinedItems();
    defFormHeading.innerText = defFormSubheading.innerText = "Add Item";
  });

  /* Cancel definition form */
  if(defCancelBtn){
    defCancelBtn.addEventListener("click",()=>{
      itemDefinitionForm.reset(); extraDefLines=[]; defExtraLinesContainer.innerHTML="";
      ["pickrDefName","pickrDefType","pickrDefRarity","pickrDefDescription"].forEach(k=>{if(window[k])window[k].setColor("#E5E6E8");});
      defFormHeading.innerText = defFormSubheading.innerText = "Add Item";
    });
  }

  /* Filter buttons + search in modal */
  const filterSettings={name:false,type:false,rarity:false};
  function toggleBtn(btn,flag){btn.classList.toggle("toggled",flag);}
  toggleBtn(filterNameBtn,false); toggleBtn(filterTypeBtn,false); toggleBtn(filterRarityBtn,false);
  filterNameBtn.addEventListener("click",()=>{filterSettings.name=!filterSettings.name;toggleBtn(filterNameBtn,filterSettings.name);filterDefs();});
  filterTypeBtn.addEventListener("click",()=>{filterSettings.type=!filterSettings.type;toggleBtn(filterTypeBtn,filterSettings.type);filterDefs();});
  filterRarityBtn.addEventListener("click",()=>{filterSettings.rarity=!filterSettings.rarity;toggleBtn(filterRarityBtn,filterSettings.rarity);filterDefs();});
  const filterDefs=()=>{
    const q=defSearch.value.toLowerCase();
    [...itemDefinitionsList.children].forEach(entry=>{
      const n=entry.querySelector(".def-name")?.innerText.toLowerCase()||"";
      const t=entry.querySelector(".def-type")?.innerText.toLowerCase()||"";
      const r=entry.querySelector(".def-rarity")?.innerText.toLowerCase()||"";
      let match=(!filterSettings.name&&!filterSettings.type&&!filterSettings.rarity);
      if(filterSettings.name&&n.includes(q)) match=true;
      if(filterSettings.type&&t.includes(q)) match=true;
      if(filterSettings.rarity&&r.includes(q)) match=true;
      entry.style.display=match?"":"none";
    });
  };
  defSearch?.addEventListener("input",filterDefs);
});
