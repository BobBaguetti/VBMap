// @file: src/modules/definition/DefinitionController.js
// @version: 1.1 — fixed import paths for formControllerShell

import { createDefinitionModal } from "../../shared/ui/core/createDefinitionModal.js";
import { openModal, closeModal } from "../../shared/ui/core/modalCore.js";
import { createDefinitionListManager } from "./list/definitionListManager.js";
// Corrected import path: formControllerShell lives under shared/ui/forms, not components
import {
  createFormControllerHeader,
  wireFormEvents
} from "../../shared/ui/forms/formControllerShell.js";
import { Form } from "../../shared/ui/forms/Form.js";
import { loadItemDefinitions } from "../services/itemDefinitionsService.js";

export class DefinitionController {
  constructor(db, definitionTypes, onClose) {
    this.db = db;
    this.types = definitionTypes;
    this.onClose = onClose;
    this.modal = null;
    this.listApi = null;
    this.formObj = null;
    this.previewApi = null;
    this.definitions = [];
    this.currentType = null;
    this.itemMap = {};
  }

  async _refreshList() {
    const cfg = this.types[this.currentType];
    this.definitions = await cfg.loadDefs(this.db);
    this.listApi.refresh(this.definitions);
  }

  async _buildModal() {
    if (this.modal) return;

    const { modal, content, header, slots } = createDefinitionModal({
      id: "definition-modal",
      title: "Manage Definitions",
      onClose: () => {
        this.previewApi?.hide();
        this.onClose?.();
      }
    });
    this.modal = modal;
    this.content = content;
    this.header = header;
    this.slots = slots;

    // 1) Search bar in header
    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.className = "modal__search";
    searchInput.placeholder = "Search definitions…";
    searchInput.addEventListener("input", () => this.listApi.filter(searchInput.value));
    header.append(searchInput);

    // 2) Left pane
    const left = slots.left;
    const typeLabel = document.createElement("label");
    typeLabel.textContent = "Type:";
    this.fldType = document.createElement("select");
    this.fldType.innerHTML = Object.keys(this.types)
      .map(t => `<option value="${t}">${t}</option>`)
      .join("");
    typeLabel.append(this.fldType);

    const listContainer = document.createElement("div");
    listContainer.id = "definition-list";
    this.formContainer = document.createElement("div");
    this.formContainer.id = "definition-form-container";

    left.append(typeLabel, listContainer, this.formContainer);

    // 3) Preview pane container
    this.previewContainer = slots.preview;

    // 4) List manager
    this.listApi = createDefinitionListManager({
      container: listContainer,
      getDefinitions: () => this.definitions,
      onEntryClick: def => this.openEdit(def),
      onDelete: async id => {
        const cfg = this.types[this.currentType];
        await cfg.del(this.db, id);
        await this._refreshList();
      }
    });

    // 5) Switch type dropdown
    this.fldType.addEventListener("change", () => this.openCreate());
  }

  async openCreate(type = null) {
    await this._buildModal();
    this.currentType = type || this.fldType.value || Object.keys(this.types)[0];
    this.fldType.value = this.currentType;
    await this._refreshList();
    await this._openDefinition(null);
  }

  async openEdit(def) {
    await this._buildModal();
    await this._openDefinition(this.currentType, def);
  }

  async _openDefinition(type = null, def = null) {
    this.currentType = type || this.currentType;
    this.fldType.value = this.currentType;

    if (this.currentType === "Chest") {
      const items = await loadItemDefinitions(this.db);
      this.itemMap = Object.fromEntries(items.map(i => [i.id, i]));
    }

    const cfg = this.types[this.currentType];
    this.previewApi = cfg.previewBuilder(this.previewContainer);

    this.formContainer.innerHTML = "";
    this.formObj = new Form(cfg.schema, {
      title: this.currentType,
      hasFilter: false,
      onCancel: () => { this.formObj.reset(); this.previewApi.hide(); },
      onDelete: async () => {
        if (def?.id) {
          await cfg.del(this.db, def.id);
          await this._refreshList();
          this.formObj.reset();
          this.previewApi.hide();
        }
      },
      onSubmit: async payload => {
        await cfg.save(this.db, def?.id ?? null, payload);
        await this._refreshList();
        this.formObj.reset();
        this.previewApi.hide();
      },
      onFieldChange: data => {
        let previewData = data;
        if (this.currentType === "Chest" && Array.isArray(data.lootPool)) {
          previewData = {
            ...data,
            lootPool: data.lootPool.map(id => this.itemMap[id]).filter(Boolean)
          };
        }
        this.previewApi.show(previewData);
      }
    });
    this.formContainer.append(this.formObj.form);

    // initialize pickers after attach
    this.formObj.initPickrs?.();

    if (def) {
      this.formObj.populate(def);
      const previewData = this.currentType === "Chest"
        ? { ...def, lootPool: (def.lootPool||[]).map(id=>this.itemMap[id]).filter(Boolean) }
        : def;
      this.previewApi.show(previewData);
    } else {
      this.formObj.reset();
      this.previewApi.show(this.currentType === "Chest" ? { lootPool: [] } : {});
    }

    this.modal.open();
  }
}
