import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dongPanel,gridGrades,forecastNext,mergeData,parseDelimited,kindOf,ingest,qShift} from '../src/grades.js';
const base=JSON.parse(await readFile(new URL('../data/grades/base.json',import.meta.url),'utf8'));
const data=JSON.parse(await readFile(new URL('../data/observatory.json',import.meta.url),'utf8'));
const ref=JSON.parse(await readFile(new URL('./grades-reference.json',import.meta.url),'utf8'));
const panel=dongPanel(mergeData(base,null).dong);
test('quarter arithmetic',()=>{assert.equal(qShift('2026Q1',-4),'2025Q1');assert.equal(qShift('2025Q4',1),'2026Q1');assert.equal(qShift('2023Q1',-1),'2022Q4');});
test('browser grades match the Python protocol 39 grades for every dong-quarter',()=>{let n=0;for(const [k,v] of Object.entries(ref.dong)){const [q,code]=k.split('|');for(const c of ['C1','C2','C3','C4','COMP']){assert.equal(panel[q]?.[code]?.[c]??null,v[c],`${k} ${c}`);n++;}}assert.equal(n,289*5);});
test('browser grid grades match the issued 2026Q1 grid grades (issued file lists grids that also have 2026Q2 card)',()=>{const g=gridGrades(base.grid,panel,Object.fromEntries(data.grids.map(x=>[x.id,x.dongCode])));const got=g['2026Q1']||{};for(const id of Object.keys(got).filter(id=>!(id in ref.grid2026Q1)))assert.ok(!g['2026Q2']?.[id],`${id} graded in 2026Q1 and 2026Q2 but absent from the issued file`);for(const [id,v] of Object.entries(ref.grid2026Q1))assert.equal(got[id],v,id);});
test('browser forecast reproduces the issued 2026Q2 composite forecast',()=>{const f=forecastNext(panel);assert.equal(f.target,'2026Q2');assert.equal(f.pairs,193);for(const [code,v] of Object.entries(ref.forecast2026Q2)){assert.equal(f.grades[code].grade,v.grade,code);f.grades[code].p.forEach((p,i)=>assert.ok(Math.abs(p-v.p[i])<0.02,`${code} ${p} ${v.p[i]}`));}});
test('upload parser rebuilds a provider quarter identically to the bundled base',()=>{const q='2026Q1',src=base.dong[q];const rows={rent:[],sales:[],stores:[],change:[]};for(const [code,r] of Object.entries(src)){rows.rent.push({STDR_YYQU_CD:'20261',ADSTRD_CD:code,RENT_FLOOR_CD:'1',CNVRSN_RNTCHRG:String(r.rent),RENT_CO:String(r.rentCo)});rows.sales.push({STDR_YYQU_CD:'20261',ADSTRD_CD:code,SVC_INDUTY_CD:'CS100001',THSMON_SELNG_AMT:String(r.salesAmt),STOR_CO:String(r.salesStores)});rows.stores.push({STDR_YYQU_CD:'20261',ADSTRD_CD:code,SVC_INDUTY_CD:'CS100001',STOR_CO:String(r.cs1),OPBIZ_STOR_CO:String(r.open),CLSBIZ_STOR_CO:String(r.close)},{STDR_YYQU_CD:'20261',ADSTRD_CD:code,SVC_INDUTY_CD:'CS200001',STOR_CO:String(r.cs2),OPBIZ_STOR_CO:'0',CLSBIZ_STOR_CO:'0'},{STDR_YYQU_CD:'20261',ADSTRD_CD:code,SVC_INDUTY_CD:'CS300001',STOR_CO:String(r.cs3),OPBIZ_STOR_CO:'0',CLSBIZ_STOR_CO:'0'});rows.change.push({STDR_YYQU_CD:'20261',ADSTRD_CD:code,TRDAR_CHNGE_IX:'LL',OPR_SALE_MT_AVRG:String(r.opr),CLS_SALE_MT_AVRG:String(r.cls),SU_OPR_SALE_MT_AVRG:String(r.suOpr),SU_CLS_SALE_MT_AVRG:String(r.suCls)});}
  const up={dong:{},grid:{}};for(const [k,v] of Object.entries(rows)){assert.equal(kindOf(v),k);ingest(v,k,up);}
  const stripped={...base,dong:{...base.dong,[q]:{}}};const p2=dongPanel(mergeData(stripped,up).dong);for(const code of Object.keys(src))for(const c of ['C1','C2','C3','C4','COMP'])assert.equal(p2[q][code][c]??null,panel[q][code][c]??null,`${code} ${c}`);
  assert.equal(kindOf(parseDelimited('STDR_YYQU_CD|ADSTRD_CD|TRDAR_CHNGE_IX\n20262|11200520|LH')),'change');});
