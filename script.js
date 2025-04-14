// Import Leaflet library
import L from 'leaflet';

// Set up the map
const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
  subdomains: ['a', 'b', 'c']
}).addTo(map);

// Custom icon creation function
function createCustomIcon(marker) {
  return L.divIcon({
    html: `
      <div class="custom-marker">
        <div class="marker-border"></div>
        ${marker.image ? `<img src="${marker.image}" class="marker-icon"/>` : ''}
      </div>
    `,
    className: 'custom-marker-container',
    iconSize: [32, 32]
  });
}

// Enhanced popup creation function
function createPopupContent(marker) {
  const popupHtml = `
    <h2>${marker.name}</h2>
    ${marker.itemType ? `<p>Item Type: ${marker.itemType}</p>` : ''}
    ${marker.rarity ? `<p>Rarity: ${marker.rarity}</p>` : ''}
    ${marker.description ? `<p>Description: ${marker.description}</p>` : ''}
    ${marker.extraInfo1 ? `<p>Extra Info 1: ${marker.extraInfo1}</p>` : ''}
    ${marker.extraInfo2 ? `<p>Extra Info 2: ${marker.extraInfo2}</p>` : ''}
    ${marker.extraInfo3 ? `<p>Extra Info 3: ${marker.extraInfo3}</p>` : ''}
  `;
  return L.popup({
    maxWidth: 200,
    minWidth: 100
  })
  .setLatLng(marker.latlng)
  .setContent(popupHtml);
}

// Add markers to the map
const markers = [
  {
    name: 'Extraction Point',
    latlng: [51.505, -0.09],
    image: ''
  },
  {
    name: 'Iron Ore',
    latlng: [51.506, -0.08],
    itemType: 'Crafting Material',
    rarity: 'Common'
  },
  {
    name: 'Shield Potion',
    latlng: [51.507, -0.07],
    description: 'A consumable potion that grants protection.',
    extraInfo1: 'Can be looted from chests.'
  }
];

markers.forEach(marker => {
  const customIcon = createCustomIcon(marker);
  L.marker(marker.latlng)
    .addTo(map)
    .bindPopup(createPopupContent(marker))
    .openPopup();
});

// Right-click functionality
map.on('contextmenu', (e) => {
  e.stopPropagation();
  if (e.originalEvent.button === 2) { // right-click
    const latlng = map.mouseEventToLatLng(e.originalEvent);
    L.popup({
      maxWidth: 200,
      minWidth: 100
    })
    .setLatLng(latlng)
    .setContent(`
      <button class="add-marker-btn">Add Marker</button>
      <div class="marker-edit-form">
        <label for="marker-name">Marker Name:</label>
        <input type="text" id="marker-name" />
        <br>
        <label for="marker-image">Marker Image:</label>
        <input type="file" id="marker-image" />
      </div>
    `)
    .openOn(map);
  }
});

// Prevent Chrome's default right-click menu from appearing
map.on('contextmenu', (e) => {
  e.stopPropagation();
});
