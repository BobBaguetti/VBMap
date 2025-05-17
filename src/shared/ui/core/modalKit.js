// @file: src/modules/ui/components/uiKit/modalKit.js
// @version: 1.1 — unified API re-exporting small/large modal creators

import { openModal, closeModal, openModalAt } from "./modalCore.js";
import { createModalSmall } from "./modalSmall.js";
import { createModalLarge } from "./modalLarge.js";

/**
 * Factory for creating a modal. Delegates to small or large based on `size`.
 *
 * @param {{
 *   id: string,
 *   title: string,
 *   onClose?: () => void,
 *   size?: "small" | "large",
 *   backdrop?: boolean,
 *   draggable?: boolean,     // only applies to small
 *   withDivider?: boolean
 * }} opts
 * @returns {{ modal: HTMLElement, content: HTMLElement, header: HTMLElement }}
 */
export function createModal(opts) {
  const { size = "small" } = opts;
  if (size === "large") {
    return createModalLarge(opts);
  } else {
    return createModalSmall(opts);
  }
}

export { openModal, closeModal, openModalAt };
 