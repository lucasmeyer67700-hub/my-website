# Boutique masque LED – suivi du projet

Boutique Shopify : `sd031r-ei.myshopify.com` (nom provisoire « Ma boutique »).
Brief complet : voir la conversation d'origine. Ce dossier contient les textes prêts à coller dans Shopify.

## État au 26/09/2026

| Étape | Statut |
|---|---|
| 1. Échantillons + message fournisseur | Message prêt : `message-fournisseur.md` (à envoyer via la messagerie AliExpress) |
| 2. Archiver les 11 cosmétiques | ✅ Fait (réversible : Produits > Archivés) |
| 3. Nom de marque + domaine | Pistes dans `nom-de-marque.md`, choix à faire |
| 4. Fiche pack masque + lunettes | ✅ Créée en brouillon, 144,90 €, SKU `LED-PACK-MASK-EYES` (gid://shopify/Product/16647453475161) |
| 5. Pages légales | Brouillons dans `pages/` avec des `[À COMPLÉTER]` |
| 6. Thème + photos | Thème « Rituel Éclat – Vert & Blanc » créé (copie de Horizon, NON publié) : palette blanc/vert sauge, page d'accueil en français, collection « Rituel Éclat ». Reste : photos, puis publication par toi |
| 7. Merchant Center + Shopping | À faire (objectif : début octobre) |

## Catalogue actif prévu (3 produits max)

| Produit | Statut Shopify | Prix |
|---|---|---|
| Masque LED Visage & Cou (produit principal, seul en pub) | Brouillon, sans photos | 107,90 € |
| Pack Rituel Éclat (masque + lunettes) | Brouillon, sans photos | 144,90 € |
| Rouleau de Jade et Gua Sha | Brouillon | 34,00 € |

## Points de vigilance relevés

1. **Marge du pack sous la règle des 60 %.** Coût 35,99 + 17,99 = 53,98 €. Règle ×3 → 161,94 €.
   À 144,90 € TTC (120,75 € HT), la marge est de 55 %. Options : accepter (le pack augmente le panier moyen),
   ou monter à ~149,90 € (marge 57 %).
2. **Pas de prix barré « 161,80 € » sur le pack.** Ce prix de référence n'est valable que si les lunettes
   sont réellement vendues seules à 53,90 €. Tant qu'elles ne le sont pas, ne pas afficher de prix barré
   (règle « pas de prix barré fictif »). Le champ « prix avant réduction » est laissé vide.
3. **Fiche masque : « Expédié depuis la France » et « notice en français »** sont écrits dans la description.
   À confirmer par le fournisseur avant publication (sinon retirer).
4. **Rouleau de Jade et Gua Sha** : vérifier que le jade est réel (sinon écrire « pierre » ou « quartz ») et
   que la description ne contient aucune allégation (« drainant », « anti-âge »…).
5. **Coût du gua sha au prix de 34 €** : la règle ×3 impose un coût d'achat ≤ 11,33 €.

## Thème vert & blanc (27/09/2026)

- Thème : « Rituel Éclat – Vert & Blanc » (gid://shopify/OnlineStoreTheme/207338176857), non publié.
- Aperçu : https://sd031r-ei.myshopify.com/?preview_theme_id=207338176857
- Couleurs : fond #ffffff, texte et boutons vert profond #1f3a2e, texte secondaire #4a6b5a,
  bordures #d6e6da, bandeaux vert pâle #e8f2eb et #f3f8f4.
- Page d'accueil : bandeau d'accroche → collection « Rituel Éclat » (3 produits) → bandeau réassurance.
- Le thème actuel « Horizon » n'a pas été modifié.

## Nouveau haut de page (27/09/2026)

- Thème brouillon « ✅ Rituel Éclat – NOUVEAU haut de page (à publier) » (gid://shopify/OnlineStoreTheme/207338176857).
- Bandeau d'annonce vert pâle, avec 2 messages : « Livraison suivie en France · Retours sous 14 jours » / « Idée cadeau de Noël ».
- Bannière sur mesure (section « Liquid personnalisé », code dans `theme-hero.liquid`) : titre, 2 boutons (masque / pack),
  4 points forts ; visuel = photo principale du masque dès qu'il est actif avec une photo, sinon illustration vert/blanc.
- Menu principal : Accueil · Le Rituel Éclat · Contact.
- Rappel : Claude ne peut pas modifier le thème publié → toujours travailler sur un brouillon, puis publier à la main.

## Boutique complète – univers rose (27/09/2026)

- Thème brouillon « 💗 ROSE – boutique complète (à publier) » (gid://shopify/OnlineStoreTheme/207338176857).
- Couleurs : blanc crème #FFFBFA, rose poudré #F8E3E1, vieux rose #C47A86 (boutons), texte prune #3D2B2F.
  Titres en Cormorant Garamond (serif élégante).
- Page d'accueil = 10 sections sur mesure (`theme/sections/rt-*.liquid`, style `theme/rituel.css`) :
  bannière masque LED → réassurance → pourquoi en hiver → le masque en détail → rituel 3 étapes →
  pensé pour vous → coffret Noël → nos produits → FAQ → appel final.
- Les photos produits remplacent automatiquement les illustrations dès que les produits sont actifs avec des images.
- À venir : avis clients, page produit détaillée, pages légales.

## v2 – automne + mobile + page produit (27/09/2026)

- Thème brouillon « 💗 ROSE v2 – automne + mobile (à publier) » (gid://shopify/OnlineStoreTheme/207356723545).
- Noël retiré partout → thème automne. Bandeau : « 🍂 Nouveau : votre rituel beauté d'automne ».
- Mobile : titres plus compacts, boutons pleine largeur, barre d'achat fixe en bas, compléments en carrousel.
- Nouveau produit brouillon : Lunettes LED Regard 53,90 € (gid://shopify/Product/16648100544857, SKU LED-EYES-BLANC),
  ajouté à la collection Rituel Éclat. Rend légitime le prix de référence du coffret (107,90 + 53,90 = 161,80 €),
  affiché automatiquement seulement quand les 3 produits sont actifs.
- Page produit du masque : modèle `product.masque-led` (templateSuffix attribué au produit).
- Catalogue : 4 produits (masque, coffret, lunettes, gua sha) — décision du propriétaire.

## v3 – animations (27/09/2026)

- Thème brouillon « 💗 ROSE v3 – animations (à publier) » (gid://shopify/OnlineStoreTheme/207357444441).
- Animations : bandeau défilant (livraison, retours, garanties…), reflet lumineux sur les boutons d'achat
  (y compris « Ajouter au panier » du thème), barre mobile qui glisse + pulsation, apparition des blocs au défilement
  (`theme/rituel.js`), visuel qui flotte, étiquettes qui apparaissent. Tout est coupé si l'appareil demande « moins d'animations ».
- Caractéristiques réelles du masque (fiche fournisseur) : 202 g, 0,35 cm, silicone qualité alimentaire, 103 × 3 LED,
  expédié depuis la France. Allégations du fournisseur (« anti-âge », « rajeunissement », « réparation ») NON reprises.
- Description produit Shopify mise à jour (utilisée par Google Shopping).
- Le fournisseur propose aussi un coloris NOIR : variante possible plus tard.
- Correctif v3 : l'apparition au défilement en JavaScript laissait les blocs invisibles dans certains navigateurs
  (sections blanches). Remplacée par une animation 100 % CSS (`animation-timeline: view()`) : si le navigateur ne la
  gère pas, les blocs restent simplement visibles. `rituel.js` est désormais vide. Testé en local (Chromium, ordi + mobile).
- Compléments : les 3 cartes ont la même taille ; au survol la carte grandit (×1,05), l'image zoome, la bordure passe
  en vieux rose et les 2 autres cartes s'estompent légèrement. Sur mobile, léger agrandissement au toucher.

## v4 – touches dorées (27/09/2026)

- Thème brouillon « 💗 ROSE v4 – touches dorées (à publier) » (gid://shopify/OnlineStoreTheme/207367078233).
- Doré ajouté avec parcimonie (voir STYLE.md). Bannière : les 2 pastilles « 10 min » et « 202 g » supprimées ;
  sous le visuel, bouton « Voir le masque en détail → » (flèche dorée animée) qui fait défiler en douceur
  jusqu'à la section « Le masque en détail » (ancre `#rt-masque`). Testé en local (clic → section atteinte).

## v5 – offre premium (27/09/2026)

- Thème brouillon « 💗 ROSE v5 – offre premium (à publier) » (gid://shopify/OnlineStoreTheme/207367799129).
- Badge du coffret : « Offre premium ». Bouton « Voir le masque en détail » retiré de la bannière.
  Bannière : garanties en colonne (Expédié depuis la France / Paiement sécurisé / Retours sous 14 jours).
- CORRECTIF : pour un produit en brouillon, `all_products` renvoie un objet vide mais « vrai » → images cassées (« ? »)
  et prix vides. Chaque section vérifie désormais `produit.handle == '…'` (variables `m_ok`, `pk_ok`, `ey_ok`, `gs_ok`)
  avant d'utiliser l'image, le prix ou le lien ; sinon illustration + prix de secours.

## v6 – avis + livraison (27/09/2026)

- Le thème v5 (non publié) a été renommé « 💗 ROSE v6 – avis + livraison (à publier) » (gid://shopify/OnlineStoreTheme/207367799129).
- « Livraison sous 7 jours ouvrés » : bannière (sous le prix), bandeau défilant, réassurance, FAQ.
- Nouvelle section `rt-reviews` (« RT · Avis clientes », avant l'appel final) : note moyenne + carrousel d'avis qui défile
  en continu (pause au survol). Avis ajoutés via l'éditeur (blocs « Avis » + note/nombre réels dans les réglages).
  Tant qu'aucun vrai avis n'est saisi : section INVISIBLE pour les clientes ; dans l'éditeur seulement, aperçu avec
  8 avis fictifs + « 4,8 · 328 avis » et la mention « avis fictifs ». Faux avis publics refusés (pratique commerciale
  trompeuse, règles Google Merchant Center).

## v7 – avis style Google (27/09/2026)

- Thème brouillon « 💗 ROSE v7 – avis style Google (à publier) » (gid://shopify/OnlineStoreTheme/207368618329).
- Section avis restylée façon Google : résumé (note + étoiles jaunes + « Basé sur N avis »), cartes blanches avec
  avatar coloré à l'initiale, « Prénom N. », date relative, étoiles #FBBC04, « Avis vérifié ». Défilement continu.
- Logo Google + « Avis Google · voir tous les avis » affichés UNIQUEMENT si un lien de fiche Google est renseigné
  (réglage de la section) : à n'utiliser que pour de vrais avis Google.
- Toujours : aucun avis fictif visible par les clientes (exemples seulement dans l'éditeur).

## v8 – marque VELEA + logo (27/09/2026)

- Nom de marque : **VELEA**. Thème brouillon « 💗 VELEA v8 – logo (à publier) » (gid://shopify/OnlineStoreTheme/207370191193).
- Logo dessiné en haut de toutes les pages : fleur à 5 pétales rose poudré bordés de vieux rose, cœur doré + « VELEA »
  en Cormorant Garamond espacé (prune). Fichier `theme/snippets/velea-logo.liquid` ; le bloc `blocks/_header-logo.liquid`
  l'affiche tant qu'aucune image de logo n'est choisie dans le thème (extrait modifié dans `theme/blocks/`).
  Aperçu : `velea-logo-apercu.png`.
- Marque (« vendor ») des 4 produits : « Ma boutique » → « VELEA ».
- À faire par le propriétaire : renommer la boutique (Paramètres → Général → Nom de la boutique → VELEA),
  vérifier le nom sur l'INPI, choisir un domaine (velea.com pris ; velea.org libre ; vérifier velea.fr),
  puis adresse contact@ + domaine et Instagram @velea.

## v9 – contact + réseaux (27/09/2026)

- Thème brouillon « 💗 VELEA v9 – contact + réseaux (à publier) » (gid://shopify/OnlineStoreTheme/207371993433), copie de v8 (publié).
- Pied de page (`theme/footer-group.json`) : nouveau bloc « Nous contacter » avec l'e-mail cliquable
  **velea.officiel@gmail.com** ; textes de l'inscription e-mail traduits en français (« Restez informée », « S'inscrire »).
- Réseaux sociaux : YouTube et X retirés, Pinterest ajouté (Facebook, Instagram, TikTok gardés).
  Les liens sont encore génériques (sans nom de compte) : Horizon ne montre alors les icônes que dans l'éditeur,
  pas aux clientes. Coller les vrais liens de profil dans l'éditeur (Pied de page → Réseaux sociaux) pour les afficher.
- À faire par le propriétaire : Paramètres → Coordonnées de la boutique → e-mail client = velea.officiel@gmail.com
  (adresse de réponse des e-mails de commande).

## v10 – réseaux reliés (27/09/2026)

- Thème brouillon « 💗 VELEA v10 – réseaux reliés (à publier) » (gid://shopify/OnlineStoreTheme/207372681561), copie de v9 (publié).
- Icônes du pied de page reliées aux vrais comptes : Instagram https://www.instagram.com/velea.officiel/ ,
  Pinterest https://www.pinterest.com/veleaofficiel/ (visibles par les clientes).
- Facebook et TikTok : liens génériques (masqués pour les clientes) en attendant l'adresse de la page Facebook.

## v11 – fleur dorée (27/09/2026)

- Thème brouillon « 💗 VELEA v11 – fleur dorée (à publier) » (gid://shopify/OnlineStoreTheme/207373500761), copie de v10 (publié).
- Logo visage essayé puis refusé par le propriétaire (« pas pro »). Retour à la fleur, en version pro :
  5 pétales pointus à trait fin doré, intérieur rose poudré, cœur doré + « VELEA » en Cormorant Garamond 500
  très espacé. Au survol, la fleur tourne d'un pétale. Fichier `theme/snippets/velea-logo.liquid`, aperçu `velea-logo-apercu.png`.

## v12 – langues (27/09/2026)

- Thème brouillon « 💗 VELEA v12 – langues (à publier) » (gid://shopify/OnlineStoreTheme/207382282585), copie de v11 (publié).
- Langues activées et publiées dans Shopify : français (principale), anglais, allemand, espagnol, italien
  (adresses /en, /de, /es, /it).
- Sélecteur de langue en bas de page : section `theme/sections/velea-langues.liquid` (« VELEA · Langues »,
  drapeaux + nom de la langue, style pilule rose), placée entre le pied de page et la ligne du bas.
- Traduction des textes des sections RT : un seul point de traduction dans `layout/theme.liquid`
  (copie : `theme/layout/theme.liquid`). Hors français, le HTML de l'en-tête, de la page et du pied de page passe
  dans `snippets/velea-i18n.liquid`, qui remplace chaque phrase française par sa traduction
  (`snippets/velea-i18n-en|de|es|it.liquid`).
- Les traductions se modifient dans `theme/i18n/traductions.py`, puis `python3 theme/i18n/generer.py`
  régénère les 4 fichiers (à renvoyer sur le thème). 169 phrases, toutes vérifiées contre les pages.
- ⚠️ Si on change un texte français d'une section, il faut aussi changer la ligne correspondante dans
  `traductions.py`, sinon ce texte restera en français dans les autres langues.
- Traduits aussi via Shopify : menus (en-tête + pied de page) et titres des 4 produits principaux.
  Pas encore traduits : descriptions des produits, pages (À propos, FAQ…) et politiques.
- Les textes Shopify (panier, paiement, boutons du thème) sont traduits automatiquement par Shopify/Horizon.

## Photo du masque (27/09/2026)

- Photo « masque blanc sur fond rose » (fournie par le propriétaire) ajoutée comme 1re image du produit masque
  (gid://shopify/MediaImage/76217755566425). Copie : `photos-masque-rose.jpg`.
- Photo « masque rouge » NON utilisée : elle contient des allégations interdites (« Réduit les rides »,
  « Stimule la régénération cellulaire »).
- Le bouton « Je commande mon masque » mène déjà à la page produit du masque (modèle `product.masque-led`),
  mais seulement quand le produit est actif. Produit encore en BROUILLON et absent du canal « Boutique en ligne » :
  activation refusée à Claude, à faire par le propriétaire (Produits → masque → Statut : Actif + canal Boutique en ligne).
  Boutique toujours protégée par mot de passe. Stock non suivi (pas de mention « Épuisé »).

## v13 – bannière femme (27/09/2026)

- Thème brouillon « 💗 VELEA v13 – bannière femme (à publier) » (gid://shopify/OnlineStoreTheme/207384871257), copie de v12 (publié).
- Bannière d'accueil (rt-hero) : nouveau réglage « Photo de la bannière » (sélecteur d'image). Réglé sur la photo
  « femme portant le masque » (Fichiers Shopify : velea-banniere-femme.jpg, copie `photos-banniere-femme.jpg`).
  Si le réglage est vidé, la bannière reprend la photo principale du masque. Rien d'autre n'a changé.
- Le masque est maintenant ACTIF (fait par le propriétaire) ; il doit aussi être publié sur le canal « Boutique en ligne ».

## Assistance IA (chat) – 28/09/2026

- Solution retenue : Shopify Inbox (gratuit), déjà prévu par le thème Horizon (snippet `chat-drawer` : bulle en bas à droite
  dès que l'appli est installée). Son « agent Inbox » (IA) répond à partir des produits, politiques, pages et base de connaissances.
- Claude ne peut pas installer d'application : installation + réglages à faire par le propriétaire.
- Pour que l'IA ne donne pas de fausses infos, pages corrigées :
  - « Livraison » : l'ancien texte (Colissimo 4,90 €, 2 à 4 jours, offerte dès 60 €, Europe) n'était pas confirmé.
    Remplacé par : expédié depuis la France, sous 7 jours ouvrés, frais affichés au paiement, suivi, plusieurs colis possibles.
  - « FAQ » : réécrite (questions sur le masque ; plus de liste de moyens de paiement, de « livraison offerte » ni de « carte cadeau »).
- Politique de remboursement : contient encore des [crochets], mais pas d'accès API (write_legal_policies).
  Texte prêt à coller : `politique-retours-a-coller.txt`.
- Restent aussi à compléter par le propriétaire : conditions de vente ([nom de domaine], [médiateur]) et mentions légales.
  La politique de confidentialité affiche l'e-mail perso et l'adresse perso, à remplacer par velea.officiel@gmail.com.

## v14 – chat fleuri + recherche beauté (28/09/2026)

- Thème brouillon « 💗 VELEA v14 – chat fleuri (à publier) » (gid://shopify/OnlineStoreTheme/207459615065), copie de v13 (publié).
- Chat Shopify Inbox (app embed dans config/settings_data.json) : bouton vieux rose #a95f6c, icône bulle,
  libellé « no_text » (valeur supposée pour « sans texte » : si « Chat » reste affiché, choisir le libellé vide dans
  l'éditeur → Intégrations d'applications → Chat → Déclencheur/Libellé), produit mis en avant = masque LED, message d'accueil 🌸.
- Petite fleur dorée animée posée sur la bulle : `theme/snippets/velea-chat-fleur.liquid`, appelée dans `layout/theme.liquid`
  juste après `chat-drawer`. Position réglable (--vl-fleur-right / --vl-fleur-bottom, 58px / 60px par défaut) : à caler
  sur une capture réelle. Cachée quand le chat est ouvert.
- Recherche : seuls les produits actifs apparaissent (les anciens produits d'exemple sont archivés). Mots-clés beauté
  ajoutés au masque (beauté, soin visage, skincare, luminothérapie, lumière rouge, éclat, teint, spa…). Chaque nouveau
  produit devra recevoir ses mots-clés.

## v15 – pages produits (28/09/2026)

- Thème brouillon « 💗 VELEA v15 – pages produits (à publier) » (gid://shopify/OnlineStoreTheme/207467086169), copie de v14 (publié).
- Nouvelle section générique `theme/sections/rt-pdp-info.liquid` (« RT · Page produit ») : points forts (blocs, icônes au choix),
  3 étapes, caractéristiques, précautions. Sur mobile, points forts sur 2 colonnes. Tout est modifiable dans l'éditeur.
- Nouveaux modèles de page produit (générés par `theme/modeles/generer.py` à partir de product.masque-led.json) :
  `product.lunettes`, `product.haute-frequence`, `product.coffret` → bloc achat + bandeau + RT · Page produit + compléments + réassurance.
- Nouveau produit « Stylo Visage Haute Fréquence – 4 Embouts en Verre » (gid://shopify/Product/16650549068121,
  handle stylo-visage-haute-frequence), 49,90 € (coût 24,39 €), variante « Prise : Européenne », BROUILLON (en attente des photos),
  collection Rituel Éclat, modèle haute-frequence. Aucune allégation médicale ; précautions complètes (dont alcool, bijoux, yeux).
  ⚠️ Fournisseur AliExpress : commander la version prise EU ; la notice fournie est en anglais → prévoir une notice FR.
- Lunettes : le vrai produit est un masseur oculaire micro-courants (EMS) + lumière rouge (4 modes, 3 intensités, USB-C,
  ~90 min, minuteur 10 min). Description réécrite en conséquence (sans « cernes/rides »), modèle lunettes.
- Coffret : description réécrite (lunettes = micro-massage + lumière rouge ; « idée cadeau de Noël » retirée), modèle coffret.
- Compléments (rt-shop) : gua sha retiré, remplacé à droite par le stylo haute fréquence ; images en srcset (net sur mobile).
  Le gua sha reste en brouillon.
- À faire : traductions EN/DE/ES/IT des nouveaux textes (cartes compléments + pages produits) ; photos des 3 produits.

## v16 – logo moderne + coffret au choix (29/09/2026)

- Thème brouillon « 💗 VELEA v16 – logo + coffret (à publier) » (gid://shopify/OnlineStoreTheme/207485534553), copie de v15 (publié).
- Logo « fleur en V » (voir STYLE.md), aperçu `velea-logo-apercu.png` ; même fleur sur la bulle du chat.
- Coffret (même produit gid://shopify/Product/16647453475161, même adresse) renommé
  « Coffret Rituel Éclat – Masque LED + Complément au Choix », option « Complément » :
  - Lunettes LED regard : 144,90 € (masque 107,90 + lunettes 53,90 = 161,80 → 16,90 € d'économie) ;
  - Stylo visage haute fréquence : 139,90 € (107,90 + 49,90 = 157,80 → 17,90 € d'économie).
  Description, page (product.coffret) et titres traduits mis à jour. Toujours en brouillon (photos).
- Accueil : carte centrale « Coffret masque + au choix », « dès 139,90 € », « Jusqu'à X € d'économie » (calculé en direct à
  partir des vrais prix, seulement si tous les produits sont actifs) ; section « RT · Coffret » réécrite (composez votre duo,
  badge « Au choix », bouton « Je compose mon coffret »).
- Traductions EN/DE/ES/IT à refaire pour : cartes compléments, section coffret, pages lunettes/stylo/coffret.

## v17 – page du stylo visage complète (29/09/2026)

- v16 a été publiée par le propriétaire. Thème brouillon « 💗 VELEA v17 – page stylo (à publier) »
  (gid://shopify/OnlineStoreTheme/207485829465), copie de v16.
- Produit stylo (gid://shopify/Product/16650549068121) : nouveau fournisseur AliExpress (prise EU, coût 33,19 €, prix 49,90 €).
  Infos réelles : poignée 21,2 cm isolée avec câble, 4 embouts en verre (champignon, cuillère, courbé, droit), 14 à 16 cm.
  Les chiffres non confirmés (23 × 2,5 cm, 10 W, 100–240 V) ont été retirés.
- Photos (dans `photos-stylo/`) : 1ʳᵉ = femme avec le stylo (fournie par le propriétaire), puis 5 visuels VELEA créés
  (contenu de la boîte, 4 embouts, dimensions, rituel 3 étapes, points forts ; source `visuels-source.html`).
  Les images du fournisseur ne sont PAS utilisées (avant/après et allégations médicales interdites).
- Page (product.haute-frequence) : points clés, points forts, étapes, caractéristiques mis à jour ; nouveau bloc
  « Toutes les infos » sous le bouton d'achat (menus dépliants : dans la boîte, caractéristiques, quel embout pour quelle zone,
  comment l'utiliser, précautions, livraison et retours). Réassurance sans « Expédié depuis la France » (non vérifié).
- Toujours en brouillon : le propriétaire le passe en Actif quand il veut.

### v17 (suite) – pages lunettes et coffret, plus aucun autre produit sur les pages produit

- Thème renommé « 💗 VELEA v17 – pages produits (à publier) ».
- Pages produit (masque, stylo, lunettes, coffret) : section « Compléments » retirée ; bandeau défilant (spécifique au masque)
  retiré des pages stylo/lunettes/coffret ; textes stylo/lunettes sans mention du masque.
- Lunettes (Foreverlily LC Store, coût 23,19 €) : photo principale = lunettes blanches sur fond blanc (recadrée depuis la capture
  AliExpress, ~470 px d'origine agrandie → demander l'image originale pour plus de netteté) + 5 visuels (`photos-lunettes/`).
  Bloc « Toutes les infos » sous le bouton d'achat. Description sans « Expédié depuis la France ».
- Stylo : 6ᵉ photo refaite sans « Avec votre masque » (`photos-stylo/velea-stylo-5b.jpg`).
- Coffret : nouveau bloc de thème `blocks/velea-coffret-inclus.liquid` placé juste avant le choix de variante :
  ① « Masque LED visage & cou – Inclus 🔒 » (non modifiable) ② « Choisissez votre complément » (lunettes / stylo).
  3 photos (`photos-coffret/`) : principale « masque + au choix », et une photo par choix reliée à la variante
  (l'image change quand on choisit lunettes ou stylo). Bloc « Toutes les infos » (contenu, prix, précautions, livraison).

## v18 – confiance (29/09/2026)

- Thème brouillon « 💗 VELEA v18 – confiance (à publier) » (gid://shopify/OnlineStoreTheme/207529836889), copie de v17 (publié).
  Envoi des fichiers : via fichiers « staged uploads » (text/plain) + themeFilesUpsert en type URL (voir scratchpad), vérifié.
- Photos : texte fournisseur « Face mask Photon skin rejuvenation… » effacé (retouche OpenCV) sur la photo du masque
  (produit) et la bannière (fichier velea-banniere-femme-v2.jpg) ; 3 photos du coffret refaites. Originaux + retouches
  dans `photos-retouchees/`.
- Livraison : plus aucun « Expédié depuis la France » ; partout « Livraison suivie en 5 à 10 jours ouvrés »
  (bannière, bandeau, réassurance, FAQ, pages Livraison/FAQ, descriptions produits, bandeau d'annonce).
- Retours : « Satisfaite ou remboursée 30 jours » partout (sections, modèles, descriptions, page Retours renommée,
  menu pied de page). ⚠️ La politique de remboursement Shopify doit être collée par le propriétaire
  (`politique-retours-a-coller.txt`) — je n'ai pas le droit de la modifier.
- Avis : snippet `velea-etoiles` (étoiles sous le titre de la bannière, du bloc masque et des pages produit via le bloc
  `velea-etoiles`) lit les métachamps standard reviews.rating / reviews.rating_count → n'apparaît qu'avec de VRAIS avis
  (application Judge.me ou Loox à installer). Section « Avis clientes » : ancre #avis + photo par avis (avec accord).
- Paiement : snippet/bloc `velea-paiement` (logos des moyens de paiement réellement activés) sous les boutons d'achat
  (bannière, bloc masque, 4 pages produit). Barre d'achat collante mobile : déjà présente (accueil + pages produit).
- Coffret : prix barré = masque + complément achetés séparément, calculé en direct (« dès 139,90 € ~~157,80 €~~ »,
  jusqu'à 17,90 € d'économie ; lunettes 144,90 € au lieu de 161,80 €), avec mention explicative.
- Bugs : carte stylo (image recadrée en absolu, visage visible), fleur flottante du chat retirée (seul le chat reste),
  espaces entre sections réduits (.rt-wrap 72→52 px, sections 20→10 px), titre de la bannière raccourci
  (« Offrez à votre peau l'éclat qu'elle mérite », 2 lignes sur mobile).
- FAQ (section + page) : yeux, résultats (sans promesse), contre-indications, batterie, livraison, 30 jours.
  Autonomie exacte du masque et marquage CE : NON indiqués (à confirmer par le fournisseur).
- Menu principal : Accueil · Le Rituel Éclat · Notre histoire · FAQ · Contact. Page « À propos » → « Notre histoire »
  (texte honnête, sans fausses affirmations).
- Traductions EN/DE/ES/IT ajoutées pour les nouveaux textes (i18n/traductions.py).
- À faire par le propriétaire : nom de boutique + préférences + domaine (`preferences-a-coller.txt`), politique de
  remboursement, installer Judge.me (avis réels), Alma/Klarna (paiement en 3x/4x) si souhaité.

## v19 – épuré, moins « IA », plus court sur mobile (29/09/2026)

- Thème brouillon « 💗 VELEA v19 – épuré mobile (à publier) » (gid://shopify/OnlineStoreTheme/207537471833), copie de v18 (publié).
- Logo : nom « VELEA » seul, petit (15 px mobile), sans la fleur.
- Photos : TOUTES les photos produits supprimées (masque, coffret, lunettes, stylo) à la demande du propriétaire
  (images IA + visuels générés). Copies conservées dans `photos-*` du dépôt. À la place : cadres roses vides
  (`.vl-frame`, et galerie produit vide = carré rose via CSS). Bannière : plus de photo (réglage vidé).
- Accueil raccourci : bannière → réassurance → le masque en détail → coffret/compléments → utilisation → FAQ → avis
  (sections retirées : bandeau défilant, automne, « pensé pour vous », coffret, appel final). Hauteur mobile ~3 900 px
  au lieu de ~8 700 px.
- Mobile : accès rapide en pastilles (Masque · Coffret · Lunettes · Stylo · Questions), étapes en carrousel, 
  caractéristiques en 2 colonnes, FAQ fermée, visuel de la bannière sous le texte, barre d'achat fixe conservée.
- « Moins IA » : accroches (eyebrows) masquées, plus de mot en italique rose, plus d'animations ni d'effets de survol,
  plus d'emojis ni de ✦, textes réécrits courts et factuels (accueil + pages produits), titres simples
  (« Points forts », « Utilisation », « Caractéristiques », « Questions fréquentes »).
- Page masque : bandeau défilant et « points forts » retirés (doublons). Traductions EN/DE/ES/IT des nouveaux textes.

## v20 – nouveau masque (29/09/2026)

- Nouveau fournisseur du masque : Foreverlily Store (AliExpress, item 1005008827664510, option « gift box »), 35,79 € —
  même vendeur que les lunettes. Masque en PLASTIQUE (rigide) : ne plus jamais écrire « silicone ».
  Caractéristiques confirmées par la fiche : 120 × 3 LED, 7 couleurs, visage + pièce cou (boucle détachable), sangle,
  fenêtres transparentes (cache-yeux), bouton tactile (appui long 3 s = marche, appui court = couleur), batterie 600 mAh,
  DC 5 V / 1 A, 3,7 W, charge 2 h, autonomie 1 à 2,5 h, câble USB-C (pas d'adaptateur), notice, boîte. Séance 10–15 min.
  Pas de minuteur automatique mentionné → retiré du site.
- Prix : masque 79,90 € (coût 35,79 €). Coffrets : masque + lunettes 109,90 € (coût 58,98 €, au lieu de 133,80 €),
  masque + stylo 104,90 € (coût 68,98 €, au lieu de 129,80 €). Lunettes 53,90 €, stylo 49,90 € inchangés.
- Produit masque : titre « Masque LED Visage & Cou – 7 Couleurs, Sans Fil » (adresse inchangée), description
  réécrite, titres traduits EN/DE/ES/IT. Coffret : description mise à jour. Page FAQ mise à jour.
- Thème « 💗 VELEA v20 – nouveau masque (à publier) » (gid://shopify/OnlineStoreTheme/207547498841), copie de v19 (publié) :
  bannière, bloc masque, FAQ, étapes, caractéristiques, pages masque/coffret, prix de secours, traductions.
- Toujours pas de photos : attendre de vraies photos du nouveau masque (ou photos propres du vendeur, sans texte ni avant/après).

## Plan accueil v21 (30/09/2026) – à valider

- Analyse complète de la page d'accueil et plan en 9 sections : voir `boutique-led/PLAN-ACCUEIL-v21.md`
  (structure, textes finaux, couleurs, typographies, cartes, mobile, confiance, checklist).
- Pas encore appliqué au thème : attendre la validation du propriétaire, puis créer « 💗 VELEA v21 – accueil (à publier) »
  à partir de la v20.

## v21 – nouvelle page d'accueil (30/09/2026)

- Thème « 💗 VELEA v21 – accueil (à publier) » (gid://shopify/OnlineStoreTheme/207564964185), copie de v20 (publié) :
  plan `PLAN-ACCUEIL-v21.md` appliqué. 20 fichiers envoyés, empreintes md5 vérifiées (product.masque-led.json reformaté par Shopify, contenu vérifié).
- Accueil : bannière (titre « La lumière LED, visage et cou. », prix, 1 bouton, lien coffrets, pastilles et logos de paiement retirés),
  réassurance 2 × 2, « Le masque LED VELEA » (6 points), nouvelle section « Pourquoi VELEA » (lien Notre histoire),
  « Comment ça marche » en 3 étapes empilées (+ vidéo facultative), avis (visibles dès 3 vrais avis, cases « Achat vérifié » / « Produit offert »),
  « Les coffrets VELEA » (Coffret Visage & Regard 109,90 €, Coffret Visage & Stylo 104,90 €, « Séparément … · Vous économisez … »,
  lien direct vers la bonne option) + « Vous avez déjà le masque ? » (lunettes, stylo en petit), FAQ 8 questions, appel final « Prête à essayer ? ».
- Photos : chaque zone image a un champ « Photo » dans l'éditeur ; sinon photo du produit ; sinon la zone disparaît (plus de cadre vide).
- Barre d'achat mobile : apparaît après le bouton de la bannière, disparaît à l'appel final.
- Boutons #A95F6C (survol #8F4B57), y compris « Ajouter au panier ». Logo agrandi (18 / 22 px). Doré retiré (étoiles, coffret).
- Pied de page : colonnes VELEA (contact), Boutique (nouveau menu « boutique »), Aide (menu footer), Restez informée ;
  « Powered by Shopify » retiré ; liens Facebook et TikTok génériques retirés (Instagram et Pinterest gardés : à vérifier qu'ils existent).
- En ligne tout de suite (données partagées) : menu principal (Le masque LED, Les coffrets, Tous les produits, Notre histoire,
  Questions fréquentes, Contact), menu « boutique » créé, description du masque et page FAQ : « protègent les yeux » retiré,
  question nettoyage ajoutée.
- Traductions EN/DE/ES/IT des nouveaux textes.
- Reste à faire (propriétaire) : publier v21, ajouter les photos dans l'éditeur, réécrire « Notre histoire » (encore « rituel éclat », « spa »),
  confirmer avec le fournisseur : nettoyage, filtrage des fenêtres des yeux, notice FR, poids, CE.

## v22 – rose brume + animations (30/09/2026)

- v21 publiée par le propriétaire. Thème « 💗 VELEA v22 – animé rose brume (à publier) » (gid://shopify/OnlineStoreTheme/207565029721),
  copie de v21. 3 fichiers modifiés : assets/rituel.css, sections/rt-hero.liquid (script : toucher mobile + apparition au défilement),
  config/settings_data.json (fond #FCF6F4, textes #7D625A, bordures #E8D5CC, boutons #A95F6C arrondis 14 px, variantes, badges,
  panier et champs en blanc). Empreintes md5 vérifiées (settings_data reformaté par Shopify, contenu vérifié).
- Aperçu local testé sur mobile : toutes les apparitions se déclenchent, carte agrandie à 1,03 au toucher.

## v23 – infos masque sur l'accueil (30/09/2026)

- v22 publiée par le propriétaire. Thème « 💗 VELEA v23 – infos masque (à publier) » (gid://shopify/OnlineStoreTheme/207565619545),
  copie de v22. 13 fichiers envoyés, empreintes md5 vérifiées.
- Nouvelles infos fournisseur (captures AliExpress Foreverlily) : 31 × 18,8 cm ; LED 90 × 3 visage + 30 × 3 cou ;
  voyant rouge en charge / vert chargé ; ne pas utiliser pendant la charge ; sérum possible avant la séance ;
  2 à 3 fois par semaine (remplace « 3 à 5 ») ; précautions (plaie, dermatite, rougeur/démangeaison → arrêter, ne pas regarder les LED).
  Non repris : effets par couleur et longueurs d'onde (allégations médicales ; violet 1040 nm et blanc 1580 nm incohérents),
  « 400 mAh » dans le texte (la fiche technique dit 600 mAh).
- Accueil : nouvelle section « Tout savoir sur le masque » (7 couleurs en pastilles, fiche technique, précautions), aussi sur la page masque.
  Étapes, FAQ (+ charge, + taille) et « Pourquoi VELEA » mis à jour.
- Compléments rendus discrets : section « Pour aller plus loin » après la FAQ, 2 petites cartes coffret (vignette + prix + économie),
  lunettes et stylo seuls en simple lien texte.
- En ligne tout de suite : description du masque et page FAQ mises à jour (fréquence, dimensions, LED, voyant, précautions).

## v24 – vue 360° du masque (30/09/2026)

- v23 publiée. Thème « 💗 VELEA v24 – vue 360 (à publier) » (gid://shopify/OnlineStoreTheme/207566537049), copie de v23.
  18 fichiers envoyés, empreintes md5 toutes vérifiées.
- Page du masque (modèle masque-led) : la galerie est remplacée par une vue 360° (snippets/velea-360.liquid,
  branchée dans sections/product-information.liquid ; la galerie d'origine reste dans la page, masquée).
  Fond rose sombre, on fait glisser pour tourner (5 angles : profil gauche, 3/4 gauche, face, 3/4 droit, profil droit),
  petite démonstration automatique au premier affichage, flèches du clavier.
- Pastilles 360° + 7 couleurs : un appui affiche le panneau LED allumé dans la couleur, avec un halo de la même couleur.
- Images : photo 4 vues du fabricant détourée (theme/assets/decoupe-360.py), vues gauche = miroir des vues droite,
  panneau LED recoloré à partir de la photo rouge. Mention affichée : « rendu simulé à partir de la photo du fabricant ».
- Limite : pas de vue de dos dans les photos fournies → rotation de profil à profil (180°), pas 360° complet.
  Pour un vrai 360° : 24 à 36 photos du masque sur un plateau tournant (ou vue de dos + 3/4 arrière).

## v25 – correctif vue 360° (30/09/2026)

- Problème v24 : le thème Horizon n'affiche la colonne photo que si le produit a au moins une photo
  (snippets/product-information-content.liquid, `product_has_media`). Le masque n'a aucune photo → vue 360° invisible.
- Correctif : ce snippet force `product_has_media = true` sur le modèle masque-led. Thème
  « 💗 VELEA v25 – vue 360 visible (à publier) » (gid://shopify/OnlineStoreTheme/207566700889), copie de v24 (publiée), md5 vérifié.

## v26 – vrai 360° en 3D (30/09/2026)

- Thème « 💗 VELEA v26 – masque 3D (à publier) » (gid://shopify/OnlineStoreTheme/207567683929), copie de v25 (publiée). md5 vérifiés.
- La vue 360° n'utilise plus des photos qui défilent : modèle 3D du masque (three.js 0.160, sans CDN),
  source dans `boutique-led/viewer3d/src/main.js`, compilé par `npm run build` → `theme/assets/velea-3d.js` (≈ 515 Ko, ≈ 130 Ko compressé).
  Coque blanche brillante, contour rose doré en relief, cache-nez, grille de la bouche, bouton, pièce du cou, sangle,
  ~700 LED à l'intérieur. Rotation libre à 360°, rotation automatique lente, reprise après 7 s sans toucher.
- Pastilles « Éteint » + 7 couleurs : les LED et l'intérieur s'allument dans la couleur, halo coloré, la caméra tourne
  vers l'intérieur. Chargé seulement quand la vue arrive à l'écran ; image fixe pendant le chargement ou si la 3D est impossible.
- Mention : « Modèle 3D d'illustration. Couleurs et lumière des LED simulées. »
- Pour un rendu identique au vrai produit : demander au fournisseur le fichier 3D (STEP/OBJ/GLB) ou faire scanner
  le masque échantillon (photogrammétrie) → le fichier .glb peut remplacer le modèle dessiné dans la même visionneuse.

## v27 – sangle noire + photo 3D sur l'accueil (30/09/2026)

- Thème « 💗 VELEA v27 – sangle noire + photo 3D (à publier) » (gid://shopify/OnlineStoreTheme/207568994649), copie de v26 (publiée). md5 vérifiés.
- Modèle 3D : sangle noire en velours avec épaisseur réelle et texture de fibres, rabat velcro gris foncé à l'arrière
  (face à crochets), attaches blanches aux tempes inchangées. Options d'appel `VeleaMask3D(root, {dist, fit, still})` pour les rendus fixes.
- Accueil, bloc « Le masque LED VELEA » : sans photo choisie dans l'éditeur, affiche un rendu haute qualité du masque 3D
  (vue 3/4, fond rose sombre, format 4:5, rendu 2400 × 3000 réduit en 800 / 1200 / 1600 px, `assets/velea-masque-3d-*.webp`),
  cliquable vers la page du masque. Rien d'autre n'a été modifié.

## v28 – stylo visage en 3D (30/09/2026)

- Thème « 💗 VELEA v28 – stylo 3D (à publier) » (gid://shopify/OnlineStoreTheme/207583183193), copie de v27 (publiée). 11 fichiers, md5 vérifiés.
- Modèle 3D du stylo haute fréquence (`viewer3d/src/stylo.js`, dans le même `assets/velea-3d.js` → `VeleaStylo3D`) :
  manche blanc brillant à alvéoles en quinconce, base évasée, rainure, cou conique, bague chromée,
  électrode en verre rosé courbée avec disque « champignon », ressort de cordon + câble. Rotation libre à 360°.
- Page du stylo (modèle haute-frequence) : la galerie est remplacée par la vue 360° (snippets/velea-360-stylo.liquid, format 4:5,
  fond rose sombre, pas de pastilles de couleur). Colonne photo forcée même sans photo produit (product-information-content).
- Rendu 4K (3072 × 3840) : `visuels/velea-stylo-3d-4k.png` ; versions 800/1200/1600 px en image d'attente (`assets/velea-stylo-3d-*.webp`).
- Vue du masque inchangée (testée après la mise à jour du fichier commun).

## v29 – « Découvrez aussi » + cartes produits soignées (30/09/2026)

- Thème « 💗 VELEA v29 – autres produits (à publier) » (gid://shopify/OnlineStoreTheme/207584723289), copie de v28 (publiée). 13 fichiers, md5 vérifiés.
- Nouvelle section `rt-others` + carte `velea-card` : bas des 5 modèles produit (masque, coffret, lunettes, stylo, défaut),
  page 404 (textes en français + « Nos produits ») et page collection « Tous les produits » (grille du thème remplacée).
  Mobile : défilement horizontal quand 3 cartes, grille 2 colonnes quand 4.
- Photos produit (en ligne tout de suite) : rendus 3D carrés 2400 × 2400 ajoutés au masque et au stylo
  (`visuels/velea-masque-led-visage-cou.jpg`, `visuels/velea-stylo-visage-haute-frequence.jpg`) → visibles aussi dans le panier,
  le paiement, la recherche, et la bannière / l'appel final de l'accueil (qui utilisent la photo du masque).
  Coffret et lunettes : pas de photo, visuel rose avec icône.
- `modeles/generer.py` ajoute aussi `rt_others` aux modèles générés.

## v30 – section avis clientes haute qualité (30/09/2026)

- Thème « 💗 VELEA v30 – avis clientes (à publier) » (gid://shopify/OnlineStoreTheme/207585444185), copie de v29 (publiée). md5 vérifiés.
- `sections/rt-reviews.liquid` refaite : note moyenne + étoiles + répartition 5→1 calculées automatiquement à partir des blocs,
  bandeau des photos clientes (agrandissement au clic), cartes avec case photo, titre, texte, prénom, produit,
  « Achat vérifié » (case à cocher) et mention « Produit offert » (obligatoire si coché), défilement automatique doux
  (pause au survol/toucher, flèches + points, glisser au doigt sur mobile). Visible par tous dès 3 avis ;
  dans l'éditeur, cartes « Exemple » et cases « Photo cliente » vides pour voir la mise en page.
- Avis AliExpress du fournisseur NON repris : ce ne sont pas des clientes VELEA (pratique trompeuse), plusieurs contiennent
  des allégations santé (peau « améliorée », thyroïde). À remplacer par de vrais avis (Judge.me, premières clientes, échantillon offert + mention).

## v31 – accueil épuré + fin des « Page introuvable » (30/09/2026)
Thème « 💗 VELEA v31 – accueil épuré (à publier) » (207588426073), copie de v30. **À publier par le propriétaire.**
- **Cause des « Page introuvable »** : le menu « Tous les produits » pointait vers la collection « Rituel Éclat », non publiée. Corrigé tout de suite dans le menu principal (→ /collections/all, déjà en ligne). Les liens de secours des sections pointent aussi vers /collections/all.
- **Page 404** : titre « Page introuvable », phrase et bouton retirés ; il ne reste que « Nos produits » (les 4 cartes).
- **Accueil (mobile)** : une seule photo du masque (en haut).
  - Bouton du haut : « Voir le masque ↓ », il fait descendre en douceur jusqu'à la section du masque (#rt-masque) au lieu d'ouvrir une autre page.
  - Retirés du haut : le lien « ou voir les coffrets » (la section coffrets est plus bas) et la ligne « Satisfaite ou remboursée · Livraison suivie » (déjà dans le bandeau confiance juste dessous).
  - Section du masque : plus de 2e photo, plus de lien « Voir toutes les caractéristiques » (elles sont juste en dessous) ; bouton « Commander – 79,90 € ».
  - Section « Pourquoi VELEA » retirée de l'accueil (répétait sans fil / visage + cou / 30 jours). La page « Notre histoire » reste dans le menu.
  - Appel final : sans photo.
  - Bandeau d'annonce : « 🍂 Nouveau : votre rituel beauté d'automne » retiré, il reste « Livraison suivie · Satisfaite ou remboursée 30 jours ».
- Ordre de l'accueil : bannière → confiance → le masque → tout savoir → comment ça marche → avis → FAQ → coffrets → appel final.
- 12 fichiers vérifiés (empreinte identique).

## v32 – doré premium + ergonomie téléphone (30/09/2026)
Thème « 💗 VELEA v32 – doré + mobile (à publier) » (207590162777), copie de v31. **À publier par le propriétaire.**
- **Accueil**
  - Bouton du haut « Voir le masque ↓ » : plus de cadre, texte doré brillant + petite flèche dorée qui descend jusqu'au masque.
  - « Commander » remplacé par « Découvrir » : section masque (« Découvrir – 79,90 € »), appel final (« Découvrir le masque »), barre du bas (« Découvrir »). Ces boutons sont dorés (champagne), texte brun.
  - Téléphone : photo du haut limitée en hauteur pour que le bouton reste visible sans défiler.
  - Fiche technique repliée sur téléphone après 6 lignes, bouton « Voir toute la fiche technique ».
- **Vues 3D (masque et stylo)**
  - Téléphone : cadre plus petit et centré (masque ≈ 88 % de la largeur, stylo ≈ 76 %), le produit entier est visible (le stylo dépassait en haut et en bas).
  - Caméra reculée : masque dist 8,4, stylo dist 9,6.
  - Flèches ◀ ▶ sur l'image pour tourner d'un toucher (60° par appui).
  - Téléphone : on tourne seulement à gauche / à droite, le glissé vers le haut ou le bas fait défiler la page normalement.
  - Pastilles de couleur du masque : 2 rangées de 4 sur téléphone (plus de défilement de côté).
- 12 fichiers vérifiés (empreinte identique).

## v33 – menu du téléphone (30/09/2026)
Thème « 💗 VELEA v33 – menu mobile (à publier) » (207602286937), copie de v32. **À publier par le propriétaire.**
- Menu du téléphone (≤ 989 px) : les 4 produits affichés sous le menu sont retirés (réglage « menu_style » passé de « featured_products » à « text » dans header-group.json). Ils restent sur la page « Tous nos produits » (/collections/all, section rt_others).
- Liens du menu sur téléphone : écriture Cormorant Garamond 27 px + petit tiret doré devant chaque lien (layout/theme.liquid, bloc « VELEA v33 »). L'ordinateur ne change pas.
- Menus (déjà actifs, sans publier) : « Les coffrets » → « Le coffret » (menu principal et menu Boutique), « Tous les produits » → « Tous nos produits ».
- Choix : l'accueil = le masque ; « Le masque LED » = sa fiche complète + « Découvrez aussi » en bas ; « Tous nos produits » = les 4 cartes (catalogue complet, une carte chacun).

## v34 – lunettes LED en 3D (30/09/2026)
Thème « 💗 VELEA v34 – lunettes 3D (à publier) » (207606808921), copie de v33. **À publier par le propriétaire.**
- **Vue 3D des lunettes** sur leur page (modèle `product.lunettes`), même fond rose foncé que le masque et le stylo.
  - Modèle 3D fait à partir des photos du fabricant (viewer3d/src/lunettes.js, fonction `VeleaLunettes3D`) : deux coques blanches brillantes, cadre gris clair, fenêtres transparentes cerclées d'argent, pont central, branches articulées.
  - **Bouton ⏻/Mode + témoin bleu sous la coque droite** (plus visible de face, à la demande du propriétaire). Port USB-C sur le côté gauche.
  - 2 modes : **Éteintes / Allumées** (lumière rouge dans les verres, LED intérieures, témoin bleu allumé).
  - On tourne dans tous les sens : glisser, flèches ◀ ▶ ▲ ▼, et vues rapides Face · 3/4 · Côté · Dessus · Dessous.
  - Fichiers : snippets/velea-360-lunettes.liquid ; sections/product-information.liquid et snippets/product-information-content.liquid (ajout du modèle « lunettes »).
- **Images** : velea-lunettes-3d-{800,1200,1600}.webp (image de chargement + carte « Découvrez aussi »). 4K dans visuels/ (éteintes et allumées).
- **Photo produit** (déjà en ligne) : velea-lunettes-led-regard.jpg ajoutée aux lunettes → visible dans le panier, le paiement et les cartes.
- **Description** : nouvel onglet « Le produit en détail » (ouvert par défaut) à côté du produit, écrit d'après les photos ; traduit EN/DE/ES/IT.
- 13 fichiers vérifiés (empreinte identique).

## v35 – lunettes refaites, fines et pleines (30/09/2026)
Thème « 💗 VELEA v35 – lunettes fines (à publier) » (207608021337), copie de v34 (v34 à ignorer). **À publier par le propriétaire** : tant que ce n'est pas fait, la page des lunettes ne montre que la photo (pas la 3D).
- Retour du propriétaire sur v34 : lunettes trop épaisses, vide à l'intérieur, pas fidèles.
- Modèle refait en mesurant les photos : coques pleines (dos fermé, aucun vide), façade plate à arêtes biseautées, épaisseur réduite (0,42), fenêtre en trapèze avec biseau clair + cerclage argent, **panneau intérieur gris argenté derrière le verre** (on ne voit pas à travers, comme sur la photo).
- Branches plus courtes (≈ 1,8 × la hauteur de la monture) et plus fines, fixées en haut par une petite charnière.
- Allumées : le panneau derrière chaque verre devient rouge franc + points LED.
- Bouton Mode + témoin bleu toujours dessous ; port USB-C sur le côté gauche.
- Images HD et 4K refaites ; photo produit remplacée par le nouveau rendu.
