"""성수동 팝업 주간 현황(성동구 제공 엑셀) → 250m 격자 팝업 압력 자료 (참고 신호, 등급·예측에 쓰지 않음).

입력: 구청 주간 현황 엑셀 폴더. 파일은 공개 저장소에 넣지 않는다.
출력: data/grades/popups.json (팝업명·주소 없이 키값, 격자, 기간, 종류만 저장)
      data/grades/address_grid.json (도로명주소 → 250m 격자표, 공개 상가정보로 제작)

주소 → 격자: 소상공인 상가(상권)정보의 도로명주소·좌표로 만든 표를 쓴다. 표에 없는 주소와 '성수역 3번 출구' 같은 장소만
KAKAO_REST_API_KEY가 있을 때 카카오 지역 API로 찾는다(값은 출력하지 않는다). '서울숲 일대'처럼 범위가 넓으면 격자를 배정하지 않는다.

사용: python scripts/popups/build_popups.py --input <엑셀 폴더> [--sbiz <sbiz_seongdong_*.csv 폴더>] [--verify-kakao 보고서.json]"""
import argparse, collections, csv, datetime as dt, glob, json, os, re, sys, time
import openpyxl, requests
from pyproj import Transformer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'data', 'grades', 'popups.json')
TABLE = os.path.join(ROOT, 'data', 'grades', 'address_grid.json')
OBS = os.path.join(ROOT, 'data', 'observatory.json')
TO5179 = Transformer.from_crs('EPSG:4326', 'EPSG:5179', always_xy=True)
TYPES = ['패션', '뷰티', '식음료', '문화·예술', '생활용품', '아이돌', '공공기관·지자체', '기타']
KINDS = ['전시체험', '제품판매']
ADDR = re.compile(r'^(\S+?(?:로|길))\s*(\d+(?:-\d+)?)(?=$|[\s,(])')
WIDE = re.compile(r'일대$')


def norm_address(s):
    """구청 표기 주소에서 '도로명 건물번호'만 남긴다. 브라우저의 popupAddrKey와 같은 규칙."""
    t = re.sub(r'서울특별시|서울시|성동구', '', str(s or '')).strip()
    m = ADDR.match(t)
    return f'{m[1]} {m[2]}' if m else ''


def fnv(s):
    """브라우저와 같은 32비트 FNV-1a"""
    h = 0x811c9dc5
    for b in s.encode('utf-8'):
        h = ((h ^ b) * 0x01000193) & 0xffffffff
    return f'{h:08x}'


def item_key(name, start):
    return fnv(re.sub(r'\s+', '', str(name or '')).lower() + '|' + start)


def grid_of(lon, lat):
    x, y = TO5179.transform(lon, lat)
    return f'다사{int((x - 900000) // 250) * 25:04d}{int((y - 1900000) // 250) * 25:04d}'


def as_date(v):
    if isinstance(v, (dt.datetime, dt.date)):
        return v.strftime('%Y-%m-%d')
    m = re.search(r'(\d{4})\D+(\d{1,2})\D+(\d{1,2})', str(v or ''))
    return f'{m[1]}-{int(m[2]):02d}-{int(m[3]):02d}' if m else None


def read_file(path):
    ws = openpyxl.load_workbook(path, data_only=True).worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    hi = next(i for i, r in enumerate(rows) if r and '팝업명' in [str(c).strip() for c in r if c is not None])
    head = [str(c).strip() if c is not None else '' for c in rows[hi]]
    title = next((str(c) for r in rows[:hi] for c in r if c and '운영 현황' in str(c)), '')
    items = []
    for r in rows[hi + 1:]:
        d = dict(zip(head, r))
        s, e = as_date(d.get('팝업시작')), as_date(d.get('팝업종료'))
        if d.get('팝업명') is None or not s or not e:
            continue
        items.append(dict(name=str(d['팝업명']).strip(), addr=str(d.get('주소(중복건물)') or '').strip(), dong=str(d.get('관할동') or '').strip(), start=s, end=e,
                          type=str(d.get('팝업종류') or '기타').strip(), kind=str(d.get('비고') or '').strip()))
    return title, items


def week_range(title, items):
    m = re.search(r'(\d{1,2})월\s*(\d{1,2})일\s*~\s*(\d{1,2})월\s*(\d{1,2})일', title)
    if not m:
        raise SystemExit(f'주차를 찾지 못했습니다: {title[:40]}')
    a, b, c, d = map(int, m.groups())
    best = None
    for y in {int(i['start'][:4]) for i in items} | {int(i['end'][:4]) for i in items}:
        s = dt.date(y, a, b); e = dt.date(y + (c < a), c, d)
        n = sum(1 for i in items if i['start'] <= e.isoformat() and i['end'] >= s.isoformat())
        if not best or n > best[0]:
            best = (n, s, e)
    return best[1].isoformat(), best[2].isoformat()


