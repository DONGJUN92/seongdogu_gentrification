// 등급 모니터링: 신보 행정동 분기 자료·카드 격자 분기 자료 → 구성 등급 4종·종합 등급·격자 등급·다음 분기 예측 (프로토콜 39·38 규칙)
import { escapeHtml as h, pathFor } from './core.js';
import { icon } from './icons.js';

export const CL = ['쇠퇴', '활성', '위험'];
export const GRADE = { 활성: { color: '#0ca30c', ink: '#ffffff' }, 쇠퇴: { color: '#fab219', ink: '#0b0b0b' }, 위험: { color: '#d03b3b', ink: '#ffffff' }, none: { color: '#e1e0d9', ink: '#52514e' } };
export const COMPONENTS = { COMP: '종합', C1: '임대료–매출', C2: '개폐업', C3: '영업기간', C4: '업종 교체' };
export const RULES = {
  C1: '임대료 증감 > 매출 증감이면 위험 · 두 증감 모두 1% 미만이면 쇠퇴 · 나머지 활성 (신보 1층 환산임대료, 외식업 점포당 매출, 전년동기 로그증감)',
  C2: '개업률·폐업률이 모두 같은 분기 성동구 평균 이상이면 위험(교체 과열) · 폐업 > 개업이면 쇠퇴 · 나머지 활성',
  C3: '폐업 점포 영업기간 ≥ 서울 평균이고 운영 점포 영업기간 < 서울 평균이면 위험(장기 점포 이탈) · 운영 점포 영업기간 ≥ 서울 평균이면 쇠퇴 · 나머지 활성',
  C4: '외식업 점포 비중 증가와 생활밀착(서비스·소매) 점포 감소가 함께 나타나면 위험(업종 전환) · 전체 점포 감소면 쇠퇴 · 나머지 활성 (전년동기 대비)',
  COMP: '4개 구성 등급 중 위험 3개 이상이면 위험 · 쇠퇴 2개 이상이면 쇠퇴 · 나머지 활성 (프로토콜 41: 위험 비중 중앙값 14.7%)',
  GRID: '격자 카드 식음료 매출 전년동기 증감과 소속 행정동 임대료 증감에 임대료–매출 규칙 적용 · 분기 카드 결제 250건 미만, 3개월 미관측, 전년동기 미관측 격자는 데이터 부족',
  GRIDC: '임대료–카드매출 · 개폐업(외식 인허가, 최근 4분기, 구 평균 대비) · 영업기간(외식 인허가, 구 평균 대비) · 업종 교체(전 업종 카드: 외식 비중↑·생활밀착 매출↓) 중 위험 3개 이상이면 위험 · 쇠퇴 2개 이상이면 쇠퇴 · 네 등급이 모두 있는 격자만 산출(분기당 약 60~70개)',
};
export const VALIDATION = {
  COMP: '1분기 앞 거시 AUC 0.705 · 정확도 55.8%(우연 40.0%) · 순열 p 0.0002 · 2023Q4~2026Q1 163건',
  C1: 'AUC 0.759 · 정확도 61.3%(우연 33.4%) · p 0.0002',
  GRID: '1분기 앞 거시 AUC 0.784 · 같은 동 안 격자 구분 p 0.0005',
  GRIDC: '1분기 앞 거시 AUC 0.876 · 정확도 78.9%(우연 47.3%) · 같은 동 안 격자 구분 p 0.0005 · 위험 비중 중앙값 3.6% (프로토콜 42)', C2: 'AUC 0.626 · 정확도 41.2%(우연 34.0%) · p 0.0002', C3: 'AUC 0.991 · 정확도 98.2% · 거의 바뀌지 않는 수준 지표', C4: 'AUC 0.878 · 정확도 72.4%(우연 34.8%) · p 0.0002',
};
export const GUIDE = [
  ['위험 2분기 연속', '정밀 진단 착수', '현장 조사(공실·업종·임대 동향), 상인·임대인 면담, 위험 구성 등급별 조치 검토. 지속가능발전구역·상생협약 검토 자료로 활용'],
  ['위험 1분기', '관찰 강화', '다음 분기 등급 확인 전 위험 구성 등급의 원값(임대료·개폐업·영업기간·업종 비중) 점검. 단발 신호만으로 조치하지 않음'],
  ['쇠퇴', '상권 활성화 검토', '골목상권 활성화·공실 대응·소상공인 경영지원 사업 대상 검토'],
  ['활성', '정기 관찰', '분기 갱신 시 등급 유지 여부 확인'],
  ['다음 분기 예측 위험', '사전 대비', '정확도 56% 수준의 참고값. 예측만으로 대상 지정 금지, 관측 등급 확인 후 판단'],
];
export const GUIDE_COMPONENT = [
  ['임대료–매출 위험', '임대료 상승이 매출 성장을 앞섬', '상생협약 체결 권고, 임대료 안정 협의, 안심상가 수요 파악'],
  ['개폐업 위험', '개업·폐업이 함께 많은 교체 과열', '폐업 사유 확인, 신규 창업자 정착 지원, 경영 컨설팅 연계'],
  ['영업기간 위험', '오래 영업한 점포가 닫고 신규 점포가 채움', '장기 영업 점포 목록 확인, 노포·오래가게 지원, 계약 갱신 상담'],
  ['업종 교체 위험', '생활밀착 점포 감소, 외식업 비중 증가', '생활밀착 업종 유지 지원, 지속가능발전구역 입점 제한 업종 검토 근거'],
];
const SEONGSU = new Set(['11200650', '11200660', '11200670', '11200690']);
const UPLOAD_KEY = 'seongdong-grade-uploads-v1';
export const qShift = (q, k) => { const n = (+q.slice(0, 4)) * 4 + (+q.slice(5)) - 1 + k; return `${Math.floor(n / 4)}Q${(n % 4) + 1}`; };
const pos = v => (typeof v === 'number' && v > 0 ? v : null);
const lg = (a, b) => (pos(a) && pos(b) ? Math.log(a / b) : null);

