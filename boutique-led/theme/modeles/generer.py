# Génère les modèles de page produit (templates/product.<nom>.json) à partir du modèle du masque.
import json, copy, os
here = os.path.dirname(os.path.abspath(__file__))
base = json.load(open(os.path.join(here, '..', 'product.masque-led.json')))

def text_block(b, html): b = copy.deepcopy(b); b['settings']['text'] = html; return b

PAGES = {
 'lunettes': dict(
  eyebrow='✦ LE SOIN DU REGARD',
  pitch="<p>Micro-massage EMS et lumière rouge pour le contour des yeux. 10 minutes, mains libres, rechargeables en USB-C.</p>",
  bullets="<p>✓ <strong>Micro-massage doux</strong> (micro-courants) + <strong>lumière rouge</strong><br>✓ <strong>4 modes, 3 intensités</strong> au choix<br>✓ <strong>Mains libres</strong> : se porte comme des lunettes<br>✓ <strong>Rechargeable USB-C</strong> : environ 90 min d'utilisation<br>✓ <strong>Minuteur 10 min</strong>, arrêt automatique<br>✓ <strong>Léger</strong>, facile à emporter</p>",
  ben_title="Un regard <em>tout en douceur</em>", ben_lead="Un moment de douceur rien que pour le contour des yeux.",
  bens=[('eye','Contour des yeux','Se posent comme des lunettes, sur la zone du regard.'),
        ('wave','Micro-massage EMS','De légères impulsions, 3 intensités au choix.'),
        ('light','Lumière rouge','Chaleur douce pendant la séance.'),
        ('hands','Mains libres','Vous pouvez lire ou regarder un écran.'),
        ('battery','Rechargeable USB-C','Environ 30 minutes de charge pour près de 90 minutes d\'utilisation.'),
        ('clock','10 minutes, c\'est tout','Minuteur intégré et arrêt automatique. Rien à surveiller.')],
  steps=[('Peau propre','Contour des yeux nettoyé et sec, sans crème.'),
         ('Installez-vous','Posez les lunettes, choisissez le mode et commencez par l\'intensité la plus faible.'),
         ('Détendez-vous 10 minutes','Les lunettes s\'arrêtent toutes seules. Terminez par votre soin habituel.')],
  steps_note="À utiliser 3 à 5 fois par semaine, idéalement le soir.",
  specs=[('Type','Lunettes de massage contour des yeux'),('Technologies','Micro-courants + lumière rouge'),('Réglages','4 modes, 3 intensités'),
         ('Batterie','Rechargeable USB-C'),('Autonomie','Environ 90 min (charge ~30 min)'),('Séance','10 min, arrêt automatique'),
         ('Coloris','Blanc'),('Dans la boîte','Lunettes, câble USB-C, notice'),('Garanties','Satisfaite ou remboursée 30 jours · Garantie légale 2 ans'),('Utilisation','Bien-être, usage cosmétique')],
  reassure="<p>🚚 Livraison suivie · ↩️ Satisfaite ou remboursée 30 jours<br>🔒 Paiement sécurisé · ✅ Garantie légale 2 ans</p>",
  infos=[('box','Dans la boîte',"<p>1 paire de lunettes de massage<br>1 câble de charge USB-C<br>1 notice d'utilisation</p>"),
         ('ruler','Caractéristiques',"<p>Technologies : micro-courants EMS + lumière rouge<br>Réglages : 4 modes, 3 intensités<br>Batterie : rechargeable USB-C (charge ~30 min, autonomie ~90 min)<br>Séance : 10 min, arrêt automatique<br>Coloris : blanc</p>"),
         ('stopwatch','Comment les utiliser',"<p>1. Contour des yeux propre et sec, sans crème.<br>2. Posez les lunettes, choisissez le mode, commencez à l'intensité la plus faible.<br>3. Détendez-vous 10 minutes, elles s'arrêtent toutes seules.<br>3 à 5 fois par semaine.</p>"),
         ('check_box','Précautions',"<p>Ne pas utiliser en cas de pacemaker ou d'implant électronique, de grossesse, d'épilepsie, de problème oculaire ou de peau lésée autour des yeux. Retirez vos lentilles. Commencez toujours au plus doux. En cas de doute, demandez l'avis d'un médecin. Appareil de bien-être, non médical.</p>"),
         ('truck','Livraison et retours',"<p>Livraison suivie, en général sous 5 à 10 jours ouvrés. Satisfaite ou remboursée 30 jours. Garantie légale de conformité de 2 ans. Une question ? velea.officiel@gmail.com</p>")],
  precautions="<p>Ne pas utiliser en cas de pacemaker ou d'implant électronique, de grossesse, d'épilepsie, de problème oculaire ou de peau lésée autour des yeux. Commencez toujours par l'intensité la plus faible. Demandez l'avis d'un médecin en cas de doute. Lisez la notice avant la première utilisation. Tenir hors de portée des enfants. Appareil de bien-être à usage cosmétique, non médical.</p>"),
 'haute-frequence': dict(
  eyebrow='✦ LE GESTE INSTITUT À LA MAISON',
  pitch="<p>Stylo haute fréquence avec <strong>4 embouts en verre</strong> interchangeables. Poignée de 21,2 cm, prise européenne.</p>",
  bullets="<p>✓ <strong>4 embouts en verre</strong> : champignon, cuillère, courbé, droit<br>✓ <strong>Léger et maniable</strong> : poignée de 21,2 cm<br>✓ <strong>Prise européenne</strong>, se branche sur le secteur<br>✓ <strong>Séances courtes</strong> : quelques minutes suffisent<br>✓ Se glisse facilement dans votre <strong>rituel du soir</strong></p>",
  reassure="<p>🚚 Livraison suivie · ↩️ Satisfaite ou remboursée 30 jours<br>🔒 Paiement sécurisé · ✅ Garantie légale 2 ans</p>",
  ben_title="Le soin ciblé, <em>tout simplement</em>", ben_lead="Un geste beauté précis, comme en institut.",
  bens=[('sparkle','Soin ciblé','Pour travailler une zone précise du visage.'),
        ('wand','4 embouts en verre','Champignon, cuillère, courbé, droit : une forme pour chaque zone.'),
        ('hands','Léger et maniable','Une poignée de 21,2 cm : il se tient comme un stylo.'),
        ('clock','5 minutes','Séances courtes, 2 à 3 fois par semaine.'),
        ('plug','Prise européenne','Se branche directement sur le secteur.'),
        ('light','Lueur orangée','L\'embout s\'illumine au contact de la peau.')],
  steps=[('Peau propre','Visage sec, sans produit à l\'alcool, bijoux retirés.'),
         ('Choisissez l\'embout','Fixez-le au stylo, allumez et commencez à l\'intensité la plus faible.'),
         ('Quelques minutes de soin','Petits mouvements doux, puis appliquez votre soin habituel.')],
  steps_note="À utiliser 2 à 3 fois par semaine.",
  specs=[('Type','Stylo visage haute fréquence'),('Embouts','4 en verre : champignon, cuillère, courbé, droit'),('Poignée','21,2 cm, isolée, avec câble'),
         ('Longueur des embouts','14 à 16 cm'),('Prise','Européenne'),('Dans la boîte','Stylo, 4 embouts, notice'),
         ('Garanties','Satisfaite ou remboursée 30 jours · Garantie légale 2 ans'),('Utilisation','Bien-être, usage cosmétique')],
  precautions="<p>Ne pas utiliser en cas de grossesse, de pacemaker ou d'implant électronique ou métallique, d'épilepsie, de peau lésée ou irritée. Ne pas utiliser près des yeux. Retirez vos bijoux avant la séance. N'utilisez jamais l'appareil après avoir appliqué un produit contenant de l'alcool. Manipulez les embouts en verre avec précaution et laissez-les refroidir avant de les changer. Demandez l'avis d'un médecin en cas de doute et lisez la notice avant la première utilisation. Tenir hors de portée des enfants. Appareil de bien-être à usage cosmétique, non médical.</p>",
  infos=[('box','Dans la boîte',"<p>1 stylo haute fréquence avec câble et prise européenne<br>4 embouts en verre : champignon, cuillère, courbé, droit<br>1 notice d'utilisation</p>"),
         ('ruler','Caractéristiques',"<p>Poignée : 21,2 cm, isolée, avec câble<br>Embouts : en verre, de 14 à 16 cm<br>Prise : européenne<br>Usage : bien-être, cosmétique</p>"),
         ('eye','Quel embout pour quelle zone ?',"<p><strong>Champignon</strong> : grandes zones (joues, front, mâchoire)<br><strong>Cuillère</strong> : petites zones, en touches précises<br><strong>Courbé</strong> : zones délicates (ailes du nez, menton)<br><strong>Droit</strong> : massage doux du cuir chevelu</p>"),
         ('stopwatch','Comment l\'utiliser',"<p>1. Visage propre et sec, sans produit à l'alcool, bijoux retirés.<br>2. Fixez l'embout, allumez et commencez à l'intensité la plus faible.<br>3. Petits mouvements doux quelques minutes, puis votre soin habituel.<br>2 à 3 fois par semaine.</p>"),
         ('check_box','Précautions',"<p>Ne pas utiliser en cas de grossesse, de pacemaker ou d'implant, d'épilepsie, de peau lésée ou irritée, ni près des yeux. Jamais après un produit contenant de l'alcool. En cas de doute, demandez l'avis d'un médecin. Appareil de bien-être, non médical.</p>"),
         ('truck','Livraison et retours',"<p>Livraison suivie, en général sous 5 à 10 jours ouvrés. Satisfaite ou remboursée 30 jours. Garantie légale de conformité de 2 ans. Une question ? velea.officiel@gmail.com</p>")]),
 'coffret': dict(
  eyebrow='✦ OFFRE PREMIUM · COMPOSEZ VOTRE DUO',
  pitch="<p>Le <strong>masque LED visage &amp; cou</strong> + le complément de votre choix : <strong>lunettes regard</strong> ou <strong>stylo visage</strong>. Moins cher qu'achetés séparément.</p>",
  bullets="<p>✓ <strong>Masque LED visage &amp; cou</strong> dans tous les coffrets<br>✓ Au choix : <strong>lunettes regard</strong> (micro-massage + lumière rouge)<br>✓ ou <strong>stylo visage haute fréquence</strong> (4 embouts en verre)<br>✓ <strong>Moins cher</strong> qu'achetés séparément<br>✓ Idée cadeau pour une personne qui aime prendre soin d'elle<br>✓ Peut arriver en <strong>2 colis</strong>, chacun avec son suivi</p>",
  ben_title="Votre rituel, <em>à votre façon</em>", ben_lead="Le masque LED, plus le complément qui vous ressemble.",
  bens=[('sparkle','Masque LED inclus','Visage et cou, dans tous les coffrets.'),
        ('eye','Ou les lunettes','Massage EMS et lumière rouge, contour des yeux.'),
        ('wand','Ou le stylo','Haute fréquence, 4 embouts en verre.'),
        ('gift','L\'idée cadeau','Un coffret bien-être à offrir… ou à s\'offrir.'),
        ('heart','Moins cher','Le coffret coûte moins cher que les deux produits achetés séparément.'),
        ('clock','10 minutes le soir','Le masque, puis le second appareil.')],
  steps=[('Choisissez','Lunettes ou stylo, avec le masque.'),
         ('Le masque LED','Sur une peau propre et sèche, 10 à 15 minutes, les yeux fermés.'),
         ('Votre complément','Les lunettes 10 minutes, ou le stylo quelques minutes, puis votre soin habituel.')],
  steps_note="À utiliser 3 à 5 fois par semaine, idéalement le soir.",
  specs=[('Dans tous les coffrets','Masque LED visage & cou'),('Complément au choix','Lunettes regard ou stylo visage'),('Masque','120 × 3 LED, 7 couleurs, sans fil'),
         ('Lunettes','Micro-massage + lumière rouge, 4 modes'),('Stylo','4 embouts en verre, prise européenne'),('Livraison','Suivie, 5 à 10 jours ouvrés, 1 ou 2 colis'),('Garanties','Satisfaite ou remboursée 30 jours · Garantie légale 2 ans')],
  reassure="<p>🚚 Livraison suivie · ↩️ Satisfaite ou remboursée 30 jours<br>🔒 Paiement sécurisé · ✅ Garantie légale 2 ans</p>",
  inclus=True,
  infos=[('box','Dans le coffret',"<p><strong>Toujours inclus :</strong> le masque LED visage &amp; cou (masque, pièce cou, sangle, câble USB-C, notice, boîte).<br><strong>Au choix :</strong> les lunettes LED regard (avec câble USB-C et notice) ou le stylo visage haute fréquence (4 embouts en verre, prise européenne, notice).</p>"),
         ('price_tag','Prix du coffret',"<p>Masque + lunettes regard : 109,90 €<br>Masque + stylo visage : 104,90 €<br>Moins cher que les deux produits achetés séparément.</p>"),
         ('check_box','Précautions',"<p>Masque : gardez les yeux fermés. Ne pas utiliser en cas de pacemaker ou d'implant électronique, de grossesse, d'épilepsie, de photosensibilité, de problème oculaire ou de peau lésée. Stylo : jamais près des yeux ni après un produit contenant de l'alcool. En cas de doute, demandez l'avis d'un médecin. Appareils de bien-être, non médicaux.</p>"),
         ('truck','Livraison et retours',"<p>Le coffret peut arriver en 2 colis, chacun avec son numéro de suivi, en général sous 5 à 10 jours ouvrés. Satisfaite ou remboursée 30 jours. Garantie légale de conformité de 2 ans.</p>")],
  precautions="<p>Gardez les yeux fermés pendant l'utilisation du masque. Ne pas utiliser en cas de pacemaker ou d'implant électronique, de grossesse, d'épilepsie, de photosensibilité, de problème oculaire ou de peau lésée. Stylo : ne pas utiliser près des yeux ni après un produit contenant de l'alcool. Demandez l'avis d'un médecin en cas de doute et lisez les notices avant la première utilisation. Tenir hors de portée des enfants. Appareils de bien-être à usage cosmétique, non médicaux.</p>"),
}

