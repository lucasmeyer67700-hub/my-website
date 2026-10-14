# VELEA · E-mails automatiques

## Quel outil ?

**Recommandation : Klaviyo**, avec le forfait gratuit au démarrage. Vérifie les plafonds actuels sur klaviyo.com.

| | Klaviyo | Shopify Email |
|---|---|---|
| Bienvenue, panier abandonné, après achat | ✅ | ✅ |
| Navigation abandonnée | ✅ | ✅ (selon le forfait) |
| **Rachat des patchs à J+25** | ✅ simple (flux « date de commande + délai », filtré sur le produit) | ⚠️ limité |
| Segmentation fine (acheteuses de patchs, VIP, inactives) | ✅ | ⚠️ basique |
| SMS | ✅ | ❌ |
| Coût au démarrage | gratuit jusqu'à un certain nombre de contacts | gratuit jusqu'à un volume d'e-mails mensuel |

Ton modèle repose sur le **rachat des patchs**, et Klaviyo gère ce flux sans bricolage. Si tu veux zéro outil externe au départ, Shopify Email suffit pour les flux 1 à 4. Tu passeras à Klaviyo au premier rachat.

**Installation :** Shopify Admin › Applications › boutique d'apps › « Klaviyo » › Installer. Ensuite : Intégrations › Shopify › coche « Synchroniser les abonnées » et « Activer le suivi sur site ».

**Règles communes :**
- expéditeur : VELEA <bonjour@ton-domaine.fr>, avec un domaine authentifié (SPF, DKIM, DMARC) ;
- envoi uniquement aux contacts qui ont consenti ;
- lien de désinscription dans chaque e-mail ;
- adresse postale en pied de mail ;
- aucune promesse médicale.

Variables : `{{ first_name|default:"" }}` (syntaxe Klaviyo). Le bouton principal s'appelle le CTA.

---

## 1. Série de bienvenue (déclencheur : inscription à la liste « Newsletter »)

### E-mail 1 · immédiat
- **Objet :** Bienvenue dans le cocon 💕 (ton -10 % est dedans)
- **Pré-header :** Ton code de bienvenue t'attend, et quelques mots de nous.
- **Contenu :**
  > Coucou {{ first_name|default:"toi" }},
  >
  > Bienvenue chez VELEA. Ici, on part d'une idée simple : tes règles ne devraient pas te clouer au lit.
  >
  > Pour te souhaiter la bienvenue, voici ton code : **BIENVENUE10**. Il te donne -10 % sur ta première commande.
  >
  > Notre ceinture chauffante enveloppe ton ventre d'une chaleur douce et d'un léger massage. Sans fil, elle te suit du canapé au bureau.
  >
  > Prends soin de toi,
  > L'équipe VELEA
- **CTA :** Découvrir la ceinture → /products/ceinture-chauffante-regles

