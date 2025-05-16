// @file: src/modules/services/definitions/npcService.js
// @version: 1.0 — CRUD + real-time listener for NPC definitions

import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";

/**
 * Collection reference for NPC definitions.
 * @param {import('firebase/firestore').Firestore} db
 */
function getNPCCollection(db) {
  return collection(db, "npcDefinitions");
}

/**
 * Load all NPC definitions, defaulting showInFilters to true.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<Array<Object>>}
 */
export async function loadNPCs(db) {
  const col = getNPCCollection(db);
  const snap = await getDocs(col);
  return snap.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      showInFilters: data.showInFilters ?? true
    };
  });
}

/**
 * Subscribe to real-time updates of NPC definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @param {(defs:Array<Object>)=>void} onUpdate
 * @returns {() => void} unsubscribe function
 */
export function subscribeNPCs(db, onUpdate) {
  const col = getNPCCollection(db);
  return onSnapshot(
    col,
    snap => {
      const list = snap.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          showInFilters: data.showInFilters ?? true
        };
      });
      onUpdate(list);
    },
    err => console.error("subscribeNPCs:", err)
  );
}

/**
 * Create a new NPC definition.
 * @param {import('firebase/firestore').Firestore} db
 * @param {Object} payload
 * @returns {Promise<Object>} saved NPC (with id)
 */
export async function createNPC(db, payload) {
  const data = {
    ...payload,
    showInFilters: payload.showInFilters ?? true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  const ref = await addDoc(getNPCCollection(db), data);
  return { id: ref.id, ...data };
}

/**
 * Update an existing NPC definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>} updated NPC
 */
export async function updateNPC(db, id, updates) {
  const data = {
    ...updates,
    showInFilters: updates.showInFilters ?? true,
    updatedAt: Date.now()
  };
  const ref = doc(db, "npcDefinitions", id);
  await updateDoc(ref, data);
  return { id, ...data };
}

/**
 * Merge (upsert) NPC definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id
 * @param {Object} dataFields
 * @returns {Promise<Object>}
 */
export async function upsertNPC(db, id, dataFields) {
  const data = {
    ...dataFields,
    showInFilters: dataFields.showInFilters ?? true,
    updatedAt: Date.now()
  };
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
export async function deleteNPC(db, id) {
  const ref = doc(db, "npcDefinitions", id);
  await deleteDoc(ref);
}
