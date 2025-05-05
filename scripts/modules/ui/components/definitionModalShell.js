// =========================================================
// VBMap • Definition Modal Shell
// ---------------------------------------------------------
// @file:    /scripts/modules/ui/components/definitionModalShell.js
// @version: 1.1  (2025‑05‑08)
// ---------------------------------------------------------
// Generic admin‑side modal for any definition type.
// =========================================================

import { createModal, openModal, closeModal } from "../uiKit.js";
import { createDefinitionListManager }       from "./definitionListManager.js";  // ← fixed name

/**
 * @typedef {Object} ModalShellConfig
 * @property {string}         id
 * @property {string}         title
 * @property {function():Promise<Array<Object>>} loadAll
 * @property {function(Object):Promise<void>}    upsert
 * @property {function(string):Promise<void>}    remove
 * @property {function(Object):FormController}   createFormController
 * @property {function(Object,string,Object):HTMLElement} renderEntry
 * @property {{ container:HTMLElement, setFromDefinition:function(Object)}} [previewPanel]
 */

/**
 * Build & return `{ open }`
 * @param {ModalShellConfig} cfg
 */
export function createDefinitionModalShell(cfg) {
  const { modal, header, content } = createModal({
    id: cfg.id,
    title: cfg.title,
    size: "large",
    backdrop: true
  });

  /* Layout: list | form | (optional) preview */
  const paneList = document.createElement("div");
  paneList.className = "def-shell-list";
  const paneForm = document.createElement("div");
  Object.assign(paneForm.style, { flex:"1 1 auto", overflowY:"auto", padding:"0 16px" });

  const bodyFlex = document.createElement("div");
  Object.assign(bodyFlex.style, { display:"flex", height:"calc(100% - 48px)" });
  bodyFlex.append(paneList, paneForm);
  cfg.previewPanel && bodyFlex.append(cfg.previewPanel.container);
  content.appendChild(bodyFlex);

  /* List manager */
  const listMgr = createDefinitionListManager({
    container: paneList,
    getDefinitions: () => _defs,
    renderEntry: cfg.renderEntry,
    onEntryClick: onEntryClick,
    onDelete: async id => { await cfg.remove(id); await refresh(); formCtrl.reset(); },
    getCurrentLayout: () => "row"
  });

  /* Form controller instance */
  let formCtrl = null;
  let _defs = [];

  function buildForm(def) {
    paneForm.innerHTML = "";
    formCtrl = cfg.createFormController({
      onCancel: () => formCtrl.reset(),
      onSubmit: async d => { await cfg.upsert(d); await refresh(); formCtrl.reset(); },
      onDelete: async id => { await cfg.remove(id); await refresh(); formCtrl.reset(); }
    });
    paneForm.appendChild(formCtrl.form);
    formCtrl.reset();
    if (def) formCtrl.populate(def);
  }

  function onEntryClick(def) {
    buildForm(def);
    cfg.previewPanel && cfg.previewPanel.setFromDefinition(def);
  }

  async function refresh() {
    _defs = await cfg.loadAll();
    listMgr.refresh();
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
