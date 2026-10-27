# Visuels produits VELEA

15 visuels carrés en 3000 × 3000 px pour les fiches produits : 7 pour la ceinture, 4 pour la culotte et 4 pour les serviettes. `planche-creatives.jpg` les montre tous ensemble.

- Tous les textes viennent des fiches produits Shopify (description et champs méta) : aucune donnée inventée.
- Les visuels de la ceinture utilisent la photo de la bannière de la boutique. Les schémas (boîtier coté, culotte, serviettes) sont des illustrations et sont présentés comme telles.
- `manifest.json` donne, pour chaque fichier, le produit et le texte alternatif utilisé dans Shopify.

## Régénérer les visuels

```sh
cd docs/creatives/source
npm install
node gen.js                     # tous les visuels, dans source/out/
ONLY=culotte node gen.js        # seulement ceux dont l'identifiant commence par « culotte »
```

Le rendu utilise le Chromium de Playwright (`/opt/pw-browsers/chromium` dans l'environnement d'origine ; modifier `executablePath` dans `gen.js` si besoin).
