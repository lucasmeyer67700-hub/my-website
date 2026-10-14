# Contenus et réglages du thème VELEA Maison.
# Usage : python3 content.py ../velea-maison
import json, os, sys

OUT = sys.argv[1]
HANDLE = "ceinture-chauffante-regles"
HEAD = "/*\n * VELEA Maison : contenu généré, modifiable dans l'éditeur de thème.\n */\n"
IMG_HERO = "shopify://shop_images/velea-hero-cocon.webp"
IMG_DETAIL = "shopify://shop_images/velea-ceinture-detail.png"
IMG_PACK = "shopify://shop_images/velea-ceinture-clean.png"


def blocks(kind, items):
    out, order = {}, []
    for i, s in enumerate(items, 1):
        key = f"{kind}_{i}"
        out[key] = {"type": kind, "settings": s}
        order.append(key)
    return out, order


def sec(type_, settings, kind=None, items=None):
    s = {"type": type_, "settings": settings}
    if kind:
        s["blocks"], s["block_order"] = blocks(kind, items)
    return s


def write(path, data):
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(HEAD + json.dumps(data, indent=2, ensure_ascii=False) + "\n")


# ------------------------------------------------------------------ Sections partagées
THERMAL = sec("vx-thermal", {
    "title": "Trois chaleurs, au choix",
    "text": "Vous réglez la température d'un geste, selon l'intensité de vos crampes ce jour-là.",
    "note": "Prête en 5 secondes. La ceinture s'éteint seule au bout de 30 minutes.",
    "color_scheme": "scheme-1", "padding_top": 112, "padding_bottom": 112,
}, "level", [
    {"degrees": "50", "name": "Douce", "text": "Pour les premiers tiraillements, ou si votre peau est sensible."},
    {"degrees": "55", "name": "Enveloppante", "text": "Une chaleur plus présente, qui reste confortable sur la durée."},
    {"degrees": "60", "name": "Profonde", "text": "Pour les jours où les crampes sont les plus fortes."},
])

BUY_SETTINGS = {
    "subtitle": "Chaleur et massage sur le bas du ventre ou le dos. Sans fil, rechargeable, discrète sous vos vêtements.",
    "points": "3 températures : 50, 55 ou 60 °C\n4 modes de massage, avec ou sans chaleur\nBatterie 1800 mAh, environ 2 h d'utilisation\nArrêt automatique au bout de 30 minutes",
    "offers_title": "Votre commande",
    "offers_note": "La remise de 10 € sur le duo s'applique automatiquement au panier.",
    "button_label": "Ajouter au panier", "show_dynamic_checkout": True,
    "show_delivery": True, "delivery_min": 7, "delivery_max": 14,
    "assure_1": "30 jours pour changer d'avis", "assure_2": "Paiement sécurisé", "assure_3": "Une réponse sous 24 h ouvrées",
    "show_description": True, "description_title": "Description",
    "color_scheme": "scheme-1", "padding_top": 40, "padding_bottom": 112,
}
OFFERS = [
    {"quantity": 1, "title": "1 ceinture", "subtitle": "Pour vous", "badge": "", "discount": 0, "selected": True},
    {"quantity": 2, "title": "2 ceintures", "subtitle": "Une chez vous, une au bureau, ou une à offrir", "badge": "−10 €", "discount": 10, "selected": False},
]
TABS = [
    {"title": "Comment l'utiliser",
     "content": "<ul><li>Placez le boîtier sur le bas du ventre ou le bas du dos, par-dessus un vêtement fin.</li><li>Choisissez 50, 55 ou 60 °C, puis un massage si vous le souhaitez. Commencez par 50 °C.</li><li>Une séance dure 30 minutes : la ceinture s'éteint seule.</li><li>Relancez une séance si besoin, jusqu'à 1 heure, 2 à 3 fois par jour pendant vos règles.</li></ul>"},
    {"title": "Précautions d'emploi",
     "content": "<p>N'utilisez pas la ceinture si vous êtes enceinte, si vous avez une maladie cardiaque, un dispositif médical implanté, une plaie ou une irritation de la peau à cet endroit. Ne vous endormez pas avec la ceinture allumée.</p><p>Accessoire de bien-être : il ne remplace pas un avis médical. Si vos douleurs sont très fortes ou inhabituelles, consultez un professionnel de santé.</p>"},
    {"title": "Livraison et retours",
     "content": "<p>Livraison offerte en France métropolitaine, avec numéro de suivi, en 7 à 14 jours ouvrés.</p><p>Vous avez 30 jours après réception pour changer d'avis : écrivez-nous, nous organisons le retour et le remboursement.</p>"},
]


