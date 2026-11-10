"""등급 지도용 위경도 자료를 만든다. 등급 값은 건드리지 않는다.

1. data/grades/grid_geo.json: 격자 314곳과 행정동 17곳의 위경도 경계.
   격자 번호는 EPSG:5179 좌하단 좌표를 뜻하므로 온전한 격자는 번호에서 바로 계산한다.
   경계에서 잘린 격자와 행정동은 온전한 격자로 맞춘 '이미지 좌표 → EPSG:5179' 변환식을 쓴다.
2. data/grades/license_points.json: 2022년 4월 이후 개업·폐업한 외식업소의 위경도.
   base.json의 인허가 행과 관리번호로 연결하며, 상호·주소는 넣지 않는다.

사용: python scripts/map/build_map_data.py  (LOCALDATA 원자료 폴더가 있는 연구 작업 폴더에서만 실행)"""
import glob, json, os, re, sys
import numpy as np
from pyproj import Transformer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
RAW = os.path.abspath(os.path.join(ROOT, '..', 'data', 'raw', 'seoul_openapi'))
TO_WGS = Transformer.from_crs('EPSG:5179', 'EPSG:4326', always_xy=True)
FROM_5174 = Transformer.from_crs('EPSG:5174', 'EPSG:4326', always_xy=True)
FROM_DATE = 20220401   # 첫 등급 분기(2023Q1)의 최근 1년 시작일
rd = lambda ring: [[round(a, 6), round(b, 6)] for a, b in ring]


def origin(gid):
    m = re.fullmatch(r'다사(\d{4})(\d{4})', gid); return 900000 + int(m[1]) * 10, 1900000 + int(m[2]) * 10


def fit(grids):
    """온전한 격자의 좌하단 모서리로 이미지 좌표 → EPSG:5179 변환식을 맞춘다."""
    P, Q = [], []
    for g in grids:
        ring = g['geometry']['coordinates'][0][:-1] if g['geometry']['type'] == 'Polygon' else []
        if g['edge'] or len(ring) != 4: continue
        P.append((min(p[0] for p in ring), max(p[1] for p in ring))); Q.append(origin(g['id']))
    P, Q = np.array(P), np.array(Q); A = np.c_[P, np.ones(len(P))]
    cx = np.linalg.lstsq(A, Q[:, 0], rcond=None)[0]; cy = np.linalg.lstsq(A, Q[:, 1], rcond=None)[0]
    err = max(abs(A @ cx - Q[:, 0]).max(), abs(A @ cy - Q[:, 1]).max())
    if err > 2: sys.exit(f'변환식 오차 {err:.2f}m: 2m를 넘어 중단합니다.')
    print(f'변환식: 온전한 격자 {len(P)}곳, 최대 오차 {err:.2f}m')
    return lambda x, y: (cx[0] * x + cx[1] * y + cx[2], cy[0] * x + cy[1] * y + cy[2])


def geometry(geom, conv):
    polys = [geom['coordinates']] if geom['type'] == 'Polygon' else geom['coordinates']
    return [[rd(TO_WGS.transform(*conv(x, y)) for x, y in ring) for ring in poly] for poly in polys]


def grid_geo(obs):
    conv = fit(obs['grids']); grids = {}
    for g in obs['grids']:
        if g['edge']: grids[g['id']] = geometry(g['geometry'], conv); continue
        x, y = origin(g['id'])
        grids[g['id']] = [[rd(TO_WGS.transform(a, b) for a, b in [(x, y), (x + 250, y), (x + 250, y + 250), (x, y + 250), (x, y)])]]
    dongs = {d['code']: {'name': d['name'], 'seongsu': d['seongsu'], 'center': [round(v, 6) for v in TO_WGS.transform(*conv(*d['center']))], 'rings': geometry(d['geometry'], conv)} for d in obs['dongs']}
    return {'schema': 1, 'crs': 'EPSG:4326 [경도, 위도]', 'grids': grids, 'dongs': dongs}


def raw_xy():
    """관리번호별 가장 최근 수집일의 좌표."""
    xy = {}
    for f in sorted(glob.glob(os.path.join(RAW, '*', 'LOCALDATA_07240[456]_SD', 'rows.jsonl'))):
        for line in open(f, encoding='utf-8'):
            r = json.loads(line); m = str(r.get('MGTNO', '')).strip()
            try: xy[m] = (float(r['X']), float(r['Y']))
            except (KeyError, TypeError, ValueError): pass
    return xy


def license_points(base):
    xy = raw_xy(); pts = {}; missing = 0
    for mgt, _, apv, dcb, *_rest in base['lic']:
        if apv < FROM_DATE and not (dcb and dcb >= FROM_DATE): continue
        if mgt not in xy: missing += 1; continue
        lon, lat = FROM_5174.transform(*xy[mgt]); pts[mgt] = [round(lon, 6), round(lat, 6)]
    print(f'점 자료: {len(pts)}곳, 좌표 없음 {missing}곳')
    if missing: sys.exit('좌표 없는 업소가 있어 중단합니다: 지도 점 수가 등급 근거와 달라집니다.')
    return {'schema': 1, 'source': base['licCollected'], 'from': FROM_DATE, 'crs': 'EPSG:4326 [경도, 위도]', 'points': pts}


def main():
    D = os.path.join(ROOT, 'data'); obs = json.load(open(os.path.join(D, 'observatory.json'), encoding='utf-8')); base = json.load(open(os.path.join(D, 'grades', 'base.json'), encoding='utf-8'))
    geo = grid_geo(obs); near = 0
    for gid, ring in base['gridWgs'].items():   # 공식 격자 좌표와 대조
        if gid in geo['grids'] and not next(g for g in obs['grids'] if g['id'] == gid)['edge']:
            near = max(near, max(abs(a[0] - b[0]) * 88000 + abs(a[1] - b[1]) * 111000 for a, b in zip(geo['grids'][gid][0][0], ring)))
    print(f'공식 격자 좌표와의 최대 차이 {near:.2f}m')
    for name, obj in [('grid_geo.json', geo), ('license_points.json', license_points(base))]:
        json.dump(obj, open(os.path.join(D, 'grades', name), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print(name, os.path.getsize(os.path.join(D, 'grades', name)), 'bytes')


if __name__ == '__main__':
    main()
