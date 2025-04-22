/* @version: 3 */
/* @file: /styles/preview/itemPreview.css */

#item-preview-panel {
  width: 260px;
  background-color: #1e1e1e;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  z-index: 1100;
  color: #eee;
  font-family: sans-serif;
  pointer-events: auto;
  display: none;
  flex-shrink: 0;
  align-self: flex-start;
}

#item-preview-panel.visible {
  display: block;
}

#item-preview-panel.pinned {
  border-color: gold;
  box-shadow: 0 0 10px gold;
}

#item-preview-panel .preview-content {
  margin-bottom: 10px;
}

#item-preview-panel .preview-name {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
}

#item-preview-panel .preview-description {
  font-style: italic;
  font-size: 13px;
  color: #bbb;
}

#item-preview-panel .pin-button {
  position: absolute;
  top: 6px;
  right: 6px;
  background: none;
  color: #aaa;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 2px;
}

#item-preview-panel .pin-button:hover {
  color: gold;
}
