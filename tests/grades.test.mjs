import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dongPanel,dongPanelOrig,featVecOrig,seoulRefs,gridGrades,forecastNext,mergeData,parseDelimited,kindOf,ingest,qShift} from '../src/grades.js';
const base=JSON.parse(await readFile(new URL('../data/grades/base.json',import.meta.url),'utf8'));
const data=JSON.parse(await readFile(new URL('../data/observatory.json',import.meta.url),'utf8'));
const ref=JSON.parse(await readFile(new URL('./grades-reference.json',import.meta.url),'utf8'));
const panel=dongPanelOrig(mergeData(base,null).dong);   // 원래 정의(프로토콜 39·42·45 기준 검증과 발행 예측 채점)
test('quarter arithmetic',()=>{assert.equal(qShift('2026Q1',-4),'2025Q1');assert.equal(qShift('2025Q4',1),'2026Q1');assert.equal(qShift('2023Q1',-1),'2022Q4');});
test('browser grades match the Python protocol 39 grades for every dong-quarter',()=>{let n=0;for(const [k,v] of Object.entries(ref.dong)){const [q,code]=k.split('|');for(const c of ['C1','C2','C3','C4','COMP']){assert.equal(panel[q]?.[code]?.[c]??null,v[c],`${k} ${c}`);n++;}}assert.equal(n,289*5);});
test('browser grid grades match the issued 2026Q1 grid grades (issued file lists grids that also have 2026Q2 card)',()=>{const g=gridGrades(base.grid,panel,Object.fromEntries(data.grids.map(x=>[x.id,x.dongCode])));const got=g['2026Q1']||{};for(const id of Object.keys(got).filter(id=>!(id in ref.grid2026Q1)))assert.ok(!g['2026Q2']?.[id],`${id} graded in 2026Q1 and 2026Q2 but absent from the issued file`);for(const [id,v] of Object.entries(ref.grid2026Q1))assert.equal(got[id],v,id);});
test('browser forecast reproduces the issued 2026Q2 composite forecast',()=>{const f=forecastNext(panel,featVecOrig);assert.equal(f.target,'2026Q2');assert.equal(f.pairs,193);for(const [code,v] of Object.entries(ref.forecast2026Q2)){assert.equal(f.grades[code].grade,v.grade,code);f.grades[code].p.forEach((p,i)=>assert.ok(Math.abs(p-v.p[i])<0.02,`${code} ${p} ${v.p[i]}`));}});
test('upload parser rebuilds a provider quarter identically to the bundled base',()=>{const q='2026Q1',src=base.dong[q];const rows={rent:[],sales:[],stores:[],change:[]};for(const [code,r] of Object.entries(src)){rows.rent.push({STDR_YYQU_CD:'20261',ADSTRD_CD:code,RENT_FLOOR_CD:'1',CNVRSN_RNTCHRG:String(r.rent),RENT_CO:String(r.rentCo)});rows.sales.push({STDR_YYQU_CD:'20261',ADSTRD_CD:code,SVC_INDUTY_CD:'CS100001',THSMON_SELNG_AMT:String(r.salesAmt),STOR_CO:String(r.salesStores)});rows.stores.push({STDR_YYQU_CD:'20261',ADSTRD_CD:code,SVC_INDUTY_CD:'CS100001',STOR_CO:String(r.cs1),OPBIZ_STOR_CO:String(r.open),CLSBIZ_STOR_CO:String(r.close)},{STDR_YYQU_CD:'20261',ADSTRD_CD:code,SVC_INDUTY_CD:'CS200001',STOR_CO:String(r.cs2),OPBIZ_STOR_CO:'0',CLSBIZ_STOR_CO:'0'},{STDR_YYQU_CD:'20261',ADSTRD_CD:code,SVC_INDUTY_CD:'CS300001',STOR_CO:String(r.cs3),OPBIZ_STOR_CO:'0',CLSBIZ_STOR_CO:'0'});rows.change.push({STDR_YYQU_CD:'20261',ADSTRD_CD:code,TRDAR_CHNGE_IX:'LL',OPR_SALE_MT_AVRG:String(r.opr),CLS_SALE_MT_AVRG:String(r.cls),SU_OPR_SALE_MT_AVRG:String(r.suOpr),SU_CLS_SALE_MT_AVRG:String(r.suCls)});}
  const up={dong:{},grid:{}};for(const [k,v] of Object.entries(rows)){assert.equal(kindOf(v),k);ingest(v,k,up);}
  const stripped={...base,dong:{...base.dong,[q]:{}}};const p2=dongPanelOrig(mergeData(stripped,up).dong);for(const code of Object.keys(src))for(const c of ['C1','C2','C3','C4','COMP'])assert.equal(p2[q][code][c]??null,panel[q][code][c]??null,`${code} ${c}`);
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
test('each issued forecast set carries the hash of its own issued file',async()=>{
  const iss=JSON.parse(await readFile(new URL('../data/grades/issued_2026Q2.json',import.meta.url),'utf8'));
  const h=Object.fromEntries(Object.entries(iss.sets).map(([k,v])=>[k,v.sha256]));
  assert.equal(new Set(Object.values(h)).size,4);
  assert.deepEqual(Object.fromEntries(Object.entries(h).map(([k,v])=>[k,v.slice(0,12)])),{COMP:'d60ffccb1b9e',C1:'e6ecf66aabef',GRID:'204c2210d675',GRIDC:'3e4989c7e5d7'});});
import {mergeAllInd,mergeFood} from '../src/grades.js';
import {readdirSync} from 'node:fs';
test('browser boundary-corrected grid grades reproduce protocol 45 for every grid-quarter',()=>{
  const gd=Object.fromEntries(data.grids.map(x=>[x.id,x.dongCode])),ex=new Set(base.gridExcluded);assert.equal(ex.size,40);
  const g1=gridGrades(base.gridB,panel,gd,false,ex),qs=[...new Set(Object.keys(ref.gridCompositeB).map(k=>k.split('|')[0]))].sort();
  const lg=licenseGrades(base.lic,qs),ai=allIndustryGrades(base.allindB),gc=gridComposite(g1,lg,ai,qs.filter(q=>q>='2023Q1'));
  let n=0,bad=[];for(const [k,v] of Object.entries(ref.gridCompositeB)){const [q,id]=k.split('|'),out=ex.has(id);
    const got={G1:g1[q]?.[id]??null,G2:!out&&q>='2023Q1'?lg[q]?.[id]?.G2??null:null,G3:!out&&q>='2023Q1'?lg[q]?.[id]?.G3??null:null,G4:out?null:ai[q]?.[id]?.G4??null,GC:gc[q]?.[id]?.GC??null};
    for(const c of ['G1','G2','G3','G4','GC']){n++;if(got[c]!==v[c])bad.push(`${k} ${c} ${got[c]} vs ${v[c]}`);}}
  assert.deepEqual(bad.slice(0,10),[]);assert.ok(n>20000);});
const RAWAI=new URL('../../data/raw/shinhan_all_industry_20261102/',import.meta.url);
test('all-industry upload rebuilds the whole-cell and boundary-corrected card inputs (local raw files only)',{skip:!existsSync(RAWAI)},()=>{
  const up={dong:{},grid:{}},q='2026Q1';
  for(const f of readdirSync(RAWAI).filter(f=>f.endsWith('.csv'))){const rows=parseDelimited(readFileSync(new URL(f,RAWAI),'utf8')).filter(r=>['202601','202602','202603'].includes(r.ym));assert.equal(kindOf(rows),'allind');ingest(rows,'allind',up,base);}
  const close=(a,b,k)=>assert.ok(Math.abs(a-b)<=1e-6*Math.max(1,Math.abs(b)),`${k} ${a} vs ${b}`);
  for(const [B,key] of [[false,'allind'],[true,'allindB']]){const got=mergeAllInd({...base,[key]:{}},up,B)[q],want=base[key][q];assert.deepEqual(Object.keys(got).sort(),Object.keys(want).sort());for(const [id,v] of Object.entries(want))v.forEach((x,i)=>close(got[id][i],x,`${key} ${id} ${i}`));}
  for(const [P,key] of [[up.foodPartsB,'gridB']]){const got=mergeFood({},P)[q],want=base[key][q];assert.deepEqual(Object.keys(got).sort(),Object.keys(want).sort());for(const [id,v] of Object.entries(want)){close(got[id].amt,v.amt,id);close(got[id].cnt,v.cnt,id);assert.equal(got[id].months,v.months,id);}}});
import {buildModel,observedGetter} from '../src/grades.js';
test('issued grid forecasts are scored with the original definitions, not the boundary-corrected grades',()=>{
  const gs=buildModel(base,null,data),q='2026Q1',ex=[...gs.excluded].filter(id=>gs.gridOrig[q]?.[id]);assert.ok(ex.length>0);
  for(const id of ex){assert.equal(observedGetter(gs,'GRID',q)(id),gs.gridOrig[q][id]);assert.equal(gs.grid[q]?.[id],undefined);}
  for(const [id,v] of Object.entries(ref.grid2026Q1))assert.equal(observedGetter(gs,'GRID',q)(id),v,id);});
test('web mention map is the quarter-stratified sum of the latest four quarters of its history',async()=>{
  const H=JSON.parse(await readFile(new URL('../data/grades/web_mentions_history.json',import.meta.url),'utf8')),M=JSON.parse(await readFile(new URL('../data/grades/web_mentions.json',import.meta.url),'utf8'));
  const K=Math.min(...Object.values(H.totals)),qs=Object.keys(H.quarters).sort().slice(-4),acc={};assert.equal(M.meta.stratumSize,K);
  for(const q of qs)for(const [g,[n,b]] of Object.entries(H.quarters[q])){const a=(acc[g]||=[0,0]);a[0]+=n*K/H.totals[q];a[1]=Math.max(a[1],b);}
  assert.deepEqual(M.meta.period,[qs[0],qs.at(-1)]);assert.deepEqual(Object.keys(M.grids).sort(),Object.keys(acc).sort());
  for(const [g,[v,b]] of Object.entries(acc)){assert.ok(Math.abs(M.grids[g][0]-v)<0.006,g);assert.equal(M.grids[g][1],b,g);}
  for(const q of Object.keys(H.quarters))assert.equal(Object.values(H.quarters[q]).reduce((s,[n])=>s+n,0),H.totals[q],q);
  assert.match(M.meta.note,/층화 추출/);assert.equal(M.meta.breaks.length,3);
  const ids=new Set(data.grids.map(g=>g.id));for(const g of Object.keys(M.grids))assert.ok(ids.has(g),g);});

import {gridG1,gridG4,licenseEB,seoulLicRefs,gridCompositeEB,refFromAgg,gammaQ,betaI,normSf,gammaDiffSf} from '../src/grades.js';
const panelNew=dongPanel(mergeData(base,null).dong,seoulRefs(base,null));
test('browser dong grades reproduce protocol 50 (Seoul references, open/close posterior 0.8, Seoul-way sales) for every dong-quarter',()=>{let n=0,bad=[];
  for(const [k,v] of Object.entries(ref.dongP50)){const [q,code]=k.split('|');const x=panelNew[q]?.[code]||{};
    for(const [c,pc] of [['C1','N1'],['C2','N2'],['C3','N3'],['C4','N4'],['COMP','NA1']]){n++;if((x[c]??null)!==v[pc])bad.push(`${k} ${c} ${x[c]} vs ${v[pc]}`);}
    if(v.weak2!=null&&!!x.weak2!==v.weak2)bad.push(`${k} weak2 ${x.weak2} vs ${v.weak2}`);}
  for(const [k,p] of Object.entries(ref.dongP50Prob)){const [q,code]=k.split('|');const x=panelNew[q]?.[code]||{};[x.Po,x.Pc,x.Pn].forEach((y,i)=>{if(!(Math.abs(y-p[i])<1e-6))bad.push(`${k} P${i} ${y} vs ${p[i]}`);});}
  assert.deepEqual(bad.slice(0,10),[]);assert.equal(n,289*5);
  const q1=Object.values(panelNew['2026Q1']);assert.equal(q1.filter(x=>x.COMP==='위험').length,1);assert.equal(q1.filter(x=>x.COMP==='쇠퇴').length,5);});
test('distribution functions match scipy values',()=>{
  assert.ok(Math.abs(gammaDiffSf(30,1200,40,1100,0.005)-0.8081438725)<1e-6,`${gammaDiffSf(30,1200,40,1100,0.005)}`);
  assert.ok(Math.abs(gammaQ(8.5,6.2)-0.7753341394)<1e-6);assert.ok(Math.abs(betaI(0.4,12.5,20.3)-0.5981227011)<1e-6);assert.ok(Math.abs(normSf(0.8416212)-0.2)<1e-6);});
test('browser grid grades reproduce protocol 49 (empirical Bayes, 0.8 rule) for every grid-quarter',()=>{
  const gd=Object.fromEntries(data.grids.map(x=>[x.id,x.dongCode])),ex=new Set(base.gridExcluded),rf=seoulRefs(base,null);
  const qs=[...new Set(Object.keys(ref.gridP49).map(k=>k.split('|')[0]))].sort().filter(q=>q>='2023Q1'&&q<='2026Q1');
  const g1=gridG1(base.gridB,panelNew,gd,rf,ex),g4=gridG4(base.allindB,rf,ex),eb=licenseEB(base.lic,qs,seoulLicRefs(base,null),ex),gc=gridCompositeEB(g1,eb,g4,qs);
  let n=0,bad=[];for(const [k,v] of Object.entries(ref.gridP49)){const [q,id]=k.split('|');if(!qs.includes(q))continue;
    const got={H1:g1[q]?.[id]?.G1??null,E2:eb[q]?.[id]?.G2??null,E3:eb[q]?.[id]?.G3??null,H4:g4[q]?.[id]?.G4??null,EC:gc[q]?.[id]?.GC??null};
    for(const c of ['H1','E2','E3','H4','EC']){n++;if(got[c]!==v[c])bad.push(`${k} ${c} ${got[c]} vs ${v[c]}`);}}
  for(const [k,p] of Object.entries(ref.gridP49Prob)){const [q,id]=k.split('|');if(!qs.includes(q))continue;const e=eb[q]?.[id]||{};
    [e.Po,e.Pc,e.Pcd,e.PA,e.PC].forEach((x,i)=>{if(p[i]!=null&&!(Math.abs(x-p[i])<1e-5))bad.push(`${k} P${i} ${x} vs ${p[i]}`);});}
  assert.deepEqual(bad.slice(0,10),[]);assert.ok(n>8000);
  const q1=Object.values(gc['2026Q1']);assert.equal(q1.length,157);assert.equal(q1.filter(x=>x.GC==='위험').length,1);assert.equal(q1.filter(x=>x.GC==='쇠퇴').length,30);});
const RAWSEOUL=new URL('../../data/raw/seoul_refs_20261107/',import.meta.url);
test('Seoul-wide provider and licence uploads rebuild the bundled Seoul references (local raw files only)',{skip:!existsSync(RAWSEOUL)},()=>{
  const up={dong:{},grid:{}};const keep=new Set(['20251','20261']);
  for(const [f,k] of [['VwsmAdstrdStorW.jsonl','stores'],['VwsmAdstrdSelngW.jsonl','sales']]){const rows=parseDelimited(readFileSync(new URL(f,RAWSEOUL),'utf8')).filter(r=>keep.has(r.STDR_YYQU_CD));assert.equal(kindOf(rows),k);ingest(rows,k,up,base);}
  const got=refFromAgg(up.seoulAgg['2026Q1'],up.seoulAgg['2025Q1']),want=base.seoulRef['2026Q1'];
  for(const k of ['o','c','ds','gL','gT','sg','sgT','dsS','gLS','gTS'])assert.ok(Math.abs(got[k]-want[k])<1e-8,`${k} ${got[k]} vs ${want[k]}`);
  for(const k of ['vo','vc','mnet'])assert.ok(Math.abs(got[k]-want[k])<1e-9*Math.max(1,Math.abs(want[k])/1e-6),`${k} ${got[k]} vs ${want[k]}`);
  assert.ok(Object.keys(up.dong['2026Q1']).every(c=>c.startsWith('11200')));
  const ul={dong:{},grid:{}};for(const f of ['LOCALDATA_072404_seoul_slim.jsonl','LOCALDATA_072405_seoul_slim.jsonl']){const rows=parseDelimited(readFileSync(new URL(f,RAWSEOUL),'utf8'));assert.equal(kindOf(rows),'license');ingest(rows,'license',ul,base);}
  const sl=seoulLicRefs(base,ul);for(const q of ['2023Q1','2024Q3','2026Q1','2026Q2'])for(const k of ['o','c','A','C','sdA','sdC'])assert.ok(Math.abs(sl[q][k]-base.seoulLic[q][k])<1e-6*Math.max(1,Math.abs(base.seoulLic[q][k])),`${q} ${k} ${sl[q][k]} vs ${base.seoulLic[q][k]}`);});
import {readXlsx,parsePopupSheet,ingestPopups,mergePopups,popupStats,popupKey,popupAddrKey,popupLookup,partialGrade,gridDetail} from '../src/grades.js';
const popups=JSON.parse(await readFile(new URL('../data/grades/popups.json',import.meta.url),'utf8'));
const addrTable=JSON.parse(await readFile(new URL('../data/grades/address_grid.json',import.meta.url),'utf8'));
test('popup statistics match the independent Python counts',()=>{const st=popupStats(mergePopups(popups,null));assert.equal(st.W,8);assert.equal(st.total,ref.popupStats.total);assert.equal(st.located,ref.popupStats.located);
  assert.deepEqual(st.weekly.map(w=>[w.start,w.active,w.located]),ref.popupStats.weekly);assert.equal(Object.keys(st.grids).length,Object.keys(ref.popupStats.grids).length);
  for(const [id,[d,n,b]] of Object.entries(ref.popupStats.grids)){const x=st.grids[id];assert.ok(Math.abs(x.d-d)<1e-5,id);assert.equal(x.n,n,id);assert.equal(x.b,b,id);}});
test('popup address normalisation handles road names with numbers and unit suffixes',()=>{assert.equal(popupAddrKey('아차산로11가길 6'),'아차산로11가길 6');assert.equal(popupAddrKey('연무장길 57, 1층'),'연무장길 57');assert.equal(popupAddrKey('연무장15길 11(S팩토리)'),'연무장15길 11');assert.equal(popupAddrKey('아차산로 15-8'),'아차산로 15-8');assert.equal(popupAddrKey('서울숲 일대'),'');assert.equal(popupAddrKey('성수역 3번 출구'),'');});
const RAWPOP=new URL('../../data/raw/popups_seongdong/2026-11-09/',import.meta.url);
test('browser xlsx upload rebuilds the bundled popup items (local raw files only)',{skip:!existsSync(RAWPOP)},async()=>{const {readdirSync}=await import('node:fs');const up={dong:{},grid:{}};let weeks=0;
  for(const f of readdirSync(RAWPOP).filter(n=>n.endsWith('.xlsx')).sort()){const b=readFileSync(new URL(encodeURIComponent(f),RAWPOP));const p=parsePopupSheet(await readXlsx(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)));assert.ok(p,f);ingestPopups(p,up,addrTable);weeks++;}
  assert.equal(weeks,8);const got=up.popups.items,base=new Map(popups.items.map(x=>[x[0],x]));assert.equal(Object.keys(got).length,popups.items.length);
  const wk=Object.values(up.popups.weeks).sort((a,b)=>a.start<b.start?-1:1);assert.deepEqual(wk.map(w=>[w.start,w.end,w.listed]),popups.meta.weeks.map(w=>[w.start,w.end,w.listed]));
  let same=0;for(const [k,x] of Object.entries(got)){const b0=base.get(k);assert.ok(b0,k);assert.equal(x[2],b0[2]);assert.equal(x[3],b0[3]);if(x[1]===b0[1])same++;}
  assert.ok(same/Object.keys(got).length>=0.95,`grid agreement ${same}`);});
test('partial grades are decided only when the missing items cannot change the composite',()=>{assert.equal(partialGrade(['활성','활성','활성',null]),'활성');assert.equal(partialGrade(['위험','위험','위험',null]),'위험');assert.equal(partialGrade(['위험','위험','활성',null]),null);assert.equal(partialGrade(['쇠퇴',null,null,null]),null);});
test('grid detail explains graded, partial and excluded cells for 2026Q1',()=>{const gs=buildModel(structuredClone({...base,popups}),{dong:{},grid:{}},data),q='2026Q1',P=Object.values(gs.gridP[q]);assert.equal(P.length,35);assert.equal(P.filter(x=>x.det).length,6);assert.ok(P.filter(x=>x.det).every(x=>x.det==='활성'));
  const id=Object.keys(gs.gridC[q])[0],d=gridDetail(gs,data,q,id);assert.ok(d.comp);assert.equal(d.items.length,4);d.items.forEach(it=>{assert.ok(it.grade);assert.ok(it.rows.length>0);it.rows.flat().forEach(c=>assert.ok(!/NaN|undefined/.test(c),c));});
  const pid=Object.keys(gs.gridP[q])[0],pd=gridDetail(gs,data,q,pid);assert.ok(pd.items.some(it=>!it.grade&&it.reason));
  const ex=[...gs.excluded][0];assert.equal(gridDetail(gs,data,q,ex).excluded,true);
  const empty=data.grids.find(g=>!gs.excluded.has(g.id)&&!gs.gridC[q]?.[g.id]&&!gs.gridP[q]?.[g.id]);const ed=gridDetail(gs,data,q,empty.id);assert.ok(ed.items.every(it=>!it.grade&&it.reason));});
import {popupMentionView} from '../src/grades.js';
test('popup mention view uses the baseline until four collected weeks, then the latest 13 weeks',()=>{
  const week=(n,g)=>({docs:n,blog:n,news:0,located:n,grids:g}),meta={started:'2026-01-01',updated:'2026-06-01',gaps:[]},baseline={from:'2025-12-01',to:'2026-08-31',docs:9,located:3,grids:{a:3}};
  const few={meta,baseline,weeks:{'2026-01-05':week(1,{b:1})}};const v=popupMentionView(few);assert.equal(v.source,'baseline');assert.deepEqual(v.grids,{a:3});assert.equal(v.docs,9);
  const weeks={};for(let i=1;i<=15;i++)weeks[`2026-02-${String(i).padStart(2,'0')}`]=week(2,{b:1,c:1});const d=popupMentionView({meta,baseline,weeks});assert.equal(d.source,'daily');assert.equal(d.weeks,13);assert.equal(d.docs,26);assert.deepEqual(d.grids,{b:13,c:13});assert.equal(d.from,'2026-02-03');
  assert.equal(popupMentionView(null),null);assert.equal(popupMentionView({meta,weeks:{}}),null);});


import {licensePoints,gridStyle,licenseCounts,latestQuarter} from '../src/grades.js';
const geo=JSON.parse(await readFile(new URL('../data/grades/grid_geo.json',import.meta.url),'utf8'));
const ptsFile=JSON.parse(await readFile(new URL('../data/grades/license_points.json',import.meta.url),'utf8'));
test('map geometry covers every grid and dong inside Seongdong coordinates',()=>{assert.deepEqual(Object.keys(geo.grids).sort(),data.grids.map(g=>g.id).sort());assert.deepEqual(Object.keys(geo.dongs).sort(),data.dongs.map(d=>d.code).sort());for(const p of Object.values(geo.grids))for(const poly of p)for(const r of poly)for(const [lon,lat] of r)assert.ok(lon>126.9&&lon<127.2&&lat>37.5&&lat<37.65);});
test('map points equal the opening and closing counts of every graded grid in every quarter',()=>{const gs=buildModel(base,null,data),qs=gs.quarters.filter(q=>q>='2023Q1'),cnt=licenseCounts(gs.lic,qs);for(const q of qs){const by={};for(const p of licensePoints(gs,q,ptsFile.points))(by[p.id]||={O:0,C:0})[p.kind]++;for(const [id,c] of Object.entries(cnt[q])){if(gs.excluded.has(id))continue;assert.equal(by[id]?.O||0,c.O,`${q} ${id} O`);assert.equal(by[id]?.C||0,c.C,`${q} ${id} C`);}}});
test('map cell colours keep the composite grade counts',()=>{const gs=buildModel(base,null,data),q=latestQuarter(gs),n={};for(const g of data.grids){const s=gridStyle(gs,'GRIDC',q,g);assert.ok(s.title.includes(g.id));const x=gs.gridC[q]?.[g.id];if(x&&!x.thin){assert.equal(s.style.fillOpacity,.6);n[x.GC]=(n[x.GC]||0)+1;}}assert.deepEqual(n,{위험:1,활성:37,쇠퇴:30});for(const g of data.grids)assert.ok(gridStyle(gs,'GRID',q,g).style);});

import {refGrades} from '../src/grades.js';
test('reference signal rule: more and rising is risk, falling is decline, no evidence is weak',()=>{const ids=Array.from({length:40},(_,i)=>'g'+i),s={};ids.forEach((id,i)=>{s[id]=[5+(i%5),5+(i%5)];});s.g0=[2,60];s.g1=[40,2];s.g2=[0,0];const r=refGrades(s,ids);assert.equal(r.grids.g0.grade,'위험');assert.equal(r.grids.g1.grade,'쇠퇴');assert.equal(r.grids.g2.grade,null);assert.ok(r.grids.g5.grade==='활성');assert.equal(refGrades({},ids),null);});
