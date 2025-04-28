// @file: /scripts/modules/services/chestDefinitionsService.js
// @version: 1.0 
/**
 * Firestore service for chest *definition* documents.
 * Document structure:
 * {
 *   name: string,
 *   iconUrl: string,
 *   subtext?: string,
 *   lootPool: Array<string>,
 *   description?: string,
 *   extraLines?: Array<{ text: string, color?: string }>
 * }
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

export async function loadChestDefinitions(db) {
  const col = getChestDefinitionsCollection(db);
  const snap = await getDocs(col);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** 
 * @param {import('firebase/firestore').Firestore} db 
 * @param {string|null} id 
 * @param {Object} payload 
 */
export async function saveChestDefinition(db, id, payload) {
  const { id: _ignore, ...data } = payload;
  if (id) {
    const ref = doc(db, "chestDefinitions", id);
    await updateDoc(ref, data);
    return { id, ...data };
  } else {
    const ref = await addDoc(getChestDefinitionsCollection(db), data);
    return { id: ref.id, ...data };
  }
}

/** @param {import('firebase/firestore').Firestore} db @param {string} id @param {Object} data */
export async function updateChestDefinition(db, id, data) {
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
 * Subscribe in real-time to all chestDefinitions
 * @param {import('firebase/firestore').Firestore} db
 * @param {(defs:Array<Object>)=>void} onUpdate
 */
export function subscribeChestDefinitions(db, onUpdate) {
  const col = getChestDefinitionsCollection(db);
  return onSnapshot(
    col,
    snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => console.error("subscribeChestDefinitions:", err)
  );
}
