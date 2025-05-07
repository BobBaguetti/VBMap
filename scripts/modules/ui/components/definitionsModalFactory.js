// @file: /scripts/modules/ui/components/definitionsModalFactory.js
// @version: 1.2 – complete layout per mockup, fields + preview driven
// ⚠️ Do not remove or alter these comments without updating the adjacent code.

import { createModalCore }   from './modalCore.js';
import { createModalShell }  from './modalShell.js';
import { createSearchRow }   from './modalToolbar.js';
import { buildSubHeader }    from './subHeaderBuilder.js';
import { createPreviewPanel } from '../preview/createPreviewPanel.js';

/**
 * Builds and opens a “Manage X” modal with:
 * - header (title, search, close)
 * - entry list (zebra striped, delete hooks)
 * - add/edit subheader (Create/Save/Clear/Delete toggles)
 * - schema-driven form area
 * - live preview pane
 *
 * @param {object} cfg
 * @param {string} cfg.entityName
 * @param {() => Promise<object[]>} cfg.loadAll
 * @param {(item, onSelect) => HTMLElement} cfg.renderEntryRow
 * @param {{ key, label, type, pickr?, options? }[]} cfg.fields
 * @param {(data) => HTMLElement|string} cfg.renderPreview
 * @param {(data) => Promise} cfg.save
 * @param {(id) => Promise} cfg.delete
 */
export async function createDefinitionsModal(cfg) {
  // 1) create modal core + shell
  const core = createModalCore({
    id: `${cfg.entityName.toLowerCase()}-modal`,
    size: 'large',
    backdrop: true,
  });
  createModalShell(core, {
    title: `Manage ${cfg.entityName}s`,
    withDivider: true,
  });

  // 2) search bar in header
  const searchInput = createSearchRow(txt => {
    // placeholder: filter entries
    listItems.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(txt.toLowerCase()) ? '' : 'none';
    });
  });
  core.header.appendChild(searchInput);

  // 3) entry list container
  const listContainer = document.createElement('div');
  listContainer.className = 'definition-list';
  core.content.appendChild(listContainer);

  // 4) divider under list
  const hr = document.createElement('hr');
  core.content.appendChild(hr);

  // 5) sub-header (Add/Edit controls)
  let mode = 'add'; // or 'edit'
  const subHdr = buildSubHeader({
    entityName: cfg.entityName,
    onCreate: () => switchMode('add'),
    onSave:   () => handleSave(),
    onCancel: () => switchMode('add'),
    onDelete: () => handleDelete(),
    onToggleFilter: checked => {
      // hook for “Add Filter” toggle
    }
  });
  core.content.appendChild(subHdr);

  // 6) form area
  const formEl = document.createElement('form');
  formEl.className = 'definition-form';
  core.content.appendChild(formEl);

  // 7) preview panel on right
  const previewApi = createPreviewPanel(core.content, cfg.renderPreview);

  // internal state
  let listItems = [];
  let currentData = {};

  // helpers
  function switchMode(newMode, data) {
    mode = newMode;
    buildSubHeaderActions(subHdr, mode);
    formEl.innerHTML = '';
    if (mode === 'edit') {
      currentData = data;
      populateForm(data);
    } else {
      currentData = {};
    }
    previewApi.update(currentData);
  }

  function buildSubHeaderActions(container, mode) {
    // show/hide Create vs Save/Cancel/Delete
    container.querySelectorAll('[data-role]').forEach(btn => {
      const roles = btn.getAttribute('data-role').split(',');
      btn.style.display = roles.includes(mode) ? '' : 'none';
    });
    // update title text
    container.querySelector('.subheader-title').textContent =
      (mode === 'add' ? 'Add ' : 'Edit ') + cfg.entityName;
  }

  function populateForm(data) {
    cfg.fields.forEach(f => {
      const wrapper = document.createElement('div');
      wrapper.className = 'form-field';
      const label = document.createElement('label');
      label.textContent = f.label;
      let input;
      if (f.type === 'select') {
        input = document.createElement('select');
        f.options.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          input.appendChild(o);
        });
      } else if (f.type === 'textarea') {
        input = document.createElement('textarea');
      } else {
        input = document.createElement('input');
        input.type = f.type;
      }
      input.name = f.key;
      if (data[f.key] != null) input.value = data[f.key];
      input.addEventListener('input', () => {
        currentData[f.key] = input.value;
        previewApi.update(currentData);
      });
      wrapper.append(label, input);
      formEl.appendChild(wrapper);
    });
  }

  async function handleSave() {
    await cfg.save(currentData);
    await reloadList();
    switchMode('add');
  }

  async function handleDelete() {
    if (!currentData.id) return;
    await cfg.delete(currentData.id);
    await reloadList();
    switchMode('add');
  }

  async function reloadList() {
    listContainer.innerHTML = '';
    const data = await cfg.loadAll();
    listItems = data.map(item => {
      const row = cfg.renderEntryRow(item, () => {
        switchMode('edit', item);
      });
      listContainer.appendChild(row);
      return row;
    });
    // reset search
    searchInput.querySelector('input').value = '';
  }

  // initial population
  await reloadList();
  switchMode('add');

  core.open();
  return core;
}
