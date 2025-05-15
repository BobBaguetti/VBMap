// @file: src/modules/services/definitions/doorsService.js
// @version: 1.0 — Firestore service for door definitions

/**
 * Service for door definitions in Firestore.
 * Fields include:
 *   - name: string
 *   - devName: string
 *   - description: string
 *   - extraLines: Array<{ label: string, value: string }>
 *   - iconSmallUrl: string
 *   - iconLargeUrl: string
 *   - lockType: string            // e.g. "key" | "code" | "none"
 *   - requiredKeyDevName?: string // if lockType === "key"
 *   - showInFilters: boolean      // whether this door appears in sidebar filters
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
 * Get the Firestore collection reference for door definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {import('firebase/firestore').CollectionReference}
 */
export function getDoorsDefinitionsCollection(db) {
  return collection(db, "doorsDefinitions");
}

/**
 * Load all door definitions from Firestore.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<Array<Object>>}
 */
export async function loadDoorsDefinitions(db) {
  const colRef = getDoorsDefinitionsCollection(db);
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
 * Save or update a door definition.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|null} id If null, creates new; otherwise updates existing.
 * @param {Object} payload Door definition fields.
 * @returns {Promise<Object>}
 */
export async function saveDoorDefinition(db, id, payload) {
  const { id: _ignore, ...data } = payload;
  data.showInFilters = payload.showInFilters ?? true;

  if (id) {
    const ref = doc(db, "doorsDefinitions", id);
    await updateDoc(ref, data);
    return { id, ...data };
  } else {
    const ref = await addDoc(getDoorsDefinitionsCollection(db), data);
    return { id: ref.id, ...data };
  }
}

/**
 * Merge-upsert a door definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @param {Object} data Fields to merge (including showInFilters)
 * @returns {Promise<Object>}
 */
export async function updateDoorDefinition(db, id, data) {
  data.showInFilters = data.showInFilters ?? true;
  const ref = doc(db, "doorsDefinitions", id);
  await setDoc(ref, data, { merge: true });
  return { id, ...data };
}

/**
 * Delete a door definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @returns {Promise<void>}
 */
export async function deleteDoorDefinition(db, id) {
  const ref = doc(db, "doorsDefinitions", id);
  await deleteDoc(ref);
}

/**
 * Subscribe to real-time updates on door definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @param {function(Array<Object>)} onUpdate
 * @returns {() => void} unsubscribe
 */
export function subscribeDoorDefinitions(db, onUpdate) {
  const colRef = getDoorsDefinitionsCollection(db);
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
      console.error("DoorsDefinitions subscription error:", err);
    }
  );
  return unsubscribe;
}
