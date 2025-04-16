// firebaseUtils.js
import { db } from "./firebase.js";
import { logError } from "./errorLogger.js";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc
} from "firebase/firestore";

/**
 * Updates an existing marker if it has an ID, or adds a new marker otherwise.
 */
export function updateMarkerInFirestore(markerData) {
  const markersCol = collection(db, "markers");
  if (markerData.id) {
    const docRef = doc(markersCol, markerData.id);
    return setDoc(docRef, markerData)
      .then(() => {
        console.log("Updated marker:", markerData.id);
      })
      .catch((error) => {
        logError("Error updating marker:", error);
      });
  } else {
    return addDoc(markersCol, markerData)
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
 */
export function deleteMarkerInFirestore(id) {
  const markersCol = collection(db, "markers");
  const docRef = doc(markersCol, id);
  return deleteDoc(docRef)
    .then(() => {
      console.log("Deleted marker:", id);
    })
    .catch((error) => {
      logError("Error deleting marker:", error);
    });
}
