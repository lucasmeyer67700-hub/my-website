# Textes de la boutique (hors thème)

- `avant/` : les politiques Shopify et les pages telles qu'elles étaient le 28/10/2026, pour revenir en arrière.
- `apres/` : les nouvelles versions.

Déjà appliqué sur la boutique (Contenu > Pages) : `page-livraison-et-retours`, `page-suivi-de-commande`, `page-cgv`, `page-formulaire-de-retractation`.

À coller dans Shopify (Paramètres > Politiques), car l'accès aux politiques n'est pas autorisé par l'API :

| Politique Shopify | Fichier à coller |
|---|---|
| Politique de remboursement | `apres/politique-refund_policy.html` |
| Politique de confidentialité | `apres/politique-privacy_policy.html` |
| Conditions générales de vente | `apres/politique-terms_of_sale.html` |
| Conditions d'utilisation | `apres/politique-terms_of_service.html` |

Dans l'éditeur de la politique, cliquez sur le bouton `<>` (afficher le HTML), remplacez tout le texte par le contenu du fichier, puis enregistrez.
