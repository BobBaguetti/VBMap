// @file: src/shared/ui/forms/Form.js
// @version: 1.1 — fix createIcon import path

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createExtraInfoField,
  createChipListField
} from "../components/formFields.js";

import { createIcon }      from "../../utils/iconUtils.js";
import { initFormPickrs }  from "./pickrAdapter.js";
import { createFormState } from "./formStateManager.js";

/**
 * Unified form builder + controller + state manager.
 *
 * Handlers:
 *  - title
 *  - hasFilter?
 *  - onFilter?
 *  - onCancel
 *  - onDelete
 *  - onSubmit
 *  - onFieldChange
 */
export class Form {
  constructor(schema, handlers) {
    const { title, hasFilter, onFilter, onCancel, onDelete, onSubmit, onFieldChange } = handlers;
    this.schema   = schema;
    this.handlers = handlers;

    // 1) Build the raw <form> and field inputs
    this.formResult = this._buildForm(schema);
    this.form       = this.formResult.form;
    this.fields     = this.formResult.fields;
    this.colorables = this.formResult.colorables;

    // 2) Create header + buttons row
    this._btnDelete = null;
    const headerWrap = this._createHeader(title, hasFilter, onFilter, onCancel, onDelete);
    headerWrap.classList.add("modal-subheader");
    this.form.prepend(headerWrap);

    // 3) Init Pickr swatches
    this.pickrs = initFormPickrs(this.form, this.colorables);

    // 4) Track current definition ID
    this.payloadId = null;

    // 5) Form state setup
    const defaultValues = Object.fromEntries(
      Object.entries(schema).map(([k, cfg]) => [
        k,
        cfg.default !== undefined
          ? cfg.default
          : cfg.type === "checkbox"
            ? false
            : ""
      ])
    );
    const pickrClearKeys = Object.entries(schema)
      .filter(([, cfg]) => cfg.colorable)
      .map(([, cfg]) => cfg.colorable);

    this.state = createFormState({
      form:            this.form,
      fields:          this.fields,
      defaultValues,
      pickrs:          this.pickrs,
      pickrClearKeys,
      subheading:      headerWrap.querySelector("h3"),
      setDeleteVisible: v => { this._btnDelete.hidden = !v; },
      getCustom:       () => this.getValues(),
      onFieldChange
    });

    // 6) Wire submit & live-preview
    this._wireEvents(onSubmit, onFieldChange);
  }

  // Build the <form> rows from schema
  _buildForm(schema) {
    const form = document.createElement("form");
    const fields = {};
    const colorables = {};

    for (const [key, cfg] of Object.entries(schema)) {
      let row, input, picker;
      switch (cfg.type) {
        case "text":
        case "number":
          ({ row, input, colorBtn: picker } = createTextField(cfg.label, `fld-${key}`));
          if (cfg.type === "number") input.type = "number";
          if (cfg.colorable) colorables[cfg.colorable] = picker;
          fields[key] = input;
          break;

        case "select":
          ({ row, select: input, colorBtn: picker } = createDropdownField(
            cfg.label,
            `fld-${key}`,
            (cfg.options||[]).map(o=>({value:o,label:o})),
            { showColor: !!cfg.colorable }
          ));
          if (cfg.colorable) colorables[cfg.colorable] = picker;
          fields[key] = input;
          break;

        case "textarea":
          ({ row, textarea: input, colorBtn: picker } =
            createTextareaFieldWithColor(cfg.label, `fld-${key}`));
          if (cfg.colorable) colorables[cfg.colorable] = picker;
          fields[key] = input;
          break;

        case "imageUrl":
          ({ row, input } = createImageField(cfg.label, `fld-${key}`));
          fields[key] = input;
          break;

        case "extraInfo":
          ({ row, extraInfo: input } = createExtraInfoField({ withDividers: cfg.withDividers }));
          fields[key] = input;
          break;

        case "chipList":
          ({ row, getItems: get, setItems: set } = createChipListField(
            cfg.label, [], {
              items: [], idKey: cfg.idKey, labelKey: cfg.labelKey, renderIcon: cfg.renderIcon
            }
          ));
          fields[key] = { get, set };
          break;

        case "checkbox":
          row = document.createElement("label");
          const cb = document.createElement("input");
          cb.type    = "checkbox";
          cb.checked = cfg.default ?? false;
          row.innerHTML = `<span>${cfg.label}</span>`;
          row.prepend(cb);
          fields[key] = cb;
          break;

        default:
          continue;
      }
      form.append(row);
    }

    return { form, fields, colorables };
  }

