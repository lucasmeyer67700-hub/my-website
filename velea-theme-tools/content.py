# Textes et templates JSON du thème VELEA.
import json, os, sys

OUT = sys.argv[1]
HANDLE = "ceinture-chauffante-regles"
HEADER = "/*\n * VELEA : modèle généré. Modifiable depuis l'éditeur de thème.\n */\n"


def blocks(kind, items):
    b, order = {}, []
    for i, s in enumerate(items, 1):
        k = f"{kind}_{i}"
        b[k] = {"type": kind, "settings": s}
        order.append(k)
    return b, order


def section(type_, settings, kind=None, items=None):
    s = {"type": type_, "settings": settings}
    if kind:
        s["blocks"], s["block_order"] = blocks(kind, items)
    return s


def write(name, sections, order, extra=None):
    d = {"sections": sections, "order": order}
    if extra:
        d.update(extra)
    p = os.path.join(OUT, name)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w") as f:
        f.write(HEADER + json.dumps(d, indent=2, ensure_ascii=False) + "\n")


# ---------------------------------------------------------------- Contenus partagés
TRUST = section("vl-trust", {"color_scheme": "scheme-2", "padding_top": 28, "padding_bottom": 28}, "item", [
    {"icon": "truck", "title": "Livraison offerte", "text": "En France métropolitaine, avec suivi"},
    {"icon": "return", "title": "30 jours pour l'essayer", "text": "Satisfaite ou remboursée"},
    {"icon": "lock", "title": "Paiement sécurisé", "text": "Carte bancaire et paiement express"},
    {"icon": "chat", "title": "Une vraie équipe", "text": "Réponse sous 24 h ouvrées"},
])

PROBLEM = section("vl-problem", {
    "eyebrow": "On vous comprend",
    "title": "Chaque mois, la même histoire ?",
    "text": "<p>Les crampes qui vous plient en deux, la bouillotte qui refroidit trop vite, la journée qu'il faut tenir quand même… Vous méritez mieux que « ça va passer ».</p>",
    "before_label": "Sans VELEA",
    "before_lines": "Des crampes qui vous coupent dans votre journée\nUne bouillotte froide au bout de 20 minutes\nImpossible de bouger avec la bouillotte sur le ventre\nLe bas du dos tendu, du matin au soir",
    "after_label": "Avec VELEA",
    "after_lines": "Une chaleur douce et régulière, que vous réglez vous-même\nUn massage léger qui aide le ventre à se détendre\nSans fil : vous la gardez en bougeant, même sous un pull\nUn vrai moment pour vous, 2 à 3 fois par jour",
    "color_scheme": "scheme-1", "padding_top": 80, "padding_bottom": 80,
})

BENEFITS_ITEMS = [
    {"icon": "heat", "title": "Chaleur douce réglable", "text": "<p>3 niveaux pour trouver la chaleur qui vous fait du bien. La chaleur aide les muscles du ventre à se relâcher : le réflexe bouillotte, en bien plus pratique.</p>"},
    {"icon": "massage", "title": "Massage apaisant", "text": "<p>3 modes de vibration qui massent doucement le bas du ventre ou le bas du dos, seuls ou avec la chaleur.</p>"},
    {"icon": "battery", "title": "Sans fil, rechargeable", "text": "<p>Une recharge en USB-C, puis vous la portez partout : canapé, bureau, transports, cours.</p>"},
    {"icon": "feather", "title": "Discrète et légère", "text": "<p>Fine et souple, elle se glisse sous un pull ou une chemise. Personne n'a besoin de savoir.</p>"},
    {"icon": "power", "title": "Arrêt automatique", "text": "<p>Elle s'éteint toute seule au bout d'un moment : vous pouvez vous détendre sans surveiller l'heure.</p>"},
    {"icon": "body", "title": "Ventre ou bas du dos", "text": "<p>Tournez la ceinture : la chaleur se place exactement là où ça tire le plus.</p>"},
]


def benefits(visual):
    return section("vl-benefits", {
        "anchor": "bienfaits", "eyebrow": "Ses atouts", "title": "Pensée pour ces jours-là",
        "text": "<p>Une ceinture, deux gestes qui font du bien : la chaleur et le massage. Rien de compliqué.</p>",
        "show_visual": visual, "color_scheme": "scheme-2", "padding_top": 80, "padding_bottom": 80,
    }, "benefit", BENEFITS_ITEMS)


