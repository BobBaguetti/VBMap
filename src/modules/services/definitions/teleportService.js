// @file: src/modules/services/definitions/teleportService.js
// @version: 1.0 — Firestore service for teleport definitions

/**
 * Service for teleport definitions in Firestore.
 * Fields include:
 *   - name: string
 *   - devName: string
 *   - description: string
 *   - extraLines: Array<{ label: string, value: string }>
 *   - iconSmallUrl: string
 *   - iconLargeUrl: string
 *   - linkedMarkerDevNames: string[]  // devNames of other teleports to link
 *   - showInFilters: boolean          // whether this teleport appears in sidebar filters
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
 * Get the Firestore collection reference for teleport definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {import('firebase/firestore').CollectionReference}
 */
export function getTeleportDefinitionsCollection(db) {
  return collection(db, "teleportDefinitions");
}

/**
 * Load all teleport definitions from Firestore.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<Array<Object>>}
 */
export async function loadTeleportDefinitions(db) {
  const colRef = getTeleportDefinitionsCollection(db);
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
 * Save or update a teleport definition.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|null} id If null, creates new; otherwise updates existing.
 * @param {Object} payload Teleport definition fields.
 * @returns {Promise<Object>}
 */
export async function saveTeleportDefinition(db, id, payload) {
  const { id: _ignore, ...data } = payload;
  data.showInFilters = payload.showInFilters ?? true;

  if (id) {
    const ref = doc(db, "teleportDefinitions", id);
    await updateDoc(ref, data);
    return { id, ...data };
  } else {
    const ref = await addDoc(getTeleportDefinitionsCollection(db), data);
    return { id: ref.id, ...data };
  }
}

/**
 * Merge-upsert a teleport definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @param {Object} data Fields to merge (including showInFilters)
 * @returns {Promise<Object>}
 */
export async function updateTeleportDefinition(db, id, data) {
  data.showInFilters = data.showInFilters ?? true;
  const ref = doc(db, "teleportDefinitions", id);
  await setDoc(ref, data, { merge: true });
  return { id, ...data };
}

/**
 * Delete a teleport definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @returns {Promise<void>}
 */
export async function deleteTeleportDefinition(db, id) {
  const ref = doc(db, "teleportDefinitions", id);
  await deleteDoc(ref);
}

/**
 * Subscribe to real-time updates on teleport definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @param {function(Array<Object>)} onUpdate
 * @returns {function()} unsubscribe
 */
export function subscribeTeleportDefinitions(db, onUpdate) {
  const colRef = getTeleportDefinitionsCollection(db);
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
      console.error("TeleportDefinitions subscription error:", err);
    }
  );
  return unsubscribe;
}
