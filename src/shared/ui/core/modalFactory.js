// @file: src/shared/ui/core/modalFactory.js
// @version: 1.2 — support named slots in createModal

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
 *   withDivider?: boolean,
 *   slots?: string[]         // optional named slots to create within the content
 * }} opts
 * @returns {{
 *   modal: HTMLElement,
 *   content: HTMLElement,
 *   header: HTMLElement,
 *   slots?: Record<string, HTMLElement>
 * }}
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