### E-mail 2 · J+2
- **Objet :** Pourquoi on a créé VELEA
- **Pré-header :** Une bouillotte froide, et l'envie de mieux.
- **Contenu :**
  > Chaque mois, c'était la même chose : la bouillotte qui refroidit en 20 minutes, la journée à tenir quand même, et ce « ça va passer » qu'on finit par se répéter.
  >
  > [À COMPLÉTER : 3 ou 4 phrases vraies sur l'origine de la marque.]
  >
  > On a voulu un objet doux, beau et pratique, et une marque honnête : pas de miracle, pas de faux avis. Juste du réconfort, et 30 jours pour essayer.
  >
  > Ton code BIENVENUE10 est toujours valable.
- **CTA :** Lire notre histoire → /pages/notre-histoire

### E-mail 3 · J+5
- **Objet :** 3 gestes doux pour tes prochaines règles
- **Pré-header :** Simples, gratuits, et ils font du bien.
- **Contenu :**
  > 1. **La chaleur, dès les premiers signes.** N'attends pas que la crampe s'installe : 30 minutes à 1 heure, 2 à 3 fois par jour.
  > 2. **5 minutes de respiration.** Une main sur le ventre : inspire 4 secondes, expire 6 secondes.
  > 3. **Un mouvement très doux.** Posture de l'enfant, puis genoux contre la poitrine.
  >
  > Tous nos conseils sont dans le Journal. Et si tu veux la chaleur sans rester allongée, la ceinture est faite pour ça.
  >
  > *En cas de douleurs intenses ou inhabituelles, consulte un professionnel de santé.*
- **CTA :** Je découvre la ceinture (-10 % avec BIENVENUE10)

**Condition de sortie :** a passé une commande.

---

## 2. Panier abandonné (déclencheur : « Checkout commencé », sans commande)

### Relance 1 · après 1 h
- **Objet :** Ton cocon t'attend 🧸
- **Pré-header :** On a gardé ton panier au chaud.
- **Contenu :**
  > Tu as laissé quelque chose de doux dans ton panier. Pas de souci, il est toujours là.
  >
  > [Bloc produit dynamique du panier]
  >
  > ✔ Livraison offerte · ✔ 30 jours satisfaite ou remboursée · ✔ Paiement sécurisé
- **CTA :** Reprendre mon panier

### Relance 2 · après 24 h
- **Objet :** Une question avant de craquer ?
- **Pré-header :** On te répond, en vrai, sous 24 h.
- **Contenu :**
  > Tu hésites ? C'est normal. Voici ce qu'on nous demande le plus souvent :
  >
  > – **On la voit sous les vêtements ?** Non, elle se glisse sous un pull.
  > – **Ça chauffe trop ?** 3 niveaux et un arrêt automatique.
  > – **Et si ça ne me va pas ?** 30 jours pour la renvoyer, et on te rembourse.
  >
  > Une autre question ? Réponds simplement à cet e-mail.
- **CTA :** Reprendre mon panier

### Relance 3 · après 48 h
- **Objet :** Dernier petit mot de notre part
- **Pré-header :** Ton panier ne restera pas éternellement.
- **Contenu :**
  > On ne va pas t'embêter plus longtemps. Si le moment est venu de prendre soin de toi pendant tes règles, ton panier est là.
  >
  > *(Facultatif, à n'activer que si tu le veux vraiment : un code PANIER5 de -5 %, valable 48 h. Ne mets jamais de faux compte à rebours.)*
- **CTA :** Finaliser ma commande

---

## 3. Navigation abandonnée (déclencheur : « A consulté un produit », sans ajout au panier, 2 h après)
- **Objet :** Elle t'a tapé dans l'œil ?
- **Pré-header :** La ceinture chauffante, en quelques mots.
- **Contenu :**
  > Tu regardais [nom du produit]. En résumé :
  >
  > – une chaleur douce réglable sur 3 niveaux ;
  > – un massage par vibration ;
  > – sans fil, discrète sous tes vêtements.
  >
  > Et 30 jours pour l'essayer pendant tes règles.
- **CTA :** Revoir le produit

**Filtre :** pas d'e-mail de ce flux depuis 7 jours, et n'a pas commandé.

---

## 4. Après achat (déclencheur : « Commande passée »)

### E-mail 1 · immédiat (en plus de la confirmation Shopify)
- **Objet :** Merci {{ first_name|default:"" }} 💕 Ton cocon se prépare
- **Pré-header :** Ce qui se passe maintenant.
- **Contenu :**
  > Merci pour ta confiance. Ta commande est entre de bonnes mains.
  >
  > Tu reçois ton numéro de suivi dès l'expédition. Compte 7 à 14 jours ouvrés.
  >
  > Pendant ce temps, on t'a préparé un petit guide pour bien démarrer : il arrive avec ton colis.
- **CTA :** Suivre ma commande → /pages/suivi-de-commande

### E-mail 2 · à la livraison (ou J+10 si l'événement n'est pas disponible)
- **Objet :** Ton mode d'emploi douceur
- **Pré-header :** 4 étapes, et c'est parti.
- **Contenu :**
  > 1. Recharge complètement la ceinture avant la première utilisation.
  > 2. Porte-la par-dessus un vêtement fin, sur le ventre ou le bas du dos.
  > 3. Commence par le niveau le plus doux.
  > 4. 30 minutes à 1 heure, 2 à 3 fois par jour, et ne t'endors pas avec.
  >
  > Un souci ? Réponds à cet e-mail, on est là.
- **CTA :** Voir les conseils

### E-mail 3 · J+10 après la livraison · demande d'avis (envoyé par l'app d'avis)
- **Objet :** Alors, ce premier cocon ?
- **Pré-header :** Ton avis aide d'autres femmes à choisir.
- **Contenu :**
  > Ça fait quelques jours que tu as reçu ta commande. On aimerait vraiment savoir ce que tu en penses, le meilleur comme le moins bon.
  >
  > Ton avis sera publié tel quel : on ne modifie et on ne supprime aucun avis négatif.
- **CTA :** Laisser mon avis

*(Récompenser un avis est possible, à condition de le faire pour tous les avis, positifs comme négatifs, et de l'indiquer. Ne récompense jamais uniquement les avis positifs.)*

---

## 5. Rachat des patchs (déclencheur : commande contenant « Patchs chauffants », J+25)
- **Objet :** Tes prochaines règles arrivent bientôt 🌙
- **Pré-header :** Ton stock de patchs est prêt ?
- **Contenu :**
  > Coucou {{ first_name|default:"" }},
  >
  > Si ton cycle suit son rythme, tes prochaines règles ne sont plus très loin. Tu as encore des patchs dans ton sac ?
  >
  > Pour ne plus y penser, le **lot de 3 boîtes** te couvre environ 3 cycles, à un meilleur prix.
- **CTA :** Je refais mon stock → /products/patchs-chauffants-regles

**Rappel à J+55** (si pas de rachat) : même e-mail, avec l'objet « Un petit rappel tout doux ».

---

## 6. Relance des inactives (déclencheur : dernière commande il y a 120 jours, segment)
- **Objet :** On pense à toi
- **Pré-header :** Du nouveau dans le cocon.
- **Contenu :**
  > Ça fait un moment ! On espère que tes derniers cycles se sont passés en douceur.
  >
  > Depuis, on a [nouveauté ou article du Journal]. Et si tu as besoin de refaire ton stock de patchs, tout est là.
  >
  > Tu ne veux plus recevoir nos e-mails ? Aucun souci, le lien de désinscription est juste en dessous.
- **CTA :** Voir les nouveautés
- **Ensuite :** sans ouverture après 2 relances, supprime le contact de la liste marketing pour préserver ta délivrabilité.

---

## 7. Notifications Shopify à personnaliser

Shopify Admin › Paramètres › Notifications › Notifications clientes. Commence par « Personnaliser le modèle d'e-mail » : logo, couleur d'accent `#A9604F`, police par défaut.

| Notification | Phrase d'ouverture à mettre |
|---|---|
| Confirmation de commande | « Merci {{ customer.first_name }} 💕 Ton cocon est en préparation. Voici le récapitulatif de ta commande. » |
| Confirmation d'expédition | « Bonne nouvelle : ton colis est en route ! Suis-le en un clic ci-dessous. » |
| Livraison effectuée | « Ton cocon est arrivé. Recharge la ceinture avant la première utilisation, et prends soin de toi. » |
| Réponse au formulaire de contact | Cf. AUTOMATISATIONS.md |
