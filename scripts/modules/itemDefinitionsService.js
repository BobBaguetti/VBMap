// scripts/modules/itemDefinitionsService.js

/**
 * Initializes and returns the itemDefinitions collection reference.
 * @param {firebase.firestore.Firestore} db - The Firestore instance.
 * @returns {firebase.firestore.CollectionReference}
 */
export function getItemDefinitionsCollection(db) {
  return db.collection("itemDefinitions");
}

/**
 * Loads all item definitions from Firestore.
 * @param {firebase.firestore.Firestore} db - The Firestore instance.
 * @returns {Promise<Array>} - Promise resolving to an array of item definition objects.
 */
export async function loadItemDefinitions(db) {
  const definitions = [];
  try {
    const snapshot = await getItemDefinitionsCollection(db).get();
    snapshot.forEach(doc => {
      let data = doc.data();
      data.id = doc.id;
      definitions.push(data);
    });
  } catch (err) {
    console.error("Error loading item definitions:", err);
    throw err;
  }
  return definitions;
}

/**
 * Adds a new item definition to Firestore.
 * @param {firebase.firestore.Firestore} db - The Firestore instance.
 * @param {Object} itemDef - The item definition object to add.
 * @returns {Promise<Object>} - Promise resolving to the item definition object with its new id.
 */
export async function addItemDefinition(db, itemDef) {
  try {
    const docRef = await getItemDefinitionsCollection(db).add(itemDef);
    itemDef.id = docRef.id;
    console.log("Added item definition with ID:", docRef.id);
    return itemDef;
  } catch (err) {
    console.error("Error adding item definition:", err);
    throw err;
  }
}

/**
 * Updates an existing item definition in Firestore using merge.
 * @param {firebase.firestore.Firestore} db - The Firestore instance.
 * @param {Object} itemDef - The item definition object with an 'id' property.
 * @returns {Promise<void>}
 */
export async function updateItemDefinition(db, itemDef) {
  try {
    // Use merge:true so we only overwrite the fields provided
    await getItemDefinitionsCollection(db)
      .doc(itemDef.id)
      .set(itemDef, { merge: true });
    console.log("Updated item definition (merged):", itemDef.id);
  } catch (err) {
    console.error("Error updating item definition:", err);
    throw err;
  }
}

/**
 * Deletes an item definition from Firestore by id.
 * @param {firebase.firestore.Firestore} db - The Firestore instance.
 * @param {string} id - The id of the item definition to delete.
 * @returns {Promise<void>}
 */
export async function deleteItemDefinition(db, id) {
  try {
    await getItemDefinitionsCollection(db).doc(id).delete();
    console.log("Deleted item definition:", id);
  } catch (err) {
    console.error("Error deleting item definition:", err);
    throw err;
  }
}
