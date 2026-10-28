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

    // Escape closes the dialog natively, without going through close().
    this.dialog.addEventListener('close', () => {
      this.trigger?.setAttribute?.('aria-expanded', 'false');
    });

    const triggerSelector = this.dataset.trigger;
    const triggers = triggerSelector ? [...document.querySelectorAll(triggerSelector)] : [];
    for (const trigger of triggers) {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        this.open(trigger);
      });
    }

    this.#warmFonts(triggers);
  }

  /**
   * Fonts used only inside the drawer are fetched once the page is idle, and
   * only where the drawer can be opened, so it opens with its final typography.
   * @param {HTMLElement[]} triggers
   */
  #warmFonts(triggers) {
    const fonts = (this.dataset.warmFonts || '').split('|').filter(Boolean);
    if (!fonts.length || !document.fonts) return;

    const warm = () => {
      if (!triggers.some((trigger) => trigger.getClientRects().length > 0)) return;
      for (const font of fonts) document.fonts.load(font).catch(() => {});
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(warm, { timeout: 4000 });
    } else {
      setTimeout(warm, 2000);
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
 * Optional add-ons under a filled cart (snippet "cart-upsell"). Each add-on
 * is added only on click; products with several variants need a choice first.
 * The cart is re-rendered from the server's answer, so totals stay exact.
 */
class CartUpsell extends HTMLElement {
  connectedCallback() {
    this.addEventListener('submit', this.#onSubmit.bind(this));
    this.addEventListener('change', (event) => {
      const form = event.target.closest('[data-upsell-form]');
      if (form) this.#showError(form, '');
    });
  }

  /**
   * @param {HTMLFormElement} form
   * @param {string} message
   */
  #showError(form, message) {
    const error = form.querySelector('[data-upsell-error]');
    if (!error) return;
    error.textContent = message;
    error.hidden = !message;
  }

  async #onSubmit(event) {
    const form = event.target.closest('[data-upsell-form]');
    if (!form) return;
    event.preventDefault();

    const id = form.querySelector('[name="id"]')?.value;
    if (!id) {
      this.#showError(form, theme.strings.upsellChoose);
      form.querySelector('select')?.focus();
      return;
    }

    const button = form.querySelector('[type="submit"]');
    button?.setAttribute('aria-busy', 'true');
    button?.toggleAttribute('disabled', true);
    try {
      const result = await cartRequest(`${theme.routes.cartAdd}.js`, {
        items: [{ id: Number(id), quantity: 1 }],
        sections: getCartSectionIds().join(','),
        sections_url: window.location.pathname,
      });
      renderCartSections(result.sections);
      announce(theme.strings.upsellAdded);
    } catch (error) {
      this.#showError(form, error.data?.description || theme.strings.cartError);
    } finally {
      // The add-on usually leaves the list once added; reset it if it is still shown.
      button?.removeAttribute('aria-busy');
      button?.toggleAttribute('disabled', false);
    }
  }
}

customElements.define('cart-upsell', CartUpsell);

/* -------------------------------------------------------------------------- */
/* Contact form                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Checks the contact form before Shopify sends it, with one message per field.
 * Sending stays Shopify's native form post: the success message only appears
 * on the page Shopify returns once the message is accepted.
 */
class ContactForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    if (!this.form) return;
    this.form.addEventListener('submit', this.#onSubmit.bind(this));
    this.form.addEventListener('input', (event) => {
      const field = event.target.closest('[data-validate]');
      if (field?.getAttribute('aria-invalid') === 'true') this.#check(field);
    });
    this.form.addEventListener('focusout', (event) => {
      const field = event.target.closest('[data-validate]');
      if (field?.dataset.touched) this.#check(field);
    });
    // Shopify's answer (sent or refused) is brought to the visitor's attention.
    this.querySelector('[data-contact-success], [data-contact-errors]')?.focus();

    // A question typed in the VELEA assistant arrives already written in the message.
    const question = new URL(window.location.href).searchParams.get('question');
    const body = /** @type {HTMLTextAreaElement | null} */ (this.form.querySelector('[data-validate="message"]'));
    if (question && body && !body.value.trim()) body.value = question.slice(0, 1000);
  }

  /**
   * @param {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} field
   * @returns {string} The error message, empty when the value is fine.
   */
  #message(field) {
    const value = field.value.trim();
    switch (field.dataset.validate) {
      case 'name':
        return value.length >= 2 ? '' : this.dataset.errorName;
      case 'email':
        if (!value) return this.dataset.errorEmailEmpty;
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) ? '' : this.dataset.errorEmail;
      case 'subject':
        return value ? '' : this.dataset.errorSubject;
      case 'message':
        return value.length >= 10 ? '' : this.dataset.errorMessage;
      default:
        return '';
    }
  }

  /** @param {HTMLElement} field */
  #check(field) {
    const message = this.#message(field);
    const error = document.getElementById(field.getAttribute('aria-describedby') || '');
    field.setAttribute('aria-invalid', String(Boolean(message)));
    if (error) {
      error.textContent = message;
      error.hidden = !message;
    }
    return !message;
  }

  /** @param {SubmitEvent} event */
  #onSubmit(event) {
    // A filled hidden field means a robot: nothing is sent.
    if (this.form.querySelector('[data-contact-trap]')?.value) {
      event.preventDefault();
      return;
    }

    let firstInvalid = null;
    for (const field of this.form.querySelectorAll('[data-validate]')) {
      field.dataset.touched = 'true';
      if (!this.#check(field) && !firstInvalid) firstInvalid = field;
    }
    if (firstInvalid) {
      event.preventDefault();
      firstInvalid.focus();
      return;
    }

    if (this.sending) {
      event.preventDefault();
      return;
    }
    this.sending = true;
    const button = this.form.querySelector('[data-contact-submit]');
    button?.setAttribute('aria-busy', 'true');
    this.form.querySelector('[data-contact-label]')?.toggleAttribute('hidden', true);
    this.form.querySelector('[data-contact-sending]')?.toggleAttribute('hidden', false);
  }
}

customElements.define('contact-form', ContactForm);

/* -------------------------------------------------------------------------- */
/* VELEA assistant: guided, chat-like panel                                   */
/* -------------------------------------------------------------------------- */

/**
 * Pink button bottom right that opens a chat-like panel. The visitor writes
 * anything, in her own words: assets/assistant-brain.js (loaded the first time
 * the button is reached for) reads the message and builds the answer from the
 * shop's data, which this panel renders after a short "typing" pause: text,
 * product cards, an "add to cart" button, links and actions (welcome offer,
 * cookie settings, cart, contact form with the question written in), then
 * suggested replies. The merchant's topics stay as the first buttons, with
 * their own answers. The conversation is kept for the visit, in this
 * browser's session storage only.
 *
 * Without the brain file (network error), typed questions fall back to the
 * topics' keywords, then to Shopify Inbox (when on) or the contact form.
 */
class VeleaAssistant extends HTMLElement {
  static nudgeKey = 'velea:assistant-nudge';
  static chatKey = 'velea:assistant-chat';

