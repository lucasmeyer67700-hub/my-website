/**
 * Douceur — theme scripts.
 * Native Web Components only, no dependencies. Every component enhances
 * markup that already works without JavaScript (forms post normally,
 * <details> opens natively, links stay links).
 */

const theme = window.theme || { routes: {}, strings: {} };

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Announces a message to screen readers through the global live region.
 * @param {string} message
 */
function announce(message) {
  const region = document.querySelector('[data-live-region]');
  if (!region || !message) return;
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

/**
 * Publishes a custom event to Shopify's Customer Events (Web Pixels).
 * Standard events (product_viewed, product_added_to_cart, checkout_started,
 * checkout_completed…) are emitted by Shopify itself and must not be duplicated.
 * Custom pixels respect the visitor's consent through Shopify's privacy API.
 * @param {string} name
 * @param {Record<string, unknown>} [data]
 */
function track(name, data = {}) {
  try {
    window.Shopify?.analytics?.publish?.(name, data);
  } catch (error) {
    // Analytics must never break the storefront.
  }
}

/**
 * Parses an HTML string returned by the Section Rendering API.
 * @param {string} html
 * @returns {Document}
 */
function parseHTML(html) {
  return new DOMParser().parseFromString(html, 'text/html');
}

/**
 * Replaces the inner HTML of every live element matching `selector`
 * with the matching element found in `html`.
 * @param {string | undefined} html
 * @param {string} selector
 */
function swapSection(html, selector) {
  if (!html) return;
  const source = parseHTML(html).querySelector(selector);
  const target = document.querySelector(selector);
  if (source && target) target.innerHTML = source.innerHTML;
}

/**
 * Calls the Ajax Cart API with bundled section rendering.
 * @param {string} url
 * @param {FormData | Record<string, unknown>} body
 * @returns {Promise<any>}
 */
async function cartRequest(url, body) {
  const isFormData = body instanceof FormData;
  const response = await fetch(url, {
    method: 'POST',
    headers: isFormData ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: isFormData ? body : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || data.status) {
    const error = new Error(data.description || data.message || 'Cart error');
    error.data = data;
    throw error;
  }
  return data;
}

function getCartSectionIds() {
  const ids = ['cart-icon-bubble'];
  if (document.querySelector('cart-drawer')) ids.push('cart-drawer');
  const mainCart = document.querySelector('[data-main-cart]');
  if (mainCart?.dataset.sectionId) ids.push(mainCart.dataset.sectionId);
  return ids;
}

function renderCartSections(sections = {}) {
  swapSection(sections['cart-icon-bubble'], '[data-cart-icon]');
  swapSection(sections['cart-drawer'], '[data-cart-drawer-content]');
  const mainCart = document.querySelector('[data-main-cart]');
  if (mainCart?.dataset.sectionId) {
    swapSection(sections[mainCart.dataset.sectionId], '[data-main-cart]');
  }
}

/* -------------------------------------------------------------------------- */
/* Dialog-based drawers (mobile menu, cart, gallery zoom)                      */
/* -------------------------------------------------------------------------- */

class ModalDrawer extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector('dialog');
    if (!this.dialog) return;

    this.dialog.addEventListener('click', (event) => {
      // A click on the backdrop targets the dialog element itself.
      if (event.target === this.dialog) this.close();
    });

    this.addEventListener('click', (event) => {
      if (event.target.closest('[data-drawer-close]')) this.close();
    });

    const triggerSelector = this.dataset.trigger;
    if (triggerSelector) {
      for (const trigger of document.querySelectorAll(triggerSelector)) {
        trigger.addEventListener('click', (event) => {
          event.preventDefault();
          this.open(trigger);
        });
      }
    }
  }

  /** @param {HTMLElement} [trigger] */
  open(trigger) {
    if (!this.dialog || this.dialog.open) return;
    this.trigger = trigger || document.activeElement;
    this.trigger?.setAttribute?.('aria-expanded', 'true');
    this.dialog.showModal();
  }

  close() {
    if (!this.dialog?.open) return;
    this.dialog.close();
    this.trigger?.setAttribute?.('aria-expanded', 'false');
    this.trigger?.focus?.();
  }
}

customElements.define('modal-drawer', ModalDrawer);

class CartDrawer extends ModalDrawer {
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('change', this.#onChange.bind(this));
    this.addEventListener('click', this.#onRemove.bind(this));
  }

  #onChange(event) {
    const input = event.target.closest('[data-line-quantity]');
    if (!input) return;
    updateCartLine(Number(input.dataset.line), Number(input.value), input);
  }