// ---------- 등급 계산 ----------
export function mergeData(base, up) {
  const dong = structuredClone(base.dong), grid = structuredClone(base.grid);
  for (const [q, v] of Object.entries(up?.dong || {})) for (const [code, r] of Object.entries(v)) (dong[q] ||= {})[code] = { ...(dong[q][code] || {}), ...r };
  for (const [q, v] of Object.entries(up?.grid || {})) for (const [id, r] of Object.entries(v)) (grid[q] ||= {})[id] = r;
  return { dong, grid };
}
export function dongPanel(dong) {
  const out = {}, qs = Object.keys(dong).sort();
  for (const q of qs) {
    const recs = dong[q], tot = Object.values(recs).reduce((a, r) => [a[0] + r.open, a[1] + r.close, a[2] + r.stores], [0, 0, 0]);
    for (const [code, r] of Object.entries(recs)) {
      const p = dong[qShift(q, -4)]?.[code], x = {};
      const spp = r.salesStores > 0 ? r.salesAmt / r.salesStores : null, spp4 = p && p.salesStores > 0 ? p.salesAmt / p.salesStores : null;
      x.rg = p ? lg(r.rent, p.rent) : null; x.sg = lg(spp, spp4);
      x.C1 = x.rg == null || x.sg == null ? null : x.sg < 0.01 && x.rg < 0.01 ? '쇠퇴' : x.sg >= x.rg ? '활성' : '위험';
      if (r.stores > 0) { const o = r.open / r.stores, c = r.close / r.stores; x.o_rel = o - tot[0] / tot[2]; x.c_rel = c - tot[1] / tot[2]; x.C2 = x.o_rel >= 0 && x.c_rel >= 0 ? '위험' : c > o ? '쇠퇴' : '활성'; }
      if (pos(r.suOpr) && pos(r.suCls) && r.opr != null && r.cls != null) { x.opr_r = r.opr / r.suOpr; x.cls_r = r.cls / r.suCls; x.C3 = x.cls_r >= 1 && x.opr_r < 1 ? '위험' : x.opr_r >= 1 ? '쇠퇴' : '활성'; }
      const T = r.cs1 + r.cs2 + r.cs3, T4 = p ? p.cs1 + p.cs2 + p.cs3 : 0;
      if (p && T > 0 && T4 > 0) { x.ds = (r.cs1 / T - p.cs1 / T4) * 100; x.gL = lg(r.cs2 + r.cs3, p.cs2 + p.cs3); x.gT = lg(T, T4); if (x.gL != null && x.gT != null) x.C4 = x.ds > 0 && x.gL < 0 ? '위험' : x.gT < 0 ? '쇠퇴' : '활성'; }
      const parts = ['C1', 'C2', 'C3', 'C4'].map(k => x[k] ?? null);
      if (parts.every(Boolean)) { x.R = parts.filter(g => g === '위험').length; x.D = parts.filter(g => g === '쇠퇴').length; x.COMP = x.R >= 3 ? '위험' : x.D >= 2 ? '쇠퇴' : '활성'; }
      (out[q] ||= {})[code] = x;
    }
  }
  return out;
}
// joint=true: 동 임대료–매출 등급이 있는 동·분기만(2026Q2 발행 파일 기준) · joint=false: 동 임대료 증감만 있으면 산출(프로토콜 38·42 기준)
export function gridGrades(grid, panel, gridDong, joint = true) {
  const out = {};
  for (const q of Object.keys(grid).sort()) for (const [id, r] of Object.entries(grid[q])) {
    const p = grid[qShift(q, -4)]?.[id], ok = v => v && v.months === 3 && v.cnt >= 250, x = panel[q]?.[gridDong[id]];
    const rg = x && (joint ? x.C1 : x.rg != null) ? x.rg : null;
    if (!ok(r) || !ok(p) || rg == null) continue;
    const sg = lg(r.amt, p.amt); if (sg == null) continue;
    (out[q] ||= {})[id] = sg < 0.01 && rg < 0.01 ? '쇠퇴' : sg >= rg ? '활성' : '위험';
  }
  return out;
}

