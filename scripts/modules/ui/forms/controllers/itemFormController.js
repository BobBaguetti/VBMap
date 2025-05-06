// @file: /scripts/modules/ui/forms/controllers/itemFormController.js
// @version: 8.0 – now schema‐driven via createSchemaFormController

import itemSchema from "../schemas/itemSchema.js";
import { createSchemaFormController } from "../../components/schemaFormBuilder.js";

/**
 * Creates an item form controller based on the itemSchema.
 *
 * @param {Object} callbacks
 * @param {() => void} callbacks.onCancel
 * @param {(id:string) => void} [callbacks.onDelete]
 * @param {(data:Object) => void} callbacks.onSubmit
 *
 * @returns {{ form, fields, reset, populate, getCurrent, getSubHeaderElement, initPickrs }}
 */
export function createItemFormController(callbacks) {
  return createSchemaFormController(itemSchema, callbacks);
}
