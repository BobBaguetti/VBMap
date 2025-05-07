// chestDefinitionsModal.js
import { createDefinitionsModal } from '../definitionsModalFactory.js';
import { chestDefinitionsService } from '../../services/chestDefinitionsService.js';
export async function showChestModal() {
  await createDefinitionsModal({
    entityName: 'Chest',
    loadAll:    () => chestDefinitionsService.loadAll(),
    renderEntryRow(chest, onSelect) {
      const row = document.createElement('div');
      row.className = 'def-row';
      row.innerHTML = `
        <strong>${chest.name}</strong>
        <span>${chest.chestType}</span>
        <span>${chest.size}</span>
        <span>${chest.description.slice(0,40)}…</span>
      `;
      row.addEventListener('click', () => onSelect(chest));
      return row;
    },
    fields: [
      { key:'name',      label:'Name', type:'text' },
      { key:'chestType', label:'Type', type:'select', options:['Normal','Dragonvault'] },
      { key:'size',      label:'Size', type:'select', options:['Small','Medium','Large'] },
      { key:'description', label:'Description', type:'textarea' },
      { key:'imageS',    label:'Image S URL', type:'text' },
      { key:'imageL',    label:'Image L URL', type:'text' },
    ],
    renderPreview(data) {
      return `
        <img src="${data.imageL}" style="max-width:100%" />
        <h3>${data.name}</h3>
        <p>${data.description}</p>
      `;
    },
    save:   data => chestDefinitionsService.upsert(data),
    delete: id   => chestDefinitionsService.delete(id),
  });
}
