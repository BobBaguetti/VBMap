// @file: src/shared/ui/components/listPicker.js
// @version: 1.3 — fully self-contained modal; removed shared modalFactory dependency

/**
 * Opens a modal letting the user pick zero or more items.
 *
 * @param {object} opts
 * @param {string} opts.title            — modal title
 * @param {Array<object>} opts.items     — array of {id, name, …} objects
 * @param {Array<string>} [opts.selected] — array of item ids to pre-check
 * @param {string} [opts.labelKey="name"] — which property to show as the label
 * @returns {Promise<Array<string>>} resolves to the selected item ids when OK is clicked, rejects on Cancel
 */
export function pickItems({ title, items, selected = [], labelKey = "name" }) {
  // --- Inline modal shell ---
  const modal = document.createElement("div");
  Object.assign(modal.style, {
    position:       "fixed",
    inset:          "0",
    display:        "flex",
    justifyContent: "center",
    alignItems:     "center",
    background:     "rgba(0,0,0,0.5)",
    zIndex:         "10000"
  });
  document.body.append(modal);

  // Prevent background scroll & restore focus
  const prevFocused = document.activeElement;
  const scrollY     = window.scrollY;
  document.documentElement.style.overflow = "hidden";

  function cleanup() {
    document.documentElement.style.overflow = "";
    window.scrollTo(0, scrollY);
    prevFocused?.focus?.();
    document.removeEventListener("keydown", onKey);
    modal.remove();
  }

  function onKey(e) {
    if (e.key === "Escape") {
      closePicker();
      rejectPick();
    }
  }
  document.addEventListener("keydown", onKey);

  function closePicker() {
    cleanup();
  }

  // Close on backdrop click
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      closePicker();
      rejectPick();
    }
  });

  // --- Content card ---
  const content = document.createElement("div");
  Object.assign(content.style, {
    background:      "var(--bg-30)",
    color:           "var(--text-primary)",
    border:          "1px solid var(--border-soft)",
    borderRadius:    "6px",
    boxShadow:       "0 4px 12px rgba(0,0,0,0.45)",
    padding:         "1em",
    maxWidth:        "90vw",
    width:           "auto",
    maxHeight:       "80vh",
    overflow:        "hidden",
    display:         "flex",
    flexDirection:   "column",
    gap:             "0.5em"
  });
  modal.append(content);

  // Title
  const h2 = document.createElement("h2");
  h2.textContent = title;
  Object.assign(h2.style, {
    margin:       0,
    fontSize:     "1.25em",
    textAlign:    "center"
  });
  content.append(h2);

  // Search bar
  const search = document.createElement("input");
  search.type        = "search";
  search.placeholder = "Search…";
  Object.assign(search.style, {
    padding:   "0.5em",
    fontSize:  "1em",
    width:     "100%",
    boxSizing: "border-box"
  });
  content.append(search);

  // List container
  const listContainer = document.createElement("div");
  Object.assign(listContainer.style, {
    flex:       "1 1 auto",
    overflowY:  "auto",
    display:    "flex",
    flexDirection: "column",
    gap:        "0.25em"
  });
  content.append(listContainer);

  let checkboxes = [];

  function renderList(filter = "") {
    listContainer.innerHTML = "";
    checkboxes = items
      .filter(it => it[labelKey].toLowerCase().includes(filter.toLowerCase()))
      .map(it => {
        const row = document.createElement("label");
        Object.assign(row.style, {
          display:       "flex",
          alignItems:    "center",
          gap:           "0.5em",
          cursor:        "pointer"
        });
        const cb = document.createElement("input");
        cb.type    = "checkbox";
        cb.value   = it.id;
        cb.checked = selected.includes(it.id);
        const lbl = document.createElement("span");
        lbl.textContent = it[labelKey];
        row.append(cb, lbl);
        listContainer.append(row);
        return cb;
      });
  }
  renderList();
  search.addEventListener("input", () => renderList(search.value));

  // Buttons row
  const btnRow = document.createElement("div");
  Object.assign(btnRow.style, {
    display:        "flex",
    justifyContent: "flex-end",
    gap:            "0.5em"
  });
  const btnCancel = document.createElement("button");
  btnCancel.type        = "button";
  btnCancel.textContent = "Cancel";
  btnCancel.onclick     = () => { closePicker(); rejectPick(); };
  const btnOk = document.createElement("button");
  btnOk.type        = "button";
  btnOk.textContent = "OK";
  btnOk.onclick     = () => { closePicker(); resolvePick(checkboxes.filter(c=>c.checked).map(c=>c.value)); };
  btnRow.append(btnCancel, btnOk);
  content.append(btnRow);

  // Promise wiring
  let resolvePick, rejectPick;
  const promise = new Promise((res, rej) => {
    resolvePick = res;
    rejectPick  = rej;
  });

  return promise;
}
