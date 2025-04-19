// @fullfile: Send the entire file, no omissions or abridgments.
// @version: 3   The current file version is 3. Increase by 1 every time you update anything.
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
 */

export function getItemDefinitionsCollection(db) {
  return db.collection("itemDefinitions");
}

export async function loadItemDefinitions(db) {
  const definitions = [];
  const snapshot = await getItemDefinitionsCollection(db).get();
  snapshot.forEach(doc => {
    definitions.push({ id: doc.id, ...doc.data() });
  });
  return definitions;
}

export async function saveItemDefinition(db, id, data) {
  const col = getItemDefinitionsCollection(db);
  if (id) {
    // overwrite provided fields
    await col.doc(id).update(data);
    return { id, ...data };
  } else {
    // create new doc
    const docRef = await col.add(data);
    return { id: docRef.id, ...data };
  }
}

export async function updateItemDefinition(db, id, data) {
  // merge update: only provided keys are written, others untouched
  await getItemDefinitionsCollection(db)
    .doc(id)
    .set(data, { merge: true });
  return { id, ...data };
}

export async function deleteItemDefinition(db, id) {
  await getItemDefinitionsCollection(db).doc(id).delete();
}

/**
 * Subscribe to real‑time updates on the entire collection.
 * @param db
 * @param onUpdate  – callback receiving an array of itemDefs each time data changes
 * @returns unsubscribe() to stop listening
 */
export function subscribeItemDefinitions(db, onUpdate) {
  const col = getItemDefinitionsCollection(db);
  const unsubscribe = col.onSnapshot(snapshot => {
    const defs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onUpdate(defs);
  }, err => {
    console.error("ItemDefinitions subscription error:", err);
  });
  return unsubscribe;
}
