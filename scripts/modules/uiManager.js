// scripts/modules/uiManager.js
//
// Context‑menu and small UI helpers
/*──────────────────────────────────────────────────────────────────────────*/

/* ───── Draggable helper ───── */
export function makeDraggable(el, handle = el) {
  let dragging = false, dx = 0, dy = 0;
  handle.addEventListener("mousedown", e => {
    dragging = true;
    const st = window.getComputedStyle(el);
    dx = e.clientX - parseInt(st.left, 10);
    dy = e.clientY - parseInt(st.top , 10);
    e.preventDefault();
  });
  document.addEventListener("mousemove", e => {
    if (dragging) {
      el.style.left = (e.clientX - dx) + "px";
      el.style.top  = (e.clientY - dy) + "px";
    }
  });
  document.addEventListener("mouseup", () => dragging = false);
}

/* ───── Context‑menu helpers ───── */
export function hideContextMenu() {
  const m = document.getElementById("context-menu");
  if (m) m.style.display = "none";
}

/**
 * Show a context menu at (x,y).
 * `options` = [{ text, action(mouseClickEvent) }, …]
 */
export function showContextMenu(x, y, options) {
  let menu = document.getElementById("context-menu");
  if (!menu) {
    menu = document.createElement("div");
    menu.id = "context-menu";
    document.body.appendChild(menu);
  }
  Object.assign(menu.style, {
    position:"absolute", left:x+"px", top:y+"px",
    background:"#333", color:"#eee", border:"1px solid #555",
    padding:"5px", zIndex:2000, display:"block",
    boxShadow:"0 2px 6px rgba(0,0,0,.5)"
  });
  menu.innerHTML = "";

  options.forEach(opt => {
    const item = document.createElement("div");
    item.textContent = opt.text;
    item.style.cssText = "padding:5px 10px; cursor:pointer; white-space:nowrap;";
    item.addEventListener("click", e => {           // ← passes click event
      try { opt.action?.(e); } finally { hideContextMenu(); }
    });
    item.addEventListener("mouseover", () => item.style.background="#555");
    item.addEventListener("mouseout",  () => item.style.background="");
    menu.appendChild(item);
  });
}

/* Auto‑hide on any click */
export const attachContextMenuHider = () => document.addEventListener("click", hideContextMenu);

/* Cancel copy/paste on any right‑click elsewhere */
export function attachRightClickCancel(fn) {
  document.addEventListener("contextmenu", () => fn && fn());
}
