# VELEA – Refonte « Boutique pro » (14/10/2026)

Thème de travail : **VELEA – Boutique pro** (non publié), copie du thème en ligne « VELEA – Chalet ».

## Fichiers du thème créés ou modifiés

| Fichier | Nature |
|---|---|
| layout/velea.liquid | Barre d'annonce configurable, menus Shopify (en-tête, tiroir mobile, pied de page), titre et méta-description SEO de l'accueil, balises Open Graph |
| sections/velea-announce.liquid + velea-announce-group.json | Nouvelle barre d'annonce modifiable dans l'éditeur |
| sections/velea-hero.liquid | Nouveau texte, bouton vers la fiche produit, lien secondaire, cadrage de l'image réglable, plus aucun prix |
| sections/velea-buy.liquid | Galerie des vraies photos produit (miniatures + glisser sur mobile), H1 sur la fiche, variantes, quantité, état de chargement, message d'indisponibilité, paiement express, infos de confiance, données structurées Product (sans note ni avis) |
| sections/velea-specs.liquid | Nouveau : tableau des caractéristiques + encadré « Précautions d'utilisation » |
| sections/velea-gallery.liquid | Nouveau : galerie de 5 emplacements photo |
| sections/velea-description.liquid | Nouveau : description Shopify du produit |
| sections/velea-main-page, velea-contact, velea-cart, velea-search, velea-404, velea-collection | Nouveau : pages panier, contact, pages légales, recherche, 404 et collection dans le style VELEA |
| sections/velea-faq, velea-steps, velea-story, velea-benefits, velea-final | Ancres, liens et textes par défaut réécrits au vouvoiement |
| assets/velea-ui.css | Nouveau : styles des composants ci-dessus |
| assets/velea.js | Galerie produit, variantes, état de chargement du bouton |
| templates/index, product, page, page.faq, page.contact, cart, search, 404, collection | Contenus réécrits ; toutes ces pages utilisent maintenant le layout VELEA |
| sections/header-group.json, footer-group.json | Promesses retirées de l'ancien en-tête et de l'ancien pied de page (encore utilisés par le blog) |

## Données Shopify modifiées (sauvegarde dans _backup/)

- Produit : titre « Ceinture Chauffante Menstruelle avec Massage Vibrant », nouvelle description, titre et méta-description SEO. URL inchangée (/products/ceinture-chauffante-regles), donc aucune redirection n'est nécessaire.
- Photos produit : votre photo ajoutée en 2e position ; la fiche n'affiche que les 4 premières.
- Menus : menu principal (Accueil, La ceinture, Comment ça fonctionne ?, FAQ, Contact), pied de page.
- Pages : FAQ (intro), Contact (intro), Guide règles douloureuses (fréquence d'utilisation retirée).

## Retiré du site (promesses non confirmées)

Livraison offerte, « Satisfaite ou remboursée 30 jours », « Essai 30 jours », expédition 24-48 h, réponse sous 24 h, 4 modes de massage, arrêt automatique 30 min, « prête en 5 secondes », « 2 à 3 fois par jour », USB-C câble inclus, comparatif avec les antidouleurs, section « pour toutes les âges », prix dans la bannière.

## À faire dans l'administration Shopify

1. Thèmes → « VELEA – Boutique pro » → Aperçu (mobile et ordinateur) → Publier.
2. Produits → la ceinture → Médias : supprimer « Offre duo » (aucune offre duo n'existe) et « Rituel conseillé » (fréquence non vérifiée). Vérifier aussi la photo « dans son lit » (elle peut suggérer une utilisation en dormant).
3. Prix : 44,90 € conservé. À confirmer dans Produits → Prix.
4. Pages à faire valider : « Livraison, retours et garantie 30 jours » (livraison offerte, 7-14 jours, garantie commerciale 30 jours), « Mentions légales » et « CGV » (champs [À COMPLÉTER]), politiques Shopify de remboursement et de vente (crochets [adresse e-mail], [médiateur]…).
5. Page « Notre histoire » non publiée avec des [À COMPLÉTER] ; menus « menu-cocon » et « footer-cocon » inutilisés (pointent vers le blog et Notre histoire) : à supprimer si vous n'en avez plus besoin.
6. Blog « Le Journal » (3 articles, tutoiement, conseils santé) : à relire, il n'a pas été modifié.
7. Préférences de la boutique en ligne : renseigner le titre et la méta-description de l'accueil (le thème en fournit une par défaut).
8. Ajouter les photos dans Personnaliser : galerie (5 emplacements), « Comment l'utiliser ? », « Ces jours-là… ».
9. Coller les consignes officielles du fabricant dans la section « Caractéristiques » (champ Précautions).

## Informations à confirmer auprès du fournisseur

Températures 50/55/60 °C (conditions de mesure), batterie 1 800 mAh, 5 V, 5 W, autonomie et recharge d'environ 2 h, matériaux (ABS, tissu effet velours), poids 142 g, dimensions 18,5 × 8 × 2,5 cm, nombre de modes de massage, présence d'un arrêt automatique, type de câble et contenu exact du colis, notice en français, marquage CE et documentation de conformité (déclaration UE de conformité, nom et adresse du fabricant ou de l'importateur dans l'UE, avertissements de sécurité), traçabilité (numéro de lot ou de modèle).

## Tests réellement effectués

- Theme Check (outil officiel Shopify) sur tous les fichiers VELEA : 0 erreur ; 3 avertissements restants (polices Google chargées hors CDN Shopify).
- Syntaxe JavaScript vérifiée avec Node.
- Tous les fichiers acceptés par Shopify sans erreur de validation ; relecture des fichiers en ligne.

Non testé : rendu visuel, panier et paiement réels. Le réseau de la session de travail ne permet pas d'ouvrir la boutique. À vérifier dans l'aperçu.

## Checklist avant mise en ligne

- [ ] Aperçu vérifié sur un petit mobile, un smartphone standard, une tablette et un ordinateur
- [ ] Ajout au panier, modification de quantité, suppression, passage au paiement testés
- [ ] Paiement express (Apple Pay / Shop Pay) testé
- [ ] Photos « Offre duo » et « Rituel » retirées du produit
- [ ] Caractéristiques confirmées par écrit par le fournisseur
- [ ] Notice et avertissements officiels ajoutés
- [ ] Conformité CE et informations fabricant/importateur vérifiées
- [ ] Pages légales complétées (mentions légales, CGV, politiques)
- [ ] Délais et frais de livraison réels configurés
- [ ] Prix de vente définitif confirmé
- [ ] Mot de passe de la boutique retiré au lancement
