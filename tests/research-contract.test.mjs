import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { metricSummary, recordAt, stabilityFor, normalizeParcel, findParcels, sanitizeNote, policyReadiness, markdownReport, escapeHtml } from '../src/core.js';
const data = JSON.parse(await readFile(new URL('../data/observatory.json',import.meta.url),'utf8'));
const parcels = JSON.parse(await readFile(new URL('../data/parcels.json',import.meta.url),'utf8'));
test('published March map exactly preserves 105 original stage counts',()=>{
  const m=metricSummary(data,'2026-03','all','seongsu');assert.equal(m.total,105);assert.deepEqual(m.counts,{P0:1,S0:11,S1:5,S2:28,S3:56,S4:4});assert.equal(m.stable,53);assert.equal(m.stabilityN,104);
});
test('latest incomplete data never inherits earlier composite classification',()=>{const m=metricSummary(data,'2026-08');assert.equal(m.counts.P0,314);assert.equal(m.complex,0);assert.equal(m.stabilityN,0);assert.equal(stabilityFor(data.grids[0],'2026-08'),null);});
test('every original month and grid is present and absence remains nullable',()=>{assert.equal(data.grids.length,314);for(const g of data.grids){assert.equal(data.records[g.id].length,56);assert.equal(new Set(data.records[g.id].map(r=>r.month)).size,56);assert.ok(recordAt(data,g.id,'2026-08').flags.R===null);}assert.equal(recordAt(data,'missing','2026-03'),null);});
test('public base map excludes individual merchant and transaction fields',()=>{
  const forbidden=['card_amount','card_count','business_name','management_no','merchant_id','actual','prediction','lot_address','road_address','eligibility_gold'];
  const visit=o=>{if(!o||typeof o!=='object')return;for(const [k,v] of Object.entries(o)){assert.ok(!forbidden.includes(k),`disallowed public field ${k}`);visit(v);}};visit(data);
  assert.equal(data.meta.liveForecast,false);assert.equal(data.meta.policyApproval,false);
});
test('parcel list preserves official duplicate evidence and planned distinction',()=>{assert.equal(parcels.length,547);assert.equal(parcels.reduce((s,p)=>s+p.rows,0),550);assert.equal(parcels.filter(p=>p.planned).length,232);assert.equal(parcels.filter(p=>p.rows===2).length,3);const p=findParcels(parcels,'성수동1가 685-283');assert.equal(p.length,1);assert.equal(p[0].rows,2);});
test('parcel search tolerates spaces and hyphens without guessing legal eligibility',()=>{assert.equal(normalizeParcel('서울특별시 성동구 성수동 1가 685－283'),'성수동1가|685|283');assert.equal(findParcels(parcels,'NOT_FOUND').length,0);assert.equal(findParcels(parcels,'','연무장길').length,73);});
test('corrupt or foreign local notes cannot introduce HTML or invalid grid IDs',()=>{const n=sanitizeNote({version:1,selected:['fake',data.grids[0].id,data.grids[0].id],checked:['fake','scope'],note:'<img onerror=alert(1)>',purpose:'approve'},data.grids.map(g=>g.id));assert.equal(n.selected.length,1);assert.deepEqual(n.checked,['scope']);assert.equal(n.purpose,'지역 지정 검토');assert.ok(escapeHtml(n.note).includes('&lt;'));assert.equal(sanitizeNote({version:99}).selected.length,0);});
test('all user checks cannot create approval or invent independent evidence',()=>{const n=sanitizeNote({version:1,checked:['scope','boundary','time','criteria','uncertainty','future']});assert.equal(n.checked.length,6);assert.equal(policyReadiness(n).approved,false);const text=markdownReport(n,data);assert.match(text,/정책 판정 보류/);assert.match(text,/2026-03/);assert.match(text,/정책 요건 충족/);});
test('report includes selected observed units and distinguishes review from decisions',()=>{const n=sanitizeNote({version:1,selected:[data.grids[0].id],title:'검토',note:'공식 고시 확인'},data.grids.map(g=>g.id));const text=markdownReport(n,data);assert.ok(text.includes(data.grids[0].id));assert.match(text,/개인 적격성 판정과 별개/);assert.match(text,/https:\/\/www.sd.go.kr/);});
test('saved review retains selected observation month, including a withheld latest period',()=>{const id=data.grids[0].id;const n=sanitizeNote({version:1,selected:[id],selectedMonths:{[id]:'2026-08'}},data.grids.map(g=>g.id),data.meta.months);const report=markdownReport(n,data);assert.match(report,/관측 2026-08/);assert.match(report,/자료 부족 · 유보/);const invalid=sanitizeNote({...n,selectedMonths:{[id]:'2035-12'}},data.grids.map(g=>g.id),data.meta.months);assert.deepEqual(invalid.selectedMonths,{});});
