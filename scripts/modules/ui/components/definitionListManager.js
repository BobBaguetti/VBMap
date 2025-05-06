// @file: /scripts/modules/ui/components/definitionListManager.js
// @version: 9.1 - integrated defaultSearchPlaceholder from modalDefaults

import { createFilterableList } from "../../utils/listUtils.js";
import { defaultSearchPlaceholder } from "./modalDefaults.js";

/**
 * Manages a list of definitions with search, optional filters, and layout support.
 *
 * @param {object} cfg
 * @param {HTMLElement} cfg.container             - the container element for entries
 * @param {() => Array<Object>} cfg.getDefinitions - function that returns current definition array
 * @param {(def:Object, layout:string, { onClick, onDelete }) => HTMLElement} cfg.renderEntry
 * @param {(def:Object)=>void} [cfg.onEntryClick]
 * @param {(id:string)=>Promise<void>} [cfg.onDelete]
 * @param {Array<{id:string,label:string}>} [cfg.filters]        - optional filter buttons
 * @param {string} [cfg.searchPlaceholder]                       - placeholder for search input
 * @param {() => string} [cfg.getCurrentLayout]                  - returns current layout ("row", "stacked", etc.)
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
  onEntryClick = () => {},
  onDelete = () => Promise.resolve(),
  filters = [],
  searchPlaceholder = defaultSearchPlaceholder,
  getCurrentLayout = () => "row"
}) {
  // Use createFilterableList to build header (filters & search) and hook rendering
  const sortFns = {}; // no custom sorts by default
  const filterable = createFilterableList(
    container,
    [], // start empty; we'll refresh immediately
    sortFns,
    def => {
      const layout = getCurrentLayout();
      const entryEl = renderEntry(def, layout, {
        onClick: () => onEntryClick(def),
        onDelete: () => onDelete(def.id)
      });
      return entryEl;
    },
    {
      filters,
      searchPlaceholder,
      showFilters: filters.length > 0
    }
  );

  // Initial render
  function render() {
    const defs = getDefinitions();
    filterable.refresh(defs);
  }

  // Expose layout switching by re-rendering
  function setLayout(layout) {
    render();
  }

  // Run first render
  render();

  return {
    refresh: render,
    setLayout,
    activeSorts: filterable.activeSorts
  };
}
