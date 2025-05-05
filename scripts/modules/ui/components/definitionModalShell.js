// =========================================================
// VBMap • Definition Modal Shell
// ---------------------------------------------------------
// @file:    /scripts/modules/ui/components/definitionModalShell.js
// @version: 1.0  (2025‑05‑08)
// ---------------------------------------------------------
// Generic admin‑side modal that shows a searchable list of
// entity definitions on the left and a form (+ preview) on
// the right.  Supply entity‑specific bits via config.
// =========================================================

import { createModal, openModal, closeModal } from "../uiKit.js";
import { createListManager } from "./definitionListManager.js";

/**
 * @typedef {Object} ModalShellConfig
 * @property {string}         id                 Unique DOM id
 * @property {string}         title              Modal window title
 * @property {function}       loadAll            ()⇒Promise<def[]>
 * @property {function}       upsert             (def)⇒Promise<void>
 * @property {function}       remove             (id)⇒Promise<void>
 * @property {function}       createFormController (callbacks)⇒controller
 * @property {function}       renderEntry        (def, layout, handlers)⇒HTMLElement
 * @property {HTMLElement?}   previewPanel       Optional preview pane
 */

/**
 * Builds the modal and returns `{ open() }`
 * @param {ModalShellConfig} cfg
 */
export function createDefinitionModalShell(cfg) {
  const { modal, header, content } = createModal({
    id: cfg.id,
    title: cfg.title,
    size: "large",
    backdrop: true
  });

  /* layout: sidebar list | form column | (optional) preview */
  const paneList = document.createElement("div");
  paneList.className = "def-shell-list";
  const paneForm = document.createElement("div");
  paneForm.className = "def-shell-form";
  Object.assign(paneForm.style, { flex: "1 1 auto", overflowY: "auto", padding: "0 16px" });

  const bodyFlex = document.createElement("div");
  Object.assign(bodyFlex.style, { display: "flex", height: "calc(100% - 48px)" });
  bodyFlex.append(paneList, paneForm);
  cfg.previewPanel && bodyFlex.append(cfg.previewPanel);
  content.appendChild(bodyFlex);

  /* list manager */
  const listMgr = createListManager(paneList);

  /* current form controller */
  let formCtrl = null;

  function buildForm(def) {
    if (formCtrl) paneForm.innerHTML = "";          // wipe previous
    formCtrl = cfg.createFormController({
      onCancel : () => formCtrl.reset(),
      onSubmit : async d => { await cfg.upsert(d); await refresh(); formCtrl.reset(); },
      onDelete : async id => { await cfg.remove(id); await refresh(); formCtrl.reset(); }
    });
    paneForm.appendChild(formCtrl.form);
    formCtrl.reset();
    if (def) formCtrl.populate(def);
  }

  async function refresh() {
    const all = await cfg.loadAll();
    listMgr.render(all, def => {
      buildForm(def);
      cfg.previewPanel && cfg.previewPanel.setFromDefinition(def);
    }, async id => {
      await cfg.remove(id);
      await refresh();
      formCtrl.reset();
    }, cfg.renderEntry);
  }

  async function open() {
    if (!modal.isBuilt) {
      await refresh();
      modal.isBuilt = true;
    }
    openModal(modal);
  }

  header.querySelector("button.close")?.addEventListener("click", () => closeModal(modal));

  return { open };
}
