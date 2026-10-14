# VELEA · Récapitulatif et lancement

## Ce qui a été fait dans Shopify

**Catalogue**
- Ceinture chauffante Cocon : prix passé de 39,90 € à **44,90 €** (sans prix barré), nom, description au tutoiement, SEO, champs personnalisés remplis.
- Nouveaux produits **en brouillon** :
  - Patchs chauffants Cocon : 12,90 € la boîte, 34,90 € le lot de 3 ;
  - Coussin chauffant Doudou : 29,90 € ;
  - Pack Cocon : 59,90 €.
  Ils n'ont pas encore de photos.
- 8 champs personnalisés produit (`velea.*`) : bénéfices, caractéristiques, utilisation, sécurité, informations GPSR, FAQ produit, « Pourquoi elles l'adorent », badge.
- Collection automatique **Tous nos produits** (marque = VELEA).

**Contenus**
- Pages passées au tutoiement : FAQ, Contact, Suivi de commande, Notre histoire, Livraison et retours. Les pages juridiques restent au vouvoiement.
- Nouvelle page **Formulaire de rétractation** (modèle légal).
- Blog renommé **Le Journal**, avec 3 articles SEO publiés (environ 1 200 mots chacun, FAQ en fin d'article, avertissement santé).
- Balises SEO sur la collection, les pages et les articles.
- 2 nouveaux menus pour le nouveau thème : `menu-cocon` et `footer-cocon`. **Les menus de ton site en ligne n'ont pas été modifiés.**

**Thème « VELEA – Cocon premium (brouillon) »**, une copie non publiée de ton thème actuel. Rien n'a changé en ligne.
- Palette du brief, avec des contrastes AA vérifiés. Les boutons sont en `#A9604F` : le `#C67B68` ne passait pas avec du texte blanc.
- Polices Fraunces et DM Sans.
- Page produit :
  - bénéfices et accordéons alimentés par les champs personnalisés ;
  - bloc **Informations produit (GPSR)** ;
  - sélecteur « La ceinture seule / Pack Cocon » ;
  - mention de paiement en plusieurs fois, si tu l'actives ;
  - « Pourquoi elles l'adorent » ;
  - « Complète ton cocon », avec ajout au panier en un clic.
- Modèle **product.simple** pour les patchs, le coussin et le pack.
- Accueil : hero « Tes règles ne devraient pas te clouer au lit », « Tu te reconnais ? », bénéfices, mode d'emploi, grille produits, comparatif ceinture / bouillotte / antidouleur (sans dénigrer), avis (masqués tant qu'il n'y en a pas), vidéos clientes (masquées tant que vides), histoire, garantie, FAQ, newsletter -10 % avec consentement.
- **Pop-up de bienvenue** : il s'affiche après 8 s ou à l'intention de sortie, une seule fois, après le choix sur les cookies, et se ferme avec Échap.
- **Tiroir panier** : barre vers la livraison offerte (seuil réglable) et suggestion des patchs en un clic.
- Page 404 personnalisée, données structurées Organization et BreadcrumbList, section avis compatible avec les apps (Judge.me).

**Dans le dépôt GitHub** (branche `claude/funny-hawking-1prrai`) : le code du thème dans `theme/`, et les documents `docs/BRAND.md`, `IMAGES.md`, `EMAILS.md`, `AUTOMATISATIONS.md`, `SEO-TRACKING.md` et ce fichier.

## Ce que je n'ai pas pu faire, et pourquoi

| Point | Raison | À faire |
|---|---|---|
| Vérifier le rendu en prévisualisation (mobile 375 px et ordinateur 1440 px) | le réseau de la session bloque l'accès à ta boutique en ligne | Boutique en ligne › Thèmes › « VELEA – Cocon premium » › **Aperçu**, sur ton téléphone et ton ordinateur |
| Scores Lighthouse | même raison | Lance PageSpeed Insights sur l'URL d'aperçu |
| Shopify Flow, Klaviyo, Judge.me, apps de tracking | ces apps s'installent et se configurent depuis l'admin | pas-à-pas dans AUTOMATISATIONS.md et SEO-TRACKING.md |
| Code BIENVENUE10 | à confirmer : qui y a droit et à partir de quand | dis-moi « crée le code » et je le fais |
| Photos produits | aucune photo fournie pour les patchs, le coussin et le pack | IMAGES.md |
| Page de remerciement après commande | sur le forfait Basic, la page de remerciement ne se personnalise que par des blocs d'app (Paramètres › Paiement › Personnaliser) | ajoute un bloc « Texte » : « Merci 💕 Ton cocon se prépare. » |

## Tous les [À COMPLÉTER]

| Où | Quoi |
|---|---|
| Ceinture › champs Caractéristiques | températures, temps de charge, autonomie, durée de l'arrêt automatique, tour de taille, matières, dimensions et poids |
| Ceinture › Utilisation | mode d'entretien de la housse |
| Ceinture › FAQ produit | autonomie de la batterie |
| Patchs › description et champs | durée de chaleur, température, composition, dimensions, mode d'élimination |
| Coussin › description et champs | mode de chauffe, matière, dimensions, housse lavable, entretien |
| Pack › GPSR | fabricant de la pochette |
| Tous les produits › GPSR | nom, adresse et e-mail du fabricant, personne responsable dans l'UE, marquage CE |
| Page Notre histoire | ton histoire vraie, le pays de fabrication |
| Page FAQ | batterie, colis discret ou non |
| Section FAQ (accueil, FAQ) › « Comment la recharger ? » | autonomie |
| Mentions légales | nom ou raison sociale, statut, SIRET, TVA, directeur de la publication, médiateur |
| CGV, formulaire de rétractation | nom ou raison sociale, SIRET |
| E-mail de bienvenue n° 2 | l'histoire de la marque |

⚖️ **Les pages juridiques sont des modèles. Fais-les relire par un professionnel** (avocat ou juriste) avant d'ouvrir les ventes.

## Ta checklist à toi

**Avant tout**
- [ ] Demande au fournisseur, pour la ceinture et le coussin : déclaration UE de conformité, marquage CE, rapports de test (sécurité électrique, CEM, batterie lithium : UN 38.3, IEC 62133), notice en français. Pour les patchs : fiche de données de sécurité et composition.
- [ ] Inscris-toi à un éco-organisme pour les DEEE et les piles (ecosystem, par exemple) et récupère ton identifiant unique (IDU).
- [ ] Choisis un médiateur de la consommation (CM2C, Médicys…).
- [ ] Remplis tous les [À COMPLÉTER].

**Boutique**
- [ ] Photos : IMAGES.md. Ajoute-les aux produits, puis **publie** les patchs, le coussin et le pack (statut Actif).
- [ ] Stock : renseigne les quantités et active le suivi de stock.
- [ ] Paramètres › Paiements : active Shopify Payments (carte, Apple Pay, Google Pay), PayPal, et le paiement en 3 ou 4 fois (Klarna ou Alma via leurs apps, selon ce qui est disponible pour ta boutique).
- [ ] Paramètres › Expédition : Colissimo à domicile et Mondial Relay (app « Mondial Relay – Boxtal » ou équivalente), avec des délais affichés honnêtement.
- [ ] Paramètres › Marchés : France active, euro, prix TTC.
- [ ] Domaine : achète `velea.fr` ou `.com`, puis Paramètres › Domaines.
- [ ] Réductions : crée **BIENVENUE10**, ou demande-le-moi.
- [ ] Applications : Shopify Flow, Klaviyo, Judge.me, Facebook & Instagram, TikTok, Google & YouTube, Shopify Inbox.
- [ ] Bannière cookies : SEO-TRACKING.md.
- [ ] Vérifie le nouveau thème en aperçu, puis **publie-le** quand tout te plaît. Remplace aussi le menu en ligne si besoin.

## 5 angles publicitaires TikTok et Meta

Toutes les pubs restent dans le cadre du **confort et du bien-être**, sans promesse médicale, sans faux avant/après et avec de vraies personnes.

### 1. « La bouillotte froide »
- **Hook (0-3 s) :** gros plan sur une bouillotte qu'on retourne, toute plate. Texte : « POV : ta bouillotte est déjà froide et ta journée commence à peine. »
- **Script (25 s) :** « Les crampes, je connais. La bouillotte qui refroidit en 20 minutes, aussi. Alors j'ai testé ça : une ceinture qui chauffe toute seule, en 3 niveaux, avec un petit massage. Elle se recharge comme mon téléphone, et je peux bouger avec. Là je cuisine, je bosse, je vis, bien au chaud. » CTA : « Ton cocon pendant tes règles. Lien en bio. »
- **Visuel à tourner :** cuisine ou salon, lumière naturelle. Plan bouillotte, puis ceinture qu'on attache, puis activités du quotidien.

### 2. « Personne ne voit rien »
- **Hook :** une femme au bureau en visio. Texte : « Tu ne devinerais jamais ce que j'ai sous mon pull. »
- **Script (20 s) :** elle soulève le pull et montre la ceinture. « Ma ceinture chauffante. Sans fil, silencieuse, et personne ne la voit. Je ne mets plus ma vie entre parenthèses ces jours-là. »
- **Visuel :** bureau, open space ou café. Plan serré sur la discrétion.

### 3. « Le rituel du soir » (esthétique, pour Instagram et Reels)
- **Hook :** ASMR, bruit de bouilloire et plaid qu'on déplie. Texte : « Mon rituel pendant mes règles 🌙 »
- **Script (30 s) :** voix douce. Infusion, lumière tamisée, coussin Doudou contre le ventre, ceinture, respiration. « Je ralentis. Mon corps travaille, j'ai le droit de prendre soin de moi. »
- **Visuel :** chambre aux tons crème et rose, bougie, plaid. Format 9:16, plans lents.

### 4. « 3 choses que j'aurais aimé savoir »
- **Hook :** face caméra. « 3 choses que j'aurais aimé savoir plus tôt sur mes règles douloureuses. »
- **Script (30 s) :** « 1 : la chaleur aide vraiment les muscles à se relâcher. 2 : bouger un peu, doucement, peut faire du bien. 3 : avoir TRÈS mal n'est pas normal, il faut en parler à un médecin. Et pour la chaleur au quotidien, j'utilise ça. » Montre la ceinture.
- **Visuel :** face caméra, ton complice, texte à l'écran. Un format éducatif inspire confiance.

### 5. « Le kit voyage »
- **Hook :** une valise ouverte. Texte : « Règles + week-end = panique ? Plus maintenant. »
- **Script (20 s) :** elle remplit sa pochette : ceinture, patchs, protections. « La ceinture pour l'hôtel, les patchs pour la journée, et je suis prête. Le Pack Cocon. »
- **Visuel :** chambre, valise, gare ou voiture. Met en avant le panier moyen (Pack Cocon).

**Conseils :** teste 3 hooks différents pour chaque angle, en sous-titrant toujours. Pense aux créatrices UGC (contrat et droits d'usage signés). Sur Meta, utilise la catégorie « santé et bien-être » avec prudence : évite de cibler par l'âge ou une condition médicale dans le texte (« Tu souffres d'endométriose ? » est interdit).

## Checklist de lancement

- [ ] Tous les [À COMPLÉTER] remplis, pages juridiques relues.
- [ ] Documents du fournisseur reçus (CE, notice FR, tests batterie) et éco-organisme en place.
- [ ] Photos et vidéos en ligne, textes alternatifs remplis.
- [ ] Nouveau thème vérifié sur mobile et ordinateur, puis publié.
- [ ] Lighthouse mobile au-dessus de 85 sur l'accueil et la page produit (PageSpeed Insights).
- [ ] **Commande test** de bout en bout (Paramètres › Paiements › mode test, ou commande réelle remboursée).
- [ ] E-mails testés : confirmation, expédition, bienvenue, panier abandonné (fais-toi un panier abandonné).
- [ ] Code BIENVENUE10 testé au paiement.
- [ ] Pixels vérifiés : Meta Events Manager › Tester les événements, TikTok Pixel Helper, GA4 › Temps réel.
- [ ] Bannière cookies : « Refuser » ne déclenche aucun pixel.
- [ ] Données structurées testées (Rich Results Test), sitemap soumis à Search Console.
- [ ] Stock renseigné, alertes Flow actives.
- [ ] Domaine connecté, SSL actif, e-mail d'expéditeur authentifié.
- [ ] **Mot de passe retiré** : Boutique en ligne › Préférences › Protection par mot de passe.
- [ ] Première pub lancée sur un petit budget de test (par exemple 20 à 30 € par jour, par angle).
