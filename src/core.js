export const NAV = [
  ['overview', '개요', 'home'], ['grades', '등급 모니터링', 'shield'], ['policy', '정책 적용 범위', 'layers'], ['evidence', '연구 근거', 'chart'], ['review', '검토 기록', 'file'],
];
export const SOURCES = [
  { id: 'plan', label: '2026 지속가능발전계획', org: '성동구', date: '2026.09.23', url: 'https://www.sd.go.kr/main/selectBbsNttView.do?bbsNo=184&key=1473&nttNo=361632', note: '지속가능발전구역 전체와 입점 제한 구역을 구분해 정한 공식 계획' },
  { id: 'support', label: '안심상가 5·11호점 모집 공고', org: '성동구', date: '2025.11.24', url: 'https://www.sd.go.kr/main/selectBbsNttView.do?bbsNo=184&nttNo=353836&key=1473', note: '마감된 모집의 심사 기준 사례(현재 신청 공고 아님)' },
  { id: 'data', label: '상권분석서비스 자료 제공 범위와 일정', org: '서울시', date: '제공기관 안내', url: 'https://golmok.seoul.go.kr/introduce.do', note: '분기 자료 공개 일정 안내(실제 자료 수령일은 기관별로 다름)' },
  { id: 'equivalence', label: '동등성 검정의 원리', org: 'Lakens (2017)', date: '분석 방법', url: 'https://journals.sagepub.com/doi/10.1177/1948550617697177', note: '통계적으로 유의하지 않다는 결과를 효과가 없다는 뜻으로 해석하지 않는 근거' },
  { id: 'spatialcv', label: '시간·공간 구조를 고려한 예측 평가', org: 'Roberts et al. (2017)', date: '분석 방법', url: 'https://doi.org/10.1111/ecog.02881', note: '예측 목적에 맞게 시간·공간을 나누어 검증하는 방법' },
];
export const CHECKS = [
  { id: 'scope', title: '적용 제도와 시점 구분', description: '지속가능발전구역 전체, 입점 제한 구역, 개별 지원사업을 구분합니다.', source: 'plan' },
  { id: 'boundary', title: '필지 경계 확인', description: '참고 도면과 지번표만으로는 측량 경계와 개별 적용 여부를 확정할 수 없습니다.', source: 'plan' },
  { id: 'time', title: '자료 시점 확인', description: '등급 기준 분기(2026년 1분기), 카드 자료(2026년 8월), 정책 계획(2026년 9월)의 시점 차이를 확인합니다.', source: 'data' },
  { id: 'criteria', title: '개별 심사 증빙 확인', description: '행정동·격자 지표로 신청인의 계약·재무·고용 증빙을 대신할 수 없습니다.', source: 'support' },
  { id: 'uncertainty', title: '자료 부족·등급 변동 확인', description: '자료 부족으로 등급이 없는 지역과 분기마다 등급이 바뀌는 지역을 따로 확인합니다.', source: 'data' },
  { id: 'future', title: '실제 등급과 예측 구분', description: '다음 분기 예측은 적중률 56% 수준의 참고 정보이므로, 실제 등급을 확인한 뒤 판단합니다.', source: 'spatialcv' },
];
export const EVIDENCE_GAPS = ['정확한 법정 경계와 개별 적용 요건', '신청인별 임대차 피해 증빙', '정책상 허용할 손실과 오판 기준', '다음 분기 이후 실제 자료로 확인한 예측 적중률'];
export function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
export function pathFor(geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polygons.map(poly => poly.map(ring => ring.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ') + ' Z').join(' ')).join(' ');
}
export function normalizeParcel(query) {
  const match = query.trim().replace(/[－–—]/g, '-').match(/(?:서울(?:특별시)?\s*)?(?:성동구\s*)?성수동\s*([12])가\s*(\d+)\s*-\s*(\d+)/);
  return match ? `성수동${match[1]}가|${Number(match[2])}|${Number(match[3])}` : null;
}
export function findParcels(parcels, query, street = 'all') {
  const text = query.trim(); const key = normalizeParcel(text);
  return parcels.filter(p => (street === 'all' || p.street === street) && (!text || (key ? p.key === key : `${p.dong} ${p.main}-${p.sub} ${p.street}`.includes(text))));
}
// 검토 기록: 등록 단위는 'D:행정동코드'(행정동), 분기는 'YYYYQn'. 이전 판(version 1, 격자·월 단위)은 제목·메모·체크만 옮긴다.
export function defaultNote() { return { version: 2, purpose: '지역 지정 검토', title: '', note: '', checked: [], selected: [], selectedQuarters: {}, updatedAt: null }; }
export function sanitizeNote(raw, validIds = [], validQuarters = []) {
  const base = defaultNote(); if (!raw || ![1, 2].includes(raw.version)) return base;
  const keep = { purpose: ['지역 지정 검토', '지원 심사 근거 검토'].includes(raw.purpose) ? raw.purpose : base.purpose,
    title: String(raw.title || '').slice(0, 120), note: String(raw.note || '').slice(0, 5000),
    checked: [...new Set(Array.isArray(raw.checked) ? raw.checked.filter(id => CHECKS.some(c => c.id === id)) : [])],
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null };
  if (raw.version === 1) return { ...base, ...keep };
  return { ...base, ...keep,
    selected: [...new Set(Array.isArray(raw.selected) ? raw.selected.filter(id => validIds.includes(id)) : [])].slice(0, 12),
    selectedQuarters: Object.fromEntries(Object.entries(raw.selectedQuarters && typeof raw.selectedQuarters === 'object' ? raw.selectedQuarters : {}).filter(([id, q]) => validIds.includes(id) && validQuarters.includes(q))) };
}
export function policyReadiness() { return { approved: false, verdict: '추가 근거 확보 전까지 정책 판단 보류', gaps: [...EVIDENCE_GAPS] }; }
// describe(id, quarter): 등록 지역의 표시 문구(예: '성수1가1동 · 2026년 1분기 종합 활성')
export function markdownReport(note, meta, describe = id => id) {
  const lines = ['# 성동구 상권 모니터링 검토서', '', `제목: ${note.title || '(제목 없음)'}`, `검토 목적: ${note.purpose}`, `자료 기준: ${meta.asOf}`, '', '## 판단 범위', policyReadiness().verdict, '이 검토서는 연구 근거를 정리한 기록이며, 구역 지정·지원 승인이나 개인별 자격 판정을 대신하지 않습니다.', '', '## 등록 지역'];
  for (const id of note.selected) lines.push(`- ${describe(id, note.selectedQuarters?.[id])}`);
  if (!note.selected.length) lines.push('- 없음');
  lines.push('', '## 근거 확인 기록');
  for (const c of CHECKS) lines.push(`- [${note.checked.includes(c.id) ? 'x' : ' '}] ${c.title}`);
  lines.push('※ 체크는 담당자가 근거를 확인했다는 기록이며, 사실 확인이나 정책 요건 충족을 인증하지 않습니다.', '', '## 검토 메모', note.note || '(없음)', '', '## 확보하지 못한 근거', ...EVIDENCE_GAPS.map(g => `- ${g}`), '', '## 공식 출처', ...SOURCES.slice(0, 3).map(s => `- ${s.label}: ${s.url}`), '', '이 검토서는 작성자의 브라우저에만 저장되었으며 서버로 전송되지 않았습니다.');
  return lines.join('\n');
}
