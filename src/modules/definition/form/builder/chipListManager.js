// @file: src/modules/definition/form/builder/chipListManager.js
// @version: 1.2 — relocated into definition module

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
 *        Called with the updated array whenever chips change.
 */
export function createChipList(opts) {
  const { container, listArray, renderLabel, renderIcon, onChange } = opts;

  // ensure we have the styled wrapper
  container.classList.add('chip-list-container');

  let dragSrcIndex = null;

  function handleDragStart(e, idx) {
    dragSrcIndex = idx;
    e.dataTransfer.effectAllowed = 'move';
    // for Firefox
    e.dataTransfer.setData('text/plain', '');
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
  }

  function handleDrop(e, idx) {
    e.stopPropagation();
    if (dragSrcIndex === null || dragSrcIndex === idx) return false;

    // reorder array
    const [moved] = listArray.splice(dragSrcIndex, 1);
    listArray.splice(idx, 0, moved);
    if (onChange) onChange([...listArray]);
    render();
    return false;
  }

  function render() {
    container.innerHTML = '';

    listArray.forEach((item, idx) => {
      const chip = document.createElement('div');
      chip.classList.add('loot-pool-chip');
      chip.setAttribute('draggable', 'true');

      // grab-handle
      const handle = document.createElement('span');
      handle.classList.add('chip-handle');
      handle.textContent = '≡';
      handle.title = 'Drag to reorder';
      chip.appendChild(handle);

      // optional icon
      if (renderIcon) {
        const url = renderIcon(item);
        if (url) {
          const img = document.createElement('img');
          img.src = url;
          img.classList.add('chip-icon');
          chip.appendChild(img);
        }
      }

      // label
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

      // drag events
      chip.addEventListener('dragstart', e => handleDragStart(e, idx));
      chip.addEventListener('dragover', handleDragOver);
      chip.addEventListener('drop', e => handleDrop(e, idx));

      container.appendChild(chip);
    });
  }

  // initial render
  render();

  return { render };
}
