"""Explore rides snapshot: lib/explore-rides/<locale>.json from a saved read of the live Collections.

Each category page shows rides (lib/explore-rides-types.ts): sections that group live Collections by
what a visitor comes for. This script picks the Collections for every ride from the English read
(by title words, resolved once to slugs) and writes one snapshot per locale with only the fields the
rides use. No BFF call happens at page view; refresh the read, then run this again.

Source folder layout (one read of /api/explore/<category>/collections and /api/explore/collections/<slug>):
  <src>/data/<category>.json, <src>/data/col/<slug>.json                 English
  <src>/locale/data/<locale>/<category>.json, .../col/<slug>.json       ko, ja, zh-TW, pt-BR
Usage: python3 scripts/build-explore-rides.py <src> [--read YYYY-MM-DD]
"""
import collections
import json
import re
import sys
from pathlib import Path

SRC = Path(sys.argv[1])
READ = sys.argv[sys.argv.index('--read') + 1] if '--read' in sys.argv else '2026-11-06'
OUT = Path(__file__).resolve().parent.parent / 'lib' / 'explore-rides'
CATS = ['k-food', 'k-culture', 'k-pop', 'k-drama', 'k-beauty']
LOCALES = ['en', 'ko', 'ja', 'zh-TW', 'pt-BR']
PLACES = 9  # the most any ride shows (Album run)
SHOW = re.compile(r'^[‘〈『《「]([^’〉』》」]+)[’〉』》」]')


def col_dir(loc):
    return SRC / 'data' / 'col' if loc == 'en' else SRC / 'locale' / 'data' / loc / 'col'


def cat_file(loc, cat):
    return SRC / 'data' / f'{cat}.json' if loc == 'en' else SRC / 'locale' / 'data' / loc / f'{cat}.json'


def clean_name(n, loc):
    # English names carry the Korean name in brackets on some places; the Korean name shows apart.
    return re.sub(r'\s*\([^()]*[가-힣][^()]*\)', '', n or '').strip() if loc == 'en' else (n or '').strip()


def read_col(loc, slug, cover):
    f = col_dir(loc) / f'{slug}.json'
    if not f.exists():
        return None
    d = json.load(open(f))
    parts = re.split(r'\s*—{1,2}\s*', d['title'], maxsplit=1)  # zh-TW writes '——' with no spaces
    head, sub = parts[0].strip(), (parts[1].strip() if len(parts) > 1 else '')
    if loc == 'en':
        head = re.sub(r'〈([^〉]+)〉', lambda m: '‘' + m.group(1).title() + '’', head)
    places = [dict(id=str(i['poi_id']), name=clean_name(i.get('name_en') or i['name_ko'], loc), ko=i['name_ko'],
                   img=i.get('primary_image_url'), region=i.get('display_region') or '') for i in d['items']]
    regions = [r for r, _ in collections.Counter(p['region'] for p in places if p['region']).most_common()]
    return dict(slug=slug, type=d['primaryType'], ordered=bool(d['isOrdered']), head=head, sub=sub,
                hero=cover or (places[0]['img'] if places else None), count=len(places), regions=regions, places=places[:PLACES])


def load(loc):
    out = {}
    for cat in CATS:
        f = cat_file(loc, cat)
        if not f.exists():
            continue
        for c in json.load(open(f))['items']:
            col = read_col(loc, c['slug'], c.get('primary_image_url'))
            if col:
                col['cat'] = cat
                col['title'] = json.load(open(col_dir(loc) / f"{c['slug']}.json"))['title']
                out[c['slug']] = col
    return out


EN = load('en')


def find(cat, *words):
    return [c for c in EN.values() if c['cat'] == cat and c['places'] and all(w.lower() in c['title'].lower() for w in words)]


def one(cat, *words):
    r = find(cat, *words)
    if not r:
        raise KeyError((cat, words))
    return r[0]['slug']


def key(k):
    return {'key': k}


def opt(label, slug, also=None):
    o = {'label': label, 'slug': slug}
    if also:
        o['also'] = also
    return o


def group(label, slugs):
    first = EN[slugs[0]]
    return {'label': label, 'img': first['places'][0]['img'] if first['places'] else first['hero'], 'count': len(slugs), 'slugs': slugs[:3]}


def show_name(c):
    m = SHOW.match(c['head'])
    return m.group(1) if m else c['head']


