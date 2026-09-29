# Génère les modèles de page produit (templates/product.<nom>.json) à partir du modèle du masque.
import json, copy, os
here = os.path.dirname(os.path.abspath(__file__))
base = json.load(open(os.path.join(here, '..', 'product.masque-led.json')))

def text_block(b, html): b = copy.deepcopy(b); b['settings']['text'] = html; return b

PAGES = {
 'lunettes': dict(
  eyebrow='✦ LE SOIN DU REGARD',
  pitch="<p>Un vrai moment de détente pour votre regard : <strong>micro-massage doux et lumière rouge</strong>, les mains libres, en 10 minutes.</p>",
  bullets="<p>✓ <strong>Micro-massage doux</strong> (micro-courants) + <strong>lumière rouge</strong><br>✓ <strong>4 modes, 3 intensités</strong> au choix<br>✓ <strong>Mains libres</strong> : se porte comme des lunettes<br>✓ <strong>Rechargeable USB-C</strong> : environ 90 min d'utilisation<br>✓ <strong>Minuteur 10 min</strong>, arrêt automatique<br>✓ <strong>Léger</strong>, facile à emporter</p>",
  ben_title="Un regard <em>tout en douceur</em>", ben_lead="Un moment de douceur rien que pour le contour des yeux.",
  bens=[('eye','Un regard reposé','Un geste doux pour détendre le contour des yeux et retrouver un regard qui paraît plus frais.'),
        ('wave','Micro-massage doux','De légères impulsions massent délicatement la zone du regard. Vous réglez l\'intensité.'),
        ('light','Lumière rouge douce','Une lumière chaude et apaisante, pour un vrai moment cocooning.'),
        ('hands','Les mains libres','Elles se posent comme une paire de lunettes : lisez, regardez votre série ou détendez-vous.'),
        ('battery','Rechargeable USB-C','Environ 30 minutes de charge pour près de 90 minutes d\'utilisation.'),
        ('clock','10 minutes, c\'est tout','Minuteur intégré et arrêt automatique. Rien à surveiller.')],
  steps=[('Préparez votre regard','Nettoyez et séchez le contour des yeux, sans crème.'),
         ('Installez-vous','Posez les lunettes, choisissez le mode et commencez par l\'intensité la plus faible.'),
         ('Détendez-vous 10 minutes','Les lunettes s\'arrêtent toutes seules. Terminez par votre soin habituel.')],
  steps_note="À utiliser 3 à 5 fois par semaine, idéalement le soir.",
  specs=[('Type','Lunettes de massage contour des yeux'),('Technologies','Micro-courants + lumière rouge'),('Réglages','4 modes, 3 intensités'),
         ('Batterie','Rechargeable USB-C'),('Autonomie','Environ 90 min (charge ~30 min)'),('Séance','10 min, arrêt automatique'),
         ('Coloris','Blanc'),('Dans la boîte','Lunettes, câble USB-C, notice'),('Garanties','Retours 14 jours · Garantie légale 2 ans'),('Utilisation','Bien-être, usage cosmétique')],
  reassure="<p>🚚 Livraison suivie · ↩️ Retours sous 14 jours<br>🔒 Paiement sécurisé · ✅ Garantie légale 2 ans</p>",
  infos=[('box','Dans la boîte',"<p>1 paire de lunettes de massage<br>1 câble de charge USB-C<br>1 notice d'utilisation</p>"),
         ('ruler','Caractéristiques',"<p>Technologies : micro-courants EMS + lumière rouge<br>Réglages : 4 modes, 3 intensités<br>Batterie : rechargeable USB-C (charge ~30 min, autonomie ~90 min)<br>Séance : 10 min, arrêt automatique<br>Coloris : blanc</p>"),
         ('stopwatch','Comment les utiliser',"<p>1. Contour des yeux propre et sec, sans crème.<br>2. Posez les lunettes, choisissez le mode, commencez à l'intensité la plus faible.<br>3. Détendez-vous 10 minutes, elles s'arrêtent toutes seules.<br>3 à 5 fois par semaine.</p>"),
         ('check_box','Précautions',"<p>Ne pas utiliser en cas de pacemaker ou d'implant électronique, de grossesse, d'épilepsie, de problème oculaire ou de peau lésée autour des yeux. Retirez vos lentilles. Commencez toujours au plus doux. En cas de doute, demandez l'avis d'un médecin. Appareil de bien-être, non médical.</p>"),
         ('truck','Livraison et retours',"<p>Livraison suivie, en général sous 5 à 10 jours ouvrés. Retours possibles sous 14 jours. Garantie légale de conformité de 2 ans. Une question ? velea.officiel@gmail.com</p>")],
  precautions="<p>Ne pas utiliser en cas de pacemaker ou d'implant électronique, de grossesse, d'épilepsie, de problème oculaire ou de peau lésée autour des yeux. Commencez toujours par l'intensité la plus faible. Demandez l'avis d'un médecin en cas de doute. Lisez la notice avant la première utilisation. Tenir hors de portée des enfants. Appareil de bien-être à usage cosmétique, non médical.</p>"),
 'haute-frequence': dict(
  eyebrow='✦ LE GESTE INSTITUT À LA MAISON',
  pitch="<p>Un stylo léger et maniable avec <strong>4 embouts en verre</strong> pour un moment de soin ciblé du visage, en quelques minutes, comme en institut.</p>",
  bullets="<p>✓ <strong>4 embouts en verre</strong> : champignon, cuillère, courbé, droit<br>✓ <strong>Léger et maniable</strong> : poignée de 21,2 cm<br>✓ <strong>Prise européenne</strong>, se branche sur le secteur<br>✓ <strong>Séances courtes</strong> : quelques minutes suffisent<br>✓ Se glisse facilement dans votre <strong>rituel du soir</strong></p>",
  reassure="<p>🚚 Livraison suivie · ↩️ Retours sous 14 jours<br>🔒 Paiement sécurisé · ✅ Garantie légale 2 ans</p>",
  ben_title="Le soin ciblé, <em>tout simplement</em>", ben_lead="Un geste beauté précis, comme en institut.",
  bens=[('sparkle','Une peau qui paraît plus nette','Un moment de soin ciblé pour une peau qui paraît plus nette et plus lumineuse.'),
        ('wand','4 embouts en verre','Champignon, cuillère, courbé, droit : une forme pour chaque zone.'),
        ('hands','Léger et maniable','Une poignée de 21,2 cm : il se tient comme un stylo.'),
        ('clock','Quelques minutes suffisent','Un geste rapide à glisser dans votre routine du soir.'),
        ('heart','Un moment pour vous','Quelques minutes de soin rien qu\'à vous, le soir.'),
        ('light','Lueur néon','L\'embout s\'illumine d\'une douce lueur orangée au contact de la peau.')],
  steps=[('Préparez votre peau','Visage propre et sec, sans produit à l\'alcool. Retirez vos bijoux.'),
         ('Choisissez l\'embout','Fixez-le au stylo, allumez et commencez à l\'intensité la plus faible.'),
         ('Quelques minutes de soin','Petits mouvements doux, puis appliquez votre soin habituel.')],
  steps_note="À utiliser 2 à 3 fois par semaine.",
  specs=[('Type','Stylo visage haute fréquence'),('Embouts','4 en verre : champignon, cuillère, courbé, droit'),('Poignée','21,2 cm, isolée, avec câble'),
         ('Longueur des embouts','14 à 16 cm'),('Prise','Européenne'),('Dans la boîte','Stylo, 4 embouts, notice'),
         ('Garanties','Retours 14 jours · Garantie légale 2 ans'),('Utilisation','Bien-être, usage cosmétique')],
  precautions="<p>Ne pas utiliser en cas de grossesse, de pacemaker ou d'implant électronique ou métallique, d'épilepsie, de peau lésée ou irritée. Ne pas utiliser près des yeux. Retirez vos bijoux avant la séance. N'utilisez jamais l'appareil après avoir appliqué un produit contenant de l'alcool. Manipulez les embouts en verre avec précaution et laissez-les refroidir avant de les changer. Demandez l'avis d'un médecin en cas de doute et lisez la notice avant la première utilisation. Tenir hors de portée des enfants. Appareil de bien-être à usage cosmétique, non médical.</p>",
  infos=[('box','Dans la boîte',"<p>1 stylo haute fréquence avec câble et prise européenne<br>4 embouts en verre : champignon, cuillère, courbé, droit<br>1 notice d'utilisation</p>"),
         ('ruler','Caractéristiques',"<p>Poignée : 21,2 cm, isolée, avec câble<br>Embouts : en verre, de 14 à 16 cm<br>Prise : européenne<br>Usage : bien-être, cosmétique</p>"),
         ('eye','Quel embout pour quelle zone ?',"<p><strong>Champignon</strong> : grandes zones (joues, front, mâchoire)<br><strong>Cuillère</strong> : petites zones, en touches précises<br><strong>Courbé</strong> : zones délicates (ailes du nez, menton)<br><strong>Droit</strong> : massage doux du cuir chevelu</p>"),
         ('stopwatch','Comment l\'utiliser',"<p>1. Visage propre et sec, sans produit à l'alcool, bijoux retirés.<br>2. Fixez l'embout, allumez et commencez à l'intensité la plus faible.<br>3. Petits mouvements doux quelques minutes, puis votre soin habituel.<br>2 à 3 fois par semaine.</p>"),
         ('check_box','Précautions',"<p>Ne pas utiliser en cas de grossesse, de pacemaker ou d'implant, d'épilepsie, de peau lésée ou irritée, ni près des yeux. Jamais après un produit contenant de l'alcool. En cas de doute, demandez l'avis d'un médecin. Appareil de bien-être, non médical.</p>"),
         ('truck','Livraison et retours',"<p>Livraison suivie, en général sous 5 à 10 jours ouvrés. Retours possibles sous 14 jours. Garantie légale de conformité de 2 ans. Une question ? velea.officiel@gmail.com</p>")]),
 'coffret': dict(
  eyebrow='✦ OFFRE PREMIUM · COMPOSEZ VOTRE DUO',
  pitch="<p>Le <strong>masque LED visage &amp; cou</strong> + le complément de votre choix : <strong>lunettes regard</strong> ou <strong>stylo visage</strong>. Moins cher qu'achetés séparément.</p>",
  bullets="<p>✓ <strong>Masque LED visage &amp; cou</strong> dans tous les coffrets<br>✓ Au choix : <strong>lunettes regard</strong> (micro-massage + lumière rouge)<br>✓ ou <strong>stylo visage haute fréquence</strong> (4 embouts en verre)<br>✓ <strong>Moins cher</strong> qu'achetés séparément<br>✓ Idée cadeau pour une personne qui aime prendre soin d'elle<br>✓ Peut arriver en <strong>2 colis</strong>, chacun avec son suivi</p>",
  ben_title="Votre rituel, <em>à votre façon</em>", ben_lead="Le masque LED, plus le complément qui vous ressemble.",
  bens=[('sparkle','Le masque LED inclus','10 minutes de lumière douce pour le visage et le cou, dans tous les coffrets.'),
        ('eye','Option lunettes regard','Micro-massage doux et lumière rouge pour le contour des yeux, les mains libres.'),
        ('wand','Option stylo visage','Un soin ciblé avec 4 embouts en verre, en quelques minutes.'),
        ('gift','L\'idée cadeau','Un coffret bien-être à offrir… ou à s\'offrir.'),
        ('heart','Moins cher','Le coffret coûte moins cher que les deux produits achetés séparément.'),
        ('clock','Un vrai rituel du soir','Deux gestes simples pour finir la journée en prenant soin de vous.')],
  steps=[('Choisissez votre duo','Masque + lunettes regard, ou masque + stylo visage : sélectionnez votre complément.'),
         ('Le masque LED','Sur une peau propre et sèche, installez le masque 10 minutes, les yeux fermés.'),
         ('Votre complément','Les lunettes 10 minutes, ou le stylo quelques minutes, puis votre soin habituel.')],
  steps_note="À utiliser 3 à 5 fois par semaine, idéalement le soir.",
  specs=[('Dans tous les coffrets','Masque LED visage & cou'),('Complément au choix','Lunettes regard ou stylo visage'),('Masque','Silicone souple, 7 couleurs, 10 min'),
         ('Lunettes','Micro-massage + lumière rouge, 4 modes'),('Stylo','4 embouts en verre, prise européenne'),('Livraison','Sous 7 jours ouvrés, 1 ou 2 colis'),('Garanties','Retours 14 jours · Garantie légale 2 ans')],
  reassure="<p>🚚 Livraison suivie · ↩️ Retours sous 14 jours<br>🔒 Paiement sécurisé · ✅ Garantie légale 2 ans</p>",
  inclus=True,
  infos=[('box','Dans le coffret',"<p><strong>Toujours inclus :</strong> le masque LED visage &amp; cou (masque, pièce cou, boîtier rechargeable, câble USB, notice).<br><strong>Au choix :</strong> les lunettes LED regard (avec câble USB-C et notice) ou le stylo visage haute fréquence (4 embouts en verre, prise européenne, notice).</p>"),
         ('price_tag','Prix du coffret',"<p>Masque + lunettes regard : 144,90 €<br>Masque + stylo visage : 139,90 €<br>Moins cher que les deux produits achetés séparément.</p>"),
         ('check_box','Précautions',"<p>Masque : gardez les yeux fermés. Ne pas utiliser en cas de pacemaker ou d'implant électronique, de grossesse, d'épilepsie, de photosensibilité, de problème oculaire ou de peau lésée. Stylo : jamais près des yeux ni après un produit contenant de l'alcool. En cas de doute, demandez l'avis d'un médecin. Appareils de bien-être, non médicaux.</p>"),
         ('truck','Livraison et retours',"<p>Le coffret peut arriver en 2 colis, chacun avec son numéro de suivi, en général sous 5 à 10 jours ouvrés. Retours possibles sous 14 jours. Garantie légale de conformité de 2 ans.</p>")],
  precautions="<p>Gardez les yeux fermés pendant l'utilisation du masque. Ne pas utiliser en cas de pacemaker ou d'implant électronique, de grossesse, d'épilepsie, de photosensibilité, de problème oculaire ou de peau lésée. Stylo : ne pas utiliser près des yeux ni après un produit contenant de l'alcool. Demandez l'avis d'un médecin en cas de doute et lisez les notices avant la première utilisation. Tenir hors de portée des enfants. Appareils de bien-être à usage cosmétique, non médicaux.</p>"),
}

