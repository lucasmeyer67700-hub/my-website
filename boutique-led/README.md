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