import {licenseGrades,allIndustryGrades,gridComposite,tm5174ToWgs,makeGridLocator} from '../src/grades.js';
test('EPSG:5174 conversion matches PROJ within 0.5 m',()=>{for(const [x,y,lo,la] of ref.proj5174){const [a,b]=tm5174ToWgs(x,y);assert.ok(Math.abs(a-lo)*88000<0.5&&Math.abs(b-la)*111000<0.5,`${x},${y}: ${a},${b} vs ${lo},${la}`);}});
test('browser grid composite reproduces protocol 42 G1-G4 and composite for every grid-quarter',()=>{
  const gd=Object.fromEntries(data.grids.map(x=>[x.id,x.dongCode]));const g1=gridGrades(base.grid,panel,gd,false);
  const qs=[...new Set(Object.keys(ref.gridComposite).map(k=>k.split('|')[0]))].sort();
  const lg=licenseGrades(base.lic,qs),ai=allIndustryGrades(base.allind),gc=gridComposite(g1,lg,ai,qs.filter(q=>q>='2023Q1'));
  let n=0,bad=[];for(const [k,v] of Object.entries(ref.gridComposite)){const [q,id]=k.split('|');const got={G1:g1[q]?.[id]??null,G2:q>='2023Q1'?lg[q]?.[id]?.G2??null:null,G3:q>='2023Q1'?lg[q]?.[id]?.G3??null:null,G4:ai[q]?.[id]?.G4??null,GC:gc[q]?.[id]?.GC??null};
    for(const c of ['G1','G2','G3','G4','GC']){n++;if(got[c]!==v[c])bad.push(`${k} ${c} ${got[c]} vs ${v[c]}`);}}
  assert.deepEqual(bad.slice(0,10),[]);assert.ok(n>20000);});
test('grid locator assigns converted license points like the Python grid assignment',()=>{const loc=makeGridLocator(base.gridWgs);let hit=0;for(const [x,y,lo,la] of ref.proj5174){if(loc(lo,la))hit++;}assert.ok(hit>0);});
import {existsSync,readFileSync} from 'node:fs';
const RAW406=new URL('../../data/raw/seoul_openapi/2026-09-26/LOCALDATA_072406_SD/rows.jsonl',import.meta.url);
test('LOCALDATA upload rebuilds the bundled license records of that type (local raw file only)',{skip:!existsSync(RAW406)},()=>{
  const rows=parseDelimited(readFileSync(RAW406,'utf8'));assert.equal(kindOf(rows),'license');
  const up=ingest(rows,'license',{dong:{},grid:{}},base);const key=r=>r.join('|');
  const got=up.lic['121'].map(key).sort(),want=base.lic.filter(r=>r[0].split('-')[1]==='121').map(key).sort();
  assert.deepEqual(got,want);});
import {macroAuc,scoreIssued} from '../src/grades.js';
test('in-browser macro AUC matches scikit-learn and scoring handles pending quarters',async()=>{
  const iss=JSON.parse(await readFile(new URL('../data/grades/issued_2026Q2.json',import.meta.url),'utf8'));
  const va=Object.fromEntries(Object.entries(ref.dong).filter(([k])=>k.startsWith('2026Q1|')).map(([k,v])=>[k.split('|')[1],v.COMP]));
  const r=scoreIssued(iss.sets.COMP.rows,id=>va[id]??null);assert.equal(r.n,ref.scoreCheck.n);assert.ok(Math.abs(r.auc-ref.scoreCheck.auc)<1e-9,`${r.auc} vs ${ref.scoreCheck.auc}`);
  assert.equal(macroAuc(['위험','활성','쇠퇴'],[[0,0,1],[0,1,0],[1,0,0]]),1);
  const pend=scoreIssued(iss.sets.GRIDC.rows,()=>null);assert.equal(pend.n,0);assert.equal(pend.auc,undefined);assert.equal(pend.issued,63);});
