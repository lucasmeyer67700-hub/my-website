(function () {
  document.documentElement.classList.add('js');

  // Apparition douce des blocs au défilement
  var items = document.querySelectorAll('.v-reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Sélecteur de quantité
  document.querySelectorAll('[data-qty]').forEach(function (wrap) {
    var input = wrap.querySelector('input');
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-step]');
      if (!btn) return;
      var v = Math.max(1, Math.min(10, (parseInt(input.value, 10) || 1) + Number(btn.dataset.step)));
      input.value = v;
    });
  });

  // Barre d'achat : visible quand le bloc d'achat n'est plus à l'écran
  var sticky = document.querySelector('[data-sticky]');
  var buy = document.getElementById('ceinture');
  var hero = document.querySelector('.v-hero');
  if (sticky && buy && 'IntersectionObserver' in window) {
    var state = { buy: false, hero: true };
    var update = function () { sticky.classList.toggle('is-visible', !state.buy && !state.hero); };
    new IntersectionObserver(function (e) { state.buy = e[0].isIntersecting; update(); }).observe(buy);
    if (hero) new IntersectionObserver(function (e) { state.hero = e[0].isIntersecting; update(); }, { threshold: 0.35 }).observe(hero);
    else state.hero = false;
  }

  // Une seule question ouverte à la fois dans la FAQ
  var accs = document.querySelectorAll('.v-acc');
  accs.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) accs.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  // Menu mobile
  var drawer = document.getElementById('v-drawer');
  var burger = document.querySelector('[data-drawer-open]');
  var hideTimer;
  function setDrawer(open) {
    if (!drawer) return;
    clearTimeout(hideTimer);
    if (open) { drawer.hidden = false; requestAnimationFrame(function () { drawer.classList.add('is-open'); }); }
    else { drawer.classList.remove('is-open'); hideTimer = setTimeout(function () { drawer.hidden = true; }, 350); }
    document.documentElement.classList.toggle('v-lock', open);
    if (burger) burger.setAttribute('aria-expanded', open);
  }
  if (burger) burger.addEventListener('click', function () { setDrawer(true); });
  document.querySelectorAll('[data-drawer-close]').forEach(function (el) { el.addEventListener('click', function () { setDrawer(false); }); });

  // Recherche
  var search = document.getElementById('v-search');
  var searchBtn = document.querySelector('[data-search-open]');
  function setSearch(open) {
    if (!search) return;
    search.hidden = !open;
    if (searchBtn) searchBtn.setAttribute('aria-expanded', open);
    if (open) search.querySelector('input[type=search]').focus();
  }
  if (searchBtn) searchBtn.addEventListener('click', function () { setSearch(search.hidden); });
  document.querySelectorAll('[data-search-close]').forEach(function (el) { el.addEventListener('click', function () { setSearch(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setDrawer(false); setSearch(false); } });

  // Galerie produit : miniatures et défilement
  document.querySelectorAll('[data-gallery]').forEach(function (g) {
    var track = g.querySelector('[data-gallery-track]');
    var thumbs = g.querySelectorAll('[data-gallery-thumb]');
    if (!track || !thumbs.length) return;
    thumbs.forEach(function (t) {
      t.addEventListener('click', function () {
        track.scrollTo({ left: track.clientWidth * Number(t.dataset.galleryThumb), behavior: 'smooth' });
      });
    });
    var raf;
    track.addEventListener('scroll', function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        var i = Math.round(track.scrollLeft / track.clientWidth);
        thumbs.forEach(function (t, n) { t.classList.toggle('is-active', n === i); });
      });
    }, { passive: true });
  });

  // Variantes et état de chargement du bouton d'ajout
  document.querySelectorAll('form[action*="/cart/add"]').forEach(function (form) {
    var select = form.querySelector('[data-variant-select]');
    if (select) select.addEventListener('change', function () { form.querySelector('input[name="id"]').value = select.value; });
    form.addEventListener('submit', function () {
      var btn = form.querySelector('[data-add-btn]');
      if (btn) { btn.classList.add('is-loading'); btn.setAttribute('aria-busy', 'true'); }
    });
  });

  // Retour arrière : on réactive les boutons
  window.addEventListener('pageshow', function () {
    document.querySelectorAll('[data-add-btn].is-loading').forEach(function (b) { b.classList.remove('is-loading'); b.removeAttribute('aria-busy'); });
  });
})();
