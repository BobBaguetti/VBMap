// @fullfile: Send the entire file, no omissions or abridgments.
// @version: 4   The current file version is 4. Increase by 1 every time you update anything.
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

/**
 * Load all item definitions from Firestore.
 */
export async function loadItemDefinitions(db) {
  const definitions = [];
  const snapshot = await getItemDefinitionsCollection(db).get();
  snapshot.forEach(doc => {
    definitions.push({ id: doc.id, ...doc.data() });
  });
  return definitions;
}

/**
 * Save a new item definition, or update an existing one.
 * Returns the saved object with an `id`.
 */
export async function saveItemDefinition(db, id, data) {
  const col = getItemDefinitionsCollection(db);
  if (id) {
    // Update existing document
    await col.doc(id).update(data);
    return { id, ...data };
  } else {
    // Add new document and return data with generated ID
    const docRef = await col.add(data);
    return { id: docRef.id, ...data }; // ✅ Ensures new item has Firestore-generated ID
  }
}

/**
 * Forcefully overwrite (or merge) an item definition by ID.
 */
export async function updateItemDefinition(db, id, data) {
  if (typeof id !== "string") {
    throw new Error("Invalid ID passed to updateItemDefinition");
  }

  await getItemDefinitionsCollection(db)
    .doc(id)
    .set(data, { merge: true });

  return { id, ...data };
}

/**
 * Permanently delete an item definition by ID.
 */
export async function deleteItemDefinition(db, id) {
  await getItemDefinitionsCollection(db).doc(id).delete();
}

/**
 * Subscribe to real-time updates on all item definitions.
 * @param {object} db - Firestore instance
 * @param {function} onUpdate - Callback to receive updated array of items
 * @returns {function} unsubscribe
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
