// @fullfile: Send the entire file, no omissions or abridgment — version is 2. Increase by 1 every time you update anything.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 2
// @file:    /scripts/modules/ui/itemDefinitionsModal.js

import { Modal, createColorPicker } from '../ui/uiKit.js';
import {
  loadItemDefinitions,
  addItemDefinition,
  updateItemDefinition,
  deleteItemDefinition
} from '../services/itemDefinitionsService.js';

/**
 * Initialise the Manage Items modal.
 * @param {firebase.firestore.Firestore} db
 * @param {Function} onDefinitionsChanged callback invoked after CRUD ops
 */
export function initItemDefinitionsModal(db, onDefinitionsChanged = () => {}) {
  // Selectors
  const modalSelector = '#item-definitions-modal';
  const openBtnSelector = '#manage-item-definitions';
  const closeBtnSelector = '#close-item-definitions, #def-cancel';

  // Modal lifecycle via UI Kit
  const modal = new Modal({
    modalSelector,
    openBtnSelector,
    closeBtnSelector,
    onOpen: () => {
      resetForm();
      loadAndRender();
    },
    onClose: () => {
      cleanupForm();
    }
  });

  // Element references
  const listWrap     = document.getElementById('item-definitions-list');
  const form         = document.getElementById('item-definition-form');
  const defName      = document.getElementById('def-name');
  const defType      = document.getElementById('def-type');
  const defRarity    = document.getElementById('def-rarity');
  const defDescription = document.getElementById('def-description');
  const defImageSmall  = document.getElementById('def-image-small');
  const defImageBig    = document.getElementById('def-image-big');
  const defExtraLinesContainer = document.getElementById('def-extra-lines');
  const addExtraLineBtn = document.getElementById('add-def-extra-line');
  const defSearch       = document.getElementById('def-search');
  const filterNameBtn   = document.getElementById('filter-name');
  const filterTypeBtn   = document.getElementById('filter-type');
  const filterRarityBtn = document.getElementById('filter-rarity');
  const heading3        = document.getElementById('def-form-subheading');

  // State
  let extraLines = [];
  let activeDef  = null;

  // Color pickers via UI Kit
  const pickrName        = createColorPicker('.pickr-def-name', { defaultColor: '#E5E6E8', theme: 'nano' });
  const pickrType        = createColorPicker('.pickr-def-type', { defaultColor: '#E5E6E8', theme: 'nano' });
  const pickrRarity      = createColorPicker('.pickr-def-rarity', { defaultColor: '#E5E6E8', theme: 'nano' });
  const pickrDescription = createColorPicker('.pickr-def-description', { defaultColor: '#E5E6E8', theme: 'nano' });

  /**
   * Load definitions from Firestore and render list
   */
  async function loadAndRender() {
    listWrap.innerHTML = '';
    const defs = await loadItemDefinitions(db);
    defs.forEach(def => renderDefinitionEntry(def));
  }

  /**
   * Create a list entry for an item definition
   */
  function renderDefinitionEntry(def) {
    const row = document.createElement('div');
    row.className = 'item-def-entry';
    // Zebra striping
    if (listWrap.children.length % 2 !== 0) row.style.background = '#1f1f1f';

    // Content
    const rareCap = def.rarity?.charAt(0).toUpperCase() + def.rarity?.slice(1);
    const content = document.createElement('div');
    content.innerHTML = `
      <span class="def-name"><strong>${def.name}</strong></span>
      (<span class="def-type">${def.itemType||def.type}</span>) –
      <span class="def-rarity">${rareCap||''}</span><br/>
      <em>${def.description||''}</em>
    `;
    row.appendChild(content);

    // Controls container
    const ctrl = document.createElement('div');
    ctrl.className = 'item-def-entry__controls';

    // Filter toggle
    const filterBtn = document.createElement('button');
    filterBtn.textContent = def.showInFilters ? 'Hide' : 'Show';
    filterBtn.addEventListener('click', async () => {
      def.showInFilters = !def.showInFilters;
      await updateItemDefinition(db, def);
      onDefinitionsChanged();
      loadAndRender();
    });
    ctrl.appendChild(filterBtn);

    // Edit
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openEdit(def));
    ctrl.appendChild(editBtn);

    // Delete
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', async () => {
      if (confirm('Delete this definition?')) {
        await deleteItemDefinition(db, def.id);
        onDefinitionsChanged();
        loadAndRender();
      }
    });
    ctrl.appendChild(delBtn);

    row.appendChild(ctrl);
    listWrap.appendChild(row);
  }

  /**
   * Populate the form for creating or editing
   */
  function resetForm() {
    form.reset();
    extraLines = [];
    activeDef = null;
    heading3.textContent = 'Create New Definition';
    clearExtraLines();
  }

  /**
   * Clear and destroy color pickers and list entries
   */
  function cleanupForm() {
    form.reset();
    extraLines = [];
    pickrName.destroyAndRemove();
    pickrType.destroyAndRemove();
    pickrRarity.destroyAndRemove();
    pickrDescription.destroyAndRemove();
    listWrap.innerHTML = '';
  }

  /**
   * Render extra info line inputs
   */
  function clearExtraLines() {
    defExtraLinesContainer.innerHTML = '';
  }

  function renderExtraLines() {
    clearExtraLines();
    extraLines.forEach((line, idx) => {
      const row = document.createElement('div');
      row.className = 'def-extra-line';
      const txt = document.createElement('input');
      txt.value = line.text;
      txt.addEventListener('input', e => extraLines[idx].text = e.target.value);
      const clr = createColorPicker(`.extra-line-color-${idx}`, { defaultColor: line.color });
      const rm  = document.createElement('button');
      rm.textContent = '×';
      rm.addEventListener('click', () => { extraLines.splice(idx,1); renderExtraLines(); });
      row.append(txt, clr._root || clr.getRoot().root, rm);
      defExtraLinesContainer.appendChild(row);
    });
  }

  addExtraLineBtn.addEventListener('click', () => {
    extraLines.push({ text: '', color: '#E5E6E8' });
    renderExtraLines();
  });

  /**
   * Open modal for editing a definition
   */
  function openEdit(def) {
    activeDef = def;
    heading3.textContent = `Edit: ${def.name}`;
    defName.value = def.name;
    defType.value = def.type;
    defRarity.value = def.rarity;
    defDescription.value = def.description;
    defImageSmall.value = def.imageSmall;
    defImageBig.value = def.imageBig;
    extraLines = JSON.parse(JSON.stringify(def.extraLines || []));
    pickrName.setColor(def.nameColor);
    pickrType.setColor(def.itemTypeColor || def.typeColor);
    pickrRarity.setColor(def.rarityColor);
    pickrDescription.setColor(def.descriptionColor);
    renderExtraLines();
    modal.open();
  }

  // Handle form submission
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      id:           activeDef?.id,
      name:         defName.value.trim() || 'Unnamed',
      type:         defType.value,
      rarity:       defRarity.value,
      description:  defDescription.value,
      imageSmall:   defImageSmall.value,
      imageBig:     defImageBig.value,
      extraLines:   JSON.parse(JSON.stringify(extraLines)),
      nameColor:    pickrName.getColor().toHEXA().toString(),
      itemTypeColor: pickrType.getColor().toHEXA().toString(),
      rarityColor:  pickrRarity.getColor().toHEXA().toString(),
      descriptionColor: pickrDescription.getColor().toHEXA().toString(),
      showInFilters: activeDef?.showInFilters || false
    };

    if (activeDef?.id) {
      await updateItemDefinition(db, payload);
    } else {
      await addItemDefinition(db, payload);
    }
    onDefinitionsChanged();
    loadAndRender();
    resetForm();
  });

  return { openModal: modal.open, closeModal: modal.close, refresh: loadAndRender };
}

// @version: 2
