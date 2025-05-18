// @file: src/shared/ui/forms/Form.js
// @version: 1.3 — consolidated header via createFormControllerHeader; unified event wiring

import {
  createTextField,
  createDropdownField,
  createTextareaFieldWithColor,
  createImageField,
  createExtraInfoField,
  createChipListField
} from "../components/formFields.js";
import { createIcon } from "../../utils/iconUtils.js";
import { createFormState } from "./formStateManager.js";
import { initFormPickrs } from "./pickrAdapter.js";
import {
  createFormControllerHeader,
  wireFormEvents
} from "../components/formControllerShell.js";

/**
 * Unified form builder + controller + state manager.
 *
 * Handlers:
 *  - title
 *  - hasFilter
 *  - onFilter
 *  - onCancel
 *  - onDelete
 *  - onSubmit
 *  - onFieldChange
 */
export class Form {
  constructor(schema, handlers) {
    const {
      title,
      hasFilter = false,
      onFilter,
      onCancel,
      onDelete,
      onSubmit,
      onFieldChange
    } = handlers;

    this.schema = schema;
    this.handlers = handlers;

    // 1) Build the raw <form> and field inputs
    const { form, fields, colorables } = this._buildForm(schema);
    this.form = form;
    this.fields = fields;
    this.colorables = colorables;

    // 2) Create header via shared controller
    const headerObj = createFormControllerHeader({
      title,
      hasFilter,
      onFilter,
      onCancel,
      onDelete
    });
    headerObj.container.classList.add("modal-subheader");
    this._btnDelete = headerObj.setDeleteVisible; // setter function
    this.form.prepend(headerObj.container);

    // 3) Lazy-load Pickr adapter and initialize swatches
    this.pickrs = {};
    (async () => {
      try {
        this.pickrs = initFormPickrs(this.form, this.colorables);
      } catch (e) {
        console.warn("Failed to initialize Pickr swatches:", e);
      }
    })();

    // 4) Track current definition ID
    this.payloadId = null;

    // 5) Form state setup (including dynamic subheader titles)
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
      form: this.form,
      fields: this.fields,
      defaultValues,
      pickrs: this.pickrs,
      pickrClearKeys,
      subheading: headerObj.subheading,
      setDeleteVisible: headerObj.setDeleteVisible,
      addTitle: `Add ${title}`,
      editTitle: `Edit ${title}`,
      getCustom: () => this.getValues(),
      onFieldChange
    });

    // 6) Wire submit & live-preview using shared utility
    wireFormEvents(this.form, () => this.getValues(), onSubmit, onFieldChange);
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
          ({ row, input, colorBtn: picker } = createTextField(
            cfg.label,
            `fld-${key}`
          ));
          if (cfg.type === "number") input.type = "number";
          if (cfg.colorable) colorables[cfg.colorable] = picker;
          fields[key] = input;
          break;
        case "select":
          ({ row, select: input, colorBtn: picker } = createDropdownField(
            cfg.label,
            `fld-${key}`,
            (cfg.options || []).map((o) => ({ value: o, label: o })),
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
          ({ row, extraInfo: input } = createExtraInfoField({
            withDividers: cfg.withDividers
          }));
          fields[key] = input;
          break;
        case "chipList":
          ({ row, getItems: get, setItems: set } = createChipListField(
            cfg.label,
            [],
            {
              items: [],
              idKey: cfg.idKey,
              labelKey: cfg.labelKey,
              renderIcon: cfg.renderIcon
            }
          ));
          fields[key] = { get, set };
          break;
        case "checkbox":
          row = document.createElement("label");
          const cb = document.createElement("input");
          cb.type = "checkbox";
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

  /** Gather current payload */
  getValues() {
    const out = { id: this.payloadId };
    for (const [key, cfg] of Object.entries(this.schema)) {
      let val;
      const field = this.fields[key];
      if (cfg.type === "checkbox") val = field.checked;
      else if (cfg.type === "extraInfo") val = field.getLines();
      else if (cfg.type === "chipList") val = field.get();
      else val = field.value;
      out[key] = val;
      if (cfg.colorable) {
        out[cfg.colorable] =
          this.pickrs[cfg.colorable]?.getColor() || null;
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
    Object.entries(this.schema).forEach(([key, cfg]) => {
      if (cfg.type === "chipList" && Array.isArray(def[key])) {
        this.fields[key].set(def[key]);
      }
    });
  }
}
