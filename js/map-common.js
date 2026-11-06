const MAP_BOUNDS = [[0, 0], [2047, 1657]];
const TYPE_INFO = {
  'hydrant-red': { label: 'Borne rouge', color: '#e53935', symbol: '●' },
  'hydrant-yellow': { label: 'Borne jaune', color: '#facc15', symbol: '●' },
  firestation: { label: 'Caserne', color: '#e53935', symbol: '🚒' },
  hospital: { label: 'Hôpital', color: '#22c55e', symbol: '✚' }
};
function makeMarkerIcon(type) {
  const info = TYPE_INFO[type] || TYPE_INFO['hydrant-red'];
  const cls = type.startsWith('hydrant') ? 'map-pin hydrant-pin' : 'map-pin facility-pin';
  return L.divIcon({ className: '', html: `<div class="${cls}" style="--pin-color:${info.color}"><span>${info.symbol}</span></div>`,
    iconSize: type.startsWith('hydrant') ? [12,12] : [20,22], iconAnchor: type.startsWith('hydrant') ? [6,6] : [14,28] });
}
function markerTooltipContent(item) {
  const name = escapeHtml(item.nom || TYPE_INFO[item.type]?.label || item.type);
  const comment = item.commentaire ? `<div class="map-tooltip-comment">${escapeHtml(item.commentaire)}</div>` : '';
  return `<div class="map-tooltip-title">${name}</div>${comment}`;
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function addBaseMap(map, imageUrl) {
  return L.imageOverlay(imageUrl || 'img/map.png', MAP_BOUNDS).addTo(map);
}
