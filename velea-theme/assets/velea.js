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
  var hero = document.querySelector('.v-hero, .v-banner');
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
    form.querySelectorAll('[data-variant-radio]').forEach(function (r) {
      r.addEventListener('change', function () {
        form.querySelector('input[name="id"]').value = r.value;
        var n = form.querySelector('[data-swatch-name]'); if (n) n.textContent = r.dataset.name;
      });
    });
    form.addEventListener('submit', function () {
      var btn = form.querySelector('[data-add-btn]');
      if (btn) { btn.classList.add('is-loading'); btn.setAttribute('aria-busy', 'true'); }
    });
  });

  // Retour arrière : on réactive les boutons
  window.addEventListener('pageshow', function () {
    document.querySelectorAll('[data-add-btn].is-loading').forEach(function (b) { b.classList.remove('is-loading'); b.removeAttribute('aria-busy'); });
  });

  // Effet d'onde au clic sur les boutons
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest('.v-btn');
    if (!b || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
    var w = document.createElement('span');
    w.className = 'v-ripple';
    w.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
    b.appendChild(w);
    setTimeout(function () { w.remove(); }, 650);
  });

  // Apparition en cascade des éléments d'une même liste
  document.querySelectorAll('.v-steps, .v-faq, .v-buy__points, .v-infos').forEach(function (list) {
    Array.prototype.forEach.call(list.children, function (el, i) { el.classList.add('v-reveal'); el.style.transitionDelay = (i * 80) + 'ms'; if (io) io.observe(el); else el.classList.add('is-in'); });
  });

  // Assistant VELEA
  var bot = document.querySelector('[data-bot]');
  if (bot) {
    var panel = bot.querySelector('.v-bot__panel'), fab = bot.querySelector('.v-bot__fab');
    var log = bot.querySelector('[data-bot-log]'), form = bot.querySelector('[data-bot-form]'), input = form.querySelector('input');
    var kb = []; try { kb = JSON.parse(bot.querySelector('[data-bot-kb]').textContent); } catch (e) {}
    var norm = function (t) { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
    var say = function (html, who) {
      var p = document.createElement('p'); p.className = 'v-bot__msg v-bot__msg--' + who;
      if (who === 'me') p.textContent = html; else p.innerHTML = html;
      log.appendChild(p); log.scrollTop = log.scrollHeight;
    };
    var answer = function (q) {
      var n = norm(q), best = null, score = 0;
      kb.forEach(function (e) { var s = 0; e.k.forEach(function (k) { if (n.indexOf(norm(k)) > -1) s++; }); if (s > score) { score = s; best = e; } });
      return best ? best.a : 'Je n\'ai pas la réponse à cette question. Écrivez-nous via le <a href="/pages/contact">formulaire de contact</a>, nous vous répondrons par e-mail.';
    };
    var ask = function (q) {
      if (!q.trim()) return;
      say(q, 'me');
      var typing = document.createElement('p'); typing.className = 'v-bot__msg v-bot__msg--bot v-bot__typing'; typing.innerHTML = '<i></i><i></i><i></i>';
      log.appendChild(typing); log.scrollTop = log.scrollHeight;
      setTimeout(function () { typing.remove(); say(answer(q), 'bot'); }, 650);
    };
    var toggle = function () {
      var open = panel.hidden; panel.hidden = !open; fab.setAttribute('aria-expanded', open); bot.classList.toggle('is-open', open);
      if (open) setTimeout(function () { input.focus(); }, 50);
    };
    bot.querySelectorAll('[data-bot-toggle]').forEach(function (b) { b.addEventListener('click', toggle); });
    form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); input.value = ''; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) toggle(); });
    document.addEventListener('click', function (e) { if (!panel.hidden && !bot.contains(e.target)) toggle(); });
    bot.querySelectorAll('[data-q]').forEach(function (c) { c.addEventListener('click', function () { ask(c.textContent); }); });
  }

  // Barre d'annonce : un message à la fois, défilement automatique + flèche
  document.querySelectorAll('[data-announce]').forEach(function (bar) {
    var slides = bar.querySelectorAll('.v-announce__slide');
    if (slides.length < 2) return;
    var i = 0, delay = Number(bar.dataset.delay) || 3000, timer;
    var go = function () {
      var cur = slides[i]; cur.classList.remove('is-active'); cur.classList.add('is-out');
      setTimeout(function () { cur.classList.remove('is-out'); }, 520);
      i = (i + 1) % slides.length; slides[i].classList.add('is-active');
    };
    var start = function () { clearInterval(timer); if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(go, delay); };
    var next = bar.querySelector('[data-announce-next]');
    if (next) next.addEventListener('click', function () { go(); start(); });
    bar.addEventListener('mouseenter', function () { clearInterval(timer); });
    bar.addEventListener('mouseleave', start);
    start();
  });

  // Panier latéral : ouverture, ajout sans quitter la page, quantités
  var cd = document.getElementById('v-cart-drawer');
  var cdTimer;
  var setCd = function (open) {
    if (!cd) return;
    clearTimeout(cdTimer);
    if (open) { cd.hidden = false; requestAnimationFrame(function () { cd.classList.add('is-open'); }); }
    else { cd.classList.remove('is-open'); cdTimer = setTimeout(function () { cd.hidden = true; }, 350); }
    document.documentElement.classList.toggle('v-lock', open);
  };
  var refreshCd = function (count) {
    var badge = document.querySelector('[data-cart-count]');
    if (badge && typeof count === 'number') { badge.textContent = count; badge.hidden = count === 0; }
    if (document.querySelector('[data-cart-page]')) { location.reload(); return Promise.resolve(); }
    return fetch('/?section_id=velea-cart-drawer').then(function (r) { return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var fresh = doc.querySelector('[data-cd-inner]'), cur = cd && cd.querySelector('[data-cd-inner]');
      if (fresh && cur) cur.replaceWith(fresh);
    });
  };
  if (cd) {
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-cd-open]')) { e.preventDefault(); setCd(true); return; }
      if (e.target.closest('[data-cd-close]')) { setCd(false); return; }
      var b = e.target.closest('[data-cd-line]');
      if (!b) return;
      b.disabled = true;
      fetch('/cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ line: Number(b.dataset.cdLine), quantity: Math.max(0, Number(b.dataset.cdQty)) }) })
        .then(function (r) { return r.json(); }).then(function (c) { return refreshCd(c.item_count); })
        .catch(function () { location.href = '/cart'; });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !cd.hidden) setCd(false); });
    document.querySelectorAll('form[action*="/cart/add"]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        if (e.submitter && e.submitter.name === 'return_to') return;
        e.preventDefault();
        var btn = form.querySelector('[data-add-btn]');
        fetch('/cart/add.js', { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
          .then(function (r) { if (!r.ok) throw r; return fetch('/cart.js'); })
          .then(function (r) { return r.json(); })
          .then(function (c) { return refreshCd(c.item_count); })
          .then(function () { setCd(true); })
          .catch(function () { form.submit(); })
          .then(function () { if (btn) { btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy'); } });
      });
    });
  }

  // Résumé des avis : compteurs animés à l'apparition
  document.querySelectorAll('[data-rsum]').forEach(function (box) {
    var run = function () {
      box.classList.add('is-in');
      box.querySelectorAll('[data-count-to]').forEach(function (el) {
        var to = parseFloat(String(el.dataset.countTo).replace(',', '.')), dec = Number(el.dataset.decimals || 0), t0 = null;
        if (isNaN(to) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        var step = function (t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 1400); k = 1 - Math.pow(1 - k, 3);
          el.textContent = (to * k).toFixed(dec).replace('.', ','); if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
    };
    if (!('IntersectionObserver' in window)) return run();
    var o = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { run(); o.disconnect(); } }, { threshold: .4 });
    o.observe(box);
  });

  // Date de livraison estimée (jours ouvrés)
  document.querySelectorAll('[data-eta]').forEach(function (el) {
    var add = function (n) { var d = new Date(); while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) n--; } return d; };
    var f = function (d) { return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }); };
    var out = el.querySelector('[data-eta-out]');
    if (out) out.textContent = 'entre le ' + f(add(Number(el.dataset.min) || 0)) + ' et le ' + f(add(Number(el.dataset.max) || 0));
  });
})();
