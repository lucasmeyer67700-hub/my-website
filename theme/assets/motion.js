/*
  Scroll and page motion, modelled on the studio site the brand chose as a
  reference (noth.in), without any library: the same durations and curves,
  written by hand.

  - Smooth scroll: the mouse wheel glides to its target over 1.2 s on an
    exponential ease-out (what Lenis does with duration 1.2). Touch screens,
    keyboards and scrollbars keep the browser's own scrolling.
  - Parallax: large photos ([data-parallax]) move a little slower than the
    page, with a lag (GSAP "scrub" 2.5).
  - Growing frame: [data-grow] media open from a framed inset to full bleed
    while their section scrolls in (scrub 3).
  - Corner curtains: product photos open from alternating corners when they
    come into view (inset clip, power4.inOut, 1 s).
  - Letters: [data-letters] words rise letter by letter (1.2 s, power4.inOut).
  - Pages: leaving fades the page out (0.5 s, power2.inOut), the next one
    fades in.

  Everything is off for visitors who ask for less motion, and in the theme
  editor (smooth scroll and page fades).
*/
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return;
  const body = document.body;
  const root = document.documentElement;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const inEditor = window.Shopify && window.Shopify.designMode;

  /* ------------------------------------------------------ smooth scroll */

  const expoOut = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

  function scrollableParent(node, deltaY) {
    for (let el = node; el && el !== body && el !== root; el = el.parentElement) {
      if (!(el instanceof Element)) continue;
      if (el.hasAttribute('data-lenis-prevent') || el.closest('dialog[open]')) return el;
      const style = getComputedStyle(el);
      const canScroll = /(auto|scroll|overlay)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1;
      if (!canScroll) continue;
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return el;
    }
    return null;
  }

  function locked() {
    const htmlStyle = getComputedStyle(root).overflowY;
    const bodyStyle = getComputedStyle(body).overflowY;
    return htmlStyle === 'hidden' || bodyStyle === 'hidden' || body.classList.contains('overflow-hidden');
  }

  function initSmoothScroll() {
    if (!finePointer || inEditor || !body.hasAttribute('data-smooth-scroll')) return;
    root.classList.add('has-smooth-scroll');
    let target = window.scrollY;
    let from = target;
    let start = 0;
    let frame = 0;
    const duration = 1200;

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      target = window.scrollY;
    };

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      window.scrollTo(0, from + (target - from) * expoOut(progress));
      frame = progress < 1 ? requestAnimationFrame(tick) : 0;
    };

    window.addEventListener(
      'wheel',
      (event) => {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
        let delta = event.deltaY;
        if (Math.abs(event.deltaX) > Math.abs(delta)) return; // sideways swipes: native
        if (event.deltaMode === 1) delta *= 40;
        else if (event.deltaMode === 2) delta *= window.innerHeight;
        if (!delta || locked() || scrollableParent(event.target, delta)) return;
        event.preventDefault();
        const max = root.scrollHeight - window.innerHeight;
        if (!frame) target = window.scrollY;
        target = Math.max(0, Math.min(max, target + delta));
        from = window.scrollY;
        start = performance.now();
        if (!frame) frame = requestAnimationFrame(tick);
      },
      { passive: false }
    );

    // Keys, scrollbar drags and in-page links take over at once.
    for (const type of ['keydown', 'pointerdown', 'touchstart']) {
      window.addEventListener(type, () => frame && stop(), { passive: true });
    }
    window.addEventListener('resize', () => !frame && (target = window.scrollY));
  }

  /* --------------------------------------------- scroll-linked ("scrub") */

  const scrubbed = [];
  let lastTime = performance.now();
  let loopFrame = 0;

  /**
   * progress: 0 when the element's top reaches the bottom of the screen,
   * 1 when its bottom leaves the top (like "top bottom" → "bottom top").
   */
  function progressOf(el, startAt = 'bottom', endAt = 'top') {
    const box = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const startY = startAt === 'bottom' ? vh : startAt === 'center' ? vh / 2 : 0;
    const endY = endAt === 'top' ? -box.height : endAt === 'center' ? vh / 2 - box.height : vh - box.height;
    const total = startY - endY;
    return total ? Math.max(0, Math.min(1, (startY - box.top) / total)) : 0;
  }

  function loop(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    let moving = false;
    for (const item of scrubbed) {
      const box = item.el.getBoundingClientRect();
      if (box.bottom < -200 || box.top > window.innerHeight + 200) continue;
      const goal = item.measure();
      // GSAP "scrub: n": the value catches up with the scroll in about n seconds.
      const k = 1 - Math.exp(-dt / (item.scrub / 4));
      item.value += (goal - item.value) * k;
      if (Math.abs(goal - item.value) > 0.0005) moving = true;
      item.apply(item.value);
    }
    loopFrame = moving ? requestAnimationFrame(loop) : 0;
  }

  const wake = () => {
    if (!loopFrame) {
      lastTime = performance.now();
      loopFrame = requestAnimationFrame(loop);
    }
  };

  function addScrub(el, scrub, measure, apply) {
    const item = { el, scrub, measure, apply, value: measure() };
    apply(item.value);
    scrubbed.push(item);
  }

  function initParallax() {
    for (const frameEl of document.querySelectorAll('[data-parallax]')) {
      const img = frameEl.querySelector('img, svg');
      if (!img) continue;
      frameEl.classList.add('has-parallax');
      const range = parseFloat(frameEl.dataset.parallax) || 6;
      addScrub(frameEl, 2.5, () => progressOf(frameEl), (p) => {
        img.style.setProperty('--parallax-y', `${(0.5 - p) * 2 * range}%`);
      });
    }
  }

  function initGrow() {
    for (const el of document.querySelectorAll('[data-grow]')) {
      el.classList.add('has-grow');
      // 0 when its top enters at the bottom of the screen, 1 when it reaches a quarter from the top.
      const measure = () => {
        const vh = window.innerHeight;
        return Math.max(0, Math.min(1, (vh - el.getBoundingClientRect().top) / (vh * 0.75)));
      };
      addScrub(el, 3, measure, (p) => el.style.setProperty('--grow', p.toFixed(4)));
    }
  }

  /* ---------------------------------------------- corner curtains (tiles) */

  const corners = ['inset(100% 100% 0% 0%)', 'inset(100% 0% 0% 100%)', 'inset(100% 0% 0% 0%)'];

  function initCurtains(scope = document) {
    const media = [...scope.querySelectorAll('.tile__media:not(.has-curtain)')];
    if (!media.length || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-open');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px' }
    );
    media.forEach((el, index) => {
      el.classList.add('has-curtain');
      el.style.setProperty('--curtain-from', corners[index % corners.length]);
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------- letters */

  function initLetters() {
    const words = document.querySelectorAll('[data-letters]:not(.has-letters)');
    if (!words.length || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -5% 0px' }
    );
    for (const word of words) {
      const text = word.textContent;
      word.textContent = '';
      [...text].forEach((char, index) => {
        const mask = document.createElement('span');
        mask.className = 'letter-mask';
        const letter = document.createElement('span');
        letter.className = 'letter-child';
        letter.style.setProperty('--i', String(index));
        letter.textContent = char;
        mask.append(letter);
        word.append(mask);
      });
      word.classList.add('has-letters');
      observer.observe(word);
    }
  }

  /* ---------------------------------------------------- page transitions */

  function initPageTransitions() {
    if (inEditor || !body.hasAttribute('data-page-transitions')) return;
    root.classList.add('has-page-transitions');

    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link || link.target || link.hasAttribute('download') || link.hasAttribute('data-no-transition')) return;
      if (link.closest('[data-cart-trigger], .cart-drawer, form')) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page, anchors
      if (/^\/(checkout|cart\/|account\/logout|apps\/)/.test(url.pathname)) return;
      event.preventDefault();
      root.classList.add('is-leaving');
      setTimeout(() => {
        location.href = url.href;
      }, 500);
    });

    // Back/forward from the browser cache: show the page again.
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) root.classList.remove('is-leaving');
    });
  }

  /* --------------------------------------------------------------- start */

  function start() {
    initSmoothScroll();
    initParallax();
    initGrow();
    initCurtains();
    initLetters();
    initPageTransitions();
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', wake);
    wake();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  document.addEventListener('shopify:section:load', (event) => {
    initCurtains(event.target);
    initLetters();
  });
})();
