// 등급 모니터링 지도. Leaflet은 사이트에 포함되어 있고(assets/vendor), 배경지도는 브이월드를 쓰되 불러오지 못하면 OSM으로 바꾼다.
// 화면 전체를 다시 그려도 지도는 유지되도록 host 요소를 한 번만 만들어 자리(slot)에 옮겨 끼운다.
// 격자 상세는 지도를 옮기지 않는 떠 있는 카드로 보여 준다: 마우스를 올리면 임시로, 누르면 계속 표시한다.
import { escapeHtml as h } from './core.js';
import { gridStyle, dongStyle, licensePoints } from './grades.js';

const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const vworldUrl = key => `https://api.vworld.kr/req/wmts/1.0.0/${encodeURIComponent(key)}/Base/{z}/{y}/{x}.png`;
const POINT_MIN_ZOOM = 13.5, GRID_LAYERS = ['GRID', 'GRIDC', 'WEB', 'POPUP', 'POPWEB'];
const SEL = { color: '#0b0b0b', weight: 3, dashArray: null }, HOVER = { color: '#0b0b0b', weight: 2, dashArray: null };
const isSheet = () => matchMedia('(max-width:720px)').matches;

let host, map, geo, on, float, floatId = '', cells = new Map(), dongs = new Map(), gridGroup, dongGroup, lineGroup, labelGroup, pointGroup, renderer, last = {};

