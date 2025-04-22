// @version: 1
// @file: /scripts/modules/utils/definitionListManager.js

/**
 * Manages a filtered/sorted item or quest definition list.
 *
 * @param {HTMLElement} container
 * @param {() => string[]} getActiveSorts
 * @param {() => string} getSearchText
 * @param {() => string} getCurrentLayout
 * @param {(def: Object) => HTMLElement} renderEntry
 * @returns {{ refresh: (data: Array) => void, render: () => void }}
 */
export function createDefinitionListManager(
    container,
    getActiveSorts,
    getSearchText,
    getCurrentLayout,
    renderEntry,
    sortFns = {}
  ) {
    let dataset = [];
  
    function render() {
      const layout = getCurrentLayout();
      const search = getSearchText().trim().toLowerCase();
      const activeSorts = getActiveSorts();
  
      container.innerHTML = "";
      container.className = `def-list ui-scroll-float layout-${layout}`;
  
      let results = dataset.filter(d =>
        d.name?.toLowerCase().includes(search)
      );
  
      for (let id of activeSorts) {
        const fn = sortFns[id];
        if (fn) {
          results.sort(fn);
          break;
        }
      }
  
      results.forEach(def => {
        const entry = renderEntry(def, layout);
        container.appendChild(entry);
      });
    }
  
    function refresh(data) {
      dataset = [...data];
      render();
    }
  
    return { refresh, render };
  }
  