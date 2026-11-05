(async function () {
  const map = L.map('map', { crs: L.CRS.Simple, minZoom: -3, maxZoom: 2, zoomSnap: 0.25 });
  const customMap = await getCustomMap();
  addBaseMap(map, customMap || 'img/map.png');
  map.fitBounds(MAP_BOUNDS);

  let data;
  try { data = await loadLsfdData(); }
  catch (error) { document.getElementById('type-menu').textContent = error.message; return; }

  const layers = L.layerGroup().addTo(map);
  const zoneLayers = L.layerGroup().addTo(map);
  const types = Object.keys(TYPE_INFO);
  const menu = document.getElementById('type-menu');
  menu.innerHTML = '<strong>Afficher sur la carte</strong>' + types.map(type =>
    `<label><input type="checkbox" data-type="${type}" checked><span class="legend-dot" style="background:${TYPE_INFO[type].color}"></span>${TYPE_INFO[type].label}</label>`
  ).join('') + '<label><input type="checkbox" data-type="hazmat" checked><span class="legend-dot hazmat-dot"></span>Zones HAZMAT</label>';

  function render() {
    layers.clearLayers(); zoneLayers.clearLayers();
    const visible = type => menu.querySelector(`[data-type="${type}"]`)?.checked !== false;
    data.markers.forEach(item => {
      if (!visible(item.type)) return;
      L.marker([item.y, item.x], { icon: makeMarkerIcon(item.type) })
        .bindTooltip(markerTooltipContent(item), { direction: 'top', offset: [0,-18], opacity: 1, className: 'lsfd-tooltip' })
        .addTo(layers);
    });
    if (visible('hazmat')) data.hazmatZones.forEach(zone => {
      L.polygon(zone.points.map(p => [p.y, p.x]), {
        color: zone.color || '#eab308', fillColor: zone.color || '#eab308',
        fillOpacity: Number.isFinite(zone.opacity) ? zone.opacity : 0.28, weight: 2
      }).bindTooltip(escapeHtml(zone.nom || 'Zone HAZMAT'), { sticky: true }).addTo(zoneLayers);
    });
  }
  menu.addEventListener('change', render);
  render();
})();
