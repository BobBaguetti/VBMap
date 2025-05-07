// @file: /scripts/modules/ui/components/definitionListManager.js
// @version: 9.2 – add showSearch flag to suppress built-in search

import { createFilterableList } from "../../utils/listUtils.js";
import { defaultSearchPlaceholder } from "./modalDefaults.js";

/**
 * Manages a list of definitions with search, optional filters, and layout support.
 *
 * @param {object} cfg
 * @param {HTMLElement} cfg.container               - the container element for entries
 * @param {() => Array<Object>} cfg.getDefinitions - returns current definition array
 * @param {(def:Object, layout:string, { onClick, onDelete }) => HTMLElement} cfg.renderEntry
 * @param {(def:Object)=>void} [cfg.onEntryClick]
 * @param {(id:string)=>Promise<void>} [cfg.onDelete]
 * @param {Array<{id:string,label:string}>} [cfg.filters] - optional filter buttons
 * @param {string} [cfg.searchPlaceholder]             - placeholder for search input
 * @param {boolean} [cfg.showSearch=true]              - whether to show built-in search box
 * @param {() => string} [cfg.getCurrentLayout]        - returns current layout
 *
 * @returns {{
 *   refresh(): void,
 *   setLayout(layout:string): void,
 *   activeSorts: Set<string>
 * }}
 */
export function createDefinitionListManager({
  container,
  getDefinitions,
  renderEntry,
  onEntryClick      = () => {},
  onDelete          = () => Promise.resolve(),
  filters           = [],
  searchPlaceholder = defaultSearchPlaceholder,
  showSearch        = true,
  getCurrentLayout  = () => "row"
}) {
  // Build header (filters & optional search) and hook rendering
  const filterable = createFilterableList(
    container,
    [],      // start empty; we'll refresh immediately
    {},      // no custom sort functions
    def => {
      const layout = getCurrentLayout();
      return renderEntry(def, layout, {
        onClick:  () => onEntryClick(def),
        onDelete: () => onDelete(def.id)
      });
    },
    {
      filters,
      searchPlaceholder,
      showFilters: filters.length > 0,
      showSearch   // ← honor the flag
    }
  );

  // Perform initial render
  function render() {
    const defs = getDefinitions();
    filterable.refresh(defs);
  }

  // Re-render when layout changes
  function setLayout(layout) {
    render();
  }

  render();

  return {
    refresh:    render,
    setLayout,
    activeSorts: filterable.activeSorts
  };
}
