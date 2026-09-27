# Génère snippets/velea-i18n-<langue>.liquid à partir de traductions.py
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from traductions import T, LANGS
here = os.path.dirname(os.path.abspath(__file__))
def q(s):
    if '"' not in s: return '"' + s + '"'
    if "'" not in s: return "'" + s + "'"
    raise SystemExit('guillemets impossibles : ' + s)
fr = [row[0] for row in T]
dups = {x for x in fr if fr.count(x) > 1}
if dups: raise SystemExit('doublons : %r' % dups)
rows = sorted(T, key=lambda r: -len(r[0]))  # les plus longs d'abord
for i, lang in enumerate(LANGS, start=1):
    chain = ''.join('\n  | replace: %s, %s' % (q(r[0]), q(r[i])) for r in rows)
    out = ('{%- comment -%} Traduction ' + lang.upper() + ' des textes VELEA (généré par i18n/generer.py, ne pas modifier à la main) {%- endcomment -%}\n'
           '{{- html' + chain + ' -}}\n')
    open(os.path.join(here, '..', 'snippets', 'velea-i18n-%s.liquid' % lang), 'w').write(out)
    print(lang, len(out))
