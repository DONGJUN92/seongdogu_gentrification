"""팝업 온라인 언급 매일 수집 (참고 신호, 등급·예측에 쓰지 않음).

네이버 블로그·뉴스 검색 API를 최신순으로 조회해 제목에 '팝업'과 성수 지역어가 있는 글을 센다.
글에 '도로명 + 건물번호'가 있으면 250m 격자에 배정한다. 팝업 수가 아니라 언급량이다.
블로그는 최신순 1,000건이 3~4일치이므로 매일 실행해야 누락이 없다.

출력: data/grades/popup_mentions.json (주차별·격자별 건수만 저장, 글 제목·링크 없음)
상태: scripts/popups/state/popup_mentions_state.json (중복 제거용 해시, 최근 35일분)

환경변수 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET (값은 출력하지 않는다)
사용: python scripts/popups/collect_popup_mentions.py [--dry-run] [--init-baseline 말뭉치.json]"""
import argparse, collections, datetime as dt, hashlib, html, json, os, re, sys, time
import requests

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'data', 'grades', 'popup_mentions.json')
STATE = os.path.join(ROOT, 'scripts', 'popups', 'state', 'popup_mentions_state.json')
TABLE = os.path.join(ROOT, 'data', 'grades', 'address_grid.json')
QUERIES = ['성수 팝업', '성수동 팝업', '성수 팝업스토어', '성수동 팝업스토어']
AREA = re.compile(r'성수|서울숲|뚝섬|연무장')
KST = dt.timezone(dt.timedelta(hours=9))
FIRST_LOOKBACK = 3; KEEP_DAYS = 35; DELAY = float(os.environ.get('NAVER_DELAY_SEC', '0.12'))
clean = lambda s: html.unescape(re.sub(r'<[^>]+>', '', s or ''))


def relevant(title):
    return '팝업' in title and bool(AREA.search(title))


def monday(d):
    x = dt.date.fromisoformat(d)
    return (x - dt.timedelta(days=x.weekday())).isoformat()


def locator():
    t = json.load(open(TABLE, encoding='utf-8'))
    rx = re.compile('(' + '|'.join(map(re.escape, sorted(t['roads'], key=len, reverse=True))) + r')\s*(\d+(?:-\d+)?)(?![0-9가-힣])')

    def grids(text):
        out = set()
        for m in rx.finditer(text):
            nums = t['roads'][m[1]]; main = m[2].split('-')[0]
            k = m[2] if m[2] in nums else (main if main in nums else None)
            if k is not None:
                out.add(t['grids'][nums[k]])
        return out
    return grids


def search(kind, q, start, hdr):
    for i in range(4):
        time.sleep(DELAY)
        r = requests.get(f'https://openapi.naver.com/v1/search/{kind}.json', params={'query': q, 'display': 100, 'start': start, 'sort': 'date'}, headers=hdr, timeout=25)
        if r.status_code == 200:
            return r.json().get('items', [])
        if r.status_code == 429:
            time.sleep(2 + i); continue
        sys.exit(f'검색 API 오류 {r.status_code} ({kind})')
    sys.exit('검색 API 호출 한도 초과')


def doc_date(kind, x):
    if kind == 'blog':
        d = x.get('postdate', '')
        return f'{d[:4]}-{d[4:6]}-{d[6:8]}' if len(d) == 8 else None
    try:
        return dt.datetime.strptime(x['pubDate'], '%a, %d %b %Y %H:%M:%S %z').astimezone(KST).date().isoformat()
    except Exception:
        return None


def blank():
    return {'meta': {'title': '팝업 온라인 언급(참고)', 'queries': QUERIES, 'filter': "제목에 '팝업'과 성수 지역어(성수·서울숲·뚝섬·연무장)", 'source': '네이버 블로그·뉴스 검색 API', 'started': None, 'updated': None, 'runs': 0, 'gaps': []}, 'baseline': None, 'weeks': {}}


