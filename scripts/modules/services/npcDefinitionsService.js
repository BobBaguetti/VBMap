// @file: /scripts/modules/services/npcDefinitionsService.js
// @version: 1.0 – initial modular service derived from chestDefinitionsService (2025‑05‑05)

/**
 * Firestore service for **NPC definitions**. NPCs can be enemies, vendors, or both.
 * Each document uses this shape:
 * {
 *   name:             string,
 *   roles:            Array<"Enemy"|"Vendor"|"QuestGiver">,
 *   health:           number,
 *   damage:           number,
 *   iconUrl?:         string,
 *   subtext?:         string,
 *   lootPool?:        Array<string>,          // itemDefinition ids dropped on death
 *   vendorInventory?: Array<string>,          // itemDefinition ids sold when alive
 *   description?:     string,
 *   descriptionColor: string (hex),
 *   extraLines?:      Array<{ text:string, color?:string }>,
 *   createdAt?:       Timestamp
 * }
 */

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
 * Create or update based on id. If `id` is null a new document is created.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string|null} id
 * @param {Object} data – see schema in JSDoc
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

export function subscribeNpcDefinitions(db, onUpdate) {
  return onSnapshot(
    getNpcDefinitionsCollection(db),
    snap => {
      onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    },
    err => console.error("subscribeNpcDefinitions:", err)
  );
}
