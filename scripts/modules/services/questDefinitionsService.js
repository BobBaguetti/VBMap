// @version: 1
// @file: /scripts/modules/services/questDefinitionsService.js

/**
 * Firestore service for quest definitions.
 * Fields per quest:
 *   - title: string
 *   - description: string
 *   - objectives: Array<{ text: string, color: string }>
 *   - rewardValue: string
 *   - rewardQuantity: string
 */

export function getQuestDefinitionsCollection(db) {
    return db.collection("questDefinitions");
  }
  
  export async function loadQuestDefinitions(db) {
    const defs = [];
    const snap = await getQuestDefinitionsCollection(db).get();
    snap.forEach(doc => {
      defs.push({ id: doc.id, ...doc.data() });
    });
    return defs;
  }
  
  export async function saveQuestDefinition(db, id, data) {
    const col = getQuestDefinitionsCollection(db);
    if (id) {
      await col.doc(id).update(data);
      return { id, ...data };
    } else {
      const ref = await col.add(data);
      return { id: ref.id, ...data };
    }
  }
  
  export async function deleteQuestDefinition(db, id) {
    await getQuestDefinitionsCollection(db).doc(id).delete();
  }
  
  export function subscribeQuestDefinitions(db, onUpdate) {
    const col = getQuestDefinitionsCollection(db);
    const unsub = col.onSnapshot(
      snap => onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error("QuestDefs subscription error:", err)
    );
    return unsub;
  }
  