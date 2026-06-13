#!/usr/bin/env python3
"""
Download B4K mock images from Google Drive to public/mock-images/
Run: python3 scripts/download-mock-images.py
Requires: pip install gdown
"""
import subprocess, sys, pathlib

try:
    import gdown
except ImportError:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'gdown', '-q'])
    import gdown

DEST = pathlib.Path(__file__).parent.parent / 'public' / 'mock-images'
DEST.mkdir(parents=True, exist_ok=True)

IMAGES = {
    'kpop0001': '1GOcHvi7yNA_IugC3dOTw4m0XjXeGyw0Y',
    'kpop0002': '1Y5vwruhA8kV8Ki6G920LVk4Ypml86xTR',
    'kpop0003': '1lj--8jH9WYGpR9ojr_LEQnfvM-sPWLuW',
    'kpop0004': '1PRyfy2SVxA2w77h3af5tRIllYRUaOh5C',
    'kpop0005': '1Sa2FOTT1o3y_Ez1vLMZeAqrBAyo-roSk',
    'kpop0006': '1ojUR2MjCxhaKrHUnQURO6K_0_u7x6JgG',
    'kpop0007': '1oxMnymByTayNoWQBoSu3qnMhEOZFhFZ2',
    'kpop0008': '1hMa4JbmFC9G217kne_H9QtPwtin0Mp7A',
    'kpop0009': '1QnqbbMsLA06XVIJfto5zy-29X4iAVjnf',
    'gyeongbok':      '1QxmJNRQzLcYdiDhu8ptCdkHnNKuJS9q5',
    'palace_spring':  '15Emlzowu3bO4neE28AgpWXslEyeVPFKu',
    'cherry':         '1TQW6KTFl8wwm-V8dsINJzPRwDg1JVOsd',
    'culture001':     '1knPMyAlJXv_emIIUFHH-JVvYRSVpp3fq',
    'film_street':    '1lj-gTPzYJdYtPV7B9ub3rQsVD6klRIoW',
    'bts_concert':    '1SHFbL6AxkhHG2cA1_UYMEjJz7hgPmND9',
    'beauty_clinic':  '1lqbsy9YKsiyEylyqef4JpLMEncRduX_g',
    'skincare_clinic':'1E327lgPmQF1vIwWlA3KCBYYqNgfvpcct',
    'dance_students': '16lPqAF8wcuM_8DYJwyakMlOYX3j3dUpN',
    'kbbq':           '1KoVZOSFkaUOaSNdjj7taiVN4NtevJWMU',
    'pork_soup':      '1LJR_2j15KGrCQBy7ggsWVzPviXbuGo_m',
}

# kpop0001 and kpop0005 already downloaded via MCP — skip if present
already = {p.stem for p in DEST.glob('*')}

for name, file_id in IMAGES.items():
    if name in already:
        print(f'  skip  {name} (already exists)')
        continue
    out = str(DEST / f'{name}.png')
    print(f'  downloading {name}...')
    try:
        gdown.download(id=file_id, output=out, quiet=True)
        size = pathlib.Path(out).stat().st_size // 1024
        print(f'  ✓ {name}.png ({size}KB)')
    except Exception as e:
        print(f'  ✗ {name} failed: {e}')

print(f'\nDone. Files in: {DEST}')
