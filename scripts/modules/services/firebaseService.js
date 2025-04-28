// @file: /scripts/modules/services/firebaseService.js
// @version: 5.9 – add real-time subscribeMarkers

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";

/**
 * Initialize Firebase (if needed) and return the Firestore instance.
 */
export function initializeFirebase(config) {
  const app = initializeApp(config);
  return getFirestore(app);
}

/**
 * Load all markers from the 'markers' collection.
 */
export async function loadMarkers(db) {
  const snapshot = await getDocs(collection(db, "markers"));
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

/**
 * Real-time subscription to every document in 'markers'.
 * Calls onUpdate(arrayOfMarkers) on any change.
 */
export function subscribeMarkers(db, onUpdate) {
  return onSnapshot(
    collection(db, "markers"),
    snapshot => {
      const markers = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      onUpdate(markers);
    },
    err => console.error("Markers subscription error:", err)
  );
}

/**
 * Add a new marker.
 */
export async function addMarker(db, markerData) {
  const docRef = await addDoc(collection(db, "markers"), markerData);
  return { id: docRef.id, ...markerData };
}

/**
 * Update (merge) only defined fields of an existing marker. 
 */
export async function updateMarker(db, markerData) {
  const { id, ...raw } = markerData;
  const data = Object.entries(raw).reduce((acc, [k, v]) => {
    if (v !== undefined) acc[k] = v;
    return acc;
  }, {});
  await setDoc(doc(db, "markers", id), data, { merge: true });
}

/**
 * Delete a marker by ID.
 */
export async function deleteMarker(db, id) {
  await deleteDoc(doc(db, "markers", id));
}