HOW = section("vl-how", {
    "anchor": "utilisation", "eyebrow": "Mode d'emploi", "title": "Votre rituel douceur en 4 étapes",
    "text": "<p>Aussi simple qu'une bouillotte. En mieux.</p>",
    "ritual_title": "Le rituel conseillé",
    "stat_1_value": "30 min à 1 h", "stat_1_label": "par séance",
    "stat_2_value": "2 à 3 fois", "stat_2_label": "par jour",
    "stat_3_value": "Dès les premiers signes", "stat_3_label": "et pendant vos règles",
    "ritual_note": "Écoutez votre corps : si la chaleur devient inconfortable, baissez le niveau ou retirez la ceinture. Ne vous endormez pas avec la ceinture allumée.",
    "color_scheme": "scheme-1", "padding_top": 80, "padding_bottom": 80,
}, "step", [
    {"icon": "cable", "title": "Rechargez", "text": "<p>Branchez la ceinture avec le câble USB-C fourni, sur n'importe quel chargeur USB.</p>"},
    {"icon": "body", "title": "Attachez-la", "text": "<p>Placez le boîtier sur le bas du ventre (ou le bas du dos) et ajustez la sangle, par-dessus un vêtement fin.</p>"},
    {"icon": "heat", "title": "Réglez", "text": "<p>Allumez, choisissez votre chaleur et votre massage. Commencez doucement, montez si besoin.</p>"},
    {"icon": "clock", "title": "Laissez agir", "text": "<p>Gardez-la 30 minutes à 1 heure, faites une pause, et recommencez 2 à 3 fois dans la journée.</p>"},
])

VERSUS = section("vl-versus", {
    "eyebrow": "Comparatif", "title": "Pourquoi pas une simple bouillotte ?",
    "text": "<p>On l'aime bien, la bouillotte. Mais elle refroidit, elle vous cloue au canapé et elle ne masse pas.</p>",
    "col_1": "Ceinture VELEA", "col_2": "Bouillotte", "col_3": "Patch jetable",
    "color_scheme": "scheme-1", "padding_top": 80, "padding_bottom": 80,
}, "row", [
    {"label": "Chaleur réglable", "value_1": "oui", "value_2": "non", "value_3": "non"},
    {"label": "Massage par vibration", "value_1": "oui", "value_2": "non", "value_3": "non"},
    {"label": "On peut bouger avec", "value_1": "oui", "value_2": "non", "value_3": "oui"},
    {"label": "Discrète sous les vêtements", "value_1": "oui", "value_2": "non", "value_3": "oui"},
    {"label": "Réutilisable des centaines de fois", "value_1": "oui", "value_2": "oui", "value_3": "non"},
    {"label": "Pas d'eau bouillante à manipuler", "value_1": "oui", "value_2": "non", "value_3": "oui"},
])

REVIEWS = section("vl-reviews", {
    "anchor": "avis", "eyebrow": "Elles l'ont adoptée", "title": "Ce qu'elles en disent",
    "source_note": "", "color_scheme": "scheme-2", "padding_top": 80, "padding_bottom": 80,
})

GUARANTEE = section("vl-guarantee", {
    "seal_number": "30", "seal_unit": "jours",
    "seal_ring": "SATISFAITE OU REMBOURSÉE · SATISFAITE OU REMBOURSÉE · ",
    "eyebrow": "Notre promesse", "title": "30 jours pour l'adopter",
    "text": "<p>Essayez la ceinture pendant vos prochaines règles. Si elle ne vous convient pas, écrivez-nous dans les 30 jours qui suivent la réception : on organise le retour et on vous rembourse.</p>",
    "button_label": "Lire nos conditions", "button_link": "shopify://pages/livraison-et-retours",
    "color_scheme": "scheme-5", "padding_top": 72, "padding_bottom": 72,
})

