// itemDefinitionsModal.js
import { createDefinitionsModal } from '../definitionsModalFactory.js';
import { itemDefinitionsService } from '../../services/itemDefinitionsService.js';
export async function showItemModal() {
  await createDefinitionsModal({
    entityName: 'Item',
    loadAll:    () => itemDefinitionsService.loadAll(),
    renderEntryRow(item, onSelect) {
      const row = document.createElement('div');
      row.className = 'def-row';
      row.innerHTML = `
        <strong>${item.name}</strong>
        <span>${item.itemType}</span>
        <span style="color:${item.rarityColor}">${item.rarity}</span>
        <span>${item.description.slice(0,40)}…</span>
        <span>${item.value}</span>
        <button class="delete-btn">🗑</button>
      `;
      row.querySelector('.delete-btn').addEventListener('click', e=>{
        e.stopPropagation();
        itemDefinitionsService.delete(item.id).then(() => row.remove());
      });
      row.addEventListener('click', () => onSelect(item));
      return row;
    },
    fields: [
      { key:'name',        label:'Name',   type:'text' },
      { key:'itemType',    label:'Type',   type:'select', options:['Crafting Material','Special','Quest'] },
      { key:'rarity',      label:'Rarity', type:'select', options:['Common','Uncommon','Rare','Epic','Legendary'] },
      { key:'description', label:'Description', type:'textarea' },
      { key:'value',       label:'Value',  type:'number' },
      { key:'quantity',    label:'Quantity', type:'number' },
      { key:'imageS',      label:'Image S URL', type:'text' },
      { key:'imageL',      label:'Image L URL', type:'text' },
    ],
    renderPreview(data) {
      return `
        <img src="${data.imageL}" style="max-width:100%" />
        <h3 style="color:${data.rarityColor}">${data.name}</h3>
        <p>${data.description}</p>
      `;
    },
    save:   data => itemDefinitionsService.upsert(data),
    delete: id   => itemDefinitionsService.delete(id),
  });
}