  /**
   * Lower case, no accents, words separated by single spaces, a trailing
   * plural "s" or "x" dropped: "Délais de livraisons ?" → " delai de livraison ".
   * @param {string} text
   */
  static normalize(text) {
    const words = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .map((word) => (word.length > 3 ? word.replace(/[sx]$/, '') : word));
    return ` ${words.join(' ')} `;
  }

  /** @param {string} [list] Comma-separated keywords */
  static keywords(list = '') {
    return list
      .split(',')
      .map((keyword) => VeleaAssistant.normalize(keyword))
      .filter((keyword) => keyword.trim());
  }

  /**
   * Each keyword found counts as many points as it has words, so
   * "numero de suivi" outweighs "suivi".
   * @param {string} text Normalized text
   * @param {string[]} keywords Normalized keywords
   */
  static score(text, keywords) {
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) score += keyword.trim().split(' ').length;
    }
    return score;
  }

  /** @param {number} ms */
  static wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  connectedCallback() {
    this.panel = this.querySelector('[data-assistant-panel]');
    this.launcher = this.querySelector('[data-assistant-toggle]');
    this.log = this.querySelector('[data-assistant-log]');
    this.choices = this.querySelector('[data-assistant-choices]');
    this.nudge = this.querySelector('[data-assistant-nudge]');
    this.form = this.querySelector('[data-assistant-form]');
    this.input = this.querySelector('[data-assistant-input]');
    this.send = this.querySelector('[data-assistant-send]');
    if (!this.panel || !this.launcher) return;

    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.started = false;
    this.busy = false;
    /** @type {any[]} What was said, kept for the next pages of the visit */
    this.history = [];
    /** @type {any} The brain's memory of the conversation */
    this.state = undefined;
    this.chips = null;
    this.topicChips = [...this.choices.children].map((chip) => chip.cloneNode(true));
    /** Topics already answered, shown as read */
    this.seenTopics = new Set();
    this.topics = [...this.querySelectorAll('[data-assistant-topic]')].map((chip) => ({
      id: chip.dataset.assistantTopic,
      keywords: VeleaAssistant.keywords(chip.dataset.keywords),
    }));
    this.health = VeleaAssistant.keywords(this.dataset.healthKeywords);
    this.hello = VeleaAssistant.keywords(this.dataset.helloKeywords);
    this.thanks = VeleaAssistant.keywords(this.dataset.thanksKeywords);
    this.knowledge = this.#readJSON('[data-assistant-kb]') || {};
    this.strings = this.#readJSON('[data-assistant-strings]') || {};
    this.saved = this.#readSaved();
    if (this.dataset.replaceInbox === 'true') document.documentElement.classList.add('has-assistant');

    this.launcher.addEventListener('click', () => (this.panel.hidden ? this.open() : this.close()));
    // The brain loads as soon as the visitor reaches for the button.
    for (const type of ['pointerenter', 'focus', 'touchstart']) {
      this.launcher.addEventListener(type, () => this.#loadBrain(), { once: true, passive: true });
    }
    this.addEventListener('click', this.#onClick.bind(this));
    this.panel.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close();
    });

    this.form?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.#ask(this.input.value);
    });
    this.input?.addEventListener('input', () => this.#updateInput());
    this.input?.addEventListener('keydown', (event) => {
      // Enter sends, Shift + Enter goes to a new line.
      if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
      event.preventDefault();
      this.form.requestSubmit();
    });

    // Theme editor: show the panel while its section or a topic is selected.
    document.addEventListener('shopify:section:select', (event) => {
      if (event.detail?.sectionId === this.dataset.sectionId) this.open();
    });
    document.addEventListener('shopify:section:deselect', (event) => {
      if (event.detail?.sectionId === this.dataset.sectionId) this.close();
    });

    // Phones: the button waits for the first scroll, so it never covers the banner's buttons.
    if (window.matchMedia('(max-width: 749px)').matches && window.scrollY < 160) {
      this.classList.add('is-tucked');
      this.onScroll = () => {
        if (window.scrollY < 160) return;
        this.classList.remove('is-tucked');
        window.removeEventListener('scroll', this.onScroll);
      };
      window.addEventListener('scroll', this.onScroll, { passive: true });
    }

    this.#scheduleNudge();
  }

  disconnectedCallback() {
    clearTimeout(this.nudgeTimer);
    clearTimeout(this.nudgeHideTimer);
    if (this.onScroll) window.removeEventListener('scroll', this.onScroll);
  }

  open() {
    this.#hideNudge();
    this.panel.hidden = false;
    this.launcher.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => this.classList.add('is-open'));
    this.querySelector('[data-assistant-title]')?.focus();
    this.#loadBrain();
    if (this.started) return;
    if (this.saved) this.#restore();
    else this.#start();
  }

  close() {
    if (this.panel.hidden) return;
    this.classList.remove('is-open');
    this.launcher.setAttribute('aria-expanded', 'false');
    const hide = () => {
      if (!this.classList.contains('is-open')) this.panel.hidden = true;
    };
    if (this.reduceMotion) hide();
    else setTimeout(hide, 320);
    this.launcher.focus();
  }

  /** @param {MouseEvent} event */
  #onClick(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    if (target.closest('[data-assistant-close]')) return this.close();
    if (target.closest('[data-assistant-open]')) return this.open();
    if (target.closest('[data-assistant-nudge-close]')) return this.#hideNudge();
    if (target.closest('[data-assistant-restart]')) return this.#start();
    if (target.closest('[data-assistant-ai]')) return this.#openChat();
    const say = target.closest('[data-assistant-say]');
    if (say) return this.#ask(say.dataset.assistantSay || '');
    const buy = target.closest('[data-assistant-buy]');
    if (buy) return this.#addToCart(/** @type {HTMLButtonElement} */ (buy));
    const action = target.closest('[data-assistant-action]');
    if (action) return this.#act(action.dataset.assistantAction);
    const topic = target.closest('[data-assistant-topic]');
    if (topic) this.#choose(/** @type {HTMLButtonElement} */ (topic));
  }

  /* ---------------------------------------------------------------- brain */

  /**
   * Loads assets/assistant-brain.js once and builds it with the shop's data.
   * @returns {Promise<any>} The brain, or null when it cannot load
   */
  #loadBrain() {
    if (this.brainPromise) return this.brainPromise;
    this.brainPromise = new Promise((resolve) => {
      const build = () => {
        try {
          resolve(window.VeleaBrain.create(this.knowledge));
        } catch (error) {
          resolve(null);
        }
      };
      if (window.VeleaBrain) return build();
      if (!this.dataset.brainSrc) return resolve(null);
      const script = document.createElement('script');
      script.src = this.dataset.brainSrc;
      script.async = true;
      script.addEventListener('load', build);
      script.addEventListener('error', () => resolve(null));
      document.head.append(script);
    }).then((brain) => {
      this.brain = brain;
      return brain;
    });
    return this.brainPromise;
  }

  /** @param {number} ms Longest wait */
  #waitBrain(ms) {
    return Promise.race([this.#loadBrain(), VeleaAssistant.wait(ms).then(() => null)]);
  }

  /** The welcome offer of the pop-up on this page, if any. */
  #offer() {
    const popup = /** @type {HTMLElement | null} */ (document.querySelector('welcome-popup[data-offer-percent]'));
    if (!popup) return null;
    const { offerPercent, offerLabel, offerPrice, offerNewPrice, offerConditions, offerProduct } = popup.dataset;
    return { percent: offerPercent, label: offerLabel, price: offerPrice, newPrice: offerNewPrice, conditions: offerConditions, product: offerProduct };
  }

  /* --------------------------------------------------------- conversation */

  async #start() {
    this.started = true;
    this.run = (this.run || 0) + 1;
    const run = this.run;
    this.busy = true;
    this.#updateInput();
    this.log.replaceChildren();
    this.history = [];
    this.state = undefined;
    this.saved = null;
    this.seenTopics.clear();
    this.#forget();
    this.choices.hidden = true;
    const typing = this.#showTyping();
    const [brain] = await Promise.all([this.#waitBrain(1500), VeleaAssistant.wait(this.reduceMotion ? 0 : 650)]);
    typing.remove();
    if (run !== this.run) return;
    // Product page: a greeting about the product. Elsewhere: the merchant's own.
    const greeting = brain?.greet();
    if (greeting) {
      this.state = greeting.state;
      this.#appendBot(greeting.parts);
      this.#setChips(greeting.chips);
    } else {
      this.#appendTemplate('greeting');
      this.#setChips(null);
    }
    this.busy = false;
    this.#updateInput();
    this.#save();
  }

  /** The conversation of an earlier page of this visit, shown as it was. */
  #restore() {
    const saved = this.saved;
    this.saved = null;
    this.started = true;
    this.run = (this.run || 0) + 1;
    this.log.replaceChildren();
    this.history = [];
    this.state = saved.state;
    for (const entry of saved.history) {
      if (entry.who === 'user') this.#userSay(entry.text, true);
      else if (entry.parts) this.#appendBot(entry.parts, true);
      else if (entry.template) this.#appendTemplate(entry.template, entry.question, true);
    }
    this.#setChips(saved.chips);
    this.#scroll(false);
  }

  /** @param {HTMLButtonElement} chip */
  async #choose(chip) {
    if (this.busy) return;
    this.busy = true;
    this.#updateInput();
    const run = this.run;
    this.choices.hidden = true;
    this.#userSay(chip.textContent.trim());
    await this.#botSay(chip.dataset.assistantTopic, 900);
    if (run !== this.run) return;
    this.seenTopics.add(chip.dataset.assistantTopic);
    track('velea_assistant_question', { answer: chip.dataset.assistantTopic, source: 'topic' });
    await this.#finish(run);
  }

  /**
   * A typed question (or a suggested reply): the brain's answer.
   * @param {string} raw
   */
  async #ask(raw) {
    const question = raw.trim();
    if (!question || this.busy) return;
    this.busy = true;
    const run = this.run;
    this.choices.hidden = true;
    this.input.value = '';
    this.#updateInput();
    this.#userSay(question);

    const typing = this.#showTyping();
    const brain = await this.#waitBrain(4000);
    if (run !== this.run) return typing.remove();
    if (!brain) {
      typing.remove();
      return this.#askTopics(question, run);
    }

    const reply = brain.reply(question, this.state, { offer: this.#offer(), chat: this.dataset.chat === 'true' });
    this.state = reply.state;
    track('velea_assistant_question', { answer: reply.subjects.join(',') || (reply.confident ? 'conversation' : 'none'), source: 'typed' });

    // Not sure: one of the merchant's topics, or Shopify Inbox's AI agent when it is on.
    if (!reply.confident) {
      const topic = this.#matchTopic(question);
      if (topic) {
        typing.remove();
        await this.#botSay(topic, 500);
        if (run !== this.run) return;
        this.seenTopics.add(topic);
        return this.#finish(run);
      }
      if (this.dataset.chat === 'true' && (await this.#findInbox(5))) {
        typing.remove();
        await this.#botSay('handover', 300);
        if (run !== this.run) return;
        this.busy = false;
        this.#updateInput();
        this.#save();
        setTimeout(() => this.#openChat(question), this.reduceMotion ? 0 : 900);
        return;
      }
    }

    await VeleaAssistant.wait(this.#delayFor(reply.parts));
    typing.remove();
    if (run !== this.run) return;
    const message = this.#appendBot(reply.parts);
    this.#setChips(reply.chips, message);
    this.busy = false;
    this.#updateInput();
    this.#save();
  }

  /**
   * Without the brain: the best matching topic, or the hand-over.
   * @param {string} question
   * @param {number} run
   */
  async #askTopics(question, run) {
    const answer = this.#match(question);
    track('velea_assistant_question', { answer: answer || 'none', source: 'typed' });
    if (answer) {
      await this.#botSay(answer, 900);
      if (run !== this.run) return;
      this.seenTopics.add(answer);
      await this.#finish(run);
      return;
    }
    if (this.dataset.chat === 'true' && (await this.#findInbox(5))) {
      await this.#botSay('handover', 700);
      if (run !== this.run) return;
      this.busy = false;
      this.#updateInput();
      setTimeout(() => this.#openChat(question), this.reduceMotion ? 0 : 900);
      return;
    }
    await this.#botSay('unknown', 900, question);
    if (run !== this.run) return;
    this.#setChips(null);
    this.busy = false;
    this.#updateInput();
    this.#save();
  }

  /** @param {number} run */
  async #finish(run) {
    await this.#botSay('next', 450);
    if (run !== this.run) return;
    this.#setChips(null);
    this.busy = false;
    this.#updateInput();
    this.#save();
  }

  /**
   * The id of the answer for a typed question without the brain: health
   * first, then the topic with the most keywords found, then hello / thanks.
   * @param {string} question
   * @returns {string | null}
   */
  #match(question) {
    const text = VeleaAssistant.normalize(question);
    if (VeleaAssistant.score(text, this.health) > 0) return 'health';
    const topic = this.#matchTopic(question);
    if (topic) return topic;
    const short = text.trim().split(' ').length <= 5;
    if (short && VeleaAssistant.score(text, this.thanks) > 0) return 'thanks';
    if (short && VeleaAssistant.score(text, this.hello) > 0) return 'hello';
    return null;
  }

  /**
   * The merchant's topic whose keywords best match a question.
   * @param {string} question
   */
  #matchTopic(question) {
    const text = VeleaAssistant.normalize(question);
    let best = null;
    let bestScore = 0;
    for (const topic of this.topics) {
      const score = VeleaAssistant.score(text, topic.keywords);
      if (score > bestScore) {
        best = topic.id;
        bestScore = score;
      }
    }
    return best;
  }

  /** A typing pause that follows the length of the answer. */
  #delayFor(parts) {
    if (this.reduceMotion) return 0;
    const length = parts.reduce((total, part) => total + (part.text?.length || 0) + (part.items?.join(' ').length || 0), 0);
    return Math.min(1300, 450 + length * 2.5);
  }

  /* -------------------------------------------------------------- actions */

  /** @param {string | undefined} action */
  #act(action) {
    if (action === 'offer') {
      const popup = /** @type {any} */ (document.querySelector('welcome-popup'));
      if (!popup?.open) return;
      this.close();
      popup.open(true);
      track('velea_assistant_action', { action });
      return;
    }
    if (action === 'cookies') {
      this.close();
      /** @type {HTMLElement | null} */ (document.querySelector('[data-cookie-preferences]'))?.click();
      return;
    }
    if (action === 'cart') {
      const drawer = /** @type {any} */ (document.querySelector('cart-drawer'));
      if (theme.cartType === 'drawer' && drawer?.open) {
        this.close();
        drawer.open();
      } else {
        window.location.href = theme.routes.cart || '/cart';
      }
      return;
    }
    if (action === 'chat') this.#openChat(this.state?.lastQuestion || '');
  }

  /** @param {HTMLButtonElement} button */
  async #addToCart(button) {
    if (button.disabled || button.dataset.added) return;
    const label = button.querySelector('[data-assistant-buy-label]');
    const idle = label?.textContent || '';
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    if (label) label.textContent = this.strings.adding || idle;
    try {
      const result = await cartRequest(`${theme.routes.cartAdd}.js`, {
        items: [{ id: Number(button.dataset.assistantBuy), quantity: 1 }],
        sections: getCartSectionIds().join(','),
        sections_url: window.location.pathname,
      });
      renderCartSections(result.sections);
      button.dataset.added = 'true';
      button.classList.add('is-added');
      if (label) label.textContent = this.strings.added || idle;
      button.querySelector('.icon')?.replaceWith(this.#icon('check'));
      track('velea_assistant_add_to_cart', { variant: button.dataset.assistantBuy });
      announce(this.strings.addedText);
      await this.#botParts([
        { type: 'text', text: this.strings.addedText },
        { type: 'action', action: 'cart', label: this.strings.openCart },
      ], 450);
    } catch (error) {
      button.disabled = false;
      if (label) label.textContent = idle;
      await this.#botParts([{ type: 'text', text: error?.data?.description || this.strings.addError }], 300);
    } finally {
      button.removeAttribute('aria-busy');
    }
  }

  /* ------------------------------------------------------------ rendering */

  /** Typing dots, removed when the answer is ready. */
  #showTyping() {
    const typing = document.createElement('div');
    typing.className = 'assistant__typing';
    typing.setAttribute('aria-hidden', 'true');
    typing.innerHTML = '<span></span><span></span><span></span>';
    this.log.append(typing);
    this.#scroll();
    return typing;
  }

  /**
   * @param {any[]} parts
   * @param {number} delay
   */
  async #botParts(parts, delay) {
    const typing = this.#showTyping();
    await VeleaAssistant.wait(this.reduceMotion ? 0 : delay);
    typing.remove();
    this.#appendBot(parts);
    this.#save();
  }

  /**
   * A merchant template (greeting, topic answers…) after a typing pause.
   * @param {string} templateId
   * @param {number} delay
   * @param {string} [question] Written into the contact link
   * @returns {Promise<HTMLElement | null>}
   */
  async #botSay(templateId, delay, question = '') {
    if (!this.querySelector(`template[data-assistant-template="${templateId}"]`)) return null;
    const typing = this.#showTyping();
    await VeleaAssistant.wait(this.reduceMotion ? 0 : delay);
    typing.remove();
    return this.#appendTemplate(templateId, question);
  }

  /**
   * @param {string} templateId
   * @param {string} [question]
   * @param {boolean} [restored] Shown again on a new page: no animation, not recorded twice
   */
  #appendTemplate(templateId, question = '', restored = false) {
    const template = /** @type {HTMLTemplateElement | null} */ (this.querySelector(`template[data-assistant-template="${templateId}"]`));
    if (!template) return null;
    const message = document.createElement('div');
    message.className = `assistant__msg assistant__msg--bot${restored ? ' assistant__msg--restored' : ''}`;
    message.append(template.content.cloneNode(true));
    this.#prepareMail(message, question);
    this.log.append(message);
    this.history.push({ who: 'bot', template: templateId, question });
    if (!restored) this.#scroll(true, message);
    return message;
  }

  /**
   * @param {any[]} parts The brain's answer
   * @param {boolean} [restored]
   */
  #appendBot(parts, restored = false) {
    const message = document.createElement('div');
    message.className = `assistant__msg assistant__msg--bot${restored ? ' assistant__msg--restored' : ''}`;
    for (const part of parts) {
      const node = this.#renderPart(part);
      if (node) message.append(node);
    }
    this.log.append(message);
    this.history.push({ who: 'bot', parts });
    if (!restored) this.#scroll(true, message);
    return message;
  }

  /** @param {any} part */
  #renderPart(part) {
    const element = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    };
    switch (part.type) {
      case 'text':
        return element('p', '', part.text);
      case 'note':
        return element('p', 'assistant__note', part.text);
      case 'list': {
        const list = element('ul', 'assistant__list');
        list.setAttribute('role', 'list');
        for (const item of part.items) list.append(element('li', '', item));
        return list;
      }
      case 'products': {
        const products = part.handles.map((handle) => this.#product(handle)).filter(Boolean);
        if (!products.length) return null;
        const wrap = element('div', `assistant__products${products.length > 1 ? ' assistant__products--row' : ''}`);
        for (const product of products) wrap.append(this.#productCard(product));
        return wrap;
      }
      case 'link': {
        const link = element('a', 'assistant__link', part.label);
        link.href = part.url;
        link.append(this.#icon('arrow-right'));
        return link;
      }
      case 'action': {
        if (part.action === 'contact') {
          const link = element('a', 'assistant__link', part.label);
          const url = new URL(this.dataset.contactUrl || '/', window.location.origin);
          if (part.question) url.searchParams.set('question', String(part.question).slice(0, 400));
          link.href = url.toString();
          link.append(this.#icon('arrow-right'));
          return link;
        }
        if (part.action === 'offer' && !document.querySelector('welcome-popup')) return null;
        const button = element('button', `assistant__action${part.action === 'offer' ? ' assistant__action--offer' : ''}`, part.label);
        button.type = 'button';
        button.dataset.assistantAction = part.action;
        return button;
      }
      case 'buy': {
        const product = this.#product(part.handle);
        const card = element('div', 'assistant__buy');
        if (product) card.append(this.#productCard(product, part.label, part.price));
        const button = element('button', 'assistant__add');
        button.type = 'button';
        button.dataset.assistantBuy = String(part.variant);
        button.append(this.#icon('bag'), element('span', '', this.strings.addToCart || 'Ajouter au panier'));
        button.lastElementChild?.setAttribute('data-assistant-buy-label', '');
        card.append(button);
        return card;
      }
      default:
        return null;
    }
  }

  /** @param {string} handle */
  #product(handle) {
    return (this.knowledge.products || []).find((product) => product.handle === handle) || null;
  }

  /**
   * @param {any} product
   * @param {string} [detail] The chosen options
   * @param {string} [price] The chosen variant's price
   */
  #productCard(product, detail = '', price = '') {
    const card = document.createElement('a');
    card.className = 'assistant__product';
    card.href = product.url;
    const media = document.createElement('span');
    media.className = 'assistant__product-media media';
    if (product.image) {
      const image = document.createElement('img');
      image.src = product.image;
      image.alt = '';
      image.width = 120;
      image.height = 120;
      image.loading = 'lazy';
      media.append(image);
    } else {
      media.innerHTML = '<span class="product-card__soon-art" aria-hidden="true"><span class="product-card__soon-drop"></span></span>';
    }
    const info = document.createElement('span');
    info.className = 'assistant__product-info';
    const title = document.createElement('span');
    title.className = 'assistant__product-title';
    title.textContent = product.title;
    info.append(title);
    if (detail) {
      const options = document.createElement('span');
      options.className = 'assistant__product-detail';
      options.textContent = detail;
      info.append(options);
    }
    const cost = document.createElement('span');
    cost.className = 'assistant__product-price';
    cost.textContent = price || (product.varies ? `${this.strings.from || ''} ${product.price}`.trim() : product.price);
    info.append(cost);
    card.append(media, info);
    return card;
  }

  /** @param {string} name */
  #icon(name) {
    const template = /** @type {HTMLTemplateElement | null} */ (this.querySelector(`template[data-assistant-icon="${name}"]`));
    return template ? template.content.firstElementChild.cloneNode(true) : document.createTextNode('');
  }

  /**
   * Suggested replies under the conversation: the brain's, or the merchant's topics.
   * @param {string[] | null} chips
   * @param {HTMLElement} [message] The answer they follow, kept in view
   */
  #setChips(chips, message) {
    this.chips = chips;
    this.choices.replaceChildren();
    if (chips?.length) {
      for (const label of chips) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'assistant__chip';
        chip.dataset.assistantSay = label;
        chip.textContent = label;
        this.choices.append(chip);
      }
    } else {
      for (const chip of this.topicChips) {
        const copy = /** @type {HTMLElement} */ (chip.cloneNode(true));
        if (this.seenTopics.has(copy.dataset.assistantTopic)) copy.setAttribute('data-seen', '');
        this.choices.append(copy);
      }
    }
    this.#showChoices(message);
  }

  /**
   * The contact link of an answer opens the form with the question written in.
   * @param {HTMLElement | null} message
   * @param {string} question
   */
  #prepareMail(message, question) {
    const link = /** @type {HTMLAnchorElement | null} */ (message?.querySelector('[data-assistant-mail]'));
    if (!link || !question) return;
    const url = new URL(link.getAttribute('href') || '/', window.location.origin);
    url.searchParams.set('question', question.slice(0, 400));
    link.href = url.toString();
  }

  #updateInput() {
    if (!this.input) return;
    this.input.style.height = 'auto';
    this.input.style.height = `${this.input.scrollHeight}px`;
    if (this.send) this.send.disabled = this.busy || !this.input.value.trim();
  }

  /**
   * Hands over to the Shopify Inbox chat: its bubble is revealed, then its
   * own button is pressed, and the question is written in its field when
   * Inbox lets the page reach it. Inbox is a separate app: if its button
   * cannot be reached, the revealed bubble stays in the same corner, and
   * without Inbox the visitor is pointed to the contact form.
   * @param {string} [question]
   */
  async #openChat(question = '') {
    if (this.busy) return;
    const host = await this.#findInbox();
    if (!host) {
      await this.#botSay('ai-missing', 400, question);
      this.#save();
      return;
    }
    document.documentElement.classList.add('is-inbox-open');
    this.close();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const toggle = host.shadowRoot?.querySelector('button.chat-toggle, [class*="chat-toggle"]');
    if (toggle) toggle.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    if (question) this.#fillInbox(host, question);
  }

  /**
   * @param {Element} host
   * @param {string} question
   */
  async #fillInbox(host, question) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await VeleaAssistant.wait(150);
      const field = host.shadowRoot?.querySelector('textarea');
      if (!field) continue;
      const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      setValue?.call(field, question);
      field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      field.focus();
      return;
    }
  }

  /** @param {number} [attempts] */
  async #findInbox(attempts = 15) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const host = document.querySelector('inbox-online-store-chat, #ShopifyChat, #shopify-chat');
      if (host) return host;
      await VeleaAssistant.wait(200);
    }
    return null;
  }

  /**
   * @param {string} text
   * @param {boolean} [restored]
   */
  #userSay(text, restored = false) {
    const message = document.createElement('p');
    message.className = `assistant__msg assistant__msg--user${restored ? ' assistant__msg--restored' : ''}`;
    message.textContent = text;
    this.log.append(message);
    this.history.push({ who: 'user', text });
    if (!restored) this.#scroll();
  }

  /** @param {HTMLElement} [message] The answer to keep in view */
  #showChoices(message) {
    if (!this.choices.children.length) return;
    this.choices.hidden = false;
    this.choices.scrollLeft = 0;
    // The buttons take room from the conversation: follow it once the layout has moved.
    requestAnimationFrame(() => this.#scroll(true, message));
  }

  /**
   * Follows the conversation. A long answer is shown from its start, so the
   * visitor reads it from the top instead of from its last line.
   * @param {boolean} [smooth]
   * @param {HTMLElement} [message]
   */
  #scroll(smooth = true, message) {
    const behavior = smooth && !this.reduceMotion ? 'smooth' : 'auto';
    if (message && message.offsetHeight > this.log.clientHeight * 0.7) {
      this.log.scrollTo({ top: message.offsetTop - 12, behavior });
      return;
    }
    this.log.scrollTo({ top: this.log.scrollHeight, behavior });
  }

  /* ---------------------------------------------------------- the visit */

  /** Keeps the conversation for the next pages of the visit (this tab only). */
  #save() {
    try {
      sessionStorage.setItem(VeleaAssistant.chatKey, JSON.stringify({ v: 1, history: this.history.slice(-40), state: this.state, chips: this.chips }));
    } catch (error) {
      /* Private browsing: the conversation starts afresh on the next page. */
    }
  }

  #readSaved() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(VeleaAssistant.chatKey) || 'null');
      return saved?.v === 1 && Array.isArray(saved.history) && saved.history.length ? saved : null;
    } catch (error) {
      return null;
    }
  }

  #forget() {
    try {
      sessionStorage.removeItem(VeleaAssistant.chatKey);
    } catch (error) {
      /* Nothing stored. */
    }
  }

  /** @param {string} selector */
  #readJSON(selector) {
    try {
      return JSON.parse(this.querySelector(selector)?.textContent || 'null');
    } catch (error) {
      return null;
    }
  }

  #scheduleNudge() {
    if (this.dataset.nudge !== 'true' || !this.nudge) return;
    try {
      if (sessionStorage.getItem(VeleaAssistant.nudgeKey)) return;
    } catch (error) {
      return;
    }
    this.nudgeTimer = setTimeout(() => {
      if (!this.panel.hidden || this.classList.contains('is-tucked') || document.documentElement.classList.contains('is-inbox-open')) return;
      this.nudge.hidden = false;
      try {
        sessionStorage.setItem(VeleaAssistant.nudgeKey, '1');
      } catch (error) {
        /* Private browsing: the note may show again on the next page. */
      }
      this.nudgeHideTimer = setTimeout(() => this.#hideNudge(), 10000);
    }, 6000);
  }

  #hideNudge() {
    clearTimeout(this.nudgeTimer);
    if (this.nudge) this.nudge.hidden = true;
  }
}

