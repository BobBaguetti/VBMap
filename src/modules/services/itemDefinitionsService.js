// @file: src/modules/services/itemDefinitionsService.js
// @version: 2.0 — standardized CRUD API: get, subscribe, create, update, delete

import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";

/** @param {import('firebase/firestore').Firestore} db */
function getCollection(db) {
  return collection(db, "itemDefinitions");
}

/**
 * Load all item definitions.
 * @param {Firestore} db
 * @returns {Promise<Array<Object>>}
 */
export async function getDefinitions(db) {
  const colRef = getCollection(db);
  const snap   = await getDocs(colRef);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      showInFilters: data.showInFilters ?? true
    };
  });
}

/**
 * Subscribe to real-time item definitions updates.
 * @param {Firestore} db
 * @param {function(Array<Object>)} onUpdate
 * @returns {function()} unsubscribe
 */
export function subscribeDefinitions(db, onUpdate) {
  const colRef = getCollection(db);
  const unsubscribe = onSnapshot(
    colRef,
    snap => {
      const defs = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          showInFilters: data.showInFilters ?? true
        };
      });
      onUpdate(defs);
    },
    err => console.error("subscribeDefinitions error:", err)
  );
  return unsubscribe;
}

/**
 * Create a new item definition.
 * @param {Firestore} db
 * @param {Object} data
 * @returns {Promise<Object>} created definition with `id`
 */
export async function createDefinition(db, data) {
  const colRef = getCollection(db);
  const payload = { ...data, showInFilters: data.showInFilters ?? true };
  const docRef  = await addDoc(colRef, payload);
  return { id: docRef.id, ...payload };
}

/**
 * Update an existing item definition.
 * @param {Firestore} db
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Object>} updated definition with `id`
 */
export async function updateDefinition(db, id, data) {
  const payload = { ...data, showInFilters: data.showInFilters ?? true };
  const docRef  = doc(db, "itemDefinitions", id);
  await updateDoc(docRef, payload);
  return { id, ...payload };
}

/**
 * Delete an item definition.
 * @param {Firestore} db
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteDefinition(db, id) {
  const docRef = doc(db, "itemDefinitions", id);
  await deleteDoc(docRef);
}
