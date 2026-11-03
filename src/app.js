import { NAV, SOURCES, CHECKS, EVIDENCE_GAPS, escapeHtml as h, findParcels, sanitizeNote, defaultNote, markdownReport } from './core.js';
import { icon } from './icons.js';
import { gradesPage, buildModel, loadUploads, saveUploads, handleFiles, gradeSummary, dongMap, badge, qLabel, latestQuarter } from './grades.js';

const $ = s => document.querySelector(s);
const STORE = 'seongsu-observatory-note-v1';
const AS_OF = '2026.11.03';
const state = { data: null, parcels: [], requests: new Set(), grades: null, gradeBase: null, gUploads: loadUploads(), gLayer: 'COMP', gQuarter: '', gDong: '', gIssued: null, page: 'overview', parcelQuery: '', street: 'all', parcelLimit: 12, note: defaultNote(), menu: false };
let toastTimer, storageOK = true;
const sourceLink = id => { const s = SOURCES.find(x => x.id === id); return `<a class="source-link" href="${s.url}" target="_blank" rel="noopener noreferrer">${h(s.label)}${icon('external')}</a>`; };
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2700); }
function persist() { state.note.updatedAt = new Date().toISOString(); try { localStorage.setItem(STORE, JSON.stringify(state.note)); storageOK = true; } catch { storageOK = false; toast('브라우저에 저장할 수 없습니다. 검토서를 내려받아 보관하십시오.'); } }
function routeFromHash() {
  const [page, query = ''] = location.hash.slice(1).split('?');
  state.page = NAV.some(n => n[0] === page) ? page : 'overview';
  const p = new URLSearchParams(query);
  if (p.has('dong') && state.data.dongs.some(d => d.code === p.get('dong'))) state.gDong = p.get('dong');
  if (/^\d{4}Q[1-4]$/.test(p.get('quarter') || '')) state.gQuarter = p.get('quarter');
}
function nav() { return NAV.map(([id, label, glyph]) => `<a class="nav-link ${state.page === id ? 'active' : ''}" href="#${id}" ${state.page === id ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span>${id === 'review' && state.note.selected.length ? `<b class="nav-count">${state.note.selected.length}</b>` : ''}</a>`).join(''); }
function shell(content) {
  const title = NAV.find(n => n[0] === state.page)?.[1] || '개요';
  return `<div class="app-layout">${state.menu ? '<button class="menu-backdrop" data-action="menu" aria-label="메뉴 닫기"></button>' : ''}<aside class="sidebar ${state.menu ? 'open' : ''}" aria-label="주 메뉴">
    ${state.menu ? `<button class="icon-btn sidebar-close" data-action="menu" aria-label="주 메뉴 닫기">${icon('close')}</button>` : ''}
    <a href="#overview" class="brand"><span class="brand-mark">${icon('chart')}</span><span>성동구<br>상권 모니터링<small>상권 등급·정책 검토</small></span></a>
    <div class="sidebar-kicker">젠트리피케이션 대응 상권 모니터링</div><nav>${nav()}</nav>
    <div class="sidebar-bottom"><div class="research-stamp"><span class="live-dot"></span>연구 결과 공개<small>${AS_OF} 기준</small></div><a href="https://github.com/DONGJUN92/seongdogu_gentrification" target="_blank" rel="noopener noreferrer">연구 코드(GitHub) ${icon('external')}</a><p>연구 목적의 참고 자료입니다.<br>성동구 공식 행정서비스가 아닙니다.</p></div>
  </aside><div class="main-shell"><header class="topbar"><button class="icon-btn mobile-menu" data-action="menu" aria-label="메뉴 열기" aria-expanded="${state.menu}">${icon('menu')}</button><div class="breadcrumb">성동구 <span>/</span> <strong>${title}</strong></div><div class="top-actions"><span class="research-tag">참고용 연구 자료</span><button class="button small ghost" data-action="method">${icon('info')}이용 안내</button></div></header>
  <main id="main" tabindex="-1">${content}</main><footer class="page-footer"><span>성동구 상권 모니터링 <span class="footer-dot">·</span> 연구 결과 공개</span><span>자료 기준 시점과 공간 범위를 함께 확인하십시오</span></footer></div></div>`;
}
function titleBlock(eyebrow, title, subtitle, action = '') { return `<div class="page-title"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${action}</div>`; }
function overview() {
  const gs = state.grades, s = gs && gradeSummary(gs, state.data), names = list => list.map(d => d.name).join(', ') || '해당 없음';
  const card = (label, glyph, value, unit, note, accent = '') => `<article class="stat-card ${accent}"><div class="stat-label">${label} ${icon(glyph)}</div><div class="stat-value">${value}${unit}</div><p>${note}</p></article>`;
  return `<section class="overview-hero"><div class="hero-copy"><p class="eyebrow">성동구 상권 모니터링</p><h1>상권 등급 현황과<br><em>정책 검토 근거</em></h1><p>성동구 17개 행정동과 250m 격자의 상권 등급(활성·쇠퇴·위험)을 분기별로 확인하고, 정책 적용 범위와 검토 기록을 함께 관리합니다.</p><a class="button primary" href="#grades">등급 모니터링 바로가기 ${icon('arrow')}</a></div><div class="hero-map" aria-hidden="true" inert>${gs ? dongMap(gs, state.data, 'COMP', s.q, '', 'mini-map') : ''}<span class="map-caption">행정동 종합 등급 · ${h(s ? qLabel(s.q) : '')}</span><div class="hero-map-note">${['활성', '쇠퇴', '위험'].map(g => badge(g)).join(' ')}</div></div></section>
  <div class="snapshot-bar"><span>${icon('clock')}등급 기준 <strong>${h(s ? qLabel(s.q) : '–')}</strong></span><span>임대료·매출 자료 <strong>~2026년 1분기</strong></span><span>카드 자료 <strong>~2026년 8월</strong></span><span>인허가 자료 <strong>2026년 9월 수집</strong></span><button data-action="sources" class="text-button">자료 출처 ${icon('arrow')}</button></div>
  ${s ? `<section class="stat-grid" aria-label="등급 요약">${card('종합 위험 행정동', 'shield', s.risk.length, '<span class="stat-denominator"> / 17</span>', `위험 항목이 3개 이상인 동: ${h(names(s.risk))}`)}${card('정밀 진단 대상', 'chart', s.deep.length, '<small>개 동</small>', `종합 위험 2분기 연속: ${h(names(s.deep))}`)}${card('위험 격자(250m)', 'map', s.gridRisk, `<span class="stat-denominator"> / ${s.gridTotal}</span>`, '외식업 밀집 격자의 종합 등급 기준')}${card(`${h(qLabel(s.forecastTarget))} 위험 예측`, 'clock', s.forecastRisk.length, '<small>개 동</small>', `참고용 예측: ${h(names(s.forecastRisk))}`, 'accent')}</section>` : '<div class="panel"><p class="small-copy">등급 자료를 불러오는 중입니다.</p></div>'}
  <section class="overview-columns"><article class="panel"><div class="section-heading"><div><p class="eyebrow">등급 산출 방식</p><h2>4개 항목으로 상권 상태를 판단합니다</h2></div></div><ul class="plain-list"><li><b>임대료·매출</b> 임대료 상승이 매출 증가를 앞지르는지</li><li><b>개·폐업</b> 개업과 폐업이 함께 많아 점포 교체가 과도한지</li><li><b>영업기간</b> 오래 영업한 점포가 문을 닫고 있는지</li><li><b>업종 변화</b> 생활밀착 점포가 줄고 외식업 비중이 늘고 있는지</li></ul><p class="small-copy">위험 항목이 3개 이상이면 종합 위험, 2분기 연속이면 정밀 진단 대상입니다. 분기마다 서울신용보증재단·카드·인허가 자료를 등록하면 자동으로 갱신됩니다.</p><a class="inline-link" href="#grades">등급과 활용 지침 보기 ${icon('arrow')}</a></article>
  <article class="panel workflow-card"><div class="section-heading"><div><p class="eyebrow">이용 순서</p><h2>정책 검토 절차</h2></div>${icon('file')}</div><a href="#grades" class="workflow-step"><b>01</b><div><h3>등급 확인</h3><p>행정동·격자 등급, 점검 대상, 다음 분기 예측</p></div>${icon('chevron')}</a><a href="#policy" class="workflow-step"><b>02</b><div><h3>정책 적용 범위 확인</h3><p>지속가능발전구역 · 입점 제한 지번 · 안심상가 심사</p></div>${icon('chevron')}</a><a href="#review" class="workflow-step"><b>03</b><div><h3>검토 기록 작성</h3><p>확인 근거 기록 · 검토서 내려받기</p></div>${icon('chevron')}</a><div class="workflow-bottom">${icon('shield')}지원 대상 선정이나 정책 도입 여부를 자동으로 판정하지 않습니다.</div></article></section>`;
}
function policyPage() {
  const matches = findParcels(state.parcels, state.parcelQuery, state.street);
  return `${titleBlock('정책 적용 범위', '정책 적용 범위', '성수동을 대상으로 한 제도와 모집 사례입니다. 성동구 전체에 같은 규제가 적용되는 것은 아닙니다.')}
  <div class="policy-overview"><article class="panel policy-area"><span class="number-label">01 / 지역 지정</span><h2>지속가능발전구역</h2><div class="policy-large">225.0<small>만 ㎡</small></div><p>2023.08.10 확대 지정(성수동 일부 제외)<br>2026년 계획에서 전체 범위 유지</p><span class="pill amber">정확한 법정 경계는 별도 확인</span></article><article class="panel policy-area"><span class="number-label">02 / 입점 제한 구역</span><h2>입점 제한 지번</h2><div class="policy-large">547<small>개 지번</small></div><p>공식 지번표 550행 중 중복 3개 지번 제외<br>지속가능발전구역 전체 지번과는 다른 목록</p><span class="pill">원문과 대조 완료</span></article><article class="panel policy-area"><span class="number-label">03 / 개별 신청 심사</span><h2>안심상가 입주 심사</h2><div class="policy-large">100<small>점 + 가점 10점</small></div><p>2025년 마감된 5·11호점 모집 사례<br>개별 계약·재무 증빙과 면접 필요</p><span class="pill amber">이 지표로 개인 점수를 매길 수 없음</span></article></div>
  <div class="notice amber">${icon('clock')}<div><strong>연무장길·방송대길 입점 제한 확대: 2026.12.01 시행 예정</strong><span>시행 전까지는 현행 규제로 적용할 수 없습니다. 실제 시행 내용과 예외 동의 여부는 별도로 확인해야 합니다.</span></div></div>
  <section class="panel parcel-panel"><div class="section-heading"><div><p class="eyebrow">공식 지번목록</p><h2>입점 제한 지번 조회</h2></div>${sourceLink('plan')}</div><p class="section-description">공식 목록에 지번이 포함되는지 조회합니다. 조회 결과만으로 입점 허용·제한이나 지원 대상 여부를 확정할 수 없습니다.</p><div class="parcel-search-row"><label class="search-field large">${icon('search')}<input id="parcel-search" value="${h(state.parcelQuery)}" placeholder="예: 성수동1가 685-283 또는 685-283" aria-label="지번 검색"></label><select id="street" aria-label="거리 선택"><option value="all">전체 거리</option>${['서울숲길', '연무장길', '방송대길'].map(s => `<option ${state.street === s ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="button ghost" data-action="clear-parcel">초기화</button></div><div class="table-meta"><b>${matches.length}개 지번</b><span>목록 기준: 2026년 9월 지속가능발전계획 부록(52~54쪽)</span></div><div class="table-scroll"><table class="data-table"><thead><tr><th>지번</th><th>거리</th><th>적용 시점</th><th>확인 사항</th></tr></thead><tbody>${matches.slice(0, state.parcelLimit).map(p => `<tr><td><b>${h(p.dong)} ${p.main}-${p.sub}</b></td><td>${h(p.street)}</td><td><span class="pill ${p.planned ? 'amber' : ''}">${p.planned ? '2026.12.01 시행 예정' : '기존 제한구역'}</span></td><td>${p.rows > 1 ? '<span class="duplicate-note">원문 중복 · 확인 필요</span>' : '<span class="muted">개별 적용 요건 별도 확인</span>'}</td></tr>`).join('') || '<tr><td colspan="4"><div class="empty-state">일치하는 지번이 없습니다<p>목록에 없다는 이유만으로 대상 제외·입점 허용·지원 부적격으로 판단할 수 없습니다.</p></div></td></tr>'}</tbody></table></div>${matches.length > state.parcelLimit ? `<button class="button ghost more-button" data-action="more-parcels">지번 더 보기 (${Math.min(state.parcelLimit, matches.length)}/${matches.length})</button>` : ''}<div class="source-footnote">${icon('info')}서울숲길 중복 지번: 성수동1가 685-283, 685-477, 685-478 (원문 550행, 고유 지번 547개)</div></section>
  <div class="two-columns"><section class="panel"><div class="section-heading"><div><p class="eyebrow">심사 증빙</p><h2>개별 심사에 필요한 증빙</h2></div></div><div class="rubric"><div><span>젠트리피케이션 피해 정도</span><b>20점</b><small>개별 임대료 인상률 · 환산보증금</small></div><div><span>사업 성과와 성장 가능성</span><b>50점</b><small>사업계획 · 재정 건전성 · 영업력</small></div><div><span>공동체 가치와 기여</span><b>30점</b><small>대표성 · 보호 필요성 · 사회 기여 증빙</small></div><div><span>고용·소재지 등 가점</span><b>10점</b><small>고용·사업자·거주 증빙</small></div></div><p class="small-copy">마감된 특정 모집 공고의 배점 사례로, 다른 지원사업에 그대로 적용할 수 없습니다.</p>${sourceLink('support')}</section><section class="panel policy-limits"><p class="eyebrow">추가 확인 사항</p><h2>지도 밖에서 확인할 사항</h2><ul class="plain-list"><li>정확한 지적 경계와 필지 분할·합병 여부</li><li>개별 업소의 층·업종·가맹점 여부·예외 동의</li><li>신청인의 실제 임대차 피해와 지원 자격</li><li>정책상 허용할 수 있는 손실과 오판 기준</li></ul><a href="#review" class="button primary">검토 기록 작성 ${icon('arrow')}</a></section></div>`;
}
function evidencePage() {
  return `${titleBlock('연구 근거', '연구 근거', '등급 모니터링을 만들기 전 단계(2026년 10월)에 검토한 분석과 근거 자료입니다.')}
  <div class="evidence-verdict"><span>${icon('shield')}</span><div><p class="eyebrow">이 화면의 범위</p><h2>이전 단계의 탐색 분석 기록입니다</h2><p>현재 등급의 산출 기준과 검증 결과(다음 분기 적중률 등)는 '등급 모니터링' 화면에서 확인하십시오. 아래 결과는 채택하지 않은 분석 방법을 포함합니다.</p></div></div>
  <div class="two-columns"><section class="panel"><div class="section-heading"><div><p class="eyebrow">예측 방법 비교</p><h2>추정매출 변화 예측: 신경망 모형 비교</h2></div><span class="pill amber">과거 자료로 사후 평가</span></div><p class="section-description">성수동 534건 · 8개 시점 · 3개월 뒤 예측<br>같은 실험에서 저장한 예측값 비교</p><div class="bar-chart"><div><span>기준 모형</span><i style="width:92%;background:#c0cdcb"></i><b>0.389903</b></div><div><span>시계열 신경망(GRU)</span><i style="width:86.6%;background:#518b80"></i><b>0.367190</b></div><div><span>관계 신경망(GNN)</span><i style="width:86.7%;background:#a77c64"></i><b>0.367368</b></div></div><p class="chart-caption">평균 예측 오차(RMSE) · 값이 작을수록 정확 · 막대는 0에서 시작</p><div class="insight-note">${icon('info')}<p>관계 신경망의 오차가 시계열 신경망보다 0.05% 커서, 상권 간 관계 정보를 더해도 예측이 나아지지 않았습니다. 다만 모든 관계 신경망이 더 못하다는 뜻은 아닙니다.</p></div><p class="small-copy">별도로 보관한 추정매출 모형의 오차는 0.359056이며, 학습 방식이 달라 위 비교에는 넣지 않았습니다.</p></section>
  <section class="panel"><div class="section-heading"><div><p class="eyebrow">인접 지역 영향 검토</p><h2>인접 지역 영향이 없다고 볼 수 있는가</h2></div></div><div class="big-statement">판단 <em>근거 부족</em></div><div class="evidence-stat-row"><div><strong>0.64</strong><span>최초 검정 256건의 가장 작은 보정 유의확률</span></div><div><strong>0.9633</strong><span>재검정 16건의 가장 작은 보정 유의확률</span></div></div><p>표본이 작아 인접 지역의 영향을 찾아내지 못했을 수 있습니다. 영향 계수 0.2를 가정한 모의실험에서 영향을 찾아낸 비율은 <b>21.8~38.2%</b>였습니다.</p><div class="source-footnote">통계적으로 유의하지 않다는 결과만으로 영향이 없다고 볼 수 없습니다.</div>${sourceLink('equivalence')}</section></div>
  <section class="panel evidence-matrix"><div class="section-heading"><div><p class="eyebrow">이전 단계 지표</p><h2>지표별 측정 내용과 활용 현황</h2></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>지표</th><th>측정 내용</th><th>활용 현황</th><th>유의사항</th></tr></thead><tbody><tr><td><b>임대료·매출</b></td><td>행정동별 임대료·매출 변화 4개 유형</td><td>현재 등급의 '임대료·매출' 항목으로 발전</td><td>개별 임대차 피해를 나타내지 않음</td></tr><tr><td><b>소비 구성</b></td><td>카드 결제 중 카페·제과 비중 변화</td><td>예측에 사용하지 않음</td><td>전체 소비나 인과관계를 나타내지 않음</td></tr><tr><td><b>생활기반 업종</b></td><td>생활기반·교육 업종 점포 비중</td><td>예측에 사용하지 않음</td><td>개별 상인의 이전·퇴거를 나타내지 않음</td></tr><tr><td><b>추정매출</b></td><td>같은 자료의 3개월 명목매출 변화</td><td>과거 자료로 사후 평가만 실시</td><td>실제 측정 매출이 아님</td></tr><tr><td><b>폐업 강도</b></td><td>폐업 점포 수 ÷ 기준 점포 수</td><td>현재 등급의 '개·폐업' 항목으로 발전</td><td>개인별 폐업 가능성이나 강제 퇴거를 나타내지 않음</td></tr></tbody></table></div></section>
  <section class="panel source-library"><div class="section-heading"><div><p class="eyebrow">출처</p><h2>정책·분석 방법 근거 자료</h2></div><a href="/data/release-manifest.json" target="_blank" rel="noopener" class="text-button">공개 자료 목록(파일 확인값) ${icon('external')}</a></div><div class="source-grid">${SOURCES.map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer" class="source-card"><span>${h(s.org)} · ${h(s.date)}</span><h3>${h(s.label)} ${icon('external')}</h3><p>${h(s.note)}</p></a>`).join('')}</div><div class="source-footnote">자료 품질 점검, 원문 대조, 파일 확인값 검증은 계산과 파일이 일관되다는 근거입니다. 정책 효과나 법적 승인을 뜻하지 않습니다.</div></section>`;
}
function unitLabel(id, quarter) {
  const code = id.slice(2), d = state.data.dongs.find(x => x.code === code), q = quarter || (state.grades && latestQuarter(state.grades));
  const g = state.grades?.panel[q]?.[code]?.COMP;
  return `${d?.name || id}${q ? ` · ${qLabel(q)} 종합 ${g || '자료 부족'}` : ''}`;
}
function reviewPage() {
  const n = state.note;
  return `${titleBlock('검토 기록', '검토 기록', '확인한 근거와 추가로 필요한 자료를 기록하고 검토서를 내려받습니다.', `<button class="button primary" data-action="export-md">${icon('download')}검토서 내려받기</button>`)}
  <div class="notice subtle">${icon('shield')}<div><strong>이 브라우저에만 저장됩니다</strong><span>서버로 전송되지 않으며 기관 간 공유나 실제 심사 처리 기능은 없습니다. 개인 식별정보나 신청인의 민감한 자료는 입력하지 마십시오.</span></div></div>
  <div class="review-layout"><div><section class="panel"><div class="section-heading"><h2>검토 개요</h2><span class="pill">초안</span></div><div class="form-field"><label for="note-title">검토 제목</label><input id="note-title" maxlength="120" placeholder="예: 서울숲길 상권 변화와 정책 적용 범위 검토" value="${h(n.title)}"></div><div class="form-field"><label for="note-purpose">검토 목적</label><select id="note-purpose"><option ${n.purpose === '지역 지정 검토' ? 'selected' : ''}>지역 지정 검토</option><option ${n.purpose === '지원 심사 근거 검토' ? 'selected' : ''}>지원 심사 근거 검토</option></select></div><h3 class="form-subtitle">등록 지역 <small>${n.selected.length}/12</small></h3><div class="saved-regions">${n.selected.map(id => `<div><a href="#grades?dong=${encodeURIComponent(id.slice(2))}${n.selectedQuarters[id] ? `&quarter=${n.selectedQuarters[id]}` : ''}">${icon('pin')}<span>${h(unitLabel(id, n.selectedQuarters[id]).split(' · ')[0])}<small>${h(unitLabel(id, n.selectedQuarters[id]).split(' · ').slice(1).join(' · '))}</small></span></a><button class="icon-btn" data-remove="${h(id)}" aria-label="${h(unitLabel(id))} 등록 해제">${icon('close')}</button></div>`).join('') || '<div class="empty-state small">등록한 지역이 없습니다<a href="#grades" class="inline-link">등급 모니터링에서 행정동 등록 →</a></div>'}</div><div class="form-field"><label for="note-text">확인 근거와 추가 확인 사항</label><textarea id="note-text" maxlength="5000" rows="7" placeholder="등급 변화, 참고한 정책 문서, 추가로 확인할 사항을 적습니다.">${h(n.note)}</textarea><div class="input-help"><span>개별 신청인 증빙을 대신할 수 없습니다</span><span id="note-length">${n.note.length}/5,000</span></div></div><div class="form-actions"><span id="save-status">${storageOK ? (n.updatedAt ? '이 브라우저에 저장됨' : '입력하면 자동으로 저장됩니다') : '저장할 수 없습니다. 파일로 보관하십시오.'}</span><button class="button ghost small" data-action="export-json">JSON으로 백업</button></div></section></div>
  <aside><section class="panel checklist"><div class="section-heading"><div><p class="eyebrow">근거 확인 항목</p><h2>근거 확인 기록</h2></div><b class="check-counter">${n.checked.length}/6</b></div><p class="small-copy">체크는 담당자가 해당 근거를 확인했다는 기록이며, 사실 확인이나 정책 요건 충족을 인증하지 않습니다.</p>${CHECKS.map(c => `<div class="check-item"><label><input type="checkbox" data-check="${c.id}" ${n.checked.includes(c.id) ? 'checked' : ''}><span><b>${h(c.title)}</b><small>${h(c.description)}</small></span></label>${sourceLink(c.source)}</div>`).join('')}</section><section class="review-verdict"><p class="eyebrow">근거 확보 현황</p><h3>추가 근거 확보 전까지<br>정책 판단 보류</h3><p>모든 항목을 체크해도 정책 활용이 승인되는 것은 아닙니다.</p><ul>${EVIDENCE_GAPS.map(g => `<li>${h(g)}</li>`).join('')}</ul></section></aside></div>`;
}
function render() {
  const focus = document.activeElement, id = focus?.id, pos = typeof focus?.selectionStart === 'number' ? focus.selectionStart : null;
  const pages = { overview, grades: () => gradesPage(state, state.data), policy: policyPage, evidence: evidencePage, review: reviewPage };
  $('#app').innerHTML = shell(pages[state.page]());
  document.title = `${NAV.find(n => n[0] === state.page)?.[1]} · 성동구 상권 모니터링`;
  if (id && document.getElementById(id)) { const el = document.getElementById(id); el.focus({ preventScroll: true }); if (pos != null && el.setSelectionRange) el.setSelectionRange(pos, pos); }
}
async function loadGrades() {
  if (state.requests.has('grades')) return; state.requests.add('grades');
  try { const r = await fetch('/data/grades/base.json'); if (!r.ok) throw Error('grades'); state.gradeBase = await r.json(); try { const i = await fetch('/data/grades/issued_2026Q2.json'); if (i.ok) state.gIssued = await i.json(); } catch {} refreshGrades(); } catch { toast('등급 자료를 불러오지 못했습니다.'); } finally { state.requests.delete('grades'); }
}
function refreshGrades() { state.grades = buildModel(state.gradeBase, state.gUploads, state.data); render(); }
function addUnit(unit, quarter) {
  if (state.note.selected.includes(unit)) { state.note.selectedQuarters[unit] = quarter; persist(); toast('기준 분기를 바꿔 다시 등록했습니다.'); render(); return; }
  if (state.note.selected.length >= 12) { toast('등록할 수 있는 지역은 최대 12곳입니다.'); return; }
  state.note.selected.push(unit); state.note.selectedQuarters[unit] = quarter; persist(); toast('검토 기록에 추가했습니다.'); render();
}
function download(content, name, type) { const a = document.createElement('a'); const url = URL.createObjectURL(new Blob([content], { type })); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
function modal(kind) {
  const content = kind === 'sources' ? `<h2>자료 기준 시점</h2><div class="modal-date-row"><b>등급 기준 분기</b><span>2026년 1분기</span></div><div class="modal-date-row"><b>카드 자료 최신월</b><span>2026년 8월</span></div><div class="modal-date-row"><b>외식업 인허가 자료 수집</b><span>2026년 9월</span></div><div class="modal-date-row"><b>정책 계획 공고</b><span>2026.09.23</span></div><div class="modal-date-row"><b>연구 결과 공개</b><span>${AS_OF}</span></div><p>자료마다 기준 시점이 다릅니다. 자동 갱신이나 실시간 조회 기능은 없으며, 분기 자료를 등록해야 등급이 갱신됩니다.</p>${SOURCES.slice(0, 3).map(s => `<p>${sourceLink(s.id)}</p>`).join('')}`
    : `<p class="eyebrow">이용 안내</p><h2>등급 확인 → 정책 범위 확인 → 검토 기록</h2><p>성동구 상권 등급과 정책 검토 근거를 함께 조회하는 연구 결과 공개 화면입니다. 성동구 공식 행정서비스가 아니며, 지원 대상 여부를 판정하지 않습니다.</p><h3>등급 읽는 법</h3><p>행정동마다 임대료·매출, 개·폐업, 영업기간, 업종 변화 4개 항목을 활성·쇠퇴·위험으로 나누고, 위험 항목이 3개 이상이면 종합 위험으로 봅니다. 종합 위험이 2분기 연속이면 정밀 진단 대상으로 표시합니다.</p><div class="modal-stages">${['활성', '쇠퇴', '위험', null].map(g => `<div>${badge(g)}</div>`).join('')}</div><h3>자료 부족</h3><p>필요한 자료가 없거나 표본이 적으면 등급을 표시하지 않습니다. 등급이 없다고 해서 변화가 없다는 뜻은 아닙니다.</p><h3>검토 기록</h3><p>메모는 이 브라우저에만 저장됩니다. 민감한 정보는 입력하지 말고, 필요하면 검토서를 내려받아 보관하십시오.</p>`;
  const root = $('#dialog-root'); root.innerHTML = `<dialog id="info-dialog" aria-label="이용 안내"><button class="icon-btn dialog-close" data-action="close-dialog" aria-label="닫기">${icon('close')}</button>${content}<button class="button primary" data-action="close-dialog">확인</button></dialog>`; $('#info-dialog').showModal(); $('#info-dialog').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
}
document.addEventListener('click', async e => {
  if (!state.data) return;
  const gd = e.target.closest('[data-gdong]'); if (gd) { state.gDong = gd.dataset.gdong; if (state.page !== 'grades') location.hash = `#grades?dong=${gd.dataset.gdong}`; else render(); return; }
  const ga = e.target.closest('[data-gact]'); if (ga) { if (ga.dataset.gact === 'export') download(JSON.stringify(state.gUploads), '성동구상권모니터링_등록자료.json', 'application/json'); if (ga.dataset.gact === 'reset' && confirm('이 브라우저에 저장된 등록 자료를 모두 지울까요?')) { state.gUploads = { dong: {}, grid: {}, log: [] }; saveUploads(state.gUploads); refreshGrades(); } return; }
  const remove = e.target.closest('[data-remove]'); if (remove) { state.note.selected = state.note.selected.filter(id => id !== remove.dataset.remove); delete state.note.selectedQuarters[remove.dataset.remove]; persist(); render(); return; }
  const el = e.target.closest('[data-action]'), action = el?.dataset.action;
  if (action === 'method' || action === 'sources') modal(action);
  if (action === 'close-dialog') $('#info-dialog')?.close();
  if (action === 'menu') { state.menu = !state.menu; render(); }
  if (action === 'save-unit') addUnit(el.dataset.unit, el.dataset.quarter);
  if (action === 'clear-parcel') { state.parcelQuery = ''; state.street = 'all'; state.parcelLimit = 12; render(); }
  if (action === 'more-parcels') { state.parcelLimit += 30; render(); }
  if (action === 'export-md') { download(markdownReport(state.note, { asOf: `${AS_OF} 공개 · 등급 기준 ${state.grades ? qLabel(latestQuarter(state.grades)) : '-'}` }, unitLabel), '성동구상권모니터링_검토서.md', 'text/markdown;charset=utf-8'); toast('검토서를 내려받았습니다.'); }
  if (action === 'export-json') { download(JSON.stringify({ ...state.note, asOf: AS_OF, policyApproval: false }, null, 2), '성동구상권모니터링_검토기록.json', 'application/json'); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.menu) { state.menu = false; render(); $('.mobile-menu')?.focus(); return; } const d = e.target.closest?.('[data-gdong]'); if (d && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); d.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
document.addEventListener('change', e => {
  if (!state.data) return; const t = e.target;
  if (t.id === 'g-quarter') { state.gQuarter = t.value; render(); return; }
  if (t.id === 'g-layer') { state.gLayer = t.value; render(); return; }
  if (t.id === 'g-files' && t.files.length) { handleFiles([...t.files], state.gUploads, state.gradeBase).then(up => { state.gUploads = up; if (!saveUploads(up)) toast('브라우저에 저장할 수 없습니다. 등록 자료를 내보내 보관하십시오.'); else toast('자료를 등록했습니다.'); refreshGrades(); }); return; }
  if (t.id === 'g-import' && t.files.length) { t.files[0].text().then(x => { const up = JSON.parse(x); if (!up || typeof up.dong !== 'object') throw Error('format'); state.gUploads = up; saveUploads(up); toast('등록 자료를 불러왔습니다.'); refreshGrades(); }).catch(() => toast('불러오지 못했습니다. 내보내기로 만든 JSON 파일을 선택하십시오.')); return; }
  if (t.id === 'street') { state.street = t.value; state.parcelLimit = 12; render(); }
  if (t.id === 'note-purpose') { state.note.purpose = t.value; persist(); }
  if (t.dataset.check) { state.note.checked = t.checked ? [...new Set([...state.note.checked, t.dataset.check])] : state.note.checked.filter(k => k !== t.dataset.check); persist(); render(); }
});
document.addEventListener('input', e => {
  if (!state.data) return; const t = e.target;
  if (t.id === 'parcel-search') { state.parcelQuery = t.value; state.parcelLimit = 12; render(); }
  if (t.id === 'note-title' || t.id === 'note-text') { state.note[t.id === 'note-title' ? 'title' : 'note'] = t.value; persist(); if ($('#save-status')) $('#save-status').textContent = storageOK ? '이 브라우저에 저장됨' : '저장할 수 없습니다. 파일로 보관하십시오.'; if ($('#note-length')) $('#note-length').textContent = `${state.note.note.length}/5,000`; }
});
window.addEventListener('hashchange', () => { if (!state.data) return; routeFromHash(); state.menu = false; render(); window.scrollTo({ top: 0, behavior: 'instant' }); $('#main')?.focus({ preventScroll: true }); });
async function load() {
  try {
    const [data, parcels] = await Promise.all(['/data/observatory.json', '/data/parcels.json'].map(async url => { const r = await fetch(url); if (!r.ok) throw new Error('data fetch'); return r.json(); }));
    if (data.meta.schemaVersion !== 3 || data.grids.length !== 314 || data.dongs.length !== 17 || parcels.length !== 547) throw new Error('data schema');
    state.data = data; state.parcels = parcels;
    const quarters = []; for (let y = 2022; y <= 2030; y++) for (let k = 1; k <= 4; k++) quarters.push(`${y}Q${k}`);
    try { state.note = sanitizeNote(JSON.parse(localStorage.getItem(STORE) || 'null'), data.dongs.map(d => `D:${d.code}`), quarters); } catch { state.note = defaultNote(); }
    routeFromHash(); render(); loadGrades();
  } catch { $('#app').innerHTML = '<div class="boot-state"><h1>자료를 불러오지 못했습니다</h1><p>인터넷 연결을 확인한 뒤 다시 시도하십시오.</p><button id="retry" class="button primary">다시 불러오기</button></div>'; $('#retry').onclick = load; }
}
load();
