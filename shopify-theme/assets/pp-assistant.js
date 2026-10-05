/*
 * Assistant de la boutique (section pp-assistant)
 *
 * Comprend la question du client sans service externe :
 *  - normalisation (accents, majuscules, ponctuation) et racinisation simple du français ;
 *  - synonymes (« colis », « expédition », « recevoir »… → livraison) ;
 *  - tolérance aux fautes de frappe (distance d'édition) ;
 *  - intentions courantes : salutations, remerciements, parler à quelqu'un, conseil selon
 *    la position de sommeil, prix d'un produit, ajout au panier ;
 *  - réponses de la FAQ saisie dans l'éditeur, avec suggestions de questions liées.
 * Les produits choisis dans la section sont connus (prix, lien, ajout au panier en un clic).
 * La conversation est conservée pendant la visite (sessionStorage).
 */
(function () {
  if (customElements.get('pp-dock')) return;

  // ---------- Langue ----------
  const STOP = new Set('a au aux avec ce ces cette de des du en est et il ils je la le les leur ma mais me mes mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes ton tu un une vos votre vous y c d j l m n s t est-ce quoi comment quel quelle quels quelles quand ou pourquoi ai as avez fait faire peux peut pouvez veux voudrais aimerais svp stp bien tres trop plus moins'.split(' '));
  const SUFFIXES = ['issements', 'issement', 'ements', 'ement', 'ations', 'ation', 'ables', 'able', 'euses', 'euse', 'eurs', 'eur', 'ions', 'ees', 'ez', 'er', 'es', 'ee', 'e', 's', 'x'];
  // racine -> concept
  const SYN = {
    livraison: 'livr livraison expedi expedition envoi envoy colis recev recu arriv delai transport poste chronopost relais',
    retour: 'retour retourn renvoi renvoy rembours satisf echang annul rendre',
    essai: 'essai essay tester test nuit',
    prix: 'prix combien cout coute couter tarif cher euro budget',
    remise: 'remise reduc reduction promo promotion code solde rabais offre pourcent',
    pack: 'pack lot ensemble duo combo bundle',
    oreiller: 'oreiller oreil coussin_tete papillon cervical nuque',
    genoux: 'genou genoux jambe hanche bassin',
    taie: 'taie housse_rechange rechange',
    lavage: 'lav lavage laver entretien entreten nettoy machine propre sale tache',
    paiement: 'pai paiement payer pay carte paypal cb visa mastercard apple google securis',
    suivi: 'suivi suivr tracking numero ou_est commande',
    odeur: 'odeur sent sentir pue chimique',
    habitude: 'habitu habitude adapt adaptation temps premier',
    couleur: 'couleur coloris noir gris vert teinte',
    taille: 'taille dimension mesure hauteur epaisseur haut grand petit',
    matiere: 'matiere mousse memoire tissu compos materiau',
    cote: 'cote lateral flanc',
    dos: 'dos',
    ventre: 'ventre',
    douleur: 'douleur mal douloureux torticolis raide raideur souffr cervicalgie migraine',
    humain: 'humain conseiller quelqu personne parler contact contacter appel appeler telephone mail email joindre sav service',
    salut: 'bonjour salut hello coucou bonsoir hey slt bjr yo',
    merci: 'merci super parfait top genial nickel cool ok',
    aurevoir: 'revoir bye ciao bonne_journee',
    acheter: 'achet acheter commander command ajout ajouter panier prendre'
  };
  const ROOT_TO_CONCEPT = {};
  Object.keys(SYN).forEach((c) => SYN[c].split(' ').forEach((w) => { ROOT_TO_CONCEPT[w.replace('_', ' ')] = c; }));

  function normalize(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’]/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function stem(w) {
    if (w.length <= 3) return w;
    for (const suf of SUFFIXES) if (w.endsWith(suf) && w.length - suf.length >= 3) return w.slice(0, -suf.length);
    return w;
  }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 3;
    const m = []; for (let i = 0; i <= a.length; i++) m[i] = [i];
    for (let j = 1; j <= b.length; j++) m[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  }
  function similar(token, key) {
    if (token === key) return true;
    if (key.length >= 4 && token.startsWith(key)) return true;
    if (token.length >= 4 && key.startsWith(token) && key.length - token.length <= 3) return true;
    const d = lev(token, key);
    return (key.length >= 5 && d <= 1) || (key.length >= 8 && d <= 2);
  }
  // Analyse une phrase : jetons, racines et concepts reconnus
  function analyse(text) {
    const norm = normalize(text);
    const tokens = norm.split(' ').filter(Boolean);
    const stems = tokens.filter((t) => !STOP.has(t) || /^\d+$/.test(t)).map(stem);
    const concepts = new Set();
    stems.forEach((s) => {
      for (const root in ROOT_TO_CONCEPT) {
        if (root.includes(' ')) continue;
        if (similar(s, stem(root))) concepts.add(ROOT_TO_CONCEPT[root]);
      }
    });
    for (const root in ROOT_TO_CONCEPT) if (root.includes(' ') && (' ' + norm + ' ').includes(' ' + root + ' ')) concepts.add(ROOT_TO_CONCEPT[root]);
    return { norm, tokens, stems, concepts };
  }

  // ---------- Composant ----------
  customElements.define('pp-dock', class extends HTMLElement {
    connectedCallback() {
      this.kb = JSON.parse(this.querySelector('[data-pp-kb]').textContent);
      this.panel = this.querySelector('.pp-dock__panel');
      this.toggle = this.querySelector('[data-pp-dock-toggle]');
      this.log = this.querySelector('[data-pp-log]');
      this.chips = this.querySelector('[data-pp-chips]');
      this.input = this.querySelector('#PpAssistantInput');
      this.delay = +this.dataset.delay || 600;
      this.asked = new Set();
      this.prepare();

      this.toggle.addEventListener('click', () => this.setOpen(this.panel.hidden));
      this.querySelector('[data-pp-dock-close]').addEventListener('click', () => this.setOpen(false));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !this.panel.hidden) this.setOpen(false); });
      this.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-pp-q]');
        if (chip) { this.handle(chip.textContent.trim(), this.kb.items[+chip.dataset.ppQ]); return; }
        const add = e.target.closest('[data-pp-add]');
        if (add) this.add(add);
      });
      this.querySelector('[data-pp-form]').addEventListener('submit', (e) => {
        e.preventDefault();
        const text = this.input.value.trim();
        if (!text) return;
        this.input.value = '';
        this.handle(text);
      });
      this.restore();
      this.teaser();
    }

    // Pré-calcule les mots-clés des questions et des produits
    prepare() {
      this.kb.items.forEach((item, i) => {
        item.i = i;
        item.keys = (item.k || '').split(',').map((k) => normalize(k)).filter(Boolean).map((k) => ({ phrase: k, stem: stem(k), multi: k.includes(' ') }));
        item.concepts = new Set();
        item.keys.forEach((k) => analyse(k.phrase).concepts.forEach((c) => item.concepts.add(c)));
        analyse(item.q).concepts.forEach((c) => item.concepts.add(c));
      });
      // Nombre de réponses qui partagent chaque mot-clé
      this.df = {};
      this.kb.items.forEach((item) => new Set(item.keys.filter((k) => !k.multi).map((k) => k.stem)).forEach((st) => { this.df[st] = (this.df[st] || 0) + 1; }));
      (this.kb.products || []).forEach((p) => {
        p.words = normalize(p.t).split(' ').filter((w) => w.length > 3 && !STOP.has(w)).map(stem);
        p.isPack = /pack|duo|lot/.test(normalize(p.t));
      });
    }

    // ---------- Compréhension ----------
    // Un mot de la question ne compte qu'une fois par réponse ; un mot exact pèse plus
    // qu'un mot approché (faute de frappe) ; un mot-clé propre à une seule réponse donne un bonus.
    scoreItem(item, a) {
      let s = 0;
      const used = new Set();
      item.keys.forEach((k) => {
        if (k.multi) { if ((' ' + a.norm + ' ').includes(' ' + k.phrase + ' ')) s += 3; return; }
        let hit = -1, exact = false;
        a.stems.forEach((t, i) => {
          if (used.has(i) || hit > -1) return;
          if (t === k.stem || t.startsWith(k.stem) && k.stem.length >= 4) { hit = i; exact = true; }
          else if (similar(t, k.stem)) hit = i;
        });
        if (hit < 0) return;
        used.add(hit);
        const w = k.stem.length > 5 ? 2 : 1.5;
        s += exact ? w : w * 0.6;
        if (exact && this.df[k.stem] === 1) s += 1;
      });
      item.concepts.forEach((c) => { if (a.concepts.has(c)) s += 1; });
      return s;
    }
    rankItems(a) {
      return this.kb.items.map((item) => ({ item, s: this.scoreItem(item, a) })).filter((r) => r.s >= 2).sort((x, y) => y.s - x.s);
    }
    findProducts(a) {
      const list = this.kb.products || [];
      const scored = list.map((p) => {
        let s = 0;
        p.words.forEach((w, idx) => { if (a.stems.some((t) => similar(t, w))) s += idx === 0 ? 2 : 1.5; });
        if (p.isPack && a.concepts.has('pack')) s += 2;
        if (/genou/.test(normalize(p.t)) && a.concepts.has('genoux')) s += 1;
        if (/taie/.test(normalize(p.t)) && a.concepts.has('taie')) s += 1;
        if (!p.isPack && a.concepts.has('pack')) s -= 1;
        if (p.isPack && !a.concepts.has('pack')) s -= 0.5;
        return { p, s };
      }).filter((r) => r.s >= 1.5).sort((x, y) => y.s - x.s);
      if (!scored.length) return [];
      const top = scored[0].s;
      return scored.filter((r) => r.s >= top - 0.25).slice(0, 3).map((r) => r.p);
    }
    product(re) { return (this.kb.products || []).find((p) => re.test(normalize(p.t))); }

    // Construit la réponse : { html, products, suggest }
    answer(text, forced) {
      if (forced) return { html: this.faqHtml(forced), suggest: this.related(forced) };
      const a = analyse(text);
      const c = a.concepts;
      const short = a.tokens.length <= 4;
      const ranked = this.rankItems(a);
      const products = this.findProducts(a);

      if (short && c.has('salut') && ranked.length === 0 && !products.length)
        return { html: '<p>Bonjour ! Comment puis-je vous aider ? Livraison, essai 30 nuits, choix de l\'oreiller… je vous réponds tout de suite.</p>', suggest: this.quick() };
      if (short && c.has('merci') && ranked.length === 0 && !products.length)
        return { html: '<p>Avec plaisir ! Une autre question ?</p>', suggest: this.quick() };
      if (short && c.has('aurevoir'))
        return { html: '<p>Merci de votre visite, et belles nuits à vous !</p>' };
      if (c.has('humain') && (ranked.length === 0 || ranked[0].s < 4))
        return { html: '<p>Bien sûr. Notre équipe vous répond sous 24 h ouvrées, par e-mail.</p>', link: { url: this.kb.contactUrl, label: this.kb.contactLabel } };

      // Douleurs : pas d'avis médical
      if (c.has('douleur'))
        return {
          html: '<p>Nous ne pouvons pas donner d\'avis médical : si une douleur dure ou revient, le mieux est d\'en parler à un professionnel de santé.</p><p>Ce que fait l\'Oreiller Papillon : son rebord soutient le creux de la nuque et garde la tête dans l\'axe du dos, sur le dos comme sur le côté. Et vous avez 30 nuits pour l\'essayer.</p>',
          products: [this.product(/papillon/)].filter(Boolean)
        };

      // Conseil selon la position de sommeil
      const position = c.has('ventre') ? 'ventre' : c.has('cote') ? 'cote' : (c.has('dos') && !c.has('douleur')) ? 'dos' : null;
      const advice = position && (a.norm.match(/dor|sommeil|position|couch|nuit|conseil|choisir|lequel|quel/) || short);
      if (advice) {
        if (position === 'ventre') return { html: '<p>Si vous dormez surtout sur le ventre, l\'Oreiller Papillon risque d\'être trop haut pour vous : nous préférons vous le dire avant l\'achat.</p><p>Vous alternez avec le dos ou le côté ? Là, il vous conviendra, et vous avez 30 nuits pour vous faire votre avis.</p>', suggest: this.quick() };
        if (position === 'cote') return { html: '<p>Sur le côté, deux zones comptent : la nuque, que les ailes plus hautes de l\'oreiller soutiennent, et les hanches, que le coussin genoux garde alignées.</p><p>Le plus complet : le <strong>Pack Nuit complète</strong>, moins cher que les deux achetés séparément.</p>', products: [this.product(/pack nuit|nuit complete/), this.product(/papillon/)].filter(Boolean) };
        return { html: '<p>Sur le dos, la tête se cale dans le creux central de l\'Oreiller Papillon et le rebord soutient la nuque. C\'est celui qu\'il vous faut.</p>', products: [this.product(/papillon/)].filter(Boolean) };
      }

      // Prix / achat d'un produit précis
      const wantsPrice = c.has('prix');
      const wantsBuy = c.has('acheter');
      if (products.length && (wantsPrice || wantsBuy || !ranked.length || ranked[0].s < 3)) {
        const intro = wantsBuy ? 'Le voici, à ajouter en un clic :' : products.length > 1 ? 'Voici ce que j\'ai trouvé :' : 'Le voici :';
        return { html: '<p>' + intro + '</p>', products, suggest: this.quick(2) };
      }
      if (c.has('pack') && !ranked.length) {
        const packs = (this.kb.products || []).filter((p) => p.isPack);
        if (packs.length) return { html: '<p>Nos packs réunissent les produits qui vont ensemble, moins cher qu\'à l\'unité :</p>', products: packs.slice(0, 3) };
      }

      if (ranked.length) {
        const best = ranked[0];
        const out = { html: this.faqHtml(best.item), suggest: this.related(best.item) };
        // Plusieurs sujets proches : on propose les autres
        const close = ranked.slice(1).filter((r) => r.s >= best.s - 1).slice(0, 2).map((r) => r.item);
        if (close.length) { out.also = true; out.suggest = close.concat(out.suggest || []).slice(0, 3); }
        if (products.length && (wantsPrice || c.has('pack'))) out.products = products;
        return out;
      }
      if (products.length) return { html: '<p>Voici ce que j\'ai trouvé :</p>', products };
      return { html: '<p>' + this.kb.fallback + '</p>', link: { url: this.kb.contactUrl, label: this.kb.contactLabel }, suggest: this.quick(3) };
    }
    faqHtml(item) {
      this.asked.add(item.i);
      let html = item.a || '';
      if (item.url) html += '<a class="pp-msg__link" href="' + item.url + '">' + this.escape(item.cta || 'En savoir plus') + ' →</a>';
      return html;
    }
    related(item) {
      return this.kb.items.filter((o) => o !== item && !this.asked.has(o.i) && [...o.concepts].some((c) => item.concepts.has(c))).slice(0, 2)
        .concat(this.quick(3)).filter((v, i, arr) => arr.indexOf(v) === i && v !== item).slice(0, 3);
    }
    quick(n) {
      return this.kb.items.filter((o) => o.quick !== false && !this.asked.has(o.i)).slice(0, n || 4);
    }

    // ---------- Affichage ----------
    handle(question, forced) {
      this.bubble('pp-msg--user', this.escape(question));
      const res = this.answer(question, forced);
      const typing = this.bubble('pp-msg--bot pp-msg--typing', '<span></span><span></span><span></span>', true);
      const wait = this.delay + Math.min(900, (res.html || '').replace(/<[^>]+>/g, '').length * 3);
      setTimeout(() => {
        typing.remove();
        let html = res.html || '';
        if (res.link) html += '<a class="pp-msg__link" href="' + res.link.url + '">' + this.escape(res.link.label) + ' →</a>';
        if (res.products && res.products.length) html += '<div class="pp-msg__products">' + res.products.map((p) => this.card(p)).join('') + '</div>';
        this.bubble('pp-msg--bot', html);
        this.setChips(res.suggest, res.also);
        this.save();
      }, wait);
    }
    card(p) {
      const price = (p.from ? 'Dès ' : '') + p.price + (p.compare ? ' <s>' + p.compare + '</s>' : '');
      const btn = p.single && p.available
        ? '<button type="button" class="pp-mini__add" data-pp-add="' + p.id + '">Ajouter</button>'
        : '<a class="pp-mini__add" href="' + p.url + '">Choisir</a>';
      return '<div class="pp-mini"><a class="pp-mini__link" href="' + p.url + '">' + (p.img ? '<img src="' + p.img + '" alt="" width="56" height="56" loading="lazy">' : '') +
        '<span><strong>' + this.escape(p.t) + '</strong><em>' + price + '</em></span></a>' + btn + '</div>';
    }
    setChips(items, also) {
      if (!items || !items.length) items = this.quick();
      this.chips.innerHTML = (also ? '<span class="pp-dock__chips-label">Vous pensiez peut-être à :</span>' : '') +
        items.map((it) => '<button type="button" class="pp-chip" data-pp-q="' + it.i + '">' + this.escape(it.q) + '</button>').join('');
      this.chips.scrollLeft = 0;
    }
    async add(btn) {
      const id = +btn.dataset.ppAdd;
      btn.disabled = true;
      btn.textContent = '…';
      try {
        if (window.ppAddToCart && document.querySelector('cart-drawer')) {
          await window.ppAddToCart([{ id, quantity: 1 }]);
          this.setOpen(false);
        } else {
          const root = (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';
          const r = await fetch(root + 'cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id, quantity: 1 }] }) });
          if (!r.ok) throw new Error();
          window.location.href = root + 'cart';
        }
        btn.textContent = 'Ajouté ✓';
        this.bubble('pp-msg--bot', '<p>C\'est dans votre panier ✓</p>');
        this.save();
      } catch (e) {
        btn.disabled = false;
        btn.textContent = 'Ajouter';
      }
    }
    bubble(cls, html, temp) {
      const el = document.createElement('div');
      el.className = 'pp-msg ' + cls;
      el.innerHTML = html;
      this.log.appendChild(el);
      this.log.scrollTop = this.log.scrollHeight;
      return el;
    }
    escape(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    // ---------- Ouverture, mémoire de visite ----------
    setOpen(open) {
      this.panel.hidden = !open;
      this.classList.toggle('is-open', open);
      this.toggle.setAttribute('aria-expanded', open);
      const t = this.querySelector('[data-pp-dock-teaser]');
      if (t) t.hidden = true;
      if (open) { this.log.scrollTop = this.log.scrollHeight; if (matchMedia('(min-width: 750px)').matches) this.input.focus(); }
      else this.toggle.focus({ preventScroll: true });
      try { sessionStorage.setItem('pp-dock-open', open ? '1' : '0'); } catch (e) {}
    }
    save() {
      try {
        const msgs = [...this.log.children].filter((m) => !m.classList.contains('pp-msg--typing')).slice(-30).map((m) => [m.className, m.innerHTML]);
        sessionStorage.setItem('pp-dock-log', JSON.stringify({ msgs, asked: [...this.asked] }));
      } catch (e) {}
    }
    restore() {
      try {
        const data = JSON.parse(sessionStorage.getItem('pp-dock-log') || 'null');
        if (data && data.msgs && data.msgs.length) {
          this.log.innerHTML = '';
          data.msgs.forEach(([cls, html]) => { const el = document.createElement('div'); el.className = cls; el.innerHTML = html; this.log.appendChild(el); });
          this.log.querySelectorAll('[data-pp-add]').forEach((b) => { b.disabled = false; b.textContent = 'Ajouter'; });
          (data.asked || []).forEach((i) => this.asked.add(i));
          this.setChips(this.quick());
        }
        if (sessionStorage.getItem('pp-dock-open') === '1' && matchMedia('(min-width: 750px)').matches) this.setOpen(true);
      } catch (e) {}
    }
    teaser() {
      const t = this.querySelector('[data-pp-dock-teaser]');
      if (!t) return;
      let seen = false;
      try { seen = sessionStorage.getItem('pp-dock-teaser') === '1'; } catch (e) {}
      if (seen) return;
      setTimeout(() => { if (this.panel.hidden && !document.body.classList.contains('pp-welcome-open')) t.hidden = false; }, 14000);
      setTimeout(() => { t.hidden = true; }, 22000);
      t.addEventListener('click', () => this.setOpen(true));
      try { sessionStorage.setItem('pp-dock-teaser', '1'); } catch (e) {}
    }
  });
})();