def buy(on_product):
    s = dict(BUY_SETTINGS)
    if not on_product:
        s["product"] = HANDLE
        s["padding_top"] = 112
    b1, o1 = blocks("offer", OFFERS)
    b2, o2 = blocks("tab", TABS)
    return {"type": "vx-buy", "settings": s, "blocks": {**b1, **b2}, "block_order": o1 + o2}


MOMENTS = sec("vx-moments", {
    "image": IMG_DETAIL,
    "title": "Une séance, du début à la fin",
    "text": "Une séance dure 30 minutes. Si la douleur revient, relancez-en une : jusqu'à 1 heure, 2 à 3 fois par jour.",
    "note": "Accessoire de bien-être. Si vos douleurs sont très fortes ou inhabituelles, parlez-en à un professionnel de santé.",
    "color_scheme": "scheme-2", "padding_top": 112, "padding_bottom": 112,
}, "step", [
    {"time": "0 s", "title": "Vous l'attachez", "text": "Le boîtier sur le bas du ventre ou du dos, par-dessus un vêtement fin."},
    {"time": "5 s", "title": "La chaleur arrive", "text": "Vous choisissez 50, 55 ou 60 °C, et un massage si vous en avez envie."},
    {"time": "30 min", "title": "Elle s'éteint seule", "text": "Inutile de surveiller l'heure. Vous relancez une séance si besoin."},
])

COMPARE = sec("vx-compare", {
    "title": "Et la bouillotte, alors ?",
    "text": "Elle a ses qualités. Mais elle refroidit, elle ne masse pas, et il faut rester allongée pour la garder en place.",
    "col_1": "VELEA", "col_2": "Bouillotte", "col_3": "Patch jetable",
    "color_scheme": "scheme-1", "padding_top": 112, "padding_bottom": 112,
}, "row", [
    {"label": "Chaleur réglable", "value_1": "oui", "value_2": "non", "value_3": "non"},
    {"label": "Massage", "value_1": "oui", "value_2": "non", "value_3": "non"},
    {"label": "Se porte en bougeant", "value_1": "oui", "value_2": "non", "value_3": "oui"},
    {"label": "Discrète sous un vêtement", "value_1": "oui", "value_2": "non", "value_3": "oui"},
    {"label": "Réutilisable", "value_1": "oui", "value_2": "oui", "value_3": "non"},
    {"label": "Sans eau bouillante", "value_1": "oui", "value_2": "non", "value_3": "oui"},
])

DETAILS = sec("vx-details", {
    "image": IMG_PACK,
    "title": "Dans le détail",
    "text": "Tout ce qu'il faut savoir avant de l'adopter.",
    "color_scheme": "scheme-3", "padding_top": 112, "padding_bottom": 112,
}, "row", [
    {"label": "Températures", "value": "50, 55 ou 60 °C"},
    {"label": "Mise en chauffe", "value": "Environ 5 secondes"},
    {"label": "Massage", "value": "4 modes de vibration"},
    {"label": "Batterie", "value": "1800 mAh, environ 2 h"},
    {"label": "Recharge", "value": "Par câble USB"},
    {"label": "Sécurité", "value": "Arrêt automatique après 30 min"},
    {"label": "Poids", "value": "142 g"},
    {"label": "Zones", "value": "Ventre ou bas du dos"},
])

REVIEWS = sec("vx-reviews", {"title": "Elles l'ont adoptée", "source": "", "color_scheme": "scheme-2", "padding_top": 112, "padding_bottom": 112})

PROMISE = sec("vx-promise", {"title": "", "color_scheme": "scheme-2", "padding_top": 96, "padding_bottom": 96}, "item", [
    {"icon": "truck", "title": "Livraison offerte", "text": "Partout en France métropolitaine, avec suivi, en 7 à 14 jours ouvrés.", "link_label": "Livraison et retours", "link": "shopify://pages/livraison-et-retours"},
    {"icon": "return", "title": "30 jours pour l'adopter", "text": "Si la ceinture ne vous convient pas, renvoyez-la dans les 30 jours. Nous vous remboursons.", "link_label": "Nos conditions", "link": "shopify://pages/politique-de-retour"},
    {"icon": "chat", "title": "Une équipe qui répond", "text": "Une question avant ou après l'achat ? Nous répondons sous 24 h ouvrées.", "link_label": "Nous écrire", "link": "shopify://pages/contact"},
])

