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
    // Not form.id: the form has an input named "id", which shadows that property.
    this.formId = this.form.getAttribute('id');
    // Without the cart drawer, the native form post to /cart is kept.
    if (theme.cartType !== 'drawer' || !document.querySelector('cart-drawer')) return;
    this.form.addEventListener('submit', this.#onSubmit.bind(this));
  }

  get submitButtons() {
    return [
      ...this.form.querySelectorAll('[type="submit"]'),
      ...document.querySelectorAll(`[type="submit"][form="${this.formId}"]`),
    ];
  }

  /**
   * Shows (or clears, with an empty message) the error under the main button
   * and in the floating bar, which may be the only one in view.
   * @param {string} message
   */
  #showError(message) {
    if (this.error) {
      const text = this.error.querySelector('[data-error-message]');
      if (text) text.textContent = message;
      this.error.hidden = !message;
    }
    for (const box of document.querySelectorAll(`[data-product-error-for="${this.formId}"]`)) {
      box.textContent = message;
      box.hidden = !message;
    }
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
    this.#showError('');

    const formData = new FormData(this.form);
    formData.append('sections', getCartSectionIds().join(','));
    formData.append('sections_url', window.location.pathname);

    try {
      const result = await cartRequest(`${theme.routes.cartAdd}.js`, formData);
      renderCartSections(result.sections);
      document.querySelector('cart-drawer')?.open(event.submitter || this.submitButtons[0]);
    } catch (error) {
      const message = error.data?.description || theme.strings.productError;
      this.#showError(message);
      announce(message);
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
    this.#syncOptions();
  }

  /**
   * Shows only the values that exist with the options chosen before them
   * (e.g. "Rose + Blanc" only for the Duo) and keeps a valid value checked.
   */
  #syncOptions() {
    const fieldsets = [...this.querySelectorAll('fieldset')];
    const selected = this.#selectedOptions();
    fieldsets.forEach((fieldset, index) => {
      if (index === 0) return;
      const before = selected.slice(0, index);
      let checkedIsValid = false;
      const inputs = [...fieldset.querySelectorAll('input[type="radio"]')];
      for (const input of inputs) {
        const exists = this.variants.some(
          (variant) => before.every((value, i) => variant.options[i] === value) && variant.options[index] === input.value
        );
        input.disabled = !exists;
        const wrapper = input.closest('[data-option-value]');
        if (wrapper) wrapper.hidden = !exists;
        if (input.checked && exists) checkedIsValid = true;
      }
      if (!checkedIsValid) {
        const first = inputs.find((input) => !input.disabled);
        if (first) {
          first.checked = true;
          const label = fieldset.querySelector('[data-selected-value]');
          if (label) label.textContent = first.value;
        }
      }
      selected[index] = fieldset.querySelector('input:checked')?.value;
    });

    // Help line under the colours when a multi-item offer is chosen.
    const offerQty = Number(this.querySelector('[data-offer-qty]:checked')?.dataset.offerQty || 1);
    for (const hint of this.querySelectorAll('[data-multi-hint]')) hint.hidden = offerQty < 2;
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

    this.#syncOptions();
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

    // Real availability of the chosen variant (never a forced "in stock").
    const state = variant ? variant.availability || (variant.available ? 'available' : 'unavailable') : 'unavailable';
    const labelKeys = { in_stock: 'labelInStock', available: 'labelAvailable', unavailable: 'labelUnavailable' };
    for (const status of scope.querySelectorAll('[data-availability]')) {
      status.dataset.state = state;
      const label = status.querySelector('[data-availability-label]');
      const text = status.dataset[labelKeys[state]];
      if (label && text && label.textContent.trim() !== text) label.textContent = text;
    }

    if (variant?.image) {
      for (const image of scope.querySelectorAll('[data-variant-image]')) image.src = variant.image;
    }

    if (variant) {
      // Product pages keep the chosen variant in the address; product blocks on other pages don't.
      if (this.section?.dataset.variantUrl !== 'false') {
        const url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      }

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

const GALLERY_CARD_KEY = 'velea:gallery-card-closed';

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
    this.#initCard();
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

  /**
   * The overlay card can be closed; it stays closed for the visit. In the
   * theme editor nothing is remembered, and selecting the block shows it again.
   */
  #initCard() {
    const card = this.querySelector('[data-gallery-card]');
    const close = card?.querySelector('[data-gallery-card-close]');
    if (!card || !close) return;
    const designMode = Boolean(window.Shopify?.designMode);
    if (designMode) {
      document.addEventListener('shopify:block:select', (event) => {
        if (card.contains(/** @type {Node} */ (event.target)) || event.target === card) card.hidden = false;
      });
    } else {
      try {
        if (window.sessionStorage.getItem(GALLERY_CARD_KEY)) card.hidden = true;
      } catch (error) {
        // Storage blocked: the card simply shows again on the next page.
      }
    }
    close.addEventListener('click', () => {
      card.hidden = true;
      if (designMode) return;
      try {
        window.sessionStorage.setItem(GALLERY_CARD_KEY, '1');
      } catch (error) {
        // Ignored, see above.
      }
    });
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
/* Product reviews: filters, sorting, "see more", photo viewer                 */
/* -------------------------------------------------------------------------- */

class ProductReviews extends HTMLElement {
  #filters = new Set();
  #rating = 'all';
  #sort = 'recent';
  #limit = 5;

  connectedCallback() {
    this.items = [...this.querySelectorAll('[data-review]')];
    this.list = this.querySelector('[data-reviews-list]');
    this.status = this.querySelector('[data-reviews-status]');
    this.more = this.querySelector('[data-reviews-more]');
    this.empty = this.querySelector('[data-reviews-empty]');
    this.lightbox = this.querySelector('[data-reviews-lightbox]');
    this.ratingSelect = this.querySelector('[data-reviews-rating]');
    this.pageSize = Number(this.dataset.pageSize) || 5;
    this.#limit = this.pageSize;
    if (!this.list) return;

    this.addEventListener('click', this.#onClick.bind(this));
    this.ratingSelect?.addEventListener('change', () => {
      this.#rating = this.ratingSelect.value;
      this.#limit = this.pageSize;
      this.#render();
    });
    this.querySelector('[data-reviews-sort]')?.addEventListener('change', (event) => {
      this.#sort = event.target.value;
      this.#render();
    });
    this.#render();
  }

  /** @param {MouseEvent} event */
  #onClick(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    const chip = target.closest('[data-reviews-filter]');
    if (chip) {
      const key = chip.dataset.reviewsFilter;
      const pressed = chip.getAttribute('aria-pressed') !== 'true';
      chip.setAttribute('aria-pressed', String(pressed));
      if (pressed) this.#filters.add(key);
      else this.#filters.delete(key);
      this.#limit = this.pageSize;
      this.#render();
      return;
    }
    if (target.closest('[data-reviews-more]')) {
      const firstNew = this.#limit;
      this.#limit += this.pageSize;
      this.#render();
      // Move focus to the first review that just appeared.
      const visible = [...this.list.children].filter((item) => !item.hidden);
      const next = /** @type {HTMLElement | undefined} */ (visible[firstNew]);
      if (next) {
        next.tabIndex = -1;
        next.focus({ preventScroll: false });
      }
      return;
    }
    if (target.closest('[data-reviews-reset]')) {
      this.#filters.clear();
      this.#rating = 'all';
      if (this.ratingSelect) this.ratingSelect.value = 'all';
      for (const pressed of this.querySelectorAll('[data-reviews-filter][aria-pressed="true"]')) {
        pressed.setAttribute('aria-pressed', 'false');
      }
      this.#limit = this.pageSize;
      this.#render();
      return;
    }
    const photo = target.closest('[data-reviews-photo]');
    if (photo && !photo.closest('[data-reviews-lightbox]')) {
      this.#openPhoto(photo.dataset.reviewsPhoto);
      return;
    }
    if (target.closest('[data-reviews-lightbox-close]') || target === this.lightbox) this.lightbox?.close();
  }

  /** @param {HTMLElement} item */
  #matches(item) {
    if (this.#rating !== 'all' && item.dataset.rating !== this.#rating) return false;
    for (const key of this.#filters) {
      if (key === 'photo' && item.dataset.photo !== '1') return false;
      if (key === 'verified' && item.dataset.verified !== '1') return false;
      if (key.startsWith('color:') && item.dataset.color !== key.slice(6)) return false;
      if (key.startsWith('kw:') && !(item.dataset.text || '').includes(key.slice(3))) return false;
    }
    return true;
  }

  /** @param {HTMLElement[]} items */
  #sorted(items) {
    const recent = (a, b) =>
      (b.dataset.date || '').localeCompare(a.dataset.date || '') || Number(a.dataset.index) - Number(b.dataset.index);
    const compare = {
      recent,
      high: (a, b) => Number(b.dataset.rating) - Number(a.dataset.rating) || recent(a, b),
      low: (a, b) => Number(a.dataset.rating) - Number(b.dataset.rating) || recent(a, b),
      photo: (a, b) => Number(b.dataset.photo) - Number(a.dataset.photo) || recent(a, b),
    };
    return [...items].sort(compare[this.#sort] || recent);
  }

  #render() {
    const ordered = this.#sorted(this.items);
    let total = 0;
    let shown = 0;
    for (const item of ordered) {
      this.list.append(item);
      const match = this.#matches(item);
      if (match) total += 1;
      const visible = match && shown < this.#limit;
      if (visible) shown += 1;
      item.hidden = !visible;
    }
    if (this.more) this.more.hidden = total <= this.#limit;
    if (this.empty) this.empty.hidden = total > 0;
    if (this.status) {
      this.status.textContent = (this.status.dataset.template || '')
        .replace('[shown]', String(shown))
        .replace('[total]', String(total));
    }
  }

  /** @param {string | undefined} index */
  #openPhoto(index) {
    if (!this.lightbox || !index) return;
    const content = this.lightbox.querySelector('[data-reviews-lightbox-content]');
    const template = /** @type {HTMLTemplateElement | null} */ (this.querySelector('[data-reviews-photos]'));
    const image = template?.content.querySelector(`[data-for="${index}"]`);
    const review = this.items.find((item) => item.dataset.index === index);
    content.replaceChildren();
    if (image) content.append(image.cloneNode(true));
    if (review) {
      const copy = /** @type {HTMLElement} */ (review.cloneNode(true));
      copy.hidden = false;
      copy.removeAttribute('data-review');
      content.append(copy);
    }
    this.lightbox.showModal();
  }
}

