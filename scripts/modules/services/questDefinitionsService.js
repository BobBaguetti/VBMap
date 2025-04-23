// @version: 2
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

export async function updateQuestDefinition(db, id, data) {
  if (!id || typeof id !== "string") throw new Error("Invalid ID for quest update");
  await getQuestDefinitionsCollection(db).doc(id).set(data, { merge: true });
  return { id, ...data };
}

export async function deleteQuestDefinition(db, id) {
  await getQuestDefinitionsCollection(db).doc(id).delete();
}

export function subscribeQuestDefinitions(db, onUpdate) {
  const col = getQuestDefinitionsCollection(db);
  return col.onSnapshot(
    snap => {
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      onUpdate(results);
    },
    err => console.error("QuestDefs subscription error:", err)
  );
}
