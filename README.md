# AURA — Boutique en ligne

Site e-commerce statique (HTML/CSS/JS, sans backend ni dépendances) : catalogue, fiche produit, panier et paiement.

## Pages

- `index.html` — Accueil (hero, catégories, produits vedettes)
- `boutique.html` — Catalogue complet avec filtres par catégorie et recherche
- `produit.html?id=...` — Fiche produit détaillée
- `panier.html` — Panier (quantités, suppression, livraison offerte dès 80 €)
- `paiement.html` — Formulaire de commande + paiement
- `confirmation.html` — Récapitulatif de commande

## Structure

- `css/style.css` — Styles partagés
- `js/products.js` — Catalogue produits (à remplacer par tes vrais produits)
- `js/cart.js` — Logique du panier (localStorage)
- `js/main.js` — Menu mobile, notifications

## Paiement

Le formulaire de paiement (`paiement.html`) est **simulé** : il valide les champs (numéro de carte, expiration, CVC) et affiche une confirmation, mais n'effectue aucune vraie transaction. C'est un site 100 % statique (ex. GitHub Pages), donc pour accepter de **vrais paiements**, deux options simples :

1. **Stripe Payment Links** (le plus simple, aucun code serveur) : crée des liens de paiement dans ton dashboard Stripe et remplace le bouton "Payer" par un lien vers ce Payment Link.
2. **Stripe Checkout / autre PSP avec backend** : nécessite une petite fonction serveur (ex. Cloudflare Worker, Vercel Function) pour créer la session de paiement de façon sécurisée.

Le point d'intégration à remplacer se trouve dans `paiement.html`, dans le gestionnaire `submit` du formulaire (commentaire "Paiement simulé").

## Personnalisation

- Modifier les produits : `js/products.js`
- Modifier les couleurs / le style : variables CSS en haut de `css/style.css`
- Nom de la boutique : remplacer "AURA" dans chaque page

## Autres pages du dépôt

`yes.html` et `ours.gif` sont indépendants de la boutique.