customElements.define('product-reviews', ProductReviews);

/* -------------------------------------------------------------------------- */
/* Reviews next to the buy button: one at a time, with dots and a pause       */
/* -------------------------------------------------------------------------- */

class ReviewRotator extends HTMLElement {
  #controller = null;
  #timer = null;
  #index = 0;
  #paused = false;
  #held = false;

  connectedCallback() {
    this.slides = [...this.querySelectorAll('[data-review-slide]')];
    if (this.slides.length < 2) return;
    this.dots = [...this.querySelectorAll('[data-review-dot]')];
    this.list = this.querySelector('[data-review-list]');
    this.toggle = this.querySelector('[data-review-toggle]');
    this.interval = Math.max(3, Number(this.dataset.interval) || 6) * 1000;

    this.#controller = new AbortController();
    const { signal } = this.#controller;
    this.addEventListener('click', this.#onClick.bind(this), { signal });
    // Never change the review being read: hold while hovered or focused.
    this.addEventListener('pointerenter', () => this.#hold(true), { signal });
    this.addEventListener('pointerleave', () => this.#hold(false), { signal });
    this.addEventListener('focusin', () => this.#hold(true), { signal });
    this.addEventListener(
      'focusout',
      (event) => {
        if (!this.contains(event.relatedTarget)) this.#hold(false);
      },
      { signal }
    );

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.#setPaused(true);
    else this.#start();
  }

  disconnectedCallback() {
    this.#controller?.abort();
    clearInterval(this.#timer);
  }

  /** @param {number} index */
  show(index) {
    const count = this.slides.length;
    this.#index = (index + count) % count;
    this.slides.forEach((slide, i) => {
      const active = i === this.#index;
      slide.classList.toggle('is-active', active);
      slide.toggleAttribute('aria-hidden', !active);
    });
    this.dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === this.#index)));
  }

  #start() {
    clearInterval(this.#timer);
    const rotating = !this.#paused && !this.#held;
    // Screen readers hear a review only when it changes on request.
    this.list?.setAttribute('aria-live', rotating ? 'off' : 'polite');
    if (rotating) this.#timer = setInterval(() => this.show(this.#index + 1), this.interval);
  }

  /** @param {boolean} held */
  #hold(held) {
    this.#held = held;
    this.#start();
  }

  /** @param {boolean} paused */
  #setPaused(paused) {
    this.#paused = paused;
    this.toggle?.setAttribute('aria-pressed', String(paused));
    this.#start();
  }

  /** @param {MouseEvent} event */
  #onClick(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    const dot = target.closest('[data-review-dot]');
    if (dot) {
      this.show(Number(dot.getAttribute('data-review-dot')));
      this.#start();
      return;
    }
    if (target.closest('[data-review-toggle]')) this.#setPaused(!this.#paused);
  }
}

customElements.define('review-rotator', ReviewRotator);

/* -------------------------------------------------------------------------- */
/* Scrolling band of reviews: pause button, and no work while off screen      */
/* -------------------------------------------------------------------------- */

class ReviewsMarquee extends HTMLElement {
  #controller = null;
  #observer = null;
  #paused = false;

  connectedCallback() {
    const toggle = this.querySelector('[data-marquee-toggle]');
    this.#controller = new AbortController();
    const { signal } = this.#controller;

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
        this.classList.toggle('is-offscreen', !entry.isIntersecting);
      });
      this.#observer.observe(this);
    }
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#observer?.disconnect();
  }
}