  #onRemove(event) {
    const button = event.target.closest('[data-remove-line]');
    if (!button) return;
    event.preventDefault();
    updateCartLine(Number(button.dataset.line), 0, button);
  }
}

customElements.define('cart-drawer', CartDrawer);

/**
 * Changes a cart line quantity and re-renders every cart view.
 * @param {number} line
 * @param {number} quantity
 * @param {HTMLElement} source
 */
async function updateCartLine(line, quantity, source) {
  const container = source.closest('[data-cart-drawer-content], [data-main-cart]');
  container?.setAttribute('aria-busy', 'true');

  try {
    const cart = await cartRequest(`${theme.routes.cartChange}.js`, {
      line,
      quantity: Math.max(0, quantity),
      sections: getCartSectionIds(),
      sections_url: window.location.pathname,
    });
    renderCartSections(cart.sections);
    announce(theme.strings.cartUpdated);

    // Restore focus on the same line when possible, otherwise on the container title.
    const refreshed =
      document.querySelector(`[data-line-quantity][data-line="${line}"]`) ||
      document.querySelector('[data-cart-title]');
    refreshed?.focus?.();
  } catch (error) {
    const errorTarget = document.querySelector('[data-cart-error]');
    if (errorTarget) {
      errorTarget.textContent = error.data?.description || theme.strings.cartError;
      errorTarget.hidden = false;
    }
    announce(theme.strings.cartError);
  } finally {
    container?.removeAttribute('aria-busy');
  }
}

class CartItems extends HTMLElement {
  connectedCallback() {
    this.addEventListener('change', (event) => {
      const input = event.target.closest('[data-line-quantity]');
      if (!input) return;
      updateCartLine(Number(input.dataset.line), Number(input.value), input);
    });
    this.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove-line]');
      if (!button) return;
      event.preventDefault();
      updateCartLine(Number(button.dataset.line), 0, button);
    });
  }
}

customElements.define('cart-items', CartItems);

/* -------------------------------------------------------------------------- */
/* Quantity selector                                                           */
/* -------------------------------------------------------------------------- */

class QuantityInput extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input');
    this.addEventListener('click', (event) => {
      const button = event.target.closest('[data-step]');
      if (!button || !this.input) return;
      event.preventDefault();
      const min = Number(this.input.min || 0);
      const max = this.input.max ? Number(this.input.max) : Infinity;
      const next = Number(this.input.value || 0) + Number(button.dataset.step);
      const value = Math.min(max, Math.max(min, next));
      if (value === Number(this.input.value)) return;
      this.input.value = String(value);
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
}

customElements.define('quantity-input', QuantityInput);

/* -------------------------------------------------------------------------- */
/* Product form                                                                */
/* -------------------------------------------------------------------------- */

class ProductForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    this.error = this.querySelector('[data-product-error]');
    if (!this.form) return;
    // Without the cart drawer, the native form post to /cart is kept.
    if (theme.cartType !== 'drawer' || !document.querySelector('cart-drawer')) return;
    this.form.addEventListener('submit', this.#onSubmit.bind(this));
  }

  get submitButtons() {
    return [
      ...this.form.querySelectorAll('[type="submit"]'),
      ...document.querySelectorAll(`[type="submit"][form="${this.form.id}"]`),
    ];
  }

  /** @param {boolean} busy */
  #setBusy(busy) {
    for (const button of this.submitButtons) {
      button.setAttribute('aria-busy', String(busy));
      button.toggleAttribute('disabled', busy);
    }
  }

  async #onSubmit(event) {
    event.preventDefault();
    if (this.form.querySelector('[name="id"]')?.disabled) return;

    this.#setBusy(true);
    if (this.error) this.error.hidden = true;

    const formData = new FormData(this.form);
    formData.append('sections', getCartSectionIds().join(','));
    formData.append('sections_url', window.location.pathname);

    try {
      const result = await cartRequest(`${theme.routes.cartAdd}.js`, formData);
      renderCartSections(result.sections);
      document.querySelector('cart-drawer')?.open(event.submitter || this.submitButtons[0]);
    } catch (error) {
      if (this.error) {
        this.error.querySelector('[data-error-message]').textContent =
          error.data?.description || theme.strings.productError;
        this.error.hidden = false;
      }
      announce(error.data?.description || theme.strings.productError);
    } finally {
      this.#setBusy(false);
    }
  }
}

customElements.define('product-form', ProductForm);

/* -------------------------------------------------------------------------- */
/* Variant picker                                                              */
/* -------------------------------------------------------------------------- */