FAQ_ITEMS = [
    {"question": "Combien de temps dois-je la porter ?",
     "answer": "<p>Comptez <strong>30 minutes à 1 heure par séance</strong>, <strong>2 à 3 fois par jour</strong> pendant vos règles. Faites une pause entre deux séances pour laisser votre peau respirer.</p>"},
    {"question": "Est-ce que ça marche vraiment ?",
     "answer": "<p>La chaleur est l'un des gestes les plus utilisés pour apaiser les crampes de règles : elle aide les muscles du ventre à se détendre. Le massage par vibration complète cette sensation de relâchement. Chaque corps est différent : c'est pour ça que vous avez 30 jours pour l'essayer.</p>"},
    {"question": "Puis-je la porter sous mes vêtements ?",
     "answer": "<p>Oui. Elle est fine et sans fil : elle se glisse sous un pull, une chemise ou un sweat. Pour votre confort, portez-la par-dessus un vêtement fin plutôt que directement sur la peau.</p>"},
    {"question": "Est-ce que ça chauffe trop ?",
     "answer": "<p>Vous choisissez parmi 3 niveaux, et la ceinture s'éteint automatiquement. Commencez par le niveau le plus doux, surtout si vous avez la peau sensible, et ne vous endormez pas avec la ceinture allumée.</p>"},
    {"question": "Peut-on l'utiliser sur le bas du dos ?",
     "answer": "<p>Oui : il suffit de tourner la ceinture pour placer le boîtier dans le bas du dos, là où les douleurs de règles se font souvent sentir aussi.</p>"},
    {"question": "Y a-t-il des contre-indications ?",
     "answer": "<p>Demandez l'avis d'un professionnel de santé avant utilisation si vous êtes enceinte, si vous portez un dispositif médical implanté (pacemaker…), si vous avez des troubles de la sensibilité ou de la circulation (diabète par exemple) ou une peau abîmée à cet endroit.</p><p>Si vos douleurs sont très intenses ou inhabituelles, consultez : cela peut être le signe d'une endométriose. La ceinture VELEA est un accessoire de bien-être, elle ne remplace pas un avis médical.</p>"},
    {"question": "Comment la recharger ?",
     "answer": "<p>Avec le câble USB-C fourni, sur n'importe quel chargeur USB (téléphone, ordinateur). Une charge complète vous accompagne sur plusieurs séances.</p>"},
    {"question": "Quels sont les délais de livraison ?",
     "answer": "<p>La livraison est <strong>offerte</strong> en France métropolitaine. Chaque commande part avec un numéro de suivi et arrive en <strong>7 à 14 jours ouvrés</strong>.</p>"},
    {"question": "Et si elle ne me convient pas ?",
     "answer": "<p>Vous avez <strong>30 jours</strong> après réception pour changer d'avis. Écrivez-nous : on vous indique comment la renvoyer et on vous rembourse dès réception du retour.</p>"},
]


def faq(schema=True, anchor="faq"):
    return section("vl-faq", {
        "anchor": anchor, "eyebrow": "Vos questions", "title": "Questions fréquentes",
        "open_first": True, "schema_markup": schema,
        "contact_text": "Une autre question ?", "contact_label": "Écrivez-nous", "contact_link": "shopify://pages/contact",
        "color_scheme": "scheme-1", "padding_top": 80, "padding_bottom": 80,
    }, "question", FAQ_ITEMS)


CTA = section("vl-cta", {
    "product": HANDLE,
    "title": "Ce mois-ci, prenez soin de vous",
    "text": "<p>Une chaleur douce, un massage léger, et vos règles se passent un peu plus doucement.</p>",
    "button_label": "Je veux ma ceinture", "show_price": True,
    "reassurance": "Livraison offerte · 30 jours satisfaite ou remboursée",
    "color_scheme": "scheme-4", "padding_top": 64, "padding_bottom": 64,
})

# ---------------------------------------------------------------- Accueil
HERO = section("vl-hero", {
    "product": HANDLE,
    "eyebrow": "Spécial douleurs de règles",
    "title": "Apaisez vos douleurs de règles,",
    "title_accent": "en douceur.",
    "text": "<p>La ceinture chauffante VELEA diffuse une chaleur douce et un léger massage sur le bas du ventre. Sans fil et discrète, vous la portez à la maison comme au bureau.</p>",
    "button_label": "Je veux ma ceinture", "show_price": True,
    "reassurance": "Livraison offerte · Paiement sécurisé · 30 jours satisfaite ou remboursée",
    "badge_1": "Chaleur douce + massage", "badge_2": "30 min à 1 h",
    "color_scheme": "scheme-1", "padding_top": 48, "padding_bottom": 64,
}, "point", [
    {"text": "Chaleur réglable sur 3 niveaux"},
    {"text": "Massage par vibration pour détendre le ventre et le dos"},
    {"text": "Sans fil et rechargeable : vous bougez librement"},
])

