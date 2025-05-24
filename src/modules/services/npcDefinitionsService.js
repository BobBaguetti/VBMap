// @file: src/modules/services/npcDefinitionsService.js
// @version: 1.0 — NPC definitions service

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
export function getNpcDefinitionsCollection(db) {
  return collection(db, "npcDefinitions");
}

/**
 * Load all NPC definitions, defaulting `showInFilters` to true if missing.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<Array<Object>>}
 */
export async function loadNpcDefinitions(db) {
  const col = getNpcDefinitionsCollection(db);
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
 * Save or update an NPC definition.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|null} id
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export async function saveNpcDefinition(db, id, payload) {
  const { id: _ignore, ...data } = payload;
  data.showInFilters = payload.showInFilters ?? true;
  if (id) {
    const ref = doc(db, "npcDefinitions", id);
    await updateDoc(ref, data);
    return { id, ...data };
  } else {
    const ref = await addDoc(getNpcDefinitionsCollection(db), data);
    return { id: ref.id, ...data };
  }
}

/**
 * Merge-upsert an NPC definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function updateNpcDefinition(db, id, data) {
  data.showInFilters = data.showInFilters ?? true;
  const ref = doc(db, "npcDefinitions", id);
  await setDoc(ref, data, { merge: true });
  return { id, ...data };
}

/**
 * Delete an NPC definition.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteNpcDefinition(db, id) {
  const ref = doc(db, "npcDefinitions", id);
  await deleteDoc(ref);
}

/**
 * Subscribe to real-time NPC definition updates.
 * @param {import('firebase/firestore').Firestore} db
 * @param {function(Array<Object>)} onUpdate
 * @returns {function()} unsubscribe
 */
export function subscribeNpcDefinitions(db, onUpdate) {
  const col = getNpcDefinitionsCollection(db);
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
