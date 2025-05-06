// @file: /scripts/modules/ui/components/definitionsModalFactory.js
// @version: 1.3 – adds standardized form schema and header structure for all modals

import { createDefinitionModalShell }   from "./definitionModalShell.js";
import { createDefListContainer }      from "../../utils/listUtils.js";
import { createDefinitionListManager } from "./definitionListManager.js";
import { createDescriptionField, createExtraInfoField } from "../forms/universalForm.js";
import { openInventoryPicker }         from "./inventoryPicker.js";

/**
 * @typedef DefinitionModalConfig
 * @property {string} id
 * @property {string} title
 * @property {string} previewType
 * @property {object} db
 * @property {() => Promise<Array<Object>>} loadDefs
 * @property {(db:object, id:string|null, payload:Object) => Promise<Object>} saveDef
 * @property {(db:object, id:string, payload:Object) => Promise<Object>} updateDef
 * @property {(db:object, id:string) => Promise<void>} deleteDef
 * @property {(callbacks:Object) => { form:HTMLFormElement, fields:Object, 
 *             reset():void, populate(def:Object):void, getCurrent():Object, getSubHeaderElement():HTMLElement, initPickrs?():void }} createFormController
 * @property {(def:Object, layout:string, callbacks:Object) => HTMLElement} renderEntry
 * @property {object} [formSchema]  – flags controlling which standard fields to include:
 *   @property {boolean} [name=true]
 *   @property {boolean} [imageUrls=true]
 *   @property {boolean} [description=true]
 *   @property {boolean} [extraInfo=true]
 *   @property {boolean} [filterToggle=false]
 *   @property {boolean} [inventoryPicker=false]
 *   @property {boolean} [types=false]
 *   @property {boolean} [rarities=false]
 * @property {(headerEl:HTMLElement, api:Object) => void} [enhanceHeader]
 * @property {(formEl:HTMLFormElement, fields:Object, api:Object) => void} [enhanceForm]
 */

/**
 * Builds a full CRUD modal with standardized header, list, form, and preview.
 * Exposes:
 *   - open(): Promise<void>
 *   - refresh(): Promise<void>
 */
