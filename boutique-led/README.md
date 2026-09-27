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
