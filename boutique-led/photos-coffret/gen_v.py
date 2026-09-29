s = open('s.html').read()
head = s[:s.index('<!-- 1 Contenu -->')]
logo = '<div class="logo"><svg><use href="#flo"/></svg>VELEA</div>'
def ic(p): return '<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg></span>'
EYE = '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>'
WAVE = '<path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>'
LIGHT = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2"/>'
HANDS = '<path d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 12V8.5a1.5 1.5 0 0 1 3 0V14c0 4-3 7-7 7s-6-2-7.5-4.5L3 13.5a1.5 1.5 0 0 1 2.5-1.5L7 14"/>'
BAT = '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M10 2h4M11 9l-2 4h4l-2 4"/>'
CLOCK = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
RET = '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>'
SLIDERS = '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'
WAND = '<path d="M4 20L15 9M15 9l2-2 3 3-2 2M13 5l1-2M19 11l2-1"/>'
PLUG = '<path d="M9 3v5M15 3v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v3"/>'
def card(i, b, sp): return '<div class="card">%s<div><b>%s</b><span>%s</span></div></div>' % (ic(i), b, sp)
css = '''.ph{background:#fff;border:1.5px solid #EFD6D6;border-radius:34px;overflow:hidden;display:flex;align-items:center;justify-content:center}
.ph img{display:block;width:100%;height:100%;object-fit:cover}
.pl{font-family:'Cormorant Garamond',serif;font-size:130px;color:#B8914F;line-height:1}
.pink{background:radial-gradient(circle at 50% 40%,#FBE3E3 0,#F4CBCD 70%,#EFC1C4 100%)}
</style>'''
out = head.replace('</style>', css, 1)
L = []
L.append('''<div class="s" id="l1"><p class="ey">DANS LA BOÎTE</p><h2>Tout ce qu'il faut,<br><em>prêt à l'emploi</em></h2>
<div class="ph" style="width:760px;height:560px;margin-top:40px"><img src="lun.jpg" style="object-fit:contain;width:92%;height:92%"></div>
<div class="card box">1 paire de lunettes de massage · 1 câble USB-C · 1 notice</div>''' + logo + '</div>')
L.append('<div class="s" id="l2"><p class="ey">DEUX GESTES EN UN</p><h2>Micro-massage doux<br><em>&amp; lumière rouge</em></h2><div class="g3" style="margin-top:56px">'
         + card(WAVE, 'Micro-massage EMS', 'de légères impulsions douces') + card(LIGHT, 'Lumière rouge', 'chaude et apaisante')
         + card(SLIDERS, '4 modes', 'selon votre envie du jour') + card(SLIDERS, '3 intensités', 'commencez toujours au plus doux')
         + card(HANDS, 'Mains libres', 'lisez, regardez votre série…') + card(CLOCK, '10 minutes', 'arrêt automatique') + '</div></div>')
L.append('''<div class="s" id="l3"><p class="ey">SIMPLE COMME BONSOIR</p><h2>Votre rituel<br><em>en 3 étapes</em></h2>
<div class="steps"><div class="card"><span class="num">1</span><div><h3>Préparez votre regard</h3><p>Contour des yeux propre et sec, sans crème.</p></div></div>
<div class="card"><span class="num">2</span><div><h3>Installez-vous</h3><p>Posez les lunettes, choisissez le mode, commencez à l'intensité la plus faible.</p></div></div>
<div class="card"><span class="num">3</span><div><h3>Détendez-vous 10 minutes</h3><p>Elles s'arrêtent toutes seules. Terminez par votre soin habituel.</p></div></div></div>
<p class="note">3 à 5 fois par semaine · lisez la notice avant la première utilisation</p></div>''')
big = "font-family:'Cormorant Garamond',serif;font-size:120px;color:#C47A86;line-height:1"
L.append('''<div class="s" id="l4"><p class="ey">SANS FIL</p><h2>Rechargeables,<br><em>partout avec vous</em></h2>
<div style="display:flex;gap:30px;margin-top:60px;width:100%%">
<div class="card" style="flex:1;padding:50px 30px;text-align:center"><div style="%s">30<small style="font-size:50px"> min</small></div><p style="font-size:28px;color:#7A5E63;margin-top:14px">de charge USB-C</p></div>
<div class="card" style="flex:1;padding:50px 30px;text-align:center"><div style="%s">~90<small style="font-size:50px"> min</small></div><p style="font-size:28px;color:#7A5E63;margin-top:14px">d'utilisation</p></div></div>
<div class="g3" style="margin-top:34px">''' % (big, big) + card(BAT, 'Câble USB-C', 'inclus dans la boîte') + card(HANDS, 'Légères', 'faciles à emporter') + '</div></div>')
L.append('<div class="s" id="l5"><p class="ey">LE SOIN DU REGARD</p><h2>Pourquoi vous allez<br><em>les adorer</em></h2><div class="g3">'
         + card(EYE, 'Un regard reposé', 'un vrai moment de détente') + card(WAVE, 'Massage tout doux', "vous réglez l'intensité")
         + card(LIGHT, 'Lumière rouge', 'un effet cocooning') + card(HANDS, 'Les mains libres', 'elles se portent comme des lunettes')
         + card(BAT, 'Rechargeables', "environ 90 min d'autonomie") + card(RET, 'Retours 14 jours', '+ garantie légale 2 ans') + '</div>' + logo + '</div>')
