// Initialize map
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2,
  maxZoom: 2,
});

const bounds = [[0, 0], [3000, 3000]];
L.imageOverlay('images/map.png', bounds).addTo(map);
map.fitBounds(bounds);

// Video modal functionality
const videoModal = document.getElementById('video-modal');
const modalVideo = videoModal.querySelector('video');
const modalClose = videoModal.querySelector('.close');

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('video-trigger')) {
    e.preventDefault();
    const videoSrc = e.target.dataset.video;
    modalVideo.src = videoSrc;
    videoModal.style.display = 'block';
  }
});

modalClose.onclick = () => {
  videoModal.style.display = 'none';
  modalVideo.pause();
};

// Sidebar toggle
document.getElementById('toggleSidebar').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

// Marker creation with hover/click behavior
fetch('data/markerData.json')
  .then(res => res.json())
  .then(data => {
    const layers = {};
    const popupMode = document.getElementById('togglePopupMode');

    data.forEach(marker => {
      if (!layers[marker.type]) {
        layers[marker.type] = L.layerGroup().addTo(map);
      }

      const markerIcon = L.divIcon({
        className: `marker-icon marker-${marker.type} marker-rarity-${marker.rarity}`,
        html: marker.type === 'items' ? `<i class="fas fa-circle"></i>` : `<i class="fas fa-map-marker-alt"></i>`,
        iconSize: [20, 20]
      });

      const markerEl = L.marker(marker.coords, { icon: markerIcon });
      const rarityClass = `popup-rarity-${marker.rarity || 'common'}`;
      
      const popupContent = `
        <div class="popup-container ${rarityClass}">
          <h3>${marker.name}</h3>
          ${marker.image ? `<img src="${marker.image}" class="popup-image" />` : ''}
          <div class="popup-description">${marker.description}</div>
          ${marker.quantity ? `<div class="popup-quantity">Quantity: ${marker.quantity}</div>` : ''}
          ${marker.flavor ? `<div class="popup-flavor">${marker.flavor}</div>` : ''}
          ${marker.usage ? `<div class="popup-usage">${marker.usage}</div>` : ''}
        </div>`;

      markerEl.bindPopup(popupContent, {
        className: `custom-popup ${rarityClass}`,
        maxWidth: 300
      });

      // Hover behavior based on settings
      markerEl.on(popupMode.checked ? 'mouseover' : 'click', () => {
        markerEl.openPopup();
      });

      if (popupMode.checked) {
        markerEl.on('mouseout', () => {
          markerEl.closePopup();
        });
      }

      markerEl.addTo(layers[marker.type]);
    });

    // Filter controls
    document.querySelectorAll('#sidebar input[type="checkbox"]').forEach(cb => {
      if (cb.dataset.type) {
        cb.addEventListener('change', () => {
          layers[cb.dataset.type][cb.checked ? 'addTo' : 'removeFrom'](map);
        });
      }
    });

    // Popup mode toggle
    popupMode.addEventListener('change', () => {
      map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          layer.off('mouseover mouseout click');
          layer.on(popupMode.checked ? 'mouseover' : 'click', () => {
            layer.openPopup();
          });
          if (popupMode.checked) {
            layer.on('mouseout', () => {
              layer.closePopup();
            });
          }
        }
      });
    });
  });