customElements.define('velea-assistant', VeleaAssistant);

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
/* Reviews loop: the cards glide past on their own, endlessly                 */
/* -------------------------------------------------------------------------- */

class ReviewsLoop extends HTMLElement {
  #controller = null;
  #observer = null;
  #resizeObserver = null;
  #frame = 0;
  #last = 0;
  #offset = 0;
  #pace = 0;
  #setWidth = 0;
  #width = 0;
  #visible = false;
  #focused = false;
  #photos = [];
  #allCards = [];
  #centers = [];
  #focusValues = [];

  connectedCallback() {
    this.viewport = this.querySelector('[data-loop-viewport]');
    this.track = this.querySelector('[data-loop-track]');
    if (!this.viewport || !this.track) return;
    this.dialog = this.querySelector('[data-loop-dialog]');
    this.cards = [...this.track.querySelectorAll('[data-loop-card]:not([data-loop-clone])')];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.seconds = reduceMotion || this.cards.length < 2 ? 0 : Number(this.dataset.speed || 0);
    // A fresh start each time the band is (re)attached, e.g. by the theme editor.
    this.#offset = 0;
    this.#pace = 0;
    this.#width = 0;
    this.#visible = false;
    this.#focused = false;

    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.addEventListener('click', (event) => this.#onClick(event), { signal });
    this.dialog?.addEventListener('click', (event) => {
      const thumb = event.target.closest('[data-reader-photo]');
      if (thumb) this.#showPhoto(Number(thumb.dataset.readerPhoto));
      else if (event.target === this.dialog || event.target.closest('[data-loop-dialog-close]')) this.dialog.close();
    }, { signal });

    if (this.seconds > 0) {
      this.classList.add('is-moving');
      // It never stops under the mouse; it only waits for someone reading it with the keyboard.
      this.addEventListener('focusin', (event) => {
        this.#focused = event.target.matches(':focus-visible') && this.viewport.contains(event.target);
        this.#run();
      }, { signal });
      this.addEventListener('focusout', (event) => {
        if (this.viewport.contains(event.relatedTarget)) return;
        this.#focused = false;
        this.#run();
      }, { signal });
      // Keyboard focus may scroll the viewport to show a card: fold that into the glide instead.
      this.viewport.addEventListener('scroll', () => {
        const shift = this.viewport.scrollLeft;
        if (!shift) return;
        this.viewport.scrollLeft = 0;
        this.#moveBy(shift);
      }, { signal, passive: true });
      document.addEventListener('visibilitychange', () => this.#run(), { signal });
    }

    if ('ResizeObserver' in window) {
      this.#resizeObserver = new ResizeObserver(() => this.#layout());
      this.#resizeObserver.observe(this.viewport);
    }
    this.#layout();

    if ('IntersectionObserver' in window) {
      this.#observer = new IntersectionObserver(([entry]) => {
        this.#visible = entry.isIntersecting;
        if (entry.isIntersecting) this.classList.add('is-in');
        this.#run();
      }, { threshold: 0 });
      this.#observer.observe(this);
    } else {
      this.classList.add('is-in');
      this.#visible = true;
      this.#run();
    }
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#observer?.disconnect();
    this.#resizeObserver?.disconnect();
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  /** Repeats the cards so the loop never shows a gap, when the width changes. */
  #layout() {
    const width = this.viewport.clientWidth;
    if (this.seconds > 0 && width && width !== this.#width) {
      this.#width = width;
      for (const clone of this.track.querySelectorAll('[data-loop-clone]')) clone.remove();
      const first = this.cards[0];
      const last = this.cards[this.cards.length - 1];
      const gap = parseFloat(getComputedStyle(this.track).columnGap) || 0;
      this.#setWidth = last.offsetLeft + last.offsetWidth + gap - first.offsetLeft;
      const copies = Math.max(1, Math.ceil(width / this.#setWidth));
      for (let copy = 0; copy < copies; copy += 1) {
        for (const card of this.cards) {
          const clone = card.cloneNode(true);
          clone.setAttribute('data-loop-clone', '');
          clone.setAttribute('aria-hidden', 'true');
          for (const control of clone.querySelectorAll('a, button')) control.setAttribute('tabindex', '-1');
          this.track.append(clone);
        }
      }
      this.#allCards = [...this.track.querySelectorAll('[data-loop-card]')];
      this.#centers = this.#allCards.map((card) => card.offsetLeft + card.offsetWidth / 2);
      this.#focusValues = [];
      this.#moveBy(0);
    }
    this.#measureTexts();
  }

  /** @param {number} distance Pixels to move the cards to the left. */
  #moveBy(distance) {
    if (!this.#setWidth) return;
    this.#offset = (((this.#offset + distance) % this.#setWidth) + this.#setWidth) % this.#setWidth;
    this.track.style.transform = `translate3d(${(-this.#offset).toFixed(2)}px, 0, 0)`;
    this.#focus();
  }

  /** The review passing the middle comes forward; those on the sides step back a little. */
  #focus() {
    const half = this.#width / 2;
    if (!half || !this.#allCards.length) return;
    const reach = half + (this.#allCards[0].offsetWidth || half) * 0.6;
    for (let index = 0; index < this.#allCards.length; index += 1) {
      const distance = Math.min(1, Math.abs(this.#centers[index] - this.#offset - half) / reach);
      const value = (1 - distance * distance).toFixed(2);
      if (this.#focusValues[index] === value) continue;
      this.#focusValues[index] = value;
      this.#allCards[index].style.setProperty('--focus', value);
    }
  }

  get #shouldMove() {
    return this.seconds > 0 && this.#visible && !document.hidden && !this.#focused;
  }

  /** Starts the glide, or lets it ease to a stop when it is out of sight. */
  #run() {
    if (this.seconds <= 0 || this.#frame) return;
    if (!this.#shouldMove && this.#pace === 0) return;
    this.#last = performance.now();
    this.#frame = requestAnimationFrame((time) => this.#tick(time));
  }

  /** @param {number} time */
  #tick(time) {
    const elapsed = Math.min(0.1, (time - this.#last) / 1000);
    this.#last = time;
    const target = this.#shouldMove ? 1 : 0;
    // Eases in and out of the movement instead of starting or stopping dead.
    this.#pace += (target - this.#pace) * (1 - Math.exp(-elapsed / 0.5));
    if (target === 0 && this.#pace < 0.01) this.#pace = 0;
    // One card goes by in `seconds`.
    const speed = this.#setWidth / (this.cards.length * this.seconds);
    this.#moveBy(speed * this.#pace * elapsed);
    if (target === 0 && this.#pace === 0) {
      this.#frame = 0;
      return;
    }
    this.#frame = requestAnimationFrame((next) => this.#tick(next));
  }

  /** @param {MouseEvent} event */
  #onClick(event) {
    if (this.dialog?.contains(event.target)) return;
    const card = event.target.closest('[data-loop-card]');
    if (!card) return;
    const photo = event.target.closest('[data-review-photo]');
    if (photo) this.#openReader(card, Number(photo.dataset.reviewPhoto) || 0);
    else if (event.target.closest('[data-review-more]')) this.#openReader(card, 0);
  }

  /** "Lire la suite" only on the cards whose text is cut. */
  #measureTexts() {
    for (const card of this.track.querySelectorAll('[data-loop-card]')) {
      const text = card.querySelector('[data-review-text]');
      const more = card.querySelector('[data-review-more]');
      if (text && more) more.hidden = text.scrollHeight <= text.clientHeight + 1;
    }
  }

  /**
   * The whole review in a window, with its photos; the band goes on behind it.
   * @param {Element} card
   * @param {number} photoIndex
   */
  #openReader(card, photoIndex) {
    if (!this.dialog || typeof this.dialog.showModal !== 'function') return;
    const body = this.dialog.querySelector('[data-reader-body]');
    const media = this.dialog.querySelector('[data-reader-media]');
    const thumbs = this.dialog.querySelector('[data-reader-thumbs]');
    const parts = card.querySelectorAll('.review-card__head, .review-card__title, .review-card__quote, .review-card__author');
    body.replaceChildren(...[...parts].map((part) => part.cloneNode(true)));

    this.#photos = [...card.querySelectorAll('[data-photo-src]')].map((item) => ({
      src: item.dataset.photoSrc,
      thumb: item.dataset.photoThumb,
      alt: item.dataset.photoAlt || '',
    }));
    const hasPhotos = this.#photos.length > 0;
    media.hidden = !hasPhotos;
    this.dialog.classList.toggle('has-media', hasPhotos);
    thumbs.hidden = this.#photos.length < 2;
    thumbs.replaceChildren(...this.#photos.map((photo, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'reviews-reader__thumb';
      button.dataset.readerPhoto = String(index);
      button.setAttribute('aria-label', `${this.dataset.photoLabel || ''} ${index + 1}`.trim());
      const image = document.createElement('img');
      image.src = photo.thumb;
      image.alt = '';
      image.width = 52;
      image.height = 52;
      button.append(image);
      return button;
    }));
    if (hasPhotos) this.#showPhoto(Math.min(photoIndex, this.#photos.length - 1));
    this.dialog.showModal();
  }