class VariantPicker extends HTMLElement {
  connectedCallback() {
    const data = this.querySelector('[data-variants]');
    this.variants = data ? JSON.parse(data.textContent) : [];
    this.section = this.closest('[data-product-section]');
    this.addEventListener('change', this.#onChange.bind(this));
  }

  #selectedOptions() {
    return [...this.querySelectorAll('fieldset')].map(
      (fieldset) => fieldset.querySelector('input:checked')?.value
    );
  }

  #onChange(event) {
    const fieldset = event.target.closest('fieldset');
    const label = fieldset?.querySelector('[data-selected-value]');
    if (label) label.textContent = event.target.value;

    const options = this.#selectedOptions();
    const variant = this.variants.find((candidate) =>
      candidate.options.every((value, index) => value === options[index])
    );
    this.#update(variant);

    const optionName = fieldset?.dataset.optionName;
    if (optionName) announce(`${optionName} : ${event.target.value}`);
    if (variant) track('theme:variant_selected', { variant_id: variant.id, variant_title: variant.title });
  }

  /** @param {any} variant */
  #update(variant) {
    const scope = this.section || document;

    for (const input of scope.querySelectorAll('[data-variant-id-input]')) {
      input.value = variant ? variant.id : '';
      input.disabled = !variant;
    }

    for (const current of scope.querySelectorAll('[data-price-current]')) {
      if (variant) current.textContent = variant.price;
    }
    for (const compare of scope.querySelectorAll('[data-price-compare]')) {
      compare.textContent = variant?.compare_at_price || '';
      compare.hidden = !variant?.compare_at_price;
    }

    let label = theme.strings.addToCart;
    if (!variant) label = theme.strings.unavailable;
    else if (!variant.available) label = theme.strings.soldOut;

    const buttons = scope.querySelectorAll('[data-add-to-cart]');
    for (const button of buttons) {
      const unavailable = !variant || !variant.available;
      button.toggleAttribute('disabled', unavailable);
      button.querySelector('[data-add-to-cart-label]').textContent = label;
    }

    for (const title of scope.querySelectorAll('[data-variant-title]')) {
      title.textContent = variant ? variant.title : '';
    }

    if (variant) {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());

      if (variant.featured_media_id) {
        scope.querySelector('media-gallery')?.showMedia(variant.featured_media_id);
      }
    }
  }
}

customElements.define('variant-picker', VariantPicker);

/* -------------------------------------------------------------------------- */
/* Product media gallery                                                       */
/* -------------------------------------------------------------------------- */

class MediaGallery extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[data-gallery-track]');
    this.slides = [...this.querySelectorAll('[data-gallery-slide]')];
    this.thumbs = [...this.querySelectorAll('[data-gallery-thumb]')];
    this.counter = this.querySelector('[data-gallery-counter]');
    this.prev = this.querySelector('[data-gallery-prev]');
    this.next = this.querySelector('[data-gallery-next]');
    this.lightbox = this.querySelector('[data-gallery-lightbox]');
    this.index = 0;
    if (!this.track || this.slides.length === 0) return;

    this.observer = new IntersectionObserver(this.#onIntersect.bind(this), {
      root: this.track,
      threshold: 0.6,
    });
    for (const slide of this.slides) this.observer.observe(slide);

    this.prev?.addEventListener('click', () => this.goTo(this.index - 1));
    this.next?.addEventListener('click', () => this.goTo(this.index + 1));
    for (const [index, thumb] of this.thumbs.entries()) {
      thumb.addEventListener('click', () => this.goTo(index));
    }

    this.track.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') this.goTo(this.index + 1);
      if (event.key === 'ArrowLeft') this.goTo(this.index - 1);
    });

    this.addEventListener('click', (event) => {
      const zoom = event.target.closest('[data-gallery-zoom]');
      if (zoom) this.#openLightbox(zoom);
      if (event.target.closest('[data-lightbox-close]') || event.target === this.lightbox) {
        this.lightbox?.close();
      }
    });

    // Start on the selected variant's image (e.g. when arriving with ?variant=).
    const initialIndex = this.slides.findIndex((slide) => slide.dataset.mediaId === this.dataset.initialMedia);
    if (initialIndex > 0) {
      this.track.scrollLeft = this.slides[initialIndex].offsetLeft;
      this.#setActive(initialIndex);
    }
  }

  disconnectedCallback() {
    this.observer?.disconnect();
  }

  /** @param {IntersectionObserverEntry[]} entries */
  #onIntersect(entries) {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      this.#setActive(this.slides.indexOf(entry.target));
    }
  }

  /** @param {number} index */
  #setActive(index) {
    if (index < 0) return;
    this.index = index;
    for (const [i, thumb] of this.thumbs.entries()) {
      if (i === index) thumb.setAttribute('aria-current', 'true');
      else thumb.removeAttribute('aria-current');
    }
    if (this.counter) this.counter.textContent = `${index + 1} / ${this.slides.length}`;
    if (this.prev) this.prev.disabled = index === 0;
    if (this.next) this.next.disabled = index === this.slides.length - 1;
  }

  /** @param {number} index */
  goTo(index) {
    const target = this.slides[Math.max(0, Math.min(index, this.slides.length - 1))];
    if (!target) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.track.scrollTo({ left: target.offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
    this.#setActive(this.slides.indexOf(target));
  }

  /** @param {string | number} mediaId */
  showMedia(mediaId) {
    const index = this.slides.findIndex((slide) => slide.dataset.mediaId === String(mediaId));
    if (index >= 0) this.goTo(index);
  }

  /** @param {HTMLElement} trigger */
  #openLightbox(trigger) {
    if (!this.lightbox) return;
    const image = this.lightbox.querySelector('[data-lightbox-image]');
    image.src = trigger.dataset.zoomSrc;
    image.alt = trigger.dataset.zoomAlt || '';
    this.lightbox.showModal();
  }
}