FAQ_ITEMS = [
    {"question": "Combien de temps dois-je la porter ?",
     "answer": "<p>Une séance dure <strong>30 minutes</strong>, puis la ceinture s'éteint seule. Si la douleur revient, relancez une séance : jusqu'à <strong>1 heure</strong>, <strong>2 à 3 fois par jour</strong> pendant vos règles.</p>"},
    {"question": "Est-ce que ça marche vraiment ?",
     "answer": "<p>La chaleur est l'un des gestes les plus utilisés pour apaiser les crampes de règles : elle aide les muscles du ventre à se détendre. Le massage complète cette sensation de relâchement. Chaque corps réagit différemment, c'est pourquoi vous avez 30 jours pour l'essayer.</p>"},
    {"question": "Quelle température choisir ?",
     "answer": "<p>Commencez par 50 °C, surtout si votre peau est sensible. Passez à 55 ou 60 °C si vous avez besoin d'une chaleur plus présente. Portez toujours la ceinture par-dessus un vêtement fin.</p>"},
    {"question": "Peut-on la porter sous ses vêtements ?",
     "answer": "<p>Oui. Sans fil et légère (142 g), elle se glisse sous un pull, une chemise ou un sweat, à la maison comme au bureau.</p>"},
    {"question": "Et sur le bas du dos ?",
     "answer": "<p>Oui : tournez la ceinture pour placer le boîtier dans le bas du dos, là où les douleurs de règles se font souvent sentir aussi.</p>"},
    {"question": "Y a-t-il des contre-indications ?",
     "answer": "<p>N'utilisez pas la ceinture si vous êtes enceinte, si vous avez une maladie cardiaque, un dispositif médical implanté, une plaie ou une irritation de la peau à cet endroit. En cas de doute, demandez l'avis d'un professionnel de santé.</p><p>Si vos douleurs sont très fortes ou inhabituelles, consultez : elles peuvent être le signe d'une endométriose.</p>"},
    {"question": "Quels sont les délais de livraison ?",
     "answer": "<p>La livraison est offerte en France métropolitaine. Chaque colis part avec un numéro de suivi et arrive en <strong>7 à 14 jours ouvrés</strong>.</p>"},
    {"question": "Et si elle ne me convient pas ?",
     "answer": "<p>Vous avez <strong>30 jours</strong> après réception pour changer d'avis. Écrivez-nous : nous vous indiquons comment la renvoyer et nous vous remboursons dès réception.</p>"},
]


def faq(schema=True):
    return sec("vx-faq", {
        "title": "Vos questions",
        "text": "Tout ce que l'on nous demande avant d'adopter la ceinture.",
        "contact_label": "Poser une autre question", "contact_link": "shopify://pages/contact",
        "schema_markup": schema, "color_scheme": "scheme-1", "padding_top": 112, "padding_bottom": 112,
    }, "question", FAQ_ITEMS)


CLOSING = sec("vx-closing", {
    "product": HANDLE,
    "title": "Votre prochain cycle peut être plus doux",
    "text": "Une chaleur douce, un massage léger, et trente minutes rien que pour vous.",
    "button_label": "Choisir ma ceinture", "price_note": "avec livraison offerte",
    "color_scheme": "scheme-5", "padding_top": 120, "padding_bottom": 120,
})

# ------------------------------------------------------------------ Accueil
HERO = sec("vx-hero", {
    "image": IMG_HERO, "focal": "42% center", "product": HANDLE,
    "title": "Une chaleur douce pour vos jours de règles",
    "text": "La ceinture VELEA chauffe en 5 secondes et masse doucement le bas du ventre. Sans fil et légère, elle se porte sous vos vêtements, à la maison comme au bureau.",
    "button_label": "Choisir ma ceinture", "price_note": "livraison offerte",
    "color_scheme": "scheme-1", "padding_top": 96, "padding_bottom": 96,
}, "point", [
    {"text": "Livraison offerte en France métropolitaine"},
    {"text": "30 jours pour l'essayer, satisfaite ou remboursée"},
    {"text": "Paiement sécurisé"},
])

write("templates/index.json", {
    "sections": {"hero": HERO, "thermal": THERMAL, "buy": buy(False), "moments": MOMENTS, "compare": COMPARE,
                 "details": DETAILS, "reviews": REVIEWS, "promise": PROMISE, "faq": faq(), "closing": CLOSING},
    "order": ["hero", "thermal", "buy", "moments", "compare", "details", "reviews", "promise", "faq", "closing"],
})

# ------------------------------------------------------------------ Produit
write("templates/product.json", {
    "sections": {"main": buy(True), "thermal": THERMAL, "moments": MOMENTS, "details": DETAILS, "compare": COMPARE,
                 "reviews": REVIEWS, "promise": PROMISE, "faq": faq(), "sticky": sec("vx-sticky", {"button_label": "Choisir mon offre"})},
    "order": ["main", "thermal", "moments", "details", "compare", "reviews", "promise", "faq", "sticky"],
})

