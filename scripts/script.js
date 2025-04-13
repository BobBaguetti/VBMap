const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2,
  maxZoom: 2,
});

const bounds = [[0, 0], [3000, 3000]];
L.imageOverlay('images/map.png', bounds).addTo(map);
map.fitBounds(bounds);

fetch('data/markerData.json')
  .then(res => res.json())
  .then(data => {
    const layers = {};

    data.forEach(marker => {
      const markerEl = L.marker(marker.coords);
      const rarityClass = `popup-rarity-${marker.rarity || 'common'}`;
      const popupContent = `
        <div class="${rarityClass}">
          <strong>${marker.name}</strong><br/>
          <img src="${marker.image}" style="max-width: 100px;" /><br/>
          ${marker.description}<br/>
          Quantity: ${marker.quantity || '1'}<br/>
          <div class="popup-flavor">${marker.flavor}</div>
          <div>${marker.usage}</div>
        </div>`;

      markerEl.bindPopup(popupContent, { autoClose: false, closeOnClick: false });

      // Click-to-toggle popup logic
      markerEl.on('click', () => {
        if (markerEl.isPopupOpen()) {
          markerEl.closePopup();
        } else {
          markerEl.openPopup();
        }
      });

      // Grouping by type
      if (!layers[marker.type]) layers[marker.type] = L.layerGroup().addTo(map);
      markerEl.addTo(layers[marker.type]);
    });

    // Sidebar toggle filters
    document.querySelectorAll('#sidebar input[type="checkbox"]').forEach(cb => {
      if (cb.dataset.type) {
        cb.addEventListener('change', () => {
          if (cb.checked) {
            map.addLayer(layers[cb.dataset.type]);
          } else {
            map.removeLayer(layers[cb.dataset.type]);
          }
        });
      }
    });
  });