export function createDefinitionsModal(config) {
  const {
    id, title, previewType, db,
    loadDefs, saveDef, updateDef, deleteDef,
    createFormController, renderEntry,
    formSchema = {},
    enhanceHeader, enhanceForm
  } = config;

  // default form schema flags
  const schema = {
    name:         formSchema.name         !== false,
    imageUrls:    formSchema.imageUrls    !== false,
    description:  formSchema.description  !== false,
    extraInfo:    formSchema.extraInfo    !== false,
    filterToggle: formSchema.filterToggle === true,
    inventoryPicker: formSchema.inventoryPicker === true,
    types:        formSchema.types        === true,
    rarities:     formSchema.rarities     === true
  };

  let shell, listApi, formApi, previewApi;
  let definitions = [];

  async function refreshDefinitions() {
    definitions = await loadDefs();
    listApi.refresh(definitions);
  }

  async function buildIfNeeded() {
    if (shell) return;

    // 1) create modal shell with consistent header (title, layout toggles, search, close)
    shell = createDefinitionModalShell({ id, title, withPreview: true, previewType });
    const { header, bodyWrap } = shell;

    // 2) instantiate form controller (builds sub-header with Save/Clear/Delete)
    formApi = createFormController({
      onCancel: async () => {
        formApi.reset();
        previewApi.setFromDefinition({});
        previewApi.show();
      },
      onDelete: async defId => {
        await deleteDef(db, defId);
        await refreshDefinitions();
        formApi.reset();
        previewApi.setFromDefinition({});
        previewApi.show();
      },
      onSubmit: async payload => {
        if (payload.id) {
          await updateDef(db, payload.id, payload);
        } else {
          await saveDef(db, null, payload);
        }
        await refreshDefinitions();
        formApi.reset();
        previewApi.setFromDefinition({});
        previewApi.show();
      }
    });

    // 3) relocate the form's sub-header into the modal header on the right
    const subHeader = formApi.getSubHeaderElement();
    subHeader.style.marginLeft = "auto";
    header.appendChild(subHeader);

    // 4) allow wrapper to add global header items
    enhanceHeader?.(header, { shell, formApi });

    // 5) build list container under header
    const listContainer = createDefListContainer(`${id}-list`);
    bodyWrap.appendChild(listContainer);
    bodyWrap.appendChild(document.createElement("hr"));

    // 6) create core form fields according to schema
    previewApi = shell.previewApi;
    const form = document.createElement("form");
    form.classList.add("ui-scroll-float");

    const fields = {};

    if (schema.name) {
      const row = document.createElement("div"); row.className = "field-row";
      const lbl = document.createElement("label"); lbl.textContent = "Name"; lbl.htmlFor = `${id}-fld-name`;
      const inp = document.createElement("input"); inp.type = "text"; inp.id = `${id}-fld-name`;
      row.append(lbl, inp);
      form.appendChild(row);
      fields.name = inp;
    }

    if (schema.imageUrls) {
      ["Small","Large"].forEach(size => {
        const row = document.createElement("div"); row.className = "field-row";
        const lbl = document.createElement("label"); lbl.textContent = `Image ${size}`; lbl.htmlFor = `${id}-fld-img-${size.toLowerCase()}`;
        const inp = document.createElement("input"); inp.type = "text"; inp.id = `${id}-fld-img-${size.toLowerCase()}`;
        row.append(lbl, inp);
        form.appendChild(row);
        fields[`image${size}`] = inp;
      });
    }

    if (schema.description) {
      const { row: descRow, textarea, colorBtn } = createDescriptionField();
      descRow.insertBefore(colorBtn, descRow.firstChild);
      form.appendChild(descRow);
      fields.description = textarea;
      fields.descriptionColor = colorBtn;
    }

    if (schema.extraInfo) {
      const { row: extraRow, extraInfo } = createExtraInfoField({ withDividers:true });
      form.appendChild(extraRow);
      fields.extraInfo = extraInfo;
    }

    if (schema.filterToggle) {
      const row = document.createElement("div"); row.className = "field-row";
      const cb  = document.createElement("input"); cb.type = "checkbox"; cb.id = `${id}-fld-filter-toggle`;
      const lbl = document.createElement("label"); lbl.htmlFor = cb.id; lbl.textContent = "Add to filters";
      row.append(lbl, cb);
      form.appendChild(row);
      fields.addToFilters = cb;
    }

    if (schema.inventoryPicker) {
      const row = document.createElement("div"); row.className = "field-row";
      const lbl = document.createElement("label"); lbl.textContent = "Loot Pool";
      const chipContainer = document.createElement("div"); chipContainer.className = "loot-pool-chips";
      const btn = document.createElement("button"); btn.type = "button"; btn.textContent = "⚙︎";
      btn.onclick = async () => {
        const ids = await openInventoryPicker(db, { selectedIds: fields.lootPool || [], title: `Select ${title} Items` });
        fields.lootPool = ids;
        // re-render chips...
      };
      row.append(lbl, chipContainer, btn);
      form.appendChild(row);
      fields.lootPool = [];
      fields.chipContainer = chipContainer;
    }

    bodyWrap.appendChild(form);

    // 7) allow wrapper to inject additional controls
    enhanceForm?.(form, fields, { shell, formApi, previewApi });

    // 8) wire live preview
    form.addEventListener("input", () => {
      const live = formApi.getCurrent?.();
      if (live) {
        previewApi.setFromDefinition(live);
        previewApi.show();
      }
    });

    // attach our built form and fields to formApi for populate/getCurrent
    Object.assign(formApi, { form, fields });

    // 9) wire definition list
    listApi = createDefinitionListManager({
      container:      listContainer,
      getDefinitions: () => definitions,
      renderEntry,
      onEntryClick: async def => {
        formApi.populate(def);
        previewApi.setFromDefinition(def);
        previewApi.show();
      },
      onDelete: async defId => {
        await deleteDef(db, defId);
        await refreshDefinitions();
      }
    });
  }

  return {
    open: async () => {
      await buildIfNeeded();
      formApi.reset();
      await refreshDefinitions();
      shell.open();
      formApi.initPickrs?.();
      previewApi.setFromDefinition({});
      requestAnimationFrame(() => previewApi.show());
    },
    refresh: refreshDefinitions
  };
}