def load(path, default):
    return json.load(open(path, encoding='utf-8')) if os.path.exists(path) else default


def save(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(obj, open(path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'), sort_keys=True)


def init_baseline(path):
    docs = json.load(open(path, encoding='utf-8')); g = locator(); c = collections.Counter(); kept = located = 0; dates = []
    for d in docs:
        if not relevant(d['title']):
            continue
        kept += 1; dates.append(d['date']); gs = g(d['text']); located += bool(gs); c.update(gs)
    data = load(OUT, blank())
    data['baseline'] = {'from': min(dates), 'to': max(dates), 'docs': kept, 'located': located, 'grids': dict(c), 'note': '월별 키워드 검색으로 한 번에 모은 표본'}
    save(OUT, data); print('기초 표본', kept, '주소 확보', located, '격자', len(c))


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--dry-run', action='store_true'); ap.add_argument('--init-baseline')
    a = ap.parse_args()
    if a.init_baseline:
        return init_baseline(a.init_baseline)
    hdr = {'X-Naver-Client-Id': os.environ['NAVER_CLIENT_ID'], 'X-Naver-Client-Secret': os.environ['NAVER_CLIENT_SECRET']}
    today = dt.datetime.now(KST).date(); data = load(OUT, blank()); state = load(STATE, {'seen': {}}); g = locator()
    meta = data['meta']; first = not meta['started']
    if first:
        meta['started'] = (today - dt.timedelta(days=FIRST_LOOKBACK)).isoformat()
    last = meta['updated']
    horizon = meta['started'] if first else max(meta['started'], (dt.date.fromisoformat(last) - dt.timedelta(days=21)).isoformat())
    seen = {h for hs in state['seen'].values() for h in hs}; added = collections.defaultdict(list); nnew = ncalls = nloc = 0; gaps = []
    for q in QUERIES:
        for kind in ('blog', 'news'):
            n = 0; oldest = None
            for st in range(1, 1000, 100):
                items = search(kind, q, st, hdr); ncalls += 1; n += len(items); stop = False
                for x in items:
                    d = doc_date(kind, x)
                    if not d:
                        continue
                    oldest = min(oldest, d) if oldest else d
                    if d < horizon:
                        stop = True; continue
                    title = clean(x.get('title')); link = x.get('originallink') or x.get('link') or ''
                    if not relevant(title):
                        continue
                    key = hashlib.sha1(link.encode('utf-8')).hexdigest()[:12]
                    if key in seen:
                        continue
                    seen.add(key); added[d].append(key); nnew += 1
                    w = data['weeks'].setdefault(monday(d), {'docs': 0, 'blog': 0, 'news': 0, 'located': 0, 'grids': {}})
                    w['docs'] += 1; w[kind] += 1
                    gs = g(title + ' ' + clean(x.get('description')))
                    if gs:
                        w['located'] += 1; nloc += 1
                        for c in gs:
                            w['grids'][c] = w['grids'].get(c, 0) + 1
                if stop or len(items) < 100:
                    break
            if not first and n >= 1000 and oldest and last and oldest > last:
                gaps.append({'date': today.isoformat(), 'query': q, 'kind': kind, 'oldest': oldest})      # 한도에 걸려 지난 실행과 사이가 비었다
    meta['updated'] = today.isoformat(); meta['runs'] += 1; meta['gaps'] = (meta['gaps'] + gaps)[-60:]
    for d, ks in added.items():
        state['seen'][d] = sorted(set(state['seen'].get(d, []) + ks))
    cut = (today - dt.timedelta(days=KEEP_DAYS)).isoformat()
    state['seen'] = {d: v for d, v in state['seen'].items() if d >= cut}
    print({'calls': ncalls, 'new_docs': nnew, 'located': nloc, 'gaps': len(gaps), 'weeks': len(data['weeks'])})
    if not a.dry_run:
        save(OUT, data); save(STATE, state)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
