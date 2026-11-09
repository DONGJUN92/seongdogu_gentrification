"""웹 언급 매일 수집 (참고 지도용, 등급·예측에 쓰지 않음).

1. 서울 열린데이터광장 LOCALDATA(일반음식점·휴게음식점·제과점, 성동구)에서 해당 분기에 영업한 외식업소를 받는다.
2. 자동 규칙: 상호(공백 제거)가 지명이거나 2글자 이하이면 제외한다.
3. 업소마다 네이버 블로그 검색 API를 "상호 + 법정동" 최신순으로 조회해, 제목·요약에 상호가 들어간 글을 모은다.
4. 매일 새 글을 진행 분기 상태 파일에 쌓는다. 업소 2곳 이상에 연결된 글은 제외한다. 남은 글을 업소 좌표의 250m 격자로 센다.
5. 분기가 끝나고 10일이 지나면(기존 분기 수집과 같은 시점) data/grades/web_mentions_history.json에 분기를 추가하고, 완료된 최근 4개 분기를 분기 층화 추출 기대값으로 합쳐
   data/grades/web_mentions.json을 다시 만든다. 지도에는 완료된 분기만 쓴다(진행 분기를 넣으면 층화 기준이 흔들린다).

환경변수: SEOUL_OPENAPI_KEY, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET (값은 출력하지 않는다)
사용: python scripts/web_mentions/collect_web_mentions.py [--limit 50] [--dry-run]     매일 수집
      python scripts/web_mentions/collect_web_mentions.py --quarter 2026Q3            끝난 분기 일괄 수집"""
import argparse, datetime as dt, hashlib, html, json, os, re, sys, time
import requests
from pyproj import Transformer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HIST = os.path.join(ROOT, 'data', 'grades', 'web_mentions_history.json')
LATEST = os.path.join(ROOT, 'data', 'grades', 'web_mentions.json')
STATUS = os.path.join(ROOT, 'data', 'grades', 'web_mentions_status.json')
STATE = os.path.join(ROOT, 'scripts', 'web_mentions', 'state', 'web_mentions_state.json')
OBS = os.path.join(ROOT, 'data', 'observatory.json')
KST = dt.timezone(dt.timedelta(hours=9)); GRACE_DAYS = 10; OVERLAP_DAYS = 7   # 뒤늦게 검색에 잡히는 글을 위해 최근 7일을 매일 다시 본다
SERVICES = ['LOCALDATA_072404_SD', 'LOCALDATA_072405_SD', 'LOCALDATA_072406_SD']
EXCL_UPTAE = {'편의점', '백화점', '철도역구내', '극장', '관광호텔', '푸드트럭', '출장조리', '이동조리'}   # 격자 종합(프로토콜 42)과 같은 제외 업태
AREA = {'성수', '옥수', '서울', '왕십리', '금호', '행당', '마장', '사근', '응봉', '송정', '용답', '성동', '뚝섬', '한양', '서울숲', '서울서울', '성수동'}
BLOG = 'https://openapi.naver.com/v1/search/blog.json'
DELAY = float(os.environ.get('NAVER_DELAY_SEC', '0.11'))
MAX_CALLS = int(os.environ.get('NAVER_MAX_CALLS', '20000'))     # 검색 API 일일 한도(25,000회) 안에서 멈춤
TO5179 = Transformer.from_crs('EPSG:5174', 'EPSG:5179', always_xy=True)

def env(k):
    v = os.environ.get(k)
    if not v: sys.exit(f'환경변수 {k}가 없습니다.')
    return v
def prev_quarter(today):
    q = (today.month - 1) // 3 + 1; y = today.year
    return f'{y - 1}Q4' if q == 1 else f'{y}Q{q - 1}'
def q_range(q):
    y, n = int(q[:4]), int(q[5]); s = dt.date(y, 3 * n - 2, 1)
    e = dt.date(y + (n == 4), 1 if n == 4 else 3 * n + 1, 1) - dt.timedelta(days=1); return s, e
def ymd(v):
    s = re.sub(r'[^0-9]', '', str(v or ''))[:8]
    return dt.date(int(s[:4]), int(s[4:6]), int(s[6:8])) if len(s) == 8 else None

def localdata(key):
    rows = []
    for svc in SERVICES:
        start = 1
        while True:
            r = requests.get(f'http://openapi.seoul.go.kr:8088/{key}/json/{svc}/{start}/{start + 999}/', timeout=60); r.raise_for_status()
            body = r.json().get(svc, {}); page = body.get('row', []); rows += page
            if not page or start + 999 >= int(body.get('list_total_count', 0)): break
            start += 1000
    return rows
