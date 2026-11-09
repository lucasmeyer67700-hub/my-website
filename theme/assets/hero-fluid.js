/*
  Rose ink for the home page opening: a small fluid simulation (WebGL) in
  which the pointer, or a finger, leaves trails of colour that swirl and fade
  on a white page. Written for this theme, no library.

  Method: the usual "stable fluids" steps on the GPU (advection, curl and
  vorticity, divergence, pressure, gradient subtraction). The colour is
  stored as ink absorption and shown as exp(-ink), so trails mix like
  watercolour on paper and never go darker than a set rose.

  Falls back to a still rose wash (CSS) without WebGL, without the needed
  texture formats, or for visitors who ask for less motion. Pauses off
  screen and in background tabs.

  With data-trail (layout/theme.liquid) the same ink runs on every page: a
  fixed layer laid over the content in multiply mode, so only the ink shows.
  It starts at the first movement, follows the pointer anywhere outside the
  opening, never paints on its own, and sleeps once the ink has faded.

  With data-intro (set before the first paint by the small script in
  sections/hero-fluid.liquid) the letters of the title become small bodies
  (HeroLetters below). On the first visit of the session ("full"), a drop
  falls into the white page and bursts; the ink blooms from the splash and
  the letters fly out of it, land in place and dry from rose to ink. Later
  visits ("short") keep the usual arrival. Either way the letters can then
  be thrown with the mouse, or tapped on a phone, and come back home.
*/
(() => {
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const wrap = (deg) => ((((deg + 180) % 360) + 360) % 360) - 180;
  const easeOut = (p) => 1 - Math.pow(1 - p, 3);

  const dropSvg = (id) =>
    `<svg viewBox="0 0 20 30" aria-hidden="true" focusable="false"><defs><radialGradient id="${id}" cx="0.42" cy="0.64" r="0.62"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.34"/></radialGradient></defs><path d="M10 0C10 0 20 13.4 20 20A10 10 0 0 1 0 20C0 13.4 10 0 10 0Z" fill="currentColor"/><path d="M10 0C10 0 20 13.4 20 20A10 10 0 0 1 0 20C0 13.4 10 0 10 0Z" fill="url(#${id})"/><ellipse cx="6.3" cy="19.4" rx="1.9" ry="3.5" fill="#fff" opacity="0.62" transform="rotate(18 6.3 19.4)"/></svg>`;

  /**
   * The letters of the opening title as small bodies, plus the falling drop
   * and its splash. Only transforms and opacity move; one animation frame
   * loop runs while something moves and stops when all is still.
   */
  class HeroLetters {
    constructor(host, mode) {
      this.host = host;
      this.mode = mode;
      this.inner = host.querySelector('.hero-fl__inner');
      this.title = host.querySelector('.hero-fl__title');
      this.bodies = [];
      this.byEl = new Map();
      this.fx = [];
      this.drops = [];
      this.events = [];
      this.clock = 0;
      this.frame = 0;
      this.emit = 0;
      this.small = window.matchMedia('(max-width: 749px)').matches;
      this.abort = new AbortController();
      if (!this.inner || !this.title) return this.reveal();
      this.split();
      if (!this.bodies.length) return this.reveal();
      this.listen();
      if (mode === 'full') this.intro();
      else this.timer = setTimeout(() => this.play(), 1500);
    }

    /** Without the show the title must never stay hidden. */
    reveal() {
      this.host.setAttribute('data-intro-run', '');
      this.host.classList.add('is-splashed');
    }

    /** One span per letter, words kept together so lines never break inside one. */
    split() {
      const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('fr', { granularity: 'grapheme' }) : null;
      for (const line of this.title.querySelectorAll('.hero-fl__line-inner')) {
        const text = line.textContent.normalize('NFC');
        line.textContent = '';
        for (const part of text.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            line.append(' ');
            continue;
          }
          const word = document.createElement('span');
          word.className = 'hero-fl__word';
          const letters = segmenter ? Array.from(segmenter.segment(part), (s) => s.segment) : Array.from(part);
          for (const letter of letters) {
            const el = document.createElement('span');
            el.className = 'hero-fl__char';
            el.textContent = letter;
            word.append(el);
            const body = { el, state: 'rest', x: 0, y: 0, r: 0, sx: 1, sy: 1, o: 1, lastO: 1, hx: 0, hy: 0, w: 0, h: 0, vx: 0, vy: 0, vr: 0, t: 0 };
            this.bodies.push(body);
            this.byEl.set(el, body);
          }
          line.append(word);
        }
      }
      this.kern();
    }

    /**
     * Separate letters lose the font's kerning ("Vo" drifts apart). Each one
     * gets back, as a small margin in em, the place it had in the whole text.
     */
    kern() {
      for (const line of this.title.querySelectorAll('.hero-fl__line-inner')) {
        const chars = [...line.querySelectorAll('.hero-fl__char')];
        if (!chars.length) continue;
        const probe = document.createElement('span');
        probe.setAttribute('aria-hidden', 'true');
        probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;pointer-events:none';
        probe.textContent = line.textContent;
        line.append(probe);
        const node = probe.firstChild;
        const range = document.createRange();
        const saved = chars.map((c) => c.style.transform);
        for (const c of chars) {
          c.style.marginLeft = '';
          c.style.transform = 'none';
        }
        const origin = probe.getBoundingClientRect().left;
        const want = [];
        let offset = 0;
        for (const c of chars) {
          const index = node.data.indexOf(c.textContent, offset);
          if (index < 0) break;
          range.setStart(node, index);
          range.setEnd(node, index + c.textContent.length);
          want.push(range.getBoundingClientRect().left - origin);
          offset = index + c.textContent.length;
        }
        if (want.length === chars.length) {
          const start = chars[0].getBoundingClientRect().left;
          const drift = chars.map((c, i) => want[i] - (c.getBoundingClientRect().left - start));
          const size = parseFloat(getComputedStyle(line).fontSize) || 16;
          chars.forEach((c, i) => {
            const margin = drift[i] - (i ? drift[i - 1] : 0);
            if (Math.abs(margin) > 0.05) c.style.marginLeft = `${(margin / size).toFixed(4)}em`;
          });
        }
        chars.forEach((c, i) => (c.style.transform = saved[i]));
        probe.remove();
      }
      this.stale = true;
    }

    listen() {
      const { signal } = this.abort;
      this.title.addEventListener('pointerdown', (e) => this.down(e), { signal });
      this.title.addEventListener('pointerover', (e) => this.hover(e), { passive: true, signal });
      this.title.addEventListener('dragstart', (e) => e.preventDefault(), { signal });
      window.addEventListener('resize', () => (this.stale = true), { passive: true, signal });
      document.fonts?.ready?.then(() => !this.abort.signal.aborted && this.kern());
    }

    destroy() {
      this.abort.abort();
      this.skip?.abort();
      this.gesture?.abort();
      clearTimeout(this.timer);
      cancelAnimationFrame(this.frame);
      this.clearFx();
    }

    /** Where every letter sits when at rest, relative to the opening. */
    measure() {
      const box = this.inner.getBoundingClientRect();
      const saved = this.bodies.map((b) => b.el.style.transform);
      for (const b of this.bodies) b.el.style.transform = 'none';
      for (const b of this.bodies) {
        const r = b.el.getBoundingClientRect();
        b.hx = r.left - box.left + r.width / 2;
        b.hy = r.top - box.top + r.height / 2;
        b.w = r.width;
        b.h = r.height;
      }
      this.bodies.forEach((b, i) => (b.el.style.transform = saved[i]));
      this.box = { w: box.width, h: box.height };
      this.stale = false;
    }

    at(time, fn) {
      this.events.push({ at: time, fn });
      this.events.sort((a, b) => a.at - b.at);
    }

    /* ------------------------------------------------------------ the show */

    intro() {
      const box = this.inner.getBoundingClientRect();
      // Arriving lower down the page (a link, a restored scroll): no show.
      if (box.height < 50 || box.bottom <= 0 || box.top >= window.innerHeight) return this.finish();
      try {
        sessionStorage.setItem('velea-intro', '1');
      } catch (error) {
        /* private mode: the show simply plays again */
      }
      for (const b of this.bodies) {
        b.o = 0;
        b.lastO = 0;
        b.el.style.opacity = '0';
        b.el.classList.add('is-wet');
      }
      this.host.setAttribute('data-intro-run', '');
      this.box = { w: box.width, h: box.height };
      this.ix = box.width * 0.62;
      this.iy = box.height * 0.45;
      this.makeDrop();
      this.stepDrop();
      this.at(0.8, () => this.splash());

      // Scrolling on: no need to wait for the letters.
      this.skip = new AbortController();
      const startY = window.scrollY;
      window.addEventListener('scroll', () => window.scrollY - startY > box.height * 0.35 && this.finish(), { passive: true, signal: this.skip.signal });
      this.wake();
    }

    makeDrop() {
      const size = this.small ? 17 : 23;
      const el = document.createElement('span');
      el.className = 'hero-fl__drop';
      el.style.width = `${size}px`;
      el.innerHTML = dropSvg(`${this.host.id || 'hero'}-drop`);
      const sat = document.createElement('span');
      sat.className = 'hero-fl__spl';
      const s = Math.round(size * 0.34);
      sat.style.width = sat.style.height = `${s}px`;
      this.inner.append(el, sat);
      this.fx.push(el, sat);
      this.drop = { el, sat, w: size, h: size * 1.5, s, start: 0.22, end: 0.8, y0: -size * 2.2 };
    }

    stepDrop() {
      const d = this.drop;
      const fall = (delay) => {
        const p = clamp((this.clock - d.start - delay) / (d.end - d.start), 0, 1);
        return { p, y: d.y0 + (this.iy - d.y0) * p * p };
      };
      if (!d.landed) {
        const { p, y } = fall(0);
        d.el.style.transform = `translate3d(${this.ix - d.w / 2}px, ${y - d.h}px, 0) scale(${1 - 0.12 * p}, ${1 + 0.38 * p})`;
      }
      // A small second drop follows the first, as real drops do.
      const { p: q, y: ys } = fall(0.09);
      d.sat.style.transform = `translate3d(${this.ix - d.s / 2}px, ${ys - d.s * 1.2}px, 0) scale(0.85, ${1 + 0.4 * q})`;
      if (q >= 1) {
        d.sat.remove();
        this.host.inkAt?.(this.ix, this.iy, 0, -900, 0.35);
        this.drop = null;
      }
    }

    /** The impact: ripples, a crown of droplets, the ink, and the letters. */
    splash() {
      const { ix, iy } = this;
      const d = this.drop;
      if (d) {
        d.landed = true;
        const from = d.el.style.transform;
        const squash = `translate3d(${ix - d.w / 2}px, ${iy - d.h}px, 0) scale(2.3, 0.22)`;
        const anim = d.el.animate?.([{ transform: from, opacity: 1 }, { transform: squash, opacity: 0 }], { duration: 110, easing: 'ease-out', fill: 'forwards' });
        if (anim) anim.onfinish = () => d.el.remove();
        else d.el.remove();
      }
      this.host.classList.add('is-splashed');
      this.host.explodeAt?.(ix, iy);
      this.ring(ix, iy, 1, 0);
      this.ring(ix, iy, 0.6, 140);
      this.crown(ix, iy);

      this.measure();
      const H = this.box.h;
      this.bodies.forEach((b, i) => {
        b.x = ix - b.hx;
        b.y = iy - b.hy;
        b.intro = true;
        const spin = (Math.random() < 0.5 ? -1 : 1) * (160 + Math.random() * 380);
        this.launch(b, 0.56 + i * 0.028 + Math.random() * 0.12, H * (0.08 + Math.random() * 0.12), spin);
        // Out in every direction first, like a real splash, then home.
        const angle = Math.random() * Math.PI * 2;
        const reach = this.box.w * (this.small ? 0.16 : 0.1) * (0.4 + Math.random() * 0.6);
        b.ox = Math.cos(angle) * reach;
      });
    }

    ring(x, y, scale, delay) {
      const r = this.box.w * (this.small ? 0.32 : 0.15) * scale;
      const el = document.createElement('span');
      el.className = 'hero-fl__ring';
      el.style.cssText = `left:${x - r}px;top:${y - r * 0.27}px;width:${2 * r}px;height:${r * 0.54}px`;
      this.inner.append(el);
      this.fx.push(el);
      const anim = el.animate?.(
        [
          { transform: 'scale(0.06)', opacity: 1 },
          { transform: 'scale(1)', opacity: 0 },
        ],
        { duration: 950, delay, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' }
      );
      if (anim) anim.onfinish = () => el.remove();
      else el.remove();
    }

    crown(x, y) {
      const n = this.small ? 10 : 15;
      const H = this.box.h;
      for (let i = 0; i < n; i++) {
        const angle = -Math.PI * (0.07 + (0.86 * (i + Math.random())) / n);
        const speed = H * (0.6 + Math.random() * 0.95);
        const s = 3 + Math.random() * (this.small ? 4 : 6);
        const el = document.createElement('span');
        el.className = 'hero-fl__spl';
        el.style.width = el.style.height = `${s.toFixed(1)}px`;
        this.inner.append(el);
        this.fx.push(el);
        this.drops.push({ el, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, s, t: 0, life: 0.55 + Math.random() * 0.5 });
      }
    }

    stepDroplets(dt) {
      const g = this.box.h * 3;
      for (const d of this.drops) {
        d.t += dt;
        d.vy += g * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        const speed = Math.hypot(d.vx, d.vy);
        const stretch = 1 + Math.min(speed / (this.box.h * 1.3), 1.5);
        const fade = clamp((d.life - d.t) / (d.life * 0.35), 0, 1);
        d.el.style.transform = `translate3d(${(d.x - d.s / 2).toFixed(1)}px, ${(d.y - d.s / 2).toFixed(1)}px, 0) rotate(${Math.atan2(d.vy, d.vx).toFixed(3)}rad) scale(${stretch.toFixed(3)}, ${(1 / Math.sqrt(stretch)).toFixed(3)})`;
        d.el.style.opacity = fade.toFixed(3);
        if (d.t >= d.life || d.y > this.box.h + 20) d.dead = true;
      }
      for (const d of this.drops) if (d.dead) d.el.remove();
      this.drops = this.drops.filter((d) => !d.dead);
    }

    /* ------------------------------------------------------------ bodies */

    /**
     * A flight that ends exactly at home after T seconds, rising A pixels
     * above its start: gravity and launch speed are solved for that.
     */
    launch(b, T, A, r0) {
      b.state = 'arc';
      b.ax = b.x;
      b.ay = b.y;
      b.t = 0;
      b.T = T;
      b.r0 = r0;
      b.ox = 0;
      const apex = Math.max(A, b.ay + 20);
      const s = (Math.sqrt(2 * apex) + Math.sqrt(2 * apex - 2 * b.ay)) / T;
      b.g = s * s;
      b.vy0 = -s * Math.sqrt(2 * apex);
      b.el.classList.add('is-moving');
    }

    land(b) {
      b.x = 0;
      b.y = 0;
      b.r = 0;
      b.sx = 1;
      b.sy = 1;
      if (b.intro) {
        b.intro = false;
        b.o = 1;
        b.el.classList.remove('is-wet');
      }
      this.settle(b, 1, (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 4));
    }

    settle(b, hop, wobble) {
      b.state = 'settle';
      b.t = 0;
      b.hop = hop;
      b.wobble = wobble;
      b.el.classList.add('is-moving');
    }

    rest(b) {
      b.state = 'rest';
      b.x = b.y = b.r = 0;
      b.sx = b.sy = 1;
      b.el.style.transform = '';
      b.el.classList.remove('is-moving');
    }

    home(b) {
      const dist = Math.hypot(b.x, b.y);
      this.launch(b, clamp(0.42 + dist / 2400, 0.45, 0.9), 30 + dist * 0.12, wrap(b.r));
    }

    stepBody(b, dt) {
      if (b.state === 'arc') {
        b.t += dt;
        const p = Math.min(b.t / b.T, 1);
        const t = p * b.T;
        const px = b.x;
        const py = b.y;
        b.x = b.ax * (1 - p) + b.ox * 6.75 * p * (1 - p) * (1 - p);
        b.y = b.ay + b.vy0 * t + 0.5 * b.g * t * t;
        if (dt > 0) {
          b.vx = (b.x - px) / dt;
          b.vy = (b.y - py) / dt;
        }
        b.r = b.r0 * (1 - p) * (1 - p);
        b.sx = b.sy = 1;
        if (b.intro) {
          b.sx = b.sy = 0.3 + 0.7 * easeOut(Math.min(p / 0.35, 1));
          b.o = Math.min(p / 0.08, 1);
        }
        if (p >= 1) this.land(b);
      } else if (b.state === 'settle') {
        b.t += dt;
        const t = b.t;
        const h = b.h || 40;
        let y = 0;
        if (t < 0.22) {
          const u = t / 0.22;
          y = -0.12 * h * b.hop * 4 * u * (1 - u);
        } else if (t < 0.34) {
          const u = (t - 0.22) / 0.12;
          y = -0.035 * h * b.hop * 4 * u * (1 - u);
        }
        let squash = 0;
        if (t < 0.09) squash = 0.16 * b.hop * Math.sin((Math.PI * t) / 0.09);
        else if (t > 0.22 && t < 0.29) squash = 0.06 * b.hop * Math.sin((Math.PI * (t - 0.22)) / 0.07);
        b.x = 0;
        b.y = y;
        b.sy = 1 - squash;
        b.sx = 1 + squash * 0.6;
        b.r = b.wobble * Math.exp(-7 * t) * Math.sin(22 * t);
        if (t >= 0.46) return this.rest(b);
      } else if (b.state === 'free') {
        const n = Math.ceil(dt / 0.017);
        for (let i = 0; i < n && b.state === 'free'; i++) this.stepFree(b, dt / n);
      } else if (b.state === 'drag') {
        b.vx *= Math.exp(-dt * 8);
        b.vy *= Math.exp(-dt * 8);
        b.r += (clamp(b.vx * 0.02, -28, 28) - b.r) * Math.min(1, dt * 10);
      }
      this.paint(b);
    }

    /** Thrown: gravity, the walls of the opening, then the way home. */
    stepFree(b, dt) {
      const box = this.box;
      b.t += dt;
      b.vy += box.h * 2.4 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.r += b.vr * dt;
      const cx = b.hx + b.x;
      const cy = b.hy + b.y;
      const minX = b.w / 2;
      const maxX = box.w - b.w / 2;
      const minY = b.h / 2;
      const maxY = box.h - b.h / 2;
      if (cx < minX) {
        b.x = minX - b.hx;
        b.vx = Math.abs(b.vx) * 0.6;
        b.vr *= -0.7;
      } else if (cx > maxX) {
        b.x = maxX - b.hx;
        b.vx = -Math.abs(b.vx) * 0.6;
        b.vr *= -0.7;
      }
      if (cy < minY) {
        b.y = minY - b.hy;
        b.vy = Math.abs(b.vy) * 0.6;
      } else if (cy > maxY) {
        b.y = maxY - b.hy;
        b.vy = -Math.abs(b.vy) * 0.45;
        b.vx *= 0.8;
        b.vr *= 0.6;
      }
      const slow = Math.hypot(b.vx, b.vy) < 90;
      if (b.t > 1.05 || (b.t > 0.35 && slow)) this.home(b);
    }

    paint(b) {
      if (b.state === 'rest') return;
      const lift = (1 - b.sy) * b.h * 0.5;
      b.el.style.transform = `translate3d(${b.x.toFixed(2)}px, ${(b.y + lift).toFixed(2)}px, 0) rotate(${b.r.toFixed(2)}deg) scale(${b.sx.toFixed(3)}, ${b.sy.toFixed(3)})`;
      if (b.o !== b.lastO) {
        b.el.style.opacity = b.o >= 1 ? '' : b.o.toFixed(3);
        b.lastO = b.o;
      }
    }

    /** A few ink splats per frame behind what flies (kept low for the GPU). */
    ink() {
      if (!this.host.inkAt) return;
      const list = this.drops.slice();
      for (const b of this.bodies) if (b.state === 'arc' || b.state === 'free') list.push(b);
      if (!list.length) return;
      const budget = Math.min(this.small ? 2 : 3, list.length);
      for (let k = 0; k < budget; k++) {
        const e = list[(this.emit + k) % list.length];
        if (!e.state) {
          this.host.inkAt(e.x, e.y, e.vx * 0.5, e.vy * 0.5, 0.16);
        } else {
          this.host.inkAt(e.hx + e.x, e.hy + e.y, e.vx * 0.4, e.vy * 0.4, e.intro ? 0.11 : 0.08);
        }
      }
      this.emit = (this.emit + budget) % 9973;
    }

    wake() {
      if (this.frame) return;
      let last = performance.now();
      const tick = (now) => {
        // A paused tab picks up where it left off instead of jumping ahead;
        // a slow phone keeps the timing.
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        let busy = false;
        try {
          busy = this.step(dt);
        } catch (error) {
          // Whatever happens, the title ends up in place and readable.
          this.finish();
        }
        this.frame = busy ? requestAnimationFrame(tick) : 0;
      };
      this.frame = requestAnimationFrame(tick);
    }

    step(dt) {
      this.clock += dt;
      while (this.events.length && this.events[0].at <= this.clock) this.events.shift().fn();
      let busy = this.events.length > 0;
      if (this.drop) {
        this.stepDrop();
        busy = true;
      }
      if (this.drops.length) {
        this.stepDroplets(dt);
        busy = true;
      }
      for (const b of this.bodies) {
        if (b.state === 'rest') continue;
        this.stepBody(b, dt);
        busy = true;
      }
      this.ink();
      if (!busy && !this.playful) this.play();
      return busy;
    }

    /** End of the show (or skipped): everything in place at once. */
    finish() {
      this.events.length = 0;
      this.drop = null;
      this.drops.length = 0;
      this.clearFx();
      for (const b of this.bodies) {
        b.intro = false;
        b.o = 1;
        b.lastO = 1;
        b.el.style.opacity = '';
        b.el.classList.remove('is-wet');
        this.rest(b);
      }
      this.reveal();
      this.play();
    }

    clearFx() {
      for (const el of this.fx) el.remove();
      this.fx.length = 0;
    }

    play() {
      if (this.playful) return;
      this.playful = true;
      this.skip?.abort();
      this.clearFx();
      this.stale = true;
      this.host.classList.add('is-playful');
    }

    /* ------------------------------------------------------------ hands */

    local(event) {
      const box = this.inner.getBoundingClientRect();
      return { x: event.clientX - box.left, y: event.clientY - box.top };
    }

    down(event) {
      if (!this.playful || this.drag) return;
      const el = event.target.closest?.('.hero-fl__char');
      const b = el && this.byEl.get(el);
      if (!b) return;
      if (this.stale) this.measure();
      this.gesture?.abort();
      const gesture = new AbortController();
      this.gesture = gesture;
      const { signal } = gesture;
      const startX = event.clientX;
      const startY = event.clientY;
      const id = event.pointerId;

      // Phones keep scrolling over the title: a tap makes the letter jump.
      if (event.pointerType === 'touch') {
        const t0 = event.timeStamp;
        window.addEventListener(
          'pointerup',
          (e) => {
            if (e.pointerId !== id) return;
            gesture.abort();
            if (e.timeStamp - t0 < 450 && Math.hypot(e.clientX - startX, e.clientY - startY) < 12) this.poke(b);
          },
          { signal }
        );
        window.addEventListener('pointercancel', (e) => e.pointerId === id && gesture.abort(), { signal });
        return;
      }
      if (event.button !== 0) return;
      event.preventDefault();
      const p = this.local(event);
      b.state = 'drag';
      b.r = wrap(b.r);
      b.sx = b.sy = 1;
      b.gx = p.x - (b.hx + b.x);
      b.gy = p.y - (b.hy + b.y);
      b.vx = b.vy = 0;
      b.lx = p.x;
      b.ly = p.y;
      b.lt = event.timeStamp;
      b.moved = 0;
      b.el.classList.add('is-moving');
      try {
        el.setPointerCapture(id);
      } catch (error) {
        /* capture is a comfort, not a need */
      }
      this.drag = b;
      this.host.classList.add('is-grabbing');
      window.addEventListener('pointermove', (e) => e.pointerId === id && this.move(e, b), { passive: true, signal });
      window.addEventListener('pointerup', (e) => e.pointerId === id && this.release(b), { signal });
      window.addEventListener('pointercancel', (e) => e.pointerId === id && this.release(b), { signal });
      this.wake();
    }

    move(event, b) {
      const p = this.local(event);
      const dt = Math.max((event.timeStamp - b.lt) / 1000, 0.004);
      b.vx = b.vx * 0.35 + ((p.x - b.lx) / dt) * 0.65;
      b.vy = b.vy * 0.35 + ((p.y - b.ly) / dt) * 0.65;
      b.moved += Math.abs(p.x - b.lx) + Math.abs(p.y - b.ly);
      b.lx = p.x;
      b.ly = p.y;
      b.lt = event.timeStamp;
      const cx = clamp(p.x - b.gx, b.w / 2, this.box.w - b.w / 2);
      const cy = clamp(p.y - b.gy, b.h / 2, this.box.h - b.h / 2);
      b.x = cx - b.hx;
      b.y = cy - b.hy;
    }

    release(b) {
      this.gesture?.abort();
      this.drag = null;
      this.host.classList.remove('is-grabbing');
      if (b.moved < 6) return this.poke(b);
      const max = 4200;
      b.state = 'free';
      b.t = 0;
      b.vx = clamp(b.vx, -max, max);
      b.vy = clamp(b.vy, -max, max);
      b.vr = clamp(b.vx * 0.5, -900, 900);
      this.wake();
    }

    /** A tap or a click: the letter jumps and turns over; its neighbours hop. */
    poke(b) {
      if (this.stale) this.measure();
      const dir = Math.random() < 0.5 ? -1 : 1;
      this.launch(b, 0.55, Math.max(b.h * 0.9, 40), wrap(b.r) + dir * 360);
      this.host.inkAt?.(b.hx + b.x, b.hy + b.y, 0, -700, 0.22);
      const i = this.bodies.indexOf(b);
      for (const n of [this.bodies[i - 1], this.bodies[i + 1]]) {
        if (n && n.state === 'rest') this.launch(n, 0.34, n.h * 0.22, 0);
      }
      this.wake();
    }

    hover(event) {
      if (!this.playful || this.drag || event.pointerType !== 'mouse') return;
      const b = this.byEl.get(event.target);
      if (!b || b.state !== 'rest') return;
      if (this.stale) this.measure();
      this.settle(b, 0, (Math.random() < 0.5 ? -1 : 1) * 7);
      this.wake();
    }
  }

  class HeroFluid extends HTMLElement {
    connectedCallback() {
      if (this.started) return;
      this.started = true;
      this.canvas = this.querySelector('canvas');
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.trail = this.hasAttribute('data-trail');
      if (this.trail) return this.waitForTrail(reduce);
      this.intro = reduce ? '' : this.dataset.intro || '';
      if (!this.canvas || reduce) this.fallback();
      else this.start();
      if (this.intro) {
        try {
          this.letters = new HeroLetters(this, this.intro);
        } catch (error) {
          this.setAttribute('data-intro-run', '');
          this.classList.add('is-splashed');
          for (const c of this.querySelectorAll('.hero-fl__char')) {
            c.style.opacity = '';
            c.style.transform = '';
            c.classList.remove('is-wet');
          }
          for (const el of this.querySelectorAll('.hero-fl__drop, .hero-fl__spl, .hero-fl__ring')) el.remove();
        }
      }
    }

    /** Ink from the letters and drops of the opening (pixels of the opening). */
    inkAt(x, y, vx, vy, strength) {
      if (!this.gl || this.gl.isContextLost()) return;
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      if (!w || !h) return;
      const k = 60 / h;
      this.splat(x / w, 1 - y / h, vx * k, -vy * k, this.nextColor(strength));
      this.lastInput = performance.now();
    }

    explodeAt(x, y) {
      if (!this.gl || this.gl.isContextLost()) return;
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      if (!w || !h) return;
      this.explode(x / w, 1 - y / h);
    }

    /** Site-wide ink: nothing is set up until the visitor first moves. */
    waitForTrail(reduce) {
      this.touch = this.hasAttribute('data-touch');
      if (!this.canvas || reduce) return;
      const wait = new AbortController();
      const begin = (event) => {
        if (event.pointerType === 'touch' && !this.touch) return;
        if (this.inOpening(event.target)) return;
        wait.abort();
        this.start();
      };
      window.addEventListener('pointermove', begin, { passive: true, signal: wait.signal });
      if (this.touch) window.addEventListener('touchmove', (e) => e.touches[0] && begin(e.touches[0]), { passive: true, signal: wait.signal });
      this.waiting = wait;
    }

    /** The home page opening keeps its own ink. */
    inOpening(target) {
      return !!(target && target.closest && target.closest('hero-fluid:not([data-trail])'));
    }

    start() {
      try {
        if (!this.init()) return this.fallback();
      } catch (error) {
        return this.fallback();
      }
      this.classList.add('is-live');
    }

    disconnectedCallback() {
      this.letters?.destroy();
      this.waiting?.abort();
      cancelAnimationFrame(this.frame);
      this.observer?.disconnect();
      this.abort?.abort();
    }

    fallback() {
      this.classList.add('is-still');
    }

    /* ------------------------------------------------------------ setup */

    init() {
      const params = { alpha: false, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
      let gl = this.canvas.getContext('webgl2', params);
      const isWebGL2 = !!gl;
      if (!gl) gl = this.canvas.getContext('webgl', params) || this.canvas.getContext('experimental-webgl', params);
      if (!gl) return false;
      this.gl = gl;

      let halfFloat;
      let supportLinear;
      if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        supportLinear = gl.getExtension('OES_texture_float_linear') || true;
        halfFloat = gl.HALF_FLOAT;
      } else {
        const ext = gl.getExtension('OES_texture_half_float');
        supportLinear = gl.getExtension('OES_texture_half_float_linear');
        if (!ext) return false;
        halfFloat = ext.HALF_FLOAT_OES;
      }
      if (!supportLinear) return false;

      const rgba = isWebGL2 ? this.format(gl.RGBA16F, gl.RGBA, halfFloat) : this.format(gl.RGBA, gl.RGBA, halfFloat);
      const rg = isWebGL2 ? this.format(gl.RG16F, gl.RG, halfFloat) || rgba : rgba;
      const r = isWebGL2 ? this.format(gl.R16F, gl.RED, halfFloat) || rgba : rgba;
      if (!rgba) return false;
      this.formats = { rgba, rg, r, type: halfFloat };

      const small = window.matchMedia('(max-width: 749px)').matches;
      this.config = {
        simRes: small ? 96 : 128,
        dyeRes: small ? 512 : 1024,
        densityDissipation: 1.7,
        velocityDissipation: 0.35,
        pressure: 0.8,
        pressureIterations: 18,
        curl: 22,
        splatRadius: small ? 0.26 : 0.18,
        splatForce: 5200,
      };

      this.programs = this.compile();
      this.quad();
      this.resize();
      this.listen();
      this.palette = this.readPalette();
      this.colorIndex = 0;
      this.lastInput = 0;
      this.lastAmbient = 0;
      this.time = performance.now();
      this.visible = true;

      // Site-wide layer: start white (clear), wait for the pointer.
      if (this.trail) {
        this.render();
        return true;
      }

      // Arrival: with the drop, the ink waits for the splash. Otherwise a
      // burst of colour from the centre of the page (theme setting), or a
      // first breath of ink.
      if (this.intro === 'full') this.lastInput = performance.now() + 1500;
      else if (this.hasAttribute('data-explode')) this.explode();
      else this.burst(3);

      this.observer = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible) this.loop();
      });
      this.observer.observe(this);
      this.loop();
      return true;
    }

    format(internal, format, type) {
      const gl = this.gl;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(fbo);
      return ok ? { internal, format } : null;
    }

    /** Ink colours: absorptions that turn white paper into each rose. */
    readPalette() {
      const style = getComputedStyle(this);
      const list = (style.getPropertyValue('--fluid-colors') || '#e8a0b0,#f2c3cc,#f1b29e,#d98da6,#c9727e')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      return list.map((hex) => {
        const n = parseInt(hex.replace('#', ''), 16);
        const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(v / 255, 0.02));
        return rgb.map((v) => -Math.log(v));
      });
    }

    compile() {
      const gl = this.gl;
      const shader = (type, source) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      const vertex = shader(
        gl.VERTEX_SHADER,
        `precision highp float;
        attribute vec2 aPosition;
        varying vec2 vUv, vL, vR, vT, vB;
        uniform vec2 texelSize;
        void main () {
          vUv = aPosition * 0.5 + 0.5;
          vL = vUv - vec2(texelSize.x, 0.0);
          vR = vUv + vec2(texelSize.x, 0.0);
          vT = vUv + vec2(0.0, texelSize.y);
          vB = vUv - vec2(0.0, texelSize.y);
          gl_Position = vec4(aPosition, 0.0, 1.0);
        }`
      );
      const head = `precision highp float; precision highp sampler2D; varying vec2 vUv, vL, vR, vT, vB;`;
      const sources = {
        clear: `${head} uniform sampler2D uTexture; uniform float value;
          void main () { gl_FragColor = value * texture2D(uTexture, vUv); }`,
        splat: `${head} uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;
          void main () {
            vec2 p = vUv - point.xy; p.x *= aspectRatio;
            vec3 splat = exp(-dot(p, p) / radius) * color;
            gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + splat, 1.0);
          }`,
        advection: `${head} uniform sampler2D uVelocity, uSource; uniform vec2 texelSize; uniform float dt, dissipation;
          void main () {
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            gl_FragColor = texture2D(uSource, coord) / (1.0 + dissipation * dt);
          }`,
        divergence: `${head} uniform sampler2D uVelocity;
          void main () {
            float L = texture2D(uVelocity, vL).x, R = texture2D(uVelocity, vR).x;
            float T = texture2D(uVelocity, vT).y, B = texture2D(uVelocity, vB).y;
            vec2 C = texture2D(uVelocity, vUv).xy;
            if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x;
            if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
            gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
          }`,
        curl: `${head} uniform sampler2D uVelocity;
          void main () {
            float L = texture2D(uVelocity, vL).y, R = texture2D(uVelocity, vR).y;
            float T = texture2D(uVelocity, vT).x, B = texture2D(uVelocity, vB).x;
            gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
          }`,
        vorticity: `${head} uniform sampler2D uVelocity, uCurl; uniform float curl, dt;
          void main () {
            float L = texture2D(uCurl, vL).x, R = texture2D(uCurl, vR).x;
            float T = texture2D(uCurl, vT).x, B = texture2D(uCurl, vB).x, C = texture2D(uCurl, vUv).x;
            vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
            force /= length(force) + 0.0001;
            force *= curl * C; force.y *= -1.0;
            vec2 velocity = texture2D(uVelocity, vUv).xy + force * dt;
            gl_FragColor = vec4(clamp(velocity, -1000.0, 1000.0), 0.0, 1.0);
          }`,
        pressure: `${head} uniform sampler2D uPressure, uDivergence;
          void main () {
            float L = texture2D(uPressure, vL).x, R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x, B = texture2D(uPressure, vB).x;
            float divergence = texture2D(uDivergence, vUv).x;
            gl_FragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
          }`,
        gradient: `${head} uniform sampler2D uPressure, uVelocity;
          void main () {
            float L = texture2D(uPressure, vL).x, R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x, B = texture2D(uPressure, vB).x;
            vec2 velocity = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
          }`,
        display: `${head} uniform sampler2D uTexture; uniform vec3 paper, floorColor;
          void main () {
            vec3 ink = max(texture2D(uTexture, vUv).rgb, 0.0);
            vec3 c = paper * exp(-ink);
            gl_FragColor = vec4(max(c, floorColor), 1.0);
          }`,
      };
      const programs = {};
      for (const [name, source] of Object.entries(sources)) {
        const program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, shader(gl.FRAGMENT_SHADER, source));
        gl.bindAttribLocation(program, 0, 'aPosition');
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
        const uniforms = {};
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < count; i++) {
          const name2 = gl.getActiveUniform(program, i).name;
          uniforms[name2] = gl.getUniformLocation(program, name2);
        }
        programs[name] = { program, uniforms };
      }
      return programs;
    }

    quad() {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(0);
    }

    blit(target) {
      const gl = this.gl;
      if (target) {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      } else {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    target(width, height, format) {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0);
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, format.internal, width, height, 0, format.format, this.formats.type, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return {
        texture,
        fbo,
        width,
        height,
        texel: [1 / width, 1 / height],
        attach(id) {
          gl.activeTexture(gl.TEXTURE0 + id);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          return id;
        },
      };
    }

    double(width, height, format) {
      let a = this.target(width, height, format);
      let b = this.target(width, height, format);
      return {
        width,
        height,
        texel: a.texel,
        get read() {
          return a;
        },
        get write() {
          return b;
        },
        swap() {
          [a, b] = [b, a];
        },
      };
    }

    resolution(base) {
      const gl = this.gl;
      let aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (aspect < 1) aspect = 1 / aspect;
      const min = Math.round(base);
      const max = Math.round(base * aspect);
      return gl.drawingBufferWidth > gl.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
    }

    resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(this.canvas.clientWidth * ratio));
      const height = Math.max(1, Math.floor(this.canvas.clientHeight * ratio));
      if (this.canvas.width === width && this.canvas.height === height && this.dye) return;
      this.canvas.width = width;
      this.canvas.height = height;
      const sim = this.resolution(this.config.simRes);
      const dye = this.resolution(this.config.dyeRes);
      const { rgba, rg, r } = this.formats;
      this.dye = this.double(dye.width, dye.height, rgba);
      this.velocity = this.double(sim.width, sim.height, rg);
      this.divergence = this.target(sim.width, sim.height, r);
      this.curlTarget = this.target(sim.width, sim.height, r);
      this.pressure = this.double(sim.width, sim.height, r);
    }

    /* ------------------------------------------------------------ input */

    listen() {
      this.abort = new AbortController();
      const { signal } = this.abort;
      this.pointer = { x: 0, y: 0, moved: false, down: false, dx: 0, dy: 0 };
      const move = (event) => {
        if (this.trail) {
          if (event.pointerType === 'touch' && !this.touch) return;
          if (this.inOpening(event.target)) {
            this.pointer.down = false;
            return;
          }
        }
        const box = this.canvas.getBoundingClientRect();
        if (!box.width) return;
        const x = (event.clientX - box.left) / box.width;
        const y = 1 - (event.clientY - box.top) / box.height;
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        const p = this.pointer;
        if (!p.down) {
          p.x = x;
          p.y = y;
          p.down = true;
          return;
        }
        p.dx = (x - p.x) * (box.width / box.height);
        p.dy = y - p.y;
        p.x = x;
        p.y = y;
        p.moved = Math.abs(p.dx) + Math.abs(p.dy) > 0;
        this.lastInput = performance.now();
        if (this.trail) this.loop();
      };
      if (this.trail) {
        const lift = () => (this.pointer.down = false);
        window.addEventListener('pointermove', move, { passive: true, signal });
        document.documentElement.addEventListener('mouseleave', lift, { signal });
        if (this.touch) {
          window.addEventListener('touchmove', (e) => e.touches[0] && move(e.touches[0]), { passive: true, signal });
          window.addEventListener('touchend', lift, { passive: true, signal });
        }
        window.addEventListener('resize', () => (this.needsResize = true), { signal });
        this.canvas.addEventListener('webglcontextlost', () => this.classList.remove('is-live'), { signal });
        return;
      }
      this.addEventListener('pointermove', move, { passive: true, signal });
      this.addEventListener('pointerdown', move, { passive: true, signal });
      this.addEventListener('pointerleave', () => (this.pointer.down = false), { signal });
      this.addEventListener('touchmove', (e) => e.touches[0] && move(e.touches[0]), { passive: true, signal });
      window.addEventListener('resize', () => (this.needsResize = true), { signal });
      document.addEventListener('visibilitychange', () => !document.hidden && this.loop(), { signal });
    }

    nextColor(strength) {
      this.colorIndex = (this.colorIndex + 0.035) % this.palette.length;
      const a = this.palette[Math.floor(this.colorIndex)];
      const b = this.palette[(Math.floor(this.colorIndex) + 1) % this.palette.length];
      const t = this.colorIndex % 1;
      return a.map((v, i) => (v * (1 - t) + b[i] * t) * strength);
    }

    splat(x, y, dx, dy, color) {
      const gl = this.gl;
      const { splat } = this.programs;
      gl.useProgram(splat.program);
      const aspect = this.canvas.width / this.canvas.height;
      const radius = (this.config.splatRadius / 100) * (aspect > 1 ? aspect : 1);
      gl.uniform1i(splat.uniforms.uTarget, this.velocity.read.attach(0));
      gl.uniform1f(splat.uniforms.aspectRatio, aspect);
      gl.uniform2f(splat.uniforms.point, x, y);
      gl.uniform3f(splat.uniforms.color, dx, dy, 0);
      gl.uniform1f(splat.uniforms.radius, radius);
      this.blit(this.velocity.write);
      this.velocity.swap();
      gl.uniform1i(splat.uniforms.uTarget, this.dye.read.attach(0));
      gl.uniform3f(splat.uniforms.color, color[0], color[1], color[2]);
      this.blit(this.dye.write);
      this.dye.swap();
    }

    /**
     * Colour bursting out from one point, in three quick waves: every rose
     * of the palette shoots outwards, then curls and settles.
     */
    explode(cx = 0.62, cy = 0.55) {
      const waves = [
        { delay: 120, count: 14, speed: 3600, strength: 0.75, spread: 0.02 },
        { delay: 360, count: 10, speed: 2600, strength: 0.55, spread: 0.06 },
        { delay: 640, count: 8, speed: 1700, strength: 0.4, spread: 0.1 },
      ];
      for (const wave of waves) {
        setTimeout(() => {
          if (!this.gl) return;
          for (let i = 0; i < wave.count; i++) {
            const angle = (i / wave.count) * Math.PI * 2 + Math.random() * 0.5;
            const reach = wave.spread * (0.5 + Math.random());
            const x = cx + Math.cos(angle) * reach;
            const y = cy + Math.sin(angle) * reach * (this.canvas.width / this.canvas.height);
            const speed = wave.speed * (0.75 + Math.random() * 0.5);
            this.colorIndex = (i / wave.count) * this.palette.length;
            this.splat(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, this.nextColor(wave.strength));
          }
        }, wave.delay);
      }
      // Keep the drifting ribbon away until the burst has settled.
      this.lastInput = performance.now() + 2500;
    }

    burst(count) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        this.splat(0.35 + Math.random() * 0.5, 0.3 + Math.random() * 0.5, Math.cos(angle) * 900, Math.sin(angle) * 900, this.nextColor(0.45));
      }
    }

    /* ------------------------------------------------------------ loop */

    loop() {
      if (this.running) return;
      this.running = true;
      if (this.trail) {
        clearTimeout(this.sleepTimer);
        this.classList.add('is-live');
      }
      const tick = (now) => {
        if (!this.visible || document.hidden) {
          this.running = false;
          return;
        }
        // Site-wide layer: once the ink has mostly faded, the layer fades out,
        // the last traces are wiped, and it sleeps until the next move.
        if (this.trail && now - this.lastInput > 3000) {
          this.running = false;
          this.sleep();
          return;
        }
        const dt = Math.min((now - this.time) / 1000, 0.016666);
        this.time = now;
        if (this.needsResize) {
          this.needsResize = false;
          this.resize();
        }
        this.input(now);
        this.step(dt);
        this.render();
        this.frame = requestAnimationFrame(tick);
      };
      this.time = performance.now();
      this.frame = requestAnimationFrame(tick);
    }

    sleep() {
      this.classList.remove('is-live');
      clearTimeout(this.sleepTimer);
      this.sleepTimer = setTimeout(() => {
        if (this.running || !this.gl) return;
        const { clear } = this.programs;
        this.gl.useProgram(clear.program);
        this.gl.uniform1f(clear.uniforms.value, 0);
        for (const field of [this.dye, this.velocity]) {
          this.gl.uniform1i(clear.uniforms.uTexture, field.read.attach(0));
          this.blit(field.write);
          field.swap();
        }
        this.render();
      }, 450);
    }

    input(now) {
      const p = this.pointer;
      if (p.moved) {
        p.moved = false;
        this.splat(p.x, p.y, p.dx * this.config.splatForce, p.dy * this.config.splatForce, this.nextColor(0.2));
      }
      // Nobody moving: a slow ribbon of ink drifts by on its own (opening only).
      if (!this.trail && now - this.lastInput > 2600 && now - this.lastAmbient > 90) {
        this.lastAmbient = now;
        const t = now / 1000;
        const x = 0.62 + Math.cos(t * 0.37) * 0.26;
        const y = 0.5 + Math.sin(t * 0.53) * 0.3;
        const dx = -Math.sin(t * 0.37) * 0.26 * 0.37;
        const dy = Math.cos(t * 0.53) * 0.3 * 0.53;
        this.splat(x, y, dx * 900, dy * 900, this.nextColor(0.07));
      }
    }

    step(dt) {
      const gl = this.gl;
      const P = this.programs;
      const v = this.velocity;
      gl.disable(gl.BLEND);

      gl.useProgram(P.curl.program);
      gl.uniform2f(P.curl.uniforms.texelSize, ...v.texel);
      gl.uniform1i(P.curl.uniforms.uVelocity, v.read.attach(0));
      this.blit(this.curlTarget);

      gl.useProgram(P.vorticity.program);
      gl.uniform2f(P.vorticity.uniforms.texelSize, ...v.texel);
      gl.uniform1i(P.vorticity.uniforms.uVelocity, v.read.attach(0));
      gl.uniform1i(P.vorticity.uniforms.uCurl, this.curlTarget.attach(1));
      gl.uniform1f(P.vorticity.uniforms.curl, this.config.curl);
      gl.uniform1f(P.vorticity.uniforms.dt, dt);
      this.blit(v.write);
      v.swap();

      gl.useProgram(P.divergence.program);
      gl.uniform2f(P.divergence.uniforms.texelSize, ...v.texel);
      gl.uniform1i(P.divergence.uniforms.uVelocity, v.read.attach(0));
      this.blit(this.divergence);

      gl.useProgram(P.clear.program);
      gl.uniform1i(P.clear.uniforms.uTexture, this.pressure.read.attach(0));
      gl.uniform1f(P.clear.uniforms.value, this.config.pressure);
      this.blit(this.pressure.write);
      this.pressure.swap();

      gl.useProgram(P.pressure.program);
      gl.uniform2f(P.pressure.uniforms.texelSize, ...v.texel);
      gl.uniform1i(P.pressure.uniforms.uDivergence, this.divergence.attach(0));
      for (let i = 0; i < this.config.pressureIterations; i++) {
        gl.uniform1i(P.pressure.uniforms.uPressure, this.pressure.read.attach(1));
        this.blit(this.pressure.write);
        this.pressure.swap();
      }

      gl.useProgram(P.gradient.program);
      gl.uniform2f(P.gradient.uniforms.texelSize, ...v.texel);
      gl.uniform1i(P.gradient.uniforms.uPressure, this.pressure.read.attach(0));
      gl.uniform1i(P.gradient.uniforms.uVelocity, v.read.attach(1));
      this.blit(v.write);
      v.swap();

      gl.useProgram(P.advection.program);
      gl.uniform2f(P.advection.uniforms.texelSize, ...v.texel);
      const id = v.read.attach(0);
      gl.uniform1i(P.advection.uniforms.uVelocity, id);
      gl.uniform1i(P.advection.uniforms.uSource, id);
      gl.uniform1f(P.advection.uniforms.dt, dt);
      gl.uniform1f(P.advection.uniforms.dissipation, this.config.velocityDissipation);
      this.blit(v.write);
      v.swap();

      gl.uniform1i(P.advection.uniforms.uVelocity, v.read.attach(0));
      gl.uniform1i(P.advection.uniforms.uSource, this.dye.read.attach(1));
      gl.uniform1f(P.advection.uniforms.dissipation, this.config.densityDissipation);
      this.blit(this.dye.write);
      this.dye.swap();
    }

    render() {
      const gl = this.gl;
      const { display } = this.programs;
      gl.useProgram(display.program);
      gl.uniform2f(display.uniforms.texelSize, 1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight);
      gl.uniform1i(display.uniforms.uTexture, this.dye.read.attach(0));
      gl.uniform3f(display.uniforms.paper, 1, 1, 1);
      // Never darker than a soft rose, so dark text stays easy to read on top.
      gl.uniform3f(display.uniforms.floorColor, 0.86, 0.64, 0.69);
      this.blit(null);
    }
  }

  if (!customElements.get('hero-fluid')) customElements.define('hero-fluid', HeroFluid);
})();