for name, c in PAGES.items():
    t = copy.deepcopy(base)
    blocks = t['sections']['main']['blocks']['product-details']['blocks']
    blocks['eyebrow']['settings']['text'] = '<p><strong>%s</strong></p>' % c['eyebrow']
    blocks['pitch']['settings']['text'] = c['pitch']
    blocks['bullets']['settings']['text'] = c['bullets']
    if 'reassure' in c: blocks['reassure']['settings']['text'] = c['reassure']
    if 'infos' in c:
        rows, rorder = {}, []
        for i, (ic, he, tx) in enumerate(c['infos']):
            k = 'row%d' % i; rorder.append(k)
            tb = copy.deepcopy(blocks['bullets']); tb['settings']['text'] = tx; tb.pop('name', None)
            tb['settings'].update({'background': False, 'padding-block-start': 0, 'padding-block-end': 12, 'padding-inline-start': 0, 'padding-inline-end': 0})
            rows[k] = {'type': '_accordion-row', 'settings': {'heading': he, 'open_by_default': False, 'icon': ic, 'width': 20}, 'blocks': {'t': tb}, 'block_order': ['t']}
        blocks['infos'] = {'type': 'accordion', 'name': 'Toutes les infos', 'settings': {'icon': 'caret', 'dividers': True, 'divider_color': '#EFD6D6', 'type_preset': 'paragraph',
            'border': 'none', 'border_radius': 0, 'padding-block-start': 4, 'padding-block-end': 0, 'padding-inline-start': 0, 'padding-inline-end': 0}, 'blocks': rows, 'block_order': rorder}
        order = t['sections']['main']['blocks']['product-details']['block_order']
        order.insert(order.index('reassure') + 1, 'infos')
    if c.get('inclus'):
        blocks['inclus'] = {'type': 'velea-coffret-inclus', 'settings': {'step1': 'Inclus dans votre coffret', 'item': 'Masque LED visage & cou',
            'note': 'Toujours inclus, ne peut pas être retiré', 'step2': 'Choisissez votre complément'}}
        order = t['sections']['main']['blocks']['product-details']['block_order']
        order.insert(order.index('variant_picker'), 'inclus')
    info_blocks, order = {}, []
    for i, (ic, ti, tx) in enumerate(c['bens']):
        k = 'ben%d' % i; info_blocks[k] = {'type': 'ben', 'settings': {'icon': ic, 'title': ti, 'text': tx}}; order.append(k)
    for i, (ti, tx) in enumerate(c['steps']):
        k = 'step%d' % i; info_blocks[k] = {'type': 'step', 'settings': {'title': ti, 'text': tx}}; order.append(k)
    for i, (la, va) in enumerate(c['specs']):
        k = 'spec%d' % i; info_blocks[k] = {'type': 'spec', 'settings': {'label': la, 'value': va}}; order.append(k)
    t['sections']['rt_info'] = {'type': 'rt-pdp-info', 'blocks': info_blocks, 'block_order': order, 'settings': {
        'ben_eyebrow': 'Les points forts', 'ben_title': c['ben_title'], 'ben_lead': c['ben_lead'],
        'steps_eyebrow': 'Simple comme bonsoir', 'steps_title': 'Votre rituel <em>en 3 étapes</em>', 'steps_note': c['steps_note'],
        'specs_eyebrow': 'En détail', 'specs_title': 'Caractéristiques &amp; <em>contenu</em>', 'precautions': c['precautions']}}
    for k in ('rt_pdp_ben', 'rt_steps', 'rt_pdp_specs', 'rt_faq', 'rt_shop', 'rt_marquee'):
        t['sections'].pop(k, None)
    # Aucune autre offre sur une page produit : pas de bandeau du masque ni de compléments.
    t['order'] = ['main', 'rt_info', 'rt_trust']
    open(os.path.join(here, 'product.%s.json' % name), 'w').write(json.dumps(t, ensure_ascii=False, separators=(',', ':')))
    print(name, 'ok')
