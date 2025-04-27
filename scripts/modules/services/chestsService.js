// path: scripts/modules/services/chestsService.js
// version: 1.1 – no functional changes, bumped version

/**
 * Firestore service for chest instances.
 * Document structure:
 * {
 *   chestTypeId: string,
 *   coords: [number, number]
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
 * Get the Firestore collection reference for chests.
 * @param {import('firebase/firestore').Firestore} db
 */
export function getChestsCollection(db) {
  return collection(db, "chests");
}

/**
 * Load all chest instances from Firestore.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<Array<Object>>}
 */
export async function loadChests(db) {
  const snapshot = await getDocs(getChestsCollection(db));
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

/**
 * Save a chest instance (add or update).
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|null} id If null, creates a new document
 * @param {Object} data Chest fields
 * @returns {Promise<Object>}
 */
export async function saveChest(db, id, data) {
  const { id: _ignored, ...payload } = data;
  if (id) {
    const docRef = doc(db, "chests", id);
    await updateDoc(docRef, payload);
    return { id, ...payload };
  } else {
    const docRef = await addDoc(getChestsCollection(db), payload);
    return { id: docRef.id, ...payload };
  }
}

/**
 * Update (merge) a chest instance by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function updateChest(db, id, data) {
  const payload = { ...data };
  const docRef = doc(db, "chests", id);
  await setDoc(docRef, payload, { merge: true });
  return { id, ...payload };
}

/**
 * Delete a chest instance by ID.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} id
 */
export async function deleteChest(db, id) {
  const docRef = doc(db, "chests", id);
  await deleteDoc(docRef);
}

/**
 * Subscribe to real-time updates of chest instances.
 * @param {import('firebase/firestore').Firestore} db
 * @param {function(Array<Object>)} onUpdate
 * @returns {function():void} Unsubscribe function
 */
export function subscribeChests(db, onUpdate) {
  const unsubscribe = onSnapshot(
    getChestsCollection(db),
    snapshot => {
      const chests = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      onUpdate(chests);
    },
    err => console.error("Chests subscription error:", err)
  );
  return unsubscribe;
}
