// @fullfile: Send the entire file, no omissions or abridgments — version is 0.5.0. Increase by 0.1.0 on significant API additions.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 0.5.0
// @file:    /scripts/modules/ui/markerForm.js

import { Modal, createColorPicker } from './uiKit.js';
import { addMarker, updateMarker }  from '../services/firebaseService.js';
import { getItemDefinitions }       from '../services/itemDefinitionsService.js';
import { deepClone }                from '../utils/utils.js';

// Firestore instance to use in populateForm
let firestoreDb;
/**
 * Set the Firestore instance for this module.
 * @param {firebase.firestore.Firestore} db
 */
export function setMarkerFormDb(db) {
  firestoreDb = db;
}

// Selectors
const MODAL_SELECTOR       = '#marker-form-modal';
const CLOSE_BTN_SELECTOR   = '.marker-form__close-btn';
const FORM_SELECTOR        = '#marker-form';
const DROPDOWN_SELECTOR    = '#predefined-item-dropdown';
const COLOR_PICKER_SELECTOR  = '.marker-form__color-picker';
const BORDER_PICKER_SELECTOR = '.marker-form__border-picker';

let colorPicker = null;
let borderPicker = null;
let activeMarkerData = null;

// Initialize Modal (opened programmatically)
const markerFormModal = new Modal({
  modalSelector: MODAL_SELECTOR,
  closeBtnSelector: CLOSE_BTN_SELECTOR,
  onOpen: populateForm,
  onClose: cleanupForm
});

const formEl = document.querySelector(FORM_SELECTOR);

/**
 * Populate form fields each time the modal opens.
 */
async function populateForm() {
  // Reset form
  formEl.reset();

  // Populate dropdown if Firestore configured
  if (firestoreDb) {
    const itemDefs = await getItemDefinitions(firestoreDb);
    const dropdown = formEl.querySelector(DROPDOWN_SELECTOR);
    if (dropdown) {
      dropdown.innerHTML = '<option value="">-- Select item --</option>' +
        itemDefs.map(def => `<option value="${def.id}">${def.name}</option>`).join('');
    }
  }

  // Initialize pickers after DOM reset
  initPickers();

  // Pre-fill form when editing
  if (activeMarkerData) {
    fillFormFields(activeMarkerData);
  }
}

/**
 * Cleanup form state and destroy pickers on close.
 */
function cleanupForm() {
  formEl.reset();
  if (colorPicker) { colorPicker.destroyAndRemove(); colorPicker = null; }
  if (borderPicker) { borderPicker.destroyAndRemove(); borderPicker = null; }
  activeMarkerData = null;
}

/**
 * Initialize color and border pickers if containers exist.
 */
function initPickers() {
  const colorEl = formEl.querySelector(COLOR_PICKER_SELECTOR);
  if (colorEl) {
    colorPicker = createColorPicker(COLOR_PICKER_SELECTOR, { defaultColor: '#ffffff' });
  }
  const borderEl = formEl.querySelector(BORDER_PICKER_SELECTOR);
  if (borderEl) {
    borderPicker = createColorPicker(BORDER_PICKER_SELECTOR, { defaultColor: '#000000' });
  }
}

/**
 * Pre-fill form when editing an existing marker.
 */
function fillFormFields(data) {
  activeMarkerData = deepClone(data);
  formEl.querySelector('[name="name"]').value   = data.name;
  formEl.querySelector('[name="type"]').value   = data.type;
  formEl.querySelector('[name="rarity"]').value = data.rarity;
  if (colorPicker)  colorPicker.setColor(data.color);
  if (borderPicker) borderPicker.setColor(data.borderColor);
}

/**
 * Collect form data into a payload for Firestore.
 */
function collectFormData() {
  const formData = new FormData(formEl);
  const payload = {
    name:        formData.get('name'),
    type:        formData.get('type'),
    rarity:      formData.get('rarity'),
    color:       colorPicker?.getColor().toHEXA().toString() || '#ffffff',
    borderColor: borderPicker?.getColor().toHEXA().toString() || '#000000',
    extraInfo:   Array.from(formEl.querySelectorAll('.extra-info__input'))
                   .map(inp => inp.value).filter(v => v.trim()),
    images:      Array.from(formEl.querySelectorAll('.image-url__input'))
                   .map(inp => inp.value).filter(v => v.trim())
  };

  if (activeMarkerData?.id) {
    payload.id = activeMarkerData.id;
  }

  return payload;
}

// Handle form submission for create or update
formEl.addEventListener('submit', async e => {
  e.preventDefault();
  const markerPayload = collectFormData();

  if (markerPayload.id) {
    await updateMarker(markerPayload.id, markerPayload);
  } else {
    await addMarker(markerPayload);
  }

  markerFormModal.close();
});

/**
 * Open the marker form pre-filled with existing data.
 */
export function openMarkerFormWithData(markerData) {
  activeMarkerData = markerData;
  markerFormModal.open();
}

/**
 * Open a blank marker form for creating a new marker.
 */
export function openEmptyMarkerForm() {
  activeMarkerData = null;
  markerFormModal.open();
}

// @version: 0.5.0
