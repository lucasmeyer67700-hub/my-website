# VELEA · Automatisations

## Shopify Flow

Flow est gratuit sur ton forfait Basic. Installe l'app : Shopify Admin › Applications › boutique d'apps › « Shopify Flow » › Installer. Ensuite, dans Flow : **Créer un flux de travail**.

Les noms entre parenthèses sont ceux de l'interface anglaise.

### Flux 1 · Taguer selon les achats
- **Déclencheur :** Commande créée (*Order created*)
- **Pour chaque** article de la commande (*For each* › `order.lineItems`) :
  - **Condition :** `lineItem.product.handle` est égal à `ceinture-chauffante-regles` → **Action :** Ajouter des balises client (*Add customer tags*) : `achat-ceinture`
  - **Condition :** handle = `patchs-chauffants-regles` → balise `achat-patchs`
  - **Condition :** handle = `pack-cocon` → balises `achat-pack`, `achat-ceinture`, `achat-patchs`
  - **Condition :** handle = `coussin-chauffant-doudou` → balise `achat-doudou`

### Flux 2 · Alerte stock bas
- **Déclencheur :** Quantité en stock modifiée (*Inventory quantity changed*)
- **Condition :** `inventoryLevel.quantities` disponible ≤ **15**, et la quantité précédente > 15
- **Action :** Envoyer un e-mail interne (*Send internal email*) à velea.officiel@gmail.com
  - Objet : `Stock bas : {{ product.title }} ({{ productVariant.title }})`
  - Message : `Il reste {{ inventoryLevel.quantities... }} unités. Pense à recommander au fournisseur.`
- ⚠️ Le suivi de stock doit être activé sur les variantes. Actuellement la ceinture est à 0 en stock : renseigne les quantités dans Produits › Stock avant le lancement.

### Flux 3 · Clientes VIP
- **Déclencheur :** Commande créée
- **Condition :** `order.customer.numberOfOrders` ≥ **2**
- **Action :** Ajouter des balises client : `VIP`
- (Facultatif) **Action :** Envoyer un e-mail interne « Nouvelle cliente VIP », pour lui écrire un mot personnel.

### Flux 4 · Commandes à risque
- **Déclencheur :** Analyse de risque de commande terminée (*Order risk analyzed*)
- **Condition :** niveau de risque = **Élevé** (*HIGH*)
- **Actions :** Ajouter une balise de commande `risque-eleve`, Envoyer un e-mail interne « Commande à vérifier avant expédition : {{ order.name }} »
- ❌ N'annule pas automatiquement : vérifie à la main.

### Flux 5 · Flux de rachat des patchs
- **Déclencheur :** Commande créée
- **Condition :** un article a le handle `patchs-chauffants-regles` ou `pack-cocon`
- **Action :** Ajouter des balises client : `rachat-patchs`
- Le flux Klaviyo « Rachat des patchs » (EMAILS.md §5) se base sur ce produit ou cette balise.

---

## App d'avis

**Recommandation : Judge.me** (« Judge.me Product Reviews »). Le plan gratuit gère les avis avec photos, la demande d'avis automatique, les étoiles Google (données structurées) et la compatibilité avec ton thème.

1. Applications › boutique d'apps › Judge.me › Installer.
2. Judge.me › Paramètres › Demande d'avis : délai **10 jours après livraison** (ou après exécution), texte de EMAILS.md §4.3.
3. Éditeur de thème › page produit › section **VELEA · Avis clients** › Ajouter un bloc › choisis le bloc d'app Judge.me. La section reste masquée tant qu'elle est vide.
4. N'importe **aucun** avis d'une autre boutique ou d'AliExpress présenté comme un avis VELEA.

---

## Suivi de commande pour la cliente

- C'est natif : l'e-mail d'expédition contient le lien de suivi dès que tu saisis le numéro au moment d'expédier.
- La page `/pages/suivi-de-commande` explique la marche à suivre. Elle est déjà publiée.
- (Facultatif) Si tu veux une page où la cliente tape son numéro de commande : installe l'app gratuite « Shopify Order Status » ou « Parcel Panel », puis remplace le lien dans le menu.

## Réponse automatique au formulaire de contact

Shopify n'envoie pas d'accusé de réception natif pour le formulaire de contact. Deux options :
1. **Simple :** dans ta messagerie (Gmail : Paramètres › Filtres), crée une réponse automatique sur les e-mails reçus avec l'objet « Nouveau message client ».
2. **Mieux :** installe **Shopify Inbox** (gratuit). Messages automatiques : « Merci pour ton message 💕 Une vraie personne de l'équipe VELEA te répond en français sous 24 heures ouvrées. En attendant, notre FAQ a peut-être déjà ta réponse : /pages/faq ».

## Réductions

| Code | Usage | Statut |
|---|---|---|
| `BIENVENUE10` | -10 % sur la première commande (pop-up + newsletter) | **À créer** (Réductions › Créer › Montant de réduction sur la commande, 10 %, 1 utilisation par cliente) |
| Pack Cocon | c'est un produit à 59,90 € : pas de remise automatique nécessaire | ✅ |
| Lot de 3 patchs | variante à 34,90 € au lieu de 3 × 12,90 € = 38,70 € | ✅ |

⚠️ **Pack Cocon et économie affichée :** ceinture 44,90 € + patchs 12,90 € = 57,80 €, pour un pack à 59,90 €. Le pack inclut la pochette, mais elle n'est pas vendue seule et n'a donc pas de prix de référence. **Aucune économie n'est affichée**, et le badge est « Notre préféré » plutôt que « Meilleure offre ». Pour afficher une vraie économie, baisse le pack (par exemple 54,90 €) ou vends la pochette séparément.
