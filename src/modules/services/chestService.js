// @file: src/modules/definition/services/chestService.js
// @version: 1.0 — standardized CRUD/subscription API

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

/** @returns Firestore collection reference for chest definitions */
function getCollection(db) {
  return collection(db, "chestDefinitions");
}

/** Load all chest definitions */
export async function getDefinitions(db) {
  const snapshot = await getDocs(getCollection(db));
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      showInFilters: data.showInFilters ?? true
    };
  });
}

/** Subscribe to real-time updates */
export function subscribeDefinitions(db, onUpdate) {
  const unsubscribe = onSnapshot(
    getCollection(db),
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
      console.error("ChestDefinitions subscription error:", err);
    }
  );
  return unsubscribe;
}

/** Create a new chest definition */
export async function createDefinition(db, data) {
  const { id, ...cleanData } = data;
  cleanData.showInFilters = data.showInFilters ?? true;
  const docRef = await addDoc(getCollection(db), cleanData);
  return { id: docRef.id, ...cleanData };
}

/** Update an existing chest definition */
export async function updateDefinition(db, id, data) {
  const { showInFilters = true, ...rest } = data;
  const payload = { ...rest, showInFilters };
  const docRef = doc(db, "chestDefinitions", id);
  await setDoc(docRef, payload, { merge: true });
  return { id, ...payload };
}

/** Delete a chest definition */
export async function deleteDefinition(db, id) {
  const docRef = doc(db, "chestDefinitions", id);
  await deleteDoc(docRef);
}
