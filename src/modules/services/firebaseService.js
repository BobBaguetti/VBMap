// @file: /src/modules/services/firebaseService.js
// @version: 6.2 – removed debug logging

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
 * Add a new marker with a random ID.
 * (We’re keeping this for backwards compatibility, but you
 * should now use upsertMarker for creation to avoid dupes.)
 */
export async function addMarker(db, markerData) {
  const docRef = await addDoc(collection(db, "markers"), markerData);
  return { id: docRef.id, ...markerData };
}

/**
 * Create or overwrite a marker doc with a deterministic ID based on coords.
 * This prevents duplicates at the same latitude/longitude.
 */
export async function upsertMarker(db, markerData) {
  const [lat, lng] = markerData.coords;
  const id = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
  await setDoc(doc(db, "markers", id), markerData);
  return { id, ...markerData };
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
