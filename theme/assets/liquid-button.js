/**
 * Liquid buttons: a drop of ink follows the pointer inside each theme button
 * (.button) and fills it, with a ring that spreads on click or tap.
 *
 * - Main buttons (dark): the ink is the brand rose, the label stays white.
 * - Secondary buttons (outline): the ink is the dark brown and, where it
 *   passes, a copy of the label turns white (clipped to the ink's shape).
 *
 * Nothing is added to a button until the pointer first reaches it, so the
 * page opens without any extra work. The label is in the DOM only once: the
 * white copy draws its text with ::before { content: attr(data-liquid-text) }.
 * Visitors who ask for less motion get the fill without wobble or ring.
 */
(() => {
  if (!('PointerEvent' in window) || !window.SVGElement) return;

  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  let count = 0;

  class LiquidButton {
    /** @param {HTMLElement} button */
    constructor(button) {
      this.button = button;
      // The ink takes a colour that shows on this button: dark brown on a rose
      // button, rose on a dark one, the text colour on an outline button.
      const background = getComputedStyle(button).backgroundColor.match(/[\d.]+/g)?.map(Number) || [0, 0, 0, 0];
      const [r, g, b, a = 1] = background;
      this.outline = a < 0.2;
      if (!this.outline) {
        const rosy = r > 120 && r - b > 30 && r - g > 30;
        button.style.setProperty('--liquid-fill', rosy ? '#2b2422' : 'var(--rose-cta)');
      }
      button.classList.toggle('is-liquid-outline', this.outline);
      count += 1;
      const id = `liquid-ink-${count}`;
      this.s = {
        x: 0, y: 0, radius: 0, velocity: 0, pointer: false, focus: false,
        targetSpeed: 0, speed: 0, targetAngle: 0, angle: 0, stretch: 1,
        frame: 0, last: 0, lastTime: 0, lastX: 0, lastY: 0, time: 0, jx: 0, jy: 0,
        ring: 0, ringProgress: 0, ringX: 0, ringY: 0, ringAngle: 0,
        ringPeak: 0.58, ringDip: 0.86, ringSpeed: 1,
      };

      // The ink, its rough edge (noise + displacement) and the ring.
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'liquid-button__ink');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      svg.innerHTML = `
        <defs>
          <filter id="${id}-filter" x="-35%" y="-45%" width="170%" height="190%" color-interpolation-filters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.035 0.08" numOctaves="2" seed="8" result="noise"></feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap>
          </filter>
          <clipPath id="${id}-clip" clipPathUnits="userSpaceOnUse"><ellipse cx="0" cy="0" rx="0" ry="0"></ellipse></clipPath>
        </defs>
        <ellipse class="liquid-button__blob" filter="url(#${id}-filter)" cx="0" cy="0" rx="0" ry="0"></ellipse>
        <circle class="liquid-button__ring" filter="url(#${id}-filter)" cx="0" cy="0" r="0" style="display:none"></circle>`;
      this.svg = svg;
      this.turbulence = svg.querySelector('feTurbulence');
      this.displacement = svg.querySelector('feDisplacementMap');
      this.blob = svg.querySelector('.liquid-button__blob');
      this.clip = svg.querySelector('clipPath ellipse');
      this.ringEl = svg.querySelector('.liquid-button__ring');
      button.prepend(svg);
      button.classList.add('is-liquid');

      // Outline buttons: the white copy of the label, shown only under the ink.
      if (this.outline) {
        this.inverted = document.createElement('span');
        this.inverted.className = 'liquid-button__inverted';
        this.inverted.setAttribute('aria-hidden', 'true');
        this.inverted.style.clipPath = `url(#${id}-clip)`;
        this.inverted.style.webkitClipPath = `url(#${id}-clip)`;
        button.append(this.inverted);
        this.copyLabel();
        this.observer = new MutationObserver((records) => {
          if (records.some((record) => !this.isOwn(record.target))) this.copyLabel();
        });
        this.observer.observe(button, { subtree: true, childList: true, characterData: true });
      }

      this.listen();
    }

    isOwn(node) {
      const element = node.nodeType === 1 ? node : node.parentElement;
      return !!element && (this.svg.contains(element) || !!this.inverted?.contains(element));
    }

    /** The label, copied without its text nodes (drawn by ::before instead). */
    copyLabel() {
      const fragment = document.createDocumentFragment();
      for (const node of this.button.childNodes) {
        if (node === this.svg || node === this.inverted) continue;
        const clone = node.cloneNode(true);
        if (clone.nodeType === 1) {
          clone.removeAttribute('id');
          for (const el of clone.querySelectorAll('[id]')) el.removeAttribute('id');
          for (const el of clone.querySelectorAll('[data-add-to-cart-label], [data-error-message]')) {
            el.removeAttribute('data-add-to-cart-label');
            el.removeAttribute('data-error-message');
          }
        }
        fragment.append(clone);
      }
      fragment.normalize();
      for (const el of fragment.querySelectorAll('svg title, svg desc')) el.remove();
      const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
      const texts = [];
      while (walker.nextNode()) texts.push(walker.currentNode);
      for (const text of texts) {
        if (!text.data.trim() || text.parentNode instanceof SVGElement) continue;
        const label = document.createElement('span');
        label.setAttribute('data-liquid-text', text.data.trim());
        text.replaceWith(label);
      }
      this.inverted.replaceChildren(fragment);
    }

    get disabled() {
      return this.button.hasAttribute('disabled') || this.button.getAttribute('aria-disabled') === 'true';
    }

    size() {
      return { width: this.button.clientWidth, height: this.button.clientHeight, rect: this.svg.getBoundingClientRect() };
    }

    local(clientX, clientY) {
      const { rect, width, height } = this.size();
      if (!width || !height || !rect.width || !rect.height) return null;
      return {
        x: clamp(((clientX - rect.left) * width) / rect.width, 0, width),
        y: clamp(((clientY - rect.top) * height) / rect.height, 0, height),
        width,
        height,
      };
    }

    setOrigin(clientX, clientY) {
      const point = this.local(clientX, clientY);
      if (!point) return;
      this.s.x = point.x;
      this.s.y = point.y;
    }

    velocity(event) {
      const s = this.s;
      const now = performance.now();
      if (s.lastTime > 0) {
        const elapsed = Math.max(8, now - s.lastTime);
        const dx = event.clientX - s.lastX;
        const dy = event.clientY - s.lastY;
        s.targetSpeed = clamp(Math.hypot(dx, dy) / elapsed / 1.65, 0, 1);
        if (Math.hypot(dx, dy) > 0.5) s.targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
      }
      s.lastTime = now;
      s.lastX = event.clientX;
      s.lastY = event.clientY;
    }

    impulse(clientX, clientY) {
      const point = this.local(clientX, clientY);
      if (!point) return;
      const s = this.s;
      s.ringX = point.x;
      s.ringY = point.y;
      if (!reduce.matches) {
        s.ring = 1;
        s.ringProgress = 0;
        s.ringPeak = 0.56 + Math.random() * 0.09;
        s.ringDip = 0.82 + Math.random() * 0.08;
        s.ringSpeed = 0.92 + Math.random() * 0.22;
        const dx = point.x - point.width / 2;
        const dy = point.y - point.height / 2;
        const base = Math.hypot(dx, dy) > 2 ? Math.atan2(dy, dx) : -Math.PI / 2;
        s.ringAngle = base + (Math.random() - 0.5) * 0.85;
        this.turbulence.setAttribute('seed', String(Math.floor(Math.random() * 9999) + 1));
      }
      s.velocity += 130 + Math.random() * 50;
      this.schedule();
    }

    schedule() {
      if (!this.s.frame) this.s.frame = requestAnimationFrame((now) => this.tick(now));
    }

    shape(element, rx, ry) {
      const s = this.s;
      const x = s.x + s.jx;
      const y = s.y + s.jy;
      element.setAttribute('cx', x.toFixed(2));
      element.setAttribute('cy', y.toFixed(2));
      element.setAttribute('rx', Math.max(0, rx).toFixed(2));
      element.setAttribute('ry', Math.max(0, ry).toFixed(2));
      element.setAttribute('transform', `rotate(${s.angle.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})`);
    }

    render(width, height) {
      const s = this.s;
      const axis = Math.sqrt(s.stretch);
      this.shape(this.blob, s.radius * axis, s.radius / axis);
      this.shape(this.clip, s.radius * axis, s.radius / axis);

      const still = reduce.matches;
      if (!still) {
        const breath = 1 + Math.sin(s.time * 2.5) * 0.12;
        this.turbulence.setAttribute('baseFrequency', `${(0.035 * breath).toFixed(4)} ${(0.08 * (2 - breath)).toFixed(4)}`);
      }
      const ringStir = s.ring > 0 ? (1 - s.ringProgress) * 18 : 0;
      const scale = still ? 0 : 4.5 + s.speed * 18 + Math.sin(s.time * 4) * 1.5 + ringStir;
      this.displacement.setAttribute('scale', scale.toFixed(2));

      if (s.ring > 0) {
        const base = Math.min(width, height);
        const peak = base * s.ringPeak;
        const dip = peak * s.ringDip;
        let radius = 0;
        let opacity = 0;
        let stroke = 2.4;
        if (s.ring === 1) {
          radius = (1 - Math.pow(1 - s.ringProgress, 3)) * peak;
          opacity = 0.95 - s.ringProgress * 0.12;
          stroke = 2.6 - s.ringProgress * 0.3;
        } else if (s.ring === 2) {
          radius = peak - Math.sin(s.ringProgress * Math.PI) * (peak - dip);
          opacity = 0.88;
          stroke = 2.3;
        } else {
          radius = dip + s.ringProgress * Math.max(width, height) * 0.85;
          opacity = Math.max(0, 0.88 * (1 - s.ringProgress));
          stroke = Math.max(1, 2.3 * (1 - s.ringProgress * 0.6));
        }
        this.ringEl.setAttribute('cx', (s.ringX + s.jx * 0.5).toFixed(2));
        this.ringEl.setAttribute('cy', (s.ringY + s.jy * 0.5).toFixed(2));
        this.ringEl.setAttribute('r', Math.max(0, radius).toFixed(2));
        this.ringEl.setAttribute('opacity', Math.max(0, opacity).toFixed(3));
        this.ringEl.style.strokeWidth = `${stroke.toFixed(2)}px`;
        this.ringEl.style.display = 'block';
      } else {
        this.ringEl.style.display = 'none';
      }
    }

    tick(now) {
      const s = this.s;
      s.frame = 0;
      const dt = s.last === 0 ? 1 / 60 : clamp((now - s.last) / 1000, 1 / 240, 1 / 30);
      s.last = now;
      s.time += dt;
      const { width, height } = this.size();
      if (!width || !height) return;
      const still = reduce.matches;

      if (still) {
        s.jx = 0;
        s.jy = 0;
        s.ring = 0;
      } else {
        const t = s.time;
        s.jx = Math.sin(t * 3.7) * 2.2 + Math.sin(t * 7.1 + 1.2) * 1.4 + Math.cos(t * 11.3) * 0.8;
        s.jy = Math.cos(t * 3.1) * 1.8 + Math.sin(t * 6.3 + 2.4) * 1.2 + Math.sin(t * 13.1) * 0.6;
      }

      s.speed += (s.targetSpeed - s.speed) * (1 - Math.exp(-dt / 0.105));
      s.targetSpeed = 0;
      const breathing = still ? 0 : Math.sin(s.time * 2.8) * 0.04;
      const wanted = 1 + s.speed * 0.55 + (s.pointer ? breathing : 0);
      s.stretch += (wanted - s.stretch) * (1 - Math.exp(-dt / 0.08));
      const turn = ((s.targetAngle - s.angle + 540) % 360) - 180;
      s.angle += turn * (1 - Math.exp(-dt / 0.075));

      if (s.ring === 1) {
        s.ringProgress += dt * 3.8 * s.ringSpeed;
        if (s.ringProgress >= 1) { s.ring = 2; s.ringProgress = 0; }
      } else if (s.ring === 2) {
        s.ringProgress += dt * 7.8 * s.ringSpeed;
        if (s.ringProgress >= 1) { s.ring = 3; s.ringProgress = 0; }
      } else if (s.ring === 3) {
        s.ringProgress += dt * 3.5 * s.ringSpeed;
        const glide = Math.max(width, height) * 1.55 * dt * s.ringSpeed;
        s.ringX += Math.cos(s.ringAngle) * glide;
        s.ringY += Math.sin(s.ringAngle) * glide;
        if (s.ringProgress >= 1) { s.ring = 0; s.ringProgress = 0; }
      }

      const active = (s.pointer || s.focus) && !this.disabled;
      const corner = Math.max(
        Math.hypot(s.x, s.y),
        Math.hypot(width - s.x, s.y),
        Math.hypot(s.x, height - s.y),
        Math.hypot(width - s.x, height - s.y)
      );
      const target = active ? corner * Math.sqrt(s.stretch) * 1.14 : 0;
      if (still) {
        s.radius = target;
        s.velocity = 0;
      } else {
        s.velocity += ((target - s.radius) * 150 - s.velocity * 24) * dt;
        s.radius += s.velocity * dt;
      }
      if (s.radius < 0) {
        s.radius = 0;
        s.velocity = 0;
      }

      this.render(width, height);

      if (active || s.ring > 0 || Math.abs(s.radius) > 0.1) {
        s.frame = requestAnimationFrame((next) => this.tick(next));
      } else {
        Object.assign(s, { last: 0, radius: 0, velocity: 0, stretch: 1, speed: 0, ring: 0 });
        this.render(width, height);
      }
    }

    listen() {
      const b = this.button;
      const s = this.s;
      b.addEventListener('pointerenter', (event) => {
        if (this.disabled || event.pointerType === 'touch') return;
        s.pointer = true;
        this.setOrigin(event.clientX, event.clientY);
        this.velocity(event);
        this.schedule();
      });
      b.addEventListener('pointermove', (event) => {
        if (this.disabled || event.pointerType === 'touch') return;
        this.setOrigin(event.clientX, event.clientY);
        this.velocity(event);
        this.schedule();
      }, { passive: true });
      b.addEventListener('pointerleave', (event) => {
        if (event.pointerType !== 'touch') this.setOrigin(event.clientX, event.clientY);
        s.pointer = false;
        s.lastTime = 0;
        b.classList.remove('is-pressed');
        this.schedule();
      });
      b.addEventListener('pointerdown', (event) => {
        if (this.disabled) return;
        s.pointer = true;
        b.classList.add('is-pressed');
        this.setOrigin(event.clientX, event.clientY);
        this.impulse(event.clientX, event.clientY);
      });
      const release = (event) => {
        b.classList.remove('is-pressed');
        if (event.type === 'pointercancel' || event.pointerType === 'touch') {
          s.pointer = false;
          s.lastTime = 0;
          this.schedule();
        }
      };
      b.addEventListener('pointerup', release);
      b.addEventListener('pointercancel', release);
      b.addEventListener('focus', () => {
        if (!b.matches(':focus-visible') || this.disabled) return;
        s.focus = true;
        s.x = b.clientWidth / 2;
        s.y = b.clientHeight / 2;
        this.schedule();
      });
      b.addEventListener('blur', () => {
        s.focus = false;
        this.schedule();
      });
    }

    /**
     * Keyboard focus that woke the button up (the button's own focus listener
     * was not there yet). Pointer events need nothing: pointerenter and
     * pointerdown reach the new listeners right after pointerover.
     */
    wake(event) {
      if (event.type !== 'focusin' || !this.button.matches(':focus-visible') || this.disabled) return;
      this.s.focus = true;
      this.s.x = this.button.clientWidth / 2;
      this.s.y = this.button.clientHeight / 2;
      this.schedule();
    }
  }

  const instances = new WeakMap();
  const wake = (event) => {
    const button = event.target instanceof Element ? event.target.closest('.button') : null;
    if (!button || instances.has(button) || button.closest('[data-no-liquid]')) return;
    const instance = new LiquidButton(button);
    instances.set(button, instance);
    instance.wake(event);
  };
  document.addEventListener('pointerover', wake, { passive: true });
  document.addEventListener('focusin', wake);
})();
