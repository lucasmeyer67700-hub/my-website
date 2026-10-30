// Pixel personnalisé Shopify — Google Ads, conversion « Achat »
// À coller dans : Paramètres > Événements clients > Ajouter un pixel personnalisé
// (nom : « Google Ads – Achat »), puis « Enregistrer » et « Connecter ».
// Autorisations du pixel : « Requis » = Marketing ; « Données de vente » = Données collectées.

const script = document.createElement('script');
script.async = true;
script.src = 'https://www.googletagmanager.com/gtag/js?id=AW-18546545893';
document.head.appendChild(script);

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'AW-18546545893');

// Commande validée : vrai montant, vraie devise, numéro de commande (pas de double comptage).
analytics.subscribe('checkout_completed', (event) => {
  const checkout = event.data.checkout;
  gtag('event', 'conversion', {
    send_to: 'AW-18546545893/7Rj-CKyngq8dEOWp14tF',
    value: Number(checkout.totalPrice?.amount ?? checkout.subtotalPrice?.amount ?? 0),
    currency: checkout.currencyCode || 'EUR',
    transaction_id: checkout.order?.id || checkout.token || '',
  });
});
