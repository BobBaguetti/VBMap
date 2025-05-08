// @file: src/modules/ui/components/chipListManager.js
// @version: 1.0 — generic chip‐list renderer and remover

/**
 * Creates a chip‐list UI inside a container, backed by a mutable array.
 *
 * @param {object} opts
 * @param {HTMLElement} opts.container
 *        The element into which chips should be rendered.
 * @param {Array<any>} opts.listArray
 *        The array that backs the chips; chips reflect its contents.
 * @param {function(any): string} opts.renderLabel
 *        Given an item (array element), returns the text for the chip.
 * @param {function(Array<any>): void} [opts.onChange]
 *        Called with the updated array whenever a chip is removed.
 */
export function createChipListManager({ container, listArray, renderLabel, onChange = () => {} }) {
    function render() {
      container.innerHTML = "";
      listArray.forEach((item, idx) => {
        const chip = document.createElement("span");
        chip.className = "loot-pool-chip";
        chip.textContent = renderLabel(item);
  
        const btn = document.createElement("button");
        btn.className = "remove-chip";
        btn.textContent = "×";
        btn.onclick = () => {
          listArray.splice(idx, 1);
          render();
          onChange([...listArray]);
        };
  
        chip.append(btn);
        container.append(chip);
      });
    }
  
    // initial render
    render();
  
    // expose a method to re-render (e.g. after listArray is replaced wholesale)
    return { render };
  }
  