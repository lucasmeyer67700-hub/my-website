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

## v21 – page d'accueil (remplace la section « Où mettre le doré »)
- **Plus de doré nulle part.** Détails (étoiles, numéros, « + » de la FAQ) en rose #C47A86.
- **Boutons d'achat : #A95F6C, survol #8F4B57**, texte blanc, arrondi 12 px, 52 px de haut. Le #C47A86 est trop pâle pour du texte blanc.
- Palette : fond #FFFBFA, fond alterné #FBEFEC, rose poudré #F8E3E1, texte #3D2B2F, texte secondaire #7A5E63, bordures #EFD6D6, cartes #FFFFFF.
- Titres : Cormorant Garamond 600. H1 34 px mobile / 52 px ordinateur, H2 28 / 40, H3 19 / 22. Texte 16 / 17 px. Logo VELEA 18 / 22 px.
- **Pas de cadre rose vide** : sans photo, la zone image n'apparaît pas du tout (les photos se choisissent dans l'éditeur du thème).
- Coffrets : pas de prix barré. Écrire « Séparément : X € · Vous économisez Y € » (calculé automatiquement).
- Yeux : écrire « fenêtres transparentes au niveau des yeux / vous voyez à travers ». Jamais « protègent les yeux » sans confirmation écrite du fournisseur.
- Ne pas présenter la garantie légale de 2 ans comme un avantage de la marque (interdit) ; la citer seulement de façon neutre (FAQ, CGV, retours).
- Ordre de l'accueil : bannière → réassurance → masque → pourquoi VELEA → comment ça marche → avis (dès 3 vrais avis) → coffrets + compléments → FAQ → appel final.
- Un seul bouton plein par écran ; les autres actions sont des liens texte. Aucun carrousel, aucun pop-up sur l'accueil.

## v22 – rose brume, blanc, brun clair + animations douces (remplace les couleurs v21 et la règle « pas d'animation » de v19)
- Fond du site : rose brume clair #FCF6F4. Cartes, tiroir panier, champs : blanc #FFFFFF.
- Rose brume #F6E9E7 (section « Pourquoi VELEA », appel final), sable #F3E9E1 (réassurance, icônes, « Dans la boîte »).
- Brun clair #C9A894 (traits sous les titres, « + » FAQ, bordures boutons secondaires), brun clair foncé #9C7A64 (icônes, liens).
- Bordures #E8D5CC. Texte #3D2B2F, texte secondaire #7D625A.
- Boutons d'achat : dégradé #A95F6C → #8E6A55 (texte blanc lisible), arrondi 14 px, reflet lumineux qui passe toutes les ~4,5 s,
  léger soulèvement au survol, petit « enfoncement » au toucher.
- Cartes (coffrets, compléments, avis, cartes produits) : grossissent de 3 % au survol ou au passage du doigt, ombre douce.
- Bannière : apparition douce du texte et de la photo ; autres blocs : apparition douce au défilement.
- Tout est coupé pour les personnes qui ont activé « réduire les animations » sur leur téléphone.
- Toujours interdit : compteurs, pop-ups, badges « best-seller », fausse urgence.

## v23 – hiérarchie
- L'accueil parle d'abord et surtout du masque (bannière, 6 points, fiche détaillée, étapes, FAQ).
- Coffrets et compléments : un seul petit bloc « Pour aller plus loin » après la FAQ, sans gros bouton ni grande image.
- Fréquence officielle : 2 à 3 fois par semaine, 10 à 15 minutes. Ne jamais attribuer d'effet à une couleur.

## v29 – autres produits et cartes produits (remplace la règle v17 « aucun autre produit sur une page produit »)
- En bas de chaque page produit : « Découvrez aussi » (les autres produits VELEA, le produit en cours retiré), demandé par le propriétaire.
- Cartes produits VELEA (snippets/velea-card.liquid) partout où des produits sont listés : fond blanc, bord #E8D5CC, arrondi 20 px,
  image 4:5, pastille (« Le produit phare », « Coffret », « Complément »), nom en serif, prix, bouton « Découvrir » en dégradé
  avec reflet ; au survol / toucher la carte monte et grossit légèrement, la photo zoome.
- Sans photo : dégradé rose brume → sable avec une icône fine (cadeau, lunettes) et une courte description. Jamais de gros titre gris.
