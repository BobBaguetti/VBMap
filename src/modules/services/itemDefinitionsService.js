// @file: src/modules/services/itemDefinitionsService.js
// @version: 12 — removed showInFilters logic

import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";

/**
 * Helper: get the Firestore collection for definitions.
 * @param {import('firebase/firestore').Firestore} db
 */
function getDefinitionsCollection(db) {
  return collection(db, "itemDefinitions");
}

/**
 * Load all item definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<Array<Object>>}
 */
export async function getDefinitions(db) {
  const colRef = getDefinitionsCollection(db);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

/**
 * Subscribe to real-time updates on item definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @param {(defs: Array<Object>) => void} onUpdate
 * @returns {() => void} unsubscribe
 */
export function subscribeDefinitions(db, onUpdate) {
  const colRef = getDefinitionsCollection(db);
  const unsubscribe = onSnapshot(
    colRef,
    snapshot => {
      const defs = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      onUpdate(defs);
    },
    err => {
      console.error("ItemDefinitions subscription error:", err);
    }
  );
  return unsubscribe;
}

/**
 * Create a new item definition.
 * @param {import('firebase/firestore').Firestore} db
 * @param {Object} payload  — fields for the new definition
 * @returns {Promise<Object>} the created definition with `id`
 */
export async function createDefinition(db, payload) {
  const colRef = getDefinitionsCollection(db);
  const docRef = await addDoc(colRef, payload);
  return { id: docRef.id, ...payload };
}

/**
 * Update an existing item definition.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id       — document ID
 * @param {Object} payload  — updated fields
 * @returns {Promise<Object>} the updated definition with `id`
 */
export async function updateDefinition(db, id, payload) {
  const docRef = doc(db, "itemDefinitions", id);
  await setDoc(docRef, payload, { merge: true });
  return { id, ...payload };
}

/**
 * Delete an item definition.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id  — document ID
 * @returns {Promise<void>}
 */
export async function deleteDefinition(db, id) {
  const docRef = doc(db, "itemDefinitions", id);
  await deleteDoc(docRef);
}