write("templates/index.json",
      {"hero": HERO, "trust": TRUST, "problem": PROBLEM, "benefits": benefits(True), "how": HOW,
       "versus": VERSUS, "reviews": REVIEWS, "guarantee": GUARANTEE, "faq": faq(), "cta": CTA},
      ["hero", "trust", "problem", "benefits", "how", "versus", "reviews", "guarantee", "faq", "cta"])

# ---------------------------------------------------------------- Fiche produit
BUY = section("vl-buybox", {
    "eyebrow": "Spécial douleurs de règles",
    "subtitle": "Chaleur douce + massage, sans fil. À porter 30 min à 1 h, 2 à 3 fois par jour.",
    "media_badge": "",
    "points": "Chaleur douce réglable sur 3 niveaux\nMassage par vibration, 3 modes\nSans fil, rechargeable en USB-C\nDiscrète sous les vêtements, sur le ventre ou le dos",
    "offers_title": "Choisissez votre offre",
    "offers_note": "La remise duo s'applique automatiquement dans le panier.",
    "button_label": "Ajouter au panier", "show_dynamic_checkout": True,
    "show_delivery": True, "delivery_min": 7, "delivery_max": 14,
    "trust_1": "30 jours satisfaite ou remboursée", "trust_2": "Paiement 100 % sécurisé", "trust_3": "Réponse sous 24 h",
    "show_description": True, "description_title": "Description",
    "color_scheme": "scheme-1", "padding_top": 32, "padding_bottom": 64,
})
bb_offer, bb_offer_order = blocks("offer", [
    {"quantity": 1, "title": "1 ceinture", "subtitle": "Pour vous", "badge": "", "discount": 0, "selected": True},
    {"quantity": 2, "title": "2 ceintures", "subtitle": "Une à la maison, une au bureau, ou à partager", "badge": "Meilleure offre", "discount": 10, "selected": False},
])
bb_tab, bb_tab_order = blocks("tab", [
    {"icon": "clock", "title": "Comment l'utiliser",
     "content": "<ul><li>Placez le boîtier sur le bas du ventre (ou le bas du dos), par-dessus un vêtement fin.</li><li>Choisissez votre chaleur et votre massage, en commençant par le niveau le plus doux.</li><li>Gardez-la <strong>30 minutes à 1 heure</strong>, puis faites une pause.</li><li>Renouvelez <strong>2 à 3 fois par jour</strong> pendant vos règles.</li></ul>"},
    {"icon": "battery", "title": "Caractéristiques",
     "content": "<ul><li>Chaleur : 3 niveaux</li><li>Massage : 3 modes de vibration</li><li>Batterie rechargeable, câble USB-C fourni</li><li>Arrêt automatique de sécurité</li><li>Sangle réglable, tissu doux</li><li>Dans la boîte : 1 ceinture, 1 câble de charge, 1 notice</li></ul>"},
    {"icon": "shield", "title": "Précautions d'emploi",
     "content": "<p>Ne vous endormez pas avec la ceinture allumée et ne la placez pas sur une peau abîmée. Demandez l'avis d'un professionnel de santé si vous êtes enceinte, si vous portez un dispositif médical implanté ou si vous avez des troubles de la sensibilité. Si vos douleurs sont très intenses ou inhabituelles, consultez.</p><p>Accessoire de bien-être, ne remplace pas un avis médical.</p>"},
    {"icon": "truck", "title": "Livraison et retours",
     "content": "<p>Livraison offerte en France métropolitaine, avec numéro de suivi, en 7 à 14 jours ouvrés.</p><p>30 jours après réception pour changer d'avis : écrivez-nous, on organise le retour et le remboursement.</p>"},
])
BUY["blocks"] = {**bb_offer, **bb_tab}
BUY["block_order"] = bb_offer_order + bb_tab_order

