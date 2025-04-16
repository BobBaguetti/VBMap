// scripts/modules/itemDefinitions.js

/**
 * Loads all item definitions from the 'itemDefinitions' Firestore collection.
 * @param {firebase.firestore.Firestore} db Firestore instance.
 * @returns {Promise<Array>} Promise resolving to an array of item definition objects.
 */
export async function loadItemDefinitions(db) {
    const definitions = [];
    try {
      const snapshot = await db.collection("itemDefinitions").get();
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
   * @param {firebase.firestore.Firestore} db Firestore instance.
   * @param {Object} definition The item definition object to add.
   * @returns {Promise<Object>} Promise resolving to the added definition (with its new id).
   */
  export async function addItemDefinition(db, definition) {
    try {
      const docRef = await db.collection("itemDefinitions").add(definition);
      definition.id = docRef.id;
      console.log("Added item definition with ID:", docRef.id);
      return definition;
    } catch (err) {
      console.error("Error adding item definition:", err);
      throw err;
    }
  }
  
  /**
   * Updates an existing item definition in Firestore.
   * @param {firebase.firestore.Firestore} db Firestore instance.
   * @param {Object} definition The updated item definition object (must include id).
   * @returns {Promise<void>}
   */
  export async function updateItemDefinition(db, definition) {
    try {
      await db.collection("itemDefinitions").doc(definition.id).set(definition);
      console.log("Updated item definition:", definition.id);
    } catch (err) {
      console.error("Error updating item definition:", err);
      throw err;
    }
  }
  
  /**
   * Deletes an item definition from Firestore.
   * @param {firebase.firestore.Firestore} db Firestore instance.
   * @param {string} definitionId The id of the item definition to delete.
   * @returns {Promise<void>}
   */
  export async function deleteItemDefinition(db, definitionId) {
    try {
      await db.collection("itemDefinitions").doc(definitionId).delete();
      console.log("Deleted item definition:", definitionId);
    } catch (err) {
      console.error("Error deleting item definition:", err);
      throw err;
    }
  }
  