def grid_of(x, y, ids):
    try: X, Y = TO5179.transform(float(x), float(y))
    except (TypeError, ValueError): return None
    cx, cy = int((X - 900000) // 250 * 250), int((Y - 1900000) // 250 * 250)
    gid = f'다사{cx // 10:04d}{cy // 10:04d}'
    return gid if gid in ids else None
def frame(rows, q, ids):
    s, e = q_range(q); out = []
    for r in rows:
        if str(r.get('UPTAENM', '')).strip() in EXCL_UPTAE: continue
        apv, closed = ymd(r.get('APVPERMYMD')), '폐업' in str(r.get('TRDSTATENM', ''))
        dcb = ymd(r.get('DCBYMD')) if closed else None
        if not apv or apv > e or (closed and (not dcb or dcb < s)): continue
        name = re.sub(r'\s', '', str(r.get('BPLCNM', '')).strip())
        if not name or name in AREA or len(name) <= 2: continue
        gid = grid_of(r.get('X'), r.get('Y'), ids)
        if not gid: continue
        m = re.search(r'([가-힣]+?\d*가?동)', str(r.get('SITEWHLADDR', '')))
        area = re.sub(r'\d+가동$', '동', m.group(1)) if m else '성동구'
        out.append({'mgt': str(r.get('MGTNO', '')).strip(), 'name': name, 'raw': str(r.get('BPLCNM', '')).strip(), 'area': area, 'grid': gid})
    return out

calls = 0; failed = 0
def blog(query, start, headers):
    global calls, failed
    for i in range(4):
        if calls >= MAX_CALLS: raise RuntimeError('호출 한도에 도달')
        time.sleep(DELAY); calls += 1
        try:
            r = requests.get(BLOG, params={'query': query, 'display': 100, 'start': start, 'sort': 'date'}, headers=headers, timeout=30)
            if r.status_code == 200: return r.json()
            if r.status_code in (429, 500, 502, 503): time.sleep(2 * (i + 1)); continue
            failed += 1; return None
        except requests.RequestException:
            time.sleep(2 * (i + 1))
    failed += 1; return None
def posts_for(b, s, e, headers):
    """s~e 사이에 쓰였고 제목·요약에 상호가 들어간 글 {링크: 작성일}. 최신순이므로 s보다 오래된 글이 나오면 멈춘다."""
    found = {}
    for start in range(1, 1000, 100):
        d = blog(f"{b['raw']} {b['area']}", start, headers)
        items = (d or {}).get('items', [])
        if not items: break
        oldest = None
        for it in items:
            pd_ = ymd(it.get('postdate')); oldest = pd_ if oldest is None or (pd_ and pd_ < oldest) else oldest
            if not pd_ or pd_ < s or pd_ > e: continue
            text = re.sub(r'\s', '', html.unescape(re.sub(r'<[^>]+>', '', (it.get('title', '') + it.get('description', '')))))
            if b['name'] in text: found[it.get('link', '')] = pd_
        if (oldest and oldest < s) or len(items) < 100: break
    return found

def latest_map(H, meta_base):
    """최근 4개 분기 지도. 수집 시점 편향은 분기 층화 추출로 맞춘다: 분기마다 K건(이력 중 가장 적은 분기 건수)을
    비복원 추출했을 때의 기대 건수 = 격자 건수 × K / 분기 전체 건수."""
    T = H['totals']; K = min(T.values()); qs = sorted(H['quarters'])[-4:]; acc = {}
    for q in qs:
        for g, (n, b) in H['quarters'][q].items():
            a = acc.setdefault(g, [0.0, 0]); a[0] += n * K / T[q]; a[1] = max(a[1], b)
    acc = {g: [round(v[0], 2), v[1]] for g, v in sorted(acc.items())}
    vals = sorted(v[0] for v in acc.values()); qt = lambda p: vals[min(len(vals) - 1, int(p * len(vals)))]
    meta = {**meta_base, 'period': [qs[0], qs[-1]], 'grids': len(acc), 'stratumSize': K, 'docs_total': round(sum(v[0] for v in acc.values()), 1),
            'breaks': [round(qt(.25), 2), round(qt(.5), 2), round(qt(.75), 2)], 'updated': dt.date.today().isoformat()}
    return {'meta': meta, 'grids': acc}
def rebuild_latest(H):
    old = json.load(open(LATEST, encoding='utf-8'))['meta'] if os.path.exists(LATEST) else {}
    keep = {k: v for k, v in old.items() if k in ('source', 'note', 'businesses_definition', 'history')}
    json.dump(latest_map(H, keep), open(LATEST, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

def add_quarter(q, qcounts, source):
    """끝난 분기를 이력에 넣고 지도를 다시 만든다."""
    H = json.load(open(HIST, encoding='utf-8'))
    H['quarters'][q] = qcounts; H['quarters'] = dict(sorted(H['quarters'].items()))
    H.setdefault('totals', {})[q] = sum(v[0] for v in qcounts.values()); H['totals'] = dict(sorted(H['totals'].items()))
    H.setdefault('sources', {})[q] = source
    json.dump(H, open(HIST, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    rebuild_latest(H); update_manifest()


def write_status(today, latest, note, in_progress=None):
    json.dump({'lastChecked': today.isoformat(), 'latestQuarter': latest, 'note': note, 'inProgress': in_progress}, open(STATUS, 'w', encoding='utf-8'), ensure_ascii=False)


def batch(q, a, today):
    """끝난 분기를 한 번에 수집한다(매일 수집을 시작하기 전 분기 또는 빠진 분기)."""
    ids = {g['id'] for g in json.load(open(OBS, encoding='utf-8'))['grids']}
    headers = {'X-Naver-Client-Id': env('NAVER_CLIENT_ID'), 'X-Naver-Client-Secret': env('NAVER_CLIENT_SECRET')}
    biz = frame(localdata(env('SEOUL_OPENAPI_KEY')), q, ids)
    if a.limit: biz = biz[:a.limit]
    print(f'{q}: 대상 업소 {len(biz)}곳', flush=True)
    links = {}; s, e = q_range(q)
    for i, b in enumerate(biz, 1):
        for link in posts_for(b, s, e, headers): links.setdefault(link, set()).add(b['mgt'])
        if i % 200 == 0: print(f'  {i}/{len(biz)} 업소, API 호출 {calls}회', flush=True)
    grid_of_biz = {b['mgt']: b['grid'] for b in biz}
    counts = {}
    for link, ms in links.items():
        if len(ms) != 1: continue                       # 업소 2곳 이상에 연결된 글 제외
        m = next(iter(ms)); c = counts.setdefault(grid_of_biz[m], [0, set()]); c[0] += 1; c[1].add(m)
    qcounts = {g: [n, len(bs)] for g, (n, bs) in sorted(counts.items())}
    print(f'{q}: 게시글 {sum(v[0] for v in qcounts.values())}건, 격자 {len(qcounts)}곳, API 호출 {calls}회, 실패 {failed}회', flush=True)
    stop_if_failed(len(biz))
    if a.dry_run: return
    add_quarter(q, qcounts, f'분기 일괄 수집 {today.isoformat()}(네이버 블로그 검색 API, 상호 + 법정동, 대상 업소 {len(biz)}곳)')
    write_status(today, q, '수집 완료')


def stop_if_failed(n_biz):
    """검색 실패가 많으면 그날 결과를 버린다. 커밋되지 않으므로 다음 실행이 같은 기간을 다시 본다."""
    if failed > max(20, 0.02 * n_biz): sys.exit(f'검색 실패 {failed}회(업소 {n_biz}곳): 이번 실행 결과를 저장하지 않습니다.')


def save_state(st):
    os.makedirs(os.path.dirname(STATE), exist_ok=True)
    json.dump(st, open(STATE, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'), sort_keys=True)


def quarter_of(d):
    return f'{d.year}Q{(d.month - 1) // 3 + 1}'


def tally(posts):
    """{글 해시: '업소|격자' 또는 '*'} → 격자별 [글 수, 언급 업소 수]. '*'는 업소 2곳 이상에 연결된 글."""
    c = {}
    for v in posts.values():
        if v == '*': continue
        m, g = v.split('|'); x = c.setdefault(g, [0, set()]); x[0] += 1; x[1].add(m)
    return {g: [n, len(bs)] for g, (n, bs) in sorted(c.items())}


def record(posts, link, b):
    k = hashlib.sha1(link.encode('utf-8')).hexdigest()[:12]; v = f"{b['mgt']}|{b['grid']}"
    if k not in posts: posts[k] = v
    elif posts[k] != v: posts[k] = '*'


def daily(a, today):
    """오늘 새로 올라온 글을 진행 분기에 쌓는다. 끝난 분기는 10일 뒤 이력으로 옮긴다."""
    st = json.load(open(STATE, encoding='utf-8')) if os.path.exists(STATE) else {'quarters': {}}
    H = json.load(open(HIST, encoding='utf-8'))
    for q in sorted(st['quarters']):                     # 유예 기간이 지난 분기를 확정
        if q_range(q)[1] + dt.timedelta(days=GRACE_DAYS) < today:
            s_ = st['quarters'][q]; qc = tally(s_['posts'])
            if not a.dry_run:
                add_quarter(q, qc, f"매일 수집 {s_['started']}~{s_['lastRun']}(네이버 블로그 검색 API, 상호 + 법정동)")
            del st['quarters'][q]; print(f'{q}: 확정, 게시글 {sum(v[0] for v in qc.values())}건', flush=True)
    prev = prev_quarter(today)
    if prev not in H['quarters'] and prev not in st['quarters'] and not a.dry_run and q_range(prev)[1] + dt.timedelta(days=GRACE_DAYS) < today:
        H = json.load(open(HIST, encoding='utf-8'))
        if prev not in H['quarters']:
            print(f'{prev}: 이력에 없어 일괄 수집합니다. 매일 수집은 다음 실행부터 진행합니다.', flush=True)
            save_state(st)
            return batch(prev, a, today)
    cur = quarter_of(today); st['quarters'].setdefault(cur, {'started': today.isoformat(), 'lastRun': None, 'posts': {}})
    active = sorted(st['quarters'])
    ids = {g['id'] for g in json.load(open(OBS, encoding='utf-8'))['grids']}
    headers = {'X-Naver-Client-Id': env('NAVER_CLIENT_ID'), 'X-Naver-Client-Secret': env('NAVER_CLIENT_SECRET')}
    rows = localdata(env('SEOUL_OPENAPI_KEY')); biz = {}
    for q in active:
        for b in frame(rows, q, ids): biz[b['mgt']] = b
    biz = list(biz.values())
    if not biz: sys.exit('대상 업소가 없습니다: 이번 실행 결과를 저장하지 않습니다.')
    if a.limit: biz = biz[:a.limit]
    since = min(q_range(q)[0] if not st['quarters'][q]['lastRun'] else max(q_range(q)[0], dt.date.fromisoformat(st['quarters'][q]['lastRun']) - dt.timedelta(days=OVERLAP_DAYS)) for q in active)
    print(f'매일 수집: 분기 {active}, 대상 업소 {len(biz)}곳, {since} 이후 글', flush=True)
    new = 0
    for i, b in enumerate(biz, 1):
        for link, d in posts_for(b, since, today, headers).items():
            q = quarter_of(d)
            if q in st['quarters']:
                before = len(st['quarters'][q]['posts']); record(st['quarters'][q]['posts'], link, b); new += len(st['quarters'][q]['posts']) - before
        if i % 500 == 0: print(f'  {i}/{len(biz)} 업소, API 호출 {calls}회', flush=True)
    for q in active: st['quarters'][q]['lastRun'] = today.isoformat()
    qc = tally(st['quarters'][cur]['posts']); docs = sum(v[0] for v in qc.values())
    print(f'{cur}: 새 글 {new}건, 누적 게시글 {docs}건, 격자 {len(qc)}곳, API 호출 {calls}회, 실패 {failed}회', flush=True)
    stop_if_failed(len(biz))
    if a.dry_run: return
    save_state(st)
    H = json.load(open(HIST, encoding='utf-8'))
    write_status(today, sorted(H['quarters'])[-1], '매일 수집 중', {'quarter': cur, 'docs': docs, 'grids': len(qc), 'started': st['quarters'][cur]['started'], 'asOf': today.isoformat()})


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--quarter', help='끝난 분기를 일괄 수집'); ap.add_argument('--limit', type=int); ap.add_argument('--dry-run', action='store_true'); a = ap.parse_args()
    today = dt.datetime.now(KST).date()
    if a.quarter:
        if not re.fullmatch(r'\d{4}Q[1-4]', a.quarter): sys.exit('분기 형식: 2026Q3')
        return batch(a.quarter, a, today)
    daily(a, today)

def update_manifest():   # 공개 자료 목록의 파일 확인값을 새 파일에 맞춘다
    import hashlib
    p = os.path.join(ROOT, 'data', 'release-manifest.json')
    if not os.path.exists(p): return
    m = json.load(open(p, encoding='utf-8'))
    for rel in ['data/grades/web_mentions.json', 'data/grades/web_mentions_history.json']:
        b = open(os.path.join(ROOT, rel), 'rb').read(); m['files'][rel] = {'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()}
    json.dump(m, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
