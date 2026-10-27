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
 * Pink button bottom right that opens a chat-like panel. The visitor types a
 * question (or picks a suggested topic) and the answer appears after a short
 * "typing" pause. Answers are the merchant's own texts (templates rendered by
 * Liquid), chosen from each topic's keywords; health questions get the theme's
 * caution notice. Any other question goes to the Shopify Inbox chat (and its
 * AI agent) when that option is on, otherwise to the contact form with the
 * question already written in. Nothing typed here is stored.
 */
class VeleaAssistant extends HTMLElement {
  static nudgeKey = 'velea:assistant-nudge';

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
    this.topics = [...this.querySelectorAll('[data-assistant-topic]')].map((chip) => ({
      id: chip.dataset.assistantTopic,
      keywords: VeleaAssistant.keywords(chip.dataset.keywords),
    }));
    this.health = VeleaAssistant.keywords(this.dataset.healthKeywords);
    this.hello = VeleaAssistant.keywords(this.dataset.helloKeywords);
    this.thanks = VeleaAssistant.keywords(this.dataset.thanksKeywords);
    if (this.dataset.replaceInbox === 'true') document.documentElement.classList.add('has-assistant');

    this.launcher.addEventListener('click', () => (this.panel.hidden ? this.open() : this.close()));
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
    if (!this.started) this.#start();
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
    const topic = target.closest('[data-assistant-topic]');
    if (topic) this.#choose(/** @type {HTMLButtonElement} */ (topic));
  }

  async #start() {
    this.started = true;
    this.run = (this.run || 0) + 1;
    const run = this.run;
    this.busy = true;
    this.#updateInput();
    this.log.replaceChildren();
    this.choices.hidden = true;
    for (const chip of this.choices.querySelectorAll('[data-seen]')) chip.removeAttribute('data-seen');
    await this.#botSay('greeting', 650);
    if (run !== this.run) return;
    this.#showChoices();
    this.busy = false;
    this.#updateInput();
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
    chip.setAttribute('data-seen', '');
    track('velea_assistant_question', { answer: chip.dataset.assistantTopic, source: 'topic' });
    await this.#finish(run);
  }

  /**
   * A typed question: the best matching answer, or the hand-over.
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

    const answer = this.#match(question);
    track('velea_assistant_question', { answer: answer || 'none', source: 'typed' });

    if (answer) {
      await this.#botSay(answer, 900);
      if (run !== this.run) return;
      const chip = this.choices.querySelector(`[data-assistant-topic="${answer}"]`);
      chip?.setAttribute('data-seen', '');
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

    const message = await this.#botSay('unknown', 900);
    if (run !== this.run) return;
    this.#prepareMail(message, question);
    this.#showChoices();
    this.busy = false;
    this.#updateInput();
  }

  /** @param {number} run */
  async #finish(run) {
    await this.#botSay('next', 450);
    if (run !== this.run) return;
    this.#showChoices();
    this.busy = false;
    this.#updateInput();
  }

  /**
   * The id of the answer for a typed question: health first, then the topic
   * with the most keywords found, then hello / thanks for short messages.
   * @param {string} question
   * @returns {string | null}
   */
  #match(question) {
    const text = VeleaAssistant.normalize(question);
    if (VeleaAssistant.score(text, this.health) > 0) return 'health';

    let best = null;
    let bestScore = 0;
    for (const topic of this.topics) {
      const score = VeleaAssistant.score(text, topic.keywords);
      if (score > bestScore) {
        best = topic.id;
        bestScore = score;
      }
    }
    if (best) return best;

    const short = text.trim().split(' ').length <= 5;
    if (short && VeleaAssistant.score(text, this.thanks) > 0) return 'thanks';
    if (short && VeleaAssistant.score(text, this.hello) > 0) return 'hello';
    return null;
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
      const message = await this.#botSay('ai-missing', 400);
      this.#prepareMail(message, question);
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
      await new Promise((resolve) => setTimeout(resolve, 150));
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
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return null;
  }

  /**
   * @param {string} templateId
   * @param {number} delay
   * @returns {Promise<HTMLElement | null>} The message added to the conversation
   */
  async #botSay(templateId, delay) {
    const template = this.querySelector(`template[data-assistant-template="${templateId}"]`);
    if (!template) return null;
    const typing = document.createElement('div');
    typing.className = 'assistant__typing';
    typing.setAttribute('aria-hidden', 'true');
    typing.innerHTML = '<span></span><span></span><span></span>';
    this.log.append(typing);
    this.#scroll();
    await new Promise((resolve) => setTimeout(resolve, this.reduceMotion ? 0 : delay));
    typing.remove();
    const message = document.createElement('div');
    message.className = 'assistant__msg assistant__msg--bot';
    message.append(template.content.cloneNode(true));
    this.log.append(message);
    this.#scroll();
    return message;
  }

  /** @param {string} text */
  #userSay(text) {
    const message = document.createElement('p');
    message.className = 'assistant__msg assistant__msg--user';
    message.textContent = text;
    this.log.append(message);
    this.#scroll();
  }

  #showChoices() {
    if (!this.choices.children.length) return;
    this.choices.hidden = false;
    this.choices.scrollLeft = 0;
    this.#scroll();
  }

  #scroll() {
    this.log.scrollTo({ top: this.log.scrollHeight, behavior: this.reduceMotion ? 'auto' : 'smooth' });
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
/* Review carousel: swipe or arrows, moves on by itself one card at a time    */
/* -------------------------------------------------------------------------- */