// ---------- 250m 격자 종합 (프로토콜 42): G1 임대료–카드 · G2 개폐업 · G3 영업기간(외식 인허가) · G4 업종 교체(전 업종 카드) ----------
const QEND = ['0331', '0630', '0930', '1231'];
const ymd = v => { const s = String(v || '').replace(/[^0-9]/g, '').slice(0, 8); return s.length === 8 ? +s : 0; };
const qEnd = q => +(q.slice(0, 4) + QEND[+q.slice(5) - 1]), qStart = q => +(q.slice(0, 4) + ['0101', '0401', '0701', '1001'][+q.slice(5) - 1]);
const days = n => Date.UTC(Math.floor(n / 10000), Math.floor(n / 100) % 100 - 1, n % 100) / 86400000;
export function licenseGrades(lic, quarters) {
  const out = {};
  for (const q of quarters) {
    const e = qEnd(q), w0 = qStart(qShift(q, -3)), e4 = qEnd(qShift(q, -4)), de = days(e), g = {};
    let sO = 0, sN4 = 0, aS = 0, aN = 0, cS = 0, cN = 0;
    for (const [, id, apv, dcb] of lic) {
      const a = (g[id] ||= { N: 0, N4: 0, O: 0, C: 0, aS: 0, cS: 0 });
      const act = apv <= e && (!dcb || dcb > e), act4 = apv <= e4 && (!dcb || dcb > e4), opn = apv >= w0 && apv <= e, cls = dcb && dcb >= w0 && dcb <= e;
      if (act) { const m = (de - days(apv)) / 30.4375; a.N++; a.aS += m; aS += m; aN++; }
      if (act4) { a.N4++; sN4++; } if (opn) { a.O++; sO++; }
      if (cls) { const m = (days(dcb) - days(apv)) / 30.4375; a.C++; a.cS += m; cS += m; cN++; }
    }
    const refO = sO / sN4, refC = cN / sN4, refA = aS / aN, refCm = cS / cN;
    for (const [id, a] of Object.entries(g)) {
      const x = {};
      if (a.N4 >= 10) { x.o_rel = a.O / a.N4 - refO; x.c_rel = a.C / a.N4 - refC; x.G2 = x.o_rel >= 0 && x.c_rel >= 0 ? '위험' : a.C > a.O ? '쇠퇴' : '활성'; }
      if (a.N >= 10 && a.C >= 3) { x.A_r = a.aS / a.N / refA; x.C_r = a.cS / a.C / refCm; x.G3 = x.C_r >= 1 && x.A_r < 1 ? '위험' : x.A_r >= 1 ? '쇠퇴' : '활성'; }
      (out[q] ||= {})[id] = x;
    }
  }
  return out;
}
export function allIndustryGrades(allind) {
  const out = {}, ok = v => v && v[3] >= 1000 && v[4] === 3 && v[2] > 0;
  for (const q of Object.keys(allind)) for (const [id, r] of Object.entries(allind[q])) {
    const p = allind[qShift(q, -4)]?.[id]; if (!ok(r) || !ok(p)) continue;
    const ds = (r[1] / r[0] - p[1] / p[0]) * 100, gL = Math.log(r[2] / p[2]), gT = Math.log(r[0] / p[0]);
    (out[q] ||= {})[id] = { ds, gL, gT, G4: ds > 0 && gL < 0 ? '위험' : gT < 0 ? '쇠퇴' : '활성' };
  }
  return out;
}
export function gridComposite(g1, licG, aiG, quarters) {
  const out = {};
  for (const q of quarters) for (const id of Object.keys(g1[q] || {})) {
    const parts = [g1[q][id], licG[q]?.[id]?.G2, licG[q]?.[id]?.G3, aiG[q]?.[id]?.G4];
    if (!parts.every(Boolean)) continue;
    const R = parts.filter(g => g === '위험').length, D = parts.filter(g => g === '쇠퇴').length;
    (out[q] ||= {})[id] = { GC: R >= 3 ? '위험' : D >= 2 ? '쇠퇴' : '활성', R, D, parts };
  }
  return out;
}
// EPSG:5174 (Bessel 수정중부원점 TM) → WGS84: PROJ 'Korean 1985 to WGS 84 (1)' Molodensky-Badekas 좌표계 회전 규약과 같은 식
export function tm5174ToWgs(X, Y) {
  const a = 6377397.155, f = 1 / 299.1528128, e2 = f * (2 - f), ep2 = e2 / (1 - e2), lat0 = 38 * Math.PI / 180, lon0 = 127.002890277778 * Math.PI / 180;
  const Mf = p => a * ((1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * p - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * p) + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * p) - (35 * e2 ** 3 / 3072) * Math.sin(6 * p));
  const M = Mf(lat0) + (Y - 500000), mu = M / (a * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256)), e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const p1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const C1 = ep2 * Math.cos(p1) ** 2, T1 = Math.tan(p1) ** 2, N1 = a / Math.sqrt(1 - e2 * Math.sin(p1) ** 2), R1 = a * (1 - e2) / (1 - e2 * Math.sin(p1) ** 2) ** 1.5, D = (X - 200000) / N1;
  const lat = p1 - (N1 * Math.tan(p1) / R1) * (D ** 2 / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * ep2) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * ep2 - 3 * C1 ** 2) * D ** 6 / 720);
  const lon = lon0 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * ep2 + 24 * T1 ** 2) * D ** 5 / 120) / Math.cos(p1);
  const Nb = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2), xs = Nb * Math.cos(lat) * Math.cos(lon), ys = Nb * Math.cos(lat) * Math.sin(lon), zs = Nb * (1 - e2) * Math.sin(lat);
  const as = Math.PI / 648000, rx = -1.162 * as, ry = 2.347 * as, rz = 1.592 * as, s = 1 + 6.342e-6, px = -3159521.31, py = 4068151.32, pz = 3748113.85;
  const dx = xs - px, dy = ys - py, dz = zs - pz;
  const xt = -145.907 + px + s * (dx + rz * dy - ry * dz), yt = 505.034 + py + s * (-rz * dx + dy + rx * dz), zt = 685.756 + pz + s * (ry * dx - rx * dy + dz);
  const A = 6378137, fw = 1 / 298.257223563, e2w = fw * (2 - fw), pp = Math.hypot(xt, yt); let la = Math.atan2(zt, pp * (1 - e2w));
  for (let i = 0; i < 6; i++) { const Nw = A / Math.sqrt(1 - e2w * Math.sin(la) ** 2); la = Math.atan2(zt + e2w * Nw * Math.sin(la), pp); }
  return [Math.atan2(yt, xt) * 180 / Math.PI, la * 180 / Math.PI];
}
export function makeGridLocator(gridWgs) {
  const items = Object.entries(gridWgs).map(([id, ring]) => ({ id, ring, x0: Math.min(...ring.map(p => p[0])), x1: Math.max(...ring.map(p => p[0])), y0: Math.min(...ring.map(p => p[1])), y1: Math.max(...ring.map(p => p[1])) }));
  const inside = (x, y, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  return (lon, lat) => items.find(g => lon >= g.x0 && lon <= g.x1 && lat >= g.y0 && lat <= g.y1 && inside(lon, lat, g.ring))?.id || null;
}
export function mergeLicenses(base, up) {
  const types = new Set(Object.keys(up?.lic || {}));
  return [...base.lic.filter(r => !types.has(r[0].split('-')[1])), ...Object.values(up?.lic || {}).flat()];
}
export function mergeAllInd(base, up) {
  const out = structuredClone(base.allind);
  const parts = Object.values(up?.allindParts || {});
  const qs = new Set(parts.flatMap(p => Object.keys(p)));
  for (const q of qs) {
    const acc = {};
    for (const p of parts) for (const [id, v] of Object.entries(p[q] || {})) { const a = (acc[id] ||= [0, 0, 0, 0, new Set()]); for (let i = 0; i < 4; i++) a[i] += v[i]; [].concat(v[4]).forEach(m => a[4].add(m)); }
    for (const [id, a] of Object.entries(acc)) (out[q] ||= {})[id] = [a[0], a[1], a[2], a[3], a[4].size];
  }
  return out;
}

// ---------- 발행 예측 사전 검증 채점 (거시 AUC, 순열 p) ----------
export function macroAuc(y, P) {
  const out = [];
  CL.forEach((c, k) => {
    const pos = y.map(v => v === c), np = pos.filter(Boolean).length, nn = y.length - np; if (!np || !nn) return;
    const ord = P.map((p, i) => [p[k], i]).sort((a, b) => a[0] - b[0]), rank = new Array(y.length);
    for (let i = 0; i < ord.length;) { let j = i; while (j + 1 < ord.length && ord[j + 1][0] === ord[i][0]) j++; for (let t = i; t <= j; t++) rank[ord[t][1]] = (i + j) / 2 + 1; i = j + 1; }
    let sr = 0; pos.forEach((b, i) => { if (b) sr += rank[i]; }); out.push((sr - np * (np + 1) / 2) / (np * nn));
  });
  return out.length ? out.reduce((a, b) => a + b, 0) / out.length : null;
}
export function scoreIssued(rows, observed, nperm = 2000, seed = 20261103) {
  const ids = Object.keys(rows).filter(id => observed(id)), y = ids.map(id => observed(id)), P = ids.map(id => rows[id].p);
  if (ids.length < 5) return { n: ids.length, issued: Object.keys(rows).length };
  const acc = ids.filter((id, i) => rows[id].grade === y[i]).length / ids.length;
  const share = CL.map(c => y.filter(v => v === c).length / y.length), chance = share.reduce((a, v) => a + v * v, 0), auc = macroAuc(y, P);
  let st = seed >>> 0; const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let ge = 0;
  for (let b = 0; b < nperm; b++) { const Q = P.slice(); for (let i = Q.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [Q[i], Q[j]] = [Q[j], Q[i]]; } if (macroAuc(y, Q) >= auc) ge++; }
  return { n: ids.length, issued: Object.keys(rows).length, acc, chance, auc, p: (1 + ge) / (nperm + 1), pass: auc > 0.5 && (1 + ge) / (nperm + 1) < 0.05 };
}
export function observedGetter(gs, key, q) {
  return { COMP: id => gs.panel[q]?.[id]?.COMP, C1: id => gs.panel[q]?.[id]?.C1, GRID: id => gs.grid[q]?.[id], GRIDC: id => gs.gridC[q]?.[id]?.GC }[key];
}

// ---------- 다음 분기 예측: 다항 로지스틱 (표준화, L2, C=1) ----------
export const FEATS = ['COMP_쇠퇴', 'COMP_활성', 'COMP_위험', 'R', 'D', 'rg', 'sg', 'o_rel', 'c_rel', 'opr_r', 'cls_r', 'ds', 'gL', 'gT'];
const featVec = x => [x.COMP === '쇠퇴' ? 1 : 0, x.COMP === '활성' ? 1 : 0, x.COMP === '위험' ? 1 : 0, x.R, x.D, x.rg, x.sg, x.o_rel, x.c_rel, x.opr_r, x.cls_r, x.ds, x.gL, x.gT];
export function fitLogit(X, y, C = 1, iters = 4000) {
  const n = X.length, d = X[0].length, K = CL.length;
  const mu = Array.from({ length: d }, (_, j) => X.reduce((a, r) => a + r[j], 0) / n);
  const sd = mu.map((m, j) => Math.sqrt(X.reduce((a, r) => a + (r[j] - m) ** 2, 0) / n) || 1);
  const Z = X.map(r => r.map((v, j) => (v - mu[j]) / sd[j])), Y = y.map(c => CL.indexOf(c));
  const W = Array.from({ length: K }, () => new Array(d).fill(0)), b = new Array(K).fill(0);
  let lr = 0.5;
  for (let t = 0; t < iters; t++) {
    const gW = W.map(w => w.map(v => v / (C * n))), gb = new Array(K).fill(0);
    for (let i = 0; i < n; i++) {
      const s = W.map((w, k) => b[k] + w.reduce((a, v, j) => a + v * Z[i][j], 0)), m = Math.max(...s), e = s.map(v => Math.exp(v - m)), S = e.reduce((a, v) => a + v, 0);
      for (let k = 0; k < K; k++) { const g = (e[k] / S - (Y[i] === k ? 1 : 0)) / n; gb[k] += g; for (let j = 0; j < d; j++) gW[k][j] += g * Z[i][j]; }
    }
    for (let k = 0; k < K; k++) { b[k] -= lr * gb[k]; for (let j = 0; j < d; j++) W[k][j] -= lr * gW[k][j]; }
  }
  return x => { const z = x.map((v, j) => (v - mu[j]) / sd[j]), s = W.map((w, k) => b[k] + w.reduce((a, v, j) => a + v * z[j], 0)), m = Math.max(...s), e = s.map(v => Math.exp(v - m)), S = e.reduce((a, v) => a + v, 0); return e.map(v => v / S); };
}
export function forecastNext(panel) {
  const qs = Object.keys(panel).filter(q => Object.values(panel[q]).some(x => x.COMP)).sort(), last = qs.at(-1); if (!last) return null;
  const X = [], y = [];
  for (const q of qs) for (const [code, x] of Object.entries(panel[q])) { const nx = panel[qShift(q, 1)]?.[code]; if (x.COMP && nx?.COMP) { X.push(featVec(x)); y.push(nx.COMP); } }
  if (X.length < 30) return null;
  const model = fitLogit(X, y), out = {};
  for (const [code, x] of Object.entries(panel[last])) if (x.COMP) { const p = model(featVec(x)); out[code] = { grade: CL[p.indexOf(Math.max(...p))], p }; }
  return { origin: last, target: qShift(last, 1), pairs: X.length, grades: out };
}

// ---------- 분기 업로드: 신보 '|' 구분 원자료 4종 · 카드 CSV ----------
export function decode(buf) { try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { return new TextDecoder('euc-kr').decode(buf); } }
export function parseDelimited(text) {
  const t = text.replace(/^\uFEFF/, '');
  if (t.trimStart().startsWith('{')) return t.split(/\r?\n/).filter(l => l.trim()).map(l => Object.fromEntries(Object.entries(JSON.parse(l)).map(([k, v]) => [k, String(v ?? '').trim()])));
  const nl = t.search(/\r?\n/), first = nl < 0 ? t : t.slice(0, nl), sep = first.includes('|') ? '|' : ',', rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; continue; }
    if (ch === '"') q = true; else if (ch === sep) { row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some(v => v.trim())) rows.push(row); row = []; } else cur += ch;
  }
  row.push(cur); if (row.some(v => v.trim())) rows.push(row);
  const head = rows[0].map(v => v.trim());
  return rows.slice(1).map(v => Object.fromEntries(head.map((k, i) => [k, (v[i] ?? '').trim()])));
}
const pick = (r, ...keys) => { for (const k of keys) if (r[k] != null && r[k] !== '') return r[k]; return ''; };
const qOf = c => `${c.slice(0, 4)}Q${c.slice(4, 5)}`;
export function kindOf(rows) {
  const k = Object.keys(rows[0] || {});
  if (k.includes('CNVRSN_RNTCHRG')) return 'rent'; if (k.includes('THSMON_SELNG_AMT')) return 'sales'; if (k.includes('OPBIZ_STOR_CO')) return 'stores'; if (k.includes('TRDAR_CHNGE_IX')) return 'change';
  if (k.includes('official_grid_id') && k.includes('card_amount')) return 'card';
  if (k.includes('grid_50_id') && k.includes('industry')) return 'allind';
  if (k.some(x => ['APVPERMYMD', '인허가일자'].includes(x)) && k.some(x => ['TRDSTATENM', '영업상태명'].includes(x))) return 'license'; return null;
}
export function ingest(rows, kind, up = { dong: {}, grid: {} }, base = null) {
  if (kind === 'license') {   // LOCALDATA 일반음식점·휴게음식점·제과점 전체 스냅숏: 관리번호 가운데 코드(101·104·121)별로 기본 자료를 교체
    const loc = makeGridLocator(base.gridWgs), excl = new Set(base.licExcluded), bout = new Set(base.licBoutique), byType = {};
    for (const r of rows) {
      const mgt = pick(r, 'MGTNO', '관리번호'), type = mgt.split('-')[1], ut = pick(r, 'UPTAENM', '업태구분명'), st = pick(r, 'TRDSTATENM', '영업상태명');
      const apv = ymd(pick(r, 'APVPERMYMD', '인허가일자')), closed = st.includes('폐업'), dcb = closed ? ymd(pick(r, 'DCBYMD', '폐업일자')) : 0;
      if (!type) continue; byType[type] ||= [];
      if (excl.has(ut) || !apv || (closed && !dcb)) continue;
      const x = parseFloat(pick(r, 'X', '좌표정보(X)', '좌표정보(x)')), y = parseFloat(pick(r, 'Y', '좌표정보(Y)', '좌표정보(y)'));
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const [lon, lat] = tm5174ToWgs(x, y), id = loc(lon, lat); if (id) byType[type].push([mgt, id, apv, dcb, bout.has(ut) ? 1 : 0]);
    }
    Object.assign((up.lic ||= {}), byType); return up;
  }
  if (kind === 'allind') {    // 신한 전 업종 50m 추출(내국인·외국인 표별로 보관 후 합산)
    const non = new Set(base.nonplace), food = new Set(base.food), res = new Set(base.resid), parts = (up.allindParts ||= {});
    for (const r of rows) {
      if (non.has(r.industry)) continue; const id = base.grid50[r.grid_50_id]; if (!id) continue;
      const ym = r.ym.replace(/[^0-9]/g, '').slice(0, 6), q = `${ym.slice(0, 4)}Q${Math.floor((+ym.slice(4, 6) - 1) / 3) + 1}`, amt = Number(r.card_amount) || 0;
      const a = (((parts[r.source_table || 'upload'] ||= {})[q] ||= {})[id] ||= [0, 0, 0, 0, []]);
      a[0] += amt; if (food.has(r.industry)) a[1] += amt; if (res.has(r.industry)) a[2] += amt; a[3] += Number(r.card_count) || 0; if (!a[4].includes(ym)) a[4].push(ym);
    }
    return up;
  }
  const put = (q, code, f) => { const r = ((up.dong[q] ||= {})[code] ||= {}); f(r); };
  const sd = rows.filter(r => (r.ADSTRD_CD || '').startsWith('11200')), num = v => (v === '' || v == null ? null : Number(v));
  if (kind === 'rent') for (const r of sd) if (num(r.RENT_FLOOR_CD) === 1) put(qOf(r.STDR_YYQU_CD), r.ADSTRD_CD, x => { x.rent = num(r.CNVRSN_RNTCHRG); x.rentCo = num(r.RENT_CO); });
  if (kind === 'sales') for (const r of sd) if (r.SVC_INDUTY_CD.startsWith('CS1')) put(qOf(r.STDR_YYQU_CD), r.ADSTRD_CD, x => { x.salesAmt = (x._s ? x.salesAmt : 0) + num(r.THSMON_SELNG_AMT); x.salesStores = (x._s ? x.salesStores : 0) + num(r.STOR_CO); x._s = 1; });
  if (kind === 'stores') for (const r of sd) put(qOf(r.STDR_YYQU_CD), r.ADSTRD_CD, x => { if (!x._t) Object.assign(x, { stores: 0, open: 0, close: 0, cs1: 0, cs2: 0, cs3: 0, _t: 1 }); x.stores += num(r.STOR_CO); x.open += num(r.OPBIZ_STOR_CO); x.close += num(r.CLSBIZ_STOR_CO); const g = r.SVC_INDUTY_CD.slice(0, 3).toLowerCase(); if (g in x) x[g] += num(r.STOR_CO); });
  if (kind === 'change') for (const r of sd) put(qOf(r.STDR_YYQU_CD), r.ADSTRD_CD, x => Object.assign(x, { opr: num(r.OPR_SALE_MT_AVRG), cls: num(r.CLS_SALE_MT_AVRG), suOpr: num(r.SU_OPR_SALE_MT_AVRG), suCls: num(r.SU_CLS_SALE_MT_AVRG) }));
  if (kind === 'card') {
    const acc = {};
    for (const r of rows) {
      const q = r.quarter || (r.ref_month ? `${r.ref_month.slice(0, 4)}Q${Math.floor((+r.ref_month.slice(5, 7) - 1) / 3) + 1}` : null); if (!q) continue;
      const a = ((acc[q] ||= {})[r.official_grid_id] ||= { amt: 0, cnt: 0, m: new Set(), months: 0 });
      a.amt += num(r.card_amount) || 0; a.cnt += num(r.card_count) || 0; if (r.ref_month) a.m.add(r.ref_month.slice(0, 7)); else a.months = num(r.months_observed) || 0;
    }
    for (const [q, g] of Object.entries(acc)) for (const [id, a] of Object.entries(g)) (up.grid[q] ||= {})[id] = { amt: a.amt, cnt: a.cnt, months: a.m.size || a.months };
  }
  for (const q of Object.keys(up.dong)) for (const x of Object.values(up.dong[q])) { delete x._s; delete x._t; }
  return up;
}
export function loadUploads() { try { return JSON.parse(localStorage.getItem(UPLOAD_KEY) || 'null') || { dong: {}, grid: {}, log: [] }; } catch { return { dong: {}, grid: {}, log: [] }; } }
export function saveUploads(up) { try { localStorage.setItem(UPLOAD_KEY, JSON.stringify(up)); return true; } catch { return false; } }

