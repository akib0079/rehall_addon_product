/**
 * Complete your outfit (native)
 * -----------------------------------------------------------------------------
 * <complementary-outfit> enhances the server-rendered cards output by
 * snippets/complementary-outfit.liquid (one card = one product colour with its
 * in-stock sizes). Markup, prices and column counts all come from Liquid; this
 * script only toggles state:
 *   .cyo-card.is-open       sizes visible (mouse hover / image button)
 *   .cyo-card.is-dismissed  explicitly closed while focus is inside (beats :focus-within)
 *   .cyo-card.is-busy       add to cart in progress
 * Desktop mouse: sizes show on hover and keyboard focus. Touch: the CSS keeps
 * the sizes visible at all times. Sizes are added through the Ajax cart API,
 * then the theme (and the Rebuy smart cart) is told via 'theme:cartchanged'.
 */
(() => {
  'use strict';

  if (!window.customElements || customElements.get('complementary-outfit')) return;

  // Must match the media queries in complementary-outfit.css
  const HOVER_MEDIA = '(hover: hover) and (pointer: fine)';
  const TOUCH_MEDIA = '(hover: none), (pointer: coarse)';
  const SUCCESS_DURATION = 1200;
  const ERROR_DURATION = 4000;
  const REQUEST_TIMEOUT = 15000;
  const DEFAULT_ADDED_TEXT = '[title] – [size] added to cart';
  const DEFAULT_ERROR_TEXT = 'Could not add to cart.';

  const escapeHtml = (text) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
  const asText = (value) => (typeof value === 'string' ? value.trim() : '');
  // Cart errors may contain entities; DOMParser documents are inert (no scripts, no requests)
  const toPlainText = (value) => new DOMParser().parseFromString(value, 'text/html').body.textContent.trim();
  const matchesSafe = (element, selector, fallback) => {
    try {
      return element.matches(selector);
    } catch (error) {
      return fallback();
    }
  };
  const listen = (query, handler, add) => {
    if (query.addEventListener) query[add ? 'addEventListener' : 'removeEventListener']('change', handler);
    else query[add ? 'addListener' : 'removeListener'](handler);
  };

  class ComplementaryOutfit extends HTMLElement {
    constructor() {
      super();
      this.bound = false;
      this.hovered = null;
      this.timers = new Map();
      this.onClick = this.onClick.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onFocusIn = this.onFocusIn.bind(this);
      this.onFocusOut = this.onFocusOut.bind(this);
      this.onPointerEnter = this.onPointerEnter.bind(this);
      this.onPointerLeave = this.onPointerLeave.bind(this);
      this.onMediaChange = this.onMediaChange.bind(this);
    }

    connectedCallback() {
      if (this.bound) return;
      this.bound = true;
      this.hoverQuery = window.matchMedia(HOVER_MEDIA);
      this.touchQuery = window.matchMedia(TOUCH_MEDIA);
      this.listeners().forEach(([type, handler, capture]) => this.addEventListener(type, handler, capture));
      listen(this.hoverQuery, this.onMediaChange, true);
      listen(this.touchQuery, this.onMediaChange, true);
      this.reset();
    }

    // Theme editor re-renders sections: drop every listener and timer
    disconnectedCallback() {
      if (!this.bound) return;
      this.bound = false;
      this.hovered = null;
      this.listeners().forEach(([type, handler, capture]) => this.removeEventListener(type, handler, capture));
      listen(this.hoverQuery, this.onMediaChange, false);
      listen(this.touchQuery, this.onMediaChange, false);
      this.timers.forEach((named) => Object.keys(named).forEach((name) => clearTimeout(named[name])));
      this.timers.clear();
    }

    listeners() {
      return [
        ['click', this.onClick, false],
        ['keydown', this.onKeyDown, false],
        ['focusin', this.onFocusIn, false],
        ['focusout', this.onFocusOut, false],
        // pointerenter/leave don't bubble, but they do pass through the capture phase of ancestors
        ['pointerenter', this.onPointerEnter, true],
        ['pointerleave', this.onPointerLeave, true]
      ];
    }

    cards() {
      return this.querySelectorAll('.cyo-card');
    }

    cardOf(node) {
      const card = node instanceof Element ? node.closest('.cyo-card') : null;
      return card && this.contains(card) ? card : null;
    }

    isTouch() {
      return this.touchQuery.matches;
    }

    // Fresh state (first connect, re-insert, input type change); a running add to cart is kept
    reset() {
      this.hovered = null;
      this.cards().forEach((card) => {
        card.classList.remove('is-open', 'is-dismissed');
        if (this.hoverQuery.matches && matchesSafe(card, ':hover', () => false)) this.hovered = card;
        this.sync(card);
      });
    }

    /* Events
       ------------------------------------------------------------------------- */

    onClick(event) {
      const card = this.cardOf(event.target);
      if (!card) return;
      const size = event.target.closest('.cyo-size');
      if (size) this.addToCart(card, size);
      else if (event.target.closest('.cyo-card__media-btn')) this.onMediaClick(card, event);
    }

    // Touch: the sizes are always visible, nothing to toggle. Desktop: a keyboard
    // click (detail 0) counts a panel shown by :focus-within as open; a mouse click
    // or tap focuses the button itself, so only .is-open / hover count there.
    onMediaClick(card, event) {
      if (!this.isTouch()) {
        if (this.isShown(card, event.detail === 0)) this.close(card);
        else this.open(card);
      }
      this.sync(card);
    }

    onKeyDown(event) {
      if ((event.key !== 'Escape' && event.key !== 'Esc') || this.isTouch()) return;
      const card = this.cardOf(event.target);
      if (!card || !this.isShown(card)) return;
      // Move focus out of the sizes first so the panel may be hidden
      const active = document.activeElement;
      const panel = card.querySelector('.cyo-card__options');
      const focusTarget = card.querySelector('.cyo-card__media-btn')
        || (panel && panel.contains(active) ? card.querySelector('.cyo-card__title') : null);
      if (focusTarget && focusTarget !== active) focusTarget.focus();
      this.close(card);
    }

    // Focus moving on from the image (e.g. Tab to the title) ends an explicit close
    onFocusIn(event) {
      const card = this.cardOf(event.target);
      if (!card) return;
      if (!event.target.closest('.cyo-card__media-btn')) card.classList.remove('is-dismissed');
      this.sync(card);
    }

    // Focus leaving a card closes it (focus moving inside the card is handled by focusin)
    onFocusOut(event) {
      const card = this.cardOf(event.target);
      if (!card) return;
      const next = event.relatedTarget;
      if (next instanceof Node && card.contains(next)) return;
      card.classList.remove('is-open', 'is-dismissed');
      this.sync(card);
    }

    onPointerEnter(event) {
      if (event.pointerType !== 'mouse' || !this.hoverQuery.matches || this.isTouch()) return;
      const card = event.target;
      if (!(card instanceof Element) || !card.classList.contains('cyo-card')) return;
      this.hovered = card;
      this.open(card);
    }

    onPointerLeave(event) {
      if (event.pointerType !== 'mouse') return;
      const card = event.target;
      if (!(card instanceof Element) || !card.classList.contains('cyo-card')) return;
      if (this.hovered === card) this.hovered = null;
      if (this.isTouch()) return;
      this.releasePointerFocus(card);
      card.classList.remove('is-open');
      this.sync(card);
    }

    onMediaChange() {
      this.reset();
    }

    /* Open / close
       ------------------------------------------------------------------------- */

    open(card) {
      card.classList.remove('is-dismissed');
      card.classList.add('is-open');
      this.sync(card);
    }

    // An explicit close also hides a panel that :focus-within would keep visible
    close(card) {
      card.classList.remove('is-open');
      if (card.contains(document.activeElement)) card.classList.add('is-dismissed');
      this.sync(card);
    }

    // Mirrors the CSS: touch, .is-open, mouse :hover, or :focus-within unless dismissed
    isShown(card, viaFocus = true) {
      if (this.isTouch() || card.classList.contains('is-open') || card === this.hovered) return true;
      if (!viaFocus || card.classList.contains('is-dismissed')) return false;
      return matchesSafe(card, ':focus-within', () => card.contains(document.activeElement));
    }

    sync(card) {
      const button = card.querySelector('.cyo-card__media-btn');
      if (button) button.setAttribute('aria-expanded', this.isShown(card) ? 'true' : 'false');
    }

    // A mouse click leaves focus on a button; :focus-within would keep the sizes visible
    releasePointerFocus(card) {
      const active = document.activeElement;
      if (!active || active === document.body || !card.contains(active)) return;
      if (!matchesSafe(active, ':focus-visible', () => true)) active.blur();
    }

    /* Add to cart
       ------------------------------------------------------------------------- */

    async addToCart(card, button) {
      if (button.disabled || card.classList.contains('is-busy') || button.classList.contains('is-loading')) return;
      const variantId = Number(button.dataset.variantId);
      if (!variantId) return;

      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const timeout = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT) : null;
      this.cancel(button, 'success');
      button.classList.remove('is-success');
      button.classList.add('is-loading');
      card.classList.add('is-busy');
      this.hideError(card);

      try {
        const response = await fetch(this.cartAddUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] }),
          signal: controller ? controller.signal : undefined
        });
        const data = await response.json().catch(() => null);
        // Only a cart payload is a success (not e.g. a 200 HTML password / queue page)
        if (response.ok && data && Array.isArray(data.items)) this.onAdded(card, button, variantId, data);
        else this.showError(card, button, data);
      } catch (error) {
        this.showError(card, button, null);
      } finally {
        clearTimeout(timeout);
        button.classList.remove('is-loading');
        card.classList.remove('is-busy');
      }
    }

    cartAddUrl() {
      const routes = window.theme && window.theme.routes;
      return (routes && routes.cart_add_url) || '/cart/add.js';
    }

    onAdded(card, button, variantId, data) {
      button.classList.add('is-success');
      this.schedule(button, 'success', () => button.classList.remove('is-success'), SUCCESS_DURATION);
      document.dispatchEvent(new CustomEvent('theme:cartchanged', { bubbles: true, cancelable: false }));
      this.dispatchEvent(new CustomEvent('complementary:added', {
        bubbles: true,
        detail: { variantId, productId: Number(card.dataset.productId), response: data }
      }));
      this.announce(card, button);
    }

    // "+ Add" buttons (Liquid marks them data-add-only) announce the title only
    announce(card, button) {
      const title = card.dataset.productTitle || '';
      const size = button.hasAttribute('data-add-only')
        ? ''
        : (button.querySelector('.cyo-size__label') || button).textContent.trim();
      let text = this.dataset.addedText || DEFAULT_ADDED_TEXT;
      if (!size) text = text.replace(/\s*[-–—/]?\s*\[size\]/g, '');
      text = text.replace(/\[size\]/g, () => size).replace(/\[title\]/g, () => title).trim();
      this.setStatus(text);
    }

    setStatus(text) {
      const status = this.querySelector('.cyo__status');
      if (!status) return;
      // Clear first so an identical message is announced again
      status.textContent = '';
      this.schedule(status, 'announce', () => { status.textContent = text; }, 100);
    }

    showError(card, button, data) {
      const raw = (data && (asText(data.description) || asText(data.message))) || this.dataset.errorText || DEFAULT_ERROR_TEXT;
      const message = toPlainText(raw) || DEFAULT_ERROR_TEXT;
      const theme = window.theme;
      if (theme && typeof theme.showQuickPopup === 'function' && window.jQuery && button.getClientRects().length) {
        try {
          theme.showQuickPopup(escapeHtml(message), window.jQuery(button));
          // The theme popup is not a live region
          this.setStatus(message);
          return;
        } catch (error) {
          // fall back to the inline message below
        }
      }
      // Inline message (role="alert" announces it); without one, use the live region
      const error = card.querySelector('.cyo-card__error');
      if (!error) {
        this.setStatus(message);
        return;
      }
      error.textContent = message;
      error.hidden = false;
      this.schedule(error, 'hide', () => this.hideError(card), ERROR_DURATION);
    }

    hideError(card) {
      const error = card.querySelector('.cyo-card__error');
      if (!error) return;
      this.cancel(error, 'hide');
      error.hidden = true;
      error.textContent = '';
    }

    /* Timers (keyed per element so they can be replaced and cleaned up)
       ------------------------------------------------------------------------- */

    schedule(owner, name, callback, delay) {
      let named = this.timers.get(owner);
      if (!named) {
        named = {};
        this.timers.set(owner, named);
      }
      clearTimeout(named[name]);
      named[name] = setTimeout(() => {
        this.cancel(owner, name);
        callback();
      }, delay);
    }

    cancel(owner, name) {
      const named = this.timers.get(owner);
      if (!named || !(name in named)) return;
      clearTimeout(named[name]);
      delete named[name];
      if (!Object.keys(named).length) this.timers.delete(owner);
    }
  }

  customElements.define('complementary-outfit', ComplementaryOutfit);
})();
