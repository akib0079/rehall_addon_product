/**
 * Complete your outfit (native)
 * -----------------------------------------------------------------------------
 * <complementary-outfit> enhances the server-rendered cards output by
 * snippets/complementary-outfit.liquid. All markup, prices and column counts
 * come from Liquid; this script only toggles state:
 *   .cyo-card.is-open     options panel visible
 *   .cyo-card.is-dismissed explicitly closed while focus is inside (beats :focus-within)
 *   .cyo-card[data-step]  1 = colour swatches, 2 = sizes
 *   .cyo-card.is-busy     add to cart in progress
 * Desktop opens a card on hover, touch devices on tap. Sizes are added through
 * the Ajax cart API, then the theme (and Rebuy smart cart) is told via
 * 'theme:cartchanged'.
 */
(() => {
  'use strict';

  const HOVER_QUERY = window.matchMedia('(hover: hover) and (pointer: fine)');
  const REDUCED_MOTION_QUERY = window.matchMedia('(prefers-reduced-motion: reduce)');
  const STEP_DURATION = 300;
  const SUCCESS_DURATION = 1200;
  const ERROR_DURATION = 4000;
  const REQUEST_TIMEOUT = 15000;
  const DEFAULT_ADDED_TEXT = '[title] – [size] added to cart';
  const DEFAULT_ERROR_TEXT = 'Could not add to cart.';
  const ORIGINAL_IMAGES = new WeakMap();

  const escapeSelector = (value) => (window.CSS && CSS.escape ? CSS.escape(value) : String(value).replace(/["\\]/g, '\\$&'));
  const escapeHtml = (text) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
  const asText = (value) => (typeof value === 'string' ? value.trim() : '');
  // Cart errors may contain entities; DOMParser documents are inert (no scripts, no requests)
  const toPlainText = (value) => new DOMParser().parseFromString(value, 'text/html').body.textContent.trim();

  class ComplementaryOutfit extends HTMLElement {
    constructor() {
      super();
      this.bound = false;
      this.hoverCard = null;
      this.timers = new Map();
      this.animations = new Map();
      this.onClick = this.onClick.bind(this);
      this.onFocusIn = this.onFocusIn.bind(this);
      this.onFocusOut = this.onFocusOut.bind(this);
      this.onPointerEnter = this.onPointerEnter.bind(this);
      this.onPointerLeave = this.onPointerLeave.bind(this);
      this.onDocumentPointerDown = this.onDocumentPointerDown.bind(this);
      this.onDocumentKeyDown = this.onDocumentKeyDown.bind(this);
      this.onHoverChange = this.onHoverChange.bind(this);
    }

    connectedCallback() {
      if (this.bound) return;
      this.bound = true;
      this.canHover = HOVER_QUERY.matches;
      this.listeners().forEach(([target, type, handler, options]) => target.addEventListener(type, handler, options));
      if (HOVER_QUERY.addEventListener) HOVER_QUERY.addEventListener('change', this.onHoverChange);
      else HOVER_QUERY.addListener(this.onHoverChange);
    }

    // Theme editor re-renders sections: drop every listener, timer and inline style
    disconnectedCallback() {
      if (!this.bound) return;
      this.bound = false;
      this.hoverCard = null;
      this.listeners().forEach(([target, type, handler, options]) => target.removeEventListener(type, handler, options));
      if (HOVER_QUERY.removeEventListener) HOVER_QUERY.removeEventListener('change', this.onHoverChange);
      else HOVER_QUERY.removeListener(this.onHoverChange);
      this.animations.forEach((finish) => finish());
      this.timers.forEach((named) => Object.keys(named).forEach((name) => clearTimeout(named[name])));
      this.timers.clear();
    }

    listeners() {
      return [
        [this, 'click', this.onClick],
        [this, 'focusin', this.onFocusIn],
        [this, 'focusout', this.onFocusOut],
        // pointerenter/leave don't bubble, but they do pass through the capture phase of ancestors
        [this, 'pointerenter', this.onPointerEnter, true],
        [this, 'pointerleave', this.onPointerLeave, true],
        [document, 'pointerdown', this.onDocumentPointerDown, { capture: true, passive: true }],
        [document, 'keydown', this.onDocumentKeyDown]
      ];
    }

    /* Events
       ------------------------------------------------------------------------- */

    onClick(event) {
      const target = event.target instanceof Element ? event.target : null;
      const card = target && target.closest('.cyo-card');
      if (!card || !this.contains(card)) return;

      const size = target.closest('.cyo-size');
      const swatch = !size && target.closest('.cyo-swatch');
      if (size) {
        this.addToCart(card, size);
      } else if (swatch) {
        this.selectColor(card, swatch);
      } else if (target.closest('.cyo-card__media-btn')) {
        this.toggleFromMedia(card, event);
      } else if (!target.closest('a, button, input, select, textarea, label')) {
        // Tap on the card body (touch); with a mouse the card is already open
        this.open(card);
      }
    }

    onPointerEnter(event) {
      if (event.pointerType !== 'mouse' || !this.canHover || !this.isCard(event.target)) return;
      this.hoverCard = event.target;
      this.open(event.target);
    }

    // The card keeps its step: resetting here made the content below jump
    onPointerLeave(event) {
      if (event.pointerType !== 'mouse' || !this.canHover || !this.isCard(event.target)) return;
      if (this.hoverCard === event.target) this.hoverCard = null;
      this.releasePointerFocus(event.target);
      this.close(event.target, false);
    }

    // Focus moving on from the image (e.g. Tab to the title) ends an explicit close
    onFocusIn(event) {
      const card = event.target instanceof Element ? event.target.closest('.cyo-card') : null;
      if (!card || !this.contains(card)) return;
      if (!event.target.closest('.cyo-card__media-btn')) card.classList.remove('is-dismissed');
      this.syncExpanded(card);
    }

    // Keyboard focus leaving a card closes it. No relatedTarget (window blur, tap on a
    // non-focusable area) is left to the pointerdown handler.
    onFocusOut(event) {
      const card = event.target instanceof Element ? event.target.closest('.cyo-card') : null;
      if (!card || !this.contains(card)) return;
      const next = event.relatedTarget;
      if (!(next instanceof Node) || card.contains(next)) {
        this.syncExpanded(card);
        return;
      }
      card.classList.remove('is-dismissed');
      this.close(card, false);
    }

    onDocumentPointerDown(event) {
      const target = event.target instanceof Node ? event.target : null;
      this.querySelectorAll('.cyo-card.is-open').forEach((card) => {
        if (target && card.contains(target)) return;
        // A scroll gesture moves no focus; drop tap focus so :focus-within can't pin the panel open
        this.releasePointerFocus(card);
        this.close(card);
      });
    }

    onDocumentKeyDown(event) {
      if (event.key !== 'Escape' && event.key !== 'Esc') return;
      const active = document.activeElement;
      const card = active && this.contains(active) ? active.closest('.cyo-card') : null;
      if (!card) {
        this.querySelectorAll('.cyo-card.is-open').forEach((openCard) => this.close(openCard));
        return;
      }
      // Move focus out of the panel first so the panel (and its step) may be hidden
      const panel = card.querySelector('.cyo-card__options');
      const focusTarget = card.querySelector('.cyo-card__media-btn')
        || (panel && panel.contains(active) ? card.querySelector('.cyo-card__title') : null);
      if (focusTarget && focusTarget !== active) focusTarget.focus();
      this.close(card);
      // Esc is explicit, so a two-step card may go back to its colours
      if (card.dataset.mode === 'two-step' && !(panel && panel.contains(document.activeElement))) this.showSwatches(card);
    }

    onHoverChange(event) {
      this.canHover = event.matches;
      this.hoverCard = null;
      this.querySelectorAll('.cyo-card.is-open').forEach((card) => this.close(card));
    }

    /* Open / close
       ------------------------------------------------------------------------- */

    isCard(node) {
      return node instanceof Element && node.classList.contains('cyo-card');
    }

    open(card) {
      this.querySelectorAll('.cyo-card.is-open').forEach((other) => {
        if (other !== card) this.close(other, false);
      });
      card.classList.remove('is-dismissed');
      card.classList.add('is-open');
      this.syncExpanded(card);
    }

    // An explicit close (dismiss) also hides a panel that :focus-within would keep visible
    close(card, dismiss = true) {
      card.classList.remove('is-open');
      if (dismiss && card.contains(document.activeElement)) card.classList.add('is-dismissed');
      this.syncExpanded(card);
    }

    // Mirrors the CSS: .is-open, :focus-within (unless dismissed) or (hover: hover) :hover
    isShown(card, viaFocus = true) {
      if (card.classList.contains('is-open') || (this.canHover && card === this.hoverCard)) return true;
      if (!viaFocus || card.classList.contains('is-dismissed')) return false;
      try {
        return card.matches(':focus-within');
      } catch (error) {
        return card.contains(document.activeElement);
      }
    }

    syncExpanded(card) {
      const button = card.querySelector('.cyo-card__media-btn');
      if (button) button.setAttribute('aria-expanded', this.isShown(card) ? 'true' : 'false');
    }

    // A click/tap may leave focus on a button; :focus-within would keep the panel visible
    releasePointerFocus(card) {
      const active = document.activeElement;
      if (!active || active === document.body || !card.contains(active)) return;
      let keyboardFocus = false;
      try {
        keyboardFocus = active.matches(':focus-visible');
      } catch (error) {
        keyboardFocus = false;
      }
      if (!keyboardFocus) active.blur();
    }

    /* Steps
       ------------------------------------------------------------------------- */

    // A keyboard click (detail 0) counts a panel shown by :focus-within as open. A tap or
    // mouse click focuses the button itself, so only .is-open / hover count there.
    toggleFromMedia(card, event) {
      const shown = this.isShown(card, !event || event.detail === 0);
      const twoStep = card.dataset.mode === 'two-step';
      if (twoStep && !(shown && card.dataset.step === '2')) {
        this.open(card);
        this.showSizes(card, this.selectedSwatch(card));
      } else if (twoStep && card.querySelectorAll('.cyo-swatch').length > 1) {
        this.open(card);
        this.showSwatches(card);
      } else if (shown && !(this.canHover && card === this.hoverCard)) {
        this.close(card);
      } else {
        this.open(card);
      }
    }

    selectColor(card, swatch) {
      const hadFocus = swatch.contains(document.activeElement);
      card.querySelectorAll('.cyo-swatch').forEach((item) => {
        const selected = item === swatch;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      this.swapImage(card, swatch);
      const group = this.showSizes(card, swatch);
      // The swatches step is hidden now: keep keyboard focus inside the panel
      const firstSize = hadFocus && group ? group.querySelector('.cyo-size:not([disabled])') : null;
      if (firstSize) firstSize.focus({ preventScroll: true });
    }

    selectedSwatch(card) {
      return card.querySelector('.cyo-swatch.is-selected') || card.querySelector('.cyo-swatch');
    }

    showSwatches(card) {
      this.setStep(card, card.querySelector('.cyo-step--swatches'), 1);
    }

    showSizes(card, swatch) {
      const color = swatch ? swatch.dataset.colorValue || '' : '';
      const group = card.querySelector(`.cyo-step--sizes[data-color-value="${escapeSelector(color)}"]`)
        || card.querySelector('.cyo-step--sizes');
      this.updatePrice(card, group);
      this.setStep(card, group, 2);
      return group;
    }

    setStep(card, step, number) {
      const steps = card.querySelector('.cyo-card__steps');
      if (!step || !steps) return;
      card.setAttribute('data-step', String(number));
      if (step.classList.contains('is-current')) return;
      this.animateHeight(steps, () => {
        steps.querySelectorAll('.cyo-step.is-current').forEach((current) => current.classList.remove('is-current'));
        step.classList.add('is-current');
      });
    }

    // Measure from -> apply change -> measure to -> transition the explicit height, then release it
    animateHeight(steps, mutate) {
      const from = steps.offsetHeight;
      const running = this.animations.get(steps);
      if (running) running();
      mutate();
      if (REDUCED_MOTION_QUERY.matches || !steps.getClientRects().length) return;
      const to = steps.offsetHeight;
      if (from === to) return;

      const finish = () => {
        steps.removeEventListener('transitionend', onEnd);
        this.cancel(steps, 'height');
        this.animations.delete(steps);
        steps.style.height = '';
        steps.style.transition = '';
      };
      const onEnd = (event) => {
        if (event.target === steps && event.propertyName === 'height') finish();
      };
      steps.style.height = `${from}px`;
      void steps.offsetHeight; // commit the start height
      steps.style.transition = `height ${STEP_DURATION}ms ease-out`;
      steps.style.height = `${to}px`;
      steps.addEventListener('transitionend', onEnd);
      this.animations.set(steps, finish);
      this.schedule(steps, 'height', finish, STEP_DURATION + 50);
    }

    // Colours without a variant image fall back to the image the card was rendered with
    swapImage(card, swatch) {
      const img = card.querySelector('.cyo-card__img');
      if (!img) return;
      if (!ORIGINAL_IMAGES.has(img)) ORIGINAL_IMAGES.set(img, { src: img.getAttribute('src'), srcset: img.getAttribute('srcset') });
      const image = swatch.dataset.imageSrc
        ? { src: swatch.dataset.imageSrc, srcset: swatch.dataset.imageSrcset || null }
        : ORIGINAL_IMAGES.get(img);
      if (!image.src || image.src === img.getAttribute('src')) return;
      if (image.srcset) img.setAttribute('srcset', image.srcset);
      else img.removeAttribute('srcset');
      img.setAttribute('src', image.src);
    }

    updatePrice(card, group) {
      const price = group && group.dataset.price;
      const wrapper = card.querySelector('.cyo-card__price');
      const current = wrapper && wrapper.querySelector('.cyo-card__price-current');
      if (!price || !current) return;
      const compare = group.dataset.comparePrice || '';
      const onSale = compare !== '' && compare !== price;
      let compareEl = wrapper.querySelector('.cyo-card__price-compare');
      current.textContent = price;
      current.classList.toggle('is-sale', onSale);
      if (onSale) {
        if (!compareEl) {
          compareEl = document.createElement('s');
          compareEl.className = 'cyo-card__price-compare';
          wrapper.appendChild(compareEl);
        }
        compareEl.textContent = compare;
      } else if (compareEl) {
        compareEl.remove();
      }
    }

    /* Add to cart
       ------------------------------------------------------------------------- */

    async addToCart(card, button) {
      if (button.disabled || card.classList.contains('is-busy')
        || button.classList.contains('is-unavailable') || button.classList.contains('is-loading')) return;
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

    announce(card, button) {
      const title = card.dataset.productTitle || '';
      const size = this.variantText(card, button);
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

    // Size label, or the colour when the button only reads "+ Add" (Liquid marks it data-add-only)
    variantText(card, button) {
      if (card.dataset.mode !== 'single' && !button.hasAttribute('data-add-only')) {
        return (button.querySelector('.cyo-size__label') || button).textContent.trim();
      }
      const group = button.closest('.cyo-step--sizes');
      const swatch = card.querySelector('.cyo-swatch.is-selected');
      return (group && group.dataset.colorValue) || (swatch && swatch.dataset.colorValue) || '';
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
      const error = card.querySelector('.cyo-card__error');
      if (!error) return;
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
        delete named[name];
        callback();
      }, delay);
    }

    cancel(owner, name) {
      const named = this.timers.get(owner);
      if (!named || !(name in named)) return;
      clearTimeout(named[name]);
      delete named[name];
    }
  }

  if (!customElements.get('complementary-outfit')) customElements.define('complementary-outfit', ComplementaryOutfit);
})();
