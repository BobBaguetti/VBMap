// @file: /scripts/modules/utils/firestoreServiceFactory.js
// @version: 1.0 – generic Firestore CRUD+subscribe factory

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    setDoc,
    deleteDoc,
    doc,
    onSnapshot
  } from "firebase/firestore";
  
  /**
   * Returns a Firestore-backed service for a given collection.
   *
   * @param {string} collectionName
   * @returns {{
   *   loadAll:        (db: Firestore) => Promise<Array<Object>>,
   *   subscribeAll:   (db: Firestore, cb: (Array<Object>)=>void) => () => void,
   *   add:            (db: Firestore, data: Object) => Promise<Object>,
   *   update:         (db: Firestore, id: string, data: Object) => Promise<Object>,
   *   remove:         (db: Firestore, id: string) => Promise<void>
   * }}
   */
  export function makeFirestoreService(collectionName) {
    const collRef = db => collection(db, collectionName);
  
    async function loadAll(db) {
      const snap = await getDocs(collRef(db));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  
    function subscribeAll(db, onUpdate) {
      const unsub = onSnapshot(
        collRef(db),
        snap => {
          const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          onUpdate(arr);
        },
        err => console.error(`${collectionName} subscription error:`, err)
      );
      return unsub;
    }
  
    async function add(db, data) {
      const ref = await addDoc(collRef(db), data);
      return { id: ref.id, ...data };
    }
  
    async function update(db, id, data) {
      const docRef = doc(db, collectionName, id);
      // if you want merge instead of overwrite, switch to setDoc(...)
      await updateDoc(docRef, data);
      return { id, ...data };
    }
  
    async function remove(db, id) {
      await deleteDoc(doc(db, collectionName, id));
    }
  
    return { loadAll, subscribeAll, add, update, remove };
  }
  