  // Create header (h3 + buttons)
  _createHeader(title, hasFilter, onFilter, onCancel, onDelete) {
    const wrap = document.createElement("div");
    wrap.classList.add("form-subheader");
    wrap.style.display        = "flex";
    wrap.style.justifyContent = "space-between";
    wrap.style.alignItems     = "center";

    const h3 = document.createElement("h3");
    h3.textContent = title;
    wrap.append(h3);

    if (hasFilter) {
      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.id   = `fld-${title}-filter`;
      chk.addEventListener("change", () => onFilter(chk.checked));
      const lbl = document.createElement("label");
      lbl.htmlFor    = chk.id;
      lbl.textContent = "Add to filters";
      const fc = document.createElement("div");
      fc.style.display    = "flex";
      fc.style.alignItems = "center";
      fc.style.marginLeft = "1rem";
      fc.append(lbl, chk);
      wrap.append(fc);
    }

    // Buttons
    const btnRow = document.createElement("div");
    btnRow.className = "floating-buttons";

    const btnSave = document.createElement("button");
    btnSave.type      = "submit";
    btnSave.className = "ui-button";
    btnSave.textContent = "Save";

    const btnClear = document.createElement("button");
    btnClear.type      = "button";
    btnClear.className = "ui-button";
    btnClear.textContent = "Clear";
    btnClear.onclick   = onCancel;

    const btnDelete = document.createElement("button");
    btnDelete.type        = "button";
    btnDelete.className   = "ui-button-delete";
    btnDelete.title       = "Delete";
    btnDelete.appendChild(createIcon("trash"));
    btnDelete.onclick     = () => onDelete();
    btnDelete.hidden      = true;

    btnRow.append(btnSave, btnClear, btnDelete);
    wrap.append(btnRow);

    // Expose delete button to state manager
    this._btnDelete = btnDelete;

    return wrap;
  }

  // Wire form events
  _wireEvents(onSubmit, onFieldChange) {
    this.form.addEventListener("submit", async e => {
      e.preventDefault();
      await onSubmit?.(this.getValues());
    });
    this.form.addEventListener("input", () => {
      onFieldChange?.(this.getValues());
    });
  }

  /** Gather current payload */
  getValues() {
    const out = { id: this.payloadId };
    for (const [key, cfg] of Object.entries(this.schema)) {
      let val;
      const field = this.fields[key];
      if (cfg.type === "checkbox")      val = field.checked;
      else if (cfg.type === "extraInfo") val = field.getLines();
      else if (cfg.type === "chipList")  val = field.get();
      else                               val = field.value;
      out[key] = val;
      if (cfg.colorable) {
        out[cfg.colorable] = this.pickrs[cfg.colorable]?.getColor() || null;
      }
    }
    return out;
  }

  /** Reset to “Add” mode */
  reset() {
    this.payloadId = null;
    this.state.reset();
  }

  /** Populate for “Edit” mode */
  populate(def) {
    this.payloadId = def.id ?? null;
    this.state.populate(def);
    // Handle chip-lists
    Object.entries(this.schema).forEach(([key, cfg]) => {
      if (cfg.type === "chipList" && Array.isArray(def[key])) {
        this.fields[key].set(def[key]);
      }
    });
  }
}