  /** @param {number} index */
  #showPhoto(index) {
    const photo = this.#photos[index];
    const image = this.dialog?.querySelector('[data-reader-image]');
    if (!photo || !image) return;
    image.src = photo.src;
    image.alt = photo.alt;
    for (const thumb of this.dialog.querySelectorAll('[data-reader-photo]')) {
      thumb.setAttribute('aria-current', String(Number(thumb.dataset.readerPhoto) === index));
    }
  }
}

customElements.define('reviews-loop', ReviewsLoop);

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
/* Cookie consent: the theme's banner, recorded through Shopify's privacy API */
/* -------------------------------------------------------------------------- */

const COOKIE_PURPOSES = ['preferences', 'analytics', 'marketing'];
// A choice kept here is asked again after about six months.
const COOKIE_MEMORY = 182 * 24 * 60 * 60 * 1000;
const cookieStore = {
  get() {
    try {
      return JSON.parse(window.localStorage.getItem('velea:cookies')) || {};
    } catch (error) {
      return {};
    }
  },
  set(value) {
    try {
      window.localStorage.setItem('velea:cookies', JSON.stringify(value));
    } catch (error) {
      // Storage can be blocked (private mode): Shopify still keeps the choice.
    }
  },
};

let customerPrivacyLoading = null;

