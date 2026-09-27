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
