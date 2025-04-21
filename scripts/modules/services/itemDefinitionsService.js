// @fullfile: Send the entire file, no omissions or abridgments.
// @version: 7   The current file version is 7. Increase by 1 every time you update anything.
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
 *   - (All fields may also have corresponding color fields)
 */

//////////////////////////////
// 🔹 Collection Reference
//////////////////////////////

/**
 * Get the Firestore collection for item definitions.
 * @param {object} db - Firestore instance
 * @returns {CollectionReference}
 */
export function getItemDefinitionsCollection(db) {
  return db.collection("itemDefinitions");
}

//////////////////////////////
// 🔹 Load Items
//////////////////////////////

/**
 * Load all item definitions from Firestore.
 * @param {object} db - Firestore instance
 * @returns {Promise<Array>} Array of item definition objects
 */
export async function loadItemDefinitions(db) {
  const definitions = [];
  const snapshot = await getItemDefinitionsCollection(db).get();
  snapshot.forEach(doc => {
    definitions.push({ id: doc.id, ...doc.data() });
  });
  return definitions;
}

//////////////////////////////
// 🔹 Save or Add New Item
//////////////////////////////

/**
 * Save an item definition (add or update).
 * Returns the saved object with a valid `id`.
 *
 * @param {object} db - Firestore instance
 * @param {string|null} id - If null, creates a new entry
 * @param {object} data - Item definition fields
 * @returns {Promise<object>} The saved item (with `id`)
 */
export async function saveItemDefinition(db, id, data) {
  const col = getItemDefinitionsCollection(db);

  // Strip `id` to prevent null from being saved to Firestore
  const { id: ignoredId, ...cleanData } = data;

  if (id) {
    // Update existing document
    await col.doc(id).update(cleanData);
    return { id, ...cleanData };
  } else {
    // Add new document and fetch it back to ensure ID and saved fields are valid
    const docRef = await col.add(cleanData);
    const savedDoc = await docRef.get(); // ✅ Ensure correct fields are returned
    const saved = { id: docRef.id, ...savedDoc.data() };
    console.log("[saveItemDefinition] Saved new item with ID:", saved.id, saved);
    return saved;
  }
}

//////////////////////////////
// 🔹 Forceful Update (Merge)
//////////////////////////////

/**
 * Overwrite or merge an item definition by ID.
 * @param {object} db - Firestore instance
 * @param {string} id - Document ID
 * @param {object} data - Updated fields
 * @returns {Promise<object>} The updated item (with `id`)
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

//////////////////////////////
// 🔹 Delete Item
//////////////////////////////

/**
 * Delete an item definition by ID.
 * @param {object} db - Firestore instance
 * @param {string} id - Document ID
 */
export async function deleteItemDefinition(db, id) {
  await getItemDefinitionsCollection(db).doc(id).delete();
}

//////////////////////////////
// 🔹 Real-Time Subscription
//////////////////////////////

/**
 * Subscribe to real-time updates on the item definitions collection.
 * @param {object} db - Firestore instance
 * @param {function} onUpdate - Callback receiving array of items
 * @returns {function} unsubscribe
 */
export function subscribeItemDefinitions(db, onUpdate) {
  const col = getItemDefinitionsCollection(db);

  const unsubscribe = col.onSnapshot(snapshot => {
    const defs = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(def => !!def.id); // ✅ Filter out entries with invalid/null ID

    onUpdate(defs);
  }, err => {
    console.error("ItemDefinitions subscription error:", err);
  });

  return unsubscribe;
}
