// @version: 10
// @file:    /scripts/modules/services/itemDefinitionsService.js

/**
 * Firestore service for item definitions.
 * Fields include:
 *   - name: string
 *   - itemType: string
 *   - rarity: string
 *   - description: string
 *   - extraLines: Array<{ text: string, color: string }>
 *   - imageSmall: string
 *   - imageBig: string
 *   - value: string           // sell price
 *   - quantity: string
 *   - showInFilters: boolean  // whether this item appears in the sidebar filters
 *   - (All fields may also have corresponding color fields)
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
 * Get the Firestore collection reference for item definitions.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {import('firebase/firestore').CollectionReference}
 */
export function getItemDefinitionsCollection(db) {
  return collection(db, "itemDefinitions");
}

//////////////////////////////
// 🔹 Load Items
//////////////////////////////

/**
 * Load all item definitions from Firestore.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<Array<Object>>} Array of item definition objects
 */
export async function loadItemDefinitions(db) {
  const colRef = getItemDefinitionsCollection(db);
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

//////////////////////////////
// 🔹 Save or Add New Item
//////////////////////////////

/**
 * Save an item definition (add or update).
 * Returns the saved object with a valid `id`.
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|null} id If null, creates a new entry
 * @param {Object} data Item definition fields
 * @returns {Promise<Object>} The saved item (with `id`)
 */
export async function saveItemDefinition(db, id, data) {
  const colRef = getItemDefinitionsCollection(db);
  const { id: ignoredId, ...cleanData } = data;
  cleanData.showInFilters = data.showInFilters ?? true;

  if (id) {
    const docRef = doc(db, "itemDefinitions", id);
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
 * Overwrite or merge an item definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @param {Object} data Updated fields
 * @returns {Promise<Object>} The updated item (with `id`)
 */
export async function updateItemDefinition(db, id, data) {
  const payload = { ...data, showInFilters: data.showInFilters ?? true };
  const docRef = doc(db, "itemDefinitions", id);
  await setDoc(docRef, payload, { merge: true });
  return { id, ...payload };
}

//////////////////////////////
// 🔹 Delete Item
//////////////////////////////

/**
 * Delete an item definition by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id Document ID
 * @returns {Promise<void>}
 */
export async function deleteItemDefinition(db, id) {
  const docRef = doc(db, "itemDefinitions", id);
  await deleteDoc(docRef);
}

//////////////////////////////
// 🔹 Real-Time Subscription
//////////////////////////////

/**
 * Subscribe to real-time updates on the item definitions collection.
 * @param {import('firebase/firestore').Firestore} db
 * @param {function(Array<Object>)} onUpdate Callback receiving array of items
 * @returns {function()} unsubscribe
 */
export function subscribeItemDefinitions(db, onUpdate) {
  const colRef = getItemDefinitionsCollection(db);
  const unsubscribe = onSnapshot(
    colRef,
    snapshot => {
      const defs = snapshot.docs
        .map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            showInFilters: data.showInFilters ?? true
          };
        })
        .filter(def => !!def.id);
      onUpdate(defs);
    },
    err => {
      console.error("ItemDefinitions subscription error:", err);
    }
  );
  return unsubscribe;
}
