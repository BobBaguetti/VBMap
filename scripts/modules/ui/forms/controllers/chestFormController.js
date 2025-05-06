// @file: /scripts/modules/ui/forms/controllers/chestFormController.js
// @version: 5.0 – now schema‐driven via createSchemaFormController

import chestSchema from "../schemas/chestSchema.js";
import { createSchemaFormController } from "../../components/schemaFormBuilder.js";

/**
 * Creates a chest form controller based on the chestSchema.
 *
 * @param {Object} callbacks
 * @param {() => void} callbacks.onCancel
 * @param {(id:string) => void} [callbacks.onDelete]
 * @param {(data:Object) => void} callbacks.onSubmit
 *
 * @returns {{ form, fields, reset, populate, getCurrent, getSubHeaderElement, initPickrs }}
 */
export function createChestFormController(callbacks) {
  return createSchemaFormController(chestSchema, callbacks);
}
