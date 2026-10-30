# Aperçus (jamais à publier tels quels)

## rendu-final-sans-details.patch
Copie Shopify : « VELEA aperçu rendu final – NE PAS PUBLIER » (faite à partir de la v28).
Changements par rapport à `theme/` :
- plus de « Caractéristiques annoncées par le fabricant » (accueil, fiche produit, mise en avant) ;
- 3 badges sous les boutons d'achat : livraison, satisfaite ou remboursée, garantie légale
  (fiche produit : remplacent les blocs « garantie » et « livraison », masqués) ;
- plus de « Comment les avis sont-ils sélectionnés ? » (attention : information légale si publié) ;
- plus de cadres photo vides côté clientes (visibles seulement dans l'éditeur) ;
- plus d'icône « personne » vide sur les avis sans prénom ;
- titre de l'accueil plus étroit sur PC 1440×900 / 1536×864 (ne chevauche plus la ceinture).

Réappliquer : `git apply previews/rendu-final-sans-details.patch`
