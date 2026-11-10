/*
  "Le fil de la goutte" (sections/thread-nav.liquid): the drop of the home
  opening becomes the guide of the page.

  - Finds the home sections named in the section setting ("key: Name"),
    builds one small drop per section on a thread (computer) and a short
    list behind a pill (phone).
  - A drop slides along the thread as the page is read; the section being
    read is marked, and its name shows for a moment when it changes.
  - A click glides to the section (and moves focus there for keyboards).
  - With data-ink, each section opens once, as a stain of ink spreading
    from the thread, the first time it comes into view.

  No library. One scroll listener, throttled to the animation frame.
  Visitors who ask for less motion keep the navigation, without effects.
*/
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  class VeleaThread extends HTMLElement {
    connectedCallback() {
      if (this.started) return;
      this.started = true;
      this.abort = new AbortController();
      this.items = this.collect();
      if (this.items.length < 2) return;
      this.build();
      this.hidden = false;
      this.listen();
      this.update();
      if (this.hasAttribute('data-ink')) this.prepareInk();
    }

    disconnectedCallback() {
      this.abort?.abort();
      this.observer?.disconnect();
      cancelAnimationFrame(this.frame);
      cancelAnimationFrame(this.glideFrame);
      clearTimeout(this.announceTimer);
      for (const item of this.items || []) item.section.style.clipPath = '';
    }

    /** "key: Name" lines, matched to the sections of the page by their key. */
    collect() {
      const names = new Map();
      for (const line of (this.dataset.labels || '').split(/\r?\n/)) {
        const at = line.indexOf(':');
        if (at < 1) continue;
        const key = line.slice(0, at).trim();
        const name = line.slice(at + 1).trim();
        if (key && name) names.set(key, name);
      }
      const main = document.getElementById('MainContent') || document.querySelector('main');
      if (!main) return [];
      const items = [];
      for (const section of main.querySelectorAll(':scope > .shopify-section')) {
        const id = section.id || '';
        const key = [...names.keys()].find((k) => id.endsWith(`__${k}`) || id.endsWith(`--${k}`));
        if (!key || !section.offsetHeight) continue;
        items.push({ key, name: names.get(key), section });
      }
      return items;
    }

    build() {
      const rail = this.querySelector('[data-thread-rail]');
      const sheet = this.querySelector('[data-thread-sheet-list]');
      this.fill = this.querySelector('[data-thread-fill]');
      this.drop = this.querySelector('[data-thread-drop]');
      this.current = this.querySelector('[data-thread-current]');
      this.pill = this.querySelector('[data-thread-pill]');
      this.sheet = this.querySelector('[data-thread-sheet]');
      for (const item of this.items) {
        const href = `#${item.section.id}`;
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'vthread__link';
        link.href = href;
        link.setAttribute('aria-label', item.name);
        const name = document.createElement('span');
        name.className = 'vthread__name';
        name.setAttribute('aria-hidden', 'true');
        name.textContent = item.name;
        link.append(name);
        li.append(link);
        rail?.append(li);
        item.link = link;

        const li2 = document.createElement('li');
        const link2 = document.createElement('a');
        link2.className = 'vthread__sheet-link';
        link2.href = href;
        link2.textContent = item.name;
        li2.append(link2);
        sheet?.append(li2);
        item.sheetLink = link2;
      }
    }

    listen() {
      const { signal } = this.abort;
      const schedule = () => {
        if (this.frame) return;
        this.frame = requestAnimationFrame(() => {
          this.frame = 0;
          this.update();
        });
      };
      window.addEventListener('scroll', schedule, { passive: true, signal });
      window.addEventListener('resize', schedule, { passive: true, signal });

      this.addEventListener(
        'click',
        (event) => {
          const link = event.target.closest('a[href^="#"]');
          if (!link) return;
          const item = this.items.find((i) => i.link === link || i.sheetLink === link);
          if (!item) return;
          event.preventDefault();
          this.closeSheet();
          this.glide(item, event.detail === 0);
        },
        { signal }
      );

      this.pill?.addEventListener('click', () => (this.sheet.hidden ? this.openSheet() : this.closeSheet()), { signal });
      document.addEventListener(
        'click',
        (event) => {
          if (this.sheet && !this.sheet.hidden && !this.querySelector('.vthread__mobile').contains(event.target)) this.closeSheet();
        },
        { signal }
      );
      document.addEventListener(
        'keydown',
        (event) => {
          if (event.key !== 'Escape' || !this.sheet || this.sheet.hidden) return;
          this.closeSheet();
          this.pill.focus();
        },
        { signal }
      );
      // Any hand on the page takes over from a glide at once.
      for (const type of ['wheel', 'touchstart', 'keydown']) {
        window.addEventListener(type, () => cancelAnimationFrame(this.glideFrame), { passive: true, signal });
      }
    }

    openSheet() {
      this.sheet.hidden = false;
      this.pill.setAttribute('aria-expanded', 'true');
    }

    closeSheet() {
      if (!this.sheet || this.sheet.hidden) return;
      this.sheet.hidden = true;
      this.pill.setAttribute('aria-expanded', 'false');
    }

    /* ------------------------------------------------------------ reading */

    update() {
      const vh = window.innerHeight;
      const probe = vh * 0.4;
      const boxes = this.items.map((i) => i.section.getBoundingClientRect());
      // Safety net: a section on screen is never left waiting for its ink.
      this.items.forEach((item, i) => {
        if (!item.waiting || boxes[i].top >= vh || boxes[i].bottom <= 0) return;
        this.observer?.unobserve(item.section);
        this.open(item.section);
      });
      const first = boxes[0];
      const last = boxes[boxes.length - 1];
      // Shown once the opening is mostly behind, hidden at the footer.
      const shown = first.top < vh * 0.55 && last.bottom > vh * 0.3;
      this.classList.toggle('is-shown', shown);
      if (!shown) this.closeSheet();

      let index = 0;
      boxes.forEach((box, i) => {
        if (box.top <= probe) index = i;
      });
      const box = boxes[index];
      const t = clamp((probe - box.top) / Math.max(box.height, 1), 0, 1);

      if (index !== this.index) {
        const before = this.index;
        this.index = index;
        this.items.forEach((item, i) => {
          item.link.setAttribute('aria-current', i === index ? 'true' : 'false');
          item.link.classList.toggle('is-passed', i < index);
          item.sheetLink.setAttribute('aria-current', i === index ? 'true' : 'false');
        });
        if (this.current) {
          this.current.textContent = this.items[index].name;
          if (before !== undefined && !reduce) {
            this.current.classList.remove('is-changing');
            void this.current.offsetWidth;
            this.current.classList.add('is-changing');
          }
        }
        if (before !== undefined && shown) this.announce(this.items[index]);
      }

      // The drop on the thread: between this section's drop and the next.
      if (!this.drop || !this.items[0].link.offsetParent) return;
      const centre = (i) => {
        const link = this.items[i].link;
        return link.offsetTop + link.offsetHeight / 2;
      };
      const here = centre(index);
      const next = index < this.items.length - 1 ? centre(index + 1) : here;
      const y = here + (next - here) * t;
      const dropHeight = this.drop.offsetHeight || 16;
      this.drop.style.transform = `translate3d(0, ${(y - dropHeight * 0.72).toFixed(1)}px, 0)`;
      const line = this.fill?.parentElement;
      if (line && line.offsetHeight) {
        const top = line.offsetTop;
        this.fill.style.transform = `scaleY(${clamp((y - top) / line.offsetHeight, 0, 1).toFixed(4)})`;
      }
    }

    /** The name of the new section shows beside its drop for a moment. */
    announce(item) {
      if (!item.link.offsetParent) return;
      for (const other of this.items) other.link.classList.remove('is-announced');
      item.link.classList.add('is-announced');
      clearTimeout(this.announceTimer);
      this.announceTimer = setTimeout(() => item.link.classList.remove('is-announced'), 1400);
    }

    /* ------------------------------------------------------------ moving */

    glide(item, keyboard) {
      cancelAnimationFrame(this.glideFrame);
      const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const to = clamp(item.section.getBoundingClientRect().top + window.scrollY - pad, 0, max);
      const done = () => {
        if (!keyboard) return;
        if (!item.section.hasAttribute('tabindex')) item.section.setAttribute('tabindex', '-1');
        item.section.focus({ preventScroll: true });
      };
      const from = window.scrollY;
      const distance = to - from;
      if (reduce || Math.abs(distance) < 2) {
        window.scrollTo(0, to);
        return done();
      }
      const duration = clamp(500 + Math.abs(distance) * 0.12, 600, 1300);
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        window.scrollTo(0, from + distance * expoOut(p));
        if (p < 1) this.glideFrame = requestAnimationFrame(step);
        else done();
      };
      this.glideFrame = requestAnimationFrame(step);
    }

    /* ------------------------------------------------------------ ink */

    prepareInk() {
      if (reduce || (window.Shopify && window.Shopify.designMode)) return;
      if (!window.CSS?.supports?.('clip-path', 'circle(10px at 0px 0px)') || !Element.prototype.animate) return;
      const vh = window.innerHeight;
      const waiting = this.items.filter((i) => i.section.getBoundingClientRect().top > vh);
      if (!waiting.length) return;
      for (const item of waiting) {
        item.waiting = true;
        item.section.style.clipPath = 'circle(0px at 100% 0px)';
      }
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            this.observer.unobserve(entry.target);
            this.open(entry.target);
          }
        },
        { rootMargin: '0px 0px -6% 0px' }
      );
      for (const item of waiting) this.observer.observe(item.section);
    }

    /** The section opens as ink spreading from the thread (or the pill). */
    open(section) {
      const item = this.items.find((i) => i.section === section);
      if (!item?.waiting) return;
      item.waiting = false;
      const box = section.getBoundingClientRect();
      const wide = window.matchMedia('(min-width: 990px)').matches;
      const x = wide ? box.width - 34 : box.width / 2;
      const fromTop = box.top < 0;
      const y = fromTop ? box.height : 0;
      const radius = Math.hypot(Math.max(x, box.width - x), box.height) + 40;
      const at = `at ${x.toFixed(0)}px ${y.toFixed(0)}px`;
      const clear = () => {
        section.style.clipPath = '';
      };
      // Whatever happens, the section is never left hidden.
      const guard = setTimeout(clear, 1400);
      const anim = section.animate([{ clipPath: `circle(3% ${at})` }, { clipPath: `circle(${radius.toFixed(0)}px ${at})` }], {
        duration: 820,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      });
      section.style.clipPath = '';
      anim.onfinish = () => clearTimeout(guard);
      anim.oncancel = clear;

      const splat = document.createElement('span');
      splat.className = 'vthread-splat';
      splat.style.setProperty('--vthread-drop', getComputedStyle(this).getPropertyValue('--vthread-drop'));
      splat.style.left = `${box.left + x}px`;
      splat.style.top = `${clamp(box.top + y, 0, window.innerHeight)}px`;
      document.body.append(splat);
      const ink = splat.animate(
        [
          { transform: 'scale(0.1)', opacity: 0.9 },
          { transform: 'scale(1.6)', opacity: 0 },
        ],
        { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
      ink.onfinish = () => splat.remove();
      setTimeout(() => splat.remove(), 1200);
    }
  }

  if (!customElements.get('velea-thread')) customElements.define('velea-thread', VeleaThread);
})();