// ---------- 화면 ----------
export function buildModel(base, up, data) {
  const merged = mergeData(base, up), panel = dongPanel(merged.dong);
  const gridDong = Object.fromEntries(data.grids.map(g => [g.id, g.dongCode]));
  const grid = gridGrades(merged.grid, panel, gridDong);
  const quarters = Object.keys(panel).filter(q => Object.values(panel[q]).some(x => x.C1 || x.C2)).sort();
  const gq = quarters.filter(q => q >= '2023Q1'), g1 = gridGrades(merged.grid, panel, gridDong, false);
  const lic = licenseGrades(mergeLicenses(base, up), gq), ai = allIndustryGrades(mergeAllInd(base, up));
  return { panel, grid, quarters, forecast: forecastNext(panel), merged, gridC: gridComposite(g1, lic, ai, gq) };
}
const badge = g => `<span class="grade-badge" style="--g:${GRADE[g || 'none'].color};--gi:${GRADE[g || 'none'].ink}">${h(g || '데이터 부족')}</span>`;
function dongMap(gs, data, layer, q, focus) {   // layer: 행정동 등급 키, 'GRID'(임대료–카드), 'GRIDC'(격자 종합)
  const grades = gs.panel[q] || {}, xs = data.dongs.flatMap(d => (d.geometry.type === 'Polygon' ? [d.geometry.coordinates] : d.geometry.coordinates).flat(3));
  let a = Infinity, b = Infinity, c = -Infinity, e = -Infinity; for (let i = 0; i < xs.length; i += 2) { a = Math.min(a, xs[i]); c = Math.max(c, xs[i]); b = Math.min(b, xs[i + 1]); e = Math.max(e, xs[i + 1]); }
  const box = [a - 16, b - 16, c - a + 32, e - b + 32];
  const GN = ['임대료–카드', '개폐업', '영업기간', '업종 교체'];
  const cells = layer === 'GRID' ? data.grids.map(g => { const gr = gs.grid[q]?.[g.id]; return `<path d="${pathFor(g.geometry)}" ${gr ? `fill="${GRADE[gr].color}" fill-opacity=".72" stroke="#ffffff" stroke-width=".6"` : 'fill="none" stroke="#8a8a85" stroke-width=".5" stroke-dasharray="2 2"'}><title>${h(g.id)} · ${h(g.dong)} · ${h(gr || '데이터 부족')}</title></path>`; }).join('')
    : layer === 'GRIDC' ? data.grids.map(g => { const x = gs.gridC[q]?.[g.id]; return `<path d="${pathFor(g.geometry)}" ${x ? `fill="${GRADE[x.GC].color}" fill-opacity=".72" stroke="#ffffff" stroke-width=".6"` : 'fill="none" stroke="#8a8a85" stroke-width=".5" stroke-dasharray="2 2"'}><title>${h(g.id)} · ${h(g.dong)} · ${h(x ? `종합 ${x.GC} (위험 신호 ${x.R}/4) · ` + x.parts.map((p, i) => `${GN[i]} ${p}`).join(' · ') : '데이터 부족')}</title></path>`; }).join('') : '';
  if (layer === 'GRIDC') layer = 'GRID';
  const dongs = data.dongs.map(d => { const x = grades[d.code] || {}, gr = layer === 'GRID' ? null : x[layer];
    return `<path data-gdong="${d.code}" d="${pathFor(d.geometry)}" fill="${layer === 'GRID' || !gr ? 'transparent' : GRADE[gr].color}" fill-opacity=".55" stroke="${d.seongsu ? '#0b0b0b' : '#52514e'}" stroke-width="${d.seongsu ? 2.4 : 1.1}" class="grade-dong ${focus === d.code ? 'focus' : ''}" tabindex="0" role="button" aria-label="${h(d.name)} ${h(gr || '')}"><title>${h(d.name)} · ${h(COMPONENTS[layer] || '격자')} ${h(gr || '')}</title></path>`; }).join('');
  const labels = data.dongs.map(d => { const gr = layer === 'GRID' ? null : grades[d.code]?.[layer]; return `<text x="${d.center[0]}" y="${d.center[1]}" class="grade-label" fill="#0b0b0b">${h(d.name)}${gr ? `<tspan x="${d.center[0]}" dy="1.15em">${gr}</tspan>` : ''}</text>`; }).join('');
  return `<svg class="grade-map" viewBox="${box.join(' ')}" role="group" aria-label="성동구 행정동 ${h(COMPONENTS[layer] || '격자')} 등급 지도"><image href="/assets/seongdong-map.webp" x="0" y="0" width="1024" height="1024" class="grade-basemap"/>${cells}${dongs}<g pointer-events="none">${labels}</g></svg>`;
}
function flowMatrix(gs, data, layer) {
  const qs = gs.quarters.filter(q => Object.values(gs.panel[q]).some(x => x[layer])).slice(-13);
  return `<div class="flow-scroll"><table class="flow-table"><thead><tr><th>행정동</th>${qs.map(q => `<th>${q.replace('Q', '.')}</th>`).join('')}</tr></thead><tbody>${data.dongs.map(d => `<tr><th>${h(d.name)}${SEONGSU.has(d.code) ? ' ●' : ''}</th>${qs.map(q => { const g = gs.panel[q]?.[d.code]?.[layer]; return `<td style="--g:${GRADE[g || 'none'].color};--gi:${GRADE[g || 'none'].ink}" title="${h(d.name)} ${q} ${h(g || '데이터 부족')}">${g ? g[0] : '–'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
}
export function gradesPage(st, data) {
  const gs = st.grades; if (!gs) return `<div class="panel"><p>등급 자료 불러오는 중</p></div>`;
  const layer = st.gLayer, q = gs.quarters.includes(st.gQuarter) ? st.gQuarter : gs.quarters.filter(x => Object.values(gs.panel[x]).some(v => v.COMP)).at(-1), cur = gs.panel[q] || {};
  const isGrid = layer === 'GRID' || layer === 'GRIDC', key = isGrid ? null : layer, counts = Object.fromEntries(CL.map(c => [c, 0])); let none = 0;
  const gval = id => layer === 'GRIDC' ? gs.gridC[q]?.[id]?.GC : gs.grid[q]?.[id];
  if (key) for (const d of data.dongs) cur[d.code]?.[key] ? counts[cur[d.code][key]]++ : none++; else for (const g of data.grids) gval(g.id) ? counts[gval(g.id)]++ : none++;
  const f = gs.forecast, fd = st.gDong && data.dongs.find(d => d.code === st.gDong), fx = fd && cur[fd.code];
  const streak = code => { let n = 0, x = q; while (gs.panel[x]?.[code]?.COMP === '위험') { n++; x = qShift(x, -1); } return n; };
  const alerts = data.dongs.map(d => ({ d, n: streak(d.code) })).filter(a => a.n > 0).sort((a, b) => b.n - a.n);
  const up = st.gUploads, upQs = [...new Set([...Object.keys(up.dong || {}), ...Object.keys(up.grid || {})])].sort();
  return `<div class="page-title"><div><p class="eyebrow">젠트리피케이션 대응 상권 모니터링</p><h1>등급 모니터링</h1><p class="subtitle">임대료–매출·개폐업·영업기간·업종 교체 4개 구성 등급과 종합 등급, 250m 격자 등급의 분기별 조회·다음 분기 예측·분기 자료 업로드</p></div></div>
  <div class="map-toolbar"><div class="control"><label for="g-quarter">기준 분기</label><select id="g-quarter">${gs.quarters.slice().reverse().map(x => `<option value="${x}" ${x === q ? 'selected' : ''}>${x}${upQs.includes(x) ? ' · 업로드' : ''}</option>`).join('')}</select></div>
  <div class="control"><label for="g-layer">표시 등급</label><select id="g-layer">${Object.entries({ ...COMPONENTS, GRIDC: '250m 격자 종합', GRID: '250m 격자 임대료–카드매출' }).map(([k, v]) => `<option value="${k}" ${k === layer ? 'selected' : ''}>${h(v)}</option>`).join('')}</select></div>
  <div class="grade-counts">${CL.slice().reverse().map(c => `<span>${badge(c)}<b>${counts[c]}</b></span>`).join('')}<span>${badge(null)}<b>${none}</b></span></div></div>
  <div class="grade-grid"><section class="panel grade-map-panel"><h2>${h(q)} · ${h(layer === 'GRIDC' ? '250m 격자 종합 등급' : layer === 'GRID' ? '250m 격자 임대료–카드매출 등급' : COMPONENTS[layer] + ' 등급')}</h2>${dongMap(gs, data, layer, q, st.gDong)}<p class="small-copy">${h(RULES[layer])}</p><p class="small-copy">검증: ${h(VALIDATION[layer])}. 실제 임대료 부담·내몰림 판정이 아닌 참고 등급. 배경지도 © OpenStreetMap contributors.</p></section>
  <aside class="grade-side">
    <section class="panel"><h2>${fd ? h(fd.name) : '행정동 선택'}</h2>${fd ? `<table class="data-table"><tbody>${Object.entries(COMPONENTS).map(([k, v]) => `<tr><td>${h(v)}</td><td>${badge(fx?.[k])}</td></tr>`).join('')}<tr><td>위험 신호 수</td><td><b>${fx?.R ?? '–'} / 4</b></td></tr><tr><td>종합 위험 연속</td><td><b>${streak(fd.code)}분기</b></td></tr>${f?.grades[fd.code] && f.origin === q ? `<tr><td>${f.target} 예측</td><td>${badge(f.grades[fd.code].grade)}</td></tr>` : ''}</tbody></table>` : '<p class="small-copy">지도에서 행정동을 누르면 구성 등급·위험 신호 수·다음 분기 예측 표시</p>'}</section>
    <section class="panel"><h2>점검 대상 (${h(q)})</h2>${alerts.length ? `<ul class="alert-list">${alerts.map(a => `<li><button data-gdong="${a.d.code}" class="text-button">${h(a.d.name)}</button><span>${a.n >= 2 ? '<b>정밀 진단</b>' : '관찰 강화'} · 종합 위험 ${a.n}분기 연속</span></li>`).join('')}</ul>` : '<p class="small-copy">종합 위험 동 없음</p>'}</section>
    ${f ? `<section class="panel"><h2>${f.target} 종합 등급 예측</h2><p class="small-copy">원점 ${f.origin} · 학습 ${f.pairs}쌍 · 브라우저에서 매 분기 재학습</p><div class="forecast-list">${data.dongs.map(d => f.grades[d.code] ? `<span>${h(d.name)} ${badge(f.grades[d.code].grade)}</span>` : '').join('')}</div></section>` : ''}
  </aside></div>
  <section class="panel"><h2>변화 흐름 · ${h(isGrid ? '종합' : COMPONENTS[layer])} (최근 13개 분기, ● 성수 4개 동)</h2>${flowMatrix(gs, data, isGrid ? 'COMP' : layer)}</section>
  <section class="panel"><h2>활용 지침</h2><table class="data-table"><thead><tr><th>등급 상황</th><th>조치 수준</th><th>내용</th></tr></thead><tbody>${GUIDE.map(r => `<tr><td><b>${h(r[0])}</b></td><td>${h(r[1])}</td><td>${h(r[2])}</td></tr>`).join('')}</tbody></table>
  <table class="data-table"><thead><tr><th>위험 구성 등급</th><th>의미</th><th>검토 수단</th></tr></thead><tbody>${GUIDE_COMPONENT.map(r => `<tr><td><b>${h(r[0])}</b></td><td>${h(r[1])}</td><td>${h(r[2])}</td></tr>`).join('')}</tbody></table>
  <p class="small-copy">등급은 행정동 평균값 기반 참고 지표. 개별 임대인·임차인 제재, 지원사업 적격 판정, 구역 지정의 단독 근거로 사용 불가.</p></section>
  <section class="panel"><h2>사전 예측 채점 · ${h(st.gIssued?.target || '2026Q2')}</h2>${scorePanel(gs, st.gIssued)}</section>
  <section class="panel" id="grade-upload"><h2>분기 자료 업로드</h2><p class="small-copy">신보 행정동 분기 원자료 4종(TBSM_ADSTRD_RENT_CURPRC_QU · SELNG_QU · STOR_QU · TRDAR_IX_QU, '|' 구분)과 카드 격자 CSV(official_grid_id, ref_month 또는 quarter, card_amount, card_count[, months_observed]), LOCALDATA 일반음식점·휴게음식점·제과점 인허가 파일(CSV 또는 JSONL, 업소 전체), 신한 전 업종 50m 추출 CSV(grid_50_id, ym, industry, card_amount, card_count)를 선택. 파일 종류·분기 자동 인식, 성동구 행정동·격자만 추출해 이 브라우저에 저장 후 등급 즉시 재계산. 서버 전송 없음.</p>
  <div class="form-actions"><input type="file" id="g-files" multiple accept=".csv,.txt"><button class="button small ghost" data-gact="export">${icon('download')}업로드 자료 내보내기</button><label class="button small ghost">${icon('plus')}업로드 자료 가져오기<input type="file" id="g-import" accept=".json" hidden></label><button class="button small ghost" data-gact="reset">업로드 초기화</button></div>
  ${UPLOAD_GUIDE}
  ${up.log?.length ? `<table class="data-table"><thead><tr><th>시각</th><th>파일</th><th>종류</th><th>분기</th><th>행</th></tr></thead><tbody>${up.log.slice(-12).reverse().map(l => `<tr><td>${h(l.at)}</td><td>${h(l.file)}</td><td>${h(l.kind || '인식 불가')}</td><td>${h(l.quarters.join(', '))}</td><td>${l.rows}</td></tr>`).join('')}</tbody></table>` : '<p class="small-copy">업로드 기록 없음 · 기본 자료 2022Q1~2026Q1(신보), 2022Q1~2026Q2(식음료 카드), 2021Q1~2026Q3(전 업종 카드), 2026-09-26~28 수집(인허가)</p>'}</section>`;
}
const fmt = (v, d = 3) => (v == null ? '–' : (+v).toFixed(d));
function scorePanel(gs, iss) {
  if (!iss) return '<p class="small-copy">발행 예측 파일을 불러오지 못함</p>';
  const rows = Object.entries(iss.sets).map(([k, set]) => {
    const r = scoreIssued(set.rows, observedGetter(gs, k, iss.target));
    const verdict = r.auc == null ? `채점 대기 · ${iss.target} 관측 ${r.n}건` : r.pass ? '<b>통과</b>' : '미달';
    return `<tr><td><b>${h(set.label)}</b><br><span class="small-copy">발행 ${h(set.issuedAt.slice(0, 16).replace('T', ' '))} · SHA-256 ${h(set.sha256.slice(0, 10))}…</span></td><td>${r.issued}</td><td>${r.n}</td><td>${r.acc == null ? '–' : `${(r.acc * 100).toFixed(1)}% (우연 ${(r.chance * 100).toFixed(1)}%)`}</td><td>${fmt(r.auc)}</td><td>${fmt(r.p, 4)}</td><td>${verdict}</td></tr>`;
  }).join('');
  return `<p class="small-copy">원점 ${h(iss.origin)}에서 ${h(iss.target)} 자료가 나오기 전에 발행해 둔 예측. ${h(iss.target)} 자료를 업로드하면 같은 규칙으로 관측 등급을 계산해 자동 채점(거시 AUC > 0.5이고 순열 p < 0.05면 통과, 순열 2,000회). 행정동은 17개뿐이라 한 분기로는 검정력이 낮아 이후 분기와 함께 판단.</p>
  <table class="data-table"><thead><tr><th>예측</th><th>발행</th><th>관측</th><th>정확도</th><th>거시 AUC</th><th>p</th><th>판정</th></tr></thead><tbody>${rows}</tbody></table>`;
}
const UPLOAD_GUIDE = `<details class="upload-guide"><summary>분기 업로드 안내 (성동구 담당자용)</summary>
<ol>
<li><b>주기</b>: 분기마다 1회. 신보 분기 자료가 공개된 뒤, 같은 분기의 카드·인허가 자료와 함께 올림.</li>
<li><b>신보 행정동 분기 원자료 4종</b>(서울신용보증재단 상권 데이터, 분기 폴더의 <code>04.행정동</code>): <code>TBSM_ADSTRD_RENT_CURPRC_QU</code>(임대료), <code>TBSM_ADSTRD_SELNG_QU</code>(매출), <code>TBSM_ADSTRD_STOR_QU</code>(점포·개폐업), <code>TBSM_ADSTRD_TRDAR_IX_QU</code>(영업기간). '|' 구분 원본 그대로, 파일명 변경 불필요. 서울 전체가 들어 있어도 성동구 행정동만 추출.</li>
<li><b>신한카드 250m 격자 식음료</b>: <code>official_grid_id, ref_month(YYYY-MM), card_amount, card_count</code> 열의 CSV(월별 행). 분기 3개월이 모두 있어야 그 분기 격자 등급 산출. 형식 예시: <code>/data/grades/card_upload_template.csv</code>.</li>
<li><b>신한카드 전 업종 50m 추출</b>(격자 종합의 업종 교체): <code>source_table, ym, grid_50_id, industry, card_amount, card_count</code> 열의 CSV. 내국인·외국인 두 파일을 모두 올림.</li>
<li><b>LOCALDATA 인허가</b>(격자 종합의 개폐업·영업기간): 서울 열린데이터광장 또는 지방행정 인허가데이터의 일반음식점·휴게음식점·제과점영업 <b>업소 전체</b> 파일(CSV 또는 OpenAPI JSONL). 올릴 때마다 해당 업종 자료 전체를 교체하므로 일부만 잘라 올리지 않음.</li>
<li><b>확인</b>: 아래 업로드 기록에서 파일 종류·분기·행 수 확인 → '기준 분기'에 새 분기가 '· 업로드'로 표시되면 반영 완료. 행정동 종합·구성 등급, 격자 등급, 다음 분기 예측, 사전 예측 채점이 자동 갱신.</li>
<li><b>보관·공유</b>: 업로드 자료는 이 브라우저에만 저장(서버 전송 없음). '업로드 자료 내보내기'로 JSON을 보관하고, 다른 PC·담당자는 '가져오기'로 같은 상태를 재현.</li>
<li><b>주의</b>: 브라우저 저장공간 삭제 시 업로드 자료가 사라짐 → 분기마다 내보내기 파일 보관. 인식 불가로 표시된 파일은 열 이름이 원본과 다른 경우이므로 원본 파일로 다시 올림.</li>
</ol></details>`;
export async function handleFiles(files, up, base) {
  for (const file of files) {
    const rows = parseDelimited(decode(await file.arrayBuffer())), kind = kindOf(rows);
    if (kind) ingest(rows, kind, up, base);
    const quarters = kind === 'license' ? ['전체 스냅숏'] : kind === 'allind' ? [...new Set(rows.map(r => { const y = r.ym.replace(/[^0-9]/g, ''); return `${y.slice(0, 4)}Q${Math.floor((+y.slice(4, 6) - 1) / 3) + 1}`; }))].sort() : kind === 'card' ? [...new Set(rows.map(r => r.quarter || (r.ref_month ? `${r.ref_month.slice(0, 4)}Q${Math.floor((+r.ref_month.slice(5, 7) - 1) / 3) + 1}` : '')))].filter(Boolean) : [...new Set(rows.map(r => r.STDR_YYQU_CD && qOf(r.STDR_YYQU_CD)))].filter(Boolean);
    (up.log ||= []).push({ at: new Date().toLocaleString('ko-KR'), file: file.name, kind, quarters, rows: rows.length });
  }
  return up;
}
