/*
 * Panier premium
 * - <pp-eta> : dates de livraison réelles (jours ouvrés) dans la frise du panier
 * - ppAddToCart(items) : ajout au panier sans rechargement, puis ouverture du panier coulissant
 * - Boutons « Ajouter » des suggestions du panier et formulaires .pp-ajax-add
 */
(function () {
  function addBusinessDays(date, n) {
    var d = new Date(date);
    while (n > 0) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() % 6 !== 0) n--;
    }
    return d;
  }

  if (!customElements.get('pp-eta')) {
    customElements.define('pp-eta', class extends HTMLElement {
      connectedCallback() {
        var out = this.querySelector('[data-pp-eta-range]');
        if (!out) return;
        var fmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
        var now = new Date();
        out.textContent = 'Entre le ' + fmt.format(addBusinessDays(now, +this.dataset.min || 7)) + ' et le ' + fmt.format(addBusinessDays(now, +this.dataset.max || 14));
      }
    });
  }

  function cartDrawer() {
    return document.querySelector('cart-drawer');
  }

  window.ppAddToCart = async function (items) {
    var drawer = cartDrawer();
    var root = (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';
    var body = { items: items };
    if (drawer && drawer.getSectionsToRender) {
      body.sections = drawer.getSectionsToRender().map(function (s) { return s.id; });
      body.sections_url = window.location.pathname;
    }
    var res = await fetch(root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    var data = await res.json();
    if (!res.ok || data.status) throw new Error(data.description || data.message || 'Erreur panier');
    if (drawer && data.sections) {
      drawer.classList.remove('is-empty');
      data.id = items[0].id;
      drawer.renderContents(data);
    } else {
      window.location.href = (window.routes && routes.cart_url) || '/cart';
    }
    return data;
  };

  // Suggestions du panier : la vignette suit le coloris choisi
  window.ppUpsellSwap = function (sel) {
    var opt = sel.selectedOptions[0];
    var img = sel.closest('.pp-upsell__item').querySelector('.pp-upsell__thumb img');
    if (img && opt && opt.dataset.img) { img.removeAttribute('srcset'); img.src = opt.dataset.img; }
  };
  document.addEventListener('click', async function (e) {
    var btn = e.target.closest('[data-pp-upsell-add]');
    if (!btn) return;
    var item = btn.closest('.pp-upsell__item');
    var id = +item.querySelector('[data-pp-upsell-variant]').value;
    btn.disabled = true;
    btn.classList.add('is-loading');
    try {
      await window.ppAddToCart([{ id: id, quantity: 1 }]);
    } catch (err) {
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  });

  // « Passer au pack » : ajoute la formule, puis retire une unité des articles qu'elle remplace
  document.addEventListener('click', async function (e) {
    var btn = e.target.closest('[data-pp-upgrade-add]');
    if (!btn) return;
    var box = btn.closest('[data-pp-upgrade]');
    var drawer = cartDrawer();
    var root = (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';
    var id = +box.querySelector('[data-pp-upgrade-variant]').value;
    var updates = {};
    try { updates = JSON.parse(box.dataset.remove || '{}'); } catch (err) { updates = {}; }
    btn.disabled = true;
    btn.classList.add('is-loading');
    try {
      var res = await fetch(root + 'cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: [{ id: id, quantity: 1 }] }),
      });
      if (!res.ok) throw new Error('add');
      var body = { updates: updates };
      if (drawer && drawer.getSectionsToRender) {
        body.sections = drawer.getSectionsToRender().map(function (s) { return s.id; });
        body.sections_url = window.location.pathname;
      }
      var up = await fetch(root + 'cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      var data = await up.json();
      if (drawer && data.sections) {
        data.id = id;
        drawer.renderContents(data);
      } else {
        window.location.reload();
      }
    } catch (err) {
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  });

  // Formulaires d'ajout rapide (vitrine, cartes) : ajout sans quitter la page
  document.addEventListener('submit', async function (e) {
    var form = e.target.closest('form.pp-ajax-add');
    if (!form || !cartDrawer()) return;
    e.preventDefault();
    var fd = new FormData(form);
    var btn = form.querySelector('[type="submit"]');
    if (btn) { btn.disabled = true; btn.classList.add('is-loading'); }
    try {
      await window.ppAddToCart([{ id: +fd.get('id'), quantity: +(fd.get('quantity') || 1) }]);
    } catch (err) {
      form.submit();
    } finally {
      if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); }
    }
  });
})();
