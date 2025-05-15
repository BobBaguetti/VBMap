// @file: src/modules/services/definitions/questService.js
// @version: 1.0 — Firestore service for quest definitions

/**
 * Service for quest definitions in Firestore.
 * Fields include:
 *   - name: string
 *   - devName: string
 *   - description: string
 *   - extraLines: Array<{ label: string, value: string }>
 *   - iconSmallUrl: string
 *   - iconLargeUrl: string
 *   - objectiveType: string
 *   - relatedItemDevNames: string[]
 *   - vendorDevName?: string
 *   - showInFilters: boolean   // whether this quest appears in the sidebar filters
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
 * Get the Firestore collection reference for quest definitions.
 * @param {import('firebase/firestore').Firestore} db
 */
export function getQuestDefinitionsCollection(db) {
  return collection(db, "questDefinitions");
}

/**
 * Load all quest definitions from Firestore.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<Array<Object>>}
 */
export async function loadQuestDefinitions(db) {
  const colRef = getQuestDefinitionsCollection(db);
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
 * Save or update a quest definition.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|null} id If null, creates new; otherwise updates existing.
 * @param {Object} payload Quest definition fields.
 * @returns {Promise<Object>}
 */
export async function saveQuestDefinition(db, id, payload) {
  const { id: _ignore, ...data } = payload;
  data.showInFilters = payload.showInFilters ?? true;

  if (id) {
    const ref = doc(db, "questDefinitions", id);
    await updateDoc(ref, data);
    return { id, ...data };
  } else {
    const ref = await addDoc(getQuestDefinitionsCollection(db), data);
    return { id: ref.id, ...data };
  }
}

/**
 * Merge-upsert a quest definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @param {Object} data Fields to merge (including showInFilters)
 * @returns {Promise<Object>}
 */
export async function updateQuestDefinition(db, id, data) {
  data.showInFilters = data.showInFilters ?? true;
  const ref = doc(db, "questDefinitions", id);
  await setDoc(ref, data, { merge: true });
  return { id, ...data };
}

/**
 * Delete a quest definition by ID.
 * @param {import('firebase/firestore').Firestore'} db
 * @param {string} id Document ID
 * @returns {Promise<void>}
 */
export async function deleteQuestDefinition(db, id) {
  const ref = doc(db, "questDefinitions", id);
  await deleteDoc(ref);
}

/**
 * Subscribe to real-time updates on quest definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @param {function(Array<Object>)} onUpdate
 * @returns {function()} unsubscribe
 */
export function subscribeQuestDefinitions(db, onUpdate) {
  const colRef = getQuestDefinitionsCollection(db);
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
      console.error("QuestDefinitions subscription error:", err);
    }
  );
  return unsubscribe;
}