/** Shopify's built-in cookie banner, when it is switched on in the shop's privacy settings. */
function shopifyBannerShown() {
  return Boolean(document.querySelector('#shopify-pc__banner, [id^="shopify-pc__banner"]'));
}

/**
 * Shopify's Customer Privacy API, loaded once. Resolves to null where it is not
 * available, so the banner still works and simply keeps the choice locally.
 * @returns {Promise<object|null>}
 */
function loadCustomerPrivacy() {
  if (customerPrivacyLoading) return customerPrivacyLoading;
  customerPrivacyLoading = new Promise((resolve) => {
    const shopify = window.Shopify;
    if (shopify?.customerPrivacy) {
      resolve(shopify.customerPrivacy);
      return;
    }
    if (typeof shopify?.loadFeatures !== 'function') {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => resolve(shopify.customerPrivacy || null), 5000);
    const load = (versions) => {
      shopify.loadFeatures([{ name: 'consent-tracking-api', version: versions[0] }], (error) => {
        if (error && versions.length > 1) {
          load(versions.slice(1));
          return;
        }
        clearTimeout(timer);
        resolve(shopify.customerPrivacy || null);
      });
    };
    load(['0.2', '0.1']);
  });
  return customerPrivacyLoading;
}

class CookieConsent extends HTMLElement {
  #controller = null;
  #lastFocus = null;
  #useShopifyBanner = false;
  #answered = false;
  #showTimer = 0;

