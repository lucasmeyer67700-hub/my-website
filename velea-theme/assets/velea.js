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
})();
