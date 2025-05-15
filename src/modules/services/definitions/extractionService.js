// @file: src/modules/services/definitions/extractionService.js
// @version: 1.0 — Firestore service for extraction portal definitions

/**
 * Service for extraction portal definitions in Firestore.
 * Fields include:
 *   - name: string
 *   - devName: string
 *   - description: string
 *   - extraLines: Array<{ label: string, value: string }>
 *   - iconSmallUrl: string
 *   - iconLargeUrl: string
 *   - showInFilters: boolean       // whether this portal appears in sidebar filters
 *   - createdAt: timestamp
 *   - updatedAt: timestamp
 */

import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";

/**
 * Get the Firestore collection reference for extraction portal definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {import('firebase/firestore').CollectionReference}
 */
export function getExtractionDefinitionsCollection(db) {
  return collection(db, "extractionDefinitions");
}

/**
 * Load all extraction portal definitions from Firestore.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<Array<Object>>}
 */
export async function loadExtractionDefinitions(db) {
  const colRef = getExtractionDefinitionsCollection(db);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      showInFilters: data.showInFilters ?? true
    };
  });
}

/**
 * Save or update an extraction portal definition.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|null} id If null, creates new; otherwise updates existing.
 * @param {Object} payload Definition fields.
 * @returns {Promise<Object>}
 */
export async function saveExtractionDefinition(db, id, payload) {
  const { id: _ignore, ...data } = payload;
  data.showInFilters = payload.showInFilters ?? true;

  if (id) {
    const ref = doc(db, "extractionDefinitions", id);
    await updateDoc(ref, data);
    return { id, ...data };
  } else {
    const ref = await addDoc(getExtractionDefinitionsCollection(db), data);
    return { id: ref.id, ...data };
  }
}

/**
 * Merge-upsert an extraction portal definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @param {Object} data Fields to merge (including showInFilters)
 * @returns {Promise<Object>}
 */
export async function updateExtractionDefinition(db, id, data) {
  data.showInFilters = data.showInFilters ?? true;
  const ref = doc(db, "extractionDefinitions", id);
  await setDoc(ref, data, { merge: true });
  return { id, ...data };
}

/**
 * Delete an extraction portal definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @returns {Promise<void>}
 */
export async function deleteExtractionDefinition(db, id) {
  const ref = doc(db, "extractionDefinitions", id);
  await deleteDoc(ref);
}

/**
 * Subscribe to real-time updates on extraction portal definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @param {function(Array<Object>)} onUpdate
 * @returns {() => void} unsubscribe
 */
export function subscribeExtractionDefinitions(db, onUpdate) {
  const colRef = getExtractionDefinitionsCollection(db);
  const unsubscribe = onSnapshot(
    colRef,
    snapshot => {
      const defs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          showInFilters: data.showInFilters ?? true
        };
      });
      onUpdate(defs);
    },
    err => {
      console.error("ExtractionDefinitions subscription error:", err);
    }
  );
  return unsubscribe;
}