  connectedCallback() {
    this.banner = this.querySelector('[data-cookie-banner]');
    this.prefs = this.querySelector('[data-cookie-prefs]');
    if (!this.banner || !this.prefs) return;
    this.#controller?.abort();
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.addEventListener('click', (event) => {
      const choice = event.target.closest('[data-cookie-choice]');
      if (choice) {
        this.#choose(choice.dataset.cookieChoice);
        return;
      }
      if (event.target.closest('[data-cookie-open-prefs]')) this.openPreferences();
      if (event.target.closest('[data-cookie-close]')) this.prefs.close();
    }, { signal });
    // A click on the dimmed backdrop closes the preferences.
    this.prefs.addEventListener('click', (event) => {
      if (event.target === this.prefs) this.prefs.close();
    }, { signal });
    this.prefs.addEventListener('close', () => {
      if (this.#lastFocus instanceof HTMLElement && this.#lastFocus.isConnected) {
        this.#lastFocus.focus({ preventScroll: true });
      }
    }, { signal });

    // « Gérer les cookies » links reopen the choices at any time.
    for (const link of document.querySelectorAll('[data-cookie-preferences]')) {
      link.hidden = false;
      link.addEventListener('click', () => this.#manage(), { signal });
    }

    if (this.hasAttribute('data-design-mode')) {
      document.addEventListener('shopify:section:select', (event) => {
        if (event.detail?.sectionId === this.dataset.sectionId) this.#showBanner(false);
      }, { signal });
      document.addEventListener('shopify:section:deselect', (event) => {
        if (event.detail?.sectionId === this.dataset.sectionId) this.#hideBanner();
      }, { signal });
      return;
    }

    this.#decide();
  }

  disconnectedCallback() {
    this.#controller?.abort();
    clearTimeout(this.#showTimer);
    document.documentElement.removeAttribute('data-cookie-banner-open');
  }

  /**
   * Shown as the site opens, without waiting for the rest of the page. A choice
   * kept in this browser skips it; a choice only Shopify still holds hides it
   * again quietly; Shopify's own banner, if switched on, takes its place.
   */
  #decide() {
    if (shopifyBannerShown()) {
      this.#useShopifyBanner = true;
      return;
    }
    // « ?cookies » in the address shows the banner again, to preview it at any time.
    const preview = new URL(window.location.href).searchParams.has('cookies');
    const kept = cookieStore.get();
    const keptIsRecent = Boolean(kept.decidedAt) && Date.now() - kept.decidedAt < COOKIE_MEMORY;
    if (keptIsRecent && !preview) return;
    this.#showTimer = setTimeout(() => this.#showBanner(true), 250);
    this.#yieldToShopifyBanner();
    if (preview) return;
    this.#currentConsent().then((consent) => {
      if (!consent.decided || this.#answered) return;
      clearTimeout(this.#showTimer);
      const values = {};
      for (const purpose of COOKIE_PURPOSES) values[purpose] = consent[purpose];
      cookieStore.set({ decidedAt: Date.now(), ...values });
      if (!this.banner.hidden) this.#hideBanner();
    });
  }

  /** Shopify's own banner can arrive a little later: this one then steps aside. */
  #yieldToShopifyBanner() {
    const observer = new MutationObserver(() => {
      if (!shopifyBannerShown()) return;
      observer.disconnect();
      this.#useShopifyBanner = true;
      clearTimeout(this.#showTimer);
      if (!this.banner.hidden) this.#hideBanner();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 10000);
    this.#controller?.signal.addEventListener('abort', () => observer.disconnect());
  }

  /** @returns {Promise<{decided: boolean, preferences: boolean, analytics: boolean, marketing: boolean}>} */
  async #currentConsent() {
    const privacy = await loadCustomerPrivacy();
    let shopifyConsent = null;
    try {
      shopifyConsent = privacy?.currentVisitorConsent?.() || null;
    } catch (error) {
      shopifyConsent = null;
    }
    const kept = cookieStore.get();
    const keptIsRecent = Boolean(kept.decidedAt) && Date.now() - kept.decidedAt < COOKIE_MEMORY;
    const result = { decided: keptIsRecent };
    for (const purpose of COOKIE_PURPOSES) {
      // Shopify answers 'yes', 'no', or '' when the visitor has not chosen yet.
      const answer = shopifyConsent?.[purpose];
      if (answer) result.decided = true;
      result[purpose] = answer ? answer === 'yes' : kept[purpose] === true;
    }
    return result;
  }

  /** @param {boolean} focus - move focus to the banner (not in the theme editor) */
  #showBanner(focus) {
    if (this.#useShopifyBanner) return;
    this.banner.hidden = false;
    document.documentElement.setAttribute('data-cookie-banner-open', '');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.banner.classList.add('is-visible'));
    });
    // Keyboard and screen reader users meet the choice first, without the page scrolling.
    if (focus && (document.activeElement === document.body || !document.activeElement)) {
      this.banner.focus({ preventScroll: true });
    }
  }

  #hideBanner() {
    this.banner.classList.remove('is-visible');
    document.documentElement.removeAttribute('data-cookie-banner-open');
    setTimeout(() => {
      if (!this.banner.classList.contains('is-visible')) this.banner.hidden = true;
    }, 600);
  }

  async openPreferences() {
    const consent = await this.#currentConsent();
    for (const input of this.querySelectorAll('[data-cookie-purpose]')) {
      input.checked = consent[input.dataset.cookiePurpose] === true;
    }
    if (this.prefs.open) return;
    this.#lastFocus = document.activeElement;
    this.prefs.showModal();
  }

  #manage() {
    // Where Shopify's own banner is in use, its preferences open instead.
    if (this.#useShopifyBanner && typeof window.privacyBanner?.showPreferences === 'function') {
      window.privacyBanner.showPreferences();
      return;
    }
    this.openPreferences();
  }

  /** @param {string} choice - 'accept', 'reject' or 'save' */
  async #choose(choice) {
    const values = {};
    for (const purpose of COOKIE_PURPOSES) {
      if (choice === 'accept') values[purpose] = true;
      else if (choice === 'reject') values[purpose] = false;
      else values[purpose] = Boolean(this.querySelector(`[data-cookie-purpose="${purpose}"]`)?.checked);
    }
    this.#answered = true;
    cookieStore.set({ decidedAt: Date.now(), ...values });
    if (this.prefs.open) this.prefs.close();
    this.#hideBanner();
    announce(theme.strings.cookiesSaved);
    document.dispatchEvent(new CustomEvent('theme:cookie-consent', { detail: values }));

    const privacy = await loadCustomerPrivacy();
    if (typeof privacy?.setTrackingConsent !== 'function') return;
    try {
      privacy.setTrackingConsent(values, () => {});
    } catch (error) {
      // The choice stays kept in this browser; Shopify asks again if it missed it.
    }
  }
}