S5 = ('<div class="s" id="s5b"><p class="ey">LE GESTE INSTITUT À LA MAISON</p><h2>Pourquoi vous allez<br><em>l\'adorer</em></h2><div class="g3">'
      + card(WAND, '4 embouts en verre', 'une forme pour chaque zone') + card(CLOCK, 'Quelques minutes', 'un geste rapide, le soir')
      + card(PLUG, 'Prise européenne', 'se branche sur le secteur') + card(LIGHT, 'Lueur néon douce', "l'embout s'illumine au contact")
      + card(HANDS, 'Léger et maniable', 'il se tient comme un stylo') + card(RET, 'Retours 14 jours', '+ garantie légale 2 ans') + '</div>' + logo + '</div>')
stylo_vis = '<div class="ph" style="width:420px;height:560px;flex:none"><img src="femme.jpg" style="object-position:50% 30%"></div>'
lun_vis = '<div class="ph" style="width:420px;height:560px;flex:none"><img src="lun.jpg" style="object-fit:contain;width:95%;height:auto"></div>'
mask_vis = '<div class="ph" style="width:420px;height:560px;flex:none"><img src="masque.jpg"></div>'
def cof(id_, title, right, lbl):
    return ('<div class="s pink" id="%s"><p class="ey">COFFRET RITUEL ÉCLAT</p><h2>%s</h2>'
            '<div style="display:flex;align-items:center;gap:26px;margin-top:44px"><div style="text-align:center">%s<p style="margin-top:20px;font-size:27px;font-weight:600">Masque LED visage &amp; cou</p></div><span class="pl">+</span><div style="text-align:center">%s<p style="margin-top:20px;font-size:27px;font-weight:600">%s</p></div></div>%s</div>'
            % (id_, title, mask_vis, right, lbl, logo))
C0 = ('''<div class="s pink" id="c0"><p class="ey">COFFRET RITUEL ÉCLAT</p><h2>Le masque LED<br><em>+ le complément de votre choix</em></h2>
<div style="display:flex;align-items:center;gap:22px;margin-top:40px"><div class="ph" style="width:470px;height:600px"><img src="masque.jpg"></div><span class="pl" style="font-size:110px">+</span>
<div style="display:flex;flex-direction:column;align-items:center;gap:10px"><div class="ph" style="width:300px;height:280px"><img src="lun.jpg" style="object-fit:contain"></div>
<div style="font-family:'Cormorant Garamond',serif;font-size:40px;color:#94702F;font-style:italic;line-height:1">ou</div>
<div class="ph" style="width:300px;height:280px"><img src="femme.jpg" style="object-position:50% 25%"></div></div></div>''' + logo + '</div>')
C = [cof('c1', 'Masque LED<br><em>+ Lunettes regard</em>', lun_vis, 'Lunettes LED regard'),
     cof('c2', 'Masque LED<br><em>+ Stylo visage</em>', stylo_vis, 'Stylo visage')]
out += '\n'.join(L) + S5 + C0 + '\n'.join(C) + '</body></html>'
open('v.html', 'w').write(out)