SPECS = section("vl-specs", {
    "anchor": "caracteristiques", "eyebrow": "Dans le détail", "title": "Caractéristiques",
    "text": "<p>Tout ce qu'il faut savoir avant de l'adopter.</p>",
    "color_scheme": "scheme-2", "padding_top": 80, "padding_bottom": 80,
}, "row", [
    {"label": "Chaleur", "value": "3 niveaux"},
    {"label": "Massage", "value": "3 modes de vibration"},
    {"label": "Alimentation", "value": "Batterie rechargeable, USB-C"},
    {"label": "Sécurité", "value": "Arrêt automatique"},
    {"label": "Sangle", "value": "Réglable, tissu doux"},
    {"label": "Utilisation conseillée", "value": "30 min à 1 h, 2 à 3 fois par jour"},
    {"label": "Dans la boîte", "value": "Ceinture, câble USB-C, notice"},
])

STICKY = section("vl-sticky-atc", {"button_label": "Choisir mon offre", "color_scheme": "scheme-6"})

write("templates/product.json",
      {"main": BUY, "trust": TRUST, "problem": PROBLEM, "benefits": benefits(False), "how": HOW,
       "specs": SPECS, "versus": VERSUS, "reviews": REVIEWS, "guarantee": GUARANTEE, "faq": faq(),
       "sticky": STICKY},
      ["main", "trust", "problem", "benefits", "how", "specs", "versus", "reviews", "guarantee", "faq", "sticky"])

# ---------------------------------------------------------------- Page FAQ
write("templates/page.faq.json",
      {"main": {"type": "main-page", "settings": {"padding_top": 40, "padding_bottom": 0}},
       "faq": faq(anchor="questions"), "cta": CTA},
      ["main", "faq", "cta"])

# ---------------------------------------------------------------- Groupes en-tête / pied de page
announce = section("vl-announce", {"interval": 4, "color_scheme": "scheme-5"}, "message", [
    {"text": "Livraison offerte en France métropolitaine", "icon": "truck"},
    {"text": "30 jours satisfaite ou remboursée", "icon": "return", "link": "shopify://pages/livraison-et-retours"},
    {"text": "−10 € sur le duo : une pour vous, une à partager", "icon": "gift", "link": f"shopify://products/{HANDLE}"},
])
header = {"type": "header", "settings": {
    "color_scheme": "scheme-3", "menu_color_scheme": "scheme-3", "logo_position": "middle-left",
    "menu": "main-menu", "menu_type_desktop": "dropdown", "sticky_header_type": "on-scroll-up",
    "show_line_separator": False, "enable_country_selector": False, "enable_language_selector": False,
    "mobile_logo_position": "center", "margin_bottom": 0, "padding_top": 12, "padding_bottom": 12}}
with open(os.path.join(OUT, "sections/header-group.json"), "w") as f:
    f.write(HEADER + json.dumps({"name": "t:sections.header.name", "type": "header",
                                 "sections": {"announce": announce, "header": header},
                                 "order": ["announce", "header"]}, indent=2, ensure_ascii=False) + "\n")

footer = {"type": "footer", "settings": {
    "color_scheme": "scheme-2", "newsletter_enable": True,
    "newsletter_heading": "Conseils bien-être et offres en avant-première",
    "enable_follow_on_shop": False, "show_social": True, "enable_country_selector": False,
    "enable_language_selector": False, "payment_enable": True, "show_policy": True,
    "margin_top": 0, "padding_top": 56, "padding_bottom": 36}}
footer["blocks"], footer["block_order"] = {}, []
for k, t, s in [
    ("brand", "text", {"heading": "VELEA", "subtext": "<p>La ceinture chauffante et massante qui accompagne vos règles. Pensée par des femmes, pour les jours où l'on a besoin d'un peu de douceur.</p>"}),
    ("shop", "link_list", {"heading": "La boutique", "menu": "main-menu"}),
    ("help", "link_list", {"heading": "Aide et informations", "menu": "footer"}),
]:
    footer["blocks"][k] = {"type": t, "settings": s}
    footer["block_order"].append(k)
with open(os.path.join(OUT, "sections/footer-group.json"), "w") as f:
    f.write(HEADER + json.dumps({"name": "t:sections.footer.name", "type": "footer",
                                 "sections": {"footer": footer}, "order": ["footer"]}, indent=2, ensure_ascii=False) + "\n")
print("ok")