def build_table(sbiz_dir, ids):
    cnt = collections.defaultdict(collections.Counter)
    for f in sorted(glob.glob(os.path.join(sbiz_dir, 'sbiz_seongdong_*.csv'))):
        with open(f, encoding='utf-8-sig', newline='') as fh:
            for r in csv.DictReader(fh):
                road = (r.get('도로명') or '').split(' ')[-1]; main = (r.get('건물본번지') or '').split('.')[0]; sub = (r.get('건물부번지') or '').split('.')[0]
                if not road or not main or not r.get('경도') or not r.get('위도'):
                    continue
                g = grid_of(float(r['경도']), float(r['위도']))
                if g in ids:
                    cnt[road][main + ('-' + sub if sub and sub != '0' else '')] += 0
                    cnt[road + '|' + main + ('-' + sub if sub and sub != '0' else '')][g] += 1
    table, grids = {}, sorted(ids)
    idx = {g: i for i, g in enumerate(grids)}
    for k, c in cnt.items():
        if '|' not in k:
            continue
        road, num = k.split('|')
        table.setdefault(road, {})[num] = idx[c.most_common(1)[0][0]]
    return {'grids': grids, 'roads': table}


def table_lookup(key, table):
    """정확히 일치하면 격자, 없으면 같은 길의 가장 가까운 같은 쪽 건물번호(본번 ±6 이내), 그래도 없으면 없음"""
    if not key:
        return None, None
    road, num = key.split(' ')
    nums = table['roads'].get(road)
    if not nums:
        return None, None
    if num in nums:
        return table['grids'][nums[num]], 'exact'
    main = int(num.split('-')[0])
    if str(main) in nums:
        return table['grids'][nums[str(main)]], 'main'
    near = sorted((abs(int(n.split('-')[0]) - main), n) for n in nums if (int(n.split('-')[0]) - main) % 2 == 0 and abs(int(n.split('-')[0]) - main) <= 6)
    return (table['grids'][nums[near[0][1]]], 'near') if near else (None, None)


def kakao(query, key, ids, keyword=False):
    url = 'https://dapi.kakao.com/v2/local/search/' + ('keyword.json' if keyword else 'address.json')
    time.sleep(0.12)
    r = requests.get(url, params={'query': query}, headers={'Authorization': f'KakaoAK {key}'}, timeout=20)
    r.raise_for_status()
    d = r.json().get('documents') or []
    if not d:
        return None
    g = grid_of(float(d[0]['x']), float(d[0]['y']))
    return g if g in ids else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', required=True); ap.add_argument('--sbiz'); ap.add_argument('--verify-kakao')
    a = ap.parse_args()
    ids = {g['id'] for g in json.load(open(OBS, encoding='utf-8'))['grids']}
    if a.sbiz:
        json.dump(build_table(a.sbiz, ids), open(TABLE, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    table = json.load(open(TABLE, encoding='utf-8'))
    key = os.environ.get('KAKAO_REST_API_KEY')
    weeks, seen, check = [], {}, []
    for f in sorted(glob.glob(os.path.join(a.input, '*.xlsx'))):
        title, items = read_file(f); s, e = week_range(title, items)
        weeks.append(dict(start=s, end=e, listed=len(items), buildings=len({norm_address(i['addr']) or i['addr'] for i in items})))
        for i in items:
            seen[item_key(i['name'], i['start'])] = (s, i)      # 같은 팝업은 가장 늦은 주차의 값을 쓴다
    weeks.sort(key=lambda w: w['start'])
    order = sorted(seen.items(), key=lambda kv: kv[1][0])
    out, how = [], collections.Counter(); cache = {}
    for k, (_, i) in order:
        nk = norm_address(i['addr']); g, m = table_lookup(nk, table)
        if (not g or m == 'near') and not WIDE.search(i['addr'].strip()) and key:
            q = i['addr'].strip(); kw = not nk
            cache.setdefault(q, kakao(('서울 성동구 ' + q) if kw else ('서울 성동구 ' + nk), key, ids, keyword=kw))
            g, m = (cache[q], 'kakao') if cache[q] else (g, m)
        how[m or 'none'] += 1
        t = TYPES.index(i['type']) if i['type'] in TYPES else TYPES.index('기타')
        out.append([k, g, i['start'], i['end'], t, KINDS.index(i['kind']) if i['kind'] in KINDS else 0, fnv(nk or i['addr'])])
    if a.verify_kakao and key:
        for addr in sorted({i['addr'] for _, (_, i) in order}):
            nk = norm_address(addr); g, m = table_lookup(nk, table)
            if nk and g:
                time.sleep(0.12)
                check.append(dict(m=m, same=kakao('서울 성동구 ' + nk, key, ids) == g))
        c = collections.Counter((x['m'], x['same']) for x in check)
        json.dump({'n': len(check), 'by_method': {f'{k[0]}:{k[1]}': v for k, v in c.items()}, 'agree': round(sum(x['same'] for x in check) / len(check), 4)}, open(a.verify_kakao, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    meta = dict(source='성동구 성수동 팝업 운영현황(주간, 인스타그램·블로그 기반 구 자체 집계)', area='성수동 4개 행정동', builtFrom='구청 주간 현황 엑셀', weeks=weeks, items=len(out), located=sum(1 for x in out if x[1]), how=dict(how), types=TYPES, kinds=KINDS)
    json.dump(dict(meta=meta, items=out), open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print({k: v for k, v in meta.items() if k not in ('weeks', 'types', 'kinds')}); print('table roads', len(table['roads']), 'addresses', sum(len(v) for v in table['roads'].values()), 'bytes', os.path.getsize(TABLE))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