customElements.define('media-gallery', MediaGallery);

/* -------------------------------------------------------------------------- */
/* Sticky add-to-cart bar (mobile)                                             */
/* -------------------------------------------------------------------------- */

class StickyBuyBar extends HTMLElement {
  connectedCallback() {
    const target = document.getElementById(this.dataset.watch);
    if (!target) return;
    this.observer = new IntersectionObserver(([entry]) => {
      const passed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      this.classList.toggle('is-visible', passed);
      this.toggleAttribute('inert', !passed);
      document.body.classList.toggle('has-sticky-bar', passed);
    });
    this.observer.observe(target);
    this.toggleAttribute('inert', true);
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    document.body.classList.remove('has-sticky-bar');
  }
}

customElements.define('sticky-buy-bar', StickyBuyBar);

/* -------------------------------------------------------------------------- */
/* Header: elevate on scroll                                                   */
/* -------------------------------------------------------------------------- */

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
    document.body.prepend(sentinel);
    this.observer = new IntersectionObserver(([entry]) => {
      this.classList.toggle('is-scrolled', !entry.isIntersecting);
    });
    this.observer.observe(sentinel);

    // Expose the height of the announcement bar + header so a full-screen
    // banner can fill exactly the rest of the first screen.
    this.abort = new AbortController();
    const groups = () => document.querySelectorAll('.shopify-section-group-header-group');
    const update = () => {
      let height = 0;
      for (const group of groups()) height += group.offsetHeight;
      document.documentElement.style.setProperty('--header-offset', `${height}px`);
    };
    this.resizeObserver = new ResizeObserver(update);
    const observeAll = () => {
      this.resizeObserver.disconnect();
      for (const group of groups()) this.resizeObserver.observe(group);
      update();
    };
    observeAll();
    // Theme editor: header-group sections can be added or re-rendered.
    const refresh = () => requestAnimationFrame(observeAll);
    document.addEventListener('shopify:section:load', refresh, { signal: this.abort.signal });
    document.addEventListener('shopify:section:unload', refresh, { signal: this.abort.signal });
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    this.resizeObserver?.disconnect();
    this.abort?.abort();
  }
}

customElements.define('site-header', SiteHeader);

/* -------------------------------------------------------------------------- */
/* Announcement bar: messages cross-fade in place                              */
/* -------------------------------------------------------------------------- */

class AnnouncementRotator extends HTMLElement {
  connectedCallback() {
    this.items = [...this.querySelectorAll('[data-announcement]')];
    this.toggle = this.querySelector('[data-announcement-toggle]');
    if (this.items.length < 2) return;

    clearTimeout(this.timer);
    this.abort?.abort();
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };

    this.index = Math.max(0, this.items.findIndex((item) => item.classList.contains('is-active')));
    this.delay = Number(this.dataset.interval) || 5000;
    this.hovered = false;
    this.focused = false;
    this.#setPaused(false);