function addBase(key) {
  const L = window.L, osm = () => L.tileLayer(OSM_URL, { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);
  if (!key) return osm();
  const t = L.tileLayer(vworldUrl(key), { minZoom: 6, maxZoom: 19, attribution: '© 브이월드(국토교통부)' }).addTo(map);
  let ok = 0, bad = 0, swapped = false;
  t.on('tileload', () => { ok++; });
  t.on('tileerror', () => { if (++bad >= 4 && !ok && !swapped) { swapped = true; map.removeLayer(t); osm(); } });
}

const latlngs = polys => polys.map(poly => poly.map(ring => ring.map(([lon, lat]) => [lat, lon])));

function placeFloat() {
  const c = cells.get(floatId); if (!c) return;
  const b = c.getBounds(), a = map.latLngToContainerPoint(b.getNorthWest()), z = map.latLngToContainerPoint(b.getSouthEast()), W = host.clientWidth, H = host.clientHeight, w = float.offsetWidth, ht = float.offsetHeight, gap = 14;
  let x = z.x + gap; if (x + w > W - 8) x = a.x - gap - w; if (x < 8) x = Math.max(8, (W - w) / 2);
  float.style.left = `${Math.round(x)}px`; float.style.top = `${Math.round(Math.max(8, Math.min((a.y + z.y - ht) / 2, H - ht - 8)))}px`;
}
function showCard(id, pinned) {
  float.innerHTML = last.card(id); float.className = `grid-float ${pinned ? 'pinned' : 'hovering'}${host.clientWidth < 640 ? ' one' : ''}`; float.hidden = false; floatId = id; placeFloat();
}
function hideCard() { float.hidden = true; floatId = ''; }

function create(config) {
  const L = window.L;
  host = document.createElement('div'); host.className = 'grade-map-host'; host.setAttribute('aria-label', '성동구 250m 격자·행정동 등급 지도');
  return () => {
    map = L.map(host, { minZoom: 11, maxZoom: 19, zoomSnap: 0.25, zoomDelta: 1, zoomControl: true, attributionControl: true });
    map.attributionControl.setPrefix('Leaflet');
    for (const [name, z] of [['dongLine', 420], ['points', 450], ['labels', 460]]) { const p = map.createPane(name); p.style.zIndex = z; p.style.pointerEvents = 'none'; }
    addBase(config?.vworldKey);
    renderer = L.canvas({ pane: 'points' });
    gridGroup = L.layerGroup(); dongGroup = L.layerGroup(); lineGroup = L.layerGroup(); labelGroup = L.layerGroup().addTo(map); pointGroup = L.layerGroup();
    float = document.createElement('div'); float.hidden = true; host.append(float);
    L.DomEvent.disableClickPropagation(float); L.DomEvent.disableScrollPropagation(float);
    float.addEventListener('click', e => { if (e.target.closest('.grid-pop-close')) on.closeGrid(); });
    const hover = !matchMedia('(hover:none)').matches;
    for (const [id, polys] of Object.entries(geo.grids)) {
      const c = L.polygon(latlngs(polys), { bubblingMouseEvents: false }).addTo(gridGroup); cells.set(id, c);
      c.on('click', () => on.grid(id));
      if (hover) {
        c.on('mouseover', () => { if (last.sel !== id) c.setStyle(HOVER); if (!isSheet()) showCard(id, last.sel === id); });
        c.on('mouseout', () => { if (last.sel !== id) c.setStyle(c.baseStyle); if (isSheet()) return; if (last.sel && last.isGrid) showCard(last.sel, true); else hideCard(); });
      }
    }
    for (const [code, d] of Object.entries(geo.dongs)) {
      const p = L.polygon(latlngs(d.rings), { bubblingMouseEvents: false }).addTo(dongGroup); dongs.set(code, p); p.on('click', () => on.dong(code));
      if (hover) p.bindTooltip('', { sticky: true, className: 'grade-tip' });
      L.polygon(latlngs(d.rings), { pane: 'dongLine', interactive: false, fill: false, color: d.seongsu ? '#0b0b0b' : '#52514e', weight: d.seongsu ? 2.2 : 1.1 }).addTo(lineGroup);
    }
    const b = L.latLngBounds([...dongs.values()].map(p => p.getBounds()));
    map.fitBounds(b, { padding: [8, 8] }); map.setMaxBounds(b.pad(2));
    map.on('move zoom', () => { if (floatId) placeFloat(); });
    map.on('zoomend', syncPointVisibility);
  };
}

export function placeGradeMap(slot, mapData, handlers) {
  on = handlers; geo = mapData.geo;
  const init = host ? null : create(mapData.config);
  slot.replaceWith(host);
  if (init) init(); else map.invalidateSize({ pan: false });
}

function syncPointVisibility() {
  const want = last.points && last.isGrid && map.getZoom() >= POINT_MIN_ZOOM;
  if (want && !map.hasLayer(pointGroup)) pointGroup.addTo(map); else if (!want && map.hasLayer(pointGroup)) map.removeLayer(pointGroup);
}

function drawPoints(gs, q, coords) {
  const L = window.L; pointGroup.clearLayers();
  for (const p of licensePoints(gs, q, coords)) L.circleMarker([p.lat, p.lon], p.kind === 'O'
    ? { renderer, interactive: false, radius: 4, color: '#ffffff', weight: 1, fillColor: '#1f6fd1', fillOpacity: 1 }
    : { renderer, interactive: false, radius: 3.5, color: '#14213d', weight: 1.6, fillColor: '#ffffff', fillOpacity: 1 }).addTo(pointGroup);
}

export function updateGradeMap({ gs, data, layer, q, sel, focus, points, coords, card }) {
  const isGrid = GRID_LAYERS.includes(layer), same = last.gs === gs && last.layer === layer && last.q === q;
  if (!same) {
    if (isGrid) for (const g of data.grids) { const c = cells.get(g.id); if (!c) continue; const s = gridStyle(gs, layer, q, g); c.baseStyle = s.style; c.setStyle(s.style); }
    for (const d of data.dongs) { const p = dongs.get(d.code); if (!p || isGrid) continue; const s = dongStyle(gs, layer, q, d); p.baseStyle = s.style; p.setStyle(s.style); p.getTooltip()?.setContent(h(s.title)); }
    const L = window.L; labelGroup.clearLayers();
    for (const d of data.dongs) { const c = geo.dongs[d.code], gr = isGrid ? '' : dongStyle(gs, layer, q, d).grade; L.marker([c.center[1], c.center[0]], { pane: 'labels', interactive: false, keyboard: false, icon: L.divIcon({ className: 'grade-lbl-wrap', iconSize: [0, 0], html: `<span class="grade-lbl">${h(d.name)}${gr ? `<br>${h(gr)}` : ''}</span>` }) }).addTo(labelGroup); }
    for (const [group, wanted] of [[gridGroup, isGrid], [lineGroup, isGrid], [dongGroup, !isGrid]]) { if (wanted && !map.hasLayer(group)) group.addTo(map); if (!wanted && map.hasLayer(group)) map.removeLayer(group); }
  }
  if ((!same || last.focus !== focus) && !isGrid) for (const [code, p] of dongs) p.setStyle(code === focus ? { ...p.baseStyle, weight: 3.4, color: '#0b0b0b' } : p.baseStyle);
  if (last.sel && (!same || last.sel !== sel) && cells.get(last.sel)?.baseStyle) cells.get(last.sel).setStyle(cells.get(last.sel).baseStyle);
  if (isGrid && sel && cells.get(sel)) { const c = cells.get(sel); c.setStyle(SEL); c.bringToFront(); }
  if (last.gs !== gs || last.q !== q) drawPoints(gs, q, coords);
  const pinKey = isGrid && sel && !isSheet() ? `${sel}|${q}` : '', changed = pinKey !== last.pinKey || last.gs !== gs;
  last = { gs, layer, q, sel: isGrid ? sel : '', focus, points, isGrid, pinKey, card };
  if (changed) {
    if (pinKey) { const c = cells.get(sel); map.panInside(c.getCenter(), { padding: [40, 40] }); showCard(sel, true); } else hideCard();
  }
  syncPointVisibility();
}