for name, c in PAGES.items():
    t = copy.deepcopy(base)
    blocks = t['sections']['main']['blocks']['product-details']['blocks']
    blocks['pitch']['settings']['text'] = c['pitch']
    blocks['bullets']['settings']['text'] = c['bullets']
    blocks['reassure']['settings']['text'] = "<p>Livraison suivie en 5 à 10 jours ouvrés<br>30 jours pour changer d'avis · Paiement sécurisé</p>"
    blocks.pop('eyebrow', None)
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
    # Étoiles d'avis réels sous le titre, logos de paiement sous le bouton d'achat.
    order = t['sections']['main']['blocks']['product-details']['block_order']
    blocks['etoiles'] = {'type': 'velea-etoiles', 'settings': {}}
    if 'etoiles' not in order: order.insert(order.index('title') + 1, 'etoiles')
    blocks['paiement'] = {'type': 'velea-paiement', 'settings': {}}
    if 'paiement' not in order: order.insert(order.index('buy_buttons') + 1, 'paiement')
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
        'ben_eyebrow': '', 'ben_title': 'Points forts', 'ben_lead': '',
        'steps_eyebrow': '', 'steps_title': 'Utilisation', 'steps_note': c['steps_note'],
        'specs_eyebrow': '', 'specs_title': 'Caractéristiques', 'precautions': c['precautions']}}
    for k in ('rt_pdp_ben', 'rt_steps', 'rt_pdp_specs', 'rt_faq', 'rt_shop', 'rt_marquee'):
        t['sections'].pop(k, None)
    # v29 : en bas de page, « Découvrez aussi » (les autres produits VELEA, demande du propriétaire).
    t['sections']['rt_others'] = {'type': 'rt-others', 'settings': {}}
    t['order'] = ['main', 'rt_info', 'rt_trust', 'rt_others']
    open(os.path.join(here, 'product.%s.json' % name), 'w').write(json.dumps(t, ensure_ascii=False, separators=(',', ':')))
    print(name, 'ok')
