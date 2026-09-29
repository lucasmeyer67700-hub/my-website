# Charte de la boutique (validée le 27/09/2026)

## Marque
Nom : **VELEA** (en capitales). Logo (v19) : le nom seul, police du thème, lettres espacées, prune `#3D2B2F`,
sans pictogramme (l'ancienne « fleur en V » est abandonnée : trop chargée sur mobile).
Fichier : `theme/snippets/velea-logo.liquid`.

## Ton « pas IA » (v19)
- Phrases courtes et concrètes, des faits (poids, durée, contenu) plutôt que des promesses.
- Éviter : « rituel », « moment rien qu'à vous », « comme au spa », « éclat » à répétition, les triplets d'adjectifs,
  les accroches en capitales au-dessus des titres, le mot en italique rose dans chaque titre, les ✦ et les emojis.
- Pas d'animations décoratives (apparition au défilement, boutons qui pulsent, cartes qui grossissent).
- Photos : uniquement de vraies photos du produit (pas d'images générées par IA). Tant qu'il n'y en a pas, un cadre rose vide.

## Cible
Femmes de 20 à 60 ans qui prennent soin d'elles à la maison. Période : AUTOMNE (pas de thème Noël pour l'instant).
Trafic : Google Ads, majoritairement sur téléphone → toujours penser mobile d'abord.
Ton : doux, rassurant, féminin, vouvoiement. Phrases courtes.

## Couleurs (ne pas en ajouter d'autres)
| Rôle | Couleur |
|---|---|
| Fond | Blanc crème `#FFFBFA` / `#FFF8F6` |
| Bandeaux, encadrés | Rose poudré `#F8E3E1` / `#FBEFEC` |
| Boutons, mots mis en avant | Vieux rose `#C47A86` (survol `#A95F6C`) |
| Texte | Prune `#3D2B2F`, texte secondaire `#7A5E63` |
| Bordures | `#EFD6D6` |
| Bloc chic (coffret) | Fond prune `#3D2B2F`, accents dorés `#D9BC85` |
| **Touches dorées (premium, avec parcimonie)** | Dégradé or `#E6CF9E → #C9A461 → #A87F3E`, or `#B8914F`, texte or `#94702F` |

## Typographie et formes
- Titres : Cormorant Garamond (serif), un mot clé en *italique vieux rose*.
- Texte : police du thème (Inter).
- Boutons en pilule (arrondis complets), cartes arrondies (22 px), petites icônes rondes sur fond rose poudré.

## Structure de la page d'accueil
Sections « RT · … » dans `theme/sections/`, style commun `theme/rituel.css` (asset `rituel.css` du thème).
Ordre : bannière masque LED → réassurance → pourquoi en automne → masque en détail →
produits complémentaires (lunettes | coffret au centre | gua sha) → rituel 3 étapes → pensé pour vous → coffret → FAQ → appel final.
Page produit du masque : modèle `product.masque-led` (achat + points clés, réassurance, points forts, 3 étapes, caractéristiques, FAQ).
**Règle (v17) : sur une page produit, aucun autre produit ne s'affiche** (pas de compléments, pas de bandeau d'un autre produit).
Les compléments ne sont proposés que sur la page d'accueil. Page coffret : masque « Inclus » verrouillé + choix du complément.
Photos produit : 1ʳᵉ = vraie photo du produit, puis 5 visuels VELEA (1200 × 1200, fond crème ou rose, sans avant/après).
Sur mobile : barre d'achat fixe en bas, compléments en carrousel à faire glisser.
Le masque LED reste toujours le produit n°1, en haut.

## Règles de contenu (non négociables)
- Aucune allégation médicale : pas de « anti-rides », « acné », « cernes », « lifting », « collagène », « soigne ».
  Parler d'éclat, de teint lumineux, de regard reposé, de détente, de rituel.
- Pas de faux avis, pas de fausses notes, pas de « best-seller » sans ventes, pas de prix barré fictif.
- Pas de photos avant/après.
- Ne pas promettre ce qui n'est pas confirmé (livraison offerte, notice FR, stock France) tant que ce n'est pas vérifié.

- Noms de sections du thème : 25 caractères maximum.

## Où mettre le doré (et nulle part ailleurs)
Pétales de la fleur du logo, petit trait devant les accroches, cercles fins autour du visuel de la bannière, étoiles ✦ du bandeau défilant,
numéros des 3 étapes, badges « Offre premium » et « Routine complète », détails du bloc coffret,
« + » de la FAQ, phrase en italique des sections.
Les boutons d'achat restent en vieux rose.
