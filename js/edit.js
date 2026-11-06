(async function () {
  const map = L.map('map', { crs: L.CRS.Simple, minZoom: -3, maxZoom: 2, zoomSnap: 0.25 });
  const customMap = await getCustomMap();
  addBaseMap(map, customMap || 'img/map.png');
  map.fitBounds(MAP_BOUNDS);

  let data;
  try { data = await loadLsfdData(); }
  catch (error) { alert(error.message); return; }

  let selectedType = 'hydrant-red';
let drawingZone = false;
  let zonePoints = [];
  let draftLayer = null;
  const markerLayer = L.layerGroup().addTo(map);
  const zoneLayer = L.layerGroup().addTo(map);
  const $ = id => document.getElementById(id);
  const save = () => saveLsfdData(data);
  const status = message => { $('status').textContent = message; };

  function refresh() {
    markerLayer.clearLayers(); zoneLayer.clearLayers();
    data.markers.forEach((item, index) => {
      const marker = L.marker([item.y, item.x], { icon: makeMarkerIcon(item.type), draggable: true }).addTo(markerLayer);
      const filter = $('type-menu').querySelector(`[data-filter="${item.type}"]`);
      if (filter && !filter.checked) marker.setOpacity(0);
      marker.bindTooltip(markerTooltipContent(item), { direction: 'top', offset: [0,-18], opacity: 1, className: 'lsfd-tooltip' });
      marker.on('dragend', () => {
        const p = marker.getLatLng(); item.x = p.lng; item.y = p.lat; save(); status('Position du marqueur enregistrée.');
      });
      marker.on('click', () => editMarker(index));
    });
    data.hazmatZones.forEach((zone, index) => {
      const polygon = L.polygon(zone.points.map(p => [p.y,p.x]), {
        color: zone.color || '#eab308', fillColor: zone.color || '#eab308',
        fillOpacity: Number.isFinite(zone.opacity) ? zone.opacity : 0.28, weight: 2
      }).addTo(zoneLayer);
      if ($('type-menu').querySelector('[data-filter="hazmat"]')?.checked === false) map.removeLayer(zoneLayer);
      polygon.bindTooltip(escapeHtml(zone.nom || 'Zone HAZMAT'));
      polygon.on('click', () => editZone(index));
    });
    if (draftLayer) draftLayer.addTo(map);
  }

  function editMarker(index) {
    const item = data.markers[index];
    const facility = ['firestation','hospital'].includes(item.type);
    const popup = `<div class="marker-editor"><strong>${escapeHtml(TYPE_INFO[item.type].label)}</strong><label>Nom</label><input id="popup-name" value="${escapeHtml(item.nom || TYPE_INFO[item.type].label)}"><label>Commentaire</label><textarea id="popup-comment" rows="2" ${facility ? '' : 'disabled'}>${escapeHtml(item.commentaire || '')}</textarea><div class="popup-actions"><button class="save-popup" id="popup-save">Enregistrer</button><button class="delete-popup" id="popup-delete">Supprimer</button></div></div>`;
    const marker = markerLayer.getLayers()[index];
    marker.bindPopup(popup).openPopup();
    marker.once('popupopen', () => {
      $('popup-save').onclick = () => {
        item.nom = $('popup-name').value.trim() || TYPE_INFO[item.type].label;
        if (facility) item.commentaire = $('popup-comment').value.trim();
        save(); refresh(); status('Informations enregistrées.');
      };
      $('popup-delete').onclick = () => {
        if (!confirm('Supprimer cet emplacement ?')) return;
        data.markers.splice(index, 1); save(); refresh(); status('Emplacement supprimé.');
      };
    });
  }

  function editZone(index) {
    const zone = data.hazmatZones[index];
    const popup = `<div class="marker-editor"><strong>Zone HAZMAT</strong><label>Nom</label><input id="zone-name" value="${escapeHtml(zone.nom || 'Zone HAZMAT')}"><label>Couleur</label><input id="zone-color" type="color" value="${escapeHtml(zone.color || '#eab308')}"><label>Transparence : <span id="opacity-value">${zone.opacity ?? 0.28}</span></label><input id="zone-opacity" type="range" min="0" max="1" step="0.05" value="${zone.opacity ?? 0.28}"><div class="popup-actions"><button class="save-popup" id="zone-save">Enregistrer</button><button class="delete-popup" id="zone-delete">Supprimer</button></div></div>`;
    const polygon = zoneLayer.getLayers()[index];
    polygon.bindPopup(popup).openPopup();
    polygon.once('popupopen', () => {
      $('zone-opacity').oninput = () => $('opacity-value').textContent = $('zone-opacity').value;
      $('zone-save').onclick = () => {
        zone.nom = $('zone-name').value.trim() || 'Zone HAZMAT'; zone.color = $('zone-color').value; zone.opacity = Number($('zone-opacity').value);
        save(); refresh(); status('Zone HAZMAT mise à jour.');
      };
      $('zone-delete').onclick = () => {
        if (!confirm('Supprimer cette zone HAZMAT ?')) return;
        data.hazmatZones.splice(index, 1); save(); refresh(); status('Zone HAZMAT supprimée.');
      };
    });
  }

  document.querySelectorAll('[data-type]').forEach(button => button.addEventListener('click', () => {
    selectedType = button.dataset.type;
    drawingZone = false; zonePoints = []; if (draftLayer) map.removeLayer(draftLayer); draftLayer = null;
    document.querySelectorAll('[data-type]').forEach(b => b.classList.toggle('active', b === button));
    $('finish-zone-btn').hidden = true; $('cancel-zone-btn').hidden = true;
    $('map').classList.add('crosshair-cursor');
    status(`Mode ajout : ${TYPE_INFO[selectedType].label}. Cliquez sur la carte.`);
  }));

  $('draw-zone-btn').addEventListener('click', () => {
    drawingZone = true; zonePoints = []; selectedType = null;
    if (draftLayer) map.removeLayer(draftLayer); draftLayer = L.polygon([], { color:'#eab308', fillColor:'#eab308', fillOpacity:0.28, dashArray:'6 5' });
    $('finish-zone-btn').hidden = false; $('cancel-zone-btn').hidden = false;
    $('map').classList.add('crosshair-cursor'); status('Cliquez sur la carte pour placer les sommets du polygone HAZMAT (minimum 3).');
  });
  $('finish-zone-btn').addEventListener('click', () => {
    if (zonePoints.length < 3) return alert('Il faut au moins 3 points pour créer un polygone.');
    const nom = prompt('Nom de la zone HAZMAT :', 'Zone HAZMAT') || 'Zone HAZMAT';
    const color = prompt('Couleur du polygone (ex. #eab308) :', '#eab308') || '#eab308';
    const opacityInput = prompt('Transparence de 0 à 1 :', '0.28');
    const opacity = Math.max(0, Math.min(1, Number(opacityInput ?? 0.28)));
    data.hazmatZones.push({ nom, color: CSS.supports('color', color) ? color : '#eab308', opacity: Number.isFinite(opacity) ? opacity : 0.28, points: zonePoints });
    cancelDrawing(); save(); refresh(); status('Zone HAZMAT créée.');
  });
  function cancelDrawing() {
    drawingZone = false; zonePoints = []; if (draftLayer) map.removeLayer(draftLayer); draftLayer = null;
    $('finish-zone-btn').hidden = true; $('cancel-zone-btn').hidden = true; $('map').classList.remove('crosshair-cursor');
  }
  $('cancel-zone-btn').addEventListener('click', () => { cancelDrawing(); status('Dessin annulé.'); });

  map.on('click', e => {
    if (drawingZone) {
      zonePoints.push({ x:e.latlng.lng, y:e.latlng.lat });
      draftLayer.setLatLngs(zonePoints.map(p => [p.y,p.x])); return;
    }
    if (!selectedType) return;
    const item = { x:e.latlng.lng, y:e.latlng.lat, type:selectedType };
    if (['firestation','hospital'].includes(selectedType)) {
      item.nom = prompt(`Nom de ${TYPE_INFO[selectedType].label.toLowerCase()} :`, TYPE_INFO[selectedType].label) || TYPE_INFO[selectedType].label;
      item.commentaire = prompt('Commentaire affiché au survol (facultatif) :', '') || '';
    }
    data.markers.push(item); save(); refresh(); status(`${TYPE_INFO[selectedType].label} ajouté.`);
  });

  $('copy-json-btn').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(data, null, 2)); status('JSON copié dans le presse-papiers.'); }
    catch { alert('Copie impossible : utilisez Exporter JSON.'); }
  });
  $('export-json-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'lsfd-map-data.json'; a.click(); URL.revokeObjectURL(url);
  });
  $('import-json-btn').addEventListener('click', () => $('import-json-file').click());
  $('import-json-file').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    try { data = normalizeData(JSON.parse(await file.text())); save(); refresh(); status('Importation JSON réussie.'); }
    catch (error) { alert('Erreur JSON : ' + error.message); }
    e.target.value = '';
  });
  $('clear-json-btn').addEventListener('click', () => {
    if (!confirm('Supprimer tous les marqueurs et toutes les zones HAZMAT ?')) return;
    data = { markers:[], hazmatZones:[] }; save(); refresh(); status('Carte vidée.');
  });
  $('reset-map-btn').addEventListener('click', async () => {
    if (!confirm('Revenir à la carte d’origine ?')) return;
    await clearCustomMap(); location.reload();
  });
  $('map-file').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Choisissez une image PNG, JPG ou WEBP.');
    if (file.size > 35 * 1024 * 1024) return alert('Image trop volumineuse (maximum 35 Mo).');
    const reader = new FileReader();
    reader.onload = async () => { try { await setCustomMap(reader.result); location.reload(); } catch { alert('Impossible d’enregistrer cette image.'); } };
    reader.readAsDataURL(file);
  });
  $('change-map-btn').addEventListener('click', () => $('map-file').click());

  $('type-menu').innerHTML = '<strong>Afficher les catégories</strong>' + Object.entries(TYPE_INFO).map(([type,info]) =>
    `<label><input type="checkbox" data-filter="${type}" checked><span class="legend-dot" style="background:${info.color}"></span>${info.label}</label>`
  ).join('') + '<label><input type="checkbox" data-filter="hazmat" checked><span class="legend-dot hazmat-dot"></span>Zones HAZMAT</label>';
  $('type-menu').addEventListener('change', () => {
    const filters = $('type-menu');
    markerLayer.eachLayer(layer => {
      const point = layer.getLatLng();
      const item = data.markers.find(m => Math.abs(m.x-point.lng)<0.001 && Math.abs(m.y-point.lat)<0.001);
      if (item) layer.setOpacity(filters.querySelector(`[data-filter="${item.type}"]`).checked ? 1 : 0);
    });
    const showZones = filters.querySelector('[data-filter="hazmat"]').checked;
    if (showZones) zoneLayer.addTo(map); else map.removeLayer(zoneLayer);
  });
  refresh();
})();
