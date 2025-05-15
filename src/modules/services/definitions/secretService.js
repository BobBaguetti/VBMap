// @file: src/modules/services/definitions/secretService.js
// @version: 1.0 — Firestore service for secret definitions

/**
 * Service for secret definitions in Firestore.
 * Use this for hidden locations like lore journals, Easter eggs, etc.
 * Fields include:
 *   - name: string
 *   - devName: string
 *   - description: string
 *   - extraLines: Array<{ label: string, value: string }>
 *   - iconSmallUrl: string
 *   - iconLargeUrl: string
 *   - showInFilters: boolean    // whether this appears in sidebar filters
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
 * Get the Firestore collection reference for secret definitions.
 * @param {import('firebase/firestore').Firestore} db
 */
export function getSecretDefinitionsCollection(db) {
  return collection(db, "secretDefinitions");
}

/**
 * Load all secret definitions from Firestore.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<Array<Object>>}
 */
export async function loadSecrets(db) {
  const col = getSecretDefinitionsCollection(db);
  const snap = await getDocs(col);
  return snap.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, showInFilters: data.showInFilters ?? true };
  });
}

/**
 * Save or update a secret definition.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|null} id If null, creates new; otherwise updates existing.
 * @param {Object} payload Definition fields.
 * @returns {Promise<Object>}
 */
export async function saveSecret(db, id, payload) {
  const { id: _ignore, ...data } = payload;
  data.showInFilters = payload.showInFilters ?? true;

  if (id) {
    const ref = doc(db, "secretDefinitions", id);
    await updateDoc(ref, data);
    return { id, ...data };
  } else {
    const ref = await addDoc(getSecretDefinitionsCollection(db), data);
    return { id: ref.id, ...data };
  }
}

/**
 * Merge-upsert a secret definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @param {Object} data Fields to merge (including showInFilters)
 * @returns {Promise<Object>}
 */
export async function updateSecret(db, id, data) {
  data.showInFilters = data.showInFilters ?? true;
  const ref = doc(db, "secretDefinitions", id);
  await setDoc(ref, data, { merge: true });
  return { id, ...data };
}

/**
 * Delete a secret definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @returns {Promise<void>}
 */
export async function deleteSecret(db, id) {
  const ref = doc(db, "secretDefinitions", id);
  await deleteDoc(ref);
}

/**
 * Subscribe to real-time updates on secret definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @param {function(Array<Object>)} onUpdate
 * @returns {() => void} unsubscribe
 */
export function subscribeSecrets(db, onUpdate) {
  const col = getSecretDefinitionsCollection(db);
  const unsubscribe = onSnapshot(
    col,
    snap => {
      const defs = snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, showInFilters: data.showInFilters ?? true };
      });
      onUpdate(defs);
    },
    err => console.error("Secret subscription error:", err)
  );
  return unsubscribe;
}
