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
