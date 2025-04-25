// @fullfile: Send the entire file, no omissions or abridgments.
// @version: 2
// @file:    /scripts/modules/services/npcDefinitionsService.js

/**
 * Firestore service for NPC definitions.
 * Fields per NPC:
 *   - name: string
 *   - title: string
 *   - description: string
 *   - imageSmall: string
 *   - imageLarge: string
 *   - notes: Array<{ text: string, color: string }>
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

//////////////////////////////
// 🔹 Collection Reference
//////////////////////////////

/**
 * Get the Firestore collection reference for NPC definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {import('firebase/firestore').CollectionReference}
 */
export function getNpcDefinitionsCollection(db) {
  return collection(db, "npcDefinitions");
}

//////////////////////////////
// 🔹 Load NPCs
//////////////////////////////

/**
 * Load all NPC definitions from Firestore.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<Array<Object>>} Array of NPC definition objects
 */
export async function loadNpcDefinitions(db) {
  const colRef = getNpcDefinitionsCollection(db);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

//////////////////////////////
// 🔹 Save or Add New NPC
//////////////////////////////

/**
 * Save an NPC definition (add or update).
 * Returns the saved object with a valid `id`.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|null} id If null, creates a new entry
 * @param {Object} data NPC definition fields
 * @returns {Promise<Object>} The saved NPC (with `id`)
 */
export async function saveNpcDefinition(db, id, data) {
  const colRef = getNpcDefinitionsCollection(db);
  const { id: ignoredId, ...cleanData } = data;

  if (id) {
    const docRef = doc(db, "npcDefinitions", id);
    await updateDoc(docRef, cleanData);
    return { id, ...cleanData };
  } else {
    const docRef = await addDoc(colRef, cleanData);
    return { id: docRef.id, ...cleanData };
  }
}

//////////////////////////////
// 🔹 Forceful Update (Merge)
//////////////////////////////

/**
 * Overwrite or merge an NPC definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @param {Object} data Updated fields
 * @returns {Promise<Object>} The updated NPC (with `id`)
 */
export async function updateNpcDefinition(db, id, data) {
  const payload = { ...data };
  const docRef = doc(db, "npcDefinitions", id);
  await setDoc(docRef, payload, { merge: true });
  return { id, ...payload };
}

//////////////////////////////
// 🔹 Delete NPC
//////////////////////////////

/**
 * Delete an NPC definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @returns {Promise<void>}
 */
export async function deleteNpcDefinition(db, id) {
  const docRef = doc(db, "npcDefinitions", id);
  await deleteDoc(docRef);
}

//////////////////////////////
// 🔹 Real-Time Subscription
//////////////////////////////

/**
 * Subscribe to real-time updates on the NPC definitions collection.
 * @param {import('firebase/firestore').Firestore} db
 * @param {function(Array<Object>)} onUpdate Callback receiving array of NPCs
 * @returns {function()} unsubscribe
 */
export function subscribeNpcDefinitions(db, onUpdate) {
  const colRef = getNpcDefinitionsCollection(db);
  const unsubscribe = onSnapshot(
    colRef,
    snapshot => {
      const results = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      onUpdate(results);
    },
    err => {
      console.error("NpcDefs subscription error:", err);
    }
  );
  return unsubscribe;
}