customElements.define('reviews-marquee', ReviewsMarquee);

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
    if (this.items.length < 2) return;

    clearTimeout(this.timer);
    this.abort?.abort();
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };

    this.index = Math.max(0, this.items.findIndex((item) => item.classList.contains('is-active')));
    this.delay = Number(this.dataset.interval) || 3000;
    this.focused = false;
    this.editing = false;

    // Keyboard users who tab onto a message link keep it in place while they read it.
    this.addEventListener('focusin', () => { this.focused = true; this.#schedule(); }, options);
    this.addEventListener('focusout', (event) => {
      if (this.contains(event.relatedTarget)) return;
      this.focused = false;
      this.#schedule();
    }, options);
    document.addEventListener('visibilitychange', () => this.#schedule(), options);

    // Theme editor: show the selected message while it is being edited.
    this.addEventListener('shopify:block:select', (event) => {
      const index = this.items.indexOf(event.target.closest('[data-announcement]'));
      if (index < 0) return;
      this.editing = true;
      this.show(index);
      this.#schedule();
    }, options);
    this.addEventListener('shopify:block:deselect', () => {
      this.editing = false;
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

  #schedule() {
    clearTimeout(this.timer);
    if (this.focused || this.editing || document.hidden) return;
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
/* Portrait product video: muted autoplay, pause and sound buttons            */
/* -------------------------------------------------------------------------- */

class VideoPlayer extends HTMLElement {
  #controller = null;
  #observer = null;
  #userPaused = false;

  connectedCallback() {
    this.video = this.querySelector('video');
    if (!this.video) return;
    this.#controller?.abort();
    this.#controller = new AbortController();
    const { signal } = this.#controller;
    const toggle = this.querySelector('[data-video-toggle]');
    const sound = this.querySelector('[data-video-sound]');
    const video = this.video;

    video.muted = true;
    video.playsInline = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.#userPaused = true;
      video.removeAttribute('autoplay');
      video.pause();
    }

    const sync = () => toggle?.setAttribute('aria-pressed', String(video.paused));
    video.addEventListener('play', sync, { signal });
    video.addEventListener('pause', sync, { signal });

    toggle?.addEventListener(
      'click',
      () => {
        this.#userPaused = !video.paused;
        if (this.#userPaused) video.pause();
        else video.play().catch(() => {});
      },
      { signal }
    );
    sound?.addEventListener(
      'click',
      () => {
        video.muted = !video.muted;
        sound.setAttribute('aria-pressed', String(!video.muted));
        if (!video.muted && video.paused) {
          this.#userPaused = false;
          video.play().catch(() => {});
        }
      },
      { signal }
    );

    // No playback (or battery use) while the video is off screen.
    if ('IntersectionObserver' in window) {
      this.#observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) video.pause();
        else if (!this.#userPaused) video.play().catch(() => {});
      }, { threshold: 0.25 });
      this.#observer.observe(this);
    }
    sync();
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#observer?.disconnect();
  }
}

customElements.define('video-player', VideoPlayer);

/* -------------------------------------------------------------------------- */
/* Welcome pop-up: shown once, 10 s after the visitor arrives on the site     */
/* -------------------------------------------------------------------------- */

const WELCOME_KEY = 'velea:welcome';
const VISIT_GAP = 30 * 60 * 1000;
const welcomeStore = {
  get() {
    try {
      return JSON.parse(window.localStorage.getItem(WELCOME_KEY)) || {};
    } catch (error) {
      return {};
    }
  },
  set(value) {
    try {
      window.localStorage.setItem(WELCOME_KEY, JSON.stringify({ ...this.get(), ...value }));
    } catch (error) {
      // Storage can be blocked (private mode): the pop-up simply shows again later.
    }
  },
};

class WelcomePopup extends HTMLElement {
  #controller = null;
  #timer = null;
  #lastFocus = null;

  connectedCallback() {
    this.dialog = this.querySelector('[data-welcome-dialog]');
    if (!this.dialog) return;
    this.#controller?.abort();
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    for (const button of this.querySelectorAll('[data-welcome-close]')) {
      button.addEventListener('click', () => this.#dismiss(), { signal });
    }
    // A click on the dimmed backdrop closes the pop-up.
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.#dismiss();
    }, { signal });
    // Escape: remember the choice right away ("close" fires a moment later).
    this.dialog.addEventListener('cancel', () => this.#remember(), { signal });
    this.dialog.addEventListener('close', () => this.#onClose(), { signal });

    // "Get notified" links elsewhere on the page open the pop-up on demand.
    for (const opener of document.querySelectorAll('[data-welcome-open]')) {
      opener.hidden = false;
      opener.addEventListener('click', () => this.open(true), { signal });
    }

    // After a sign-up (or an error), the page reloads: show the result at once.
    if (this.querySelector('[data-welcome-success]')) {
      welcomeStore.set({ subscribed: true });
      track('theme:welcome_signup');
      this.open(true);
      return;
    }
    if (this.querySelector('[data-welcome-error]')) {
      this.open(true);
      return;
    }

    if (this.hasAttribute('data-design-mode')) {
      document.addEventListener('shopify:section:select', (event) => {
        if (event.detail?.sectionId === this.dataset.sectionId) this.open(true);
      }, { signal });
      document.addEventListener('shopify:section:deselect', (event) => {
        if (event.detail?.sectionId === this.dataset.sectionId) this.dialog.close();
      }, { signal });
      return;
    }

    const state = welcomeStore.get();
    if (state.subscribed) return;

    // A visit ends after 30 minutes without a page view; the next one starts afresh.
    const now = Date.now();
    const sameVisit = state.visitStart && state.lastSeenAt && now - state.lastSeenAt < VISIT_GAP;
    const visitStart = sameVisit ? state.visitStart : now;
    welcomeStore.set({ visitStart, lastSeenAt: now });
    window.addEventListener('pagehide', () => welcomeStore.set({ lastSeenAt: Date.now() }), { signal });

    // Once closed, it comes back at the next visit, or after the chosen number of days.
    if (state.dismissedAt) {
      const snoozeDays = Math.max(0, Number.parseInt(this.dataset.snoozeDays, 10) || 0);
      if (snoozeDays > 0 && now - state.dismissedAt < snoozeDays * 864e5) return;
      if (state.dismissedAt >= visitStart) return;
    }
    if (/\/(cart|account|checkouts?)(\/|$)/.test(window.location.pathname)) return;

    // Count the delay from the visitor's arrival on the site, across pages.
    const delay = Number(this.dataset.delay) || 7000;
    this.#timer = setTimeout(() => this.open(), Math.max(1000, delay - (now - visitStart)));
  }

  disconnectedCallback() {
    clearTimeout(this.#timer);
    this.#controller?.abort();
  }

  /** @param {boolean} [force] - open even if another dialog is showing */
  open(force = false) {
    if (this.dialog.open) return;
    // Never cover the cart or the menu: try again a little later.
    if (!force && document.querySelector('dialog[open]')) {
      this.#timer = setTimeout(() => this.open(), 5000);
      return;
    }
    this.#lastFocus = document.activeElement;
    this.dialog.showModal();
    track('theme:welcome_view');
  }

  #remember() {
    if (!this.querySelector('[data-welcome-success]')) welcomeStore.set({ dismissedAt: Date.now() });
  }

  #dismiss() {
    this.#remember();
    this.dialog.close();
  }

  #onClose() {
    this.#remember();
    if (this.#lastFocus instanceof HTMLElement) this.#lastFocus.focus({ preventScroll: true });
  }
}

customElements.define('welcome-popup', WelcomePopup);

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
