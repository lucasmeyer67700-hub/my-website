# Thème Shopify « Gris & Blanc » (boutique d'oreillers)

Base : thème officiel Shopify **Dawn 16.0.0** (licence dans `LICENSE.md`), personnalisé.

## Charte
| Rôle | Couleur |
|---|---|
| Blanc | `#FFFFFF` |
| Gris perle (fonds clairs) | `#F2F3F5` |
| Gris brume | `#E5E7EA` |
| Gris acier (textes secondaires) | `#9A9EA6` |
| Gris ardoise | `#4A4E57` |
| Gris anthracite (texte, boutons) | `#2A2C31` |

Police Inter, boutons en pilule, cartes et médias arrondis (16 px).
Palettes Shopify : `scheme-1` blanc, `scheme-2` gris perle, `scheme-3` anthracite, `scheme-4` gris brume, `scheme-5` ardoise.

## Fichiers ajoutés (préfixe `pp-`)
- `assets/oreiller.css` : direction artistique, chargée dans `layout/theme.liquid`
- `sections/pp-hero`, `pp-trust-bar`, `pp-problem-solution`, `pp-features`, `pp-comparison`,
  `pp-positions`, `pp-steps`, `pp-guarantee`, `pp-sticky-atc`
- `snippets/pp-icon` (icônes au trait), `pp-illustration` (illustrations SVG sans image), `pp-padding`
- `templates/index.json`, `templates/product.json`, `templates/product.oreiller.json`
- `config/settings_data.json`, `sections/header-group.json`, `sections/footer-group.json`

## Déployer
Zipper le contenu de ce dossier (assets, config, layout, locales, sections, snippets, templates à la racine du zip)
puis Boutique en ligne > Thèmes > Ajouter un thème > Importer un fichier zip.

## Typographie
Titres : **Cormorant Garamond** (SIL Open Font License 1.1, © The Cormorant Project Authors),
hébergée dans `assets/cormorant-garamond-*.woff2` et déclarée dans `snippets/pp-fonts.liquid`.
Texte courant : Inter (bibliothèque Shopify).

## Palette v3
Gris nuit `#16171A` (ouverture, en-tête, pied de page), anthracite `#1E2024` (texte),
blanc, gris perle `#F4F5F7`, bleu nuit `#1B2A41` (accents, bandeau d'annonce, garantie).
