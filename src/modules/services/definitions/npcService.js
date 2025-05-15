// @file: src/modules/services/definitions/npcService.js
// @version: 1.0 — Firestore service for NPC definitions

/**
 * Service for NPC definitions in Firestore.
 * Fields include:
 *   - name: string
 *   - devName: string
 *   - description: string
 *   - extraLines: Array<{ label: string, value: string }>
 *   - iconSmallUrl: string
 *   - iconLargeUrl: string
 *   - isHostile: boolean
 *   - health: number
 *   - damage: number
 *   - faction?: string
 *   - vendorDevName?: string
 *   - showInFilters: boolean           // whether this NPC appears in the sidebar filters
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
 * Get the Firestore collection reference for NPC definitions.
 * @param {import('firebase/firestore').Firestore} db
 */
export function getNpcDefinitionsCollection(db) {
  return collection(db, "npcDefinitions");
}

/**
 * Load all NPC definitions from Firestore.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<Array<Object>>}
 */
export async function loadNpcDefinitions(db) {
  const colRef = getNpcDefinitionsCollection(db);
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
 * Save or update an NPC definition.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|null} id If null, creates a new entry; otherwise updates existing.
 * @param {Object} payload NPC definition fields.
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
 * @param {string} id Document ID
 * @param {Object} data Fields to merge (including showInFilters)
 * @returns {Promise<Object>}
 */
export async function updateNpcDefinition(db, id, data) {
  data.showInFilters = data.showInFilters ?? true;
  const ref = doc(db, "npcDefinitions", id);
  await setDoc(ref, data, { merge: true });
  return { id, ...data };
}

/**
 * Delete an NPC definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @returns {Promise<void>}
 */
export async function deleteNpcDefinition(db, id) {
  const ref = doc(db, "npcDefinitions", id);
  await deleteDoc(ref);
}

/**
 * Subscribe to real-time updates on NPC definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @param {function(Array<Object>)} onUpdate
 * @returns {function()} unsubscribe
 */
export function subscribeNpcDefinitions(db, onUpdate) {
  const colRef = getNpcDefinitionsCollection(db);
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
      console.error("NPCDefinitions subscription error:", err);
    }
  );
  return unsubscribe;
}
