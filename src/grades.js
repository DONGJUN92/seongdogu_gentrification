// 등급 모니터링: 서울신용보증재단 행정동 분기 자료·카드·인허가 자료 → 행정동 항목 등급 4종·종합 등급, 250m 격자 등급, 다음 분기 예측 (연구 프로토콜 38·39·41·42 규칙)
import { escapeHtml as h, pathFor } from './core.js';
import { icon } from './icons.js';

export const CL = ['쇠퇴', '활성', '위험'];
export const GRADE = { 활성: { color: '#0ca30c', ink: '#ffffff' }, 쇠퇴: { color: '#fab219', ink: '#0b0b0b' }, 위험: { color: '#d03b3b', ink: '#ffffff' }, none: { color: '#e1e0d9', ink: '#52514e' } };
export const COMPONENTS = { COMP: '종합', C1: '임대료·매출', C2: '개·폐업', C3: '영업기간', C4: '업종 변화', C6: '온라인 관심도(참고)' };
export const RULES = {
  C1: '소속 행정동의 1층 환산임대료 상승률이 서울 소규모 상가 임대가격지수(한국부동산원) 상승률보다 높고, 임대료 상승률과 외식업 점포당 매출 증가율의 차이가 서울의 같은 차이보다 크면 위험으로 봅니다. 점포당 매출은 서울 기준점과 같은 방식(외식 매출 ÷ 점포 자료의 외식 점포 수)으로 계산합니다. 임대료 상승률이 서울 이하이면서 매출 증가율이 서울 행정동 중앙값보다 낮으면 쇠퇴, 그 밖에는 활성입니다. 전년 같은 분기와 비교합니다.',
  C2: '개업률과 폐업률이 모두 같은 분기 서울 행정동 중앙값보다 높을 확률이 0.8을 넘으면 위험(점포 교체 과다), 순폐업률(폐업률 − 개업률)이 서울 행정동 중앙값보다 높을 확률이 0.8을 넘으면 쇠퇴, 그 밖에는 활성으로 봅니다. 분기 개·폐업 수가 적어 생기는 우연 변동을 거르기 위해 격자와 같은 경험적 베이즈 추정(Clayton·Kaldor 1987)과 사후확률 0.8 기준(Richardson 외 2004)을 씁니다. 어느 쪽으로도 0.8을 넘지 않으면 근거 부족으로 표시합니다.',
  C3: '폐업 점포의 평균 영업기간이 서울 평균 이상이면서 영업 중인 점포의 평균 영업기간이 서울 평균 미만이면 위험(오래 영업한 점포의 이탈), 영업 중인 점포의 평균 영업기간이 서울 평균 이상이면 쇠퇴, 그 밖에는 활성으로 봅니다.',
  C4: '외식업 점포 비중 증가폭이 서울 행정동 중앙값보다 크면서 생활밀착(서비스·소매) 점포 증감률이 서울 중앙값보다 낮으면 위험(업종 전환), 전체 점포 증감률이 서울 중앙값보다 낮으면 쇠퇴, 그 밖에는 활성으로 봅니다. 전년 같은 분기와 비교합니다.',
  COMP: '4개 항목 중 위험이 3개 이상이면 위험, 쇠퇴가 2개 이상이면 쇠퇴, 그 밖에는 활성으로 봅니다. 각 항목은 서울 값을 기준점으로 비교합니다(Ding 외 2016, 서울시 상권변화지표).',
  GRID: '격자 안 카드 외식 매출 증가율과 소속 행정동의 임대료 상승률을 행정동 임대료·매출 항목과 같은 방식으로 서울 기준점(부동산원 서울 임대가격지수, 서울 행정동 외식 매출 증가율 중앙값)과 비교합니다. 분기 외식 카드 결제가 30건 미만(NCHS 정밀도 기준)이거나, 3개월 중 빠진 달이 있거나, 전년 같은 분기 자료가 없으면 자료 부족으로 표시합니다. 성동구 면적이 50% 이하인 격자 40곳은 등급을 내지 않고, 카드 자료는 중심이 성동구 안에 있는 50m 칸만 집계합니다(경계 보정).',
  GRIDC: '격자별 임대료·카드매출, 개·폐업(외식업 인허가, 최근 1년), 영업기간(외식업 인허가), 업종 변화(전 업종 카드) 중 위험이 3개 이상이면 위험, 쇠퇴가 2개 이상이면 쇠퇴로 봅니다. 기준점은 모두 서울 값입니다. 격자마다 업소 수가 적어 개·폐업률과 평균 영업기간은 경험적 베이즈로 추정하고(Clayton·Kaldor 1987), 서울보다 높거나 낮을 확률이 0.8을 넘을 때만 위험·쇠퇴로 봅니다(Richardson 외 2004). 어느 쪽으로도 0.8을 넘지 않아 활성이 된 격자는 근거 부족으로 옅게 표시합니다(이 방식으로 산출 격자가 63곳에서 157곳으로 늘었습니다). 격자를 누르면 값과 서울 기준, 항목별 판정을 볼 수 있습니다. 일부 항목만 있는 격자는 종합을 내지 않고 항목만 보여 줍니다. 성동구 면적이 50% 이하인 격자 40곳은 등급을 내지 않고, 카드 자료는 중심이 성동구 안에 있는 50m 칸만 집계합니다(경계 보정).',
  POPUP: '성동구가 인스타그램·블로그 등을 통해 주간 단위로 집계한 성수동 팝업 현황을 도로명주소로 250m 격자에 배정한 값입니다. 색은 관측 주마다 운영 중인 팝업 수의 평균이고, 격자를 누르면 팝업 건수와 건물 수(같은 건물의 반복 사용)를 보여 줍니다. 종합 등급에 넣지 않는 참고 신호입니다.',
  POPWEB: '네이버 블로그·뉴스를 매일 검색해(성수 팝업, 성수동 팝업, 성수 팝업스토어, 성수동 팝업스토어) 제목에 팝업과 성수 지역어가 있는 글을 모으고, 글에 도로명주소가 있으면 250m 격자에 배정해 센 값입니다. 팝업 수가 아니라 온라인 언급량이며 종합 등급에 넣지 않는 참고 신호입니다.',
  C6: '네이버 검색어 트렌드(법정동·도로명과 맛집·카페·쇼핑·팝업·나들이를 합한 검색어)의 전년 같은 분기 대비 변화가 0보다 크고 같은 분기 성동구 중앙값보다 크면 위험(관심 급증), 0보다 작고 중앙값보다 작으면 쇠퇴, 그 밖에는 활성으로 봅니다. 종합 등급에 넣지 않는 참고 항목입니다.',
  WEB: '네이버 블로그 게시글 가운데 성동구 외식업소 상호와 연결된 글을 격자별로 센 값입니다(최근 4개 분기). 사람 검수 없이 자동 규칙(지명이거나 2글자 이하인 상호, 업소 여러 곳에 연결된 글 제외)만 적용했습니다. 최근 글이 많이 잡히는 수집 시점 편향은 분기 층화 추출로 맞췄습니다(분기마다 같은 건수를 뽑았을 때의 기대 건수). 매일 자동으로 수집해 분기별로 쌓고 지도에는 완료된 최근 4개 분기만 씁니다. 광고성 글은 걸러내지 않았습니다.',
};
export const VALIDATION = {
  COMP: '다음 분기 등급 적중률 78.5%로 현재 등급을 그대로 둘 때(79.1%)와 비슷합니다(무작위 배정 시 65.0%). 변별력(AUC)은 0.739로 현재 등급 유지(0.691)보다 높고 통계적으로 유의합니다(2023년 4분기~2026년 1분기, 163건). 쇠퇴 등급은 이후 1년 점포 감소를 구분합니다(AUC 0.728). 위험은 2023년 1분기~2026년 1분기 212건 중 17건입니다.',
  C1: '다음 분기 등급 적중률 63.2%(현재 등급을 그대로 둘 때 67.5%, 무작위 배정 시 33.4%), 통계적으로 유의합니다.',
  C2: '다음 분기 등급 적중률 84.7%(현재 등급을 그대로 둘 때 75.3%, 무작위 배정 시 74.0%), 통계적으로 유의합니다. 위험·쇠퇴 판정이 참일 확률은 평균 0.83입니다(현행 점추정 판정은 0.66).',
  C3: '다음 분기 등급 적중률 98.2%. 분기마다 거의 바뀌지 않는 항목입니다.',
  C4: '다음 분기 등급 적중률 77.1%(현재 등급을 그대로 둘 때 80.6%, 무작위 배정 시 44.2%), 통계적으로 유의합니다.',
  GRID: '다음 분기 등급 적중률 66.5%(현재 등급을 그대로 둘 때 67.5%, 무작위 배정 시 36.1%), 변별력(AUC) 0.807로 통계적으로 유의합니다(경계 보정 후 2023년 3분기~2026년 1분기, 1,768건).',
  GRIDC: '다음 분기 등급 적중률 86.9%(현재 등급을 그대로 둘 때 85.2%, 무작위 배정 시 71.8%), 변별력(AUC) 0.842로 통계적으로 유의하며 같은 행정동 안에서도 격자 간 차이를 구분합니다(1,684건). 위험 격자는 드물어 2023년 1분기~2026년 1분기 2,021건 중 11건입니다. 개·폐업 판정의 44%, 영업기간 판정의 54%는 근거 부족으로 활성입니다.',
  C6: '다음 분기 등급 적중률 59.4%(현재 등급을 그대로 둘 때 57.1%, 무작위 배정 시 48.3%). 다른 4개 항목·종합 등급과 거의 일치하지 않고(일치도 kappa −0.06~0.05) 위험 비중이 약 37%로 높아, 이 항목만으로 점검 대상을 정하지 않습니다. 분기 자료 등록으로 갱신되지 않으며 연구진이 검색어 트렌드를 다시 받아 갱신합니다.',
  POPWEB: '등급·예측에 쓰지 않는 참고 지도입니다. 2025년 12월~2026년 8월 표본에서 구청 팝업 건수와 격자별 순위 상관이 0.85였습니다. 구청 목록도 온라인 자료 기반이라 실제 정확도를 뜻하지는 않습니다. 글에 주소가 있어야 격자에 배정되므로 위치가 잡히는 글은 약 12%이고, 시간 변화를 따라가는지는 아직 확인하지 못했습니다.',
  POPUP: '등급·예측에 쓰지 않는 참고 지도입니다. 성수동 4개 행정동만 다루고, 현재 제공된 주간 현황 표본으로 계산하므로 분기 추세로 해석하지 않습니다. 현장 조사 때 팝업이 몰린 곳을 확인하는 용도로 씁니다.',
  WEB: '등급·예측에 쓰지 않는 참고 지도입니다. 과거 시점 검증이 불가능한 자료여서 상권 변화 판단의 근거로 쓰지 않고, 현장 조사 때 온라인 노출이 많은 곳을 확인하는 용도로만 씁니다.',
};
export const GUIDE = [
  ['위험 2분기 연속', '정밀 진단', '현장 조사(공실·업종·임대 동향)와 상인·임대인 면담을 실시하고 위험 항목별 조치를 검토합니다. 지속가능발전구역·상생협약 검토 자료로 활용합니다.'],
  ['위험 1분기', '관찰 강화', '다음 분기 등급이 나오기 전에 위험으로 나온 항목의 원자료(임대료·개폐업·영업기간·업종 비중)를 확인합니다. 한 분기 결과만으로 조치하지 않습니다.'],
  ['쇠퇴', '상권 활성화 검토', '골목상권 활성화, 공실 대응, 소상공인 경영지원 사업의 대상 여부를 검토합니다.'],
  ['활성', '정기 확인', '분기별 갱신 때 등급 유지 여부를 확인합니다.'],
  ['다음 분기 위험 예측', '사전 대비', '적중률이 현재 등급을 그대로 둘 때와 비슷한(약 79%) 참고 정보입니다. 예측만으로 대상을 정하지 않고 실제 등급을 확인한 뒤 판단합니다.'],
];
export const CRITERIA_BASIS = [
  ['자본 재투자', '임대료가 영업 수익보다 빠르게 오름', '임대료·매출'],
  ['경관 변화', '점포가 빠르게 바뀜', '개·폐업'],
  ['사회적 상향', '주민 대상 업종이 방문객 대상 업종으로 바뀜', '업종 변화'],
  ['내몰림', '오래 영업한 점포가 떠남', '영업기간'],
];
export const CRITERIA_TABLE = [
  ['항목 구성', '임대료·매출, 개·폐업, 영업기간, 업종 변화', '선행연구', 'Davidson·Lees(2005)의 정의 요소를 상권 자료로 옮김. 점포 교체(churn)와 소규모 점포 감소는 상권 젠트리피케이션 지표(Meltzer·Capperis 2016, Chapple·Loukaitou-Sideris)', '등급은 내몰림을 직접 측정하지 않음'],
  ['비교 기준점', '서울 행정동 중앙값, 부동산원 서울 임대가격지수', '선행연구', '지역을 도시 전체 값과 비교(Bates 2013, Ding 외 2016, Freeman 2005)', '중앙값을 평균으로 바꿔도 항목 등급 95~99% 동일'],
  ['위험', '4개 항목 중 3개 이상', '선행연구 + 사전 시험', 'Bates(2013)는 지표 4개 중 3개 이상이면 취약 지역으로 판정. 이 연구는 2개·3개를 사전 비교(위험 동 비중 52.9% → 14.7%)', 'Bates는 주거 지역 기준. 위험 등급과 이후 1년 폐업률의 구분력 AUC 0.578'],
  ['쇠퇴', '4개 항목 중 2개 이상', '관례(부분 선례)', 'Bates(2013)는 지표 4개 중 특정 2개 조합도 인정, 텍사스대 오스틴 지도는 4개 중 2개 사용', '쇠퇴 등급과 이후 1년 점포 감소의 구분력 AUC 0.728. 1·3개보다 낫다는 근거는 없음'],
  ['개·폐업·영업기간 판정', '서울과 다를 확률 0.8 초과', '선행연구', '소지역 경험적 베이즈(Clayton·Kaldor 1987, Marshall 1991), 0.8 판정(Richardson 외 2004)', '행정동 개·폐업 판정이 맞을 확률 0.66 → 0.83. 0.8은 공간 평활 모형에서 검토된 값'],
  ['격자 카드 최소 건수', '분기 결제 30건, 3개월 관측', '선행연구', 'NCHS 정밀도 기준(30건 미만은 신뢰하기 어려움)', '건별 금액이 없어 오차는 계산 못함'],
  ['경계 격자', '성동구 면적 50% 이하 제외', '사전 시험', '결과를 보기 전에 규칙 등록(보정 전과 격자 종합 99.6% 일치)', '40곳 미산출'],
  ['상권 없는 격자', '추정하지 않고 미산출', '선행연구 + 시험', '상권 평가는 상업지역에 한정(Chapple·Loukaitou-Sideris). 이웃 격자로 가려 맞히는 시험에서 가장 많은 등급 일괄 적용보다 낮음', '빈 격자 117곳 중 106곳은 외식 인허가 0건'],
];
export const GUIDE_COMPONENT = [
  ['임대료·매출 위험', '임대료 상승이 매출 증가를 앞지름', '상생협약 체결 권고, 임대료 안정 협의, 안심상가 입주 수요 파악'],
  ['개·폐업 위험', '개업과 폐업이 함께 많은 점포 교체 과다', '폐업 사유 확인, 신규 창업자 정착 지원, 경영 컨설팅 연계'],
  ['영업기간 위험', '오래 영업한 점포가 문을 닫고 신규 점포가 들어섬', '장기 영업 점포 현황 확인, 노포(오래가게) 지원, 임대차 계약 갱신 상담'],
  ['업종 변화 위험', '생활밀착 점포 감소, 외식업 비중 증가', '생활밀착 업종 유지 지원, 지속가능발전구역 입점 제한 업종 검토 근거'],
];
const SEONGSU = new Set(['11200650', '11200660', '11200670', '11200690']);
const UPLOAD_KEY = 'seongdong-grade-uploads-v1';
export const qShift = (q, k) => { const n = (+q.slice(0, 4)) * 4 + (+q.slice(5)) - 1 + k; return `${Math.floor(n / 4)}Q${(n % 4) + 1}`; };
const pos = v => (typeof v === 'number' && v > 0 ? v : null);
const lg = (a, b) => (pos(a) && pos(b) ? Math.log(a / b) : null);

