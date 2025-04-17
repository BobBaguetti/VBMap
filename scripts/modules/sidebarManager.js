// scripts/modules/sidebarManager.js
// Responsible for: ➊ collapsing / expanding the sidebar, ➋ live name search
// of markers.  It is entirely UI‑focused and does not touch Firestore.

/**
 * Sets up sidebar toggle + marker‑name search‑filtering.
 * @param {L.Map}    map        Leaflet map instance (needed for invalidateSize)
 * @param {Object}   layers     Map of type → Leaflet LayerGroup
 * @param {Array}    allMarkers Array of { markerObj, data } kept in memory
 * @returns {{ filterMarkers: Function }}
 */
export function setupSidebar(map, layers, allMarkers) {
    /* ---------------------------------------------------------- *
     *  Grab DOM handles
     * ---------------------------------------------------------- */
    const searchBar     = document.getElementById("search-bar");
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebar       = document.getElementById("sidebar");
    const mapContainer  = document.getElementById("map");
  
    // Abort gracefully if any element is missing (unit‑testing convenience)
    if (!searchBar || !sidebarToggle || !sidebar || !mapContainer) {
      console.warn("[sidebarManager] Sidebar elements not found – skipped‑initialisation.");
      return { filterMarkers() {} };
    }
  
    /* ---------------------------------------------------------- *
     *  Collapse / expand behaviour
     * ---------------------------------------------------------- */
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("hidden");                         // slide
      mapContainer.style.marginLeft = sidebar.classList.contains("hidden") ? "0" : "300px";
      map.invalidateSize();                                       // Leaflet resize
    });
  
    /* ---------------------------------------------------------- *
     *  Live search on name
     * ---------------------------------------------------------- */
    function filterMarkers() {
      const query = (searchBar.value || "").toLowerCase();
  
      allMarkers.forEach(({ markerObj, data }) => {
        const match = data.name && data.name.toLowerCase().includes(query);
        const layer = layers[data.type];
        if (!layer) return;                                       // safety
  
        if (match) {
          if (!layer.hasLayer(markerObj)) layer.addLayer(markerObj);
        } else {
          layer.removeLayer(markerObj);
        }
      });
    }
    searchBar.addEventListener("input", filterMarkers);
  
    return { filterMarkers };
  }
  