TOWNS = ['Mokpo', 'Andong', 'Yeongju', 'Yeongcheon', 'Geoje', 'Hadong', 'Gurye', 'Damyang', 'Suncheon', 'Boseong', 'Haenam',
         'Yeongwol', 'Jeongseon', 'Taebaek', 'Goseong', 'Jecheon', 'Danyang', 'Seosan']


def pages():
    """The rides of each page in order, chosen from the English read (titles are the same Collections in every locale)."""
    f = lambda *w: one('k-food', *w)
    food = {
        'hero': {'slug': f('Jeju Black Pork')},
        'rides': [
            {'id': 'dish', 'kind': 'tiles', 'options': [
                opt(key('naengmyeon'), f('single bowl of naengmyeon'), [f('Pyeongyang')]), opt(key('tteokbokki'), f('Stir-fried Rice Cake Camp')),
                opt(key('jajangmyeon'), f('Jajangmyeon')), opt(key('dakgalbi'), f('Chuncheon')), opt(key('porkRiceSoup'), f('Pork and Rice Soup')),
                opt(key('wangGalbi'), f('Wang-galbi')), opt(key('blackPork'), f('Black Pork')), opt(key('bread'), f('Daejeon Just for Bread')),
                opt(key('gimbap'), f('Gimbap'))]},
            {'id': 'city', 'kind': 'cities', 'groups': [group(key(c.lower()), [x['slug'] for x in find('k-food', c)])
                                                        for c in ['Busan', 'Jeju', 'Jeonju', 'Sokcho', 'Incheon', 'Suwon', 'Chuncheon', 'Daejeon']]},
            {'id': 'pick', 'kind': 'fine', 'slug': f('Fine Dining')},
            {'id': 'local', 'kind': 'posters', 'slugs': [f(w) for w in ['Office Worker', 'Taxi Drivers', 'College Student', 'Nopo', 'Convenience Store', 'Temple Food']]},
        ]}
    u = lambda *w: one('k-culture', *w)
    regions = collections.defaultdict(list)
    for c in EN.values():
        if c['cat'] == 'k-culture' and c['places'] and c['regions']:
            regions[c['regions'][0]].append(c['slug'])
    top = sorted(regions.items(), key=lambda kv: -len(kv[1]))[:8]
    town = lambda c: next((w for w in TOWNS if w in c['title']), None)
    towns = [c for c in EN.values() if c['cat'] == 'k-culture' and c['type'] == 'ROUTE' and not c['ordered'] and c['places'] and town(c)]
    culture = {
        'hero': {'slug': u('Northernmost Coast')},
        'rides': [
            {'id': 'region', 'kind': 'cities', 'groups': [group({'region': r}, s) for r, s in top]},
            {'id': 'season', 'kind': 'switch', 'options': [opt(key(k), u(w)) for k, w in [('spring', 'Cherry Blossoms'), ('summer', 'Valley'), ('autumn', 'Autumn Foliage'),
                                                                                         ('winter', 'Snow-Covered'), ('sunset', 'Sunset'), ('hotSprings', 'Hot Spring')]]},
            {'id': 'towns', 'kind': 'towns', 'options': [opt({'text': town(c)}, c['slug']) for c in towns]},
            {'id': 'kids', 'kind': 'switch', 'options': [opt(key(k), u(w)) for k, w in [('zoos', 'Seoul Grand Park'), ('safari', 'O-World'), ('waterPark', 'Caribbean Bay'),
                                                                                       ('hanRiver', 'Hangang River Guide')]]},
            {'id': 'history', 'kind': 'posters', 'slugs': [u(w) for w in ['600 Years', '5 Grand Palaces', 'Joseon King', 'Hanyangdoseong', 'Incheon Open Port', 'Wartime Capital']]},
        ]}
    p = lambda *w: one('k-pop', *w)
    arts = [('BLACKPINK', 'BLACKPINK'), ('BTS', 'Eating Like BTS'), ('RM', 'Namjoon'), ('SEVENTEEN', 'SEVENTEEN'), ('Stray Kids', 'Stray Kids'),
            ('TXT', 'TXT'), ('aespa', 'aespa'), ('SM artists', 'SM Fans')]
    pop = {
        'hero': {'slug': p('Big 4 Agency'), 'skip': [1]},  # place 2 (an agency front) reads as a black block in the small frame
        'rides': [
            {'id': 'bias', 'kind': 'tiles', 'options': [opt({'key': 'smArtists'} if a == 'SM artists' else {'text': a}, p(w)) for a, w in arts]},
            {'id': 'week', 'kind': 'switch', 'options': [opt(key('popups'), p('Pop-ups')), opt(key('birthdayCafes'), p('Birthday Cafes')), opt(key('birthdayAds'), p('Birthday Ads'))]},
            {'id': 'haul', 'kind': 'checklist', 'slug': p('Album Shop'), 'side': [p('Photocard Shop'), p('Idol Vibe'), p('50,000 Won')]},
            {'id': 'routes', 'kind': 'towns', 'options': [opt(key(k), p(w)) for k, w in [('big4', 'Big 4 Agency'), ('hongdae', 'Finding Your Bias in Hongdae'),
                                                                                        ('seongsu', 'Seongsu for SM'), ('firstTime', 'First-Time'), ('gangnam', 'Trainees')]]},
        ]}
    d = lambda *w: one('k-drama', *w)
    shows = [c for c in EN.values() if c['cat'] == 'k-drama' and c['places'] and SHOW.match(c['head'])]
    drama = {
        'hero': {'slug': d('Lovely Runner')},
        'rides': [
            {'id': 'scene', 'kind': 'scene', 'options': [opt({'text': show_name(c)}, c['slug']) for c in shows]},
            {'id': 'walk', 'kind': 'towns', 'options': [opt({'text': show_name(c)}, c['slug']) for c in shows if c['ordered']]},
            {'id': 'lead', 'kind': 'pair', 'slugs': [d('Eat Like a K-Drama Lead'), d('Rent Hanbok')]},
            {'id': 'dramaPopups', 'kind': 'switch', 'options': [opt(key('popups'), d('Pop-Up')), opt(key('netflixSets'), d('Netflix'))]},
        ]}
    b = lambda *w: one('k-beauty', *w)
    beauty = {
        'hero': {'slug': b('Seongsu — Trendy')},
        'rides': [
            {'id': 'done', 'kind': 'tiles', 'options': [opt(key(k), b(w)) for k, w in [
                ('personalColor', 'Personal Color'), ('idolMakeup', 'Makeup Like Your Bias'), ('biasHair', 'Hair Styled'), ('idolDay', 'Idol Transformation'),
                ('headSpa', 'Head Spa'), ('skinAnalysis', 'Skin Analysis'), ('jjimjilbang', 'Jjimjilbang'), ('perfume', 'Perfume')]]},
            {'id': 'runs', 'kind': 'towns', 'options': [opt(key(k), b(w)) for k, w in [('seongsu', 'Seongsu — Trendy'), ('flagships', 'Flagship'),
                                                                                      ('beforeYouFly', '2 Hours Before Flying'), ('gifts', 'Gifts')]]},
            {'id': 'first', 'kind': 'panel', 'slug': b('Beginner')},
        ]}
    return {'k-food': food, 'k-culture': culture, 'k-pop': pop, 'k-drama': drama, 'k-beauty': beauty}


