// @file: src/modules/services/definitions/spawnpointService.js
// @version: 1.0 — Firestore service for spawn point definitions

/**
 * Service for spawn point definitions in Firestore.
 * Fields include:
 *   - name: string
 *   - devName: string
 *   - description: string
 *   - extraLines: Array<{ label: string, value: string }>
 *   - iconSmallUrl: string
 *   - iconLargeUrl: string
 *   - entryName?: string           // optional display name for the spawn point
 *   - showInFilters: boolean       // whether this appears in sidebar filters
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
 * Get the Firestore collection reference for spawn point definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {import('firebase/firestore').CollectionReference}
 */
export function getSpawnpointDefinitionsCollection(db) {
  return collection(db, "spawnpointDefinitions");
}

/**
 * Load all spawn point definitions from Firestore.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<Array<Object>>}
 */
export async function loadSpawnpointDefinitions(db) {
  const colRef = getSpawnpointDefinitionsCollection(db);
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
 * Save or update a spawn point definition.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|null} id If null, creates new; otherwise updates existing.
 * @param {Object} payload Definition fields.
 * @returns {Promise<Object>}
 */
export async function saveSpawnpointDefinition(db, id, payload) {
  const { id: _ignore, ...data } = payload;
  data.showInFilters = payload.showInFilters ?? true;

  if (id) {
    const ref = doc(db, "spawnpointDefinitions", id);
    await updateDoc(ref, data);
    return { id, ...data };
  } else {
    const ref = await addDoc(getSpawnpointDefinitionsCollection(db), data);
    return { id: ref.id, ...data };
  }
}

/**
 * Merge-upsert a spawn point definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @param {Object} data Fields to merge (including showInFilters)
 * @returns {Promise<Object>}
 */
export async function updateSpawnpointDefinition(db, id, data) {
  data.showInFilters = data.showInFilters ?? true;
  const ref = doc(db, "spawnpointDefinitions", id);
  await setDoc(ref, data, { merge: true });
  return { id, ...data };
}

/**
 * Delete a spawn point definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @returns {Promise<void>}
 */
export async function deleteSpawnpointDefinition(db, id) {
  const ref = doc(db, "spawnpointDefinitions", id);
  await deleteDoc(ref);
}

/**
 * Subscribe to real-time updates on spawn point definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @param {function(Array<Object>)} onUpdate
 * @returns {() => void} unsubscribe
 */
export function subscribeSpawnpointDefinitions(db, onUpdate) {
  const colRef = getSpawnpointDefinitionsCollection(db);
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
      console.error("SpawnpointDefinitions subscription error:", err);
    }
  );
  return unsubscribe;
}
