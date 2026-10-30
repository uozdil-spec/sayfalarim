#!/usr/bin/env python3
"""Her güncellemeden sonra çalıştırılır: tüm sayfalara ve dosya bağlantılarına
oluşturulma tarih-saatini (örn. 20261030-1047) yazar; böylece telefon eski kopyayı göstermez."""
import re, glob, os, datetime, zoneinfo
stamp = datetime.datetime.now(zoneinfo.ZoneInfo('Europe/Istanbul')).strftime('%Y%m%d-%H%M')
os.chdir(os.path.dirname(os.path.abspath(__file__)))
SKIP = {'spider/index.html', 'kelime-oyunu/index.html'}   # yönlendirme sayfaları
def local(u): return not re.match(r'(https?:|//|data:|#|mailto:|javascript:)', u)
def fix_url(m):
    q, u = m.group(2), m.group(3)
    if not local(u) or u.endswith('.webmanifest') and False: return m.group(0)
    base = re.sub(r'\?v=[0-9-]+', '', u)
    return m.group(1) + q + base + ('&' if '?' in base else '?') + 'v=' + stamp + q
for f in glob.glob('**/*.html', recursive=True):
    if f in SKIP or 'node_modules' in f: continue
    s = open(f, encoding='utf-8').read(); o = s
    s = re.sub(r'(<(?:link|script)\b[^>]*?\b(?:href|src)=)(["\'])([^"\']+)\2', fix_url, s)
    meta = '<meta name="surum" content="%s">' % stamp
    if re.search(r'<meta name="surum"[^>]*>', s): s = re.sub(r'<meta name="surum"[^>]*>', meta, s)
    else: s = re.sub(r'(<head[^>]*>)', r'\1\n' + meta, s, count=1)
    if s != o: open(f, 'w', encoding='utf-8').write(s); print('sayfa', f)
for f in glob.glob('**/sw.js', recursive=True):
    s = open(f, encoding='utf-8').read()
    n = re.sub(r"((?:const|var|let)\s+(?:V|C)\s*=\s*')([a-z]+)[^']*(')", lambda m: m.group(1) + m.group(2) + '-' + stamp + m.group(3), s, count=1)
    if n != s and 'unregister' not in s: open(f, 'w', encoding='utf-8').write(n); print('sw', f)
print('damga', stamp)
