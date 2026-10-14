# VELEA · SEO et tracking

## Balises title et meta description (déjà saisies dans Shopify)

| Page | URL | Mot-clé principal | Title (< 60 car.) | Meta description (< 155 car.) |
|---|---|---|---|---|
| Ceinture | /products/ceinture-chauffante-regles | ceinture chauffante règles | Ceinture chauffante règles \| Chaleur & massage \| VELEA | Ceinture chauffante et massante pour soulager la sensation de crampes pendant les règles. 3 niveaux de chaleur, sans fil USB-C. Livraison offerte. |
| Patchs | /products/patchs-chauffants-regles | patch chauffant règles | Patch chauffant règles \| Boîte de 10 \| VELEA | Patchs chauffants autocollants pour les règles… |
| Coussin | /products/coussin-chauffant-doudou | coussin chauffant règles | Coussin chauffant doudou pour les règles \| VELEA | Un coussin chauffant tout doux… |
| Pack | /products/pack-cocon | kit règles douloureuses | Pack Cocon : ceinture chauffante + patchs \| VELEA | Le pack complet pour tes règles… |
| Collection | /collections/tous-nos-produits | produits règles douloureuses | Ceinture chauffante, patchs et coussin pour les règles \| VELEA | Tous nos produits chauffants… |
| FAQ | /pages/faq | ceinture chauffante règles avis | FAQ : ceinture chauffante et règles douloureuses \| VELEA | Toutes les réponses… |
| Notre histoire | /pages/notre-histoire | marque bien-être menstruel | Notre histoire : une marque française douce \| VELEA | VELEA est née d'une conviction… |
| Livraison | /pages/livraison-et-retours | — | Livraison offerte et retours 30 jours \| VELEA | Livraison offerte… |
| Contact | /pages/contact | — | Contact : une vraie équipe te répond \| VELEA | Une question… |
| Article 1 | /blogs/journal/soulager-douleurs-regles-naturellement | soulager douleurs règles naturellement | Soulager les douleurs de règles naturellement \| VELEA | Chaleur, massage, mouvement doux… |
| Article 2 | /blogs/journal/chaleur-crampes-regles-pourquoi-ca-marche | chaleur crampes règles | Chaleur et crampes de règles : pourquoi ça marche \| VELEA | Pourquoi la chaleur soulage… |
| Article 3 | /blogs/journal/rituels-cocooning-regles | rituels règles cocooning | 7 rituels cocooning pendant tes règles \| VELEA | Plaid, infusion, chaleur… |
| Accueil | / | ceinture chauffante règles | **À saisir :** Préférences › Titre « VELEA · Ceinture chauffante pour les règles douloureuses » | « Ton cocon pendant tes règles : ceinture chauffante et massante, patchs et coussin. Livraison offerte, 30 jours satisfaite ou remboursée. » |

La livraison est aujourd'hui **toujours** offerte : les textes disent donc « Livraison offerte », sans seuil. Si tu passes à « offerte dès 39 € », change aussi le seuil dans le thème (Paramètres du thème › VELEA · Panier) et les tarifs d'expédition.

**Les ancres « Le Journal »** : le blog s'appelait « Actualités ». Il s'appelle maintenant « Le Journal » (`/blogs/journal`), avec une redirection automatique depuis `/blogs/actualites`.

**Maillage interne :** chaque article renvoie vers la ceinture, les patchs, le coussin et le pack. La FAQ renvoie vers les produits. Les produits renvoient vers la livraison et la FAQ. Les liens vers les patchs, le coussin et le pack ne fonctionnent qu'une fois ces produits **publiés** (ils sont en brouillon).

## Données structurées

| Type | Où | Source |
|---|---|---|
| Product (prix, disponibilité, offre) | pages produit | `{{ product \| structured_data }}` dans VELEA · Achat produit |
| AggregateRating / Review | pages produit | **app d'avis** (Judge.me), seulement avec de vrais avis |
| FAQPage | accueil, page FAQ, page produit | section VELEA · FAQ (option « Données structurées ») |
| Organization | accueil | `snippets/vl-schema.liquid` |
| BreadcrumbList | produit, collection, page, article | `snippets/vl-schema.liquid` |
| Article | articles du Journal | modèle d'article Dawn |

À tester après publication : https://search.google.com/test/rich-results

**Sitemap :** généré automatiquement (`/sitemap.xml`). Soumets-le dans Google Search Console : Ajouter une propriété › Domaine › Sitemaps › `sitemap.xml`.

## Tracking (sans coller de code dans le thème)

| Outil | Où l'installer | Ce qu'il faut coller |
|---|---|---|
| **Meta Pixel + Conversions API** | Applications › « Facebook & Instagram » (app officielle Meta) › Paramètres › Partage de données : **Maximum** (active la Conversions API) | Connecte ton compte Business, puis choisis ou crée ton pixel. Aucun code à coller. |
| **TikTok Pixel + Events API** | Applications › « TikTok » (app officielle) › Connecter ton compte TikTok For Business › Pixel : choisis le niveau **Maximum** | Rien à coller, tout se fait par la connexion du compte. |
| **GA4** | Applications › « Google & YouTube » › Connecter le compte Google › Google Analytics : sélectionne la propriété GA4 | L'ID de mesure `G-XXXXXXX` est relié automatiquement. |
| Google Search Console | via l'app Google & YouTube, ou une balise de validation dans Préférences | — |

Ces canaux natifs passent par les **Customer Events** de Shopify et respectent automatiquement le consentement aux cookies.

## Bannière cookies (RGPD et CNIL)

1. Paramètres › **Confidentialité des clients** › Bannière de cookies › Activer pour l'Europe.
2. Région : « Espace économique européen et Royaume-Uni ».
3. Boutons **Accepter** et **Refuser** au même niveau : c'est l'option par défaut de Shopify, ne masque pas le bouton Refuser.
4. Texte conseillé : « On utilise des cookies pour faire fonctionner la boutique et, avec ton accord, pour mesurer l'audience et te montrer des publicités adaptées. Tu peux changer d'avis à tout moment. »
5. Lien vers `/pages/confidentialite-et-cookies`.

Le pop-up de bienvenue attend que la cliente ait fait son choix sur cette bannière avant de s'afficher.
