export const STAGES = {
  P0: { name: '자료 부족 · 유보', color: '#a9b4b5', short: '유보' },
  S0: { name: '뚜렷한 복합신호 없음', color: '#78a78f', short: '복합신호 없음' },
  S1: { name: '변화 관찰', color: '#8aafbe', short: '변화 관찰' },
  S2: { name: '개별 악화신호', color: '#d8bc73', short: '개별신호' },
  S3: { name: '복합 악화신호', color: '#cb8b65', short: '복합신호' },
  S4: { name: '복합신호 지속 · 검증 필요', color: '#ac6c6b', short: '지속 관측' },
};
export const NAV = [
  ['overview', '개요', 'home'], ['map', '지역 살펴보기', 'map'],
  ['policy', '정책 적용 범위', 'layers'], ['evidence', '연구 근거', 'chart'], ['review', '검토 노트', 'file'],
];
export const SOURCES = [
  { id: 'plan', label: '2026 지속가능발전계획', org: '성동구', date: '2026.09.23', url: 'https://www.sd.go.kr/main/selectBbsNttView.do?bbsNo=184&key=1473&nttNo=361632', note: '전체 구역과 부분 입점 제한을 구분한 공식 계획' },
  { id: 'support', label: '안심상가 5·11호점 모집 공고', org: '성동구', date: '2025.11.24', url: 'https://www.sd.go.kr/main/selectBbsNttView.do?bbsNo=184&nttNo=353836&key=1473', note: '종료된 모집의 심사 기준 사례 · 현재 신청 공고 아님' },
  { id: 'data', label: '상권자료 제공 범위와 일정', org: '서울시', date: '공급자 안내', url: 'https://golmok.seoul.go.kr/introduce.do', note: '공개 분기자료 일정 · 사적 월별 파일의 실제 수령일은 별도' },
  { id: 'equivalence', label: '동등성 검정의 원리', org: 'Lakens (2017)', date: '방법론', url: 'https://journals.sagepub.com/doi/10.1177/1948550617697177', note: '비유의성을 효과 부재로 해석하지 않는 근거' },
  { id: 'spatialcv', label: '시공간 구조를 고려한 평가', org: 'Roberts et al. (2017)', date: '방법론', url: 'https://doi.org/10.1111/ecog.02881', note: '목적에 맞는 시간·공간 검증 설계' },
];
export const CHECKS = [
  { id: 'scope', title: '적용 제도와 시점을 구분했나요?', description: '전체 지속가능발전구역·부분 입점 제한·개별 지원사업을 구분합니다.', source: 'plan' },
  { id: 'boundary', title: '해당 필지의 정확한 경계를 확인했나요?', description: '참고용 도면과 지번표만으로 측량·개별 대상 여부를 확정하지 않습니다.', source: 'plan' },
  { id: 'time', title: '관측 시점과 검토 시점이 다른가요?', description: '종합지도 2026.03, 카드 비교 2026.06–08, 정책 계획 2026.09를 섞지 않습니다.', source: 'data' },
  { id: 'criteria', title: '개별 심사 증빙이 필요한가요?', description: '신청인 계약·재무·고용 자료는 집계구 지표로 대체할 수 없습니다.', source: 'support' },
  { id: 'uncertainty', title: '판정의 민감도와 누락을 읽었나요?', description: '단계가 바뀔 수 있는 범위와 미관측 자료를 검토합니다. 유보는 안정이 아닙니다.', source: 'equivalence' },
  { id: 'future', title: '과거 결과를 미래 예측으로 사용하지 않았나요?', description: '현재 정책용으로 검증·승인된 미래 예측은 없습니다.', source: 'spatialcv' },
];
export const EVIDENCE_GAPS = ['정확한 법정 경계와 개별 적용 요건', '독립적인 신청인·피해 증빙', '정책 허용손실과 오판 기준', '실제 수령판본으로 검증한 미래 예측'];
export function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
export function recordAt(data, id, month) { return data.records[id]?.find(r => r.month === month) || null; }
export function metricSummary(data, month, dong = 'all') {
  const grids = data.grids.filter(g => dong === 'all' || g.dong === dong);
  const counts = Object.fromEntries(Object.keys(STAGES).map(k => [k, 0]));
  let stable = 0, stabilityN = 0;
  for (const g of grids) {
    const r = recordAt(data, g.id, month); counts[r?.stage || 'P0']++;
    if (month === '2026-03' && r?.stage !== 'P0') { stabilityN++; if (g.stabilityMarch.stable) stable++; }
  }
  return { total: grids.length, counts, observed: grids.length - counts.P0, complex: counts.S3 + counts.S4, stable, stabilityN };
}
export function stabilityFor(grid, month) { return month === '2026-03' ? grid.stabilityMarch : null; }
export function pathFor(geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polygons.map(poly => poly.map(ring => ring.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ') + ' Z').join(' ')).join(' ');
}
export function percent(value) { return value == null || !Number.isFinite(value) ? '미확인' : `${(value * 100).toFixed(1)}%`; }
export function normalizeParcel(query) {
  const match = query.trim().replace(/[－–—]/g, '-').match(/(?:서울(?:특별시)?\s*)?(?:성동구\s*)?성수동\s*([12])가\s*(\d+)\s*-\s*(\d+)/);
  return match ? `성수동${match[1]}가|${Number(match[2])}|${Number(match[3])}` : null;
}
export function findParcels(parcels, query, street = 'all') {
  const text = query.trim(); const key = normalizeParcel(text);
  return parcels.filter(p => (street === 'all' || p.street === street) && (!text || (key ? p.key === key : `${p.dong} ${p.main}-${p.sub} ${p.street}`.includes(text))));
}
export function parcelStatus(parcel) { return parcel.planned ? '2026.12.01 시행 예정으로 기재' : '기존 제한구역 지번표에 기재'; }
export function defaultNote() { return { version: 1, purpose: '지역 지정 검토', title: '', note: '', checked: [], selected: [], selectedMonths: {}, updatedAt: null }; }
export function sanitizeNote(raw, validIds = [], validMonths = []) {
  const base = defaultNote(); if (!raw || raw.version !== 1) return base;
  return { ...base, purpose: ['지역 지정 검토', '지원 심사 근거 검토'].includes(raw.purpose) ? raw.purpose : base.purpose,
    title: String(raw.title || '').slice(0, 120), note: String(raw.note || '').slice(0, 5000),
    checked: [...new Set(Array.isArray(raw.checked) ? raw.checked.filter(id => CHECKS.some(c => c.id === id)) : [])],
    selected: [...new Set(Array.isArray(raw.selected) ? raw.selected.filter(id => validIds.includes(id)) : [])].slice(0, 12),
    selectedMonths: Object.fromEntries(Object.entries(raw.selectedMonths && typeof raw.selectedMonths === 'object' ? raw.selectedMonths : {}).filter(([id,month]) => validIds.includes(id) && validMonths.includes(month))),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null };
}
export function policyReadiness() { return { approved: false, verdict: '추가 근거 확보 전 정책 판정 보류', gaps: [...EVIDENCE_GAPS] }; }
export function markdownReport(note, data) {
  const lines = ['# 성수 관측실 · 정책 검토 메모', '', `작성 제목: ${note.title || '제목 없는 검토'}`, `검토 목적: ${note.purpose}`, `연구 기준: ${data.meta.researchAsOf}`, `종합자료 공통 최신월: ${data.meta.observationMonth} (선택 지역의 관측월은 아래에 별도 표시)`, '', '## 판정 범위', policyReadiness().verdict, '이 문서는 연구 근거 검토용이며 지정·지원 승인 또는 개인의 적격성 판정이 아닙니다.', '', '## 선택한 지역'];
  for (const id of note.selected) { const g = data.grids.find(g => g.id === id); const month = data.meta.months.includes(note.selectedMonths?.[id]) ? note.selectedMonths[id] : data.meta.observationMonth; const r = recordAt(data, id, month); if (g) lines.push(`- ${id} · ${g.dong} · ${STAGES[r?.stage || 'P0'].name} · 관측 ${month}`); }
  if (!note.selected.length) lines.push('- 선택 없음');
  lines.push('', '## 사용자가 검토 표시한 항목');
  for (const c of CHECKS) lines.push(`- [${note.checked.includes(c.id) ? 'x' : ' '}] ${c.title}`);
  lines.push('※ 체크는 근거 열람 기록이며 정책 요건 충족·사실 확인 완료를 의미하지 않습니다.', '', '## 검토 메모', note.note || '(없음)', '', '## 미확보 근거', ...EVIDENCE_GAPS.map(g => `- ${g}`), '', '## 공식 출처', ...SOURCES.slice(0, 3).map(s => `- ${s.label}: ${s.url}`), '', '검토 메모는 사용자 브라우저에만 저장되며 공유 서버에 전송되지 않습니다.');
  return lines.join('\n');
}
