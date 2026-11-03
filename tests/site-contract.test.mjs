import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { normalizeParcel, findParcels, sanitizeNote, policyReadiness, markdownReport, escapeHtml, NAV } from '../src/core.js';
const data = JSON.parse(await readFile(new URL('../data/observatory.json', import.meta.url), 'utf8'));
const parcels = JSON.parse(await readFile(new URL('../data/parcels.json', import.meta.url), 'utf8'));
const dongIds = data.dongs.map(d => `D:${d.code}`), quarters = ['2025Q4', '2026Q1', '2026Q2'];
test('boundary file keeps only geometry and identifiers for 314 grids and 17 dongs', () => {
  assert.equal(data.meta.schemaVersion, 3); assert.equal(data.grids.length, 314); assert.equal(data.dongs.length, 17);
  assert.equal(data.grids.filter(g => g.seongsu).length, 105);
  for (const g of data.grids) assert.deepEqual(Object.keys(g).sort(), ['dong', 'dongCode', 'edge', 'geometry', 'id', 'seongsu']);
  assert.equal(data.records, undefined);
});
test('published data holds no raw observation or model-input folders and no merchant fields', async () => {
  const entries = await readdir(new URL('../data/', import.meta.url));
  for (const gone of ['observations', 'model-inputs', 'research.json']) assert.ok(!entries.includes(gone), gone);
  const forbidden = ['business_name', 'merchant_id', 'lot_address', 'road_address', 'BPLCNM', 'SITEWHLADDR', 'RDNWHLADDR'];
  const visit = o => { if (!o || typeof o !== 'object') return; for (const [k, v] of Object.entries(o)) { assert.ok(!forbidden.includes(k), `field ${k}`); visit(v); } }; visit(data);
});
test('navigation lists only the kept pages', () => { assert.deepEqual(NAV.map(n => n[0]), ['overview', 'grades', 'policy', 'evidence', 'review']); });
test('parcel list preserves official duplicate evidence and planned distinction', () => { assert.equal(parcels.length, 547); assert.equal(parcels.reduce((s, p) => s + p.rows, 0), 550); assert.equal(parcels.filter(p => p.planned).length, 232); assert.equal(parcels.filter(p => p.rows === 2).length, 3); const p = findParcels(parcels, '성수동1가 685-283'); assert.equal(p.length, 1); assert.equal(p[0].rows, 2); });
test('parcel search tolerates spaces and hyphens without guessing legal eligibility', () => { assert.equal(normalizeParcel('서울특별시 성동구 성수동 1가 685－283'), '성수동1가|685|283'); assert.equal(findParcels(parcels, 'NOT_FOUND').length, 0); assert.equal(findParcels(parcels, '', '연무장길').length, 73); });
test('corrupt or foreign local notes cannot introduce HTML or invalid units', () => {
  const n = sanitizeNote({ version: 2, selected: ['fake', dongIds[0], dongIds[0]], selectedQuarters: { [dongIds[0]]: '2026Q1', fake: '2026Q1' }, checked: ['fake', 'scope'], note: '<img onerror=alert(1)>', purpose: 'approve' }, dongIds, quarters);
  assert.deepEqual(n.selected, [dongIds[0]]); assert.deepEqual(n.selectedQuarters, { [dongIds[0]]: '2026Q1' }); assert.deepEqual(n.checked, ['scope']); assert.equal(n.purpose, '지역 지정 검토'); assert.ok(escapeHtml(n.note).includes('&lt;')); assert.equal(sanitizeNote({ version: 99 }).selected.length, 0);
});
test('earlier grid-based notes keep their text and checks but drop old grid selections', () => {
  const n = sanitizeNote({ version: 1, title: '이전 검토', note: '메모', checked: ['time'], selected: [data.grids[0].id], selectedMonths: { [data.grids[0].id]: '2026-03' } }, dongIds, quarters);
  assert.equal(n.version, 2); assert.equal(n.title, '이전 검토'); assert.deepEqual(n.checked, ['time']); assert.deepEqual(n.selected, []);
});
test('checking every item never creates approval and the report states the limits', () => {
  const n = sanitizeNote({ version: 2, checked: ['scope', 'boundary', 'time', 'criteria', 'uncertainty', 'future'], selected: [dongIds[8]], selectedQuarters: { [dongIds[8]]: '2026Q1' }, title: '검토' }, dongIds, quarters);
  assert.equal(n.checked.length, 6); assert.equal(policyReadiness(n).approved, false);
  const text = markdownReport(n, { asOf: '2026.11.03' }, (id, q) => `${id} · ${q}`);
  assert.match(text, /정책 판단 보류/); assert.match(text, /D:11200650 · 2026Q1/); assert.match(text, /정책 요건 충족을 인증하지 않습니다/); assert.match(text, /https:\/\/www.sd.go.kr/);
});
