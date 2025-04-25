// @version: 5.8
// @file: /scripts/modules/services/firebaseService.js

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc
} from "firebase/firestore";

/**
 * Initialize Firebase (if needed) and return the Firestore instance.
 * @param {Object} config Your Firebase config object.
 * @returns {import('firebase/firestore').Firestore}
 */
export function initializeFirebase(config) {
  // Initialize the Firebase App
  const app = initializeApp(config);
  // Return the Firestore database instance
  return getFirestore(app);
}

/**
 * Load all markers from the 'markers' collection.
 * @param {import('firebase/firestore').Firestore} db Firestore instance.
 * @returns {Promise<Array<Object>>} Array of marker objects (each includes its `id`).
 */
export async function loadMarkers(db) {
  const colRef = collection(db, "markers");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

/**
 * Add a new marker to Firestore.
 * @param {import('firebase/firestore').Firestore} db Firestore instance.
 * @param {Object} markerData The marker data to add.
 * @returns {Promise<Object>} The saved marker data (with generated `id`).
 */
export async function addMarker(db, markerData) {
  const colRef = collection(db, "markers");
  const docRef = await addDoc(colRef, markerData);
  return { id: docRef.id, ...markerData };
}

/**
 * Update an existing marker in Firestore.
 * This will merge only the defined fields of the provided marker object.
 * @param {import('firebase/firestore').Firestore} db Firestore instance.
 * @param {Object} markerData The full marker object, including its `id`.
 *                            Only keys with non‐undefined values will be sent.
 * @returns {Promise<void>}
 */
export async function updateMarker(db, markerData) {
  const { id, ...raw } = markerData;
  const docRef = doc(db, "markers", id);

  // Build a new object excluding any undefined values
  const data = Object.entries(raw).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

  // Merge in only the defined fields
  await setDoc(docRef, data, { merge: true });
}

/**
 * Delete a marker from Firestore by ID.
 * @param {import('firebase/firestore').Firestore} db Firestore instance.
 * @param {string} id The document ID of the marker to delete.
 * @returns {Promise<void>}
 */
export async function deleteMarker(db, id) {
  const docRef = doc(db, "markers", id);
  await deleteDoc(docRef);
}
