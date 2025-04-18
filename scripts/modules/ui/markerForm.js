// @fullfile: Send the entire file, no omissions or abridgments — version is 0.3.0. Increase by 0.1.0 on significant API additions.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 0.3.0
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

let colorPicker, borderPicker;
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
 * Populate form fields and dropdown each time modal opens
 */
async function populateForm() {
  // Fetch item definitions using stored Firestore instance
  const itemDefs = await getItemDefinitions(firestoreDb);
  // Only populate if the dropdown exists in the current form
  const dropdown = formEl.querySelector('#predefined-item-dropdown');
  if (dropdown) {
    dropdown.innerHTML = '<option value="">-- Select item --</option>' +
      itemDefs.map(def => `<option value="${def.id}">${def.name}</option>`).join('');
  }

  formEl.reset();
  initPickers();

  if (activeMarkerData) {
    fillFormFields(activeMarkerData);
  }
}

/**
 * Cleanup form state and destroy pickers on close
 */
function cleanupForm() {
  formEl.reset();
  colorPicker?.destroyAndRemove();
  borderPicker?.destroyAndRemove();
  activeMarkerData = null;
}

/**
 * Initialize color and border pickers
 */
function initPickers() {
  colorPicker = createColorPicker('.marker-form__color-picker', { defaultColor: '#ffffff' });
  borderPicker = createColorPicker('.marker-form__border-picker', { defaultColor: '#000000' });
}

/**
 * Pre-fill form when editing an existing marker
 */
function fillFormFields(data) {
  activeMarkerData = deepClone(data);
  formEl.querySelector('[name="name"]').value = data.name;
  formEl.querySelector('[name="type"]').value = data.type;
  formEl.querySelector('[name="rarity"]').value = data.rarity;
  colorPicker.setColor(data.color);
  borderPicker.setColor(data.borderColor);
}

/**
 * Collect form data into a payload for Firestore
 */
function collectFormData() {
  const formData = new FormData(formEl);
  const payload = {
    name:        formData.get('name'),
    type:        formData.get('type'),
    rarity:      formData.get('rarity'),
    color:       colorPicker.getColor().toHEXA().toString(),
    borderColor: borderPicker.getColor().toHEXA().toString(),
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
 * Open the marker form pre-filled with existing data
 */
export function openMarkerFormWithData(markerData) {
  activeMarkerData = markerData;
  markerFormModal.open();
}

/**
 * Open a blank marker form for creating a new marker
 */
export function openEmptyMarkerForm() {
  activeMarkerData = null;
  markerFormModal.open();
}

// @version: 0.3.0
