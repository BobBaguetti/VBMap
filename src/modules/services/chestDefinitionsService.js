// @file: src/modules/services/chestDefinitionsService.js
// @version: 1.3 — standardized subscription logging

/**
 * Firestore service for chest definition documents.
 * Added `showInFilters` boolean that defaults to true.
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

/** @param {import('firebase/firestore').Firestore} db */
export function getChestDefinitionsCollection(db) {
  return collection(db, "chestDefinitions");
}

/**
 * Load all chest definitions, defaulting `showInFilters` to true if missing.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<Array<Object>>}
 */
export async function loadChestDefinitions(db) {
  const col = getChestDefinitionsCollection(db);
  const snap = await getDocs(col);
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
 * Save or update a chest definition.
 * Persists whatever `showInFilters` is in the payload.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|null} id
 * @param {Object} payload Must include any of the documented fields, including showInFilters.
 */
export async function saveChestDefinition(db, id, payload) {
  const { id: _ignore, ...data } = payload;
  // ensure boolean default
  data.showInFilters = payload.showInFilters ?? true;

  if (id) {
    const ref = doc(db, "chestDefinitions", id);
    await updateDoc(ref, data);
    return { id, ...data };
  } else {
    const ref = await addDoc(getChestDefinitionsCollection(db), data);
    return { id: ref.id, ...data };
  }
}

/**
 * Merge-upsert a chest definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id
 * @param {Object} data Fields to merge (including showInFilters).
 */
export async function updateChestDefinition(db, id, data) {
  // ensure boolean default
  data.showInFilters = data.showInFilters ?? true;
  const ref = doc(db, "chestDefinitions", id);
  await setDoc(ref, data, { merge: true });
  return { id, ...data };
}

/** @param {import('firebase/firestore').Firestore} db @param {string} id */
export async function deleteChestDefinition(db, id) {
  const ref = doc(db, "chestDefinitions", id);
  await deleteDoc(ref);
}

/**
 * Subscribe in real-time to chestDefinitions,
 * mapping `showInFilters` to true if missing.
 * @param {import('firebase/firestore').Firestore} db
 * @param {(defs:Array<Object>)=>void} onUpdate
 * @returns {() => void} unsubscribe
 */
export function subscribeChestDefinitions(db, onUpdate) {
  const col = getChestDefinitionsCollection(db);
  return onSnapshot(
    col,
    snap => {
      const list = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          showInFilters: data.showInFilters ?? true
        };
      });
      onUpdate(list);
    },
    err => console.error("subscribeDefinitions error:", err)
  );
}
