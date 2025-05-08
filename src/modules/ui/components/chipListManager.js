// @file: src/modules/ui/components/chipListManager.js
// @version: 1.1 — enhanced for dark-mode styling, icons, and drag handles

/**
 * Creates a chip-list UI inside a container, backed by a mutable array.
 *
 * @param {object} opts
 * @param {HTMLElement} opts.container
 *        The element into which chips should be rendered.
 * @param {Array<any>} opts.listArray
 *        The array that backs the chips; chips reflect its contents.
 * @param {function(any): string} opts.renderLabel
 *        Given an item (array element), returns the text for the chip.
 * @param {function(any): string} [opts.renderIcon]
 *        Given an item, returns the image URL to show inside the chip.
 *        If omitted, no icon is rendered.
 * @param {function(Array<any>): void} [opts.onChange]
 *        Called with the updated array whenever a chip is removed.
 */
export function createChipList(opts) {
  const { container, listArray, renderLabel, renderIcon, onChange } = opts;

  // ensure we have the styled wrapper
  container.classList.add('chip-list-container');

  function render() {
    // clear existing chips
    container.innerHTML = '';

    // render each element in the backing array
    listArray.forEach((item, idx) => {
      // create the chip wrapper
      const chip = document.createElement('div');
      chip.classList.add('loot-pool-chip');

      // optional icon
      if (renderIcon) {
        const iconUrl = renderIcon(item);
        if (iconUrl) {
          const img = document.createElement('img');
          img.src = iconUrl;
          img.classList.add('chip-icon');
          chip.appendChild(img);
        }
      }

      // label text
      const text = document.createTextNode(renderLabel(item));
      chip.appendChild(text);

      // remove button
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.classList.add('remove-chip');
      btn.title = 'Remove';
      btn.innerHTML = '×';
      btn.onclick = () => {
        listArray.splice(idx, 1);
        if (onChange) onChange([...listArray]);
        render();
      };
      chip.appendChild(btn);

      // add to container
      container.appendChild(chip);
    });
  }

  // initial render
  render();

  // expose re-render method if the array is replaced wholesale
  return { render };
}
