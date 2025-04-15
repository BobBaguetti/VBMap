// firebaseUtils.js
import { db } from "./firebase.js";
import { logError } from "./errorLogger.js";

/**
 * Updates an existing marker if it has an ID, or adds a new marker otherwise.
 * @param {Object} markerData - The marker data to update or add.
 * @returns {Promise} - A promise that resolves when the operation is complete.
 */
export function updateMarkerInFirestore(markerData) {
  if (markerData.id) {
    return db.collection("markers")
      .doc(markerData.id)
      .set(markerData)
      .then(() => {
        console.log("Updated marker:", markerData.id);
      })
      .catch((error) => {
        logError("Error updating marker:", error);
      });
  } else {
    return db.collection("markers")
      .add(markerData)
      .then((docRef) => {
        markerData.id = docRef.id;
        console.log("Added marker with ID:", docRef.id);
      })
      .catch((error) => {
        logError("Error adding marker:", error);
      });
  }
}

/**
 * Deletes a marker from Firestore using its ID.
 * @param {string} id - The ID of the marker to delete.
 * @returns {Promise} - A promise that resolves when the deletion is complete.
 */
export function deleteMarkerInFirestore(id) {
  return db.collection("markers").doc(id).delete()
    .then(() => {
      console.log("Deleted marker:", id);
    })
    .catch((error) => {
      logError("Error deleting marker:", error);
    });
}