const num_ = v => (v == null || v === '' ? NaN : Number(v));
const fin = (...v) => v.every(Number.isFinite);
const plog = (a, b) => (a > 0 && b > 0 ? Math.log(a / b) : NaN);
export const median = a => { const v = a.filter(Number.isFinite).sort((x, y) => x - y), n = v.length; return n ? (n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2) : null; };

// ---------- 서울 기준점 (프로토콜 48) ----------
// 서울 행정동 집계 [점포, 개업, 폐업, 외식 점포, 생활밀착 점포, 외식 매출, 생활밀착 매출, 전체 매출] → 서울 행정동 중앙값
export function refFromAgg(cur, lag) {
  const c = { o: [], c: [], ds: [], gL: [], gT: [], sg: [], sgT: [], dsS: [], gLS: [], gTS: [] }, nk = [];
  for (const [code, r0] of Object.entries(cur || {})) {
    const [tot, op, cl, f, l, sF, sL, sT] = r0.map(num_), p = lag?.[code]?.map(num_) || new Array(8).fill(NaN), [tot4, , , f4, l4, sF4, sL4, sT4] = p;
    if (tot > 0 && fin(op, cl)) nk.push([tot, op, cl]);
    const pt = v => (v > 0 ? v : NaN), spp = sF / (f > 0 ? f : NaN), spp4 = sF4 / (f4 > 0 ? f4 : NaN);
    c.o.push(op / pt(tot)); c.c.push(cl / pt(tot));
    c.ds.push((f / pt(tot) - f4 / pt(tot4)) * 100); c.gL.push(plog(l, l4)); c.gT.push(plog(tot, tot4));
    c.sg.push(plog(spp, spp4)); c.sgT.push(plog(sF, sF4)); c.dsS.push((sF / pt(sT) - sF4 / pt(sT4)) * 100); c.gLS.push(plog(sL, sL4)); c.gTS.push(plog(sT, sT4));
  }
  const out = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, median(v)]));
  // 개·폐업 사후확률 판정(프로토콜 50)의 사전분포: 서울 행정동 Marshall 적률 분산(vo, vc)과 순폐업률 중앙값(mnet)
  if (nk.length) {
    const N = nk.reduce((a, r) => a + r[0], 0), nbar = N / nk.length;
    out.vo = nk.reduce((a, [n, k]) => a + n * (k / n - out.o) ** 2, 0) / N - out.o / nbar;
    out.vc = nk.reduce((a, [n, , k]) => a + n * (k / n - out.c) ** 2, 0) / N - out.c / nbar;
    out.mnet = median(nk.map(([n, o, cl]) => (cl - o) / n));
  }
  return out;
}
// 분기별 서울 기준점: 기본 자료(2026년 1분기까지) + 서울 전체 신보 파일을 등록한 분기. Rs = 부동산원 서울 소규모 상가 임대가격지수 전년 동분기 대비 로그 변화
export function seoulRefs(base, up) {
  const ref = structuredClone(base.seoulRef || {}), reb = { ...(base.reb || {}), ...(up?.reb || {}) }, agg = { ...(base.seoulDongAgg || {}), ...(up?.seoulAgg || {}) };
  for (const q of Object.keys(up?.seoulAgg || {}).sort()) ref[q] = refFromAgg(agg[q], agg[qShift(q, -4)]);
  for (const [q, r] of Object.entries(ref)) { const v = plog(reb[q], reb[qShift(q, -4)]); r.Rs = Number.isFinite(v) ? v : null; }
  return ref;
}
// 서울 외식업 인허가 기준점(일반·휴게음식점): 기본 자료 + 서울 전체 인허가 파일을 등록한 분기
export function seoulLicRefs(base, up) {
  const out = structuredClone(base.seoulLic || {}), parts = up?.seoulLicParts || {}, types = Object.keys(parts);
  if (!(types.includes('101') && types.includes('104'))) return out;
  for (const q of Object.keys(parts['101'])) {
    const s = ['101', '104'].map(t => parts[t][q]); if (!s.every(Boolean)) continue;
    const [N, N4, O, C, aS, aS2, cS, cS2] = [0, 1, 2, 3, 4, 5, 6, 7].map(i => s[0][i] + s[1][i]), A = aS / N, Cm = cS / C;
    out[q] = { o: O / N4, c: C / N4, A, C: Cm, sdA: Math.sqrt(Math.max(0, aS2 / N - A * A)), sdC: Math.sqrt(Math.max(0, cS2 / C - Cm * Cm)), N };
  }
  return out;
}

// ---------- 소지역 판정용 분포 함수 ----------
function lnGamma(z) {
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
  z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i); const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
export function gammaQ(a, x) {   // 상한 정규화 불완전 감마함수 Q(a, x) = P(Gamma(a, 1) > x)
  if (x <= 0) return 1;
  const gln = lnGamma(a);
  if (x < a + 1) { let ap = a, sum = 1 / a, del = sum; for (let n = 0; n < 1000; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; } return 1 - sum * Math.exp(-x + a * Math.log(x) - gln); }
  let b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, hh = d;
  for (let i = 1; i < 1000; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; hh *= del; if (Math.abs(del - 1) < 1e-15) break; }
  return Math.exp(-x + a * Math.log(x) - gln) * hh;
}
export function betaI(x, a, b) {   // 정규화 불완전 베타함수 I_x(a, b)
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  const cf = (x, a, b) => { const qab = a + b, qap = a + 1, qam = a - 1; let c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; let h = d;
    for (let m = 1; m < 3000; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break; }
    return h; };
  return x < (a + 1) / (a + b + 2) ? bt * cf(x, a, b) / a : 1 - bt * cf(1 - x, b, a) / b;
}
export function normSf(z) {   // 표준정규분포 P(Z > z)
  const t = 1 / (1 + 0.5 * Math.abs(z / Math.SQRT2)), y = t * Math.exp(-(z * z / 2) - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return z >= 0 ? y / 2 : 1 - y / 2;
}

export function gammaDiffSf(ao, bo, ac, bc, d, n = 1000) {   // P(λc − λo > d), λo ~ Gamma(ao, 비율 bo), λc ~ Gamma(ac, 비율 bc)
  const mu = ao / bo, sd = Math.sqrt(ao) / bo, lo = Math.max(0, mu - 12 * sd), hi = mu + 12 * sd, hh = (hi - lo) / n, lg0 = ao * Math.log(bo) - lnGamma(ao);
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const x = lo + hh * i, f = x > 0 ? Math.exp(lg0 + (ao - 1) * Math.log(x) - bo * x) : 0, y = x + d, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
    s += w * f * (y > 0 ? gammaQ(ac, bc * y) : 1);
  }
  return s * hh / 3;
}

