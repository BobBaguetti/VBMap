// @file: /scripts/modules/services/npcDefinitionsService.js
// @version: 2.0
//
// Firestore service for NPC definitions.
// Schema reference:
//
// {
//   name:            string,
//   roles:           string[],          // "Enemy" | "Vendor" | "QuestGiver"
//   health:          number,
//   damage:          number,
//
//   imageSmallUrl:   string,            // icon‑sized
//   imageLargeUrl:   string,            // full portrait
//
//   lootPool:        string[],          // item IDs dropped on death
//   vendorInventory: string[],          // item IDs sold while alive
//
//   // UI colours (hex)
//   nameColor:       string,
//   healthColor:     string,
//   damageColor:     string,
//   description:     string,
//   descriptionColor:string,
//   extraLines:      Array<{ text:string, color?:string }>,
//
//   createdAt?:      Timestamp          // auto‑set on create
// }
// ---------------------------------------------------------------------

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

/** @param {import('firebase/firestore').Firestore} db */
export function getNpcDefinitionsCollection(db) {
  return collection(db, "npcDefinitions");
}

export async function loadNpcDefinitions(db) {
  const snap = await getDocs(getNpcDefinitionsCollection(db));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Create or update an NPC definition.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|null} id  Document ID (null = create)
 * @param {Object} data     See schema above
 */
export async function saveNpcDefinition(db, id, data) {
  const { id: _ignore, ...payload } = data;
  if (id) {
    const ref = doc(db, "npcDefinitions", id);
    await updateDoc(ref, payload);
    return { id, ...payload };
  } else {
    const ref = await addDoc(getNpcDefinitionsCollection(db), {
      ...payload,
      createdAt: serverTimestamp()
    });
    return { id: ref.id, ...payload };
  }
}

/** Merge‑update convenience */
export async function updateNpcDefinition(db, id, data) {
  const ref = doc(db, "npcDefinitions", id);
  await setDoc(ref, data, { merge: true });
  return { id, ...data };
}

export async function deleteNpcDefinition(db, id) {
  await deleteDoc(doc(db, "npcDefinitions", id));
}

/**
 * Subscribe to NPC definitions in real time.
 * @param {import('firebase/firestore').Firestore} db
 * @param {Function} onUpdate  Callback receives array of definitions
 * @returns {Function} Unsubscribe function
 */
export function subscribeNpcDefinitions(db, onUpdate) {
  return onSnapshot(
    getNpcDefinitionsCollection(db),
    snap => {
      onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    },
    err => console.error("subscribeNpcDefinitions:", err)
  );
}