    // The pause button is only useful (and shown) once rotation is running.
    if (this.toggle) this.toggle.hidden = false;
    this.toggle?.addEventListener(
      'click',
      () => {
        this.#setPaused(!this.userPaused);
        // An explicit "play" wins over the hover/focus pause.
        if (!this.userPaused) {
          this.hovered = false;
          this.focused = false;
        }
        this.#schedule();
      },
      options
    );

    // Pause while the visitor reads or interacts with the bar (WCAG 2.2.2).
    this.addEventListener('mouseenter', () => { this.hovered = true; this.#schedule(); }, options);
    this.addEventListener('mouseleave', () => { this.hovered = false; this.#schedule(); }, options);
    this.addEventListener('focusin', (event) => {
      // Focusing the pause button itself must not freeze the rotation.
      if (event.target === this.toggle) return;
      this.focused = true;
      this.#schedule();
    }, options);
    this.addEventListener('focusout', (event) => {
      if (this.contains(event.relatedTarget) && event.relatedTarget !== this.toggle) return;
      this.focused = false;
      this.#schedule();
    }, options);
    document.addEventListener('visibilitychange', () => this.#schedule(), options);

    // Theme editor: show the selected message while it is being edited.
    this.addEventListener('shopify:block:select', (event) => {
      const index = this.items.indexOf(event.target.closest('[data-announcement]'));
      if (index < 0) return;
      this.#setPaused(true);
      this.show(index);
      this.#schedule();
    }, options);
    this.addEventListener('shopify:block:deselect', () => {
      this.#setPaused(false);
      this.#schedule();
    }, options);

    this.#schedule();
  }

  disconnectedCallback() {
    clearTimeout(this.timer);
    this.abort?.abort();
  }

  /** @param {number} index */
  show(index) {
    this.index = (index + this.items.length) % this.items.length;
    for (const [i, item] of this.items.entries()) {
      const active = i === this.index;
      item.classList.toggle('is-active', active);
      for (const link of item.querySelectorAll('a')) link.tabIndex = active ? 0 : -1;
    }
  }

  /** @param {boolean} paused */
  #setPaused(paused) {
    this.userPaused = paused;
    this.toggle?.setAttribute('aria-pressed', String(paused));
  }

  #schedule() {
    clearTimeout(this.timer);
    if (this.userPaused || this.hovered || this.focused || document.hidden) return;
    this.timer = setTimeout(() => {
      this.show(this.index + 1);
      this.#schedule();
    }, this.delay);
  }
}

customElements.define('announcement-rotator', AnnouncementRotator);

/* -------------------------------------------------------------------------- */
/* Decorative drops: pause button, and no work while off screen               */
/* -------------------------------------------------------------------------- */

class DropsLayer extends HTMLElement {
  #controller = null;
  #observer = null;
  #paused = false;

  connectedCallback() {
    if (!this.classList.contains('drops--animated')) return;
    const toggle = this.querySelector('[data-drops-toggle]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    const sync = () => {
      if (toggle) toggle.hidden = reduced.matches;
    };
    sync();
    reduced.addEventListener('change', sync, { signal });

    toggle?.addEventListener(
      'click',
      () => {
        this.#paused = !this.#paused;
        toggle.setAttribute('aria-pressed', String(this.#paused));
        this.classList.toggle('is-paused', this.#paused);
      },
      { signal }
    );

    if ('IntersectionObserver' in window) {
      this.#observer = new IntersectionObserver(([entry]) => {
        this.classList.toggle('is-paused', this.#paused || !entry.isIntersecting);
      });
      this.#observer.observe(this);
    }
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#observer?.disconnect();
  }
}

customElements.define('drops-layer', DropsLayer);

/* -------------------------------------------------------------------------- */
/* Misc                                                                        */
/* -------------------------------------------------------------------------- */

class CopyButton extends HTMLElement {
  connectedCallback() {
    this.querySelector('button')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(this.dataset.copy || '');
        announce(theme.strings.copied);
        const status = this.querySelector('[data-copy-status]');
        if (status) status.hidden = false;
      } catch (error) {
        // Clipboard can be unavailable (permissions); the code stays visible.
      }
    });
  }
}

customElements.define('copy-button', CopyButton);

function initReveal() {
  if (!document.body.hasAttribute('data-reveal-enabled')) return;
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    for (const item of items) item.classList.add('is-visible');
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' }
  );
  for (const item of items) observer.observe(item);
}

function initNewsletterTracking() {
  if (document.querySelector('[data-newsletter-success]')) track('theme:newsletter_signup');
}

document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initNewsletterTracking();
});

// Re-run reveal when a section is (re)loaded in the theme editor.
document.addEventListener('shopify:section:load', initReveal);
