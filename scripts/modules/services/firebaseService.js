// @fullfile: Send the entire file, no omissions or abridgments.
// @keep:    Comments must NOT be deleted unless their associated code is also deleted; comments may only be edited when editing their code.
// @version: 1   The current file version is 1. Increase by 1 every time you update anything.
// @file:    /scripts/modules/services/firebaseService.js

// Firebase initialization and CRUD functions for marker data.

export function initializeFirebase(config) {
    // Initialize Firebase if not already initialized.
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    // Return the Firestore instance.
    return firebase.firestore();
  }
  
  /**
   * Loads all markers from the 'markers' collection.
   * @param {firebase.firestore.Firestore} db Firestore instance.
   * @returns {Promise<Array>} A promise that resolves to an array of marker objects.
   */
  export async function loadMarkers(db) {
    const markers = [];
    try {
      const querySnapshot = await db.collection("markers").get();
      querySnapshot.forEach(doc => {
        let data = doc.data();
        data.id = doc.id;
        markers.push(data);
      });
    } catch (err) {
      console.error("Error loading markers:", err);
      throw err;
    }
    return markers;
  }
  
  /**
   * Adds a new marker to Firestore.
   * @param {firebase.firestore.Firestore} db Firestore instance.
   * @param {Object} markerData The marker data to add.
   * @returns {Promise<Object>} A promise that resolves to the marker data with the new id.
   */
  export async function addMarker(db, markerData) {
    try {
      const docRef = await db.collection("markers").add(markerData);
      markerData.id = docRef.id;
      console.log("Added marker with ID:", docRef.id);
      return markerData;
    } catch (err) {
      console.error("Error adding marker:", err);
      throw err;
    }
  }
  
  /**
   * Updates an existing marker in Firestore.
   * @param {firebase.firestore.Firestore} db Firestore instance.
   * @param {Object} markerData The marker data to update (must include an 'id' property).
   * @returns {Promise<void>}
   */
  export async function updateMarker(db, markerData) {
    try {
      await db.collection("markers").doc(markerData.id).set(markerData);
      console.log("Updated marker:", markerData.id);
    } catch (err) {
      console.error("Error updating marker:", err);
      throw err;
    }
  }
  
  /**
   * Deletes a marker from Firestore by id.
   * @param {firebase.firestore.Firestore} db Firestore instance.
   * @param {string} markerId The id of the marker to delete.
   * @returns {Promise<void>}
   */
  export async function deleteMarker(db, markerId) {
    try {
      await db.collection("markers").doc(markerId).delete();
      console.log("Deleted marker:", markerId);
    } catch (err) {
      console.error("Error deleting marker:", err);
      throw err;
    }
  }
  
  // @version: 1