// ---------- 등급 계산 ----------
// grid: 원래 정의(카드 식음료 = 전 업종 카드의 외식 업종, 격자 전체) · gridB: 경계 보정(프로토콜 45, 중심이 성동구 안인 50m 칸만)
export function mergeData(base, up) {
  const dong = structuredClone(base.dong);
  for (const [q, v] of Object.entries(up?.dong || {})) for (const [code, r] of Object.entries(v)) (dong[q] ||= {})[code] = { ...(dong[q][code] || {}), ...r };
  return { dong, grid: mergeFood(base.grid, up?.foodParts), gridB: mergeFood(base.gridB || {}, up?.foodPartsB) };
}
export function mergeFood(baseGrid, parts) {
  const grid = structuredClone(baseGrid), ps = Object.values(parts || {}), qs = new Set(ps.flatMap(p => Object.keys(p)));
  for (const q of qs) {
    const acc = {};
    for (const p of ps) for (const [id, v] of Object.entries(p[q] || {})) { const a = (acc[id] ||= { amt: 0, cnt: 0, m: new Set() }); a.amt += v[0]; a.cnt += v[1]; [].concat(v[2]).forEach(m => a.m.add(m)); }
    for (const [id, a] of Object.entries(acc)) (grid[q] ||= {})[id] = { amt: a.amt, cnt: a.cnt, months: a.m.size };
  }
  return grid;
}
// 행정동 등급(프로토콜 48 + 50): 서울 기준점과 비교. 영업기간은 원래부터 서울 평균 대비라 그대로 사용
// 프로토콜 50: 외식 점포당 매출은 서울 기준점과 같은 계산(외식 매출 ÷ 점포 자료의 외식 점포 수),
// 개·폐업은 감마-포아송 경험적 베이즈 사후확률 0.8(위험: 개업률·폐업률 모두 서울 중앙값 초과, 쇠퇴: 순폐업률이 서울 중앙값 초과)
export function dongPanel(dong, ref = {}) {
  const old = dongPanelOrig(dong), out = {};
  for (const [q, recs] of Object.entries(old)) for (const [code, b] of Object.entries(recs)) {
    const r = dong[q][code], p4 = dong[qShift(q, -4)]?.[code], s = ref[q] || {}, x = { rg: b.rg, opr_r: b.opr_r, cls_r: b.cls_r, C3: b.C3 };
    x.sg = plog(r.cs1 > 0 ? r.salesAmt / r.cs1 : NaN, p4 && p4.cs1 > 0 ? p4.salesAmt / p4.cs1 : NaN);
    if (fin(b.rg, x.sg, s.Rs, s.sg)) { x.rgR = b.rg - s.Rs; x.sgR = x.sg - s.sg; const gap = (b.rg - x.sg) - (s.Rs - s.sg); x.C1 = x.rgR > 0 && gap > 0 ? '위험' : x.rgR <= 0 && x.sgR < 0 ? '쇠퇴' : '활성'; }
    if (r.stores > 0 && fin(s.o, s.c, s.vo, s.vc, s.mnet) && s.vo > 0 && s.vc > 0) {
      const o = r.open / r.stores, c = r.close / r.stores; x.oR = o - s.o; x.cR = c - s.c;
      const ao = s.o * s.o / s.vo + r.open, bo = s.o / s.vo + r.stores, ac = s.c * s.c / s.vc + r.close, bc = s.c / s.vc + r.stores;
      x.Po = gammaQ(ao, bo * s.o); x.Pc = gammaQ(ac, bc * s.c); x.Pn = gammaDiffSf(ao, bo, ac, bc, s.mnet);
      x.C2 = x.Po > CUT && x.Pc > CUT ? '위험' : x.Pn > CUT ? '쇠퇴' : '활성';
      x.weak2 = x.C2 === '활성' && Math.max(...[x.Po, x.Pc, x.Pn].map(v => Math.max(v, 1 - v))) <= CUT;
    }
    if (fin(b.ds, s.ds, s.gL, s.gT)) { x.dsR = b.ds - s.ds; x.gLR = fin(b.gL) ? b.gL - s.gL : NaN; x.gTR = fin(b.gT) ? b.gT - s.gT : NaN; x.C4 = x.dsR > 0 && x.gLR < 0 ? '위험' : x.gTR < 0 ? '쇠퇴' : '활성'; }
    const parts = ['C1', 'C2', 'C3', 'C4'].map(k => x[k] ?? null);
    if (parts.every(Boolean)) { x.R = parts.filter(g => g === '위험').length; x.D = parts.filter(g => g === '쇠퇴').length; x.COMP = x.R >= 3 ? '위험' : x.D >= 2 ? '쇠퇴' : '활성'; }
    (out[q] ||= {})[code] = x;
  }
  return out;
}
// 원래 정의(프로토콜 38·39·41): 2026년 2분기 발행 예측의 채점에만 사용
export function dongPanelOrig(dong) {
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
export function gridGrades(grid, panel, gridDong, joint = true, excluded = null) {
  const out = {};
  for (const q of Object.keys(grid).sort()) for (const [id, r] of Object.entries(grid[q])) {
    if (excluded?.has(id)) continue;
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
// ---------- 250m 격자 등급 (프로토콜 49): G1·G4 서울 기준점, G2·G3 경험적 베이즈 + 사후확률 0.8 ----------
export const CUT = 0.8;
export function gridG1(gridB, panel, gridDong, ref, excluded = null) {   // 임대료(소속 동) 대 카드 외식 매출, 결제 30건 이상·3개월
  const out = {}, ok = v => v && v.months === 3 && v.cnt >= 30 && v.amt > 0;
  for (const q of Object.keys(gridB).sort()) for (const [id, r] of Object.entries(gridB[q])) {
    if (excluded?.has(id)) continue;
    const p = gridB[qShift(q, -4)]?.[id], x = panel[q]?.[gridDong[id]], s = ref[q] || {};
    if (!ok(r) || !ok(p) || !x || !fin(x.rg, s.Rs, s.sgT)) continue;
    const sg = Math.log(r.amt / p.amt), rgR = x.rg - s.Rs, sgR = sg - s.sgT, gap = (x.rg - sg) - (s.Rs - s.sgT);
    (out[q] ||= {})[id] = { G1: rgR > 0 && gap > 0 ? '위험' : rgR <= 0 && sgR < 0 ? '쇠퇴' : '활성', rgR, sgR };
  }
  return out;
}
export function gridG4(allindB, ref, excluded = null) {   // 전 업종 카드 업종 구성, 결제 30건 이상·3개월
  const out = {}, ok = v => v && v[3] >= 30 && v[4] === 3 && v[0] - v[1] > 0;
  for (const q of Object.keys(allindB)) for (const [id, r] of Object.entries(allindB[q])) {
    if (excluded?.has(id)) continue;
    const p = allindB[qShift(q, -4)]?.[id], s = ref[q] || {}; if (!ok(r) || !ok(p) || !fin(s.dsS, s.gLS, s.gTS)) continue;
    const dsR = (r[1] / r[0] - p[1] / p[0]) * 100 - s.dsS, gNR = Math.log((r[0] - r[1]) / (p[0] - p[1])) - s.gLS, gTR = Math.log(r[0] / p[0]) - s.gTS;
    (out[q] ||= {})[id] = { G4: dsR > 0 && gNR < 0 ? '위험' : gTR < 0 ? '쇠퇴' : '활성', dsR, gNR, gTR };
  }
  return out;
}
export function licenseCounts(lic, quarters) {   // 격자별 영업(N)·전년 말 영업(N4)·최근 4분기 개업(O)·폐업(C)·평균 영업기간(A)·폐업 점포 평균 영업기간(Cm)
  const out = {};
  for (const q of quarters) {
    const e = qEnd(q), w0 = qStart(qShift(q, -3)), e4 = qEnd(qShift(q, -4)), de = days(e), g = {};
    for (const [, id, apv, dcb] of lic) {
      const a = (g[id] ||= { N: 0, N4: 0, O: 0, C: 0, aS: 0, cS: 0 });
      if (apv <= e && (!dcb || dcb > e)) { a.N++; a.aS += (de - days(apv)) / 30.4375; }
      if (apv <= e4 && (!dcb || dcb > e4)) a.N4++;
      if (apv >= w0 && apv <= e) a.O++;
      if (dcb && dcb >= w0 && dcb <= e) { a.C++; a.cS += (days(dcb) - days(apv)) / 30.4375; }
    }
    for (const a of Object.values(g)) { a.A = a.N ? a.aS / a.N : null; a.Cm = a.C ? a.cS / a.C : null; }
    out[q] = g;
  }
  return out;
}
export function licenseEB(lic, quarters, sLic, excluded = null) {
  const cnt = licenseCounts(lic, quarters), out = {};
  for (const q of quarters) {
    const s = sLic[q]; if (!s) continue;
    const ids = Object.keys(cnt[q]).filter(id => !excluded?.has(id)), res = {};
    // G2: 감마-포아송 경험적 베이즈(Clayton·Kaldor 1987, Marshall 1991 적률 추정), 사전 평균 = 서울 비율
    const g2 = ids.filter(id => cnt[q][id].N4 >= 1), n = g2.map(id => cnt[q][id].N4), nbar = n.reduce((a, v) => a + v, 0) / n.length, post = {};
    for (const [k, m] of [['O', s.o], ['C', s.c]]) {
      const kk = g2.map(id => cnt[q][id][k]), s2 = n.reduce((a, ni, i) => a + ni * (kk[i] / ni - m) ** 2, 0) / n.reduce((a, v) => a + v, 0), v = s2 - m / nbar;
      post[k] = v > 0 ? g2.map((_, i) => [m * m / v + kk[i], m / v + n[i], m]) : null;
    }
    g2.forEach((id, i) => {
      const o = post.O?.[i], c = post.C?.[i], x = (res[id] ||= {});
      x.Po = o ? gammaQ(o[0], o[1] * o[2]) : 0.5; x.oE = o ? o[0] / o[1] - o[2] : 0;
      x.Pc = c ? gammaQ(c[0], c[1] * c[2]) : 0.5; x.cE = c ? c[0] / c[1] - c[2] : 0;
      x.Pcd = o && c ? betaI(o[1] / (o[1] + c[1]), o[0], c[0]) : 0.5;   // P(폐업률 > 개업률)
      x.G2 = x.Po > CUT && x.Pc > CUT ? '위험' : x.Pcd > CUT ? '쇠퇴' : '활성';
      x.weak2 = Math.max(...[x.Po, x.Pc, x.Pcd].map(p => Math.max(p, 1 - p))) <= CUT;
    });
    // G3: 정규 경험적 베이즈, 사전 평균 = 서울 평균 영업기간
    for (const [xc, nc, r0, sig, pc, ec] of [['A', 'N', s.A, s.sdA, 'PA', 'A_E'], ['Cm', 'C', s.C, s.sdC, 'PC', 'C_E']]) {
      const g3 = ids.filter(id => cnt[q][id][nc] >= 1 && cnt[q][id][xc] != null), xs = g3.map(id => cnt[q][id][xc]), s2 = g3.map(id => sig ** 2 / cnt[q][id][nc]);
      const tau2 = g3.length ? Math.max(0, xs.reduce((a, v) => a + (v - r0) ** 2, 0) / xs.length - s2.reduce((a, v) => a + v, 0) / s2.length) : 0;
      g3.forEach((id, i) => { const x = (res[id] ||= {});
        if (tau2 === 0) { x[pc] = 0.5; x[ec] = 1; return; }
        const pv = 1 / (1 / tau2 + 1 / s2[i]), pm = pv * (r0 / tau2 + xs[i] / s2[i]); x[pc] = normSf((r0 - pm) / Math.sqrt(pv)); x[ec] = pm / r0; });
    }
    for (const id of ids) {
      const a = cnt[q][id], x = res[id]; if (!x || !(a.N >= 1) || x.PA == null) continue;
      if (!(a.C >= 1)) { x.PC = 0; x.C_E = 1; }   // 최근 1년 폐업 없음: 위험 판정 불가
      x.G3 = x.PC > CUT && 1 - x.PA > CUT ? '위험' : x.PA > CUT ? '쇠퇴' : '활성';
      x.weak3 = Math.max(Math.max(x.PA, 1 - x.PA), a.C >= 1 ? Math.max(x.PC, 1 - x.PC) : 0) <= CUT;
    }
    for (const [id, x] of Object.entries(res)) { const a = cnt[q][id]; Object.assign(x, { N: a.N, N4: a.N4, O: a.O, C: a.C }); }
    out[q] = res;
  }
  return out;
}
export function gridCompositeEB(g1, eb, g4, quarters) {
  const out = {};
  for (const q of quarters) for (const id of Object.keys(g1[q] || {})) {
    const e = eb[q]?.[id], parts = [g1[q][id].G1, e?.G2, e?.G3, g4[q]?.[id]?.G4];
    if (!parts.every(Boolean)) continue;
    const R = parts.filter(g => g === '위험').length, D = parts.filter(g => g === '쇠퇴').length, GC = R >= 3 ? '위험' : D >= 2 ? '쇠퇴' : '활성';
    const weak = [false, !!e.weak2 && e.G2 === '활성', !!e.weak3 && e.G3 === '활성', false];
    (out[q] ||= {})[id] = { GC, R, D, parts, weak, thin: GC === '활성' && weak.some(Boolean) };
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
export function mergeAllInd(base, up, boundary = false) {
  const out = structuredClone(boundary ? base.allindB : base.allind);
  const parts = Object.values((boundary ? up?.allindPartsB : up?.allindParts) || {});
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
  return { COMP: id => gs.panelOrig[q]?.[id]?.COMP, C1: id => gs.panelOrig[q]?.[id]?.C1, GRID: id => gs.gridOrig[q]?.[id], GRIDC: id => gs.gridCOrig[q]?.[id]?.GC }[key];   // 발행 예측은 모두 원래 정의로 채점
}

// ---------- 다음 분기 예측: 다항 로지스틱 (표준화, L2, C=1) ----------
// 특성: 종합 등급(원-핫), 위험·쇠퇴 항목 수, 항목별 연속값. 프로토콜 48 D1과 같은 구성
export const FEATS = ['COMP_쇠퇴', 'COMP_활성', 'COMP_위험', 'R', 'D', 'rgR', 'sgR', 'oR', 'cR', 'opr_r', 'cls_r', 'dsR', 'gLR', 'gTR'];
export const featVec = x => [x.COMP === '쇠퇴' ? 1 : 0, x.COMP === '활성' ? 1 : 0, x.COMP === '위험' ? 1 : 0, x.R, x.D, x.rgR, x.sgR, x.oR, x.cR, x.opr_r, x.cls_r, x.dsR, x.gLR, x.gTR];
// 원래 정의의 특성(2026년 2분기 발행 예측과 같은 구성)
export const featVecOrig = x => [x.COMP === '쇠퇴' ? 1 : 0, x.COMP === '활성' ? 1 : 0, x.COMP === '위험' ? 1 : 0, x.R, x.D, x.rg, x.sg, x.o_rel, x.c_rel, x.opr_r, x.cls_r, x.ds, x.gL, x.gT];
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
export function forecastNext(panel, fv = featVec) {
  const qs = Object.keys(panel).filter(q => Object.values(panel[q]).some(x => x.COMP)).sort(), last = qs.at(-1); if (!last) return null;
  const X = [], y = [];
  for (const q of qs) for (const [code, x] of Object.entries(panel[q])) { const nx = panel[qShift(q, 1)]?.[code]; if (x.COMP && nx?.COMP) { X.push(fv(x)); y.push(nx.COMP); } }
  if (X.length < 30) return null;
  const model = fitLogit(X, y), out = {};
  for (const [code, x] of Object.entries(panel[last])) if (x.COMP) { const p = model(fv(x)); out[code] = { grade: CL[p.indexOf(Math.max(...p))], p }; }
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
    const seoulWide = rows.some(r => { const m = pick(r, 'MGTNO', '관리번호'); return m && !m.startsWith('3030000'); });
    if (seoulWide) {   // 서울 전체 파일: 서울 기준점(개업률·폐업률·평균 영업기간) 집계 후 성동구(3030000) 업소만 격자에 배정
      const recs = {}; let maxD = 0;
      for (const r of rows) {
        const mgt = pick(r, 'MGTNO', '관리번호'), type = mgt.split('-')[1], ut = pick(r, 'UPTAENM', '업태구분명'), st = pick(r, 'TRDSTATENM', '영업상태명');
        const apv = ymd(pick(r, 'APVPERMYMD', '인허가일자')), closed = st.includes('폐업'), dcb = closed ? ymd(pick(r, 'DCBYMD', '폐업일자')) : 0;
        if (!type || excl.has(ut) || !apv || (closed && !dcb)) continue;
        (recs[type] ||= []).push([apv, dcb]); maxD = Math.max(maxD, apv, dcb);
      }
      const last = qShift(`${Math.floor(maxD / 10000)}Q${Math.floor((Math.floor(maxD / 100) % 100 - 1) / 3) + 1}`, -1), qs = [];
      for (let q = '2021Q1'; q <= last; q = qShift(q, 1)) qs.push(q);
      for (const [type, rr] of Object.entries(recs)) {
        const P = ((up.seoulLicParts ||= {})[type] = {});
        for (const q of qs) {
          const e = qEnd(q), w0 = qStart(qShift(q, -3)), e4 = qEnd(qShift(q, -4)), de = days(e), a = [0, 0, 0, 0, 0, 0, 0, 0];
          for (const [apv, dcb] of rr) {
            if (apv <= e && (!dcb || dcb > e)) { const m = (de - days(apv)) / 30.4375; a[0]++; a[4] += m; a[5] += m * m; }
            if (apv <= e4 && (!dcb || dcb > e4)) a[1]++;
            if (apv >= w0 && apv <= e) a[2]++;
            if (dcb && dcb >= w0 && dcb <= e) { const m = (days(dcb) - days(apv)) / 30.4375; a[3]++; a[6] += m; a[7] += m * m; }
          }
          P[q] = a;
        }
      }
    }
    for (const r of rows) {
      if (seoulWide && !pick(r, 'MGTNO', '관리번호').startsWith('3030000')) continue;
      const mgt = pick(r, 'MGTNO', '관리번호'), type = mgt.split('-')[1], ut = pick(r, 'UPTAENM', '업태구분명'), st = pick(r, 'TRDSTATENM', '영업상태명');
      const apv = ymd(pick(r, 'APVPERMYMD', '인허가일자')), closed = st.includes('폐업'), dcb = closed ? ymd(pick(r, 'DCBYMD', '폐업일자')) : 0;
      if (!type) continue; byType[type] ||= [];
      if (excl.has(ut) || !apv || (closed && !dcb)) continue;
      const x = parseFloat(pick(r, 'X', '좌표정보(X)', '좌표정보(x)')), y = parseFloat(pick(r, 'Y', '좌표정보(Y)', '좌표정보(y)'));
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const [lon, lat] = tm5174ToWgs(x, y), id = loc(lon, lat); if (id) { byType[type].push([mgt, id, apv, dcb, bout.has(ut) ? 1 : 0]); if (apv >= 20220401 || dcb >= 20220401) (up.licXY ||= {})[mgt] = [+lon.toFixed(6), +lat.toFixed(6)]; }
    }
    Object.assign((up.lic ||= {}), byType); return up;
  }
  if (kind === 'allind') {    // 신한 전 업종 50m 추출(내국인·외국인 표별로 보관 후 합산)
    const non = new Set(base.nonplace), food = new Set(base.food), res = new Set(base.resid), out50 = new Set(base.grid50Out || []);
    const parts = (up.allindParts ||= {}), partsB = (up.allindPartsB ||= {}), fp = (up.foodParts ||= {}), fpB = (up.foodPartsB ||= {});
    for (const r of rows) {
      if (non.has(r.industry)) continue; const id = base.grid50[r.grid_50_id]; if (!id) continue;
      const ym = r.ym.replace(/[^0-9]/g, '').slice(0, 6), q = `${ym.slice(0, 4)}Q${Math.floor((+ym.slice(4, 6) - 1) / 3) + 1}`, amt = Number(r.card_amount) || 0, cnt = Number(r.card_count) || 0;
      const src = r.source_table || 'upload', inside = !out50.has(r.grid_50_id), isFood = food.has(r.industry);
      const add = P => { const a = (((P[src] ||= {})[q] ||= {})[id] ||= [0, 0, 0, 0, []]); a[0] += amt; if (isFood) a[1] += amt; if (res.has(r.industry)) a[2] += amt; a[3] += cnt; if (!a[4].includes(ym)) a[4].push(ym); };
      const addF = P => { const a = (((P[src] ||= {})[q] ||= {})[id] ||= [0, 0, []]); a[0] += amt; a[1] += cnt; if (!a[2].includes(ym)) a[2].push(ym); };
      add(parts); if (inside) add(partsB);
      if (isFood) { addF(fp); if (inside) addF(fpB); }
    }
    return up;
  }
  const put = (q, code, f) => { const r = ((up.dong[q] ||= {})[code] ||= {}); f(r); };
  const sd = rows.filter(r => (r.ADSTRD_CD || '').startsWith('11200')), num = v => (v === '' || v == null ? null : Number(v));
  if ((kind === 'stores' || kind === 'sales') && new Set(rows.map(r => r.ADSTRD_CD)).size > 100) {   // 서울 전체 파일: 서울 기준점용 행정동 집계
    const acc = {};
    for (const r of rows) {
      const a = ((acc[qOf(r.STDR_YYQU_CD)] ||= {})[r.ADSTRD_CD] ||= [0, 0, 0, 0, 0]), g = r.SVC_INDUTY_CD.slice(0, 3);
      if (kind === 'stores') { const n = num(r.STOR_CO) || 0; a[0] += n; a[1] += num(r.OPBIZ_STOR_CO) || 0; a[2] += num(r.CLSBIZ_STOR_CO) || 0; if (g === 'CS1') a[3] += n; if (g === 'CS2' || g === 'CS3') a[4] += n; }
      else { const v = num(r.THSMON_SELNG_AMT) || 0; if (g === 'CS1') a[0] += v; if (g === 'CS2' || g === 'CS3') a[1] += v; a[2] += v; }
    }
    for (const [q, v] of Object.entries(acc)) for (const [code, a] of Object.entries(v)) {
      const t = (((up.seoulAgg ||= {})[q] ||= {})[code] ||= [null, null, null, null, null, null, null, null]);
      if (kind === 'stores') a.forEach((x, i) => { t[i] = x; }); else a.forEach((x, i) => { t[5 + i] = x; });
    }
  }
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
export const qLabel = q => (q ? `${q.slice(0, 4)}년 ${q.slice(5)}분기` : '');
const qShort = q => `${q.slice(2, 4)}.${q.slice(5)}분기`;
const LAYER_NAMES = { GRIDC: '250m 격자 종합', GRID: '250m 격자 임대료·카드매출', COMP: '행정동 종합', C1: '행정동 임대료·매출', C2: '행정동 개·폐업', C3: '행정동 영업기간', C4: '행정동 업종 변화', POPUP: '250m 격자 팝업 압력(참고)', POPWEB: '250m 격자 팝업 온라인 언급(참고)', WEB: '250m 격자 온라인 언급(참고)', C6: '행정동 온라인 관심도(참고)' };
// 온라인 언급: 분기 층화 추출 기대 건수, 구간 경계는 자료 파일의 사분위수(meta.breaks)
const WEB_COLORS = ['#d7ece9', '#9bcfc7', '#4ea597', '#16766c'];
const webBreaks = gs => gs.web?.meta?.breaks || [2, 5, 13];
const webClass = (n, br) => (n <= br[0] ? 0 : n <= br[1] ? 1 : n <= br[2] ? 2 : 3);
const fmtN = v => (Math.round(v * 10) / 10).toLocaleString('ko-KR');
const ISSUED_NAMES = { COMP: '행정동 종합 등급', C1: '행정동 임대료·매출 등급', GRID: '250m 격자 임대료·카드매출 등급', GRIDC: '250m 격자 종합 등급' };
const KIND = { popup: '성수동 팝업 주간 현황', rent: '서울신용보증재단 임대료', sales: '서울신용보증재단 매출', stores: '서울신용보증재단 점포·개폐업', change: '서울신용보증재단 영업기간', card: '카드(식음료, 격자) · 반영하지 않음(전 업종 카드로 계산)', allind: '카드(전 업종, 격자)', license: '외식업 인허가' };
// ---------- 팝업 압력 (참고 신호, 등급·예측에 쓰지 않음) ----------
const POPUP_ADDR = /^(\S+?(?:로|길))\s*(\d+(?:-\d+)?)(?=$|[\s,(])/;
export const popupAddrKey = s => { const m = String(s ?? '').replace(/서울특별시|서울시|성동구/g, '').trim().match(POPUP_ADDR); return m ? `${m[1]} ${m[2]}` : ''; };
export function fnv1a(s) { let x = 0x811c9dc5; for (const b of new TextEncoder().encode(s)) x = Math.imul(x ^ b, 0x01000193) >>> 0; return x.toString(16).padStart(8, '0'); }
export const popupKey = (name, start) => fnv1a(String(name ?? '').replace(/\s+/g, '').toLowerCase() + '|' + start);
export function popupLookup(key, table) {
  if (!key || !table) return [null, null];
  const [road, num] = key.split(' '), nums = table.roads[road]; if (!nums) return [null, null];
  if (num in nums) return [table.grids[nums[num]], 'exact'];
  const main = parseInt(num, 10); if (String(main) in nums) return [table.grids[nums[String(main)]], 'main'];
  const near = Object.keys(nums).map(n => [Math.abs(parseInt(n, 10) - main), n, (parseInt(n, 10) - main) % 2]).filter(x => x[2] === 0 && x[0] <= 6).sort((a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : 1));
  return near.length ? [table.grids[nums[near[0][1]]], 'near'] : [null, null];
}
async function inflateRaw(u8) { return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()); }
const xmlText = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
// 첫 번째 시트를 행 배열로 읽는다(외부 라이브러리 없음)
export async function readXlsx(buf) {
  const u = new Uint8Array(buf), dv = new DataView(u.buffer, u.byteOffset, u.byteLength), td = new TextDecoder(); let e = u.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--; if (e < 0) throw Error('zip');
  const files = {}; let p = dv.getUint32(e + 16, true);
  for (let i = 0, n = dv.getUint16(e + 10, true); i < n; i++) { const nl = dv.getUint16(p + 28, true); files[td.decode(u.subarray(p + 46, p + 46 + nl))] = { m: dv.getUint16(p + 10, true), cs: dv.getUint32(p + 20, true), lo: dv.getUint32(p + 42, true) }; p += 46 + nl + dv.getUint16(p + 30, true) + dv.getUint16(p + 32, true); }
  const get = async name => { const f = files[name]; if (!f) return ''; const a = f.lo + 30 + dv.getUint16(f.lo + 26, true) + dv.getUint16(f.lo + 28, true), d = u.subarray(a, a + f.cs); return td.decode(f.m === 8 ? await inflateRaw(d) : d); };
  const rid = ((await get('xl/workbook.xml')).match(/<sheet\b[^>]*\br:id="([^"]+)"/) || [])[1];
  const rel = ((await get('xl/_rels/workbook.xml.rels')).match(/<Relationship\b[^>]*>/g) || []).find(t => t.includes(`Id="${rid}"`)) || '', target = (rel.match(/Target="([^"]+)"/) || [])[1] || 'worksheets/sheet1.xml';
  const shared = ((await get('xl/sharedStrings.xml')).match(/<si\b[\s\S]*?<\/si>/g) || []).map(si => xmlText((si.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').match(/<t\b[^>]*>[^<]*<\/t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('')));
  const colOf = ref => [...ref.replace(/\d/g, '')].reduce((a, c) => a * 26 + c.charCodeAt(0) - 64, 0) - 1, rows = [];
  for (const [, body] of (await get(target.startsWith('/') ? target.slice(1) : `xl/${target}`)).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const [, attr, inner] of body.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      if (inner == null) continue; const ref = (attr.match(/\br="([A-Z]+\d+)"/) || [])[1], t = (attr.match(/\bt="(\w+)"/) || [])[1], v = (inner.match(/<v>([^<]*)<\/v>/) || [])[1];
      row[colOf(ref)] = t === 's' ? shared[+v] : t === 'inlineStr' ? xmlText((inner.match(/<t\b[^>]*>([^<]*)<\/t>/) || [])[1] || '') : v == null ? '' : xmlText(v);
    }
    rows.push(row);
  }
  return rows;
}
const POPUP_TYPES = ['패션', '뷰티', '식음료', '문화·예술', '생활용품', '아이돌', '공공기관·지자체', '기타'], POPUP_KINDS = ['전시체험', '제품판매'];
export function parsePopupSheet(rows) {
  const hi = rows.findIndex(r => [...r].some(c => String(c ?? '').trim() === '팝업명')); if (hi < 0) return null;
  const head = [...rows[hi]].map(c => String(c ?? '').trim()), col = n => head.indexOf(n), [N, S, E, T, K] = ['팝업명', '팝업시작', '팝업종료', '팝업종류', '비고'].map(col), A = head.findIndex(c => c.startsWith('주소')); if (S < 0 || E < 0 || A < 0) return null;
  const date = v => { if (v == null || v === '') return null; if (/^\d+(\.\d+)?$/.test(String(v))) return new Date(Math.round((+v - 25569) * 86400000)).toISOString().slice(0, 10); const m = String(v).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/); return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : null; };
  const items = rows.slice(hi + 1).filter(r => r[N] != null && r[N] !== '' && date(r[S]) && date(r[E])).map(r => ({ name: String(r[N]).trim(), addr: String(r[A] ?? '').trim(), start: date(r[S]), end: date(r[E]), type: String(r[T] ?? '').trim(), kind: String(r[K] ?? '').trim() }));
  const m = rows.slice(0, hi).flat().map(c => String(c ?? '')).join(' ').match(/(\d{1,2})월\s*(\d{1,2})일\s*~\s*(\d{1,2})월\s*(\d{1,2})일/); if (!m || !items.length) return null;
  const [a, b, c, d] = m.slice(1).map(Number), iso = (y, mo, da) => `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`; let best = null;
  for (const y of [...new Set(items.flatMap(i => [+i.start.slice(0, 4), +i.end.slice(0, 4)]))].sort()) { const s = iso(y, a, b), en = iso(y + (c < a ? 1 : 0), c, d), n = items.filter(i => i.start <= en && i.end >= s).length; if (!best || n > best.n) best = { n, s, en }; }
  return { week: { start: best.s, end: best.en, listed: items.length, buildings: new Set(items.map(i => popupAddrKey(i.addr) || i.addr)).size }, items };
}
export function ingestPopups(parsed, up, table) {
  const pop = (up.popups ||= { weeks: {}, items: {}, unresolved: [] }); pop.weeks[parsed.week.start] = parsed.week;
  for (const i of parsed.items) { const nk = popupAddrKey(i.addr), [g] = popupLookup(nk, table), k = popupKey(i.name, i.start), t = POPUP_TYPES.indexOf(i.type), kd = POPUP_KINDS.indexOf(i.kind); if (!g && !pop.unresolved.includes(i.addr)) pop.unresolved.push(i.addr); pop.items[k] = [k, g, i.start, i.end, t < 0 ? 7 : t, kd < 0 ? 0 : kd, fnv1a(nk || i.addr)]; }
}
export function mergePopups(base, up) {
  const items = new Map((base?.items || []).map(x => [x[0], x])), weeks = new Map((base?.meta?.weeks || []).map(w => [w.start, w]));
  for (const w of Object.values(up?.popups?.weeks || {})) weeks.set(w.start, w);
  for (const x of Object.values(up?.popups?.items || {})) { const old = items.get(x[0]); items.set(x[0], old && !x[1] ? [...x.slice(0, 1), old[1], ...x.slice(2)] : x); }
  return { meta: base?.meta || {}, weeks: [...weeks.values()].sort((a, b) => (a.start < b.start ? -1 : 1)), items: [...items.values()] };
}
export function popupStats(p) {
  if (!p?.items?.length || !p.weeks.length) return null;
  const W = p.weeks.length, g = {}, weekly = p.weeks.map(w => { let active = 0, located = 0; for (const it of p.items) if (it[2] <= w.end && it[3] >= w.start) { active++; if (it[1]) { located++; (g[it[1]] ||= { a: 0, n: 0, b: new Set() }).a++; } } return { ...w, active, located }; });
  for (const it of p.items) if (it[1]) { const x = (g[it[1]] ||= { a: 0, n: 0, b: new Set() }); x.n++; x.b.add(it[6]); }
  const grids = Object.fromEntries(Object.entries(g).map(([id, x]) => [id, { d: x.a / W, n: x.n, b: x.b.size, t: x.n / x.b.size }]));
  const v = Object.values(grids).map(x => x.d).filter(x => x > 0).sort((a, b) => a - b), qt = f => (v.length ? v[Math.min(v.length - 1, Math.floor(f * v.length))] : 0);
  return { W, weekly, grids, breaks: [qt(0.25), qt(0.5), qt(0.75)], total: p.items.length, located: p.items.filter(x => x[1]).length, unresolved: p.unresolved || [] };
}
const POPUP_COLORS = ['#e6dff3', '#b9a6de', '#8763c4', '#5a3aa0'];
const popupClass = (d, br) => (d <= br[0] ? 0 : d <= br[1] ? 1 : d <= br[2] ? 2 : 3);

// 팝업 온라인 언급(참고): 매일 수집이 4주 이상 쌓이면 최근 13주, 그전에는 기초 표본
export function popupMentionView(pm, nWeeks = 13, minWeeks = 4) {
  if (!pm) return null;
  const keys = Object.keys(pm.weeks || {}).sort(), daily = keys.length >= minWeeks, use = daily ? keys.slice(-nWeeks) : [], g = {}; let docs = 0, located = 0;
  if (daily) for (const k of use) { const w = pm.weeks[k]; docs += w.docs; located += w.located; for (const [id, n] of Object.entries(w.grids)) g[id] = (g[id] || 0) + n; }
  else if (pm.baseline) { docs = pm.baseline.docs; located = pm.baseline.located; Object.assign(g, pm.baseline.grids); }
  else return null;
  const v = Object.values(g).filter(x => x > 0).sort((a, b) => a - b), qt = f => (v.length ? v[Math.min(v.length - 1, Math.floor(f * v.length))] : 0);
  return { source: daily ? 'daily' : 'baseline', from: daily ? use[0] : pm.baseline.from, to: daily ? pm.meta.updated : pm.baseline.to, weeks: use.length, collected: keys.length, started: pm.meta.started, updated: pm.meta.updated, gaps: (pm.meta.gaps || []).length, docs, located, grids: g, breaks: [qt(0.25), qt(0.5), qt(0.75)] };
}
const POPWEB_COLORS = ['#dbe7f5', '#a3c4e8', '#5a93d3', '#23609f'];

// ---------- 격자 산출 근거 ----------
const GN4 = ['임대료·카드매출', '개·폐업', '영업기간', '업종 변화'];
export function partialGrade(parts) {
  const v = parts.filter(Boolean), m = 4 - v.length, R = v.filter(g => g === '위험').length, D = v.filter(g => g === '쇠퇴').length, out = new Set();
  for (let r = 0; r <= m; r++) for (let d = 0; d <= m - r; d++) out.add(R + r >= 3 ? '위험' : D + d >= 2 ? '쇠퇴' : '활성');
  return out.size === 1 ? [...out][0] : null;
}
const sgnP = v => (fin(v) ? `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%` : '–'), ppt = v => (fin(v) ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%p` : '–'), rate = v => (fin(v) ? `${(v * 100).toFixed(1)}%` : '–'), mon = v => (fin(v) ? `${Math.round(v)}개월` : '–'), pr = v => (fin(v) ? v.toFixed(2) : '–');
export function gridDetail(gs, data, q, id) {
  const g = data.grids.find(x => x.id === id); if (!g) return null;
  const D = gs.detail, s = gs.ref[q] || {}, l = gs.sLic[q] || {}, g1 = D.g1[q]?.[id], e = D.eb[q]?.[id], g4 = D.g4[q]?.[id], rec = D.gridB[q]?.[id], rec4 = D.gridB[qShift(q, -4)]?.[id], ai = D.allindB[q]?.[id], ai4 = D.allindB[qShift(q, -4)]?.[id];
  const okC = v => v && v.months === 3 && v.cnt >= 30 && v.amt > 0, okA = v => v && v[3] >= 30 && v[4] === 3 && v[0] - v[1] > 0;
  const items = [
    { name: GN4[0], grade: g1?.G1, rows: g1 ? [['소속 행정동 임대료 상승률', sgnP(g1.rgR + s.Rs), sgnP(s.Rs)], ['격자 외식 카드매출 증감', sgnP(g1.sgR + s.sgT), sgnP(s.sgT)]] : [], reason: g1 ? '' : !rec ? '외식 카드 결제 자료 없음' : !okC(rec) ? '분기 결제 30건 미만 또는 빠진 달 있음' : !okC(rec4) ? '전년 같은 분기 자료 부족' : '소속 행정동 임대료 자료 없음' },
    { name: GN4[1], grade: e?.G2, weak: e?.weak2 && e?.G2 === '활성', rows: e?.G2 ? [['전년 말 영업 외식업소', `${e.N4}곳`, ''], ['최근 1년 개업 · 폐업', `${e.O}곳 · ${e.C}곳`, ''], ['개업률(추정)', rate(e.oE + l.o), rate(l.o)], ['폐업률(추정)', rate(e.cE + l.c), rate(l.c)], ['서울보다 높을 확률(개업·폐업)', `${pr(e.Po)} · ${pr(e.Pc)}`, '기준 0.8'], ['폐업률이 개업률보다 높을 확률', pr(e.Pcd), '기준 0.8']] : [], reason: e?.G2 ? '' : '전년 말 영업 외식업소 없음' },
    { name: GN4[2], grade: e?.G3, weak: e?.weak3 && e?.G3 === '활성', rows: e?.G3 ? [['영업 업소 평균 영업기간(추정)', mon(e.A_E * l.A), mon(l.A)], ['폐업 업소 평균 영업기간(추정)', e.C >= 1 ? mon(e.C_E * l.C) : '최근 1년 폐업 없음', mon(l.C)], ['서울보다 길 확률(영업·폐업)', `${pr(e.PA)} · ${pr(e.PC)}`, '기준 0.8']] : [], reason: e?.G3 ? '' : '영업 중인 외식업소 없음' },
    { name: GN4[3], grade: g4?.G4, rows: g4 ? [['외식 매출 비중 변화', ppt(g4.dsR + s.dsS), ppt(s.dsS)], ['비외식 매출 증감', sgnP(g4.gNR + s.gLS), sgnP(s.gLS)], ['전체 매출 증감', sgnP(g4.gTR + s.gTS), sgnP(s.gTS)]] : [], reason: g4 ? '' : !ai ? '전 업종 카드 자료 없음' : !okA(ai) ? '분기 결제 30건 미만 또는 빠진 달 있음' : !okA(ai4) ? '전년 같은 분기 자료 부족' : '기준점 자료 없음' },
  ];
  return { id, dong: g.dong, excluded: !!gs.excluded?.has(id), comp: gs.gridC[q]?.[id] || null, partial: gs.gridP[q]?.[id] || null, items, popup: gs.popups?.grids?.[id] || null };
}
export function gridCard(gs, data, q, id) {
  const x = gridDetail(gs, data, q, id); if (!x) return '';
  const head = x.comp ? `${x.comp.thin ? THIN_BADGE : badge(x.comp.GC)}<span>위험 ${x.comp.R} · 쇠퇴 ${x.comp.D} / 4</span>` : x.excluded ? '<span>등급 미산출</span>' : x.partial?.det ? `<span class="grade-badge" style="--g:#cfeccf;--gi:#0b0b0b">활성(일부 항목 확정)</span><span>항목 ${x.partial.n} / 4</span>` : x.partial ? `<span>종합 미산출(항목 ${x.partial.n} / 4)</span>` : '<span>자료 부족</span>';
  const body = x.excluded ? '<p class="small-copy">성동구 면적이 50% 이하인 경계 격자라 등급을 내지 않습니다.</p>' : `<div class="pop-groups">${x.items.map(it => `<section class="pop-group"><table class="data-table pop-table"><thead><tr class="pop-item"><th><b>${h(it.name)}</b> ${it.grade ? (it.weak ? THIN_BADGE : badge(it.grade)) : '<span class="small-copy">미산출</span>'}</th><th>이 격자</th><th>서울</th></tr></thead><tbody>${it.rows.map(r => `<tr><td>${h(r[0])}</td><td>${h(r[1])}</td><td>${h(r[2])}</td></tr>`).join('')}${it.reason ? `<tr><td colspan="3" class="small-copy">사유: ${h(it.reason)}</td></tr>` : ''}</tbody></table></section>`).join('')}</div>`;
  const pop = (x.popup ? `<p class="small-copy"><b>팝업 압력(참고)</b> 관측 ${gs.popups.W}개 주 평균 ${x.popup.d.toFixed(1)}건 운영 · 팝업 ${x.popup.n}건 · 건물 ${x.popup.b}곳</p>` : '') + (gs.popWeb?.grids?.[id] ? `<p class="small-copy"><b>팝업 온라인 언급(참고)</b> 주소가 확인된 글 ${gs.popWeb.grids[id]}건</p>` : '');
  return `<div class="grid-pop" role="dialog" aria-label="격자 ${h(x.id)} 산출 근거"><button class="icon-btn grid-pop-close" data-action="close-grid" aria-label="닫기">×</button><h3>${h(x.dong)} · ${h(x.id)}</h3><div class="grid-pop-head"><span class="small-copy">${h(qLabel(q))}</span>${head}</div>${body}${pop}${x.excluded ? '' : '<p class="small-copy">종합은 위험 3개 이상이면 위험, 쇠퇴 2개 이상이면 쇠퇴입니다. 임대료는 소속 행정동 값이며 카드는 50m 자료를 250m로 합산했습니다.</p>'}</div>`;
}

export function buildModel(base, up, data) {
  const merged = mergeData(base, up), ref = seoulRefs(base, up), sLic = seoulLicRefs(base, up);
  const panel = dongPanel(merged.dong, ref), panelOrig = dongPanelOrig(merged.dong);
  const gridDong = Object.fromEntries(data.grids.map(g => [g.id, g.dongCode]));
  const quarters = Object.keys(panel).filter(q => Object.values(panel[q]).some(x => x.C1 || x.C2)).sort();
  const gq = quarters.filter(q => q >= '2023Q1'), lic = mergeLicenses(base, up), excluded = new Set(base.gridExcluded || []);
  // 원래 정의(프로토콜 38·42): 2026년 2분기 발행 예측의 채점에만 사용
  const licOld = licenseGrades(lic, gq), gridOrig = gridGrades(merged.grid, panelOrig, gridDong), gridCOrig = gridComposite(gridGrades(merged.grid, panelOrig, gridDong, false), licOld, allIndustryGrades(mergeAllInd(base, up)), gq);
  // 화면 표시(프로토콜 48·49, 경계 보정): 서울 기준점, 개·폐업·영업기간은 경험적 베이즈 사후확률 0.8
  const allindB = mergeAllInd(base, up, true), g1 = gridG1(merged.gridB, panel, gridDong, ref, excluded), g4 = gridG4(allindB, ref, excluded), eb = licenseEB(lic, gq, sLic, excluded);
  const gridC = gridCompositeEB(g1, eb, g4, gq), gridP = {};
  for (const q of gq) for (const g of data.grids) { if (excluded.has(g.id) || gridC[q]?.[g.id]) continue; const parts = [g1[q]?.[g.id]?.G1 ?? null, eb[q]?.[g.id]?.G2 ?? null, eb[q]?.[g.id]?.G3 ?? null, g4[q]?.[g.id]?.G4 ?? null], n = parts.filter(Boolean).length; if (n) (gridP[q] ||= {})[g.id] = { parts, n, det: partialGrade(parts) }; }
  const grid = Object.fromEntries(Object.entries(g1).map(([q, v]) => [q, Object.fromEntries(Object.entries(v).map(([id, x]) => [id, x.G1]))]));
  for (const [q, v] of Object.entries(base.searchC6 || {})) for (const [code, g] of Object.entries(v)) if (panel[q]?.[code]) panel[q][code].C6 = g;   // 참고 항목(프로토콜 44)
  const missingRef = Object.keys(merged.dong).filter(q => q >= '2023Q1' && (!fin(ref[q]?.Rs) || !fin(ref[q]?.o) || !fin(ref[q]?.sg) || !fin(ref[q]?.vo))).sort();
  return { panel, panelOrig, grid, gridC, gridP, gridOrig, gridCOrig, excluded, ref, sLic, missingRef, web: base.webMentions, popups: popupStats(mergePopups(base.popups, up)), popWeb: popupMentionView(base.popupMentions), webStatus: base.webStatus || null, lic, licXY: up?.licXY || null, ptCache: {}, detail: { g1, g4, eb, gridB: merged.gridB, allindB }, quarters, forecast: forecastNext(panel), merged };
}
export const latestQuarter = gs => gs.quarters.filter(x => Object.values(gs.panel[x]).some(v => v.COMP)).at(-1);
export const riskStreak = (gs, code, q) => { let n = 0, x = q; while (gs.panel[x]?.[code]?.COMP === '위험') { n++; x = qShift(x, -1); } return n; };
// 개요 화면 요약: 기준 분기의 종합 위험 동, 정밀 진단(2분기 연속) 동, 격자 종합 위험 수, 다음 분기 위험 예측 동
export function gradeSummary(gs, data) {
  const q = latestQuarter(gs), cur = gs.panel[q] || {};
  const risk = data.dongs.filter(d => cur[d.code]?.COMP === '위험'), deep = data.dongs.filter(d => riskStreak(gs, d.code, q) >= 2);
  const gc = Object.values(gs.gridC[q] || {}), f = gs.forecast;
  return { q, risk, deep, gridRisk: gc.filter(x => x.GC === '위험').length, gridTotal: gc.length,
    forecastTarget: f?.target, forecastRisk: f ? data.dongs.filter(d => f.grades[d.code]?.grade === '위험') : [] };
}
const STYLE_BASE = { stroke: true, fill: true, opacity: 1, dashArray: null };
const FILLED = (c, o = .6) => ({ ...STYLE_BASE, fillColor: c, fillOpacity: o, color: '#ffffff', weight: .8 });
const OUTLINED = (c, o, dash, line = c) => ({ ...STYLE_BASE, fillColor: c, fillOpacity: o, color: line, weight: .9, dashArray: dash });
const EMPTY_CELL = { ...STYLE_BASE, fillColor: '#8a8a85', fillOpacity: 0, color: '#8a8a85', weight: .7, dashArray: '2 3' };
// 지도 칸의 색과 안내 문구. 등급 값은 buildModel 결과를 그대로 읽는다.
export function gridStyle(gs, layer, q, g) {
  const head = `${g.dong} · 격자 ${g.id}`;
  if (layer === 'POPWEB') { const n = gs.popWeb?.grids?.[g.id] || 0, k = n > 0 ? popupClass(n, gs.popWeb.breaks) : -1; return { style: k >= 0 ? FILLED(POPWEB_COLORS[k], .68) : EMPTY_CELL, title: `${head} · ${n ? `주소가 확인된 팝업 언급 글 ${n}건` : '주소가 확인된 글 없음'}` }; }
  if (layer === 'POPUP') { const w = gs.popups?.grids?.[g.id], k = w && w.d > 0 ? popupClass(w.d, gs.popups.breaks) : -1; return { style: k >= 0 ? FILLED(POPUP_COLORS[k], .68) : EMPTY_CELL, title: `${head} · ${w ? `관측 주 평균 ${w.d.toFixed(1)}건 운영 · 팝업 ${w.n}건 · 건물 ${w.b}곳` : '집계된 팝업 없음'}` }; }
  if (layer === 'WEB') { const w = gs.web?.grids?.[g.id], k = w ? webClass(w[0], webBreaks(gs)) : -1; return { style: k >= 0 ? FILLED(WEB_COLORS[k], .68) : EMPTY_CELL, title: `${head} · ${w ? `최근 4개 분기 층화 기준 게시글 ${fmtN(w[0])}건(분기당 ${gs.web.meta.stratumSize ?? '–'}건 추출 기준) · 언급 업소 ${w[1]}곳` : '연결된 게시글 없음'}` }; }
  if (gs.excluded?.has(g.id)) return { style: { ...STYLE_BASE, fillColor: '#8a8a85', fillOpacity: .18, color: '#8a8a85', weight: .7 }, title: `${head} · 성동구 면적 50% 이하(등급 미산출)` };
  if (layer === 'GRID') { const gr = gs.grid[q]?.[g.id]; return { style: gr ? FILLED(GRADE[gr].color) : EMPTY_CELL, title: `${head} · ${gr || '자료 부족'}` }; }
  const x = gs.gridC[q]?.[g.id], pa = gs.gridP?.[q]?.[g.id];
  const style = x ? (x.thin ? OUTLINED(GRADE.활성.color, .22, '3 2') : FILLED(GRADE[x.GC].color)) : pa?.det ? OUTLINED(GRADE.활성.color, .14, '1 3') : pa ? OUTLINED('#8a8a85', .24, '3 2', '#6b6b66') : EMPTY_CELL;
  return { style, title: `${head} · ${x ? `종합 ${x.GC}${x.thin ? '(근거 부족)' : ''}(위험 항목 ${x.R}개) · ` + x.parts.map((p, i) => `${GN4[i]} ${p}${x.weak[i] ? '(근거 부족)' : ''}`).join(' · ') : pa ? `종합 미산출(항목 ${pa.n}/4)` : '자료 부족'}` };
}
export function dongStyle(gs, layer, q, d) {
  const gr = gs.panel[q]?.[d.code]?.[layer];
  return { grade: gr || '', style: { ...STYLE_BASE, fillColor: gr ? GRADE[gr].color : '#ffffff', fillOpacity: gr ? .5 : 0, color: d.seongsu ? '#0b0b0b' : '#52514e', weight: d.seongsu ? 2.4 : 1.1 }, title: `${d.name} · ${COMPONENTS[layer] || ''} ${gr || '자료 부족'}` };
}
// 최근 1년 개·폐업 점. licenseCounts의 O·C와 같은 기간·같은 행을 쓴다.
export function licensePoints(gs, q, coords) {
  const memo = (gs.ptCache ||= {}); if (memo[q]) return memo[q];
  const w0 = qStart(qShift(q, -3)), e = qEnd(q), xy = { ...coords, ...(gs.licXY || {}) }, out = [];
  for (const [mgt, id, apv, dcb] of gs.lic) {
    if (gs.excluded?.has(id) || !xy[mgt]) continue;
    const [lon, lat] = xy[mgt];
    if (apv >= w0 && apv <= e) out.push({ id, lon, lat, kind: 'O' });
    if (dcb && dcb >= w0 && dcb <= e) out.push({ id, lon, lat, kind: 'C' });
  }
  return memo[q] = out;
}
const THIN_BADGE = `<span class="grade-badge" style="--g:#cfeccf;--gi:#0b0b0b">활성(근거 부족)</span>`;
export const badge = g => `<span class="grade-badge" style="--g:${GRADE[g || 'none'].color};--gi:${GRADE[g || 'none'].ink}">${h(g || '자료 부족')}</span>`;
export function dongMap(gs, data, layer, q, focus, cls = 'grade-map') {   // 개요 화면의 행정동 미리보기(정지 이미지). 등급 모니터링 지도는 gradeMap.js
  const grades = gs.panel[q] || {}, xs = data.dongs.flatMap(d => (d.geometry.type === 'Polygon' ? [d.geometry.coordinates] : d.geometry.coordinates).flat(3));
  let a = Infinity, b = Infinity, c = -Infinity, e = -Infinity; for (let i = 0; i < xs.length; i += 2) { a = Math.min(a, xs[i]); c = Math.max(c, xs[i]); b = Math.min(b, xs[i + 1]); e = Math.max(e, xs[i + 1]); }
  const box = [a - 16, b - 16, c - a + 32, e - b + 32];
  const dongs = data.dongs.map(d => { const gr = grades[d.code]?.[layer];
    return `<path d="${pathFor(d.geometry)}" fill="${!gr ? 'transparent' : GRADE[gr].color}" fill-opacity=".55" stroke="${d.seongsu ? '#0b0b0b' : '#52514e'}" stroke-width="${d.seongsu ? 2.4 : 1.1}" class="grade-dong ${focus === d.code ? 'focus' : ''}"><title>${h(d.name)} · ${h(COMPONENTS[layer] || '')} ${h(gr || '')}</title></path>`; }).join('');
  const labels = data.dongs.map(d => { const gr = grades[d.code]?.[layer]; return `<text x="${d.center[0]}" y="${d.center[1]}" class="grade-label" fill="#0b0b0b">${h(d.name)}${gr ? `<tspan x="${d.center[0]}" dy="1.15em">${gr}</tspan>` : ''}</text>`; }).join('');
  return `<svg class="${cls}" viewBox="${box.join(' ')}" role="group" aria-label="성동구 ${h(LAYER_NAMES[layer] || '행정동')} 등급 지도"><image href="/assets/seongdong-map.webp" x="0" y="0" width="1024" height="1024" class="grade-basemap"/>${dongs}<g pointer-events="none">${labels}</g></svg>`;
}
function flowMatrix(gs, data, layer) {
  const qs = gs.quarters.filter(q => Object.values(gs.panel[q]).some(x => x[layer])).slice(-13);
  return `<div class="flow-scroll"><table class="flow-table"><thead><tr><th>행정동</th>${qs.map(q => `<th>${qShort(q)}</th>`).join('')}</tr></thead><tbody>${data.dongs.map(d => `<tr><th>${h(d.name)}${SEONGSU.has(d.code) ? ' ●' : ''}</th>${qs.map(q => { const g = gs.panel[q]?.[d.code]?.[layer]; return `<td style="--g:${GRADE[g || 'none'].color};--gi:${GRADE[g || 'none'].ink}" title="${h(d.name)} ${qLabel(q)} ${h(g || '자료 부족')}">${g ? g[0] : '–'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
}
export function gradesPage(st, data) {
  const gs = st.grades; if (!gs) return `<div class="panel"><p>등급 자료를 불러오는 중입니다.</p></div>`;
  const layer = st.gLayer, q = gs.quarters.includes(st.gQuarter) ? st.gQuarter : latestQuarter(gs), cur = gs.panel[q] || {};
  const isGrid = ['GRID', 'GRIDC', 'WEB', 'POPUP', 'POPWEB'].includes(layer), key = isGrid ? null : layer, counts = Object.fromEntries(CL.map(c => [c, 0])); let none = 0;
  const gval = id => layer === 'GRIDC' ? gs.gridC[q]?.[id]?.GC : gs.grid[q]?.[id];
  if (key) for (const d of data.dongs) cur[d.code]?.[key] ? counts[cur[d.code][key]]++ : none++; else if (!['WEB', 'POPUP', 'POPWEB'].includes(layer)) for (const g of data.grids) gval(g.id) ? counts[gval(g.id)]++ : none++;
  const thin = layer === 'GRIDC' ? Object.values(gs.gridC[q] || {}).filter(x => x.thin).length : 0; if (thin) counts.활성 -= thin;
  const partN = layer === 'GRIDC' ? Object.keys(gs.gridP[q] || {}).length : 0, partDet = layer === 'GRIDC' ? Object.values(gs.gridP[q] || {}).filter(x => x.det).length : 0, exN = layer === 'GRIDC' ? gs.excluded.size : 0; if (layer === 'GRIDC') none -= partN + exN;
  const pp_ = gs.popups, pbr = pp_?.breaks || [0, 0, 0], popCounts = POPUP_COLORS.map((_, k) => data.grids.filter(g => (pp_?.grids?.[g.id]?.d || 0) > 0 && popupClass(pp_.grids[g.id].d, pbr) === k).length), f1 = v => v.toFixed(1), popLabels = [`${f1(pbr[0])}건 이하`, `${f1(pbr[0])}~${f1(pbr[1])}건`, `${f1(pbr[1])}~${f1(pbr[2])}건`, `${f1(pbr[2])}건 초과`];
  const wp = gs.web?.meta?.period || [], br = webBreaks(gs), webCounts = WEB_COLORS.map((_, k) => data.grids.filter(g => gs.web?.grids?.[g.id] && webClass(gs.web.grids[g.id][0], br) === k).length);
  const webLabels = [`${fmtN(br[0])}건 이하`, `${fmtN(br[0])}~${fmtN(br[1])}건`, `${fmtN(br[1])}~${fmtN(br[2])}건`, `${fmtN(br[2])}건 초과`];
  const pw_ = gs.popWeb, wbr = pw_?.breaks || [0, 0, 0], pwCounts = POPWEB_COLORS.map((_, k) => data.grids.filter(g => (pw_?.grids?.[g.id] || 0) > 0 && popupClass(pw_.grids[g.id], wbr) === k).length), pwLabels = [`${fmtN(wbr[0])}건 이하`, `${fmtN(wbr[0])}~${fmtN(wbr[1])}건`, `${fmtN(wbr[1])}~${fmtN(wbr[2])}건`, `${fmtN(wbr[2])}건 초과`];
  const mapTitle = layer === 'POPWEB' ? `${pw_?.source === 'daily' ? `최근 ${pw_.weeks}주` : '기초 표본'}(${pw_?.from ?? ''}~${pw_?.to ?? ''}) · ${LAYER_NAMES.POPWEB}` : layer === 'POPUP' ? `주간 현황 ${pp_?.W ?? 0}개 주(${pp_?.weekly?.[0]?.start ?? ''}~${pp_?.weekly?.at(-1)?.end ?? ''}) · ${LAYER_NAMES.POPUP}` : layer === 'WEB' ? `최근 4개 분기(${qLabel(wp[0])}~${qLabel(wp[1])}) · ${LAYER_NAMES.WEB}` : `${qLabel(q)} · ${LAYER_NAMES[layer]} 등급`;
  const pts = isGrid && st.gPoints && st.mapData ? licensePoints(gs, q, st.mapData.points) : null;
  const f = gs.forecast, fd = st.gDong && data.dongs.find(d => d.code === st.gDong), fx = fd && cur[fd.code];
  const alerts = data.dongs.map(d => ({ d, n: riskStreak(gs, d.code, q) })).filter(a => a.n > 0).sort((a, b) => b.n - a.n);
  const gridTargets = isGrid ? Object.entries(gs.gridC[q] || {}).filter(([, x]) => x.GC !== '활성').map(([id, x]) => { let n = 0, y = q; while (gs.gridC[y]?.[id]?.GC === x.GC) { n++; y = qShift(y, -1); } return { id, g: x.GC, n, dong: data.grids.find(c => c.id === id)?.dong || '' }; }).sort((a, b) => (a.g === b.g ? b.n - a.n : a.g === '위험' ? -1 : 1)) : [];
  const up = st.gUploads, upQs = [...new Set([...Object.keys(up.dong || {}), ...Object.keys(up.grid || {})])].sort();
  const saved = fd && st.note?.selected.includes(`D:${fd.code}`);
  return `<div class="page-title"><div><p class="eyebrow">젠트리피케이션 대응 상권 모니터링</p><h1>등급 모니터링</h1><p class="subtitle">250m 격자와 행정동의 활성·쇠퇴·위험 등급을 분기별로 확인합니다. 격자를 누르면 그 값이 나온 근거를 볼 수 있습니다.</p></div></div>
  <div class="map-toolbar"><div class="control"><label for="g-quarter">기준 분기</label><select id="g-quarter">${gs.quarters.slice().reverse().map(x => `<option value="${x}" ${x === q ? 'selected' : ''}>${qLabel(x)}${upQs.includes(x) ? ' (등록 자료)' : ''}</option>`).join('')}</select></div>
  <div class="control"><label for="g-layer">표시 등급</label><select id="g-layer">${Object.entries(LAYER_NAMES).map(([k, v]) => `<option value="${k}" ${k === layer ? 'selected' : ''}>${h(v)}</option>`).join('')}</select></div>
  ${isGrid ? `<div class="control"><label for="g-grid-search">격자 번호 찾기</label><input id="g-grid-search" list="g-grid-list" placeholder="예: 60754925" size="13" autocomplete="off"><datalist id="g-grid-list">${data.grids.map(g => `<option value="${g.id}">${h(g.dong)}</option>`).join('')}</datalist></div><label class="point-toggle"><input type="checkbox" id="g-points" ${st.gPoints ? 'checked' : ''}> 개·폐업 점 표시</label>` : ''}
  <div class="grade-counts">${layer === 'POPWEB' ? POPWEB_COLORS.map((c, k) => `<span><span class="grade-badge" style="--g:${c};--gi:${k > 1 ? '#ffffff' : '#0b0b0b'}">${pwLabels[k]}</span><b>${pwCounts[k]}</b></span>`).join('') : layer === 'POPUP' ? POPUP_COLORS.map((c, k) => `<span><span class="grade-badge" style="--g:${c};--gi:${k > 1 ? '#ffffff' : '#0b0b0b'}">${popLabels[k]}</span><b>${popCounts[k]}</b></span>`).join('') : layer === 'WEB' ? WEB_COLORS.map((c, k) => `<span><span class="grade-badge" style="--g:${c};--gi:${k > 1 ? '#ffffff' : '#0b0b0b'}">${webLabels[k]}</span><b>${webCounts[k]}</b></span>`).join('') : `${CL.slice().reverse().map(c => `<span>${badge(c)}<b>${counts[c]}</b></span>`).join('')}${layer === 'GRIDC' ? `<span>${THIN_BADGE}<b>${thin}</b></span><span title="일부 항목만 있어 종합을 내지 않은 격자(그중 ${partDet}곳은 일부 항목으로 활성 확정)"><span class="grade-badge" style="--g:#d9d9d4;--gi:#0b0b0b">일부 항목</span><b>${partN}</b></span><span><span class="grade-badge" style="--g:#efefea;--gi:#52514e">경계 제외</span><b>${exN}</b></span>` : ''}<span>${badge(null)}<b>${none}</b></span>`}</div></div>
  <div class="grade-grid"><section class="panel grade-map-panel"><h2>${h(mapTitle)}</h2><div id="grade-map-slot" class="grade-map-host"><p class="small-copy map-loading">지도를 불러오는 중입니다.</p></div>${isGrid && st.gGrid ? `<div class="grid-sheet">${gridCard(gs, data, q, st.gGrid)}</div>` : ''}${pts ? `<p class="small-copy point-legend"><i class="pt o"></i>최근 1년 개업 <b>${pts.filter(p => p.kind === 'O').length}</b>곳 <i class="pt c"></i>폐업 <b>${pts.filter(p => p.kind === 'C').length}</b>곳 · 외식업 인허가 자료, 격자의 개·폐업 수와 같은 기준입니다. 상호는 표시하지 않습니다.</p>` : ''}<p class="small-copy"><b>산출 기준</b> ${h(RULES[layer])}</p><p class="small-copy"><b>검증 결과</b> ${h(VALIDATION[layer])}</p>${layer === 'WEB' && gs.webStatus?.inProgress ? `<p class="small-copy"><b>수집 현황</b> ${h(qLabel(gs.webStatus.inProgress.quarter))} 매일 수집 중, 누적 ${Number(gs.webStatus.inProgress.docs).toLocaleString('ko-KR')}건(${h(gs.webStatus.inProgress.started)}부터, 마지막 수집일 ${h(gs.webStatus.inProgress.asOf)}). 분기가 끝나고 10일 뒤 지도에 반영합니다.</p>` : ''}${layer === 'POPWEB' && pw_ ? `<p class="small-copy"><b>수집 현황</b> 글 ${pw_.docs.toLocaleString('ko-KR')}건 중 주소 확인 ${pw_.located.toLocaleString('ko-KR')}건. 매일 수집은 ${h(pw_.started || '')}부터 ${pw_.collected}주째 쌓이고 있고, 4주가 쌓이면 최근 13주 값으로 바뀝니다. 마지막 수집일 ${h(pw_.updated || '')}.${pw_.gaps ? ` 수집 공백 경고 ${pw_.gaps}건.` : ''}</p>` : ''}<p class="small-copy">이 등급은 행정동 평균값 등을 이용한 참고 지표로, 실제 임대료 부담이나 내몰림 여부를 판정한 것이 아닙니다.</p></section>
  <aside class="grade-side">
    ${isGrid ? `<section class="panel"><h2>격자 점검 대상 (${h(qLabel(q))})</h2>${gridTargets.length ? `<ul class="alert-list grid-target-list">${gridTargets.map(a => `<li><button data-ggrid="${a.id}" class="text-button">${h(a.dong)} ${h(a.id.slice(2))}</button><span>${badge(a.g)} ${a.n > 1 ? `${a.n}분기 연속` : ''}</span></li>`).join('')}</ul>` : '<p class="small-copy">위험·쇠퇴 격자가 없습니다.</p>'}</section>` : ''}
    ${isGrid && !fd ? '' : `<section class="panel"><h2>${fd ? h(fd.name) : '행정동 선택'}</h2>${fd ? `<table class="data-table"><tbody>${Object.entries(COMPONENTS).map(([k, v]) => `<tr><td>${h(v)}</td><td>${k === 'C2' && fx?.weak2 ? THIN_BADGE : badge(fx?.[k])}</td></tr>`).join('')}<tr><td>위험 항목 수</td><td><b>${fx?.R ?? '–'} / 4</b></td></tr><tr><td>쇠퇴 항목 수</td><td><b>${fx?.D ?? '–'} / 4</b></td></tr><tr><td>종합 위험 연속</td><td><b>${riskStreak(gs, fd.code, q)}분기</b></td></tr>${f?.grades[fd.code] && f.origin === q ? `<tr><td>${qLabel(f.target)} 예측</td><td>${badge(f.grades[fd.code].grade)}</td></tr>` : ''}</tbody></table><button class="button small ${saved ? 'ghost' : 'primary'} wide" data-action="save-unit" data-unit="D:${fd.code}" data-quarter="${q}">${icon(saved ? 'check' : 'plus')}${saved ? '검토 기록에 등록됨' : '검토 기록에 추가'}</button>` : '<p class="small-copy">지도에서 행정동을 선택하면 항목별 등급, 위험 항목 수, 다음 분기 예측을 보여 줍니다.</p>'}</section>`}
    <section class="panel"><h2>점검 대상 (${h(qLabel(q))})</h2>${alerts.length ? `<ul class="alert-list">${alerts.map(a => `<li><button data-gdong="${a.d.code}" class="text-button">${h(a.d.name)}</button><span>${a.n >= 2 ? '<b>정밀 진단</b>' : '관찰 강화'} · 종합 위험 ${a.n}분기 연속</span></li>`).join('')}</ul>` : '<p class="small-copy">종합 위험 행정동이 없습니다.</p>'}</section>
    ${f ? `<section class="panel"><h2>${h(qLabel(f.target))} 종합 등급 예측</h2><p class="small-copy">${h(qLabel(f.origin))}까지의 자료로 예측했습니다(과거 사례 ${f.pairs}건 학습). 새 분기 자료를 등록하면 다시 계산합니다.</p><div class="forecast-list">${data.dongs.map(d => f.grades[d.code] ? `<span>${h(d.name)} ${badge(f.grades[d.code].grade)}</span>` : '').join('')}</div></section>` : ''}
  </aside></div>
  <section class="panel"><h2>등급 변화 추이 · ${h(isGrid ? '행정동 종합' : LAYER_NAMES[layer])} (최근 13개 분기, ● 성수동 4개 동)</h2>${flowMatrix(gs, data, isGrid ? 'COMP' : layer)}</section>
  <section class="panel"><h2>등급 기준의 근거</h2><p class="small-copy">젠트리피케이션은 여러 현상이 함께 나타나는 과정입니다. 선행연구(Davidson·Lees 2005)가 정리한 네 가지 정의 요소를 상권 자료로 옮겨 4개 항목을 만들었습니다.</p>
  <table class="data-table"><thead><tr><th>정의 요소</th><th>상권에서 나타나는 모습</th><th>등급 항목</th></tr></thead><tbody>${CRITERIA_BASIS.map(r => `<tr><td><b>${h(r[0])}</b></td><td>${h(r[1])}</td><td>${h(r[2])}</td></tr>`).join('')}</tbody></table>
  <h3 class="basis-sub">기준별 산출 근거</h3><div class="table-scroll"><table class="data-table"><thead><tr><th>기준</th><th>값</th><th>근거 유형</th><th>근거</th><th>한계·민감도</th></tr></thead><tbody>${CRITERIA_TABLE.map(r => `<tr><td><b>${h(r[0])}</b></td><td>${h(r[1])}</td><td>${h(r[2])}</td><td>${h(r[3])}</td><td>${h(r[4])}</td></tr>`).join('')}</tbody></table></div>
  <p class="small-copy">위험 3개·쇠퇴 2개라는 개수는 항목 측정이 아니라 판정 규칙입니다. 다른 개수 기준 6가지에서 모두 같은 종합 등급이 나오는 행정동·분기는 40%이므로, 항목별 위험·쇠퇴 신호 수를 함께 확인합니다. 등급은 현장 확인 대상을 고르는 참고 지표입니다.</p></section>
  <section class="panel"><h2>활용 지침</h2><table class="data-table"><thead><tr><th>등급 상황</th><th>조치 단계</th><th>조치 내용</th></tr></thead><tbody>${GUIDE.map(r => `<tr><td><b>${h(r[0])}</b></td><td>${h(r[1])}</td><td>${h(r[2])}</td></tr>`).join('')}</tbody></table>
  <table class="data-table"><thead><tr><th>위험 항목</th><th>의미</th><th>검토 수단</th></tr></thead><tbody>${GUIDE_COMPONENT.map(r => `<tr><td><b>${h(r[0])}</b></td><td>${h(r[1])}</td><td>${h(r[2])}</td></tr>`).join('')}</tbody></table>
  <p class="small-copy">등급은 행정동 평균값 등을 이용한 참고 지표입니다. 개별 임대인·임차인 제재, 지원사업 적격 판정, 구역 지정의 단독 근거로 사용할 수 없습니다.</p></section>
  <section class="panel"><h2>사전 예측 검증 · ${h(qLabel(st.gIssued?.target || '2026Q2'))}</h2>${scorePanel(gs, st.gIssued)}</section>
  <section class="panel" id="grade-upload"><h2>분기 자료 등록</h2><p class="small-copy">서울신용보증재단 행정동 분기 원자료 4종, 신한카드 격자 자료(식음료·전 업종), 외식업 인허가 자료(LOCALDATA)를 선택하면 파일 종류와 분기를 자동으로 인식해 등급을 다시 계산합니다. 등록 자료는 이 브라우저에만 저장되며 서버로 전송되지 않습니다.</p>
  <div class="form-actions"><input type="file" id="g-files" multiple accept=".csv,.txt,.jsonl"><button class="button small ghost" data-gact="export">${icon('download')}등록 자료 내보내기</button><label class="button small ghost">${icon('plus')}등록 자료 불러오기<input type="file" id="g-import" accept=".json" hidden></label><button class="button small ghost" data-gact="reset">등록 자료 초기화</button></div>
  <div class="form-actions"><label class="small-copy" for="g-reb-q">부동산원 서울 소규모 상가 임대가격지수</label><input id="g-reb-q" placeholder="예: 2026Q4" size="9" aria-label="지수 분기"><input id="g-reb-v" type="number" step="0.01" placeholder="지수 값" aria-label="지수 값"><button class="button small ghost" data-gact="reb">${icon('plus')}지수 등록</button><span class="small-copy">등록된 마지막 분기: ${h(qLabel(Object.keys({ ...st.gradeBase?.reb, ...up.reb }).sort().at(-1)))}</span></div>
  ${gs.missingRef?.length ? `<p class="small-copy"><b>서울 기준점 없음</b> ${h(gs.missingRef.map(qLabel).join(', '))}: 서울 전체 서울신용보증재단 파일(점포·매출) 또는 부동산원 지수가 없어 행정동·격자 등급을 계산하지 못했습니다.</p>` : ''}
  ${UPLOAD_GUIDE}
  ${up.log?.length ? `<table class="data-table"><thead><tr><th>등록 시각</th><th>파일</th><th>자료 종류</th><th>분기</th><th>행 수</th></tr></thead><tbody>${up.log.slice(-12).reverse().map(l => `<tr><td>${h(l.at)}</td><td>${h(l.file)}</td><td>${h(KIND[l.kind] || '인식할 수 없는 파일')}</td><td>${h(l.quarters.map(x => /^\d{4}Q\d$/.test(x) ? qLabel(x) : x).join(', '))}</td><td>${l.rows.toLocaleString('ko-KR')}</td></tr>`).join('')}</tbody></table>` : '<p class="small-copy">등록한 자료가 없습니다. 기본 자료: 서울신용보증재단 2022년 1분기~2026년 1분기, 카드(전 업종) ~2026년 3분기, 외식업 인허가 2026년 9월 수집분.</p>'}</section>`;
}
const fmt = (v, d = 3) => (v == null ? '–' : (+v).toFixed(d));
function scorePanel(gs, iss) {
  if (!iss) return '<p class="small-copy">사전 예측 파일을 불러오지 못했습니다.</p>';
  const rows = Object.entries(iss.sets).map(([k, set]) => {
    const r = scoreIssued(set.rows, observedGetter(gs, k, iss.target));
    const verdict = r.auc == null ? `비교 대기 (${qLabel(iss.target)} 실제 등급 ${r.n}건)` : r.pass ? '<b>적합</b>' : '부적합';
    return `<tr><td><b>${h(ISSUED_NAMES[k] || set.label)}</b><br><span class="small-copy">작성 ${h(set.issuedAt.slice(0, 16).replace('T', ' '))} · 파일 확인값 ${h(set.sha256.slice(0, 10))}…</span></td><td>${r.issued}</td><td>${r.n}</td><td>${r.acc == null ? '–' : `${(r.acc * 100).toFixed(1)}% (무작위 ${(r.chance * 100).toFixed(1)}%)`}</td><td>${fmt(r.auc)}</td><td>${fmt(r.p, 4)}</td><td>${verdict}</td></tr>`;
  }).join('');
  return `<p class="small-copy">${h(qLabel(iss.origin))} 자료로, ${h(qLabel(iss.target))} 자료가 공개되기 전에 미리 작성한 예측입니다. ${h(qLabel(iss.target))} 자료를 등록하면 실제 등급과 자동으로 비교합니다. 변별력(AUC)이 0.5를 넘고 유의확률이 0.05 미만이면 '적합'으로 표시합니다. 행정동은 17곳뿐이어서 한 분기 결과만으로 판단하지 않고 이후 분기와 함께 봅니다.</p>
  <table class="data-table"><thead><tr><th>구분</th><th>예측 대상</th><th>비교 가능</th><th>적중률</th><th>변별력(AUC)</th><th>유의확률</th><th>결과</th></tr></thead><tbody>${rows}</tbody></table>`;
}
const UPLOAD_GUIDE = `<details class="upload-guide"><summary>분기 자료 등록 안내 (담당자용)</summary>
<ol>
<li><b>주기</b>: 분기마다 1회 등록합니다. 서울신용보증재단 분기 자료가 공개되면 같은 분기의 카드·인허가 자료와 함께 등록합니다.</li>
<li><b>서울신용보증재단 행정동 분기 원자료 4종</b>(분기 폴더의 <code>04.행정동</code>): <code>TBSM_ADSTRD_RENT_CURPRC_QU</code>(임대료), <code>TBSM_ADSTRD_SELNG_QU</code>(매출), <code>TBSM_ADSTRD_STOR_QU</code>(점포·개폐업), <code>TBSM_ADSTRD_TRDAR_IX_QU</code>(영업기간). '|'로 구분된 서울 전체 원본 파일을 이름 그대로 등록합니다. 등급은 성동구 행정동만 계산하고, 점포·매출 파일의 다른 구 행정동은 서울 기준점 계산에만 씁니다.</li>
<li><b>신한카드 전 업종 50m 자료</b>(격자 임대료·카드매출과 업종 변화): <code>source_table, ym, grid_50_id, industry, card_amount, card_count</code> 열이 있는 CSV입니다. 내국인·외국인 파일을 모두 등록합니다. 격자 임대료·카드매출 등급은 이 자료의 외식 업종(한식·중식·일식·양식·기타요식·패스트푸드·커피전문점·제과점)으로 계산하므로 250m 식음료 자료는 따로 등록하지 않아도 됩니다. 분기 3개월이 모두 있어야 그 분기의 격자 등급이 계산됩니다. 중심이 성동구 밖에 있는 50m 칸은 화면 등급에서 자동으로 제외합니다.</li>
<li><b>외식업 인허가 자료(LOCALDATA)</b>(격자 종합의 개·폐업과 영업기간): 서울 열린데이터광장 또는 지방행정 인허가데이터의 일반음식점·휴게음식점·제과점영업 <b>업소 전체</b> 파일(CSV 또는 JSONL)입니다. 등록할 때마다 해당 업종 자료 전체를 교체하므로 일부만 잘라서 등록하지 않습니다. 일반음식점·휴게음식점은 <b>서울 전체</b> 파일을 등록해야 서울 기준점(개업률·폐업률·평균 영업기간)이 새 분기로 갱신됩니다. 서울 전체 파일이어도 격자에는 성동구 업소만 배정합니다.</li>
<li><b>서울 기준점</b>: 행정동·격자 등급은 서울 값과 비교합니다. 서울신용보증재단 점포·매출 파일은 <b>서울 전체</b> 파일을 그대로 등록합니다(서울 행정동 중앙값 계산). 한국부동산원 R-ONE의 '소규모 상가 임대가격지수(서울)' 분기 값은 위 입력란에 직접 등록합니다. 기준점이 없는 분기는 '서울 기준점 없음'으로 표시되고 등급이 계산되지 않습니다.</li>
<li><b>성수동 팝업 주간 현황(엑셀)</b>(팝업 압력 참고 지도): 구청 주간 현황 파일을 그대로 등록합니다. 주차와 팝업을 자동으로 인식하고 도로명주소로 격자를 찾습니다. 찾지 못한 주소는 등록 기록에 건수로 표시합니다. 표의 '서울숲 일대'처럼 범위가 넓은 위치는 격자에 넣지 않습니다.</li>
<li><b>확인</b>: 아래 등록 기록에서 자료 종류·분기·행 수를 확인합니다. '기준 분기' 목록에 새 분기가 '(등록 자료)'로 나타나면 반영된 것입니다. 행정동·격자 등급, 다음 분기 예측, 사전 예측 검증이 함께 갱신됩니다.</li>
<li><b>보관·공유</b>: 등록 자료는 이 브라우저에만 저장됩니다. '등록 자료 내보내기'로 파일을 보관하고, 다른 PC나 담당자는 '등록 자료 불러오기'로 같은 상태를 만들 수 있습니다.</li>
<li><b>유의사항</b>: 브라우저 저장공간을 지우면 등록 자료도 지워지므로 분기마다 내보내기 파일을 보관합니다. '인식할 수 없는 파일'로 표시되면 열 이름이 원본과 다른 것이므로 원본 파일을 다시 등록합니다.</li>
</ol></details>`;
export async function handleFiles(files, up, base) {
  for (const file of files) {
    const buf = await file.arrayBuffer();
    if (new Uint8Array(buf, 0, 2)[0] === 0x50 && new Uint8Array(buf, 0, 2)[1] === 0x4b) {
      const parsed = parsePopupSheet(await readXlsx(buf));
      if (parsed) { base.addressGrid ||= await (await fetch('/data/grades/address_grid.json')).json(); const before = (up.popups?.unresolved || []).length; ingestPopups(parsed, up, base.addressGrid); (up.log ||= []).push({ at: new Date().toLocaleString('ko-KR'), file: file.name, kind: 'popup', quarters: [`${parsed.week.start}~${parsed.week.end}`], rows: parsed.items.length, unresolved: up.popups.unresolved.length - before }); }
      else (up.log ||= []).push({ at: new Date().toLocaleString('ko-KR'), file: file.name, kind: null, quarters: [], rows: 0 });
      continue;
    }
    const rows = parseDelimited(decode(buf)), kind = kindOf(rows);
    if (kind) ingest(rows, kind, up, base);
    const quarters = kind === 'license' ? ['업소 전체'] : kind === 'allind' ? [...new Set(rows.map(r => { const y = r.ym.replace(/[^0-9]/g, ''); return `${y.slice(0, 4)}Q${Math.floor((+y.slice(4, 6) - 1) / 3) + 1}`; }))].sort() : kind === 'card' ? [...new Set(rows.map(r => r.quarter || (r.ref_month ? `${r.ref_month.slice(0, 4)}Q${Math.floor((+r.ref_month.slice(5, 7) - 1) / 3) + 1}` : '')))].filter(Boolean) : [...new Set(rows.map(r => r.STDR_YYQU_CD && qOf(r.STDR_YYQU_CD)))].filter(Boolean);
    (up.log ||= []).push({ at: new Date().toLocaleString('ko-KR'), file: file.name, kind, quarters, rows: rows.length });
  }
  return up;
}
