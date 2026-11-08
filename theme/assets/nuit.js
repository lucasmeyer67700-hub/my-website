/*
  « Nuit rosée » ambience (theme setting): the coloured glows behind the page
  drift as the visitor scrolls, and large titles unveil letter by letter.
  Nothing moves for visitors who asked for less motion.
*/
(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- glows */
  if (reduce) {
    root.style.setProperty('--nuit-p', '0.25');
  } else {
    let queued = false;
    const update = () => {
      queued = false;
      const max = root.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      root.style.setProperty('--nuit-p', p.toFixed(4));
    };
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    update();
  }

  /* --------------------------------------------------------- title scramble */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$*+=<>/';
  const random = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

  /** @param {HTMLElement} el */
  const scramble = (el) => {
    if (el.dataset.scrambled) return;
    el.dataset.scrambled = 'true';

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const items = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.textContent.trim()) items.push({ node, text: node.textContent });
    }
    const total = items.reduce((sum, item) => sum + item.text.length, 0);
    if (!total) return;

    // Screen readers get the real title while the letters move.
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());

    const duration = Math.min(1700, 650 + total * 26);
    const start = performance.now();
    let lastSwap = 0;
    const frame = (now) => {
      const t = Math.min(1, (now - start) / duration);
      if (t < 1 && now - lastSwap < 45) return requestAnimationFrame(frame);
      lastSwap = now;
      let offset = 0;
      for (const item of items) {
        let out = '';
        for (let i = 0; i < item.text.length; i++) {
          const char = item.text[i];
          const settleAt = 0.25 + ((offset + i) / total) * 0.75;
          out += t >= settleAt || /[\s.,’'!?:;«»-]/.test(char) ? char : random();
        }
        item.node.textContent = out;
        offset += item.text.length;
      }
      if (t < 1) requestAnimationFrame(frame);
      else for (const item of items) item.node.textContent = item.text;
    };
    requestAnimationFrame(frame);
  };

  const titles = () => {
    const list = [...document.querySelectorAll('[data-scramble]')];
    if (document.body.hasAttribute('data-scramble-titles')) {
      list.push(...document.querySelectorAll('h2.h2, h1.h2, .section-header h2, .main-page__title, .faq-hub__title, .brand-story__title, .nuit-title'));
    }
    return [...new Set(list)];
  };

  const watch = () => {
    if (reduce || !document.body.hasAttribute('data-scramble-titles') || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          scramble(entry.target);
        }
      },
      { threshold: 0.5 }
    );
    for (const el of titles()) observer.observe(el);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
  document.addEventListener('shopify:section:load', watch);
})();
