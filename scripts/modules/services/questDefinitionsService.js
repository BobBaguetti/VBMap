// @fullfile: Send the entire file, no omissions or abridgments.
// @version: 3
// @file:    /scripts/modules/services/questDefinitionsService.js 

/**
 * Firestore service for quest definitions.
 * Fields per quest:
 *   - title: string
 *   - description: string
 *   - objectives: Array<{ text: string, color: string }>
 *   - rewardValue: string
 *   - rewardQuantity: string
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
 * Get the Firestore collection reference for quest definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {import('firebase/firestore').CollectionReference}
 */
export function getQuestDefinitionsCollection(db) {
  return collection(db, "questDefinitions");
}

//////////////////////////////
// 🔹 Load Quests
//////////////////////////////

/**
 * Load all quest definitions from Firestore.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<Array<Object>>} Array of quest definition objects
 */
export async function loadQuestDefinitions(db) {
  const colRef = getQuestDefinitionsCollection(db);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

//////////////////////////////
// 🔹 Save or Add New Quest
//////////////////////////////

/**
 * Save a quest definition (add or update).
 * Returns the saved object with a valid `id`.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|null} id If null, creates a new entry
 * @param {Object} data Quest definition fields
 * @returns {Promise<Object>} The saved quest (with `id`)
 */
export async function saveQuestDefinition(db, id, data) {
  const colRef = getQuestDefinitionsCollection(db);
  const { id: ignoredId, ...cleanData } = data;

  if (id) {
    const docRef = doc(db, "questDefinitions", id);
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
 * Overwrite or merge a quest definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @param {Object} data Updated fields
 * @returns {Promise<Object>} The updated quest (with `id`)
 */
export async function updateQuestDefinition(db, id, data) {
  const payload = { ...data };
  const docRef = doc(db, "questDefinitions", id);
  await setDoc(docRef, payload, { merge: true });
  return { id, ...payload };
}

//////////////////////////////
// 🔹 Delete Quest
//////////////////////////////

/**
 * Delete a quest definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @returns {Promise<void>}
 */
export async function deleteQuestDefinition(db, id) {
  const docRef = doc(db, "questDefinitions", id);
  await deleteDoc(docRef);
}

//////////////////////////////
// 🔹 Real-Time Subscription
//////////////////////////////

/**
 * Subscribe to real-time updates on the quest definitions collection.
 * @param {import('firebase/firestore').Firestore} db
 * @param {function(Array<Object>)} onUpdate Callback receiving array of quests
 * @returns {function()} unsubscribe
 */
export function subscribeQuestDefinitions(db, onUpdate) {
  const colRef = getQuestDefinitionsCollection(db);
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
      console.error("QuestDefs subscription error:", err);
    }
  );
  return unsubscribe;
}
