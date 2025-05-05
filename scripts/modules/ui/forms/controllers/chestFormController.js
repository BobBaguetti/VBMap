/* =========================================================
   VBMap – Chest Form Controller
   ---------------------------------------------------------
   @file:    /scripts/modules/ui/forms/controllers/chestFormController.js
   @version: 3.5  (2025‑05‑06)
   ========================================================= */

   import { createPickr }            from "../../pickrManager.js";
   import { getPickrHexColor }       from "../../../utils/colorUtils.js";
   import { createChestForm }        from "../builders/chestFormBuilder.js";
   import { openInventoryPicker }    from "../../components/inventoryPicker.js";
   import { loadItemDefinitions }    from "../../../services/itemDefinitionsService.js";
   
   /* ────────────────────────── factory ────────────────────────── */
   export function createChestFormController(cb, db) {
     /* -------- DOM from builder -------- */
     const { form, fields } = createChestForm();
   
     /* -------- locals -------- */
     const pickrs   = {};        // { desc: Pickr }
     let   _id      = null;
     let   allItems = [];
   
     /* header bits keep references so we can update text */
     let headerTitle, saveBtn;
   
     /* =========================================================
        1.  Colour picker (description only)
        ======================================================= */
     function initPickrs() {
       /* ensure form is in DOM (builder inserts before modal append) */
       if (!document.body.contains(form)) {
         requestAnimationFrame(initPickrs);
         return;
       }
       if (pickrs.desc) return;  // already done
   
       pickrs.desc = createPickr(`#${fields.colorDesc.id}`);
       const redispatch = () =>
         form.dispatchEvent(new Event("input", { bubbles: true }));
       pickrs.desc.on("change", redispatch).on("save", redispatch);
       fields.colorDesc.addEventListener("click", () => pickrs.desc.show());
     }
     initPickrs();                            // bootstrap once
     const initPickrsPublic = () => initPickrs();   // expose for modal
   
     /* =========================================================
        2.  Sub‑header (title + buttons aligned right)
        ======================================================= */
     function buildHeader() {
       if (headerTitle) return;               // already built
   
       /* flex container */
       const bar = document.createElement("div");
       bar.className = "form-subheader";
       Object.assign(bar.style, {
         display: "flex",
         alignItems: "center"
       });
   
       /* title */
       headerTitle = document.createElement("span");
       headerTitle.className = "subheader-title";
       bar.appendChild(headerTitle);
   
       /* button row pushed right */
       const btnRow = document.createElement("span");
       btnRow.className = "subheader-btnrow";
       Object.assign(btnRow.style, {
         display: "flex",
         gap: "6px",
         marginLeft: "auto"
       });
   
       /* Save / Create */
       saveBtn = document.createElement("button");
       saveBtn.type = "submit";
       saveBtn.className = "ui-button-primary";
       btnRow.appendChild(saveBtn);
   
       /* Clear */
       const clearBtn = document.createElement("button");
       clearBtn.className = "ui-button";
       clearBtn.textContent = "Clear";
       clearBtn.type = "button";
       clearBtn.onclick = () => cb?.onCancel?.();
       btnRow.appendChild(clearBtn);
   
       /* Delete (optional) */
       if (cb.onDelete) {
         const delBtn = document.createElement("button");
         delBtn.className = "ui-button-delete";
         delBtn.textContent = "🗑";
         delBtn.type = "button";
         delBtn.onclick = () => cb.onDelete?.(_id);
         btnRow.appendChild(delBtn);
       }
   
       bar.appendChild(btnRow);
       form.prepend(bar);
     }
     buildHeader();
   
     function updateHeaderText() {
       if (_id) {
         headerTitle.textContent = "Edit Chest Type";
         saveBtn.textContent     = "Save";
       } else {
         headerTitle.textContent = "Add Chest Type";
         saveBtn.textContent     = "Create";
       }
     }
   
     /* =========================================================
        3.  Inventory chip helpers
        ======================================================= */
     async function ensureItems() {
       if (!allItems.length) allItems = await loadItemDefinitions(db);
     }
   
     async function renderChips() {
       await ensureItems();
       const box = fields.chipContainer;
       box.innerHTML = "";
   
       fields.lootPool.forEach(id => {
         const def  = allItems.find(i => i.id === id) || { name: id };
   
         const chip = document.createElement("span");
         chip.className = "loot-pool-chip";
         chip.textContent = def.name;
   
         const x = document.createElement("span");
         x.className = "remove-chip";
         x.textContent = "×";
         x.onclick = () => {
           const idx = fields.lootPool.indexOf(id);
           if (idx > -1) {
             fields.lootPool.splice(idx, 1);
             renderChips();
           }
         };
   
         chip.appendChild(x);
         box.appendChild(chip);
       });
     }
   
     /* open ⚙︎ picker */
     fields.openLootPicker.onclick = async () => {
       const ids = await openInventoryPicker(db, {
         selectedIds: fields.lootPool,
         title:       "Select Loot Pool Items"
       });
       fields.lootPool.splice(0, fields.lootPool.length, ...ids);
       renderChips();
     };
   
     /* =========================================================
        4.  Form helpers (reset / populate / serialize)
        ======================================================= */
     function reset() {
       form.reset();
       _id = null;
       fields.lootPool.length = 0;
       renderChips();
       initPickrs();
       pickrs.desc?.setColor("#E5E6E8");
       fields.extraInfo.setLines([], false);
       updateHeaderText();
     }
   
     function populate(def) {
       reset();
       _id = def.id || null;
   
       /* basic */
       if (fields.fldName)     fields.fldName.value     = def.name    || "";
       if (fields.fldSize)     fields.fldSize.value     = def.size    || "small";
       if (fields.fldCategory) fields.fldCategory.value = def.category|| "";
   
       /* icon (support legacy field names) */
       const iconField = fields.fldIcon || fields.fldIconUrl;
       if (iconField) iconField.value = def.iconUrl || "";
   
       /* inventories */
       fields.lootPool.splice(0, 0, ...(def.lootPool || []));
       renderChips();
   
       /* description */
       fields.fldDesc.value = def.description || "";
       pickrs.desc?.setColor(def.descriptionColor || "#E5E6E8");
       fields.extraInfo.setLines(def.extraLines || [], false);
   
       updateHeaderText();
     }
   
     function getCurrent() {
       const iconField = fields.fldIcon || fields.fldIconUrl;
       return {
         id:            _id,
         name:          fields.fldName.value.trim(),
         iconUrl:       iconField ? iconField.value.trim() : "",
         size:          fields.fldSize.value,
         category:      fields.fldCategory.value.trim(),
         lootPool:      [...fields.lootPool],
         description:   fields.fldDesc.value.trim(),
         descriptionColor: getPickrHexColor(pickrs.desc),
         extraLines:    fields.extraInfo.getLines()
       };
     }
   
     /* =========================================================
        5.  Submit wiring
        ======================================================= */
     form.addEventListener("submit", e => {
       e.preventDefault();
       cb?.onSubmit?.(getCurrent());
     });
   
     /* public API */
     return {
       form,
       reset,
       populate,
       getCurrent,
       getId: () => _id,
       initPickrs: initPickrsPublic
     };
   }
   