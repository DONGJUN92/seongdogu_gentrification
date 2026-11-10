"""팝업 온라인 언급 기초 표본을 앞뒤 구간으로 나눈다(프로토콜 52). 건수만 저장하고 글 내용은 넣지 않는다.

사용: python scripts/popups/build_mention_periods.py 말뭉치.json  (연구 작업 폴더의 로컬 말뭉치 필요)"""
import collections, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from collect_popup_mentions import ROOT, OUT, locator, relevant

SPLIT = '2026-05-01'


def main(path):
    docs = json.load(open(path, encoding='utf-8')); g = locator(); e, l = collections.Counter(), collections.Counter(); kept = 0; dates = []
    for d in docs:
        if not relevant(d['title']): continue
        kept += 1; dates.append(d['date']); (l if d['date'] >= SPLIT else e).update(g(d['text']))
    base = json.load(open(OUT, encoding='utf-8'))['baseline']
    assert kept == base['docs'] and dict(e + l) == base['grids'], '기초 표본과 합계가 다릅니다'
    out = {'schema': 1, 'early': {'from': min(dates), 'to': '2026-04-30', 'grids': dict(sorted(e.items()))}, 'late': {'from': SPLIT, 'to': max(dates), 'grids': dict(sorted(l.items()))}}
    p = os.path.join(ROOT, 'data', 'grades', 'popup_mention_periods.json')
    json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('앞 구간 격자·건', len(e), sum(e.values()), '뒤 구간', len(l), sum(l.values()), '| 기초 표본 합계 일치')


if __name__ == '__main__':
    main(sys.argv[1])
