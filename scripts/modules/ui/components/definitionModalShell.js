// =========================================================
// VBMap • Definition Modal Shell
// ---------------------------------------------------------
// @file:    /scripts/modules/ui/components/definitionModalShell.js
// @version: 1.3  (2025‑05‑09)
// =========================================================

import { createModal, openModal, closeModal } from "../uiKit.js";
import { createDefinitionListManager }       from "./definitionListManager.js";

export function createDefinitionModalShell(cfg) {
  const { modal, header, content } = createModal({
    id: cfg.id,
    title: cfg.title,
    size: "large",
    backdrop: true
  });

  /* ─── Layout panes ───────────────────────────────────── */
  const paneList = document.createElement("div");
  paneList.className = "def-shell-list";
  Object.assign(paneList.style, {
    flex: "0 0 280px",             // ← fixed width column
    overflowY: "auto",
    borderRight: "1px solid #222"
  });

  const paneForm = document.createElement("div");
  Object.assign(paneForm.style, {
    flex: "1 1 auto",
    overflowY: "auto",
    padding: "0 16px"
  });

  const bodyFlex = document.createElement("div");
  Object.assign(bodyFlex.style, {
    display: "flex",
    height: "calc(100% - 48px)"
  });
  bodyFlex.append(paneList, paneForm);

  if (cfg.previewPanel?.container instanceof HTMLElement) {
    bodyFlex.append(cfg.previewPanel.container);
  }

  content.appendChild(bodyFlex);

  /* ─── List manager ───────────────────────────────────── */
  let _defs = [];
  const listMgr = createDefinitionListManager({
    container: paneList,
    getDefinitions: () => _defs,
    renderEntry: cfg.renderEntry,
    onEntryClick: onEntryClick,
    onDelete: async id => { await cfg.remove(id); await refresh(); buildForm(); },
    getCurrentLayout: () => "row"
  });

  /* ─── Form controller --------------------------------- */
  let formCtrl = null;
  function buildForm(def = null) {
    paneForm.innerHTML = "";
    formCtrl = cfg.createFormController({
      onCancel : () => formCtrl.reset(),
      onSubmit : async d => { await cfg.upsert(d); await refresh(); formCtrl.reset(); },
      onDelete : async id => { await cfg.remove(id); await refresh(); formCtrl.reset(); }
    });
    paneForm.appendChild(formCtrl.form);
    formCtrl.reset();
    if (def) formCtrl.populate(def);
  }

  function onEntryClick(def) {
    buildForm(def);
    cfg.previewPanel?.setFromDefinition?.(def);
  }

  /* ─── Data refresh ------------------------------------ */
  async function refresh() { _defs = await cfg.loadAll(); listMgr.refresh(); }

  /* ─── open() ------------------------------------------ */
  async function open() {
    if (!modal.isBuilt) { await refresh(); buildForm(); modal.isBuilt = true; }
    openModal(modal);
  }
  header.querySelector("button.close")?.addEventListener("click", () => closeModal(modal));

  return { open };
}