# ------------------------------------------------------------------ Page FAQ
write("templates/page.faq.json", {
    "sections": {"main": {"type": "main-page", "settings": {"padding_top": 48, "padding_bottom": 0}}, "faq": faq(), "closing": CLOSING},
    "order": ["main", "faq", "closing"],
})

# ------------------------------------------------------------------ En-tête et pied de page
write("sections/header-group.json", {
    "type": "header", "name": "t:sections.header.name",
    "sections": {
        "announce": sec("vx-announce", {"text": "Livraison offerte en France métropolitaine et 30 jours pour changer d'avis", "link": "shopify://pages/livraison-et-retours", "color_scheme": "scheme-5"}),
        "header": {"type": "header", "settings": {
            "color_scheme": "scheme-1", "menu_color_scheme": "scheme-1", "logo_position": "middle-center",
            "menu": "main-menu", "menu_type_desktop": "dropdown", "sticky_header_type": "on-scroll-up",
            "show_line_separator": False, "enable_country_selector": False, "enable_language_selector": False,
            "mobile_logo_position": "center", "margin_bottom": 0, "padding_top": 16, "padding_bottom": 16}},
    },
    "order": ["announce", "header"],
})

foot_blocks, foot_order = {}, []
for k, t, s in [
    ("brand", "text", {"heading": "VELEA", "subtext": "<p>La ceinture chauffante et massante pensée pour les jours de règles. Une marque française, une équipe qui vous répond.</p>"}),
    ("shop", "link_list", {"heading": "La boutique", "menu": "main-menu"}),
    ("help", "link_list", {"heading": "Aide", "menu": "footer"}),
]:
    foot_blocks[k] = {"type": t, "settings": s}
    foot_order.append(k)
write("sections/footer-group.json", {
    "type": "footer", "name": "t:sections.footer.name",
    "sections": {"footer": {"type": "footer", "blocks": foot_blocks, "block_order": foot_order, "settings": {
        "color_scheme": "scheme-2", "newsletter_enable": True, "newsletter_heading": "Des conseils pour des cycles plus doux",
        "enable_follow_on_shop": False, "show_social": True, "enable_country_selector": False,
        "enable_language_selector": False, "payment_enable": True, "show_policy": True,
        "margin_top": 0, "padding_top": 64, "padding_bottom": 40}}},
    "order": ["footer"],
})
print("ok")

# ------------------------------------------------------------------ Réglages globaux (palette, typographie)
import copy
base = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else None
if base:
    cur = copy.deepcopy(base["presets"]["Dawn"])
    W, P, L = "#3E1A26", "#FBF6F5", "#F3E6E4"

    def scheme(bg, text, btn, label):
        return {"settings": {"background": bg, "background_gradient": "", "text": text, "button": btn,
                             "button_label": label, "secondary_button_label": text, "shadow": W}}
    cur["color_schemes"] = {
        "scheme-1": scheme(P, W, W, P),
        "scheme-2": scheme(L, W, W, P),
        "scheme-3": scheme("#FFFFFF", W, W, P),
        "scheme-4": scheme("#F1D6D8", W, W, P),
        "scheme-5": scheme(W, P, P, W),
    }
    cur.update({
        "type_header_font": "bodoni_moda_n4", "type_body_font": "instrument_sans_n4",
        "heading_scale": 110, "body_scale": 105, "page_width": 1400, "spacing_sections": 0,
        "buttons_radius": 40, "buttons_border_thickness": 1, "buttons_border_opacity": 100,
        "variant_pills_radius": 40, "inputs_radius": 12, "inputs_border_opacity": 30,
        "card_style": "standard", "card_corner_radius": 20, "card_color_scheme": "scheme-1",
        "media_radius": 20, "media_border_opacity": 0, "media_border_thickness": 0,
        "text_boxes_radius": 20, "popup_corner_radius": 20, "badge_corner_radius": 40,
        "sale_badge_color_scheme": "scheme-5", "sold_out_badge_color_scheme": "scheme-4",
        "cart_type": "drawer", "cart_color_scheme": "scheme-1", "show_cart_note": False,
        "animations_reveal_on_scroll": False, "animations_hover_elements": "none",
        "predictive_search_enabled": False, "currency_code_enabled": False,
        "favicon": "shopify://shop_images/velea-maison-favicon.png",
    })
    with open(os.path.join(OUT, "config/settings_data.json"), "w") as f:
        f.write(json.dumps({"current": cur, "presets": base["presets"]}, indent=2, ensure_ascii=False) + "\n")
    print("settings ok")
