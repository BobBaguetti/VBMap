// path: scripts/modules/services/chestTypesService.js
// version: 1.0

/**
 * Firestore service for chest type definitions.
 * Document structure:
 * {
 *   name: string,
 *   iconUrl: string,
 *   lootPool: Array<string>,
 *   maxDisplay: number
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
  
  /**
   * Get the Firestore collection reference for chest types.
   * @param {import('firebase/firestore').Firestore} db
   */
  export function getChestTypesCollection(db) {
    return collection(db, "chestTypes");
  }
  
  /**
   * Load all chest types from Firestore.
   * @param {import('firebase/firestore').Firestore} db
   * @returns {Promise<Array<Object>>}
   */
  export async function loadChestTypes(db) {
    const colRef = getChestTypesCollection(db);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  }
  
  /**
   * Save a chest type (add or update).
   * @param {import('firebase/firestore').Firestore} db
   * @param {string|null} id If null, creates a new document
   * @param {Object} data Chest type fields
   * @returns {Promise<Object>}
   */
  export async function saveChestType(db, id, data) {
    const { id: _ignored, ...payload } = data;
    if (id) {
      const docRef = doc(db, "chestTypes", id);
      await updateDoc(docRef, payload);
      return { id, ...payload };
    } else {
      const docRef = await addDoc(getChestTypesCollection(db), payload);
      return { id: docRef.id, ...payload };
    }
  }
  
  /**
   * Update (merge) a chest type by ID.
   * @param {import('firebase/firestore').Firestore} db
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  export async function updateChestType(db, id, data) {
    const payload = { ...data };
    const docRef = doc(db, "chestTypes", id);
    await setDoc(docRef, payload, { merge: true });
    return { id, ...payload };
  }
  
  /**
   * Delete a chest type by ID.
   * @param {import('firebase/firestore').Firestore} db
   * @param {string} id
   */
  export async function deleteChestType(db, id) {
    const docRef = doc(db, "chestTypes", id);
    await deleteDoc(docRef);
  }
  
  /**
   * Subscribe to real-time updates of chest types.
   * @param {import('firebase/firestore').Firestore} db
   * @param {function(Array<Object>)} onUpdate
   * @returns {function():void} Unsubscribe function
   */
  export function subscribeChestTypes(db, onUpdate) {
    const colRef = getChestTypesCollection(db);
    const unsubscribe = onSnapshot(
      colRef,
      snapshot => {
        const types = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        onUpdate(types);
      },
      err => console.error("ChestTypes subscription error:", err)
    );
    return unsubscribe;
  }
  