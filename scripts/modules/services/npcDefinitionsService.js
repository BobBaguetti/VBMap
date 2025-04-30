// @file: /scripts/modules/services/npcDefinitionsService.js
// @version: 1.0 — CRUD + real-time for NPC definitions

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
 * Load all NPC definitions.
 * @param {Firestore} db
 * @returns {Promise<Array<Object>>}
 */
export async function loadNpcDefinitions(db) {
  const snap = await getDocs(collection(db, "npcDefinitions"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Real-time subscription to every document in 'npcDefinitions'.
 * Calls onUpdate(arrayOfDefs) on any change.
 */
export function subscribeNpcDefinitions(db, onUpdate) {
  return onSnapshot(
    collection(db, "npcDefinitions"),
    snapshot => {
      const defs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(defs);
    },
    err => console.error("NPC definitions subscription error:", err)
  );
}

/**
 * Add a new NPC definition.
 * @param {Firestore} db
 * @param {Object} def
 * @returns {Promise<Object>}
 */
export async function addNpcDefinition(db, def) {
  const docRef = await addDoc(collection(db, "npcDefinitions"), def);
  return { id: docRef.id, ...def };
}

/**
 * Update (merge) only defined fields of an existing NPC definition.
 * @param {Firestore} db
 * @param {Object} def  Must include an `id` property
 * @returns {Promise<void>}
 */
export async function updateNpcDefinition(db, def) {
  const { id, ...raw } = def;
  const data = Object.entries(raw).reduce((acc, [k, v]) => {
    if (v !== undefined) acc[k] = v;
    return acc;
  }, {});
  await setDoc(doc(db, "npcDefinitions", id), data, { merge: true });
}

/**
 * Delete an NPC definition by ID.
 * @param {Firestore} db
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteNpcDefinition(db, id) {
  await deleteDoc(doc(db, "npcDefinitions", id));
}
