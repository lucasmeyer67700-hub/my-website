# Thème « Douceur »

Thème Shopify Online Store 2.0 sur mesure pour une marque de confort menstruel.
Aucune dépendance externe : Liquid, CSS natif et Web Components.

## Structure

| Dossier | Contenu |
| --- | --- |
| `layout/` | `theme.liquid` (gabarit principal), `password.liquid` |
| `sections/` | Sections modulaires configurables dans l'éditeur de thème |
| `snippets/` | Composants réutilisables (icônes, prix, galerie, ligne de panier…) |
| `templates/` | Pages JSON : accueil, produit, panier, FAQ, contact, « Notre approche »… |
| `assets/` | `base.css` (design system) et `theme.js` (composants interactifs) |
| `config/` | Réglages du thème (couleurs, typographies, réassurance, panier) |
| `locales/` | Textes d'interface : `fr.default.json` (par défaut) et `en.json` |

## Contenu produit (champs méta)

La fiche produit lit ces champs méta (Produits > [produit] > Champs méta) :

| Champ | Usage |
| --- | --- |
| `custom.accroche` | Phrase sous le nom du produit |
| `custom.points_forts` | Points clés près du bouton d'achat |
| `custom.caracteristiques` | Fiche technique, une ligne « Libellé : valeur » par caractéristique |
| `custom.contenu_colis` | Contenu du colis |
| `custom.mode_emploi` | Étapes d'utilisation, une par ligne |
| `custom.precautions` | Précautions, une par ligne |
| `custom.informations_securite` | Informations fabricant / GPSR (masqué tant que vide) |

Un champ vide masque automatiquement le bloc correspondant.

## Design system

Palette déclinée en 5 palettes de couleurs (Paramètres du thème > Couleurs) :
blanc chaud, ivoire, rose doux, rose poudré, marron profond. Les contrastes
texte/fond respectent le niveau WCAG AA (4,5:1 minimum pour le texte courant).

Typographies servies par Shopify : Instrument Serif (titres) et DM Sans (texte).

## Principes

- Aucune fausse preuve sociale : la section « Avis clientes » reste invisible sans avis réels.
- Aucune information commerciale inventée : livraison, retours et garantie se règlent
  dans Paramètres du thème > Réassurance.
- Le panier utilise l'API Ajax de Shopify ; le paiement reste le checkout sécurisé Shopify.
- Les événements standards (vue produit, ajout au panier, paiement, achat) sont émis
  par Shopify. Le thème publie seulement `theme:variant_selected` et
  `theme:newsletter_signup` pour les pixels personnalisés.

## Vérification

```bash
npx @shopify/cli theme check --path theme
```