class ReviewsCarousel extends HTMLElement {
  #controller = null;
  #observer = null;
  #resizeObserver = null;
  #timer = 0;
  #frame = 0;
  #paused = false;
  #hovered = false;
  #visible = false;

  connectedCallback() {
    this.viewport = this.querySelector('[data-carousel-viewport]');
    if (!this.viewport) return;
    this.slides = [...this.querySelectorAll('[data-carousel-slide]')];
    this.progress = this.querySelector('[data-carousel-progress]');
    this.toggle = this.querySelector('[data-carousel-toggle]');
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.delay = this.reduceMotion ? 0 : Number(this.dataset.autoplay || 0) * 1000;
    // A fresh start each time the carousel is (re)attached, e.g. by the theme editor.
    this.#paused = false;
    this.#hovered = false;
    this.#visible = false;
    this.toggle?.setAttribute('aria-pressed', 'false');

    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.querySelector('[data-carousel-prev]')?.addEventListener('click', () => this.#takeOver(-1), { signal });
    this.querySelector('[data-carousel-next]')?.addEventListener('click', () => this.#takeOver(1), { signal });
    this.toggle?.addEventListener('click', () => this.#setPaused(!this.#paused), { signal });

    // The visitor takes over: no more automatic movement until "play".
    for (const type of ['pointerdown', 'keydown']) {
      this.viewport.addEventListener(type, () => this.#setPaused(true), { signal, passive: true });
    }
    this.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') this.#hover(true); }, { signal });
    this.addEventListener('pointerleave', () => this.#hover(false), { signal });
    this.addEventListener('focusin', () => this.#hover(true), { signal });
    this.addEventListener('focusout', (event) => { if (!this.contains(event.relatedTarget)) this.#hover(false); }, { signal });
    document.addEventListener('visibilitychange', () => this.#schedule(), { signal });

    this.viewport.addEventListener('scroll', () => {
      cancelAnimationFrame(this.#frame);
      this.#frame = requestAnimationFrame(() => this.#updateProgress());
    }, { signal, passive: true });

    this.addEventListener('click', (event) => {
      const more = event.target.closest('[data-review-more]');
      if (more) this.#toggleText(more);
    }, { signal });

    if ('ResizeObserver' in window) {
      this.#resizeObserver = new ResizeObserver(() => {
        this.#measureTexts();
        this.#updateProgress();
      });
      this.#resizeObserver.observe(this.viewport);
    }
    this.#measureTexts();
    this.#updateProgress();

    if ('IntersectionObserver' in window) {
      this.#observer = new IntersectionObserver(([entry]) => {
        this.#visible = entry.isIntersecting;
        if (entry.isIntersecting) this.classList.add('is-in');
        this.#schedule();
      }, { threshold: 0.2 });
      this.#observer.observe(this);
    } else {
      this.classList.add('is-in');
      this.#visible = true;
      this.#schedule();
    }
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#observer?.disconnect();
    this.#resizeObserver?.disconnect();
    clearTimeout(this.#timer);
    cancelAnimationFrame(this.#frame);
  }

  /** Width of one move: from one card to the next. */
  get #step() {
    if (this.slides.length < 2) return this.viewport.clientWidth;
    return this.slides[1].offsetLeft - this.slides[0].offsetLeft;
  }

  /** @param {number} direction 1 = next, -1 = previous; loops at both ends. */
  #go(direction) {
    const { scrollLeft, scrollWidth, clientWidth } = this.viewport;
    const max = scrollWidth - clientWidth;
    let target = scrollLeft + direction * this.#step;
    if (direction > 0 && scrollLeft >= max - 2) target = 0;
    if (direction < 0 && scrollLeft <= 2) target = max;
    this.viewport.scrollTo({ left: target, behavior: this.reduceMotion ? 'auto' : 'smooth' });
  }

  /** @param {number} direction */
  #takeOver(direction) {
    this.#setPaused(true);
    this.#go(direction);
  }

  /** @param {boolean} paused */
  #setPaused(paused) {
    if (!this.delay) return;
    this.#paused = paused;
    this.toggle?.setAttribute('aria-pressed', String(paused));
    this.#schedule();
  }

  /** @param {boolean} hovered */
  #hover(hovered) {
    this.#hovered = hovered;
    this.#schedule();
  }

  #schedule() {
    clearTimeout(this.#timer);
    if (!this.delay || this.#paused || this.#hovered || !this.#visible || document.hidden) return;
    this.#timer = setTimeout(() => {
      this.#go(1);
      this.#schedule();
    }, this.delay);
  }

  /** Progress line: how far along the visible part of the track is. */
  #updateProgress() {
    if (!this.progress) return;
    const { scrollLeft, scrollWidth, clientWidth } = this.viewport;
    const value = scrollWidth > 0 ? Math.min(1, (scrollLeft + clientWidth) / scrollWidth) : 1;
    this.progress.style.setProperty('--carousel-progress', value.toFixed(3));
  }

  /** "Lire la suite" only on the cards whose text is cut. */
  #measureTexts() {
    for (const slide of this.slides) {
      if (slide.classList.contains('is-expanded')) continue;
      const text = slide.querySelector('[data-review-text]');
      const more = slide.querySelector('[data-review-more]');
      if (text && more) more.hidden = text.scrollHeight <= text.clientHeight + 1;
    }
  }

  /** @param {HTMLButtonElement} button */
  #toggleText(button) {
    const slide = button.closest('[data-carousel-slide]');
    const expanded = !slide.classList.contains('is-expanded');
    slide.classList.toggle('is-expanded', expanded);
    // Only the opened card grows: the others keep their own height meanwhile.
    this.classList.toggle('has-expanded', this.slides.some((item) => item.classList.contains('is-expanded')));
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? button.dataset.labelLess : button.dataset.labelMore;
    this.#setPaused(true);
  }
}

customElements.define('reviews-carousel', ReviewsCarousel);

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

// A link to a closed <details> (e.g. "Guide des tailles" next to the sizes) opens it before scrolling to it.
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || link.getAttribute('href').length < 2) return;
  const target = document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)));
  if (target instanceof HTMLDetailsElement) target.open = true;
});