def used(page):
    s = [page['hero']['slug']]
    for r in page['rides']:
        for o in r.get('options', []):
            s += [o['slug']] + o.get('also', [])
        for g in r.get('groups', []):
            s += g['slugs']
        s += r.get('slugs', []) + r.get('side', []) + ([r['slug']] if 'slug' in r else [])
    return list(dict.fromkeys(s))


def main():
    P = pages()
    OUT.mkdir(parents=True, exist_ok=True)
    for loc in LOCALES:
        data = EN if loc == 'en' else load(loc)
        cols, missing = {}, []
        for page in P.values():
            for slug in used(page):
                c = data.get(slug)
                if not c:
                    missing.append(slug)
                    c = EN[slug]  # not read in this locale: the English Collection stands in
                cols[slug] = {k: v for k, v in c.items() if k not in ('cat', 'title')}
        pages_loc = json.loads(json.dumps(P))
        if loc != 'en':  # show names as this locale titles them
            for page in pages_loc.values():
                for r in page['rides']:
                    for o in r.get('options', []):
                        if r['id'] in ('scene', 'walk'):
                            o['label'] = {'text': show_name(cols[o['slug']])}
        snap = {'read': READ, 'locale': loc, 'pages': {k: dict(category=k, **v) for k, v in pages_loc.items()}, 'cols': cols}
        (OUT / f'{loc}.json').write_text(json.dumps(snap, ensure_ascii=False, separators=(',', ':')))
        print(f'{loc}: {len(cols)} Collections, {sum(len(c["places"]) for c in cols.values())} places' + (f', English stand-ins: {len(missing)}' if missing else ''))


if __name__ == '__main__':
    main()