customElements.define('cookie-consent', CookieConsent);

/* -------------------------------------------------------------------------- */
/* Welcome pop-up: shown once, 10 s after the visitor arrives on the site     */
/* -------------------------------------------------------------------------- */

// v2: everyone's memory of the pop-up starts afresh with the new design.
const WELCOME_KEY = 'velea:welcome-v2';
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
  #prepared = false;

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

    // « ?offre » in the address shows the pop-up at once, to preview it at any time.
    if (new URL(window.location.href).searchParams.has('offre')) {
      this.#prepare();
      this.#timer = setTimeout(() => this.open(true), 800);
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
    this.#prepare();
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
    // The cookie banner comes first: the offer follows a moment after the visitor's choice.
    if (!force && document.documentElement.hasAttribute('data-cookie-banner-open')) {
      document.addEventListener('theme:cookie-consent', () => {
        this.#timer = setTimeout(() => this.open(), 1500);
      }, { once: true, signal: this.#controller?.signal });
      return;
    }
    this.#prepare();
    this.#lastFocus = document.activeElement;
    this.dialog.showModal();
    track('theme:welcome_view');
  }

  /**
   * The photo and the serif used only in the pop-up are fetched while the page
   * is idle, once it is due to open, so it appears complete.
   */
  #prepare() {
    if (this.#prepared) return;
    this.#prepared = true;
    const warm = () => {
      for (const image of this.querySelectorAll('img[loading="lazy"]')) image.loading = 'eager';
      if (!document.fonts) return;
      for (const font of (this.dataset.warmFonts || '').split('|').filter(Boolean)) {
        document.fonts.load(font).catch(() => {});
      }
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(warm, { timeout: 3000 });
    } else {
      setTimeout(warm, 1500);
    }
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
      // Blocks coming into view together appear one after the other.
      const arriving = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target);
      arriving.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      arriving.forEach((item, index) => {
        if (index > 0) item.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 110}ms`);
        item.classList.add('is-visible');
        observer.unobserve(item);
        // The delay is only for the entrance, not for later hover effects.
        if (index > 0) setTimeout(() => item.style.removeProperty('--reveal-delay'), 2200);
      });
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

// A link to a closed <details> (e.g. "Guide des tailles" next to the sizes) opens it before scrolling to it.
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || link.getAttribute('href').length < 2) return;
  const target = document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)));
  if (target instanceof HTMLDetailsElement) target.open = true;
});
