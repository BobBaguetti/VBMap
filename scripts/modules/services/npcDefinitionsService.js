// @version: 1
// @file: /scripts/modules/services/npcDefinitionsService.js

/**
 * Firestore service for NPC definitions.
 * Fields per NPC:
 *   - name: string
 *   - title: string
 *   - description: string
 *   - imageSmall: string
 *   - imageLarge: string
 *   - notes: Array<{ text: string, color: string }>
 */

export function getNpcDefinitionsCollection(db) {
    return db.collection("npcDefinitions");
  }
  
  export async function loadNpcDefinitions(db) {
    const defs = [];
    const snap = await getNpcDefinitionsCollection(db).get();
    snap.forEach(doc => {
      defs.push({ id: doc.id, ...doc.data() });
    });
    return defs;
  }
  
  export async function saveNpcDefinition(db, id, data) {
    const col = getNpcDefinitionsCollection(db);
    const { id: _id, ...clean } = data;
  
    if (id) {
      await col.doc(id).update(clean);
      return { id, ...clean };
    } else {
      const ref = await col.add(clean);
      const saved = await ref.get();
      return { id: ref.id, ...saved.data() };
    }
  }
  
  export async function updateNpcDefinition(db, id, data) {
    if (!id || typeof id !== "string") throw new Error("Invalid ID for NPC update");
    await getNpcDefinitionsCollection(db).doc(id).set(data, { merge: true });
    return { id, ...data };
  }
  
  export async function deleteNpcDefinition(db, id) {
    await getNpcDefinitionsCollection(db).doc(id).delete();
  }
  
  export function subscribeNpcDefinitions(db, onUpdate) {
    const col = getNpcDefinitionsCollection(db);
    return col.onSnapshot(
      snap => {
        const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(results);
      },
      err => console.error("NpcDefs subscription error:", err)
    );
  }
  