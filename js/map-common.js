const MAP_BOUNDS = [[0, 0], [2047, 1657]];

const TYPE_INFO = {
  'hydrant-red': {
    label: 'Borne rouge',
    color: '#e53935',
    symbol: '●'
  },
  'hydrant-yellow': {
    label: 'Borne jaune',
    color: '#facc15',
    symbol: '●'
  },
  firestation: {
    label: 'Caserne',
    color: '#e53935',
    symbol: '🚒'
  },
  hospital: {
    label: 'Hôpital',
    color: '#22c55e',
    symbol: '✚'
  }
};

function makeMarkerIcon(type) {
  const info = TYPE_INFO[type] || TYPE_INFO['hydrant-red'];
  const isHydrant = type.startsWith('hydrant');

  const cls = isHydrant
    ? 'map-pin hydrant-pin'
    : 'map-pin facility-pin';

  return L.divIcon({
    className: '',
    html: `<div class="${cls}" style="--pin-color:${info.color}"><span>${info.symbol}</span></div>`,
    iconSize: isHydrant ? [7, 7] : [17, 17],
    iconAnchor: isHydrant ? [3.5, 3.5] : [8.5, 8.5]
  });
}

function markerTooltipContent(item) {
  const name = escapeHtml(
    item.nom || TYPE_INFO[item.type]?.label || item.type
  );

  const comment = item.commentaire
    ? `<div class="map-tooltip-comment">${escapeHtml(item.commentaire)}</div>`
    : '';

  return `<div class="map-tooltip-title">${name}</div>${comment}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function addBaseMap(map, imageUrl) {
  return L.imageOverlay(
    imageUrl || 'img/map.png',
    MAP_BOUNDS
  ).addTo(map);
}
