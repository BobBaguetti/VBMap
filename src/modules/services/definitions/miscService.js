// @file: src/modules/services/definitions/miscService.js
// @version: 1.0 — Firestore service for miscellaneous marker definitions

/**
 * Service for miscellaneous marker definitions in Firestore.
 * Use this for one-off types like target dummies, loot caches, scenic viewpoints, etc.
 * Fields include:
 *   - name: string
 *   - devName: string
 *   - description: string
 *   - extraLines: Array<{ label: string, value: string }>
 *   - iconSmallUrl: string
 *   - iconLargeUrl: string
 *   - type: string              // e.g. "dummy", "cache", "viewpoint", etc.
 *   - showInFilters: boolean    // whether this appears in sidebar filters
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

/** @param {import('firebase/firestore').Firestore} db */
export function getMiscCollection(db) {
  return collection(db, "miscDefinitions");
}

export async function loadMisc(db) {
  const col = getMiscCollection(db);
  const snap = await getDocs(col);
  return snap.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, showInFilters: data.showInFilters ?? true };
  });
}

export async function saveMisc(db, id, payload) {
  const { id: _ignore, ...data } = payload;
  data.showInFilters = payload.showInFilters ?? true;

  if (id) {
    const ref = doc(db, "miscDefinitions", id);
    await updateDoc(ref, data);
    return { id, ...data };
  } else {
    const ref = await addDoc(getMiscCollection(db), data);
    return { id: ref.id, ...data };
  }
}

export async function updateMisc(db, id, data) {
  data.showInFilters = data.showInFilters ?? true;
  const ref = doc(db, "miscDefinitions", id);
  await setDoc(ref, data, { merge: true });
  return { id, ...data };
}

export async function deleteMisc(db, id) {
  const ref = doc(db, "miscDefinitions", id);
  await deleteDoc(ref);
}

export function subscribeMisc(db, onUpdate) {
  const col = getMiscCollection(db);
  const unsubscribe = onSnapshot(
    col,
    snap => {
      const defs = snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, showInFilters: data.showInFilters ?? true };
      });
      onUpdate(defs);
    },
    err => console.error("Misc subscription error:", err)
  );
  return unsubscribe;
}
