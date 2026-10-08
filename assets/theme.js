(function ($) {
  var $ = jQuery = $;

  let cc = {
    sections: []
  };

  theme.cartNoteMonitor = {
    load: function ($notes) {
      $notes.on('change.themeCartNoteMonitor paste.themeCartNoteMonitor keyup.themeCartNoteMonitor', function () {
        theme.cartNoteMonitor.postUpdate($(this).val());
      });
    },

    unload: function ($notes) {
      $notes.off('.themeCartNoteMonitor');
    },

    updateThrottleTimeoutId: -1,
    updateThrottleInterval: 500,

    postUpdate: function (val) {
      clearTimeout(theme.cartNoteMonitor.updateThrottleTimeoutId);
      theme.cartNoteMonitor.updateThrottleTimeoutId = setTimeout(function () {
        $.post(theme.routes.cart_url + '/update.js', {
          note: val
        }, function (data) {}, 'json');
      }, theme.cartNoteMonitor.updateThrottleInterval);
    }
  };
  theme.Shopify = {
    formatMoney: function (t, r) {
      function e(t, r) {
        return void 0 === t ? r : t;
      }
      function a(t, r, a, o) {
        if (r = e(r, 2),
        a = e(a, ","),
        o = e(o, "."),
        isNaN(t) || null == t)
        return 0;
        t = (t / 100).toFixed(r);
        var n = t.split(".");
        return n[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + a) + (n[1] ? o + n[1] : "");
      }
      "string" == typeof t && (t = t.replace(".", ""));
      var o = "",
        n = /\{\{\s*(\w+)\s*\}\}/,
        i = r || this.money_format;
      switch (i.match(n)[1]) {
        case "amount":
          o = a(t, 2);
          break;
        case "amount_no_decimals":
          o = a(t, 0);
          break;
        case "amount_with_comma_separator":
          o = a(t, 2, ".", ",");
          break;
        case "amount_with_space_separator":
          o = a(t, 2, " ", ",");
          break;
        case "amount_with_period_and_space_separator":
          o = a(t, 2, " ", ".");
          break;
        case "amount_no_decimals_with_comma_separator":
          o = a(t, 0, ".", ",");
          break;
        case "amount_no_decimals_with_space_separator":
          o = a(t, 0, " ", "");
          break;
        case "amount_with_apostrophe_separator":
          o = a(t, 2, "'", ".");
          break;
        case "amount_with_decimal_separator":
          o = a(t, 2, ".", ".");
      }
      return i.replace(n, o);
    },
    formatImage: function (originalImageUrl, format) {
      return originalImageUrl ? originalImageUrl.replace(/^(.*)\.([^\.]*)$/g, '$1_' + format + '.$2') : '';
    },
    Image: {
      imageSize: function (t) {
        var e = t.match(/.+_((?:pico|icon|thumb|small|compact|medium|large|grande)|\d{1,4}x\d{0,4}|x\d{1,4})[_\.@]/);
        return null !== e ? e[1] : null;
      },
      getSizedImageUrl: function (t, e) {
        if (null == e)
        return t;
        if ("master" == e)
        return this.removeProtocol(t);
        var o = t.match(/\.(jpg|jpeg|gif|png|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);
        if (null != o) {
          var i = t.split(o[0]),
            r = o[0];
          return this.removeProtocol(i[0] + "_" + e + r);
        }
        return null;
      },
      removeProtocol: function (t) {
        return t.replace(/http(s)?:/, "");
      }
    }
  };
  theme.Disclosure = function () {
    var selectors = {
      disclosureList: '[data-disclosure-list]',
      disclosureToggle: '[data-disclosure-toggle]',
      disclosureInput: '[data-disclosure-input]',
      disclosureOptions: '[data-disclosure-option]'
    };

    var classes = {
      listVisible: 'disclosure-list--visible'
    };

    function Disclosure($disclosure) {
      this.$container = $disclosure;
      this.cache = {};
      this._cacheSelectors();
      this._connectOptions();
      this._connectToggle();
      this._onFocusOut();
    }

    Disclosure.prototype = $.extend({}, Disclosure.prototype, {
      _cacheSelectors: function () {
        this.cache = {
          $disclosureList: this.$container.find(selectors.disclosureList),
          $disclosureToggle: this.$container.find(selectors.disclosureToggle),
          $disclosureInput: this.$container.find(selectors.disclosureInput),
          $disclosureOptions: this.$container.find(selectors.disclosureOptions)
        };
      },

      _connectToggle: function () {
        this.cache.$disclosureToggle.on(
          'click',
          function (evt) {
            var ariaExpanded =
            $(evt.currentTarget).attr('aria-expanded') === 'true';
            $(evt.currentTarget).attr('aria-expanded', !ariaExpanded);

            this.cache.$disclosureList.toggleClass(classes.listVisible);
          }.bind(this)
        );
      },

      _connectOptions: function () {
        this.cache.$disclosureOptions.on(
          'click',
          function (evt) {
            evt.preventDefault();
            this._submitForm($(evt.currentTarget).data('value'));
          }.bind(this)
        );
      },

      _onFocusOut: function () {
        this.cache.$disclosureToggle.on(
          'focusout',
          function (evt) {
            var disclosureLostFocus =
            this.$container.has(evt.relatedTarget).length === 0;

            if (disclosureLostFocus) {
              this._hideList();
            }
          }.bind(this)
        );

        this.cache.$disclosureList.on(
          'focusout',
          function (evt) {
            var childInFocus =
            $(evt.currentTarget).has(evt.relatedTarget).length > 0;
            var isVisible = this.cache.$disclosureList.hasClass(
              classes.listVisible
            );

            if (isVisible && !childInFocus) {
              this._hideList();
            }
          }.bind(this)
        );

        this.$container.on(
          'keyup',
          function (evt) {
            if (evt.which !== 27) return; // escape
            this._hideList();
            this.cache.$disclosureToggle.focus();
          }.bind(this)
        );

        this.bodyOnClick = function (evt) {
          var isOption = this.$container.has(evt.target).length > 0;
          var isVisible = this.cache.$disclosureList.hasClass(
            classes.listVisible
          );

          if (isVisible && !isOption) {
            this._hideList();
          }
        }.bind(this);

        $('body').on('click', this.bodyOnClick);
      },

      _submitForm: function (value) {
        this.cache.$disclosureInput.val(value);
        this.$container.parents('form').submit();
      },

      _hideList: function () {
        this.cache.$disclosureList.removeClass(classes.listVisible);
        this.cache.$disclosureToggle.attr('aria-expanded', false);
      },

      unload: function () {
        $('body').off('click', this.bodyOnClick);
        this.cache.$disclosureOptions.off();
        this.cache.$disclosureToggle.off();
        this.cache.$disclosureList.off();
        this.$container.off();
      }
    });

    return Disclosure;
  }();
  (function () {
    function throttle(callback, threshold) {
      let debounceTimeoutId = -1;
      let tick = false;

      return function () {
        clearTimeout(debounceTimeoutId);
        debounceTimeoutId = setTimeout(callback, threshold);

        if (!tick) {
          callback.call();
          tick = true;
          setTimeout(function () {
            tick = false;
          }, threshold);
        }
      };
    }

    const scrollEvent = document.createEvent('Event');
    scrollEvent.initEvent('throttled-scroll', true, true);

    window.addEventListener("scroll", throttle(function () {
      window.dispatchEvent(scrollEvent);
    }, 200));

  })();
  // Source: https://davidwalsh.name/javascript-debounce-function
  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  theme.debounce = function (func) {let wait = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 700;let immediate = arguments.length > 2 ? arguments[2] : undefined;
    var timeout;
    return function () {
      var context = this,args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };
  // requires: throttled-scroll, debouncedresize

  /*
    Define a section by creating a new function object and registering it with the section handler.
    The section handler manages:
      Instantiation for all sections on the current page
      Theme editor lifecycle events
      Deferred initialisation
      Event cleanup
  
    There are two ways to register a section.
    In a theme:
      theme.Sections.register('slideshow', theme.SlideshowSection);
      theme.Sections.register('header', theme.HeaderSection, { deferredLoad: false });
      theme.Sections.register('background-video', theme.VideoManager, { deferredLoadViewportExcess: 800 });
  
    As a component:
      cc.sections.push({ name: 'faq', section: theme.Faq });
  
    Assign any of these to receive Shopify section lifecycle events:
      this.onSectionLoad
      this.afterSectionLoadCallback
      this.onSectionSelect
      this.onSectionDeselect
      this.onBlockSelect
      this.onBlockDeselect
      this.onSectionUnload
      this.afterSectionUnloadCallback
      this.onSectionReorder
  
    If you add any events using the manager's registerEventListener,
    e.g. this.registerEventListener(element, 'click', this.functions.handleClick.bind(this)),
    these will be automatically cleaned up after onSectionUnload.
   */

  theme.Sections = new function () {
    var _ = this;

    _._instances = [];
    _._deferredSectionTargets = [];
    _._sections = [];
    _._deferredLoadViewportExcess = 300; // load defferred sections within this many px of viewport
    _._deferredWatcherRunning = false;

    _.init = function () {
      $(document).on('shopify:section:load', function (e) {
        // load a new section
        var target = _._themeSectionTargetFromShopifySectionTarget(e.target);
        if (target) {
          _.sectionLoad(target);
        }
      }).on('shopify:section:unload', function (e) {
        // unload existing section
        var target = _._themeSectionTargetFromShopifySectionTarget(e.target);
        if (target) {
          _.sectionUnload(target);
        }
      }).on('shopify:section:reorder', function (e) {
        // unload existing section
        var target = _._themeSectionTargetFromShopifySectionTarget(e.target);
        if (target) {
          _.sectionReorder(target);
        }
      });
      $(window).on('throttled-scroll.themeSectionDeferredLoader debouncedresize.themeSectionDeferredLoader', _._processDeferredSections);
      _._deferredWatcherRunning = true;
    };

    // register a type of section
    _.register = function (type, section, options) {
      _._sections.push({
        type: type,
        section: section,
        afterSectionLoadCallback: options ? options.afterLoad : null,
        afterSectionUnloadCallback: options ? options.afterUnload : null
      });

      // load now
      $('[data-section-type="' + type + '"]').each(function () {
        if (Shopify.designMode || options && options.deferredLoad === false || !_._deferredWatcherRunning) {
          _.sectionLoad(this);
        } else {
          _.sectionDeferredLoad(this, options);
        }
      });
    };

    // prepare a section to load later
    _.sectionDeferredLoad = function (target, options) {
      _._deferredSectionTargets.push({
        target: target,
        deferredLoadViewportExcess: options && options.deferredLoadViewportExcess ? options.deferredLoadViewportExcess : _._deferredLoadViewportExcess
      });
      _._processDeferredSections(true);
    };

    // load deferred sections if in/near viewport
    _._processDeferredSections = function (firstRunCheck) {
      if (_._deferredSectionTargets.length) {
        var viewportTop = $(window).scrollTop(),
          viewportBottom = viewportTop + $(window).height(),
          loopStart = firstRunCheck === true ? _._deferredSectionTargets.length - 1 : 0;
        for (var i = loopStart; i < _._deferredSectionTargets.length; i++) {
          var target = _._deferredSectionTargets[i].target,
            viewportExcess = _._deferredSectionTargets[i].deferredLoadViewportExcess,
            sectionTop = $(target).offset().top - viewportExcess,
            doLoad = sectionTop > viewportTop && sectionTop < viewportBottom;
          if (!doLoad) {
            var sectionBottom = sectionTop + $(target).outerHeight() + viewportExcess * 2;
            doLoad = sectionBottom > viewportTop && sectionBottom < viewportBottom;
          }
          if (doLoad || sectionTop < viewportTop && sectionBottom > viewportBottom) {
            // in viewport, load
            _.sectionLoad(target);
            // remove from deferred queue and resume checks
            _._deferredSectionTargets.splice(i, 1);
            i--;
          }
        }
      }

      // remove event if no more deferred targets left, if not on first run
      if (firstRunCheck !== true && _._deferredSectionTargets.length === 0) {
        _._deferredWatcherRunning = false;
        $(window).off('.themeSectionDeferredLoader');
      }
    };

    // load in a section
    _.sectionLoad = function (target) {
      var target = target,
        sectionObj = _._sectionForTarget(target),
        section = false;

      if (sectionObj.section) {
        section = sectionObj.section;
      } else {
        section = sectionObj;
      }

      if (section !== false) {
        var instance = {
          target: target,
          section: section,
          $shopifySectionContainer: $(target).closest('.shopify-section'),
          thisContext: {
            functions: section.functions,
            registeredEventListeners: []
          }
        };
        instance.thisContext.registerEventListener = _._registerEventListener.bind(instance.thisContext);
        _._instances.push(instance);

        //Initialise any components
        if ($(target).data('components')) {
          //Init each component
          const components = $(target).data('components').split(',');
          components.forEach((component) => {
            $(document).trigger('cc:component:load', [component, target]);
          });
        }

        _._callSectionWith(section, 'onSectionLoad', target, instance.thisContext);
        _._callSectionWith(section, 'afterSectionLoadCallback', target, instance.thisContext);

        // attach additional UI events if defined
        if (section.onSectionSelect) {
          instance.$shopifySectionContainer.on('shopify:section:select', function (e) {
            _._callSectionWith(section, 'onSectionSelect', e.target, instance.thisContext);
          });
        }
        if (section.onSectionDeselect) {
          instance.$shopifySectionContainer.on('shopify:section:deselect', function (e) {
            _._callSectionWith(section, 'onSectionDeselect', e.target, instance.thisContext);
          });
        }
        if (section.onBlockSelect) {
          $(target).on('shopify:block:select', function (e) {
            _._callSectionWith(section, 'onBlockSelect', e.target, instance.thisContext);
          });
        }
        if (section.onBlockDeselect) {
          $(target).on('shopify:block:deselect', function (e) {
            _._callSectionWith(section, 'onBlockDeselect', e.target, instance.thisContext);
          });
        }
      }
    };

    // unload a section
    _.sectionUnload = function (target) {
      var sectionObj = _._sectionForTarget(target);
      var instanceIndex = -1;
      for (var i = 0; i < _._instances.length; i++) {
        if (_._instances[i].target == target) {
          instanceIndex = i;
        }
      }
      if (instanceIndex > -1) {
        var instance = _._instances[instanceIndex];
        // remove events and call unload, if loaded
        $(target).off('shopify:block:select shopify:block:deselect');
        instance.$shopifySectionContainer.off('shopify:section:select shopify:section:deselect');
        _._callSectionWith(instance.section, 'onSectionUnload', target, instance.thisContext);
        _._unloadRegisteredEventListeners(instance.thisContext.registeredEventListeners);
        _._callSectionWith(sectionObj, 'afterSectionUnloadCallback', target, instance.thisContext);
        _._instances.splice(instanceIndex);

        //Destroy any components
        if ($(target).data('components')) {
          //Init each component
          const components = $(target).data('components').split(',');
          components.forEach((component) => {
            $(document).trigger('cc:component:unload', [component, target]);
          });
        }
      } else {
        // check if it was a deferred section
        for (var i = 0; i < _._deferredSectionTargets.length; i++) {
          if (_._deferredSectionTargets[i].target == target) {
            _._deferredSectionTargets[i].splice(i, 1);
            break;
          }
        }
      }
    };

    _.sectionReorder = function (target) {
      var instanceIndex = -1;
      for (var i = 0; i < _._instances.length; i++) {
        if (_._instances[i].target == target) {
          instanceIndex = i;
        }
      }
      if (instanceIndex > -1) {
        var instance = _._instances[instanceIndex];
        _._callSectionWith(instance.section, 'onSectionReorder', target, instance.thisContext);
      }
    };

    // Helpers
    _._registerEventListener = function (element, eventType, callback) {
      element.addEventListener(eventType, callback);
      this.registeredEventListeners.push({
        element,
        eventType,
        callback
      });
    };

    _._unloadRegisteredEventListeners = function (registeredEventListeners) {
      registeredEventListeners.forEach((rel) => {
        rel.element.removeEventListener(rel.eventType, rel.callback);
      });
    };

    _._callSectionWith = function (section, method, container, thisContext) {
      if (typeof section[method] === 'function') {
        try {
          if (thisContext) {
            section[method].bind(thisContext)(container);
          } else {
            section[method](container);
          }
        } catch (ex) {
          const sectionType = container.dataset['sectionType'];
          console.warn(`Theme warning: '${method}' failed for section '${sectionType}'`);
          console.debug(container, ex);
        }
      }
    };

    _._themeSectionTargetFromShopifySectionTarget = function (target) {
      var $target = $('[data-section-type]:first', target);
      if ($target.length > 0) {
        return $target[0];
      } else {
        return false;
      }
    };

    _._sectionForTarget = function (target) {
      var type = $(target).attr('data-section-type');
      for (var i = 0; i < _._sections.length; i++) {
        if (_._sections[i].type == type) {
          return _._sections[i];
        }
      }
      return false;
    };

    _._sectionAlreadyRegistered = function (type) {
      for (var i = 0; i < _._sections.length; i++) {
        if (_._sections[i].type == type) {
          return true;
        }
      }
      return false;
    };
  }();
  // Loading third party scripts
  theme.scriptsLoaded = {};
  theme.loadScriptOnce = function (src, callback, beforeRun, sync) {
    if (typeof theme.scriptsLoaded[src] === 'undefined') {
      theme.scriptsLoaded[src] = [];
      var tag = document.createElement('script');
      tag.src = src;

      if (sync || beforeRun) {
        tag.async = false;
      }

      if (beforeRun) {
        beforeRun();
      }

      if (typeof callback === 'function') {
        theme.scriptsLoaded[src].push(callback);
        if (tag.readyState) {// IE, incl. IE9
          tag.onreadystatechange = function () {
            if (tag.readyState == "loaded" || tag.readyState == "complete") {
              tag.onreadystatechange = null;
              for (var i = 0; i < theme.scriptsLoaded[this].length; i++) {
                theme.scriptsLoaded[this][i]();
              }
              theme.scriptsLoaded[this] = true;
            }
          }.bind(src);
        } else {
          tag.onload = function () {// Other browsers
            for (var i = 0; i < theme.scriptsLoaded[this].length; i++) {
              theme.scriptsLoaded[this][i]();
            }
            theme.scriptsLoaded[this] = true;
          }.bind(src);
        }
      }

      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      return true;
    } else if (typeof theme.scriptsLoaded[src] === 'object' && typeof callback === 'function') {
      theme.scriptsLoaded[src].push(callback);
    } else {
      if (typeof callback === 'function') {
        callback();
      }
      return false;
    }
  };

  theme.loadStyleOnce = function (src) {
    var srcWithoutProtocol = src.replace(/^https?:/, '');
    if (!document.querySelector('link[href="' + encodeURI(srcWithoutProtocol) + '"]')) {
      var tag = document.createElement('link');
      tag.href = srcWithoutProtocol;
      tag.rel = 'stylesheet';
      tag.type = 'text/css';
      var firstTag = document.getElementsByTagName('link')[0];
      firstTag.parentNode.insertBefore(tag, firstTag);
    }
  }; /// Show a short-lived text popup above an element
  theme.showQuickPopup = function (message, origin, containerClass) {
    const $origin = $(origin);
    const $popup = $('<div class="simple-popup"/>');
    if (containerClass) {
      $popup.addClass(containerClass);
    }
    const offs = $origin.offset();
    const originLeft = $origin[0].getBoundingClientRect().left;
    $popup.html(message).css({ 'left': offs.left, 'top': offs.top }).hide();
    $('body').append($popup);
    let marginLeft = -($popup.outerWidth() - $origin.outerWidth()) / 2;
    if (originLeft + marginLeft < 0) {
      // Pull it away from the left edge of the screen
      marginLeft -= originLeft + marginLeft - 2;
    }
    // Pull from right edge + small gap
    let offRight = offs.left + marginLeft + $popup.outerWidth() + 5;
    if (offRight > window.innerWidth) {
      marginLeft -= offRight - window.innerWidth;
    }
    $popup.css({ marginTop: -$popup.outerHeight() - 10, marginLeft: marginLeft });
    $popup.fadeIn(200).delay(3500).fadeOut(400, function () {
      $(this).remove();
    });
  };
  class ccComponent {
    constructor(name) {let cssSelector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : `.cc-${name}`;
      const _this = this;
      this.instances = [];

      // Initialise any instance of this component within a section
      $(document).on('cc:component:load', function (event, component, target) {
        if (component === name) {
          $(target).find(`${cssSelector}:not(.cc-initialized)`).each(function () {
            _this.init(this);
          });
        }
      });

      // Destroy any instance of this component within a section
      $(document).on('cc:component:unload', function (event, component, target) {
        if (component === name) {
          $(target).find(cssSelector).each(function () {
            _this.destroy(this);
          });
        }
      });

      // Initialise any instance of this component
      $(cssSelector).each(function () {
        _this.init(this);
      });
    }

    init(container) {
      $(container).addClass('cc-initialized');
    }

    destroy(container) {
      $(container).removeClass('cc-initialized');
    }

    registerInstance(container, instance) {
      this.instances.push({
        container,
        instance
      });
    }

    destroyInstance(container) {
      this.instances = this.instances.filter((item) => {
        if (item.container === container) {
          if (typeof item.instance.destroy === 'function') {
            item.instance.destroy();
          }

          return item.container !== container;
        }
      });
    }
  }
  /**
   * Use with template literals to build HTML with correct escaping.
   *
   * Example:
   *
   * const tve = theme.createTemplateVariableEncoder();
   * tve.add('className', className, 'attribute');
   * tve.add('title', title, 'html');
   * tve.add('richText', richText, 'raw');
   * const template = `
   *   <div class="${tve.values.className}">
   *     <h1>${tve.values.title}</h1>
   *     <div class="rte">${tve.values.richText}</div>
   *   </div>
   * `;
   */
  theme.createTemplateVariableEncoder = function () {
    return {
      utilityElement: document.createElement('div'),
      values: {},
      /**
       * Add a new value to sanitise.
       * @param {String} key - key used to retrieve this value
       * @param {String} value - the value to encode and store
       * @param {String} type - possible values: [attribute, html, raw] - the type of encoding to use
       */
      add: function (key, value, type) {
        switch (type) {
          case 'attribute':
            this.utilityElement.innerHTML = '';
            this.utilityElement.setAttribute('util', value);
            this.values[key] = this.utilityElement.outerHTML.match(/util="([^"]*)"/)[1];
            break;
          case 'html':
            this.utilityElement.innerText = value;
            this.values[key] = this.utilityElement.innerHTML;
            break;
          case 'raw':
            this.values[key] = value;
            break;
          default:
            throw `Type '${type}' not handled`;
        }
      }
    };
  };
  theme.suffixIds = function (container, suffix) {
    const refAttrs = ['aria-describedby', 'aria-controls'];
    suffix = '-' + suffix;
    container.querySelectorAll('[id]').forEach((el) => {
      var oldId = el.id,
        newId = oldId + suffix;
      el.id = newId;
      refAttrs.forEach((attr) => {
        container.querySelectorAll(`[${attr}="${oldId}"]`).forEach((refEl) => {
          refEl.setAttribute(attr, newId);
        });
      });
    });
  };
  theme.renderUnitPrice = function (unit_price, unit_price_measurement, money_format) {
    if (unit_price && unit_price_measurement) {
      let unitPriceHtml = '<div class="unit-price">';
      unitPriceHtml += `<span class="unit-price__price theme-money">${theme.Shopify.formatMoney(unit_price, money_format)}</span>`;
      unitPriceHtml += `<span class="unit-price__separator">${theme.strings.products_product_unit_price_separator}</span>`;
      let unit = unit_price_measurement.reference_unit;
      if (unit_price_measurement.reference_value != 1) {
        unit = unit_price_measurement.reference_value + unit;
      }
      unitPriceHtml += `<span class="unit-price__unit">${unit}</span>`;
      unitPriceHtml += '</div>';
      return unitPriceHtml;
    } else {
      return '';
    }
  };
  class AccordionInstance {
    constructor(container) {
      this.accordion = container;
      this.itemClass = '.cc-accordion-item';
      this.titleClass = '.cc-accordion-item__title';
      this.panelClass = '.cc-accordion-item__panel';
      this.allowMultiOpen = this.accordion.dataset.allowMultiOpen === 'true';
      this.mobileOnlyAccorion = this.accordion.dataset.mobileOnlyAccordion === 'true';

      // If multiple open items not allowed, set open item as active (if there is one)
      if (!this.allowMultiOpen) {
        this.activeItem = this.accordion.querySelector(`${this.itemClass}[open]`);
      }

      this.bindEvents();

      if(this.desktopDectivate()) {
        this.accordion.querySelectorAll(`${this.titleClass}`).forEach(title => {
          const item = title.parentNode;
          const panel = title.nextElementSibling;

          this.open(item, panel);
        })
      };
    }

    /**
     * Adds inline 'height' style to a panel, to trigger open transition
     * @param {HTMLDivElement} panel - The accordion item content panel
     */
    static addPanelHeight(panel) {
      panel.style.height = `${panel.scrollHeight}px`;
    }

    /**
     * Removes inline 'height' style from a panel, to trigger close transition
     * @param {HTMLDivElement} panel - The accordion item content panel
     */
    static removePanelHeight(panel) {
      panel.getAttribute('style'); // Fix Safari bug (doesn't remove attribute without this first!)
      panel.removeAttribute('style');
    }
    
    desktopDectivate() {
      return this.mobileOnlyAccorion && (window.matchMedia('screen and (min-width: 768px)').matches);
    }

    /**
     * Opens an accordion item
     * @param {HTMLDetailsElement} item - The accordion item
     * @param {HTMLDivElement} panel - The accordion item content panel
     */
    open(item, panel) {
      panel.style.height = '0';

      // Set item to open. Blocking the default click action and opening it this way prevents a
      // slight delay which causes the panel height to be set to '0' (because item's not open yet)
      item.open = true;

      AccordionInstance.addPanelHeight(panel);

      // Slight delay required before starting transitions
      setTimeout(() => {
        item.classList.add('is-open');
      }, 10);

      if (!this.allowMultiOpen) {
        // If there's an active item and it's not the opened item, close it
        if (this.activeItem && this.activeItem !== item) {
          const activePanel = this.activeItem.querySelector(this.panelClass);
          this.close(this.activeItem, activePanel);
        }

        this.activeItem = item;
      }
    }

    /**
     * Closes an accordion item
     * @param {HTMLDetailsElement} item - The accordion item
     * @param {HTMLDivElement} panel - The accordion item content panel
     */
    close(item, panel) {
      AccordionInstance.addPanelHeight(panel);

      item.classList.remove('is-open');
      item.classList.add('is-closing');

      if (this.activeItem === item) {
        this.activeItem = null;
      }

      // Slight delay required to allow scroll height to be applied before changing to '0'
      setTimeout(() => {
        panel.style.height = '0';
      }, 10);
    }

    /**
     * Handles 'click' event on the accordion
     * @param {Object} e - The event object
     */
    handleClick(e) {
      // Ignore clicks outside a toggle (<summary> element)
      const toggle = e.target.closest(this.titleClass);
      if (!toggle) return;
      if(this.desktopDectivate()) {e.preventDefault(); return;}

      // Prevent the default action
      // We'll trigger it manually after open transition initiated or close transition complete
      e.preventDefault();

      const item = toggle.parentNode;
      const panel = toggle.nextElementSibling;

      if (item.open) {
        this.close(item, panel);
      } else {
        this.open(item, panel);
      }
    }

    /**
     * Handles 'transitionend' event in the accordion
     * @param {Object} e - The event object
     */
    handleTransition(e) {
      // Ignore transitions not on a panel element
      if(this.desktopDectivate()) {e.preventDefault(); return;}
      if (!e.target.matches(this.panelClass)) return;

      const panel = e.target;
      const item = panel.parentNode;

      if (item.classList.contains('is-closing')) {
        item.classList.remove('is-closing');
        item.open = false;
      }

      AccordionInstance.removePanelHeight(panel);
    }

    bindEvents() {
      // Need to assign the function calls to variables because bind creates a new function,
      // which means the event listeners can't be removed in the usual way
      this.clickHandler = this.handleClick.bind(this);
      this.transitionHandler = this.handleTransition.bind(this);

      this.accordion.addEventListener('click', this.clickHandler);
      this.accordion.addEventListener('transitionend', this.transitionHandler);
    }

    destroy() {
      this.accordion.removeEventListener('click', this.clickHandler);
      this.accordion.removeEventListener('transitionend', this.transitionHandler);
    }
  }

  class Accordion extends ccComponent {
    constructor() {let name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'accordion';let cssSelector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : `.cc-${name}`;
      super(name, cssSelector);
    }

    init(container) {
      super.init(container);
      this.registerInstance(container, new AccordionInstance(container));
    }

    destroy(container) {
      this.destroyInstance(container);
      super.destroy(container);
    }
  }

  new Accordion();
  (() => {
    theme.initAnimateOnScroll = function () {
      if (document.body.classList.contains('cc-animate-enabled') && window.innerWidth >= 768) {
        const animationTimeout = typeof document.body.dataset.ccAnimateTimeout !== "undefined" ? document.body.dataset.ccAnimateTimeout : 200;

        if ('IntersectionObserver' in window) {
          const intersectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
              // In view and hasn't been animated yet
              if (entry.isIntersecting && !entry.target.classList.contains("cc-animate-complete")) {
                setTimeout(() => {
                  entry.target.classList.add("-in", "cc-animate-complete");
                }, animationTimeout);

                setTimeout(() => {
                  //Once the animation is complete (assume 5 seconds), remove the animate attribute to remove all css
                  entry.target.classList.remove("data-cc-animate");
                  entry.target.style.transitionDuration = null;
                  entry.target.style.transitionDelay = null;
                }, 5000);

                // Remove observer after animation
                observer.unobserve(entry.target);
              }
            });
          });

          document.querySelectorAll('[data-cc-animate]:not(.cc-animate-init)').forEach((elem) => {
            //Set the animation delay
            if (elem.dataset.ccAnimateDelay) {
              elem.style.transitionDelay = elem.dataset.ccAnimateDelay;
            }

            ///Set the animation duration
            if (elem.dataset.ccAnimateDuration) {
              elem.style.transitionDuration = elem.dataset.ccAnimateDuration;
            }

            //Init the animation
            if (elem.dataset.ccAnimate) {
              elem.classList.add(elem.dataset.ccAnimate);
            }

            elem.classList.add("cc-animate-init");

            //Watch for elem
            intersectionObserver.observe(elem);
          });
        } else {
          //Fallback, load all the animations now
          const elems = document.querySelectorAll('[data-cc-animate]:not(.cc-animate-init)');
          for (let i = 0; i < elems.length; i++) {
            elems[i].classList.add("-in", "cc-animate-complete");
          }
        }
      }
    };

    theme.initAnimateOnScroll();

    document.addEventListener('shopify:section:load', () => {
      setTimeout(theme.initAnimateOnScroll, 100);
    });

    //Reload animations when changing from mobile to desktop
    try {
      window.matchMedia('(min-width: 768px)').addEventListener('change', (event) => {
        if (event.matches) {
          setTimeout(theme.initAnimateOnScroll, 100);
        }
      });
    } catch (e) {}
  })();


  class CustomSelectInstance {
    constructor(el) {
      this.el = el;
      this.button = el.querySelector('.cc-select__btn');
      this.listbox = el.querySelector('.cc-select__listbox');
      this.options = el.querySelectorAll('.cc-select__option');
      this.selectedOption = el.querySelector('[aria-selected="true"]');
      this.nativeSelect = document.getElementById(`${el.id}-native`);
      this.swatches = 'swatch' in this.options[this.options.length - 1].dataset;
      this.focusedClass = 'is-focused';
      this.searchString = '';
      this.listboxOpen = false;

      // Set the selected option
      if (!this.selectedOption) {
        this.selectedOption = this.listbox.firstElementChild;
      }

      this.bindEvents();
      this.setButtonWidth();
    }

    bindEvents() {
      this.el.addEventListener('keydown', this.handleKeydown.bind(this));
      this.el.addEventListener('selectOption', this.handleSelectOption.bind(this));
      this.button.addEventListener('mousedown', this.handleMousedown.bind(this));
    }

    /**
     * Adds event listeners when the options list is visible
     */
    addListboxOpenEvents() {
      this.mouseoverHandler = this.handleMouseover.bind(this);
      this.mouseleaveHandler = this.handleMouseleave.bind(this);
      this.clickHandler = this.handleClick.bind(this);
      this.blurHandler = this.handleBlur.bind(this);

      this.listbox.addEventListener('mouseover', this.mouseoverHandler);
      this.listbox.addEventListener('mouseleave', this.mouseleaveHandler);
      this.listbox.addEventListener('click', this.clickHandler);
      this.listbox.addEventListener('blur', this.blurHandler);
    }

    /**
     * Removes event listeners added when the options list was visible
     */
    removeListboxOpenEvents() {
      this.listbox.removeEventListener('mouseover', this.mouseoverHandler);
      this.listbox.removeEventListener('mouseleave', this.mouseleaveHandler);
      this.listbox.removeEventListener('click', this.clickHandler);
      this.listbox.removeEventListener('blur', this.blurHandler);
    }

    /**
     * Handles a 'keydown' event on the custom select element
     * @param {Object} e - The event object
     */
    handleKeydown(e) {
      if (this.listboxOpen) {
        this.handleKeyboardNav(e);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        this.showListbox();
      }
    }

    /**
     * Handles a 'mousedown' event on the button element
     * @param {Object} e - The event object
     */
    handleMousedown(e) {
      if (!this.listboxOpen && e.button === 0) {
        this.showListbox();
      }
    }

    /**
     * Handles a 'mouseover' event on the options list
     * @param {Object} e - The event object
     */
    handleMouseover(e) {
      if (e.target.matches('li')) {
        this.focusOption(e.target);
      }
    }

    /**
     * Handles a 'mouseleave' event on the options list
     */
    handleMouseleave() {
      this.focusOption(this.selectedOption);
    }

    /**
     * Handles a 'click' event on the options list
     * @param {Object} e - The event object
     */
    handleClick(e) {
      if (e.target.matches('.js-option')) {
        this.selectOption(e.target);
      }
    }

    /**
     * Handles a 'blur' event on the options list
     */
    handleBlur() {
      if (this.listboxOpen) {
        this.hideListbox();
      }
    }

    /**
     * Handles a 'keydown' event on the options list
     * @param {Object} e - The event object
     */
    handleKeyboardNav(e) {
      let optionToFocus;

      // Disable tabbing if options list is open (as per native select element)
      if (e.key === 'Tab') {
        e.preventDefault();
      }

      switch (e.key) {
        // Focus an option
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();

          if (e.key === 'ArrowUp') {
            optionToFocus = this.focusedOption.previousElementSibling;
          } else {
            optionToFocus = this.focusedOption.nextElementSibling;
          }

          if (optionToFocus && !optionToFocus.classList.contains('is-disabled')) {
            this.focusOption(optionToFocus);
          }
          break;

        // Select an option
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.selectOption(this.focusedOption);
          break;

        // Cancel and close the options list
        case 'Escape':
          e.preventDefault();
          this.hideListbox();
          break;

        // Search for an option and focus the first match (if one exists)
        default:
          optionToFocus = this.findOption(e.key);

          if (optionToFocus) {
            this.focusOption(optionToFocus);
          }
          break;
      }
    }

    /**
     * Sets the button width to the same as the longest option, to prevent
     * the button width from changing depending on the option selected
     */
    setButtonWidth() {
      // Get the width of an element without side padding
      const getUnpaddedWidth = (el) => {
        const elStyle = getComputedStyle(el);
        return parseFloat(elStyle.paddingLeft) + parseFloat(elStyle.paddingRight);
      };

      const buttonPadding = getUnpaddedWidth(this.button);
      const optionPadding = getUnpaddedWidth(this.selectedOption);
      const buttonBorder = this.button.offsetWidth - this.button.clientWidth;
      const optionWidth = Math.ceil(this.selectedOption.getBoundingClientRect().width);

      this.button.style.width = `${optionWidth - optionPadding + buttonPadding + buttonBorder}px`;
    }

    /**
     * Shows the options list
     */
    showListbox() {
      this.listbox.hidden = false;
      this.listboxOpen = true;

      this.el.classList.add('is-open');
      this.button.setAttribute('aria-expanded', 'true');
      this.listbox.setAttribute('aria-hidden', 'false');

      // Slight delay required to prevent blur event being fired immediately
      setTimeout(() => {
        this.focusOption(this.selectedOption);
        this.listbox.focus();

        this.addListboxOpenEvents();
      }, 10);
    }

    /**
     * Hides the options list
     */
    hideListbox() {
      if (!this.listboxOpen) return;

      this.listbox.hidden = true;
      this.listboxOpen = false;

      this.el.classList.remove('is-open');
      this.button.setAttribute('aria-expanded', 'false');
      this.listbox.setAttribute('aria-hidden', 'true');

      if (this.focusedOption) {
        this.focusedOption.classList.remove(this.focusedClass);
        this.focusedOption = null;
      }

      this.button.focus();
      this.removeListboxOpenEvents();
    }

    /**
     * Finds a matching option from a typed string
     * @param {string} key - The key pressed
     * @returns {?HTMLElement}
     */
    findOption(key) {
      this.searchString += key;

      // If there's a timer already running, clear it
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }

      // Wait 500ms to see if another key is pressed, if not then clear the search string
      this.searchTimer = setTimeout(() => {
        this.searchString = '';
      }, 500);

      // Find an option that contains the search string (if there is one)
      const matchingOption = [...this.options].find((option) => {
        const label = option.innerText.toLowerCase();
        return label.includes(this.searchString) && !option.classList.contains('is-disabled');
      });

      return matchingOption;
    }

    /**
     * Focuses an option
     * @param {HTMLElement} option - The <li> element of the option to focus
     */
    focusOption(option) {
      // Remove focus on currently focused option (if there is one)
      if (this.focusedOption) {
        this.focusedOption.classList.remove(this.focusedClass);
      }

      // Set focus on the option
      this.focusedOption = option;
      this.focusedOption.classList.add(this.focusedClass);

      // If option is out of view, scroll the list
      if (this.listbox.scrollHeight > this.listbox.clientHeight) {
        const scrollBottom = this.listbox.clientHeight + this.listbox.scrollTop;
        const optionBottom = option.offsetTop + option.offsetHeight;

        if (optionBottom > scrollBottom) {
          this.listbox.scrollTop = optionBottom - this.listbox.clientHeight;
        } else if (option.offsetTop < this.listbox.scrollTop) {
          this.listbox.scrollTop = option.offsetTop;
        }
      }
    }

    /**
     * Handles a 'selectOption' event on the custom select element
     * @param {Object} e - The event object (pass value in detail.value)
     */
    handleSelectOption(e) {
      const matchingOption = [...this.options].find((option) => option.dataset.value === e.detail.value);
      if (matchingOption) {
        this.selectOption(matchingOption);
      }
    }

    /**
     * Selects an option
     * @param {HTMLElement} option - The option <li> element
     */
    selectOption(option) {
      if (option !== this.selectedOption) {
        // Switch aria-selected attribute to selected option
        option.setAttribute('aria-selected', 'true');
        this.selectedOption.setAttribute('aria-selected', 'false');

        // Update swatch colour in the button
        if (this.swatches) {
          if (option.dataset.swatch) {
            this.button.dataset.swatch = option.dataset.swatch;
          } else {
            this.button.removeAttribute('data-swatch');
          }
        }

        // Update the button text and set the option as active
        this.button.firstChild.textContent = option.firstElementChild.textContent;
        this.listbox.setAttribute('aria-activedescendant', option.id);
        this.selectedOption = document.getElementById(option.id);

        // If a native select element exists, update its selected value and trigger a 'change' event
        if (this.nativeSelect) {
          this.nativeSelect.value = option.dataset.value;
          this.nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          // Trigger a 'change' event on the custom select element
          const detail = { selectedValue: option.dataset.value };
          this.el.dispatchEvent(new CustomEvent('change', { bubbles: true, detail }));
        }
      }

      this.hideListbox();
    }
  }

  class CustomSelect extends ccComponent {
    constructor() {let name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'custom-select';let cssSelector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : `.cc-select`;
      super(name, cssSelector);
    }

    init(container) {
      super.init(container);
      this.registerInstance(container, new CustomSelectInstance(container));
    }

    destroy(container) {
      this.destroyInstance(container);
      super.destroy(container);
    }
  }

  new CustomSelect();
  class GiftCardRecipient extends HTMLElement {
    constructor() {
      super();
      this.recipientCheckbox = null;
      this.recipientFields = null;
      this.recipientEmail = null;
      this.recipientName = null;
      this.recipientMessage = null;
      this.recipientSendOn = null;
      this.recipientOffsetProperty = null;
    }

    connectedCallback() {
      this.recipientEmail = this.querySelector('[name="properties[Recipient email]"]');
      this.recipientEmailLabel = this.querySelector(`label[for="${this.recipientEmail.id}"]`);
      this.recipientName = this.querySelector('[name="properties[Recipient name]"]');
      this.recipientMessage = this.querySelector('[name="properties[Message]"]');
      this.recipientSendOn = this.querySelector('[name="properties[Send on]"]');
      this.recipientOffsetProperty = this.querySelector('[name="properties[__shopify_offset]"]');

      // When JS is enabled, the recipientEmail field changes from optional to required
      // For themes using labels
      if (this.recipientEmailLabel && this.recipientEmailLabel.dataset.jsLabel) {
        this.recipientEmailLabel.innerText = this.recipientEmailLabel.dataset.jsLabel;
      }
      // For themes using placeholders
      if (this.recipientEmail.dataset.jsPlaceholder) {
        this.recipientEmail.placeholder = this.recipientEmail.dataset.jsPlaceholder;
        this.recipientEmail.ariaLabel = this.recipientEmail.dataset.jsAriaLabel;
      }

      // Set the timezone offset property input and enable it
      if (this.recipientOffsetProperty) {
        this.recipientOffsetProperty.value = new Date().getTimezoneOffset().toString();
        this.recipientOffsetProperty.removeAttribute('disabled');
      }

      this.recipientCheckbox = this.querySelector('.cc-gift-card-recipient__checkbox');
      this.recipientFields = this.querySelector('.cc-gift-card-recipient__fields');

      this.recipientCheckbox.addEventListener('change', () => this.synchronizeProperties());
      this.synchronizeProperties();
    }

    synchronizeProperties() {
      if (this.recipientCheckbox.checked) {
        this.recipientFields.style.display = 'block';
        // The 'required' attribute is not set in HTML because the recipientEmail field is optional when JS is disabled
        this.recipientEmail.setAttribute('required', '');
        this.recipientEmail.removeAttribute('disabled');
        this.recipientName.removeAttribute('disabled');
        this.recipientMessage.removeAttribute('disabled');
        this.recipientSendOn.removeAttribute('disabled');
        if (this.recipientOffsetProperty) {
          this.recipientOffsetProperty.removeAttribute('disabled');
        }
      } else {
        this.recipientFields.style.display = 'none';
        this.recipientEmail.removeAttribute('required');
        this.recipientEmail.setAttribute('disabled', '');
        this.recipientName.setAttribute('disabled', '');
        this.recipientMessage.setAttribute('disabled', '');
        this.recipientSendOn.setAttribute('disabled', '');
        if (this.recipientOffsetProperty) {
          this.recipientOffsetProperty.setAttribute('disabled', '');
        }
      }
    }
  }

  if (!window.customElements.get('gift-card-recipient')) {
    window.customElements.define('gift-card-recipient', GiftCardRecipient);
  }
  /**
   * Display a modal window on-click. It's a lightbox.
   * To use:
   * Add 'cc-modal' class to a clickable element.
   *
   * Configure with:
   * - data-cc-modal-contentelement - selector for element containing content to show, innerHTML of element is copied into the modal
   * - data-cc-modal-size (optional) - 'small' or 'medium', defaults to 'medium'
   * - data-cc-modal-launch (optional) - 'true' if we want to open the modal immediately
   *
   * Example:
   * <a href="#password-login" class="cc-modal" data-cc-modal-contentelement="#password-login" data-cc-modal-size="small">
   * <div id="password-login" class="js-hidden">
  */
  class ModalInstance {
    constructor(container) {
      this.container = container;
      this.size = container.dataset.ccModalSize || 'medium';
      this.contentElement = document.querySelector(container.dataset.ccModalContentelement);

      this.container.addEventListener('click', this.handleClick.bind(this));

      if (container.dataset.ccModalLaunch === 'true') {
        setTimeout(this.open.bind(this), 10);
      }
    }

    /**
     * Handles 'click' event on the container
     * @param {Object} e - The event object
     */
    handleClick(e) {
      e.preventDefault();
      this.open();
      this.opener = e.target;
    }

    /**
     * Create the modal and add it to the page.
     */
    open() {
      const tve = theme.createTemplateVariableEncoder();
      tve.add('size', this.size, 'attribute');
      tve.add('content', this.contentElement.innerHTML, 'raw');
      tve.add('button_close_label', theme.strings.general_accessibility_labels_close, 'attribute');
      tve.add('button_close_icon', theme.icons.close, 'raw');

      const html = `
      <div class="cc-modal-window cc-modal-window--pre-reveal cc-modal-window--size-${tve.values.size}">
        <div class="cc-modal-window__background"></div>
        <div class="cc-modal-window__foreground" role="dialog" aria-modal="true">
          <div class="cc-modal-window__content-container">
            <button class="cc-modal-window__close" aria-label="${tve.values.button_close_label}">${tve.values.button_close_icon}</button>
            <div class="cc-modal-window__content">${tve.values.content}</div>
          </div>
        </div>
      </div>
    `;

      const modalElementFragment = document.createRange().createContextualFragment(html);
      document.body.appendChild(modalElementFragment);

      document.body.classList.add('cc-modal-visible');
      this.modalElement = document.body.lastElementChild;

      this.modalElement.querySelector('.cc-modal-window__background').addEventListener('click', this.close.bind(this));
      this.modalElement.querySelector('.cc-modal-window__close').addEventListener('click', this.close.bind(this));

      setTimeout(() => {
        this.modalElement.classList.remove('cc-modal-window--pre-reveal');
        this.modalElement.querySelector('.cc-modal-window__close').focus();
      }, 10);
    }

    close() {
      this.modalElement.classList.add('cc-modal-window--closing');
      if (!document.querySelector('.cc-modal-window:not(.cc-modal-window--closing)')) {
        document.body.classList.remove('cc-modal-visible');
      }

      if (this.opener) {
        setTimeout(() => {
          this.opener.focus();
        }, 10);
      }

      // give transitions 5s to do their thing before we tidy up (note: this.modalElement may be reassigned during this timeout)
      setTimeout(function () {
        this.remove();
      }.bind(this.modalElement), 5000);
    }
  }

  class Modal extends ccComponent {
    constructor() {let name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'modal';let cssSelector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : `.cc-${name}`;
      super(name, cssSelector);
    }

    init(container) {
      super.init(container);
      this.registerInstance(container, new ModalInstance(container));
    }

    destroy(container) {
      this.destroyInstance(container);
      super.destroy(container);
    }
  }

  new Modal();
  class ccPopup {
    constructor($container, namespace) {
      this.$container = $container;
      this.namespace = namespace;
      this.cssClasses = {
        visible: 'cc-popup--visible',
        bodyNoScroll: 'cc-popup-no-scroll',
        bodyNoScrollPadRight: 'cc-popup-no-scroll-pad-right'
      };
    }

    /**
     * Open popup on timer / local storage - move focus to input ensure you can tab to submit and close
     * Add the cc-popup--visible class
     * Update aria to visible
     */
    open(callback) {
      // Prevent the body from scrolling
      if (this.$container.data('freeze-scroll')) {
        clearTimeout(theme.ccPopupRemoveScrollFreezeTimeoutId);
        $('body').addClass(this.cssClasses.bodyNoScroll);

        // Add any padding necessary to the body to compensate for the scrollbar that just disappeared
        var scrollDiv = document.createElement('div');
        scrollDiv.className = 'popup-scrollbar-measure';
        document.body.appendChild(scrollDiv);
        var scrollbarWidth = scrollDiv.getBoundingClientRect().width - scrollDiv.clientWidth;
        document.body.removeChild(scrollDiv);
        if (scrollbarWidth > 0) {
          $('body').css('padding-right', scrollbarWidth + 'px').addClass(this.cssClasses.bodyNoScrollPadRight);
        }
      }

      // Add reveal class
      this.$container.addClass(this.cssClasses.visible);

      // Track previously focused element
      this.previouslyActiveElement = document.activeElement;

      // Focus on the close button after the animation in has completed
      setTimeout(() => {
        this.$container.find('.cc-popup-close')[0].focus();
      }, 500);

      // Pressing escape closes the modal
      $(window).on('keydown' + this.namespace, (event) => {
        if (event.keyCode === 27) {
          this.close();
        }
      });

      if (callback) {
        callback();
      }
    }

    /**
     * Close popup on click of close button or background - where does the focus go back to?
     * Remove the cc-popup--visible class
     */
    close(callback) {
      // Remove reveal class
      this.$container.removeClass(this.cssClasses.visible);

      // Revert focus
      if (this.previouslyActiveElement) {
        $(this.previouslyActiveElement).focus();
      }

      // Destroy the escape event listener
      $(window).off('keydown' + this.namespace);

      // Allow the body to scroll and remove any scrollbar-compensating padding, if no other scroll-freeze popups are visible
      const $visibleFreezePopups = $('.' + this.cssClasses.visible).filter(() => {return this.$container.data('freeze-scroll');});
      if ($visibleFreezePopups.length === 0) {
        let transitionDuration = 500;

        const $innerModal = this.$container.find('.cc-popup-modal');
        if ($innerModal.length) {
          transitionDuration = parseFloat(getComputedStyle($innerModal[0])['transitionDuration']);
          if (transitionDuration && transitionDuration > 0) {
            transitionDuration *= 1000;
          }
        }

        theme.ccPopupRemoveScrollFreezeTimeoutId = setTimeout(() => {
          $('body').removeClass(this.cssClasses.bodyNoScroll).removeClass(this.cssClasses.bodyNoScrollPadRight).css('padding-right', '0');
        }, transitionDuration);
      }

      if (callback) {
        callback();
      }
    }
  };
  class PriceRangeInstance {
    constructor(container) {
      this.container = container;
      this.selectors = {
        inputMin: '.cc-price-range__input--min',
        inputMax: '.cc-price-range__input--max',
        control: '.cc-price-range__control',
        controlMin: '.cc-price-range__control--min',
        controlMax: '.cc-price-range__control--max',
        bar: '.cc-price-range__bar',
        activeBar: '.cc-price-range__bar-active'
      };
      this.controls = {
        min: {
          barControl: container.querySelector(this.selectors.controlMin),
          input: container.querySelector(this.selectors.inputMin)
        },
        max: {
          barControl: container.querySelector(this.selectors.controlMax),
          input: container.querySelector(this.selectors.inputMax)
        }
      };
      this.controls.min.value = parseInt(this.controls.min.input.value === '' ? this.controls.min.input.placeholder : this.controls.min.input.value);
      this.controls.max.value = parseInt(this.controls.max.input.value === '' ? this.controls.max.input.placeholder : this.controls.max.input.value);
      this.valueMin = this.controls.min.input.min;
      this.valueMax = this.controls.min.input.max;
      this.valueRange = this.valueMax - this.valueMin;

      [this.controls.min, this.controls.max].forEach((item) => {
        item.barControl.setAttribute('aria-valuemin', this.valueMin);
        item.barControl.setAttribute('aria-valuemax', this.valueMax);
        item.barControl.setAttribute('tabindex', 0);
      });
      this.controls.min.barControl.setAttribute('aria-valuenow', this.controls.min.value);
      this.controls.max.barControl.setAttribute('aria-valuenow', this.controls.max.value);

      this.bar = container.querySelector(this.selectors.bar);
      this.activeBar = container.querySelector(this.selectors.activeBar);
      this.inDrag = false;
      this.rtl = document.querySelector('html[dir=rtl]');

      this.bindEvents();
      this.render();
    }

    getPxToValueRatio() {
      const r = this.bar.clientWidth / (this.valueMax - this.valueMin);
      if (this.rtl) {
        return -r;
      } else {
        return r;
      }
    }

    getPcToValueRatio() {
      return 100.0 / (this.valueMax - this.valueMin);
    }

    setActiveControlValue(value) {
      // only accept valid numbers
      if (isNaN(parseInt(value))) return;

      // clamp & default
      if (this.activeControl === this.controls.min) {
        if (value === '') {
          value = this.valueMin;
        }
        value = Math.max(this.valueMin, value);
        value = Math.min(value, this.controls.max.value);
      } else {
        if (value === '') {
          value = this.valueMax;
        }
        value = Math.min(this.valueMax, value);
        value = Math.max(value, this.controls.min.value);
      }

      // round
      this.activeControl.value = Math.round(value);

      // update input
      if (this.activeControl.input.value != this.activeControl.value) {
        if (this.activeControl.value == this.activeControl.input.placeholder) {
          this.activeControl.input.value = '';
        } else {
          this.activeControl.input.value = this.activeControl.value;
        }
        this.activeControl.input.dispatchEvent(new CustomEvent('change', { bubbles: true, cancelable: false, detail: { sender: 'theme:component:price_range' } }));
      }

      // a11y
      this.activeControl.barControl.setAttribute('aria-valuenow', this.activeControl.value);
    }

    render() {
      this.drawControl(this.controls.min);
      this.drawControl(this.controls.max);
      this.drawActiveBar();
    }

    drawControl(control) {
      const x = (control.value - this.valueMin) * this.getPcToValueRatio() + '%';
      if (this.rtl) {
        control.barControl.style.right = x;
      } else {
        control.barControl.style.left = x;
      }
    }

    drawActiveBar() {
      const s = (this.controls.min.value - this.valueMin) * this.getPcToValueRatio() + '%',
        e = (this.valueMax - this.controls.max.value) * this.getPcToValueRatio() + '%';
      if (this.rtl) {
        this.activeBar.style.left = e;
        this.activeBar.style.right = s;
      } else {
        this.activeBar.style.left = s;
        this.activeBar.style.right = e;
      }
    }

    handleControlTouchStart(e) {
      e.preventDefault();
      this.startDrag(e.target, e.touches[0].clientX);
      this.boundControlTouchMoveEvent = this.handleControlTouchMove.bind(this);
      this.boundControlTouchEndEvent = this.handleControlTouchEnd.bind(this);
      window.addEventListener('touchmove', this.boundControlTouchMoveEvent);
      window.addEventListener('touchend', this.boundControlTouchEndEvent);
    }

    handleControlTouchMove(e) {
      this.moveDrag(e.touches[0].clientX);
    }

    handleControlTouchEnd(e) {
      e.preventDefault();
      window.removeEventListener('touchmove', this.boundControlTouchMoveEvent);
      window.removeEventListener('touchend', this.boundControlTouchEndEvent);
      this.stopDrag();
    }

    handleControlMouseDown(e) {
      e.preventDefault();
      this.startDrag(e.target, e.clientX);
      this.boundControlMouseMoveEvent = this.handleControlMouseMove.bind(this);
      this.boundControlMouseUpEvent = this.handleControlMouseUp.bind(this);
      window.addEventListener('mousemove', this.boundControlMouseMoveEvent);
      window.addEventListener('mouseup', this.boundControlMouseUpEvent);
    }

    handleControlMouseMove(e) {
      this.moveDrag(e.clientX);
    }

    handleControlMouseUp(e) {
      e.preventDefault();
      window.removeEventListener('mousemove', this.boundControlMouseMoveEvent);
      window.removeEventListener('mouseup', this.boundControlMouseUpEvent);
      this.stopDrag();
    }

    startDrag(target, startX) {
      if (this.controls.min.barControl === target) {
        this.activeControl = this.controls.min;
      } else {
        this.activeControl = this.controls.max;
      }
      this.dragStartX = startX;
      this.dragStartValue = this.activeControl.value;
      this.inDrag = true;
    }

    moveDrag(moveX) {
      if (this.inDrag) {
        let value = this.dragStartValue + (moveX - this.dragStartX) / this.getPxToValueRatio();
        this.setActiveControlValue(value);
        this.render();
      }
    }

    stopDrag() {
      this.inDrag = false;
    }

    handleControlKeyDown(e) {
      if (e.key === 'ArrowRight') {
        this.incrementControlFromKeypress(e.target, 10.0);
      } else if (e.key === 'ArrowLeft') {
        this.incrementControlFromKeypress(e.target, -10.0);
      }
    }

    incrementControlFromKeypress(control, pxAmount) {
      if (this.controls.min.barControl === control) {
        this.activeControl = this.controls.min;
      } else {
        this.activeControl = this.controls.max;
      }
      this.setActiveControlValue(this.activeControl.value + pxAmount / this.getPxToValueRatio());
      this.render();
    }

    handleInputChange(e) {
      // strip out non numeric values
      e.target.value = e.target.value.replace(/\D/g, '');

      if (!e.detail || e.detail.sender != 'theme:component:price_range') {
        if (this.controls.min.input === e.target) {
          this.activeControl = this.controls.min;
        } else {
          this.activeControl = this.controls.max;
        }
        this.setActiveControlValue(e.target.value);
        this.render();
      }
    }

    handleInputKeyup(e) {
      // enforce numeric chars in the input
      setTimeout(function () {
        this.value = this.value.replace(/\D/g, '');
      }.bind(e.target), 10);
    }

    bindEvents() {
      [this.controls.min, this.controls.max].forEach((item) => {
        item.barControl.addEventListener('touchstart', this.handleControlTouchStart.bind(this));
        item.barControl.addEventListener('mousedown', this.handleControlMouseDown.bind(this));
        item.barControl.addEventListener('keydown', this.handleControlKeyDown.bind(this));
        item.input.addEventListener('change', this.handleInputChange.bind(this));
        item.input.addEventListener('keyup', this.handleInputKeyup.bind(this));
      });
    }

    destroy() {
    }
  }

  class PriceRange extends ccComponent {
    constructor() {let name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'price-range';let cssSelector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : `.cc-${name}`;
      super(name, cssSelector);
    }

    init(container) {
      super.init(container);
      this.registerInstance(container, new PriceRangeInstance(container));
    }

    destroy(container) {
      this.destroyInstance(container);
      super.destroy(container);
    }
  }

  new PriceRange();


  // Manage videos
  theme.VideoManager = new function () {
    let _ = this;

    _.videos = {
      incrementor: 0,
      videoData: {}
    };

    _._loadYoutubeVideos = function (container) {
      $('.video-container[data-video-type="youtube"]:not(.video--init)', container).each(function () {
        $(this).addClass('video--init');
        _.videos.incrementor++;
        let containerId = 'theme-yt-video-' + _.videos.incrementor;
        $(this).data('video-container-id', containerId);
        let autoplay = $(this).data('video-autoplay');
        let loop = $(this).data('video-loop');
        let videoId = $(this).data('video-id');
        let isBackgroundVideo = $(this).hasClass('video-container--background');

        let ytURLSearchParams = new URLSearchParams('iv_load_policy=3&modestbranding=1&rel=0&showinfo=0&enablejsapi=1&playslinline=1');
        ytURLSearchParams.append('origin', location.origin);
        ytURLSearchParams.append('playlist', videoId);
        ytURLSearchParams.append('loop', loop ? 1 : 0);
        ytURLSearchParams.append('autoplay', 0);
        ytURLSearchParams.append('controls', isBackgroundVideo ? 0 : 1);
        let widgetid = _.videos.incrementor;
        ytURLSearchParams.append('widgetid', widgetid);

        let src = 'https://www.youtube.com/embed/' + videoId + '?' + ytURLSearchParams.toString();

        let $videoElement = $('<iframe class="video-container__video-element" frameborder="0" allowfullscreen="1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">').attr({
          id: containerId,
          width: 640,
          height: 360,
          tabindex: isBackgroundVideo ? '-1' : null
        }).appendTo($('.video-container__video', this));

        _.videos.videoData[containerId] = {
          type: 'yt',
          id: containerId,
          container: this,
          mute: () => $videoElement[0].contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*'),
          play: () => $videoElement[0].contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*'),
          pause: () => $videoElement[0].contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*'),
          stop: () => $videoElement[0].contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*'),
          seekTo: (to) => $videoElement[0].contentWindow.postMessage(`{"event":"command","func":"seekTo","args":[${to},true]}`, '*'),
          videoElement: $videoElement[0],
          isBackgroundVideo: isBackgroundVideo,
          establishedYTComms: false
        };

        if (autoplay) {
          $videoElement.on('load', () => setTimeout(() => {
            // set up imitation JS API and watch for play event
            window.addEventListener('message', (message) => {
              if (message.origin === 'https://www.youtube.com' && message.data && typeof message.data === 'string') {
                let data = JSON.parse(message.data);

                if (data.event === 'initialDelivery' && data.info && data.info.duration) {
                  _.videos.videoData[containerId].duration = data.info.duration;
                }

                if (data.event === 'infoDelivery' && data.channel === 'widget' && data.id === widgetid) {
                  _.videos.videoData[containerId].establishedYTComms = true;
                  // playing - add class
                  if (data.info && data.info.playerState === 1) {
                    $(this).addClass('video-container--playing');
                  }

                  // loop if in final second
                  if (loop && data.info && data.info.currentTime > _.videos.videoData[containerId].duration - 1) {
                    _.videos.videoData[containerId].seekTo(0);
                  }
                }
              }
            });
            $videoElement[0].contentWindow.postMessage(`{"event":"listening","id":${widgetid},"channel":"widget"}`, '*');

            // mute and play
            _.videos.videoData[containerId].mute();
            _.videos.videoData[containerId].play();

            // if no message received in 2s, assume comms failure and that video is playing
            setTimeout(() => {
              if (!_.videos.videoData[containerId].establishedYTComms) {
                $(this).addClass('video-container--playing');
              }
            }, 2000);
          }, 100));
        }

        if (isBackgroundVideo) {
          $videoElement.attr('tabindex', '-1');
          _._initBackgroundVideo(_.videos.videoData[containerId]);

          // hack only needed for YT BG videos
          _.addYTPageshowListenerHack();
        }

        $videoElement.attr('src', src);

        fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent($(this).data('video-url'))).
        then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        }).
        then((response) => {
          if (response.width && response.height) {
            $videoElement.attr({ width: response.width, height: response.height });
            if (_.videos.videoData[containerId].assessBackgroundVideo) {
              _.videos.videoData[containerId].assessBackgroundVideo();
            }
          }
        });
      });
    };

    _._loadVimeoVideos = function (container) {
      $('.video-container[data-video-type="vimeo"]:not(.video--init)', container).each(function () {
        $(this).addClass('video--init');
        _.videos.incrementor++;
        var containerId = 'theme-vi-video-' + _.videos.incrementor;
        $(this).data('video-container-id', containerId);
        var autoplay = $(this).data('video-autoplay');
        let loop = $(this).data('video-loop');
        let videoId = $(this).data('video-id');
        let isBackgroundVideo = $(this).hasClass('video-container--background');

        let viURLSearchParams = new URLSearchParams();
        if (autoplay) {
          viURLSearchParams.append('muted', 1);
        }
        if (loop) {
          viURLSearchParams.append('loop', 1);
        }
        if (isBackgroundVideo) {
          viURLSearchParams.append('controls', 0);
        }

        let src = 'https://player.vimeo.com/video/' + videoId + '?' + viURLSearchParams.toString();

        let $videoElement = $('<iframe class="video-container__video-element" frameborder="0" allowfullscreen="1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">').attr({
          id: containerId,
          width: 640,
          height: 360,
          tabindex: isBackgroundVideo ? '-1' : null
        }).appendTo($('.video-container__video', this));

        _.videos.videoData[containerId] = {
          type: 'vimeo',
          id: containerId,
          container: this,
          play: () => $videoElement[0].contentWindow.postMessage('{"method":"play"}', '*'),
          pause: () => $videoElement[0].contentWindow.postMessage('{"method":"pause"}', '*'),
          videoElement: $videoElement[0],
          isBackgroundVideo: isBackgroundVideo,
          establishedVimeoComms: false
        };

        if (autoplay) {
          $videoElement.on('load', () => setTimeout(() => {
            // set up imitation JS API and watch for play event
            window.addEventListener('message', (message) => {
              if (message.origin !== 'https://player.vimeo.com') return;
              if (message.source !== $videoElement[0].contentWindow) return;
              if (!message.data) return;

              let data = message.data;
              if (typeof data === 'string') {
                data = JSON.parse(data);
              }

              if (data.method === 'ping' || data.event === 'playing') {
                _.videos.videoData[containerId].establishedVimeoComms = true;
              }

              if (data.event === 'playing') {
                $(this).addClass('video-container--playing');
              }
            });
            $videoElement[0].contentWindow.postMessage({ method: 'addEventListener', value: 'playing' }, '*');
            $videoElement[0].contentWindow.postMessage({ method: 'appendVideoMetadata', value: location.origin }, '*');
            $videoElement[0].contentWindow.postMessage({ method: 'ping' }, '*');

            // play video
            _.videos.videoData[containerId].play();

            // if no message received in 2s, assume comms failure and that video is playing
            setTimeout(() => {
              if (!_.videos.videoData[containerId].establishedVimeoComms) {
                $(this).addClass('video-container--playing');
              }
            }, 2000);
          }, 100));
        }

        if (isBackgroundVideo) {
          $videoElement.attr('tabindex', '-1');
          _._initBackgroundVideo(_.videos.videoData[containerId]);
        }

        $videoElement.attr('src', src);

        fetch('https://vimeo.com/api/oembed.json?url=' + encodeURIComponent($(this).data('video-url'))).
        then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        }).
        then((response) => {
          if (response.width && response.height) {
            $videoElement.attr({ width: response.width, height: response.height });
            if (_.videos.videoData[containerId].assessBackgroundVideo) {
              _.videos.videoData[containerId].assessBackgroundVideo();
            }
          }
        });
      });
    };

    _._loadMp4Videos = function (container) {
      $('.video-container[data-video-type="mp4"]:not(.video--init)', container).addClass('video--init').each(function () {
        _.videos.incrementor++;
        var containerId = 'theme-mp-video-' + _.videos.incrementor;
        var $container = $(this);
        $(this).data('video-container-id', containerId);
        var $videoElement = $('<div class="video-container__video-element">').attr('id', containerId).
        appendTo($('.video-container__video', this));
        var autoplay = $(this).data('video-autoplay');
        let isBackgroundVideo = $(this).hasClass('video-container--background');

        var $video = $('<video playsinline>');
        if ($(this).data('video-loop')) {
          $video.attr('loop', 'loop');
        }
        $video.on('click mouseenter', () => $video.attr('controls', 'controls'));
        if (autoplay) {
          $video.attr({ autoplay: 'autoplay', muted: 'muted' });
          $video[0].muted = true; // required by Chrome - ignores attribute
          $video.one('loadeddata', function () {
            this.play();
            $container.addClass('video-container--playing');
          });
        }

        if ($(this).data('video-url')) {
          $video.attr('src', $(this).data('video-url'));
        }
        if ($(this).data('video-sources')) {
          const sources = $(this).data('video-sources').split('|');
          for (let i = 0; i < sources.length; i++) {
            const [format, mimeType, url] = sources[i].split(' ');
            // only use HLS if not looping
            if (format === 'm3u8' && $(this).data('video-loop')) {
              continue;
            }
            $('<source>').attr({ src: url, type: mimeType }).appendTo($video);
          }
        }
        $video.appendTo($videoElement);

        const videoData = _.videos.videoData[containerId] = {
          type: 'mp4',
          element: $video[0],
          play: () => $video[0].play(),
          pause: () => $video[0].pause(),
          isBackgroundVideo: isBackgroundVideo
        };


        if (isBackgroundVideo) {
          $video.attr('tabindex', '-1');
          if (autoplay) {
            // Support playing background videos in low power mode
            container.addEventListener('click', videoData.play, { once: true });
          }
        }
      });
    };

    // background video placement for iframes
    _._initBackgroundVideo = function (videoData) {
      if (videoData.container.classList.contains('video-container--background')) {
        videoData.assessBackgroundVideo = function () {
          var cw = this.offsetWidth,
            ch = this.offsetHeight,
            cr = cw / ch,
            frame = this.querySelector('iframe'),
            vr = parseFloat(frame.width) / parseFloat(frame.height),
            pan = this.querySelector('.video-container__video'),
            vCrop = 75; // pushes video outside container to hide controls
          if (cr > vr) {
            var vh = cw / vr + vCrop * 2;
            pan.style.marginTop = (ch - vh) / 2 - vCrop + 'px';
            pan.style.marginInlineStart = '';
            pan.style.height = vh + vCrop * 2 + 'px';
            pan.style.width = '';
          } else {
            var ph = ch + vCrop * 2;
            var pw = ph * vr;
            pan.style.marginTop = -vCrop + 'px';
            pan.style.marginInlineStart = (cw - pw) / 2 + 'px';
            pan.style.height = ph + 'px';
            pan.style.width = pw + 'px';
          }
        }.bind(videoData.container);
        videoData.assessBackgroundVideo();
        $(window).on('debouncedresize.' + videoData.id, videoData.assessBackgroundVideo);

        // Support playing background videos in low power mode
        videoData.container.addEventListener('click', videoData.play, { once: true });
      }
    };

    _._unloadVideos = function (container) {
      for (let dataKey in _.videos.videoData) {
        let data = _.videos.videoData[dataKey];
        if ($(container).find(data.container).length) {
          delete _.videos.videoData[dataKey];
          return;
        }
      }
    };

    // Compatibility with Sections
    this.onSectionLoad = function (container) {
      // url only - infer type
      $('.video-container[data-video-url]:not([data-video-type])').each(function () {
        var url = $(this).data('video-url');

        if (url.indexOf('.mp4') > -1) {
          $(this).attr('data-video-type', 'mp4');
        }

        if (url.indexOf('vimeo.com') > -1) {
          $(this).attr('data-video-type', 'vimeo');
          $(this).attr('data-video-id', url.split('?')[0].split('/').pop());
        }

        if (url.indexOf('youtu.be') > -1 || url.indexOf('youtube.com') > -1) {
          $(this).attr('data-video-type', 'youtube');
          if (url.indexOf('v=') > -1) {
            $(this).attr('data-video-id', url.split('v=').pop().split('&')[0]);
          } else {
            $(this).attr('data-video-id', url.split('?')[0].split('/').pop());
          }
        }
      });

      _._loadYoutubeVideos(container);
      _._loadVimeoVideos(container);
      _._loadMp4Videos(container);

      // play button
      $('.video-container__play', container).on('click', function (evt) {
        evt.preventDefault();
        var $container = $(this).closest('.video-container');
        // reveal
        $container.addClass('video-container--playing');

        // broadcast a play event on the section container
        $container.trigger("cc:video:play");

        // play
        var id = $container.data('video-container-id');
        _.videos.videoData[id].play();
      });

      // modal close button
      $('.video-container__stop', container).on('click', function (evt) {
        evt.preventDefault();
        var $container = $(this).closest('.video-container');
        // hide
        $container.removeClass('video-container--playing');

        // broadcast a stop event on the section container
        $container.trigger("cc:video:stop");

        // stop
        var id = $container.data('video-container-id');
        _.videos.videoData[id].pause();
      });
    };

    this.onSectionUnload = function (container) {
      $('.video-container__play, .video-container__stop', container).off('click');
      $(window).off('.' + $('.video-container').data('video-container-id'));
      $(window).off('debouncedresize.video-manager-resize');
      _._unloadVideos(container);
      $(container).trigger("cc:video:stop");
    };

    _.addYTPageshowListenerHack = function () {
      if (!_.pageshowListenerAdded) {
        _.pageshowListenerAdded = true;
        window.addEventListener('pageshow', (event) => {
          if (event.persisted) {
            // A playing YT video shows a black screen when loaded from bfcache on iOS
            Object.keys(_.videos.videoData).
            filter((key) => _.videos.videoData[key].type === 'yt' && _.videos.videoData[key].isBackgroundVideo).
            forEach((key) => {
              _.videos.videoData[key].stop();
              _.videos.videoData[key].play();
            });
          }
        });
      }
    };
  }();

  // Register the section
  cc.sections.push({
    name: 'video',
    section: theme.VideoManager
  });
  theme.MapSection = new function () {
    var _ = this;
    _.config = {
      zoom: 14,
      styles: {
        default: [],
        silver: [{ "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] }, { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] }, { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] }, { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] }, { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] }, { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] }, { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] }, { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }, { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] }, { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] }, { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }],
        retro: [{ "elementType": "geometry", "stylers": [{ "color": "#ebe3cd" }] }, { "elementType": "labels.text.fill", "stylers": [{ "color": "#523735" }] }, { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f1e6" }] }, { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#c9b2a6" }] }, { "featureType": "administrative.land_parcel", "elementType": "geometry.stroke", "stylers": [{ "color": "#dcd2be" }] }, { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#ae9e90" }] }, { "featureType": "landscape.natural", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] }, { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#93817c" }] }, { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#a5b076" }] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#447530" }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#f5f1e6" }] }, { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#fdfcf8" }] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#f8c967" }] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#e9bc62" }] }, { "featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{ "color": "#e98d58" }] }, { "featureType": "road.highway.controlled_access", "elementType": "geometry.stroke", "stylers": [{ "color": "#db8555" }] }, { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#806b63" }] }, { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] }, { "featureType": "transit.line", "elementType": "labels.text.fill", "stylers": [{ "color": "#8f7d77" }] }, { "featureType": "transit.line", "elementType": "labels.text.stroke", "stylers": [{ "color": "#ebe3cd" }] }, { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] }, { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#b9d3c2" }] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#92998d" }] }],
        dark: [{ "elementType": "geometry", "stylers": [{ "color": "#212121" }] }, { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] }, { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] }, { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] }, { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }, { "featureType": "administrative.land_parcel", "stylers": [{ "visibility": "off" }] }, { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#181818" }] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] }, { "featureType": "poi.park", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1b1b1b" }] }, { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] }, { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] }, { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#373737" }] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] }, { "featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{ "color": "#4e4e4e" }] }, { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] }, { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] }, { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#3d3d3d" }] }],
        night: [{ "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] }, { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] }, { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] }, { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] }, { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] }, { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] }, { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] }, { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#2f3948" }] }, { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] }, { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] }, { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }],
        aubergine: [{ "elementType": "geometry", "stylers": [{ "color": "#1d2c4d" }] }, { "elementType": "labels.text.fill", "stylers": [{ "color": "#8ec3b9" }] }, { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1a3646" }] }, { "featureType": "administrative.country", "elementType": "geometry.stroke", "stylers": [{ "color": "#4b6878" }] }, { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#64779e" }] }, { "featureType": "administrative.province", "elementType": "geometry.stroke", "stylers": [{ "color": "#4b6878" }] }, { "featureType": "landscape.man_made", "elementType": "geometry.stroke", "stylers": [{ "color": "#334e87" }] }, { "featureType": "landscape.natural", "elementType": "geometry", "stylers": [{ "color": "#023e58" }] }, { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#283d6a" }] }, { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#6f9ba5" }] }, { "featureType": "poi", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1d2c4d" }] }, { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#023e58" }] }, { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#3C7680" }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#304a7d" }] }, { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#98a5be" }] }, { "featureType": "road", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1d2c4d" }] }, { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#2c6675" }] }, { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#255763" }] }, { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#b0d5ce" }] }, { "featureType": "road.highway", "elementType": "labels.text.stroke", "stylers": [{ "color": "#023e58" }] }, { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#98a5be" }] }, { "featureType": "transit", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1d2c4d" }] }, { "featureType": "transit.line", "elementType": "geometry.fill", "stylers": [{ "color": "#283d6a" }] }, { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#3a4762" }] }, { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0e1626" }] }, { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#4e6d70" }] }]
      }
    };
    _.apiStatus = null;

    this.geolocate = function ($map) {
      var deferred = $.Deferred();
      var geocoder = new google.maps.Geocoder();
      var address = $map.data('address-setting');

      geocoder.geocode({ address: address }, function (results, status) {
        if (status !== google.maps.GeocoderStatus.OK) {
          deferred.reject(status);
        }

        deferred.resolve(results);
      });

      return deferred;
    };

    this.createMap = function (container) {
      var $map = $('.map-section__map-container', container);

      return _.geolocate($map).
      then(
        function (results) {
          var mapOptions = {
            zoom: _.config.zoom,
            styles: _.config.styles[$(container).data('map-style')],
            center: results[0].geometry.location,
            scrollwheel: false,
            disableDoubleClickZoom: true,
            disableDefaultUI: true,
            zoomControl: !$map.data('hide-zoom')
          };

          _.map = new google.maps.Map($map[0], mapOptions);
          _.center = _.map.getCenter();

          var marker = new google.maps.Marker({
            map: _.map,
            position: _.center,
            clickable: false
          });

          google.maps.event.addDomListener(window, 'resize', function () {
            google.maps.event.trigger(_.map, 'resize');
            _.map.setCenter(_.center);
          });
        }.bind(this)
      ).
      fail(function () {
        var errorMessage;

        switch (status) {
          case 'ZERO_RESULTS':
            errorMessage = theme.strings.addressNoResults;
            break;
          case 'OVER_QUERY_LIMIT':
            errorMessage = theme.strings.addressQueryLimit;
            break;
          default:
            errorMessage = theme.strings.addressError;
            break;
        }

        // Only show error in the theme editor
        if (Shopify.designMode) {
          var $mapContainer = $map.parents('.map-section');

          $mapContainer.addClass('page-width map-section--load-error');
          $mapContainer.
          find('.map-section__wrapper').
          html(
            '<div class="errors text-center">' + errorMessage + '</div>'
          );
        }
      });
    };

    this.onSectionLoad = function (target) {
      var $container = $(target);
      // Global function called by Google on auth errors
      window.gm_authFailure = function () {
        if (!Shopify.designMode) return;

        $container.addClass('page-width map-section--load-error');
        $container.
        find('.map-section__wrapper').
        html(
          '<div class="errors text-center">' + theme.strings.authError + '</div>'
        );
      };

      // create maps
      var key = $container.data('api-key');

      if (typeof key !== 'string' || key === '') {
        return;
      }

      // load map
      theme.loadScriptOnce('https://maps.googleapis.com/maps/api/js?key=' + key, function () {
        _.createMap($container);
      });
    };

    this.onSectionUnload = function (target) {
      if (typeof window.google !== 'undefined' && typeof google.maps !== 'undefined') {
        google.maps.event.clearListeners(_.map, 'resize');
      }
    };
  }();

  // Register the section
  cc.sections.push({
    name: 'map',
    section: theme.MapSection
  });
  theme.FaqHeader = new function () {
    this.onSectionLoad = function (container) {
      this.namespace = theme.namespaceFromSection(container);
      this.container = container;

      this.classNames = {
        questionContainerInactive: 'faq-search-item-inactive',
        sectionWithIndexStatus: 'section-faq-header--with-index'
      };

      this.searchInput = this.container.querySelector('.faq-search__input');
      if (this.searchInput) {
        this.registerEventListener(this.searchInput, 'change', this.functions.performSearch.bind(this));
        this.registerEventListener(this.searchInput, 'keyup', this.functions.performSearch.bind(this));
        this.registerEventListener(this.searchInput, 'paste', this.functions.performSearch.bind(this));
      }

      this.functions.debouncedBuildIndex = theme.debounce(this.functions.buildIndex.bind(this), 50);
      this.registerEventListener(document, 'theme:faq-header-update', this.functions.debouncedBuildIndex);
      this.functions.debouncedBuildIndex();

      if (this.container.querySelector('.faq-index')) {
        this.registerEventListener(this.container, 'click', this.functions.handleIndexClick.bind(this));
        this.container.closest('.section-faq-header').classList.add(this.classNames.sectionWithIndexStatus);
        this.functions.resizeIndex.call(this);
        this.registerEventListener(window, 'resize', theme.debounce(this.functions.resizeIndex.bind(this), 250));
      }
    };

    this.onSectionReorder = function (container) {
      this.functions.debouncedBuildIndex();
    };

    this.functions = {
      buildIndex: function () {
        const faqHeaderSection = this.container.closest('.section-faq-header'),
          indexContainer = this.container.querySelector('.faq-index__item-container');

        if (indexContainer) {
          indexContainer.querySelectorAll('.faq-index-item').forEach((element) => {
            element.parentNode.removeChild(element);
          });
        }

        this.linkedCollapsibleTabs = [];
        this.linkedQuestionContainers = [];
        this.linkedContent = [];

        let currentElement = faqHeaderSection;
        while (currentElement.nextElementSibling && currentElement.nextElementSibling.classList.contains('section-collapsible-tabs')) {
          currentElement = currentElement.nextElementSibling;

          // build list of searchable content
          this.linkedCollapsibleTabs.push(currentElement);
          currentElement.querySelectorAll('.collapsible-tabs__tab').forEach((element) => this.linkedQuestionContainers.push(element));
          currentElement.querySelectorAll('.collapsible-tabs__content').forEach((element) => this.linkedContent.push(element));

          // build index UI
          if (indexContainer) {
            const currentElementHeading = currentElement.querySelector('.collapsible-tabs__heading');
            if (currentElementHeading) {
              const tve = theme.createTemplateVariableEncoder();
              tve.add('title_id', currentElementHeading.id, 'attribute');
              tve.add('title', currentElementHeading.innerHTML, 'raw');

              const html = `
              <div class="faq-index-item">
                <a class="faq-index-item__link" href="#${tve.values.title_id}">${tve.values.title}</a>
              </div>`;
              const htmlFragment = document.createRange().createContextualFragment(html);
              indexContainer.appendChild(htmlFragment);
            }
          }
        }

        if (indexContainer) {
          this.functions.resizeIndex.call(this);
        }
      },

      resizeIndex: function () {
        const stickyContainer = this.container.querySelector('.faq-index__sticky-container'),
          faqHeaderSection = this.container.closest('.section-faq-header');

        let currentElement = faqHeaderSection;
        while (currentElement.nextElementSibling && currentElement.nextElementSibling.classList.contains('section-collapsible-tabs')) {
          currentElement = currentElement.nextElementSibling;
        }

        const stickyContainerRect = stickyContainer.getBoundingClientRect(),
          currentElementRect = currentElement.getBoundingClientRect();

        stickyContainer.style.height = currentElementRect.bottom - stickyContainerRect.top + 'px';
      },

      performSearch: function () {
        // defer to avoid input lag
        setTimeout(() => {
          const splitValue = this.searchInput.value.split(' ');

          // sanitise terms
          let terms = [];
          splitValue.forEach((t) => {
            if (t.length > 0) {
              terms.push(t.toLowerCase());
            }
          });

          // search
          this.linkedQuestionContainers.forEach((element) => {
            if (terms.length) {
              let termFound = false;
              const matchContent = element.textContent.toLowerCase();
              terms.forEach((term) => {
                if (matchContent.indexOf(term) >= 0) {
                  termFound = true;
                }
              });
              if (termFound) {
                element.classList.remove(this.classNames.questionContainerInactive);
              } else {
                element.classList.add(this.classNames.questionContainerInactive);
              }
            } else {
              element.classList.remove(this.classNames.questionContainerInactive);
            }
          });

          // hide non-question content if doing a search
          this.linkedContent.forEach((element) => {
            if (terms.length) {
              element.classList.add(this.classNames.questionContainerInactive);
            } else {
              element.classList.remove(this.classNames.questionContainerInactive);
            }
          });
        }, 10);
      },

      handleIndexClick: function (evt) {
        if (evt.target.classList.contains('faq-index-item__link')) {
          evt.preventDefault();
          const id = evt.target.href.split('#')[1];
          const scrollTarget = document.getElementById(id);
          let scrollTargetY = scrollTarget.getBoundingClientRect().top + window.pageYOffset - 50;

          // sticky header offset
          const stickyHeight = getComputedStyle(document.documentElement).getPropertyValue('--theme-sticky-header-height');
          if (stickyHeight) {
            scrollTargetY -= parseInt(stickyHeight);
          }

          window.scrollTo({
            top: scrollTargetY,
            behavior: 'smooth'
          });
        }
      }
    };
  }();

  // Register section
  cc.sections.push({
    name: 'faq-header',
    section: theme.FaqHeader,
    deferredLoad: false
  });
  theme.CollapsibleTabs = new function () {
    this.onSectionLoad = function (container) {
      this.functions.notifyFaqHeaderOfChange();
    };

    this.onSectionReorder = function (container) {
      this.functions.notifyFaqHeaderOfChange();
    };

    this.onSectionUnload = function (container) {
      this.functions.notifyFaqHeaderOfChange();
    };

    this.functions = {
      notifyFaqHeaderOfChange: function () {
        document.dispatchEvent(
          new CustomEvent('theme:faq-header-update', { bubbles: true, cancelable: false })
        );
      }
    };
  }();

  // Register section
  cc.sections.push({
    name: 'collapsible-tabs',
    section: theme.CollapsibleTabs,
    deferredLoad: false
  });
  /**
   * StoreAvailability Section Script
   * ------------------------------------------------------------------------------
   *
   * @namespace StoreAvailability
   */

  theme.StoreAvailability = function (container) {
    const loadingClass = 'store-availability-loading';
    const initClass = 'store-availability-initialized';
    const storageKey = 'cc-location';

    this.onSectionLoad = function (container) {
      this.namespace = theme.namespaceFromSection(container);
      this.$container = $(container);
      this.productId = this.$container.data('store-availability-container');
      this.sectionUrl = this.$container.data('section-url');
      this.$modal;

      this.$container.addClass(initClass);
      this.transitionDurationMS = parseFloat(getComputedStyle(container).transitionDuration) * 1000;
      this.removeFixedHeightTimeout = -1;

      // Handle when a variant is selected
      $(window).on(`cc-variant-updated${this.namespace}${this.productId}`, (e, args) => {
        if (args.product.id === this.productId) {
          this.functions.updateContent.bind(this)(
            args.variant ? args.variant.id : null,
            args.product.title,
            this.$container.data('has-only-default-variant'),
            args.variant && typeof args.variant.available !== "undefined"
          );
        }
      });

      // Handle single variant products
      if (this.$container.data('single-variant-id')) {
        this.functions.updateContent.bind(this)(
          this.$container.data('single-variant-id'),
          this.$container.data('single-variant-product-title'),
          this.$container.data('has-only-default-variant'),
          this.$container.data('single-variant-product-available')
        );
      }
    };

    this.onSectionUnload = function () {
      $(window).off(`cc-variant-updated${this.namespace}${this.productId}`);
      this.$container.off('click');
      if (this.$modal) {
        this.$modal.off('click');
      }
    };

    this.functions = {
      // Returns the users location data (if allowed)
      getUserLocation: function () {
        return new Promise((resolve, reject) => {
          let storedCoords;

          if (sessionStorage[storageKey]) {
            storedCoords = JSON.parse(sessionStorage[storageKey]);
          }

          if (storedCoords) {
            resolve(storedCoords);

          } else {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                function (position) {
                  const coords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                  };

                  //Set the localization api
                  fetch('/localization.json', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(coords)
                  });

                  //Write to a session storage
                  sessionStorage[storageKey] = JSON.stringify(coords);

                  resolve(coords);
                }, function () {
                  resolve(false);
                }, {
                  maximumAge: 3600000, // 1 hour
                  timeout: 5000
                }
              );
            } else {
              resolve(false);
            }
          }
        });
      },

      // Requests the available stores and calls the callback
      getAvailableStores: function (variantId, cb) {
        return $.get(this.sectionUrl.replace('VARIANT_ID', variantId), cb);
      },

      // Haversine Distance
      // The haversine formula is an equation giving great-circle distances between
      // two points on a sphere from their longitudes and latitudes
      calculateDistance: function (coords1, coords2, unitSystem) {
        var dtor = Math.PI / 180;
        var radius = unitSystem === 'metric' ? 6378.14 : 3959;

        var rlat1 = coords1.latitude * dtor;
        var rlong1 = coords1.longitude * dtor;
        var rlat2 = coords2.latitude * dtor;
        var rlong2 = coords2.longitude * dtor;

        var dlon = rlong1 - rlong2;
        var dlat = rlat1 - rlat2;

        var a =
        Math.pow(Math.sin(dlat / 2), 2) +
        Math.cos(rlat1) * Math.cos(rlat2) * Math.pow(Math.sin(dlon / 2), 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return radius * c;
      },

      // Updates the existing modal pickup with locations with distances from the user
      updateLocationDistances: function (coords) {
        const unitSystem = this.$modal.find('[data-unit-system]').data('unit-system');
        const self = this;

        this.$modal.find('[data-distance="false"]').each(function () {
          const thisCoords = {
            latitude: parseFloat($(this).data('latitude')),
            longitude: parseFloat($(this).data('longitude'))
          };

          if (thisCoords.latitude && thisCoords.longitude) {
            const distance = self.functions.calculateDistance(
              coords, thisCoords, unitSystem).toFixed(1);

            $(this).html(distance);

            //Timeout to trigger animation
            setTimeout(() => {
              $(this).closest('.store-availability-list__location__distance').addClass('-in');
            }, 0);
          }

          $(this).attr('data-distance', 'true');
        });
      },

      // Requests the available stores and updates the page with info below Add to Basket, and append the modal to the page
      updateContent: function (variantId, productTitle, isSingleDefaultVariant, isVariantAvailable) {
        this.$container.off('click', '[data-store-availability-modal-open]');
        this.$container.off('click' + this.namespace, '.cc-popup-close, .cc-popup-background');
        $('.store-availabilities-modal').remove();

        if (!isVariantAvailable) {
          //If the variant is Unavailable (not the same as Out of Stock) - hide the store pickup completely
          this.$container.addClass(loadingClass);
          if (this.transitionDurationMS > 0) {
            this.$container.css('height', '0px');
          }
        } else {
          this.$container.addClass(loadingClass);
          if (this.transitionDurationMS > 0) {
            this.$container.css('height', this.$container.outerHeight() + 'px');
          }
        }

        if (isVariantAvailable) {
          this.functions.getAvailableStores.call(this, variantId, (response) => {
            if (response.trim().length > 0 && !response.includes('NO_PICKUP')) {
              this.$container.html(response);
              this.$container.html(this.$container.children().first().html()); // editor bug workaround

              this.$container.find('[data-store-availability-modal-product-title]').html(productTitle);

              if (isSingleDefaultVariant) {
                this.$container.find('.store-availabilities-modal__variant-title').remove();
              }

              this.$container.find('.cc-popup').appendTo('body');

              this.$modal = $('body').find('.store-availabilities-modal');
              const popup = new ccPopup(this.$modal, this.namespace);

              this.$container.on('click', '[data-store-availability-modal-open]', () => {
                popup.open();

                //When the modal is opened, try and get the users location
                this.functions.getUserLocation().then((coords) => {
                  if (coords && this.$modal.find('[data-distance="false"]').length) {
                    //Re-retrieve the available stores location modal contents
                    this.functions.getAvailableStores.call(this, variantId, (response) => {
                      this.$modal.find('.store-availabilities-list').html($(response).find('.store-availabilities-list').html());
                      this.functions.updateLocationDistances.bind(this)(coords);
                    });
                  }
                });

                return false;
              });

              this.$modal.on('click' + this.namespace, '.cc-popup-close, .cc-popup-background', () => {
                popup.close();
              });

              this.$container.removeClass(loadingClass);

              if (this.transitionDurationMS > 0) {
                let newHeight = this.$container.find('.store-availability-container').outerHeight();
                this.$container.css('height', newHeight > 0 ? newHeight + 'px' : '');
                clearTimeout(this.removeFixedHeightTimeout);
                this.removeFixedHeightTimeout = setTimeout(() => {
                  this.$container.css('height', '');
                }, this.transitionDurationMS);
              }
            }
          });
        }
      }
    };

    // Initialise the section when it's instantiated
    this.onSectionLoad(container);
  };

  // Register section
  cc.sections.push({
    name: 'store-availability',
    section: theme.StoreAvailability
  });
  /**
   * Popup Section Script
   * ------------------------------------------------------------------------------
   *
   * @namespace Popup
   */

  theme.Popup = new function () {
    /**
     * Popup section constructor. Runs on page load as well as Theme Editor
     * `section:load` events.
     * @param {string} container - selector for the section container DOM element
     */

    var dismissedStorageKey = 'cc-theme-popup-dismissed';

    this.onSectionLoad = function (container) {
      this.namespace = theme.namespaceFromSection(container);
      this.$container = $(container);
      this.popup = new ccPopup(this.$container, this.namespace);

      var dismissForDays = this.$container.data('dismiss-for-days'),
        delaySeconds = this.$container.data('delay-seconds'),
        showPopup = true,
        testMode = this.$container.data('test-mode'),
        lastDismissed = window.localStorage.getItem(dismissedStorageKey);

      // Should we show it during this page view?
      // Check when it was last dismissed
      if (lastDismissed) {
        var dismissedDaysAgo = (new Date().getTime() - lastDismissed) / (1000 * 60 * 60 * 24);
        if (dismissedDaysAgo < dismissForDays) {
          showPopup = false;
        }
      }

      // Check for error or success messages
      if (this.$container.find('.cc-popup-form__response').length) {
        showPopup = true;
        delaySeconds = 1;

        // If success, set as dismissed
        if (this.$container.find('.cc-popup-form__response--success').length) {
          this.functions.popupSetAsDismissed.call(this);
        }
      }

      // Prevent popup on Shopify robot challenge page
      if (document.querySelector('.shopify-challenge__container')) {
        showPopup = false;
      }

      // Show popup, if appropriate
      if (showPopup || testMode) {
        setTimeout(() => {
          this.popup.open();
        }, delaySeconds * 1000);
      }

      // Click on close button or modal background
      this.$container.on('click' + this.namespace, '.cc-popup-close, .cc-popup-background', () => {
        this.popup.close(() => {
          this.functions.popupSetAsDismissed.call(this);
        });
      });
    };

    this.onSectionSelect = function () {
      this.popup.open();
    };

    this.functions = {
      /**
       * Use localStorage to set as dismissed
       */
      popupSetAsDismissed: function () {
        window.localStorage.setItem(dismissedStorageKey, new Date().getTime());
      }
    };

    /**
     * Event callback for Theme Editor `section:unload` event
     */
    this.onSectionUnload = function () {
      this.$container.off(this.namespace);
    };
  }();

  // Register section
  cc.sections.push({
    name: 'newsletter-popup',
    section: theme.Popup
  });


  /*================ General =================*/
  theme.icons = {
    left: '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><title>' + theme.strings.icon_labels_left + '</title><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>',
    right: '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><title>' + theme.strings.icon_labels_right + '</title><path d="M0 0h24v24H0z" fill="none"/><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><title>' + theme.strings.icon_labels_close + '</title><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    chevronLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-left ltr-icon"><title>' + theme.strings.icon_labels_left + '</title><polyline points="15 18 9 12 15 6"></polyline></svg>',
    chevronRight: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right ltr-icon"><title>' + theme.strings.icon_labels_right + '</title><polyline points="9 18 15 12 9 6"></polyline></svg>',
    chevronDown: '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><title>' + theme.strings.icon_labels_down + '</title><path d="M7.41 7.84L12 12.42l4.59-4.58L18 9.25l-6 6-6-6z"/><path d="M0-.75h24v24H0z" fill="none"/></svg>',
    tick: '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    label: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-tag"><title>Label</title><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7" y2="7"></line></svg>'
  };

  // Get Shopify feature support
  try {
    theme.Shopify.features = JSON.parse(document.documentElement.querySelector('#shopify-features').textContent);
  } catch (e) {
    theme.Shopify.features = {};
  }

  theme.namespaceFromSection = function (container) {
    return ['.', $(container).data('section-type'), $(container).data('section-id')].join('');
  };

  theme.measureTextInsideElement = function (text, element) {
    theme.measureTextInsideElementCanvas = theme.measureTextInsideElementCanvas || document.createElement("canvas");
    const context = theme.measureTextInsideElementCanvas.getContext("2d");
    const font = getComputedStyle(element).font;
    context.font = font;
    return context.measureText(text);
  };

  // Use non-breaking space to attempt to avoid orphans
  theme.avoidUnecessaryOrphans = function (element) {
    if (theme.settings.avoid_orphans) {
      const innerTextSplit = element.innerText.split(' ');
      if (
      innerTextSplit.length >= 4 && // 4 or more words
      innerTextSplit[innerTextSplit.length - 1].length + innerTextSplit[innerTextSplit.length - 2].length < 20 // last two words aren't particularly long together
      ) {
        let html = element.innerHTML;
        if (html.indexOf('<span class="orphan-join">') < 0) {
          html = html.replace(/<[^>]*?>/g, (match) => {
            return match.replace(/ /g, 'ΩΩ');
          });
          let splitHtml = html.split(' '),
            lastItem = splitHtml.pop();

          // ensure length of text will be smaller than container, excluding HTML
          if (theme.measureTextInsideElement(splitHtml[splitHtml.length - 1].replace(/<[^>]*?>/g, '') + ' ' + lastItem.replace(/<[^>]*?>/g, ''), element).width > element.clientWidth) {
            return;
          }

          html = splitHtml.join(' ') + '<span class="orphan-join"> </span>' + lastItem;
          html = html.replace(/ΩΩ/g, ' ');
          element.innerHTML = html;
        }
      }
    }
  };

  theme.stickyHeaderHeight = function () {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--theme-sticky-header-height');
    if (v) {
      return parseInt(v) || 0;
    } else {
      return 0;
    }
  };

  theme.getScrollParent = function (node) {
    const isElement = node instanceof HTMLElement;
    const overflowY = isElement && window.getComputedStyle(node).overflowY;
    const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden';

    if (!node) {
      return null;
    } else if (isScrollable && node.scrollHeight > node.clientHeight) {
      return node;
    }

    return theme.getScrollParent(node.parentNode) || document.scrollingElement || window;
  };

  theme.scrollToRevealElement = function (el) {
    const scrollContainer = theme.getScrollParent(el);
    let scrollTop = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
    let scrollVisibleHeight = scrollContainer === window ? window.innerHeight : scrollContainer.clientHeight;
    let elTop = theme.getOffsetTopFromDoc(el),
      elBot = elTop + el.offsetHeight,
      inViewTop = scrollTop + theme.stickyHeaderHeight(),
      inViewBot = scrollTop + scrollVisibleHeight - 50;

    if (elTop < inViewTop || elBot > inViewBot) {
      scrollContainer.scrollTo({
        top: elTop - 100 - theme.stickyHeaderHeight(),
        left: 0,
        behavior: 'smooth'
      });
    }
  };

  theme.getEmptyOptionSelectors = function ($formContainer) {
    let emptySections = [];

    $formContainer.find('[data-selector-type="dropdown"].option-selector').each(function () {
      if (!$(this).find('[aria-selected="true"]').filter(function () {
        return this.dataset && this.dataset.value;
      }).length) {
        emptySections.push(this);
      }
    });

    $formContainer.find('[data-selector-type="listed"].option-selector').each(function () {
      if (!$(this).find('input:checked').length) {
        emptySections.push(this);
      }
    });

    return emptySections;
  };

  theme.validateProductForm = function ($formContainer) {
    $formContainer.find('.option-selector--empty').
    removeClass('option-selector--empty').
    find('.label__prefix').
    remove();

    if (!$formContainer.find('.original-selector').val()) {
      // no variant selected
      const emptySections = theme.getEmptyOptionSelectors($formContainer);

      if (emptySections.length) {
        emptySections.forEach((el) => {
          el.classList.add('option-selector--empty');
          const labelPrefix = document.createElement('span');
          labelPrefix.innerText = theme.strings.products_product_pick_a + ' ';
          labelPrefix.className = 'label__prefix';
          el.querySelector('.label').prepend(labelPrefix);
        });

        theme.scrollToRevealElement(emptySections[0]);

        $formContainer.addClass('product-form--validation-started');
      }
      return false;

    } else if (!theme.OptionManager.getCurrentVariantData($formContainer).available) {
      // variant unavailable
      return false;

    } else {
      return true;
    }
  };

  theme.pauseAllMedia = function (params) {
    if (!params || params.videos) {
      document.querySelectorAll('.js-youtube').forEach((video) => {
        video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
      });
      document.querySelectorAll('.js-vimeo').forEach((video) => {
        video.contentWindow.postMessage('{"method":"pause"}', '*');
      });
      document.querySelectorAll('video').forEach((video) => video.pause());
    }
    if (!params || params.models) {
      document.querySelectorAll('product-model').forEach((model) => {
        if (model.modelViewerUI) model.modelViewerUI.pause();
      });
    }
  };

  theme.manualLazyload = (el) => {
    if (el.tagName === 'IMG') {
      if (el.dataset.msrcset) {
        el.dataset.srcset = el.dataset.msrcset;
        delete el.dataset.msrcset;
        el.dataset.src = el.dataset.msrc;
        delete el.dataset.msrc;
        theme.lazy.loadSrcSets();
      } else if (el.dataset.msrc) {
        el.dataset.src = el.dataset.msrc;
        delete el.dataset.msrc;
      }
    } else {
      el.querySelectorAll('img[data-msrc]').forEach((el) => theme.manualLazyload(el));
    }
  };

  $.fn.delegateSimplePassiveEvent = function (eventName, selector, callback) {
    return $(this).each(function () {
      const delEl = this;
      this.addEventListener(eventName, (evt) => {
        let el = evt.target.closest(selector);
        if (!el) return;
        if (!delEl.contains(el)) return;
        callback.call(el, evt, el);
      }, { passive: true });
    });
  };

  theme.addDelegateEventListener = function (element, eventName, selector, callback) {let addEventListenerParams = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
    let cb = (evt) => {
      let el = evt.target.closest(selector);
      if (!el) return;
      if (!element.contains(el)) return;
      callback.call(el, evt, el);
    };
    element.addEventListener(eventName, cb, addEventListenerParams);
  };

  theme.elementIndex = (el) => {
    if (!el) return -1;
    let i = 0;
    while (el = el.previousElementSibling) {
      i++;
    }
    return i;
  };

  theme.Shopify.image_url = (url, width) => {
    return url.replace(/&width=[0-9]*/, '') + '&width=' + width;
  };

  theme.backgroundImageWidths = [180, 360, 540, 720, 900, 1080, 1296, 1512, 1728, 1950, 2100, 2260, 2450, 2700, 3000, 3350, 3750, 4100];
  theme.buildBackgroundImage = (bgEl) => {
    let src = bgEl.dataset.url,
      width = parseInt(bgEl.dataset.width),
      srcset = `${theme.Shopify.image_url(src, width)} ${width}w`;
    const img = document.createElement('img');
    img.className = 'background-image__image load-trans';
    img.loading = 'lazy';
    img.onload = function (evt) {this.classList.add('loaded');};
    img.width = width;
    img.height = bgEl.dataset.height;
    img.alt = bgEl.dataset.alt;
    img.dataset.src = src;
    for (let i = 0; i < theme.backgroundImageWidths.length; i++) {
      if (theme.backgroundImageWidths[i] < img.width) {
        srcset += `, ${theme.Shopify.image_url(src, theme.backgroundImageWidths[i])} ${theme.backgroundImageWidths[i]}w`;
      }
    }
    img.dataset.srcset = srcset;
    bgEl.appendChild(img);
  };

  theme.hideAndRemove = (el) => {
    // disable
    el.querySelectorAll('input').forEach((el) => el.disabled = true);

    // wrap
    const wrapper = document.createElement('div');
    wrapper.className = 'merge-remove-wrapper';
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
    el.classList.add('merge-remove-item');
    wrapper.style.height = wrapper.clientHeight + 'px';

    let cs = getComputedStyle(el),
      fadeDuration = parseFloat(cs.getPropertyValue('--fade-duration')) * 1000,
      slideDuration = parseFloat(cs.getPropertyValue('--slide-duration')) * 1000;

    setTimeout(() => {
      wrapper.classList.add('merge-remove-wrapper--fade');

      setTimeout(() => {
        wrapper.classList.add('merge-remove-wrapper--slide');

        setTimeout(() => wrapper.remove(), slideDuration);
      }, fadeDuration);
    }, 10);
  };

  theme.insertAndReveal = (el, target, iaeCmd, delay) => {
    const initialDelay = delay ? delay : 10;
    el.classList.add('merge-add-wrapper');
    target.insertAdjacentElement(iaeCmd, el);
    el.style.height = el.firstElementChild.clientHeight + 'px';

    let cs = getComputedStyle(el),
      fadeDuration = parseFloat(cs.getPropertyValue('--fade-duration')) * 1000,
      slideDuration = parseFloat(cs.getPropertyValue('--slide-duration')) * 1000;

    setTimeout(() => {
      el.classList.add('merge-add-wrapper--slide');

      setTimeout(() => {
        el.classList.add('merge-add-wrapper--fade');

        setTimeout(() => {
          // tidy up
          el.style.height = '';
          el.classList.remove('merge-add-wrapper', 'merge-add-wrapper--slide', 'merge-add-wrapper--fade');
        }, fadeDuration);
      }, slideDuration);
    }, initialDelay);
  };

  theme.mergeNodes = (newContent, targetContainer) => {
    try {
      // merge: replace content if changed
      newContent.querySelectorAll('[data-merge]').forEach((newEl) => {
        const targetEl = targetContainer.querySelector(`[data-merge="${newEl.dataset.merge}"]`);
        if (!newEl.dataset.mergeCache || !targetEl.dataset.mergeCache || newEl.dataset.mergeCache !== targetEl.dataset.mergeCache) {
          targetEl.innerHTML = newEl.innerHTML;
          targetEl.dataset.mergeCache = newEl.dataset.mergeCache;
        }
      });
      // merge: attributes only
      newContent.querySelectorAll('[data-merge-attributes]').forEach((newEl) => {
        const targetEl = targetContainer.querySelector(`[data-merge-attributes="${newEl.dataset.mergeAttributes}"]`);
        for (const attr of newEl.attributes) {
          targetEl.setAttribute(attr.localName, attr.value);
        }
      });
      // merge: insert/remove/replace in list
      newContent.querySelectorAll('[data-merge-list]').forEach((newList) => {
        const targetList = targetContainer.querySelector(`[data-merge-list="${newList.dataset.mergeList}"]`);
        let targetListItems = Array.from(targetList.querySelectorAll('[data-merge-list-item]'));
        const newListItems = Array.from(newList.querySelectorAll('[data-merge-list-item]'));

        // remove
        targetListItems.forEach((targetListItem) => {
          let matchedItem = newListItems.find((item) => item.dataset.mergeListItem == targetListItem.dataset.mergeListItem);
          if (!matchedItem) {
            theme.hideAndRemove(targetListItem);
          }
        });

        // rebuild target list excluding removed items
        targetListItems = Array.from(targetList.querySelectorAll('[data-merge-list-item]:not(.merge-remove-item)'));

        for (let i = 0; i < newListItems.length; i++) {
          const newListItem = newListItems[i];
          let matchedItem = targetListItems.find((item) => item.dataset.mergeListItem == newListItem.dataset.mergeListItem);
          if (matchedItem) {
            // replace if changed
            if (!newListItem.dataset.mergeCache || !matchedItem.dataset.mergeCache || newListItem.dataset.mergeCache !== matchedItem.dataset.mergeCache) {
              matchedItem.innerHTML = newListItem.innerHTML;
              if (newListItem.dataset.mergeCache) {
                matchedItem.dataset.mergeCache = newListItem.dataset.mergeCache;
              }
            }
          } else {
            // add
            if (i === 0) {
              // first place
              theme.insertAndReveal(newListItem, targetList, 'afterbegin', 500);
            } else if (i >= targetListItems.length) {
              // at end
              theme.insertAndReveal(newListItem, targetList, 'beforeend', 500);
            } else {
              // before element currently at that index
              theme.insertAndReveal(newListItem, targetListItems[i], 'beforebegin', 500);
            }
            // update target list
            targetListItems.splice(i, 0, newListItem);
          }
        }
      });
    } catch {
      location.reload();
    }
  };

  theme.suffixIds = (container, prefix) => {
    const suffixCandidates = ['id', 'for', 'form', 'aria-describedby', 'aria-controls', 'data-cc-modal-contentelement'];
    for (let i = 0; i < suffixCandidates.length; i++) {
      container.querySelectorAll(`[${suffixCandidates[i]}]`).forEach((el) => el.setAttribute(suffixCandidates[i], el.getAttribute(suffixCandidates[i]) + prefix));
    }
  };



  /*=============== Components ===============*/
  theme.applyAjaxToProductForm = function ($formContainer) {
    $formContainer.find('form.product-purchase-form').each(function () {
      var $form = $(this);
      $form.on('submit', function (evt) {
        // Validate
        if (!theme.validateProductForm($formContainer)) {
          return false;
        }

        // Ajax-add
        if (theme.settings.after_add_to_cart !== 'no-js' && $formContainer.is('[data-ajax-add-to-cart="true"]')) {
          evt.preventDefault();

          var shopifyAjaxAddURL = theme.routes.cart_add_url;

          // Disable add button
          $form.find('button[type="submit"]').addClass('btn--in-progress').attr('disabled', 'disabled');

          // Add to cart
          let formData = new FormData($form[0]);
          formData.append('sections', 'cart-drawer');
          $.post(shopifyAjaxAddURL, new URLSearchParams(formData).toString(), theme.addedToCartHandler.bind($form), 'json').fail(function (data) {
            // Enable add button
            $form.find('button[type="submit"]').removeClass('btn--in-progress').removeAttr('disabled');
            // Not added, show message
            if (typeof data !== 'undefined' && typeof data.status !== 'undefined') {
              const response = $.parseJSON(data.responseText);
              let error = typeof response.description === 'string' ? response.description : response.message;
              if (response.errors && typeof response.errors === 'object') {
                error = Object.entries(response.errors).map((item) => item[1].join(', '));
              }
              const errorElement = document.createElement('div');
              const errorArray = Array.isArray(error) ? error : [error];
              errorArray.forEach((err, index) => {
                if (index > 0) errorElement.insertAdjacentHTML('beforeend', '<br>');
                errorElement.insertAdjacentText('beforeend', err);
              });
              theme.showQuickPopup(errorElement.innerHTML, $form.find('button[type="submit"]:first'), 'error');
            } else {
              // Some unknown error? Disable ajax and add the old-fashioned way.
              $formContainer.attr('ajax-add-to-cart', 'false');
              $form.submit();
            }
          });
        }
      });
    });
  };

  theme.addedToCartHandler = function (response) {
    if (theme.settings.after_add_to_cart === 'page') {
      // Redirect
      window.location = theme.routes.cart_url;

    } else if (theme.settings.after_add_to_cart === 'drawer') {
      // Refresh areas and open drawer
      document.documentElement.dispatchEvent(
        new CustomEvent('theme:cartchanged', { bubbles: true, cancelable: false, detail: { openDrawer: true } })
      );
    }

    // Revert add button
    $(this).find('button[type="submit"]').removeClass('btn--in-progress').removeAttr('disabled');
  };

  theme.removeAjaxFromProductForm = function ($formContainer) {
    $formContainer.find('form.product-purchase-form').off('submit');
  };

  const CartForm = class extends HTMLElement {
    connectedCallback() {
      theme.cartNoteMonitor.load($('[name="note"]', this));
      this.enableAjaxUpdate = this.dataset.ajaxUpdate;
      if(this.querySelector('.cart-item-list.swiper')){
        this.swiper = new Swiper('.cart-item-list', {
          slidesPerView: 1,
          spaceBetween: 10,
          freeMode: {
            enabled: true,
            sticky: true,
            momentumRatio: 0.8,
          },
          speed: 400,
          navigation: {
            nextEl: this.querySelector('.product-slider__nav.next'),
            prevEl: this.querySelector('.product-slider__nav.prev'),
          },
        });
      }

      if (this.enableAjaxUpdate) {
        this.sectionId = this.dataset.sectionId;

        this.boundRefresh = (evt) => {
          this.refresh(evt.detail && evt.detail.openDrawer);
        };

        document.addEventListener('theme:cartchanged', this.boundRefresh);

        theme.addDelegateEventListener(this, 'click', '.cart-item__remove', (evt) => {
          evt.preventDefault();
          this.adjustItemQuantity(evt.target.closest('.cart-item'), { to: 0 });
        });

        theme.addDelegateEventListener(this, 'click', '.quantity-down', (evt) => {
          evt.preventDefault();
          this.adjustItemQuantity(evt.target.closest('.cart-item'), { decrease: true });
        });

        theme.addDelegateEventListener(this, 'click', '.quantity-up', (evt) => {
          evt.preventDefault();
          this.adjustItemQuantity(evt.target.closest('.cart-item'), { increase: true });
        });

        theme.addDelegateEventListener(this, 'change', '.cart-item__quantity-input', (evt) => {
          this.adjustItemQuantity(evt.target.closest('.cart-item'), { currentValue: true });
        });
      }
    }

    disconnectedCallback() {
      theme.cartNoteMonitor.unload($('[name="note"]', this));

      if (this.enableAjaxUpdate) {
        document.removeEventListener('theme:cartchanged', this.boundRefresh);
      }
    }

    refresh(openDrawer) {
      this.classList.add('cart-form--refreshing');
      fetch(`${window.Shopify.routes.root}?section_id=${this.sectionId}`).
      then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      }).
      then((response) => {
        let frag = document.createDocumentFragment(),
          newContent = document.createElement('div');

        frag.appendChild(newContent);
        newContent.innerHTML = response;

        newContent.querySelectorAll('[data-cc-animate]').forEach((el) => el.removeAttribute('data-cc-animate'));

        theme.mergeNodes(newContent, this);

        this.classList.remove('cart-form--refreshing');
        this.querySelectorAll('.merge-item-refreshing').forEach((el) => el.classList.remove('merge-item-refreshing'));

        theme.cartNoteMonitor.load($('[name="note"]', this));
        if(this.swiper) {
          this.swiper.update();
        }

        if (openDrawer) {
          document.dispatchEvent(
            new CustomEvent('theme:open-cart-drawer', { bubbles: true, cancelable: false })
          );
        }
      });
    }

    adjustItemQuantity(item, change) {
      const quantityInput = item.querySelector('.cart-item__quantity-input');
      const itemKey = item.dataset.key;

      let newQuantity = parseInt(quantityInput.value);

      if (typeof change.to !== 'undefined') {
        newQuantity = change.to;
      } else if (change.increase) {
        newQuantity += quantityInput.step || 1;
      } else if (change.decrease) {
        newQuantity -= quantityInput.step || 1;
      }

      if (quantityInput.max && newQuantity > parseInt(quantityInput.max)) {
        newQuantity = parseInt(quantityInput.max);
        theme.showQuickPopup(theme.strings.cart_general_quantity_too_high.replace('[QUANTITY]', quantityInput.max), $(quantityInput));
      }

      // Set new quantity, then check if inventory quantity allows it. If not, set it back to its initial value
      quantityInput.value = newQuantity;

      clearTimeout(this.adjustItemQuantityTimeout);
      this.adjustItemQuantityTimeout = setTimeout(() => {
        this.querySelectorAll('.cart-item__quantity-input:not([disabled])').forEach((el) => {
          if (el.value != el.dataset.initialValue) {
            el.closest('[data-merge-list-item]').classList.add('merge-item-refreshing');
          }
        });

        fetch(`${window.Shopify.routes.root}cart/change.js`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: itemKey, quantity: newQuantity })
        }).
        then((response) => {
          if (!response.ok) {
            throw response;
          }
          document.dispatchEvent(
            new CustomEvent('theme:cartchanged', { bubbles: true, cancelable: false })
          );
        }).
        catch((error) => {
          if (error instanceof Response) {
            error.text().then((errorText) => {
              try {
                quantityInput.value = quantityInput.dataset.initialValue;

                const errorMessage = JSON.parse(errorText).message;
                const errorContainer = item.querySelector('.error-message');
                errorContainer.innerText = errorMessage;

                const slideDownAndFadeIn = () => {
                  errorContainer.style.display = 'block';
                  errorContainer.style.transition = 'height 0.5s ease-out, opacity 0.5s ease-out';
                  errorContainer.offsetHeight;
                  errorContainer.style.height = errorContainer.scrollHeight + 'px';
                  errorContainer.style.opacity = '1';
                };

                slideDownAndFadeIn();

                setTimeout(() => {
                  errorContainer.style.height = '0';
                  errorContainer.style.opacity = '0';

                  setTimeout(() => {
                    errorContainer.style.display = 'none';
                  }, 500);

                }, 8000);
              } catch (parseError) {
                console.log('Error parsing JSON:', parseError);
              }
            });
          }
        }).
        finally(() => {
          this.querySelectorAll('.merge-item-refreshing').forEach((el) => {
            el.classList.remove('merge-item-refreshing');
            
          });
        });
      }, newQuantity === 0 ? 10 : 700);
    }
  };

  window.customElements.define('cart-form', CartForm);
  ;
  /*
    Usage:
    <cc-carousel allow-mouse-drag select-single>
      <button class="cc-carousel-button cc-carousel-button--prev"> - optional
      <button class="cc-carousel-button cc-carousel-button--prev"> - optional
      <div class="cc-carousel__scroll-outer"> - required
        <div class="cc-carousel__scroll-area"> - required, flex is applied, negative margin is handled (may be useful for grid layout)
          <*> - any elements permitted as children
  
    Attributes:
    allow-mouse-drag - allows dragging with mouse, hover styles and click events blocked during drag
    select-single - next/previous selects an individual item, not scrolling all in view
    loop - next/previous will wrap
    set-item-classes - add classes to items to indicate current/visible
    rebuild-on-resize - rebuilds entire state after a resize
  
    Public:
    setItem(item) - set as current item
    contentChanged() - call when contents change (rebuilds state)
  
    Sends:
    cc-carousel:selected { currentItem } - dispatched to cc-carousel when selection changes
  
    Notes:
    To handle lazy-initialisation, use "get()" before calling functions - e.g. carousEl.get().setItem(el)
    May nest carousels inside carousels, just ensure the outer carousel's buttons will be found first (with querySelector)
    Math.abs/floor used liberally for RTL calculations
  */
  const CCCarousel = class extends HTMLElement {
    constructor() {
      super();
      theme.lazy.initScript(this, this.prepare.bind(this));
    }

    get() {
      this.prepare();
      return this;
    }

    prepare() {
      if (!this.prepared) {
        this.prepared = true;
        this.scrollOuter = this.querySelector('.cc-carousel__scroll-outer');
        this.scrollArea = this.querySelector('.cc-carousel__scroll-area');
        this.prevButton = this.querySelector('.cc-carousel-button--prev');
        this.nextButton = this.querySelector('.cc-carousel-button--next');
        this.buttonContainer = this.querySelector('.cc-carousel-buttons');

        this.allowMouseDrag = this.hasAttribute('allow-mouse-drag');
        this.selectSingle = this.hasAttribute('select-single');
        this.loopPreferred = this.hasAttribute('loop');
        this.rebuildOnResize = this.hasAttribute('rebuild-on-resize');
        this.setItemClasses = this.hasAttribute('set-item-classes');
        this.ltr = !document.querySelector('html[dir=rtl]');

        // hack for when scroll areas do not initialise at start
        this.scrollArea.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        if (this.rebuildOnResize) {
          try {
            this.savedClientWidth = this.clientWidth;
            this.resizeObserver = new ResizeObserver((entries) => {
              for (let entry of entries) {
                if (entry.contentBoxSize) {
                  if (this.clientWidth !== this.savedClientWidth) {
                    this.savedClientWidth = this.clientWidth;
                    this.reInitTimeoutId = setTimeout(this.reInit.bind(this), 250);
                  }
                }
              }
            });
            this.resizeObserver.observe(this);
          } catch {} // acceptable loss of functionality for < 13.3
        }

        this.init.call(this);
      }
    }

    init() {
      this.selectedItemIndex = 0;
      this.flexDirection = getComputedStyle(this).getPropertyValue('--carousel-direction');

      if (this.scrollArea.childElementCount === 0 || this.flexDirection == 'column' || this.flexDirection == 'none') return; // no js handling for vertical column

      if (this.scrollArea.childElementCount === 1) {
        // set classes and states, no events required
        this.loop = false;
        this.classList.add('cc-carousel--at-start');
        this.classList.add('cc-carousel--at-end');
        if (this.setItemClasses) {
          this.scrollArea.firstElementChild.classList.add('cc-carousel__current-item');
          this.scrollArea.firstElementChild.classList.add('cc-carousel__visible-item');
        }
        if (this.prevButton) {
          this.prevButton.disabled = true;
        }
        if (this.nextButton) {
          this.nextButton.disabled = true;
        }
      } else {
        this.loop = this.loopPreferred;
        this.scrollArea.addEventListener('scroll', this.onScroll.bind(this));
        this.scrollNextSearchOffset = this.scrollArea.firstElementChild.clientWidth / 8; // rough calculation mainly used for rounding issues

        if (this.prevButton) {
          this.boundPrev = this.prev.bind(this);
          this.prevButton.addEventListener('click', this.boundPrev);
        }

        if (this.nextButton) {
          this.boundNext = this.next.bind(this);
          this.nextButton.addEventListener('click', this.boundNext);
        }

        if (this.allowMouseDrag) {
          this.boundReleaseDrag = this.releaseDrag.bind(this);
          this.boundDrag = this.drag.bind(this);
          this.boundOnMouseDown = this.onMouseDown.bind(this);
          this.scrollOuter.addEventListener('mousedown', this.boundOnMouseDown);
        }

        this.whenStateSettled();
      }
    }

    reInit() {
      // remove events
      if (this.prevButton) {
        this.prevButton.removeEventListener('click', this.boundPrev);
        this.boundPrev = null;
      }

      if (this.nextButton) {
        this.nextButton.removeEventListener('click', this.boundNext);
        this.boundNext = null;
      }

      if (this.allowMouseDrag) {
        this.scrollOuter.removeEventListener('mousedown', this.boundOnMouseDown);
        this.boundOnMouseDown = null;
      }

      // reset classes
      if (this.buttonContainer) {
        this.buttonContainer.classList.remove('cc-carousel-buttons--show');
      }
      for (const item of this.scrollArea.children) {
        item.classList.remove('cc-carousel__current-item', 'cc-carousel__visible-item');
      }

      // init
      this.init();
    }

    contentChanged() {
      this.reInit();
    }

    onScroll(evt) {
      clearTimeout(this.onScrollTimeoutId);
      this.onScrollTimeoutId = setTimeout(() => {
        if (this.selectSingle && !this.scrollingForVisibility) {
          this.selectFirstVisibleItem();
        }
        this.whenStateSettled();
        this.scrollingForVisibility = false;
      }, 50);
    }

    onMouseDown(evt) {
      this.dragLastX = evt.clientX;
      this.classList.add('cc-carousel--mousedown');
      document.addEventListener('mousemove', this.boundDrag);
      document.addEventListener('mouseup', this.boundReleaseDrag);
    }

    itemOffsetStart(el) {
      return this.ltr ? el.offsetLeft : this.scrollArea.clientWidth - el.offsetLeft - el.clientWidth;
    }

    itemIsWithinScrollView(el, customScrollStart) {
      // beware: magic rounding numbers
      let scrollViewStart = typeof customScrollStart !== 'undefined' ? customScrollStart : Math.abs(this.scrollArea.scrollLeft),
        scrollViewEnd = scrollViewStart + this.scrollArea.clientWidth,
        elStart = this.itemOffsetStart(el) + 1,
        elEnd = elStart + el.clientWidth - 3;
      return elStart >= scrollViewStart && elEnd <= scrollViewEnd;
    }

    drag(evt) {
      evt.preventDefault();

      if (!this.inDrag) {
        this.classList.add('cc-carousel--in-drag');
        this.inDrag = true;
      }

      this.scrollArea.scrollLeft = this.scrollArea.scrollLeft + (this.dragLastX - evt.clientX);
      this.dragLastX = evt.clientX;
    }

    releaseDrag(evt) {
      if (this.inDrag) {
        this.inDrag = false;
        this.classList.remove('cc-carousel--in-drag');
        document.removeEventListener('mouseup', this.boundReleaseDrag);
      }

      document.removeEventListener('mousemove', this.boundDrag);
      this.classList.remove('cc-carousel--mousedown');
    }

    prev() {
      let nextItem = null;

      if (this.selectSingle) {
        nextItem = this.findCurrentItem().previousElementSibling;
      } else {
        let virtualScrollLeft = Math.max(0, Math.abs(this.scrollArea.scrollLeft) - this.scrollArea.clientWidth);
        // handle scroll pos not aligning with left edge of items
        let firstElComputedStyle = getComputedStyle(this.scrollArea.firstElementChild);
        if (firstElComputedStyle.scrollMarginInlineStart) {
          virtualScrollLeft += parseFloat(firstElComputedStyle.scrollMarginInlineStart);
        }
        for (const item of this.scrollArea.children) {
          if (this.itemIsWithinScrollView(item, virtualScrollLeft)) {
            nextItem = item;
            break;
          }
        }
      }

      if (this.loop && !nextItem) {
        nextItem = this.scrollArea.lastElementChild;
      }

      if (nextItem) {
        this.selectItem(nextItem);
      }
    }

    next() {
      let nextItem = null;

      if (this.selectSingle) {
        nextItem = this.findCurrentItem().nextElementSibling;
      } else {
        let foundItemInScrollView = false;
        for (const item of this.scrollArea.children) {
          if (this.itemIsWithinScrollView(item)) {
            foundItemInScrollView = true;
          } else if (foundItemInScrollView) {
            nextItem = item;
            break;
          }
        }
      }

      if (this.loop && !nextItem) {
        nextItem = this.scrollArea.firstElementChild;
      }

      if (nextItem) {
        this.selectItem(nextItem);
      }
    }

    findItemAfter(targetOffsetLeft) {
      let nextItem = null;

      for (let i = 0; i < this.scrollArea.children.length; i++) {
        if (this.itemOffsetStart(this.scrollArea.children[i]) > targetOffsetLeft) {
          nextItem = this.scrollArea.children[i];
          break;
        }
      }

      if (!nextItem) {
        this.scrollArea.lastElementChild;
      }

      return nextItem;
    }

    findCurrentItem(forceFromPosition) {
      if (this.selectSingle && !forceFromPosition) {
        return this.scrollArea.children[this.selectedItemIndex];
      } else {
        const firstItemOffsetLeft = this.ltr ? this.scrollArea.firstElementChild.offsetLeft : 0,
          nextItemAfterX = Math.abs(this.scrollArea.scrollLeft) - this.scrollNextSearchOffset + firstItemOffsetLeft;
        return this.findItemAfter(nextItemAfterX);
      }
    }

    selectItem(item) {
      if (this.selectSingle) {
        let i = 0,
          iEl = item;
        while (iEl = iEl.previousElementSibling) {
          i++;
        }
        this.selectedItemIndex = i;
      }

      if (!this.itemIsWithinScrollView(item)) {
        const destinationScrollLeft = item.offsetLeft - this.scrollArea.firstElementChild.offsetLeft;
        this.scrollingForVisibility = true;
        this.scrollArea.scrollTo({ top: 0, left: destinationScrollLeft, behavior: 'smooth' });
      }

      this.whenStateSettled();
    }

    selectFirstVisibleItem() {
      this.selectItem(this.findCurrentItem(true));
    }

    setTabindexAccessible(item, canAccess) {
      let items = item.querySelectorAll('a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), *[tabindex]'); // all likely, not all possible
      for (let i = 0; i < items.length; i++) {
        let item = items[i];
        if (typeof item.dataset.ccCarouselPriorTabindex === 'undefined') {
          item.dataset.ccCarouselPriorTabindex = item.tabIndex;
        }
        if (canAccess) {
          if (item.dataset.ccCarouselPriorTabindex && item.dataset.ccCarouselPriorTabindex !== '0') {
            item.tabIndex = item.dataset.ccCarouselPriorTabindex;
          } else {
            item.removeAttribute('tabindex');
          }
        } else {
          item.tabIndex = -1;
        }
      }
    }

    whenStateSettled() {
      // self-throttle
      clearTimeout(this.whenStateSettledTimeoutId);
      this.whenStateSettledTimeoutId = setTimeout(() => {
        // read before modifying styles
        const normalisedScrollLeft = Math.abs(Math.floor(this.scrollArea.scrollLeft));
        let atStartOfScroll = normalisedScrollLeft <= 0,
          atEndOfScroll = normalisedScrollLeft + this.scrollArea.clientWidth + 2 > this.scrollArea.scrollWidth;

        const currentItem = this.findCurrentItem();

        this.dispatchEvent(
          new CustomEvent('cc-carousel:selected', { bubbles: true, cancelable: false, detail: { currentItem: currentItem } })
        );

        for (const item of this.scrollArea.children) {
          let itemIsVisible = this.itemIsWithinScrollView(item);

          this.setTabindexAccessible(item, itemIsVisible);

          if (this.setItemClasses) {
            item.classList.toggle('cc-carousel__current-item', item == currentItem);
            item.classList.toggle('cc-carousel__visible-item', itemIsVisible);
          }
        }

        this.classList.toggle('cc-carousel--at-start', atStartOfScroll);
        this.classList.toggle('cc-carousel--at-end', atEndOfScroll);

        if (this.prevButton || this.nextButton) {
          if (this.selectSingle) {
            if (this.buttonContainer) {
              this.buttonContainer.classList.add('cc-carousel-buttons--show');
            }
            const currentItem = this.findCurrentItem();

            if (!this.loop) {
              if (this.prevButton) {
                if (currentItem.previousElementSibling) {
                  this.prevButton.removeAttribute('disabled');
                } else {
                  this.prevButton.disabled = true;
                }
              }

              if (this.nextButton) {
                if (currentItem.nextElementSibling) {
                  this.nextButton.removeAttribute('disabled');
                } else {
                  this.nextButton.disabled = true;
                }
              }
            }
          } else {
            if (atStartOfScroll && atEndOfScroll) {
              // no scroll possible
              if (this.buttonContainer) {
                this.buttonContainer.classList.remove('cc-carousel-buttons--show');
              }

              if (this.prevButton) {
                this.prevButton.disabled = true;
              }

              if (this.nextButton) {
                this.nextButton.disabled = true;
              }
            } else {
              // scroll possible
              if (this.buttonContainer) {
                this.buttonContainer.classList.add('cc-carousel-buttons--show');
              }

              if (this.prevButton) {
                if (this.loop || !atStartOfScroll) {
                  this.prevButton.removeAttribute('disabled');
                } else {
                  this.prevButton.disabled = true;
                }
              }

              if (this.nextButton) {
                if (this.loop || !atEndOfScroll) {
                  this.nextButton.removeAttribute('disabled');
                } else {
                  this.nextButton.disabled = true;
                }
              }
            }
          }
        }
      }, 20);
    }
  };

  window.customElements.define('cc-carousel', CCCarousel);
  ;
  const CCCartCrossSell = class extends HTMLElement {
    connectedCallback() {
      this.productList = this.querySelector('.product-mini-list');

      if (this.dataset.from) {
        fetch(this.dataset.from).
        then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.text();
        }).
        then((response) => {
          let frag = document.createDocumentFragment(),
            newContent = document.createElement('div');
          frag.appendChild(newContent);
          newContent.innerHTML = response;

          const pl = newContent.querySelector('.product-mini-list');
          if (pl) {
            this.productList.innerHTML = pl.innerHTML;
            let carousel = this.productList.closest('cc-carousel');
            if (carousel) {
              carousel.get().contentChanged();
            }
          } else {
            this.classList.add('hidden');
          }
        });
      }
    }
  };

  window.customElements.define('cc-cart-cross-sell', CCCartCrossSell);
  ;
  const CCFetchedContent = class extends HTMLElement {
    connectedCallback() {
      fetch(this.dataset.url).
      then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      }).
      then((response) => {
        let frag = document.createDocumentFragment(),
          fetchedContent = document.createElement('div');
        frag.appendChild(fetchedContent);
        fetchedContent.innerHTML = response;

        let replacementContent = fetchedContent.querySelector(`[data-id="${CSS.escape(this.dataset.id)}"]`);
        if (replacementContent) {
          this.innerHTML = replacementContent.innerHTML;
        }
      });
    }
  };

  window.customElements.define('cc-fetched-content', CCFetchedContent);
  ;
  theme.LoadFilterer = function (section, baseUrl) {let alterLocation = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    this.$container = section.$container;
    this.namespace = section.namespace;
    this.registerEventListener = section.registerEventListener;
    this.baseUrl = baseUrl ? baseUrl : location.pathname;
    this.alterLocation = alterLocation;

    this.functions = {
      ajaxLoadLink: function (evt) {
        evt.preventDefault();
        this.functions.ajaxLoadUrl.call(this, $(evt.currentTarget).attr('href'), this.alterLocation);
      },

      ajaxLoadForm: function (evt) {
        if (evt.type === 'submit') {
          evt.preventDefault();
        }
        var queryVals = [];
        evt.currentTarget.querySelectorAll('input, select').forEach((input) => {
          if (
          (input.type !== 'checkbox' && input.type !== 'radio' || input.checked // is an active input value
          ) && input.value !== '' // has a value
          ) {
            queryVals.push([input.name, encodeURIComponent(input.value)]);
          }
        });

        // new url
        var newUrl = this.baseUrl;
        queryVals.forEach((value) => {
          newUrl += `&${value[0]}=${value[1]}`;
        });
        newUrl = newUrl.replace('&', '?');

        // load
        this.functions.ajaxLoadUrl.call(this, newUrl, this.alterLocation);

        // fetch suggestions, if relevant
        if (theme.settings.show_search_suggestions) {
          const searchTerms = evt.currentTarget.querySelector('[name="q"][data-terms]');
          this.searchContainer = document.querySelector('.main-search__container');
          if (searchTerms && this.searchContainer) {
            this.functions.fetchSuggestions.call(this, searchTerms.value);
          }
        }
      },

      fetchSuggestions: function (terms) {
        if (this.searchSuggestionsAbortController) {
          this.searchSuggestionsAbortController.abort();
        }
        this.searchSuggestionsAbortController = new AbortController();

        fetch(`${theme.routes.predictive_search_url}?q=${encodeURIComponent(terms)}&section_id=search-suggestions`, {
          signal: this.searchSuggestionsAbortController.signal
        }).
        then((response) => {
          if (!response.ok) {
            var error = new Error(response.status);
            throw error;
          }
          return response.text();
        }).
        then((text) => {
          const results = new DOMParser().
          parseFromString(text, 'text/html').
          querySelector('.search-suggestions-wrapper');

          this.searchContainer.querySelectorAll('.search-suggestions-wrapper').forEach((el) => el.remove());
          this.searchContainer.insertAdjacentElement('beforeend', results);
        }).
        catch((error) => {
          if ((error === null || error === void 0 ? void 0 : error.code) === 20) {
            return; // aborted
          }
          throw error;
        });
      },

      ajaxPopState: function (event) {
        this.functions.ajaxLoadUrl.call(this, document.location.href, false);
      },

      ajaxLoadUrl: function (url, pushState) {
        if (pushState) {
          // update url history
          var fullUrl = url;
          if (fullUrl.slice(0, 1) === '/') {
            fullUrl = window.location.protocol + '//' + window.location.host + fullUrl;
          }
          window.history.pushState({ path: fullUrl }, '', fullUrl);
        }

        // limit render to section, if possible (added after pushState)
        if (this.$container[0].dataset.filterSectionId) {
          url += (url.indexOf('?') >= 0 ? '&' : '?') + `section_id=${this.$container[0].dataset.filterSectionId}`;
        }

        // start fetching URL
        var refreshContainerSelector = '[data-ajax-container]',
          $ajaxContainers = this.$container.find(refreshContainerSelector);

        // loading state
        $ajaxContainers.addClass('ajax-loading');

        // fetch content
        if (this.currentAjaxLoadUrlFetch) {
          this.currentAjaxLoadUrlFetch.abort();
        }
        this.currentAjaxLoadUrlFetch = $.get(url, function (data) {
          this.currentAjaxLoadUrlFetch = null;

          // save active element
          if (document.activeElement) {
            this.activeElementId = document.activeElement.id;
          }

          // replace contents
          var $newAjaxContainers = $(`<div>${data}</div>`).find(refreshContainerSelector);
          $newAjaxContainers.each(function () {
            $ajaxContainers.filter(`[data-ajax-container="${this.dataset.ajaxContainer}"]`).html($(this).html());
          });

          // init theme components
          const $componentHaver = this.$container.closest('[data-components]');
          if ($componentHaver.length) {
            const components = $componentHaver.data('components').split(',');
            components.forEach(function (component) {
              $(document).trigger('cc:component:load', [component, $componentHaver[0]]);
            }.bind(this));
          }

          // remove loading state
          $ajaxContainers.removeClass('ajax-loading');

          // init scroll animations
          theme.initAnimateOnScroll();

          // restore active element
          if (this.activeElementId) {
            var el = document.getElementById(this.activeElementId);
            if (el) {
              el.focus();
            }
          }

          // scroll viewport (must be done after any page size changes)
          let scrollTo = this.$container[0].querySelector('[data-ajax-scroll-to]');
          if (scrollTo) {
            theme.scrollToRevealElement(scrollTo);
          }
        }.bind(this));
      }
    };

    // ajax filter & sort
    if (this.$container.data('ajax-filtering')) {
      // ajax load on link click
      this.$container.on('click' + this.namespace, '.filter-group__applied-item, .filter-group__clear-link, .pagination a', this.functions.ajaxLoadLink.bind(this));
      // ajax load form submission
      this.$container.on('change' + this.namespace + ' submit' + this.namespace, '#CollectionFilterForm', theme.debounce(this.functions.ajaxLoadForm.bind(this), 700));
      // handle back button
      this.registerEventListener(window, 'popstate', this.functions.ajaxPopState.bind(this));
    } else {
      this.$container.on('change' + this.namespace, '#CollectionFilterForm', function () {
        $(this).submit();
      });
    }

    this.destroy = function () {
      theme.destroyProductGallery(this.$container);
      this.$container.off(this.namespace);
      $(window).off(this.namespace);
      $(document).off(this.namespace);
    }.bind(this);
  };

  theme.buildGalleryViewer = function (config) {
    // create viewer
    var galleryParent = config.galleryParent ? config.galleryParent : document.body,
      $allContainer = $('<div class="gallery-viewer gallery-viewer--pre-reveal">'),
      $zoomContainer = $('<div class="gallery-viewer__zoom-container">').appendTo($allContainer),
      $thumbContainer = $('<div class="gallery-viewer__thumbs">').appendTo($allContainer),
      $controlsContainer = $('<div class="gallery-viewer__controls">').appendTo($allContainer),
      $close = $('<a class="gallery-viewer__button gallery-viewer__close" href="#">').html(config.close).appendTo($controlsContainer),
      $right = $('<a class="gallery-viewer__button gallery-viewer__prev" href="#">').html(config.prev).appendTo($controlsContainer),
      $left = $('<a class="gallery-viewer__button gallery-viewer__next" href="#">').html(config.next).appendTo($controlsContainer),
      $currentZoomImage = null,
      wheelZoomMultiplier = -0.001,
      pinchZoomMultiplier = 0.003,
      touchPanModifier = 1.0,
      currentTransform = {
        panX: 0,
        panY: 0,
        zoom: 1
      };

    // add images
    for (var i = 0; i < config.images.length; i++) {
      var img = config.images[i];
      $('<a class="gallery-viewer__thumb" href="#">').data('zoom-url', img.zoomUrl).
      html(img.thumbTag).
      appendTo($thumbContainer);
    }

    if (config.images.length === 1) {
      $allContainer.addClass('gallery-viewer--single-image');
    }

    // helper functions for panning an image
    var panZoomImageFromCoordinate = function (inputX, inputY) {
      // do nothing if the image fits, pan if not
      var doPanX = $currentZoomImage.width() > $allContainer.width();
      var doPanY = $currentZoomImage.height() > $allContainer.height();
      if (doPanX || doPanY) {
        var midX = $allContainer.width() / 2;
        var midY = $allContainer.height() / 2;

        var offsetFromCentreX = inputX - midX,
          offsetFromCentreY = inputY - midY;

        // the offsetMultipler ensures it can only pan to the edge of the image, no further
        var finalOffsetX = 0;
        var finalOffsetY = 0;
        if (doPanX) {
          var offsetMultiplierX = ($currentZoomImage.width() - $allContainer.width()) / 2 / midX;
          finalOffsetX = Math.round(-offsetFromCentreX * offsetMultiplierX);
        }
        if (doPanY) {
          var offsetMultiplierY = ($currentZoomImage.height() - $allContainer.height()) / 2 / midY;
          finalOffsetY = Math.round(-offsetFromCentreY * offsetMultiplierY);
        }

        currentTransform.panX = finalOffsetX;
        currentTransform.panY = finalOffsetY;
        alterCurrentPanBy(0, 0); // sanitise
        updateImagePosition();
      }
    };

    var panZoomImageFromScreenCoordinate = function (screenX, screenY) {
      let containerBoundingRect = $allContainer[0].getBoundingClientRect(),
        containerLeft = containerBoundingRect.left,
        containerRight = containerBoundingRect.left + $allContainer.width(),
        containerTop = containerBoundingRect.top,
        containerBottom = containerBoundingRect.top + $allContainer.height();
      if (screenX >= containerLeft && screenX <= containerRight && screenY >= containerTop && screenY <= containerBottom) {
        panZoomImageFromCoordinate(screenX - containerLeft, screenY - containerTop);
      }
    };

    var alterCurrentPanBy = function (x, y) {
      currentTransform.panX += x;
      // limit offset to keep most of image on screen
      var panXMax = ($currentZoomImage[0].naturalWidth * currentTransform.zoom - $allContainer.width()) / 2.0;
      panXMax = Math.max(panXMax, 0);
      currentTransform.panX = Math.min(currentTransform.panX, panXMax);
      currentTransform.panX = Math.max(currentTransform.panX, -panXMax);

      currentTransform.panY += y;
      var panYMax = ($currentZoomImage[0].naturalHeight * currentTransform.zoom - $allContainer.height()) / 2.0;
      panYMax = Math.max(panYMax, 0);
      currentTransform.panY = Math.min(currentTransform.panY, panYMax);
      currentTransform.panY = Math.max(currentTransform.panY, -panYMax);
      updateImagePosition();
    };

    var setCurrentTransform = function (panX, panY, zoom) {
      currentTransform.panX = panX;
      currentTransform.panY = panY;
      currentTransform.zoom = zoom;
      alterCurrentTransformZoomBy(0);
    };

    var alterCurrentTransformZoomBy = function (delta) {
      currentTransform.zoom += delta;
      // do not zoom out further than fit
      var maxZoomX = $allContainer.width() / $currentZoomImage[0].naturalWidth,
        maxZoomY = $allContainer.height() / $currentZoomImage[0].naturalHeight;
      currentTransform.zoom = Math.max(currentTransform.zoom, Math.min(maxZoomX, maxZoomY));

      // do not zoom in further than native size
      currentTransform.zoom = Math.min(currentTransform.zoom, 1.0);

      // reasses pan bounds
      alterCurrentPanBy(0, 0);
      updateImagePosition();
    };

    var updateImagePosition = function () {
      $currentZoomImage.css(
        'transform', `translate3d(${currentTransform.panX}px, ${currentTransform.panY}px, 0) scale(${currentTransform.zoom})`
      );
    };

    // set up events
    // event: select thumbnail - zoom it
    $allContainer.on('click.galleryViewer select.galleryViewer', '.gallery-viewer__thumb', function (evt) {
      evt.preventDefault();

      // set active
      $(this).addClass('gallery-viewer__thumb--active').
      siblings('.gallery-viewer__thumb--active').
      removeClass('gallery-viewer__thumb--active');

      // replace zoom image
      $zoomContainer.addClass('gallery-viewer__zoom-container--loading');
      $currentZoomImage = $('<img class="gallery-viewer__zoom-image" alt="" style="visibility: hidden">');
      $currentZoomImage.on('load', function () {
        $(this).parent().removeClass('gallery-viewer__zoom-container--loading');
        $(this).off('load');
        $(this).css({
          visibility: '',
          top: $allContainer.height() / 2 - $(this).height() / 2,
          left: $allContainer.width() / 2 - $(this).width() / 2
        });
        setCurrentTransform(0, 0, 0); // centre, zoomed out
      }).attr('src', $(this).data('zoom-url'));

      $zoomContainer.html($currentZoomImage);
    });

    // event: pan
    var pinchTracking = {
      isTracking: false,
      lastPinchDistance: 0
    };
    var touchTracking = {
      isTracking: false,
      lastTouchX: 0,
      lastTouchY: 0
    };

    $allContainer.on('touchend.galleryViewer', function (evt) {
      pinchTracking.isTracking = false;
      touchTracking.isTracking = false;
    });

    $allContainer.on('mousemove.galleryViewer touchmove.galleryViewer', function (evt) {
      evt.preventDefault();
      if (evt.type === 'touchmove' && evt.touches.length > 0) {
        // pan
        var touch1 = evt.touches[0];
        if (!touchTracking.isTracking) {
          touchTracking.isTracking = true;
          touchTracking.lastTouchX = touch1.clientX;
          touchTracking.lastTouchY = touch1.clientY;
        } else {
          alterCurrentPanBy(
            (touch1.clientX - touchTracking.lastTouchX) * touchPanModifier,
            (touch1.clientY - touchTracking.lastTouchY) * touchPanModifier
          );
          touchTracking.lastTouchX = touch1.clientX;
          touchTracking.lastTouchY = touch1.clientY;
        }

        if (evt.touches.length === 2) {
          // pinch
          var touch2 = evt.touches[1],
            pinchDistance = Math.sqrt(Math.pow(touch1.clientX - touch2.clientX, 2) + Math.pow(touch1.clientY - touch2.clientY, 2));
          if (!pinchTracking.isTracking) {
            pinchTracking.lastPinchDistance = pinchDistance;
            pinchTracking.isTracking = true;
          } else {
            var pinchDelta = pinchDistance - pinchTracking.lastPinchDistance;
            alterCurrentTransformZoomBy(pinchDelta * pinchZoomMultiplier);
            pinchTracking.lastPinchDistance = pinchDistance;
          }
        } else {
          pinchTracking.isTracking = false;
        }
      } else {
        // mousemove
        panZoomImageFromScreenCoordinate(evt.clientX, evt.clientY);
      }
    });

    // event: mousewheel
    $allContainer.on('wheel.galleryViewer', function (evt) {
      evt.preventDefault();
      if (evt.originalEvent.deltaY != 0) {
        alterCurrentTransformZoomBy(evt.originalEvent.deltaY * wheelZoomMultiplier);
      }
    });

    // event: prevent pan while swiping thumbnails
    $allContainer.on('touchmove.galleryViewer', '.gallery-viewer__thumbs', function (evt) {
      evt.stopPropagation();
    });

    // event: next thumbnail
    $allContainer.on('click.galleryViewer', '.gallery-viewer__next', function (evt) {
      evt.preventDefault();
      var $next = $thumbContainer.find('.gallery-viewer__thumb--active').next();
      if ($next.length === 0) {
        $next = $thumbContainer.find('.gallery-viewer__thumb:first');
      }
      $next.trigger('select');
    });

    // event: previous thumbnail
    $allContainer.on('click.galleryViewer', '.gallery-viewer__prev', function (evt) {
      evt.preventDefault();
      var $prev = $thumbContainer.find('.gallery-viewer__thumb--active').prev();
      if ($prev.length === 0) {
        $prev = $thumbContainer.find('.gallery-viewer__thumb:last');
      }
      $prev.trigger('select');
    });

    // event: close (button)
    $allContainer.on('click.galleryViewer', '.gallery-viewer__close', function (evt) {
      evt.preventDefault();
      theme.galleryViewerFunctions.close();
    });

    // event: close (esc key)
    document.addEventListener('keyup', theme.galleryViewerFunctions.onDocumentKeyup);

    // event: zoom
    $allContainer.on('click.galleryViewer', '.gallery-viewer__zoom-container', function (evt) {
      evt.preventDefault();
      if (currentTransform.zoom == 1.0) {
        currentTransform.zoom = 0;
        alterCurrentTransformZoomBy(0);
      } else {
        currentTransform.zoom = 1;
        alterCurrentTransformZoomBy(0);
        panZoomImageFromScreenCoordinate(evt.clientX, evt.clientY);
      }
    });

    // initialise

    // - clear any remnants of failed previous closure
    $('html').removeClass('gallery-viewer-open');
    $('.gallery-viewer').remove();

    // - insert into page
    $('html').addClass('gallery-viewer-open');
    $allContainer.appendTo(galleryParent);

    // - select first thumbnail
    let currentIndex = 0;
    if (config.currentImage) {
      config.images.forEach((img, index) => {
        if (config.currentImage === img.zoomUrl) {
          currentIndex = index;
        }
      });
    }
    let $focusThumb = $thumbContainer.find('.gallery-viewer__thumb:eq(' + currentIndex + ')').trigger('select');

    if (config.images.length > 1) {
      $focusThumb.focus();
    } else {
      $close.focus();
    }

    // - reveal
    setTimeout(function () {
      $allContainer.removeClass('gallery-viewer--pre-reveal');
    }, 10);
  };

  theme.galleryViewerFunctions = {
    close: function () {
      const $galleryViewer = $('.gallery-viewer');

      // destroy events
      $galleryViewer.off('.galleryViewer');
      document.removeEventListener('keyup', theme.galleryViewerFunctions.onDocumentKeyup);

      // begin exit transition
      $galleryViewer.addClass('gallery-viewer--transition-out');

      // remove after transition
      var transitionDelay = $galleryViewer.css('transition-duration');
      transitionDelay = transitionDelay.indexOf('ms') > -1 ? parseFloat(transitionDelay) : parseFloat(transitionDelay) * 1000;
      setTimeout(function () {
        $galleryViewer.remove();
        $('html').removeClass('gallery-viewer-open');
      }, transitionDelay);
    },

    onDocumentKeyup: function (evt) {
      switch (evt.key) {
        case 'Escape':
          theme.galleryViewerFunctions.close();
          break;
        case 'ArrowLeft':
          $('.gallery-viewer__prev').trigger('click');
          break;
        case 'ArrowRight':
          $('.gallery-viewer__next').trigger('click');
          break;
      }
    }
  };

  theme.Navigation = {
    init: function (options) {
      if (options.nav.length == 0) {
        return;
      }

      var $nav = options.nav,
        navHoverDelay = 250,
        $navLastOpenDropdown = $(),
        navOpenTimeoutId = -1;


      /// Mobile nav

      // create it
      let mobileDrawerFragment = options.mobileNavTemplate.content.cloneNode(true);

      // add announcement bar items
      let $mobileDrawerFooter = $('<div class="mobile-navigation-drawer__footer">').appendTo(mobileDrawerFragment.querySelector('div'));
      $mobileDrawerFooter.append($('.announcement-bar .inline-menu').clone().removeClass('desktop-only'));
      $mobileDrawerFooter.append($('.announcement-bar .header-disclosures').clone().removeClass('desktop-only'));
      let mobileSocialLinks = $('.announcement-bar .social-links').clone().removeClass('desktop-only')[0];
      let mobileSocialLinksCustomIconToSwap = document.querySelector('.announcement-bar .js-replacement-custom-icon');
      if (mobileSocialLinksCustomIconToSwap) {
        mobileSocialLinks.querySelector('.social-custom').parentElement.innerHTML = mobileSocialLinksCustomIconToSwap.content.firstElementChild.cloneNode(true).innerHTML;
      }
      $mobileDrawerFooter.append(mobileSocialLinks);

      // ensure ids are unique
      theme.suffixIds(mobileDrawerFragment.firstElementChild, 'MobileNav');

      // insert into page
      document.querySelector('.section-header').insertAdjacentElement('afterend', mobileDrawerFragment.firstElementChild);
      var $mobileDrawer = $('.mobile-navigation-drawer');

      // event: open second tier
      $mobileDrawer.on('click', '.navigation__tier-1 > .navigation__item > .navigation__children-toggle', function (evt) {
        evt.preventDefault();

        // set text in header
        $(this).parent().
        addClass('navigation__item--open').
        closest('.mobile-navigation-drawer').
        addClass('mobile-navigation-drawer--child-open').
        find('.mobile-nav-title').
        text($(this).siblings('.navigation__link').text());

        // position under header
        $(this).siblings('.navigation__tier-2-container').css({
          top: Math.ceil($('.navigation__mobile-header:last').height() + 1) + 'px'
        });

        // scroll container
        this.closest('.mobile-navigation-drawer').scrollTo({ top: 0, left: 0, behavior: 'instant' }); // 'smooth' not working in iOS 15
      });

      if ($mobileDrawer.data('mobile-expand-with-entire-link')) {
        $mobileDrawer.on('click', '.navigation__item--with-children > .navigation__link', function (evt) {
          evt.preventDefault();
          $(this).siblings('.navigation__children-toggle').trigger('click');
        });
      }

      // event: close second tier
      $mobileDrawer.on('click', '.mobile-nav-back', function (evt) {
        evt.preventDefault();
        $(this).closest('.mobile-navigation-drawer').
        removeClass('mobile-navigation-drawer--child-open').
        find('.navigation__tier-1 > .navigation__item--open').
        removeClass('navigation__item--open');
      });

      // event: toggle third tier
      $mobileDrawer.on('click', '.navigation__tier-2 > .navigation__item > .navigation__children-toggle', function (evt) {
        evt.preventDefault();
        var doOpen = !$(this).parent().hasClass('navigation__item--open');
        if (doOpen) {
          $(this).parent().addClass('navigation__item--open');
          var $childContainer = $(this).siblings('.navigation__tier-3-container');
          $childContainer.css('height', $childContainer.children().outerHeight());
        } else {
          $(this).parent().removeClass('navigation__item--open');
          $(this).siblings('.navigation__tier-3-container').css('height', '');
        }
      });

      /// Desktop nav

      // reveal images
      setTimeout(() => theme.manualLazyload($nav[0]), 500);

      // hover events
      $nav.on('mouseenter mouseleave', '.navigation__tier-1 > .navigation__item--with-children', function (evt, data) {
        var $dropdownContainer = $(this);
        // delay on hover-out
        if (evt.type == 'mouseenter') {
          clearTimeout(navOpenTimeoutId);
          clearTimeout($dropdownContainer.data('navCloseTimeoutId'));
          var $openSiblings = $dropdownContainer.siblings('.navigation__item--show-children');

          // close all menus but last opened
          $openSiblings.not($navLastOpenDropdown).removeClass('navigation__item--show-children');
          $navLastOpenDropdown = $dropdownContainer;

          // show after a delay, based on first-open or not
          var timeoutDelay = $openSiblings.length == 0 ? 0 : navHoverDelay;

          // open it
          var newNavOpenTimeoutId = setTimeout(function () {
            theme.Navigation.alignPromos($dropdownContainer[0]);
            $dropdownContainer.addClass('navigation__item--show-children').
            siblings('.navigation__item--show-children').
            removeClass('navigation__item--show-children');
            $dropdownContainer.closest('.section-header').addClass('section-header--nav-open');
          }, timeoutDelay);

          navOpenTimeoutId = newNavOpenTimeoutId;
          $dropdownContainer.data('navOpenTimeoutId', newNavOpenTimeoutId);
        } else {
          // cancel opening, close after delay, and clear transforms
          clearTimeout($dropdownContainer.data('navOpenTimeoutId'));
          $dropdownContainer.data('navCloseTimeoutId', setTimeout(function () {
            $dropdownContainer.removeClass('navigation__item--show-children');
            $dropdownContainer.closest('.section-header').removeClass('section-header--nav-open');
          }, navHoverDelay));
        }
        // a11y
        $dropdownContainer.children('[aria-expanded]').attr('aria-expanded', evt.type == 'mouseenter');
      });

      // touch events on desktop
      var touchHandler = function (evt) {
        if ($(window).width() > 767) {
          if (evt.type == 'touchstart') {
            $(this).data('touchstartedAt', evt.timeStamp);
          } else if (evt.type == 'touchend') {
            // down & up in under a second - presume tap
            if (evt.timeStamp - $(this).data('touchstartedAt') < 1000) {
              $(this).data('touchOpenTriggeredAt', evt.timeStamp);
              if ($(this).parent().hasClass('navigation__item--show-children')) {
                // trigger close
                $(this).parent().trigger('mouseleave');
              } else {
                // trigger close on any open items
                $('.navigation:first .navigation__item--show-children').trigger('mouseleave');
                // trigger open
                $(this).parent().trigger('mouseenter');
              }
              // prevent fake click
              return false;
            }
          } else if (evt.type == 'click') {
            // if touch open was triggered very recently, prevent click event
            if ($(this).data('touchOpenTriggeredAt') && evt.timeStamp - $(this).data('touchOpenTriggeredAt') < 1000) {
              return false;
            }
          }
        }
      };

      $nav.delegateSimplePassiveEvent('touchstart', '.navigation__tier-1 > .navigation__item--with-children > .navigation__link', touchHandler);
      $nav.on('touchend click', '.navigation__tier-1 > .navigation__item--with-children > .navigation__link', touchHandler);

      // hit return on dropdown toggle
      var keydownHandler = function (evt) {
        if (evt.which == 13) {
          var $parent = $(this).parent();
          $parent.trigger($parent.hasClass('navigation__item--show-children') ? 'mouseleave' : 'mouseenter');
          return false;
        }
      };
      $nav.on('keydown', '.navigation__tier-1 > .navigation__item--with-children > .navigation__children-toggle', keydownHandler);

      // click #-link, open child nav
      $nav.on('click', '.navigation__link[href="#"][aria-haspopup="true"]', function () {
        $(this).siblings('.navigation__children-toggle').trigger('click');
        return false;
      });
    },

    alignPromos: function (dropdown) {
      let promos = dropdown.querySelectorAll('.navigation__columns--with-promos .menu-promotion');
      if (promos.length > 1) {
        let tallest = 0;
        for (let i = 0; i < promos.length; i++) {
          let promo = promos[i];
          if (promo.firstElementChild.classList.contains('menu-promotion__link')) {
            promo = promo.firstElementChild;
          }
          let promoInnerHeights = 0;
          for (let j = 0; j < promo.childNodes.length; j++) {
            let el = promo.childNodes[j];
            promoInnerHeights += el.offsetHeight;
            let cs = getComputedStyle(el);
            promoInnerHeights += parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
            if (j === 0) {
              promoInnerHeights -= parseFloat(cs.paddingBottom);
            }
          }
          if (promoInnerHeights > tallest) {
            tallest = promoInnerHeights;
          }
        }
        for (let i = 0; i < promos.length; i++) {
          let promo = promos[i];
          if (promo.firstElementChild.classList.contains('menu-promotion__link')) {
            promo = promo.firstElementChild;
          }
          let promoInnerHeights = 0;
          for (let j = 0; j < promo.childNodes.length; j++) {
            let el = promo.childNodes[j];
            promoInnerHeights += el.offsetHeight;
            let cs = getComputedStyle(el);
            promoInnerHeights += parseFloat(cs.marginTop) + parseFloat(cs.marginBottom) - parseFloat(cs.paddingTop);
            if (j === 0) {
              promoInnerHeights -= parseFloat(cs.paddingBottom);
            }
          }
          let toAdd = tallest - promoInnerHeights;
          if (toAdd > 0) {
            promo.closest('.menu-promotion').style.setProperty('--height-offset', toAdd + 'px');
          }
        }
      }
    },

    destroy: function ($nav) {
      $nav.off('click mouseenter mouseleave touchstart touchend keydown');
      $('.mobile-navigation-drawer').off('click').remove();
    }
  };

  const CCProductBlock = class extends HTMLElement {
    constructor() {
      super();

      this.manualLoad = this.hasAttribute('manual-load');

      if (!this.manualLoad) {
        theme.lazy.initScript(this, this.init.bind(this));
      }
    }

    init() {
      this.enableSwipe = this.hasAttribute('enable-swipe');
      this.images = this.querySelectorAll('.product-block__image');
      this.dots = this.querySelectorAll('.product-block__image-dot');
      this.product = JSON.parse(this.querySelector('script[type="application/json"].rebuy-prod-data').textContent);

      // first image and swatches may require manual loading
      theme.manualLazyload(this);

      if (this.isDesktop()) {
        // preload hover images after short delay
        setTimeout(() => {
          this.querySelectorAll('.product-block__image--show-on-hover.product-block__image--inactivated').forEach((el) => {
            this.lazyloadImage(el);
          });
        }, 250);
        // preload first carousel image after a delay
        setTimeout(() => {
          this.querySelectorAll('.product-block__image--show-on-hover + .product-block__image--inactivated').forEach((el) => {
            this.lazyloadImage(el);
          });
        }, 1000);
      } else {
        // preload hover image after longer delay
        setTimeout(() => {
          this.querySelectorAll('.product-block__image--show-on-hover.product-block__image--inactivated').forEach((el) => {
            this.lazyloadImage(el);
          });
        }, 1000);
      }

      this.monitorImagePagination();
      this.monitorSwatchSelection();
      if(this.classList.contains('rebuy-stepped-block')){
        // const product = this.product;
        const options = this.querySelector('.rebuy-product-options.two-step');
        if(options){
          options.style.setProperty('--step-one', $(this.querySelector('.product-block-options.swatch')).outerHeight() + 'px');
          options.style.setProperty('--step-two', $(this.querySelector('.product-block-options:not(.swatch)')).outerHeight() + 'px');
          options.classList.add('initiated');
          this.querySelectorAll('.product-block-options.swatch .product-block-options__item').forEach(opt => {
            opt.addEventListener('click', () => {
              rebuyBottomVarAvailability(this);
              options.classList.add('second-step');
            })
          })
        }
        this.querySelectorAll('.product-block-options:not(.swatch) .product-block-options__item').forEach(opt => {
          opt.addEventListener('click', () => {
            if(opt.classList.contains('is-unavailable')) return
            //this.querySelector('.quick-add-toggle').click()
            opt.classList.add('btn--in-progress');
            fetch(theme.routes.cart_add_url, {
              method: 'POST',
              body: JSON.stringify({
                items: [
                {
                  id: this.querySelector('.quick-add-toggle').dataset.variantId,
                  quantity: 1
                }]

              }),
              headers: {
                "Content-Type": "application/json"
              }
            }).
            then((response) => {
              opt.classList.remove('btn--in-progress');
              return response.json();
            }).
            then((response) => {
              if (!response.status || response.status === 200) {
                document.dispatchEvent(
                  new CustomEvent('theme:cartchanged', { bubbles: true, cancelable: false })
                );
                opt.classList.add('btn--cart-success');
                setTimeout(() => opt.classList.remove('btn--cart-success'), 600)
              } else if (response.description) {
                theme.showQuickPopup(response.description, $(opt));
              }
            });
          })
        })
        function rebuyBottomVarAvailability(prod){
          const swatchValue = prod.querySelector('.product-block-options.swatch .product-block-options__item.active')?.dataset.optionItem;
          if(!swatchValue) return;
          prod.querySelectorAll('.product-block-options:not(.swatch) .product-block-options__item').forEach(opt => {
            const v = prod.product.variants.find(v => v.option1 === swatchValue && v.option2 === opt.dataset.optionItem);
            if(!v) return;
            opt.classList.toggle('is-unavailable', !(v && (v.inventory_quantity > 0 || v.old_inventory_quantity > 0)))
          });
        }
        rebuyBottomVarAvailability(this);
      }
      else if(this.classList.contains('custom')){
        this.toggleAvailability();
        this.updateAjaxButtons();
        this.fetchReviews();
        const activeSwatch = this.querySelector('.product-block-options.swatch .product-block-options__item.active');
        if (activeSwatch) {
          let index = theme.elementIndex(this.querySelector('[data-media-id="' + activeSwatch.dataset.media + '"].product-block__image'));
          this.setActiveImage(index);
        }
        this.querySelectorAll('.product-block-options:not(.swatch) .product-block-options__item').forEach(opt => {
          opt.addEventListener('click', () => {
            if(opt.classList.contains('is-unavailable')) return
            //this.querySelector('.quick-add-toggle').click()
            opt.classList.add('btn--in-progress');
            fetch(theme.routes.cart_add_url, {
              method: 'POST',
              body: JSON.stringify({
                items: [
                {
                  id: this.querySelector('.quick-add-toggle').dataset.variantId,
                  quantity: 1
                }]

              }),
              headers: {
                "Content-Type": "application/json"
              }
            }).
            then((response) => {
              opt.classList.remove('btn--in-progress');
              return response.json();
            }).
            then((response) => {
              if (!response.status || response.status === 200) {
                document.dispatchEvent(
                  new CustomEvent('theme:cartchanged', { bubbles: true, cancelable: false })
                );
                opt.classList.add('btn--cart-success');
                setTimeout(() => opt.classList.remove('btn--cart-success'), 600)
              } else if (response.description) {
                theme.showQuickPopup(response.description, $(opt));
              }
            });
          })
        })
        this.addEventListener('mouseleave', () => {
          this.querySelector(".product-block-options:not(.swatch) .product-block-options__item.active")?.classList.remove('active')
        })

        this.querySelectorAll('.product-block-options.swatch .product-block-options__inner.collapsible').forEach(block => {
          if(this.closest('.product-slider') && document.body.classList.contains('template-product')){
            return;
          }
          let limit = 5;
          const itemCount = block.querySelectorAll('.product-block-options__item').length;
          if(itemCount <= limit){
            block.classList.remove('collapsible');
            return;
          }
          block.style.setProperty('--item-height', block.querySelector(' .product-block-options__item').offsetHeight + 'px');
          block.style.setProperty('--collapsible', itemCount);
          block.querySelectorAll(`.product-block-options__item:nth-child(${limit})`).forEach(opt => {
            opt.addEventListener('click', () => {
              if(!block.classList.contains('collapsed')) return;
              block.classList.remove('collapsed')
            })
          });
        })
        this.querySelectorAll('.product-block-options.swatch .product-block-options__inner.mobile-collapsible').forEach(block => {
          if(this.closest('.product-slider') && document.body.classList.contains('template-product')){
            let limit = 3;
            const itemCount = block.querySelectorAll('.product-block-options__item').length;
              // console.log(this.closest('.product-slider'))
            if(itemCount <= limit){
              block.classList.remove('mobile-collapsible');
              block.classList.remove('collapsible');
              return;
            }
            block.style.setProperty('--item-height', block.querySelector(' .product-block-options__item').offsetHeight + 'px');
            block.style.setProperty('--collapsible', itemCount);
            block.querySelectorAll(`.product-block-options__item:nth-child(${limit})`).forEach(opt => {
              opt.addEventListener('click', () => {
                if(!block.classList.contains('collapsed')) return;
                block.classList.remove('collapsed')
              })
            });
          }
        })
      }

    }

    
    async fetchReviews(){
        const id = this.dataset.productId;
        if(id){
            const url = `https://api.judge.me/api/v1/widgets/preview_badge?api_token=S8ACeVY_MYKAi3auL-smrgiJ8sE&shop_domain=rehallcom.myshopify.com&external_id=${id}`;
            try {
                const res = await fetch(url);
                const data = await res.json();
                // this.querySelector('.product-card__alt_price-wrapper').insertAdjacentHTML('beforeend', data.badge)

                // 1. Initialize the parser
                const parser = new DOMParser();

                // 2. Parse the string into an HTML document
                const doc = parser.parseFromString(data.badge, 'text/html');
                const badge = doc.querySelector('.jdgm-prev-badge')
                if(badge.dataset.averageRating && badge.dataset.averageRating != '0.00'){
                    badge.querySelector('.jdgm-prev-badge__text').innerHTML = `<span>${ parseFloat(badge.dataset.averageRating).toFixed(1) }</span>`;
                    this.querySelector('.product-block__price-row').append(badge)
                }
                
            } catch (e) {
                console.log(e)
                return null;
            }
        }
    }

    isDesktop() {
      return $(window).width() >= 768;
    }

    // get image at index, safely wraps index
    getImageAt(index) {
      // positive modulo, like it should be, JS does not do *maths* correctly
      return this.images[(index % this.images.length + this.images.length) % this.images.length];
    }

    lazyloadImage(imageContainer) {
      if (imageContainer && imageContainer.classList.contains('product-block__image--inactivated')) {
        const template = imageContainer.querySelector('template');
        template.parentElement.appendChild(template.content);
        template.remove();
        theme.buildBackgroundImage(imageContainer.querySelector('.js-background-image'));
        imageContainer.classList.remove('product-block__image--inactivated');
      }
    }

    incrementActiveImage(increment) {
      this.setActiveImage(
        theme.elementIndex(this.querySelector('.product-block__image--active')) + increment
      );
    }

    setActiveImage(index) {
      let newActive = this.getImageAt(index);
      if(!newActive) return;
      this.lazyloadImage(newActive);

      // set new active image visibility
      for (let i = 0; i < this.images.length; i++) {
        this.images[i].classList.remove('product-block__image--active');
      }
      newActive.classList.add('product-block__image--active');

      // set new hover image
      for (let i = 0; i < this.images.length; i++) {
        this.images[i].classList.remove('product-block__image--show-on-hover');
      }
      let hoverImage = this.getImageAt(index + 1);
      hoverImage.classList.add('product-block__image--show-on-hover');

      this.lazyloadImage(hoverImage);

      // dots
      for (let i = 0; i < this.dots.length; i++) {
        this.dots[i].classList.toggle('product-block__image-dot--active', i === index);
      }
    }
    toggleAvailability(){
      const swatchValue = this.querySelector('.product-block-options.swatch .product-block-options__item.active')?.dataset.optionItem;
      if(!swatchValue) return;
      this.querySelectorAll('.product-block-options:not(.swatch) .product-block-options__item').forEach(opt => {
        const v = this.product.variants.find(v => v.option1 === swatchValue && v.option2 === opt.dataset.optionItem);
        if(!v) return;
        opt.classList.toggle('is-unavailable', !(v.available))
      });
      this.querySelectorAll('.product-block-options:not(.swatch)').forEach(optBlock => {
        optBlock.classList.toggle('is-unavailable',optBlock.querySelector('.product-block-options__item:not(.is-unavailable)') === null)
      });
    }
    selectSwatch(evt, delegateTarget) {
      delegateTarget.parentElement.querySelector('.product-block-options__item.active')?.classList.remove('active');
      delegateTarget.classList.add('active');
      if(this.classList.contains('custom') && !this.classList.contains('rebuy-product-block')){
        this.toggleAvailability();
      }
      if (delegateTarget.dataset.media) {
        let index = theme.elementIndex(this.querySelector('[data-media-id="' + delegateTarget.dataset.media + '"].product-block__image'));
        this.setActiveImage(index);
      }
      // card colour metafield
      if (delegateTarget.dataset.cardBg) {
        this.swatchCardPropertySet = true;
        this.querySelector('.card-scheme').style.setProperty('--bg', delegateTarget.dataset.cardBg);
      } else if (this.swatchCardPropertySet) {
        this.querySelector('.card-scheme').style.removeProperty('--bg');
      }
      // include in URL
      const optionValues = [], productBlock = delegateTarget.closest('.product-block');
      
      productBlock.querySelectorAll('.product-block-options').forEach(opt => {
        // const optionName = opt.dataset.optionName;
        const optionValue = opt.querySelector('.product-block-options__item.active')? opt.querySelector('.product-block-options__item.active').dataset.optionItem : opt.querySelector('.product-block-options__item').dataset.optionItem;
        // options[optionName] = optionValue;
        optionValues.push(optionValue)
      })
      const cssSelector = optionValues.map(option => {
        return `[data-option-item*="${option}"]`;
      }).join("");
      const activeId = productBlock.querySelector(`.product__var_id${cssSelector}`)?.value;
      if(activeId){
        this.querySelectorAll('.product-link, .quickbuy-toggle').forEach((el) => {
          let url = new URL(el.href);
          let params = new URLSearchParams(url.search);
          params.set("variant", activeId);
          el.href = `${url.pathname}?${params}`;
          el.rel = 'nofollow';
        });
      }
      
      /*this.querySelectorAll('.product-link, .quickbuy-toggle').forEach((el) => {
        let url = new URL(el.href);
        let params = new URLSearchParams(url.search);
        const optionName = delegateTarget.closest('.product-block-options').dataset.optionName,
        optionValue = delegateTarget.dataset.optionItem;
        params.set(optionName, optionValue);
        
        el.href = `${url.pathname}?${params}`;
        el.rel = 'nofollow';
      });*/
      this.updateAjaxButtons();
    }
    updateAjaxButtons(){
      this.querySelectorAll('.quick-add-toggle').forEach((el) => {
        let optionString = '';
        const options = {};
        Array.from(this.querySelectorAll('.product-block-options')).slice().reverse().forEach((option, i) => {
          options[option.dataset.optionName] = option.querySelector('.product-block-options__item.active') ? option.querySelector('.product-block-options__item.active').dataset.optionItem : option.querySelector('.product-block-options__item:not(.is-unavailable)').dataset.optionItem;
          optionString += (i == 0? '':' / ') + options[option.dataset.optionName];
        })
        // el.dataset.variantId = optionString
        const variantId = el.querySelector(`input.product__var_id[data-option-item="${optionString}"]`)?.value || this.findVariantIdByOptions(el);
        if(!variantId) return;
        el.dataset.variantId = variantId;
        let url = new URL(el.href);
        let params = new URLSearchParams(url.search);
        for (const [key, value] of Object.entries(options)) {
          params.set(key, value);
        }

        el.href = `${url.pathname}?${params}`;
        el.rel = 'nofollow';
      });
    }
    // Fallback when the option rows don't line up with the variant titles, e.g. Globo split-by-colour cards,
    // which only list their own colour's variants: match the size row exactly and prefer the colour row
    findVariantIdByOptions(el) {
      const selectedValue = (row) => (row.querySelector('.product-block-options__item.active') || row.querySelector('.product-block-options__item:not(.is-unavailable)'))?.dataset.optionItem;
      const rows = Array.from(this.querySelectorAll('.product-block-options'));
      const required = rows.filter((row) => !row.classList.contains('swatch')).map(selectedValue);
      const preferred = rows.filter((row) => row.classList.contains('swatch')).map(selectedValue);
      const hasAll = (input, values) => {
        const parts = input.dataset.optionItem.split(' / ');
        return values.every((value) => parts.includes(value));
      };
      const candidates = Array.from(el.querySelectorAll('input.product__var_id')).filter((input) => hasAll(input, required));
      return (candidates.find((input) => hasAll(input, preferred)) || candidates[0])?.value;
    }
    monitorSwatchSelection() {
      if (this.querySelector('.product-block-options__item')) {
        theme.addDelegateEventListener(this, 'mouseover', '.product-block-options__item', this.selectSwatch.bind(this));
        theme.addDelegateEventListener(this, 'click', '.product-block-options__item', this.selectSwatch.bind(this));
      }
    }

    preloadAllImages() {
      for (let i = 0; i < this.images.length; i++) {
        this.lazyloadImage(this.images[i]);
      }
    }

    monitorImagePagination() {
      if (this.images.length > 1) {
        // next/prev button selection
        theme.addDelegateEventListener(this, 'click', '.image-page-button', function (evt, delegateTarget) {
          this.incrementActiveImage(delegateTarget.classList.contains('image-page-button--next') ? 1 : -1);
          // preload the rest
          this.preloadAllImages();
          evt.preventDefault();
          evt.stopPropagation();
        }.bind(this));

        // swipe, if enabled
        const imgCont = this.querySelector('.image-cont--with-secondary-image');
        if (this.enableSwipe && imgCont) {
          imgCont.addEventListener('touchstart', (evt) => {
            theme.productBlockTouchTracking = true;
            theme.productBlockTouchStartX = evt.touches[0].clientX;
            theme.productBlockTouchStartY = evt.touches[0].clientY;
            // preload next image on touchstart
            var nextImage = this.querySelector('.product-block__image--active + .product-block__image--inactivated');
            if (nextImage) {
              this.lazyloadImage(nextImage);
            }
          }, { passive: true });

          imgCont.addEventListener('touchmove', (evt) => {
            if (theme.productBlockTouchTracking) {
              if (Math.abs(evt.touches[0].clientY - theme.productBlockTouchStartY) < 30) {
                var deltaX = evt.touches[0].clientX - theme.productBlockTouchStartX;
                if (deltaX > 25) {
                  this.incrementActiveImage(-1);
                  theme.productBlockTouchTracking = false;
                  setTimeout(() => this.preloadAllImages(), 500);
                } else if (deltaX < -25) {
                  this.incrementActiveImage(1);
                  theme.productBlockTouchTracking = false;
                  setTimeout(() => this.preloadAllImages(), 500);
                }
              }
            }
          }, { passive: true });

          imgCont.addEventListener('touchend', (evt) => {
            theme.productBlockTouchTracking = false;
          });
        }
      }
    }
  };

  window.customElements.define('product-block', CCProductBlock);
  ;
  // container must be an element higher up the tree than the gallery
  theme.initProductGallery = function (container) {
    var $gallery = $('.gallery', container);
    if ($gallery.hasClass('gallery-initialised')) {
      return;
    }

    $gallery.addClass('gallery-initialised');

    /// Variant grouping
    if ($gallery.data('variant-image-grouping') && $gallery.data('variant-image-grouping-option-index') !== '') {
      let productData = theme.OptionManager.getProductData($gallery.closest('.product-detail').find('.product-form')),
        groupingOptionIndex = $gallery.data('variant-image-grouping-option-index');
      // build map of grouping options and featured media
      let optionNameMediaMap = {};
      productData.media.forEach((media) => {
        productData.variants.forEach((variant) => {
          if (variant.featured_media && variant.featured_media.id == media.id) {
            if (!optionNameMediaMap[variant.options[groupingOptionIndex]]) {
              optionNameMediaMap[variant.options[groupingOptionIndex]] = media.id;
            }
          }
        });
      });
      // set option name on each image
      let currentMediaOptionName = '';
      $gallery.find('.slide').each(function (index, item) {
        for (let optionName in optionNameMediaMap) {
          if ($(item).data('media-id') == optionNameMediaMap[optionName]) {
            currentMediaOptionName = optionName;
          }
        }
        $(item).attr('data-variant-image-group', currentMediaOptionName);
      });
      currentMediaOptionName = '';
      $gallery.find('.thumbnail').each(function (index, item) {
        for (let optionName in optionNameMediaMap) {
          if ($(item).data('media-id') == optionNameMediaMap[optionName]) {
            currentMediaOptionName = optionName;
          }
        }
        $(item).attr('data-variant-image-group', currentMediaOptionName);
      });
    }

    /// Init main image slideshow
    const $slideshow = $('.product-slideshow', container);
    if ($slideshow.length) {
      const slickConfig = {
        autoplay: false,
        fade: false,
        infinite: false,
        useTransform: true,
        dots: false,
        arrows: false,
        waitForAnimate: false,
        appendArrows: $slideshow.siblings('.slideshow-controls').find('.slideshow-controls__arrows'),
        prevArrow: '<button type="button" class="slick-prev" aria-label="' + theme.strings.previous + '">' + theme.icons.chevronLeft + '</button>',
        nextArrow: '<button type="button" class="slick-next" aria-label="' + theme.strings.next + '">' + theme.icons.chevronRight + '</button>',
        mobileFirst: true,
        rtl: document.querySelector('html[dir=rtl]') ? true : false,
        responsive: [
        {
          breakpoint: 768,
          settings: {
            fade: true,
            arrows: true
          }
        }]

      };

      $slideshow.on('beforeChange', function (evt, slick, current, next) {
        const mediaId = $(slick.$slides[next]).data('media-id');
        $($(this).closest('.gallery').find('.thumbnails:not(.hidden) .thumbnail[data-media-id="' + mediaId + '"]')).trigger('selectFromSlick');
      });

      if ($slideshow.closest('.gallery--layout-carousel-beside, .gallery--layout-carousel-under').length) {
        // carousel layout - slideshow all the time
        $slideshow.slick(slickConfig);
      } else {
        // collage layout - slideshow on mobile only
        const enforceMobileSlideshow = function () {
          if ($(window).width() < 768) {
            $slideshow.not('.slick-slider').each(function () {
              // remove desktop collage filter classes
              $(this).find('.slide--inactive-option').removeClass('slide--inactive-option');
              // init slideshow
              $(this).slick(slickConfig);
              // trigger variant select
              $(this).closest('.product-detail').find('.original-selector').trigger('change');
            });
          } else {
            $slideshow.filter('.slick-slider').each(function () {
              $(this).slick('slickUnfilter').slick('unslick');
              // trigger variant select
              $(this).closest('.product-detail').find('.original-selector').trigger('change');
            });
          }
        };
        enforceMobileSlideshow();
        $(window).on('debouncedresize.productGallery', enforceMobileSlideshow);
      }

      // media initialisation
      theme.ProductMedia.init($gallery, {
        onYoutubeInit: function (playerObj) {
          if ($slideshow.hasClass('slick-slider')) {
            theme.productGallerySlideshowTabFix($slideshow.slick('getSlick').$slides, $slideshow.slick('getSlick').currentSlide);
          }
        },
        onModelViewerInit: function (element) {
          if ($slideshow.hasClass('slick-slider')) {
            theme.productGallerySlideshowTabFix($slideshow.slick('getSlick').$slides, $slideshow.slick('getSlick').currentSlide);
          }
        },
        onVideoVisible: function (e) {
          if ($(window).width() >= 768) {
            $(e.target).closest('.slick-slider').slick('slickSetOption', 'swipe', false);
          }
        },
        onModelViewerPlay: function (e) {
          // prevent swiping
          $(e.target).closest('.slick-slider').slick('slickSetOption', 'swipe', false);
          // prevent left/right key control
          $(e.target).closest('.slick-slider').slick('slickSetOption', 'accessibility', false);
        },
        onModelViewerPause: function (e) {
          $(e.target).closest('.slick-slider').slick('slickSetOption', 'swipe', true);
          $(e.target).closest('.slick-slider').slick('slickSetOption', 'accessibility', true);
        }
      });

      // fix tabindex for first slide
      if ($slideshow.hasClass('slick-slider')) {
        theme.productGallerySlideshowTabFix($slideshow.slick('getSlick').$slides, $slideshow.slick('getSlick').currentSlide);
      }

      $slideshow.on('afterChange', function (evt, slick, current) {
        // reset playing media
        theme.pauseAllMedia();
        if ($(window).width() >= 768) {
          slick.slickSetOption('swipe', true);
        }
        // notify media of visibility
        $('.product-media', slick.$slides[current]).trigger('mediaVisible');
        // slideshow tab fix
        theme.productGallerySlideshowTabFix(slick.$slides, current);
      });
    }

    var $thumbnails = $('.thumbnails:not(.hidden)', container);
    if ($thumbnails.length) {
      /// Thumbnail click
      // Events:
      // click: click on a thumbnail
      // select: selection via variant image
      // selectFromSlick: change of main image
      //
      // 'selectFromSlick' is treated as the 'primary' driver of state change, select/click to just update the main image slideshow,
      // and an after-transition callback updates the thumbnail

      $('.gallery', container).on('click select selectFromSlick', '.thumbnail', function (e) {
        e.preventDefault();

        // ensure visible
        this.closest('cc-carousel').get().selectItem(this);

        if (e.type != 'selectFromSlick') {
          // from click or variant image

          // change main image
          let index = 0;
          const mediaId = $(this).data('media-id');
          $(this).parent().children(':visible').each(function (iter) {
            index = iter;
            if ($(this).data('media-id') == mediaId) {
              return false;
            }
          });
          // same index? manual trigger of next event (if slideshow)
          const $slideshow = $(this).closest('.gallery').find('.slick-slider');
          if ($slideshow.length) {
            const slick = $slideshow.slick('getSlick');
            if (slick.currentSlide === index) {
              // current slide active, manually trigger from-slick thumb selection (req. for index changes during filtering)
              $(this).trigger('selectFromSlick');
            } else {
              // change slide
              $slideshow.slick('slickGoTo', index);
            }
          }
        } else {
          // change to active state comes from the main slideshow change event
          $(this).addClass('selected').siblings('.selected').removeClass('selected');
        }
      });
    }
  };

  theme.destroyProductGallery = function (container) {
    $(window).off('.productGallery');
    var $gallery = $('.gallery', container).off('click select selectFromSlick');
    theme.ProductMedia.destroy($gallery);
    $('.slick-slider', container).slick('unslick').off('init beforeChange afterChange');
  };

  /* Product Media
   *
   * Load and destroy:
   * theme.ProductMedia.init(galleryContainer, {
   *   onModelViewerPlay: function(e){
   *     $(e.target).closest('.slick-slider').slick('slickSetOption', 'swipe', false);
   *   },
   *   onModelViewerPause: function(e){
   *     $(e.target).closest('.slick-slider').slick('slickSetOption', 'swipe', true);
   *   }
   * });
   *
   * theme.ProductMedia.destroy(galleryContainer);
   */
  theme.ProductMedia = new function () {
    var _ = this;

    _._setupShopifyXr = function () {
      if (!window.ShopifyXR) {
        document.addEventListener('shopify_xr_initialized', _._setupShopifyXr.bind(this));
        return;
      }

      window.ShopifyXR.addModels(JSON.parse($(this).html()));
      window.ShopifyXR.setupXRElements();
    };

    this.init = function (container, callbacks) {
      var callbacks = callbacks || {},
        _container = container;

      // set up video media elements with a controller
      $(container).find('.product-media--video').each(function (index) {
        let poster = this.querySelector('.product-media__poster');
        $('.product-media__video-play-btn', poster).on('click', function () {
          $(this).closest('.product-media--video').data('player').play();
        });

        let playerObj = { container: this, poster: poster };
        playerObj.play = function () {
          // pause anything else
          theme.pauseAllMedia();

          // hide poster
          this.poster.classList.add('product-media__poster--hide');
          $(this).closest('.slick-slider').slick('setPosition');

          // play
          this.container.querySelectorAll('.js-youtube').forEach((video) => {
            video.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          });
          this.container.querySelectorAll('.js-vimeo').forEach((video) => {
            video.contentWindow.postMessage('{"method":"play"}', '*');
          });
          this.container.querySelectorAll('video').forEach((video) => video.play());
        }.bind(playerObj);

        // instantiate videos
        const template = this.querySelector('.product-media__video-template');
        if (template) {
          this.insertAdjacentHTML('beforeend', template.innerHTML);
          this.removeChild(template);
          this.style.paddingBottom = 100 / this.querySelector('video, iframe').getAttribute('aspect-ratio') + '%';
        }

        $(this).data('player', playerObj).addClass('product-media--video-loaded');
      });

      // when any media appears
      $(container).on('mediaVisible', '.product-media--video-loaded, .product-media--model-loaded', function () {
        // autoplay all media on larger screens
        if ($(window).width() >= 768) {
          $(this).data('player').play();
        }
        // update view-in-space
        if ($(this).hasClass('product-media--model')) {
          $('.view-in-space', _container).attr('data-shopify-model3d-id', $(this).data('model-id'));
        }
      });

      // necessary callbacks
      if (callbacks.onVideoVisible) {
        $(container).on('mediaVisible', '.product-media--video-loaded', callbacks.onVideoVisible);
      }

      $('model-viewer', container).each(function () {
        if (callbacks.onModelViewerPlay) {
          $(this).on('shopify_model_viewer_ui_toggle_play', callbacks.onModelViewerPlay);
        }
        if (callbacks.onModelViewerPause) {
          $(this).on('shopify_model_viewer_ui_toggle_pause', callbacks.onModelViewerPause);
        }
      });

      // set up a 3d model when it first appears
      $(container).on('mediaVisible mediaVisibleInitial', '.product-media--model:not(.product-media--model-loaded)', function (e) {
        var element = $(this).find('model-viewer')[0],
          autoplay = e.type != 'mediaVisibleInitial';
        // load viewer
        theme.loadStyleOnce('https://cdn.shopify.com/shopifycloud/model-viewer-ui/assets/v1.0/model-viewer-ui.css');
        window.Shopify.loadFeatures([
        {
          name: 'model-viewer-ui',
          version: '1.0',
          onLoad: function () {
            $(this).data('player', new Shopify.ModelViewerUI(element));
            // set class and re-trigger visible event now loaded
            $(this).addClass('product-media--model-loaded');
            if (callbacks.onModelViewerInit) {
              callbacks.onModelViewerInit(element);
            }
            if (autoplay) {
              $(this).trigger('mediaVisible');
            }
          }.bind(this)
        }]
        );
      });

      // load AR viewer
      if ($('.model-json', container).length) {
        window.Shopify.loadFeatures([
        {
          name: 'shopify-xr',
          version: '1.0',
          onLoad: _._setupShopifyXr.bind($('.model-json', container))
        }]
        );
      }

      // pause other media when a 3d model is launched in AR
      $(document).on('shopify_xr_launch', function () {
        theme.pauseAllMedia({ videos: true });
      });

      // 3d model in first place - start in paused mode
      setTimeout(function () {
        $('.product-slideshow.slick-slider .product-media:first', this).filter('.product-media--model').trigger('mediaVisibleInitial');
        $('.product-slideshow:not(.slick-slider) .product-media--model', this).trigger('mediaVisibleInitial');
      }.bind(container), 50);
    };

    this.destroy = function (container) {
      $(document).off('shopify_xr_launch');
      $(container).off('mediaVisible mediaVisibleInitial');
      $('.product-media--model-loaded', container).each(function () {
        $(this).data('player').destroy();
      });
      $('.product-media--video video', container).off('playing pause ended');
      $('model-viewer', container).off('shopify_model_viewer_ui_toggle_play shopify_model_viewer_ui_toggle_pause');
    };
  }();

  theme.productGallerySlideshowTabFix = function (slides, current) {
    // tabindex everything to prevent tabbing into hidden slides
    $(slides[current]).find('a, input, button, select, iframe, video, model-viewer, [tabindex]').each(function () {
      if (typeof $(this).data('theme-slideshow-original-tabindex') !== 'undefined') {
        if ($(this).data('theme-slideshow-original-tabindex') === false) {
          $(this).removeAttr('tabindex');
        } else {
          $(this).attr('tabindex', $(this).data('theme-slideshow-original-tabindex'));
        }
      } else {
        $(this).removeAttr('tabindex');
      }
    });
    $(slides).not(slides[current]).find('a, input, button, select, iframe, video, model-viewer, [tabindex]').each(function () {
      if (typeof $(this).data('theme-slideshow-original-tabindex') === 'undefined') {
        $(this).data('theme-slideshow-original-tabindex',
        typeof $(this).attr('tabindex') !== 'undefined' ?
        $(this).attr('tabindex') :
        false
        );
        $(this).attr('tabindex', '-1');
      }
    });
  };

  // Manage option dropdowns
  theme.productData = {};
  theme.OptionManager = new function () {
    var _ = this;

    _._getVariantOptionElement = function (variant, $container) {
      return $container.find('select[name="id"] option[value="' + (variant ? variant.id : '') + '"]');
    };

    _.selectors = {
      container: '.product-detail',
      gallery: '.gallery',
      priceArea: '.price-area',
      variantIdInputs: '[name="id"]',
      purchaseForm: '.product-purchase-form',
      primaryVariantIdInput: '.product-purchase-form [name="id"]',
      submitButton: '.product-purchase-form button[type="submit"]',
      multiOption: '.option-selectors',
      customOption: '.custom-option',
      installmentsFormSuffix: '-installments'
    };

    _.strings = {
      buttonDefault: theme.strings.products_product_add_to_cart,
      buttonNoStock: theme.strings.products_variant_no_stock,
      buttonNoVariant: theme.strings.products_variant_non_existent
    };

    _.getProductData = function ($form) {
      var productId = $form.data('product-id');
      var data = null;
      if (!theme.productData[productId]) {
        theme.productData[productId] = JSON.parse(document.querySelector(`script[data-product-json="${productId}"]`).innerHTML);
      }
      data = theme.productData[productId];
      if (!data) {
        console.log('Product data missing (id: ' + $form.data('product-id') + ')');
      }
      return data;
    };

    _.getVariantFromId = function ($productForm, id) {
      const variants = this.getProductData($productForm).variants;
      for (let i = 0; i < variants.length; i++) {
        if (variants[i].id == id) {
          return variants[i];
        }
      }
      return { available: false };
    };

    _.getCurrentVariantData = function ($productForm) {
      return _.getVariantFromId($productForm, $productForm.find(_.selectors.primaryVariantIdInput).val());
    };

    _.getBaseUnit = function (variant) {
      return variant.unit_price_measurement.reference_value === 1 ?
      variant.unit_price_measurement.reference_unit :
      variant.unit_price_measurement.reference_value +
      variant.unit_price_measurement.reference_unit;
    },

    _.addVariantUrlToHistory = function (variant) {
      if (variant) {
        var newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + '?variant=' + variant.id;
        window.history.replaceState({ path: newurl }, '', newurl);
      }
    };

    _.updateSku = function (variant, $container) {
      $container.find('.sku .sku__value').html(variant ? variant.sku : '');
      $container.find('.sku').toggleClass('sku--no-sku', !variant || !variant.sku);
    };

    _.updateBarcode = function (variant, $container) {
      $container.find('.barcode .barcode__value').html(variant ? variant.barcode : '');
      $container.find('.barcode').toggleClass('barcode--no-barcode', !variant || !variant.barcode);
    };

    _.updateTransferNotice = function (variant, $container) {
      var transferData = _._getVariantOptionElement(variant, $container).data('inventory-transfer');
      if (transferData) {
        $container.find('.product-inventory-transfer').removeClass('product-inventory-transfer--none').html(transferData);
      } else {
        $container.find('.product-inventory-transfer').addClass('product-inventory-transfer--none').empty();
      }
    };

    _.updateVariantDeterminedVisibilityAreas = function (variant, $container) {
      $container.find('.variant-visibility-area').each(function () {
        $(this).children(':not(script)').remove();
        if (variant) {
          $(this).append($(this).children('script[data-variant-id="' + variant.id + '"]').html());
        } else {
          $(this).append($(this).children('script[data-variant-id=""]').html());
        }
      });
    };

    _.updateBackorder = function (variant, $container) {
      var $backorder = $container.find('.backorder');
      if ($backorder.length) {
        if (variant && variant.available) {
          if (variant.inventory_management && _._getVariantOptionElement(variant, $container).data('stock') == 'out') {
            var productData = _.getProductData($backorder.closest('.product-form'));
            $backorder.find('.backorder__variant').html(productData.title + (variant.title.indexOf('Default') >= 0 ? '' : ' - ' + variant.title));
            $backorder.show();
          } else {
            $backorder.hide();
          }
        } else {
          $backorder.hide();
        }
      }
    };

    _._updateButtonText = function ($button, string, variant) {
      $button.each(function () {
        var newVal;
        newVal = _.strings['button' + string];
        if (newVal !== false) {
          if ($(this).is('input')) {
            $(this).val(newVal);
          } else {
            $(this).html(newVal);
          }
        }
      });
    };

    _.updateButtons = function (variant, $container) {
      var $button = $container.find(_.selectors.submitButton);

      if (variant) {
        $button.removeAttr('disabled');
        if (variant.available == true) {
          _._updateButtonText($button, 'Default', variant);
        } else {
          _._updateButtonText($button, 'NoStock', variant);
        }
      } else {
        if (theme.getEmptyOptionSelectors($container).length) {
          $button.removeAttr('disabled');
          _._updateButtonText($button, 'Default', variant);
        } else {
          $button.attr('disabled', 'disabled');
          _._updateButtonText($button, 'NoVariant', variant);
        }
      }
    };

    _.updateContainerStatusClasses = function (variant, $container) {
      $container.toggleClass('variant-status--not-selected', !variant);
      $container.toggleClass('variant-status--unavailable', variant && !variant.available);
      $container.toggleClass('variant-status--backorder', variant &&
      variant.available &&
      variant.inventory_management &&
      _._getVariantOptionElement(variant, $container).data('stock') == 'out');
      $container.toggleClass('variant-status--on-sale', variant &&
      variant.available &&
      variant.compare_at_price > variant.price);
    };

    _.updateCardBG = function (variant, $container) {
      if (variant) {
        const bg = _._getVariantOptionElement(variant, $container).data('card-bg');
        if (bg) {
          $container[0].querySelector('.gallery__inner').style.setProperty('--bg', bg);
          return;
        }
      }
      $container[0].querySelector('.gallery__inner').style.removeProperty('--bg');
    };

    _.selectOptionFromURL = function (productUrl, $productForm) {
      let searchParams = null;
      if (productUrl && productUrl.indexOf('?') >= 0) {
        searchParams = new URLSearchParams(productUrl.split('?')[1]);
      } else if (productUrl !== false) {
        searchParams = new URLSearchParams(location.search);
      }

      for (let key of searchParams.keys()) {
        if (key == 'variant') {
          _.setVariant($productForm, searchParams.get(key));
        } else {
          $productForm.find('.option-selector').filter(function () {
            return this.querySelector('.label').firstChild.textContent === key;
          }).each(function () {
            const value = searchParams.get(key);
            if (this.dataset.selectorType == 'dropdown') {
              this.querySelector('.cc-select').dispatchEvent(
                new CustomEvent('selectOption', { detail: { value: value } })
              );
            } else {
              this.querySelectorAll('.opt-label__text').forEach((el) => {
                if (el.innerText == value) {
                  const input = document.getElementById(el.parentElement.getAttribute('for'));
                  if (input) {
                    input.checked = true;
                    input.dispatchEvent(
                      new CustomEvent('change', { bubbles: true, cancelable: false })
                    );
                  }
                }
              });
            }
          });
        }
      }
    };

    _.setVariant = function ($productForm, id) {
      let variant = _.getVariantFromId($productForm, id);
      $productForm.find('.option-selector').each(function () {
        const value = variant.options[parseInt(this.dataset.optionIndex)];
        if (this.dataset.selectorType == 'dropdown') {
          this.querySelector('.cc-select').dispatchEvent(
            new CustomEvent('selectOption', { detail: { value: value } })
          );
        } else {
          this.querySelectorAll('.opt-label__text').forEach((el) => {
            if (el.innerText == value) {
              const input = document.getElementById(el.parentElement.getAttribute('for'));
              if (input && !input.checked) {
                input.checked = true;
                input.dispatchEvent(
                  new CustomEvent('change', { bubbles: true, cancelable: false })
                );
              }
            }
          });
        }
      });
      // the above should trigger variant change events
    };

    _.initProductOptions = function ($productForm, productUrl) {
      if ($productForm.hasClass('theme-init')) return;

      var productData = _.getProductData($productForm);
      $productForm.addClass('theme-init');

      // init option selectors
      $productForm.find(_.selectors.multiOption).on('change.themeProductOptions', function (e) {
        // const targetSelector = e.target.closest('.option-selector');
        // console.log(e)
        var selectedOptions = [];
        const isMatched = (parentArray, subsetArray) => {
          return subsetArray.every((element,i) => parentArray[i] === element);
        };
        $(this).find('.option-selector').each(function () {
          let checked = true;
          if ($(this).data('selector-type') === 'listed') {
            if(checked){
              let currSelected = $(this).find('.js-option:checked').val();
              const v = productData.variants.find(v => isMatched(v.options, [...selectedOptions, currSelected]) && v.available)
              if(!v){
                if($(this).find('.js-option:checked')[0] === e.target)
                checked = false;
                else{
                  const newV = productData.variants.find(v => isMatched(v.options, selectedOptions) && v.available)
                  if(newV){
                    const opt = $(this).find(`.js-option[value="${newV['option'+($(this).data('option-index') + 1)]}"]`)
                    if(opt)
                      $(opt).prop('checked', true);
                  }
                }
              }
            }
            selectedOptions.push($(this).find('.js-option:checked').val());
          } else {
            selectedOptions.push($(this).find('.js-option[aria-selected="true"]').data('value'));
          }
        });

        // find variant
        var variant = false;
        for (var i = 0; i < productData.variants.length; i++) {
          var v = productData.variants[i];
          var matchCount = 0;
          for (var j = 0; j < selectedOptions.length; j++) {
            if (v.options[j] == selectedOptions[j]) {
              matchCount++;
            }
          }
          if (matchCount == selectedOptions.length) {
            variant = v;
            break;
          }
        }

        // trigger change
        $productForm.find(_.selectors.variantIdInputs).val(variant.id);

        // a jQuery event may not be picked up by all listeners
        $productForm.find(_.selectors.variantIdInputs).each(function () {
          this.dispatchEvent(
            new CustomEvent('change', { bubbles: true, cancelable: false, detail: { variant: variant, selectedOptions: selectedOptions } })
          );
        });
      });

      // init custom options (mirror in purchase form for Buy Now button)
      $productForm.find(_.selectors.customOption).each(function () {
        const $input = $(this).find('input:first, textarea, select');
        $('<input type="hidden">').attr({
          name: $input.attr('name'),
          value: $input.val()
        }).appendTo($productForm.find(_.selectors.purchaseForm));
      }).on('change.themeProductOptions', function () {
        const $radios = $(this).find('input[type="radio"]'),
          $checkbox = $(this).find('input[type="checkbox"]');
        if ($radios.length) {
          // radio buttons
          $productForm.find(_.selectors.purchaseForm + ' input').filter(function () {
            return this.name === $radios[0].name;
          }).val($radios.filter(':checked').val()).trigger('change');
        } else if ($checkbox.length) {
          // checkbox
          let val = null;
          if ($checkbox.is(':checked')) {
            val = $checkbox.val();
          } else {
            val = $checkbox.siblings('[type="hidden"]').val();
          }
          $productForm.find(_.selectors.purchaseForm + ' input').filter(function () {
            return this.name === $checkbox[0].name;
          }).val(val).trigger('change');
        } else {
          // other inputs
          const $input = $(this).find('select, input, textarea');
          $productForm.find(_.selectors.purchaseForm + ' input').filter(function () {
            return this.name === $input.attr('name');
          }).val($input.val()).trigger('change');
        }
      });

      // init variant ids
      $productForm.find(_.selectors.primaryVariantIdInput).each(function () {
        // change state for original dropdown
        $(this).on('change.themeProductOptions firstrun.themeProductOptions', function (e) {
          if ($(this).is('input[type=radio]:not(:checked)')) {
            return; // handle radios - only update for checked
          }
          // If variant is passed in, use that. Even if 'false'. If nothing is passed, find from input value.
          var variant = e.detail ? e.detail.variant : null;
          if (!variant && variant !== false) {
            for (var i = 0; i < productData.variants.length; i++) {
              if (productData.variants[i].id == $(this).val()) {
                variant = productData.variants[i];
              }
            }
          }
          var $container = $(this).closest(_.selectors.container);

          // string overrides
          var $addToCart = $container.find(_.selectors.submitButton).filter('[data-add-to-cart-text]');
          if ($addToCart.length) {
            _.strings.buttonDefault = $addToCart.data('add-to-cart-text');
          }

          // update buttons
          _.updateButtons(variant, $container);

          // emit an event to broadcast the variant update
          $(window).trigger('cc-variant-updated', {
            variant: variant,
            product: productData
          });

          // variant images
          if (variant && variant.featured_media) {
            // variant passed
            $container.find(_.selectors.gallery).trigger('variantImageSelected', [variant, e.type === 'firstrun']);
          } else if (e.detail && e.detail.selectedOptions) {
            // if some options selected, find the first matching variant for image
            var matchesRequired = e.detail.selectedOptions.filter((o) => o.length > 0).length;
            if (matchesRequired > 0) {
              for (var i = 0; i < productData.variants.length; i++) {
                var v = productData.variants[i];
                var matchCount = 0;
                for (var j = 0; j < e.detail.selectedOptions.length; j++) {
                  if (v.options[j] == e.detail.selectedOptions[j]) {
                    matchCount++;
                  }
                }
                if (matchCount == matchesRequired && v.featured_media) {
                  $container.find(_.selectors.gallery).trigger('variantImageSelected', [v, e.type === 'firstrun']);
                  break;
                }
              }
            }
          }

          // extra details
          _.updateBarcode(variant, $container);
          _.updateSku(variant, $container);
          _.updateTransferNotice(variant, $container);
          _.updateVariantDeterminedVisibilityAreas(variant, $container);
          _.updateBackorder(variant, $container);
          _.updateContainerStatusClasses(variant, $container);
          _.updateCardBG(variant, $container);

          // variant urls
          if ($productForm.data('enable-history-state') && e.type == 'change') {
            _.addVariantUrlToHistory(variant);
          }

          // allow other things to hook on
          $productForm.trigger('variantChanged', [variant, productData]);
        });

        // first-run
        $(this).trigger('firstrun');
      });

      // ajax
      theme.applyAjaxToProductForm($productForm);

      // apply URL params
      if ($productForm.closest('.quickbuy-modal').length === 0) {
        _.selectOptionFromURL(productUrl, $productForm);
      }
    };

    _.unloadProductOptions = function ($productForm) {
      $productForm.removeClass('theme-init').each(function () {
        $(this).trigger('unloading').off('.themeProductOptions');
        $(this).find(_.selectors.multiOption).off('.themeProductOptions');
        $(this).find(_.selectors.customOption).off('.themeProductOptions');
        theme.removeAjaxFromProductForm($productForm);
      });
    };
  }();

  theme.loadQuickbuy = function () {
    // handle components
    function loadComponents(componentContainer) {
      $(componentContainer).closest('[data-components]').each(function () {
        $(this).data('components').split(',').forEach((component) => {
          $(document).trigger('cc:component:load', [component, componentContainer]);
        });
      });

      $(document).trigger('cc:component:load', ['custom-select', '.quickbuy-modal']);
    }

    // quick add
    if (theme.settings.quickbuy_style == 'button-quick-add') {
      $(document).on('click', '.quick-add', (evt) => {
        evt.preventDefault();
        if(evt.currentTarget.querySelector(`.product__var_id[value="${evt.currentTarget.dataset.variantId}"][data-available="false"]`)){
          theme.showQuickPopup("Sorry, The selected variant of this product is already sold out!", $(evt.currentTarget));
          return;
        }
        evt.currentTarget.classList.add('btn--in-progress');
        fetch(theme.routes.cart_add_url, {
          method: 'POST',
          body: JSON.stringify({
            items: [
            {
              id: evt.currentTarget.dataset.variantId,
              quantity: 1
            }]

          }),
          headers: {
            "Content-Type": "application/json"
          }
        }).
        then((response) => {
          evt.currentTarget.classList.remove('btn--in-progress');
          return response.json();
        }).
        then((response) => {
          if (!response.status || response.status === 200) {
            document.dispatchEvent(
              new CustomEvent('theme:cartchanged', { bubbles: true, cancelable: false })
            );

            if (theme.settings.cart_type == 'drawer') {
              const prodBlock = evt.currentTarget.closest('product-block.custom')
              if(prodBlock){
                 toastr["info"](`<div class="toast-wrap"><div class="toast-img-wrap">${prodBlock.querySelector('.product-block__image .inline-image__image') != null? prodBlock.querySelector('.product-block__image .inline-image__image').outerHTML: prodBlock.querySelector('.product-block__image').outerHTML}</div><div class="toast-text-content"><h4 class="toast-heading">${theme.strings.cart_notify}</h4><p class="toast-desc">${prodBlock.querySelector('.product-block__title').textContent}</p><div class="toast-cart-bottom"><div class="toast-cart-price">${prodBlock.querySelector('.product-price__amount').textContent}</div><div class="toast-cart-variant">${theme.strings.cart_variant}: ${prodBlock.querySelector('.product__floating-bar .product-block-options__item.active') == null ?prodBlock.querySelector('.product__floating-bar .product-block-options__item .product-block-options__item__text').textContent: prodBlock.querySelector('.product__floating-bar .product-block-options__item.active .product-block-options__item__text').textContent}</div></div></div></div>`);
                //toastr["info"]("I do not think that means what you think it means.");
                evt.currentTarget.classList.add('check');
                setTimeout(() => {
                  evt.currentTarget.classList.remove('check');
                }, 1500)
              }
              /*document.dispatchEvent(
                new CustomEvent('theme:open-cart-drawer', { bubbles: true, cancelable: false })
              );*/
            } else {
              theme.showQuickPopup(theme.strings.products_product_added_to_cart, evt.currentTarget);
            }
          } else if (response.description) {
            theme.showQuickPopup(response.description, $(evt.currentTarget));
          }
        });
      });
    }

    // quick buy - managing quickbuy
    $(document).on('click', '.quickbuy-toggle', function () {
      let productUrl = $(this).attr('href');

      // hide other modals
      document.dispatchEvent(
        new CustomEvent('theme:close-cart-drawer', { bubbles: true, cancelable: false })
      );
      $('.quickbuy-modal.cc-popup--visible').each(function () {
        $(this).data('cc-popup').close();
      });

      var $block = $(this).closest('.product-block, .product-mini-block'),
        $quickbuyCont = $block.find('.quickbuy-modal');

      // create or find quickbuy container
      const qbId = 'Quickbuy-' + $block.data('product-id');
      let qbCont = document.getElementById(qbId);
      if (!qbCont) {
        // create template
        qbCont = document.getElementById('ModalTemplate').content.cloneNode(true);
        qbCont.firstElementChild.id = qbId;
        document.body.appendChild(qbCont);
        qbCont = document.getElementById(qbId);
        // assign and create popup
        $quickbuyCont = $(qbCont);
        const popup = new ccPopup($(qbCont), qbId);
        qbCont.querySelector('.cc-popup-close').addEventListener('click', () => {
          theme.pauseAllMedia();
          popup.close();
        });
        qbCont.querySelector('.cc-popup-background').addEventListener('click', () => {
          theme.pauseAllMedia();
          popup.close();
        });
        $quickbuyCont.data('cc-popup', popup);
      } else {
        $quickbuyCont = $(qbCont);
      }

      $quickbuyCont.data('cc-popup').open();

      if (!$quickbuyCont.hasClass('quickbuy-loaded')) {
        $quickbuyCont.addClass('quickbuy-loaded');
        // load in content
        $.get(productUrl, function (response) {
          var $newDetail = $('<div>' + response + '</div>').find('.quickbuy-content');

          // convert to quickbuy content
          $newDetail.find('.read-more').attr('href', productUrl);
          $newDetail.find('.detail .title').wrapInner($('<a>').attr('href', productUrl));
          $newDetail.find('.not-in-quickbuy').remove();
          $newDetail.find('.only-in-quickbuy').removeClass('only-in-quickbuy');
          $newDetail.find('.off-card-container').removeClass('off-card-container');
          $newDetail.find('.store-availability-container').remove();
          $newDetail.find('[data-enable-history-state="true"]').attr('data-enable-history-state', 'false');
          $newDetail.find('.gallery .thumbnails').addClass('hidden-on-desktop');
          ['gallery--layout-carousel-beside', 'gallery--layout-carousel-under', 'gallery--layout-columns-2', 'gallery--layout-collage-1', 'gallery--layout-collage-2'].forEach((cl) => {
            $newDetail.find('.' + cl).removeClass(cl).addClass('gallery--layout-columns-1');
          });
          $newDetail.find('.product-form').toggleClass('sticky-content-container', theme.settings.qb_enable_sticky_cols);

          $quickbuyCont.attr('data-components', $newDetail.closest('[data-components]').attr('data-components'));
          $quickbuyCont.find('.loading-spinner').remove();
          $quickbuyCont.find('.cc-popup-content').append($newDetail);
          theme.suffixIds($quickbuyCont[0], qbId);

          // set roles
          $newDetail.find('.detail .title').attr('id', qbId + '-Title');
          $quickbuyCont.find('.cc-popup-modal').attr('aria-labelledby', qbId + '-Title');

          // the order of these is important:
          theme.initProductGallery($quickbuyCont); // 1
          $quickbuyCont.find('.product-form').
          trigger('load-product-form', { productUrl: productUrl }); // 2
          loadComponents($quickbuyCont); // 3
          theme.initAnimateOnScroll(); // 4
          theme.OptionManager.selectOptionFromURL(productUrl, $quickbuyCont.find('.product-form')); // 5
        }).fail(function () {
          $quickbuyCont.removeClass('quickbuy-loaded');
        });
      } else {
        setTimeout(() => {
          theme.OptionManager.selectOptionFromURL(productUrl, $quickbuyCont.find('.product-form'));
        }, 40);
      }
      return false;
    });
  };

  $(function () {
    $(document).on('click', '.sharing a', function (e) {
      var $parent = $(this).parent();
      if ($parent.hasClass('twitter')) {
        e.preventDefault();
        var url = $(this).attr('href');
        var width = 575,
          height = 450,
          left = ($(window).width() - width) / 2,
          top = ($(window).height() - height) / 2,
          opts = 'status=1, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0' +
          ',width=' + width +
          ',height=' + height +
          ',top=' + top +
          ',left=' + left;
        window.open(url, 'Twitter', opts);

      } else if ($parent.hasClass('facebook')) {
        e.preventDefault();
        var url = $(this).attr('href');
        var width = 626,
          height = 256,
          left = ($(window).width() - width) / 2,
          top = ($(window).height() - height) / 2,
          opts = 'status=1, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0' +
          ',width=' + width +
          ',height=' + height +
          ',top=' + top +
          ',left=' + left;
        window.open(url, 'Facebook', opts);

      } else if ($parent.hasClass('pinterest')) {
        e.preventDefault();
        var url = $(this).attr('href');
        var width = 700,
          height = 550,
          left = ($(window).width() - width) / 2,
          top = ($(window).height() - height) / 2,
          opts = 'status=1, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0' +
          ',width=' + width +
          ',height=' + height +
          ',top=' + top +
          ',left=' + left;
        window.open(url, 'Pinterest', opts);

      } else if ($parent.hasClass('google')) {
        e.preventDefault();
        var url = $(this).attr('href');
        var width = 550,
          height = 450,
          left = ($(window).width() - width) / 2,
          top = ($(window).height() - height) / 2,
          opts = 'status=1, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0' +
          ',width=' + width +
          ',height=' + height +
          ',top=' + top +
          ',left=' + left;
        window.open(url, 'Google+', opts);

      }
    });
  });;
  const CCShippingCalculator = class extends HTMLElement {
    constructor() {
      super();

      let loaded = 0;
      this.getAttribute('scripts').split(' ').forEach((url) => {
        theme.loadScriptOnce(url, () => {
          loaded++;
          if (loaded === 3) {
            jQuery('.get-rates').off('click'); // prevent reinstantiation issues

            Shopify.Cart.ShippingCalculator.show({
              submitButton: this.getAttribute('submit-text'),
              submitButtonDisabled: this.getAttribute('submit-disabled-text'),
              customerIsLoggedIn: this.hasAttribute('logged-in'),
              moneyFormat: this.getAttribute('money-format')
            });
          }
        });
      });
    }
  };

  window.customElements.define('shipping-calculator', CCShippingCalculator);
  ;
  const TermsAgreement = class extends HTMLElement {
    connectedCallback() {
      this.delegatedEvent = theme.addDelegateEventListener(document, 'click', '.cart-form [name="checkout"], .additional-checkout-buttons input, a[href*="/checkout"]', this.handleFormSubmittingEvent.bind(this));
    }

    disconnectedCallback() {
      document.removeEventListener('click', this.delegatedEvent);
    }

    handleFormSubmittingEvent(evt) {
      if (!this.querySelector('input:checked')) {
        evt.preventDefault();
        theme.showQuickPopup(theme.strings.cart_terms_confirmation, $(evt.target));
      }
    }
  };

  window.customElements.define('terms-agreement', TermsAgreement);
  ;


  /*================ Sections ================*/
  theme.AnnouncementBarSection = new function () {
    this.onSectionLoad = function (container) {
      this.container = container;
      $('.disclosure', container).each(function () {
        $(this).data('disclosure', new theme.Disclosure($(this)));
      });

      this.announcements = container.querySelectorAll('.announcement');
      if (this.announcements.length > 1) {
        this.currentAnnouncement = 0;
        container.querySelector('.announcement-bar__middle').addEventListener('focusin', this.functions.pauseAnnouncements.bind(this));
        container.querySelector('.announcement-bar__middle').addEventListener('focusout', this.functions.playAnnouncements.bind(this));
        container.querySelector('.announcement-button--previous').addEventListener('click', this.functions.previousAnnouncement.bind(this));
        container.querySelector('.announcement-button--next').addEventListener('click', this.functions.nextAnnouncement.bind(this));
        this.observer = new IntersectionObserver(this.functions.handleIntersect.bind(this));
        this.observer.observe(this.container);
      }
    };

    this.functions = {
      handleIntersect: function (entries) {
        entries.forEach((entry) => {
          if (entry.target == this.container) {
            if (entry.isIntersecting) {
              this.functions.playAnnouncements.call(this);
            } else {
              this.functions.pauseAnnouncements.call(this);
            }
          }
        });
      },

      playAnnouncements: function () {
        clearInterval(this.announcementInterval);
        this.announcementInterval = setInterval(() => {
          this.functions.setCurrentAnnouncement.call(this, this.currentAnnouncement + 1);
        }, 5000);
      },

      pauseAnnouncements: function () {
        if (this.announcementInterval) {
          clearInterval(this.announcementInterval);
        }
      },

      setCurrentAnnouncement: function (newIndex) {
        this.currentAnnouncement = (newIndex + this.announcements.length) % this.announcements.length;
        this.announcements.forEach((el, index) => {
          if (index !== this.currentAnnouncement) {
            el.classList.add('announcement--inactive');
          } else {
            el.classList.remove('announcement--inactive');
            if (typeof el.dataset.bg !== 'undefined') {
              this.container.style.setProperty('--announcement-background', el.dataset.bg);
            }
            if (typeof el.dataset.text !== 'undefined') {
              this.container.style.setProperty('--announcement-text', el.dataset.text);
              this.container.style.setProperty('--link-underline', el.dataset.underline);
            }
          }
        });
      },

      previousAnnouncement: function () {
        this.functions.setCurrentAnnouncement.call(this, this.currentAnnouncement - 1);
      },

      nextAnnouncement: function () {
        this.functions.setCurrentAnnouncement.call(this, this.currentAnnouncement + 1);
      }
    };

    this.onSectionUnload = function (container) {
      clearInterval(this.announcementInterval);

      $('.disclosure', container).each(function () {
        $(this).data('disclosure').unload();
      });

      if (this.observer) {
        this.observer.disconnect();
      }
    };

    this.onBlockSelect = function (block) {
      const index = Array.prototype.indexOf.call(block.parentElement.children, block);
      this.functions.pauseAnnouncements.call(this);
      this.functions.setCurrentAnnouncement.call(this, index);
    };

    this.onBlockDeselect = function (block) {
      this.functions.playAnnouncements.call(this);
    };
  }();

  theme.BlogTemplateSection = new function () {
    this.onSectionLoad = function (container) {
      this.namespace = theme.namespaceFromSection(container);
      this.$container = $(container);

      // filter visibility
      const popup = new ccPopup($('.filter-modal', container), this.namespace + 'Filter');
      $('.filter-modal .cc-popup-close', container).on('click', () => popup.close());
      $('.filter-modal .cc-popup-background', container).on('click', () => popup.close());
      this.$container.on('click' + this.namespace, '[data-toggle-filters]', function (evt) {
        popup.open();
        return false;
      });
    };

    this.onSectionUnload = function (container) {
      this.$container.off(this.namespace);
      $(document).off(this.namespace);
    };
  }();

  theme.CollectionTemplateSection = new function () {
    this.onSectionLoad = function (container) {
      this.namespace = theme.namespaceFromSection(container);
      this.$container = $(container);

      this.filterer = new theme.LoadFilterer(this);

      // filter visibility
      const popup = new ccPopup($('.filter-modal', container), this.namespace + 'Filter');
      $('.filter-modal .cc-popup-close', container).on('click', () => popup.close());
      $('.filter-modal .cc-popup-background', container).on('click', () => popup.close());

      this.$container.on('click' + this.namespace, '[data-toggle-filters]', function (evt) {
        popup.open();
        return false;
      });
    };

    this.onSectionUnload = function (container) {
      this.filterer.destroy();
      $('.slick-slider', container).slick('unslick').off('init');
      this.$container.off(this.namespace);
      $(window).off(this.namespace);
    };
  }();

  theme.CustomRowSection = new function () {
    this.onSectionLoad = function (container) {
      theme.VideoManager.onSectionLoad(container);
    };

    this.onSectionUnload = function (container) {
      theme.VideoManager.onSectionUnload(container);
    };
  }();

  theme.FeaturedProductSection = new function () {
    this.onSectionLoad = function (container) {
      // init gallery (before product form - so it can respond to variant images)
      theme.initProductGallery(container);

      // init product form
      $('.product-form', container).trigger('load-product-form');
    };

    this.onSectionUnload = function (container) {
      theme.destroyProductGallery(container);
      $('.product-form', container).trigger('unload-product-form');
      $('.slideshow', container).slick('unslick');
    };
  }();

  theme.FooterSection = new function () {
    this.onSectionLoad = function (container) {
      $('.disclosure', container).each(function () {
        $(this).data('disclosure', new theme.Disclosure($(this)));
      });
    };

    this.onSectionUnload = function (container) {
      $('.disclosure', container).each(function () {
        $(this).data('disclosure').unload();
      });
    };
  }();

  theme.GallerySection = new function () {
    this.onSectionLoad = function (container) {
      var $carouselGallery = $('.gallery--mobile-carousel', container);
      if ($carouselGallery.length) {
        var assessCarouselFunction = function () {
          var isCarousel = $carouselGallery.hasClass('slick-slider'),
            shouldShowCarousel = $(window).width() < 768;

          if (isCarousel && !shouldShowCarousel) {
            // Destroy carousel

            // - unload slick
            $carouselGallery.slick('unslick').off('init');
            $carouselGallery.find('a, .gallery__item').removeAttr('tabindex').removeAttr('role');

            // - re-row items
            var rowLimit = $carouselGallery.data('grid');
            var $currentRow = null;
            $carouselGallery.find('.gallery__item').each(function (index) {
              if (index % rowLimit === 0) {
                $currentRow = $('<div class="gallery__row">').appendTo($carouselGallery);
              }
              $(this).appendTo($currentRow);
            });
          } else if (!isCarousel && shouldShowCarousel) {
            // Create carousel

            // - de-row items
            $carouselGallery.find('.gallery__item').appendTo($carouselGallery);
            $carouselGallery.find('.gallery__row').remove();

            // - init carousel
            $carouselGallery.slick({
              autoplay: false,
              fade: false,
              infinite: true,
              useTransform: true,
              arrows: false,
              dots: true,
              customPaging: function (slider, i) {
                return `<button class="custom-dot" type="button" data-role="none" role="button" tabindex="0">` +
                `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 30 30" xml:space="preserve">` +
                `<circle class="circle-one" cx="15" cy="15" r="13" />` +
                `<circle class="circle-two" cx="15" cy="15" r="13" />` +
                `</svg>` +
                `</button>`;
              },
              rtl: document.querySelector('html[dir=rtl]') ? true : false
            });
          }
        };

        assessCarouselFunction();
        $(window).on('debouncedresize.themeSection' + container.id, assessCarouselFunction);
      }

      // Tidier typography
      $('.overlay-text__title, .overlay-text__rte', container).each(function () {
        theme.avoidUnecessaryOrphans(this);
      });
    };

    this.onSectionUnload = function (container) {
      $(window).off('.themeSection' + container.id);
      $('.slick-slider', container).each(function () {
        $(this).slick('unslick').off('init');
      });
    };

    this.onBlockSelect = function (block) {
      var blockSlideIndex = $(block).data('slick-index');
      $(block).closest('.slick-slider').each(function () {
        $(this).slick('slickGoTo', blockSlideIndex);
      });
    };
  }();

  theme.HeaderSection = new function () {
    this.onSectionLoad = function (container) {
      this.$container = $(container);

      // nav
      theme.Navigation.init({
        nav: $('.navigation', container),
        mobileNavTemplate: container.querySelector('.mobile-navigation-drawer-template')
      });

      if (theme.inlineNavigationCheck) {
        theme.inlineNavigationCheck();
        $(window).on('debouncedresize.headerSection', theme.inlineNavigationCheck);
      } else if (document.querySelector('#InlineNavigationCheckScript')) {
        // if just enabled in theme editor but not evaluated
        eval(document.querySelector('#InlineNavigationCheckScript').innerHTML);
      }

      // set anything that alters based on contents/viewport/scroll, etc
      this.section = document.querySelector('.section-header');

      this.functions.setSticky.call(this);
      this.functions.setHeaderHeightProperty.call(this);
      this.functions.setScrollClass.call(this);

      $(window).on('scroll.headerSection', this.functions.afterScroll.bind(this));
      $(window).on('debouncedresize.headerSection', this.functions.afterResize.bind(this));

      // account / localization (after mobile nav initialises)
      $('.disclosure', container).each(function () {
        $(this).data('disclosure', new theme.Disclosure($(this)));
      });

      $('.mobile-navigation-drawer .disclosure').each(function () {
        $(this).data('disclosure', new theme.Disclosure($(this)));
      });

      // reveal cart drawer
      if (theme.settings.cart_type == 'drawer' && document.querySelector('.cart-drawer')) {
        $(container).on('click', '.cart-link', (evt) => {
          evt.preventDefault();
          document.dispatchEvent(
            new CustomEvent('theme:open-cart-drawer', { bubbles: true, cancelable: false })
          );
        });
      }

      // listen to cart changes
      $(document).on('theme:cartchanged.headerSection', function () {
        $.getJSON(location.origin + '?sections=header', function (data) {
          var cartSummarySelectors = ['#pageheader .logo-area__right__inner'];
          for (var i = 0; i < cartSummarySelectors.length; i++) {
            var $newCartObj = $('<div>' + data.header + '</div>').find(cartSummarySelectors[i]).first();
            var $currCart = $(cartSummarySelectors[i]);
            $currCart.html($newCartObj.html());
          }
        });
      });

      // init mobile nav again if it's open and this is a reload
      if (Shopify.designMode && $('body').hasClass('reveal-mobile-nav')) {
        theme.openMobileNav();
      }

      // search
      if ($('.header-search-template', container).length) {
        $(container).on('click.headerSection', '.show-search-link', (evt) => {
          evt.preventDefault();
          evt.stopPropagation();

          if (document.querySelector('.header-search-content:not(.hidden)')) {
            this.functions.closeSearch.call(this);
          } else {
            this.functions.openSearch.call(this);
          }
        });
      }
    };

    this.onSectionUnload = function (container) {
      $(container).off('.headerSection');
      $(document).off('.headerSection');
      $(window).off('.headerSection');
      $('.disclosure', container).each(function () {
        $(this).data('disclosure').unload();
      });
      $('.mobile-navigation-drawer .disclosure').each(function () {
        $(this).data('disclosure').unload();
      });
      theme.Navigation.destroy($('.navigation', container));
    };

    this.onBlockSelect = function (container) {
      $(container).closest('.navigation__item').trigger('mouseenter');
    };

    this.onBlockDeselect = function (container) {
      $(container).closest('.navigation__item').trigger('mouseleave');
    };

    this.functions = {
      afterScroll: function () {
        this.functions.setScrollClass.call(this);
      },

      afterResize: function () {
        this.functions.setSticky.call(this);
        this.functions.setHeaderHeightProperty.call(this);
      },

      setSticky: function () {
        this.isSticky = getComputedStyle(this.section).position === 'sticky' || getComputedStyle(this.section).position === '-webkit-sticky';
      },

      setHeaderHeightProperty: function () {
        var headerHeight = 0,
          stickyHeaderHeight = 0;
        if (this.section) {
          headerHeight = Math.ceil(this.section.clientHeight);
          if (this.isSticky) {
            stickyHeaderHeight = headerHeight;
          }
        }
        theme.enqueueStyleUpdate(() => {
          document.documentElement.style.setProperty('--theme-header-height', headerHeight + 'px');
          document.documentElement.style.setProperty('--theme-sticky-header-height', stickyHeaderHeight + 'px');
        });
      },

      setScrollClass: function () {
        const p = getComputedStyle(document.querySelector('.section-header')).position,
          ab = document.querySelector('.section-announcement-bar'),
          t = ab ? ab.offsetTop + ab.clientHeight : 0;

        theme.enqueueStyleUpdate(() => {
          document.body.classList.toggle('floating-header', /*p === 'sticky' && */window.scrollY > t);
        });
      },

      openSearch: function () {
        // first time? Load
        if (document.querySelector('.header-search-content')) {
          document.querySelector('.header-search-content').classList.remove('hidden');
        } else {
          // add html
          $('#content').prepend(this.$container.find('.header-search-template').html());

          // initialise
          theme.Sections.sectionLoad(document.querySelector('.header-search-content [data-section-type="search-template"]'));

          // close button
          document.querySelector('.main-search__close').addEventListener('click', this.functions.closeSearch.bind(this));

          // fetch content from search page
          fetch(theme.routes.search_url).
          then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
          }).
          then((response) => {
            const $parsed = $(`<div>${response}</div>`);
            // section data attributes
            $('.header-search-content [data-section-type="search-template"]').
            attr('data-filter-section-id', $parsed.find('[data-section-type="search-template"]').data('filter-section-id')).
            attr('data-search-while-typing', $parsed.find('[data-section-type="search-template"]').data('search-while-typing'));

            // other content
            $('.header-search-content .before-search-content').html($parsed.find('.before-search-content').html());
            theme.initAnimateOnScroll();
          });
        }
        document.querySelector('.main-container').classList.add('main-container--temp-hidden');
        setTimeout(() => {
          document.querySelector('.header-search-content .main-search__input').focus();
          setTimeout(() => theme.scrollToRevealElement(document.querySelector('.header-search-content')), 50);
        }, 50);
      },

      closeSearch: function () {
        document.querySelector('.header-search-content').classList.add('hidden');
        document.querySelector('.main-container').classList.remove('main-container--temp-hidden');
        document.querySelectorAll('.show-search-link').forEach((el) => {
          if (el.offsetParent) {
            el.focus();
          }
        });
      }
    };
  }();

  theme.ImageWithTextOverlaySection = new function () {
    var _ = this;

    _.checkForHeaderHeightSubtraction = function () {
      $('.section-image-with-text-overlay .height--full-minus-header-height').each(function () {
        var height = $(window).height() - document.querySelector('.section-header').clientHeight;
        $('.background-image, .placeholder-image', this).height(height);
      });
    };

    this.onSectionLoad = function (container) {
      $('.height--full', container).each(function () {
        if ($(this).closest('.section-image-with-text-overlay').index() == 0) {
          $(this).addClass('height--full-minus-header-height');
          _.checkForHeaderHeightSubtraction();
          $(window).off('debouncedresize.imageWithTextOverlaySection').on('debouncedresize.imageWithTextOverlaySection', _.checkForHeaderHeightSubtraction);
        }
      });

      // Tidier typography
      $('.overlay-text__title, .overlay-text__rte', container).each(function () {
        theme.avoidUnecessaryOrphans(this);
      });
    };

    this.onSectionUnload = function (container) {
      $(window).off('.imageWithTextOverlaySection');
    };
  }();

  theme.ProductTemplateSection = new function () {
    this.onSectionLoad = function (container) {
      /// Init store availability if applicable
      if ($('[data-store-availability-container]', container).length) {
        this.storeAvailability = new theme.StoreAvailability($('[data-store-availability-container]', container)[0]);
      }

      // init gallery (before product form - so it can respond to variant images)
      theme.initProductGallery(container);

      // init product form
      $('.product-form', container).trigger('load-product-form');
    };

    this.onSectionUnload = function (container) {
      theme.destroyProductGallery(container);
      $('.product-form', container).trigger('unload-product-form');
      if (this.storeAvailability) {
        this.storeAvailability.onSectionUnload();
      }
    };
  }();

  theme.SearchTemplateSection = new function () {
    this.onSectionLoad = function (container) {
      this.namespace = theme.namespaceFromSection(container);
      this.$container = $(container);
      this.container = this.$container[0];
      this.termsInput = this.container.querySelector('.main-search__input');

      this.filterer = new theme.LoadFilterer(this, theme.routes.search_url, this.container.dataset.alterLocation === 'true');

      // filter visibility
      const popup = new ccPopup($('.filter-modal', container), this.namespace + 'Filter');
      $('.filter-modal .cc-popup-close', container).on('click', () => popup.close());
      $('.filter-modal .cc-popup-background', container).on('click', () => popup.close());
      this.$container.on('click' + this.namespace, '[data-toggle-filters]', function (evt) {
        popup.open();
        return false;
      });

      // search as you type
      if (this.container.dataset.searchWhileTyping == 'true') {
        this.termsInput.closest('form').addEventListener('submit', (evt) => {
          evt.preventDefault(); // don't submit
          document.activeElement.blur(); // close any open keyboard to view results
        });
        this.termsInput.addEventListener('change', this.functions.onTermsChange.bind(this));
        this.termsInput.addEventListener('keyup', this.functions.onTermsChange.bind(this));
        this.termsInput.addEventListener('paste', this.functions.onTermsChange.bind(this));
        this.functions.setTermsClasses.call(this);
      }

      this.container.querySelector('.main-search__button--clear').addEventListener('click', this.functions.onClearTermsClick.bind(this));
    };

    this.functions = {
      onTermsChange: function () {
        const filterQueryEl = this.container.querySelector('#CollectionFilterForm [name="q"]');
        if (filterQueryEl.value != this.termsInput.value) {
          this.container.querySelector('.filters-adjacent').classList.add('ajax-loading');
          filterQueryEl.value = this.termsInput.value;
          filterQueryEl.dispatchEvent(
            new CustomEvent('change', { bubbles: true })
          );
        }
        this.functions.setTermsClasses.call(this);
      },

      setTermsClasses: function () {
        this.termsInput.closest('.main-search').classList.toggle('main-search--terms-entered', this.termsInput.value.length > 0);
      },

      onClearTermsClick: function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this.termsInput.value = '';
        this.termsInput.dispatchEvent(
          new CustomEvent('change', { bubbles: true })
        );
      }
    };

    this.onSectionUnload = function () {
      this.filterer.destroy();
      this.$container.off(this.namespace);
    };
  }();

  theme.SlideshowSection = new function () {
    var _ = this;

    _.checkForHeaderHeightSubtraction = function () {
      $('.section-slideshow .height--full-minus-header-height').each(function () {
        var height = $(window).height() - document.querySelector('.section-header').clientHeight;
        $('.background-image, .placeholder-image', this).height(height);
      });
    };

    this.onSectionLoad = function (container) {
      $('.slideshow', container).each(function () {
        const slideshowSpeed = $(this).data('transition') === 'instant' ? 0 : 800;
        const autoplaySpeed = $(this).data('autoplay-speed') * 1000;

        if ($(this).find('.height--full').length && $(this).closest('.section-slideshow').index() == 0) {
          $(this).addClass('height--full-minus-header-height');
          _.checkForHeaderHeightSubtraction();
          $(window).off('debouncedresize.slideshowSection').on('debouncedresize.slideshowSection', _.checkForHeaderHeightSubtraction);
        }
        $(this).slick({
          autoplay: $(this).data('autoplay'),
          fade: $(this).data('transition') !== 'slide',
          speed: slideshowSpeed,
          autoplaySpeed: autoplaySpeed,
          arrows: $(this).data('navigation') === 'arrows',
          dots: $(this).data('navigation') === 'dots',
          pauseOnHover: false,
          infinite: true,
          useTransform: true,
          appendArrows: $(this).siblings('.slideshow-controls'),
          prevArrow: '<button type="button" class="slick-prev slick-arrow" aria-label="' + theme.strings.previous + '">' + theme.icons.chevronLeft + '</button>',
          nextArrow: '<button type="button" class="slick-next slick-arrow" aria-label="' + theme.strings.next + '">' + theme.icons.chevronRight + '</button>',
          customPaging: function (slider, i) {
            return `<button class="custom-dot" type="button" data-role="none" role="button" tabindex="0">` +
            `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 30 30" xml:space="preserve">` +
            `<circle class="circle-one" cx="15" cy="15" r="13" />` +
            `<circle class="circle-two" cx="15" cy="15" r="13" style="animation-duration: ${autoplaySpeed + slideshowSpeed}ms" />` +
            `</svg>` +
            `</button>`;
          },
          rtl: document.querySelector('html[dir=rtl]') ? true : false,
          responsive: [
          {
            breakpoint: 768,
            settings: {
              arrows: false,
              dots: $(this).data('navigation') !== 'none'
            }
          }]

        }).on('beforeChange', function (event, slick, currentSlide, nextSlide) {
          if ($(this).data('transition') === 'slide_fade' || $(this).data('transition') === 'zoom') {
            let $outgoingSlide = $(slick.$slides.get(currentSlide));
            $outgoingSlide.addClass('slick--leaving');
          }
          if (slick.$nextArrow) {
            slick.$nextArrow.closest('.slideshow-controls').find('.slideshow-controls__count').text(`${nextSlide + 1} / ${slick.slideCount}`);
          }
        }).on('afterChange', function (event, slick) {
          $(slick.$slides).filter('.slick--leaving').removeClass('slick--leaving');
        });
      });

      // Tidier typography
      $('.overlay-text__title, .overlay-text__rte', container).each(function () {
        theme.avoidUnecessaryOrphans(this);
      });
    };

    this.onSectionUnload = function (container) {
      $('.slick-slider', container).slick('unslick').off('init');
      $(window).off('.slideshowSection');
    };

    this.onBlockSelect = function (container) {
      $(container).closest('.slick-slider').
      slick('slickGoTo', $(container).data('slick-index')).
      slick('slickPause');
    };

    this.onBlockDeselect = function (container) {
      $(container).closest('.slick-slider').
      slick('slickPlay');
    };
  }();

  theme.TestimonialsSection = new function () {
    this.onSectionLoad = function (container) {
      this.namespace = theme.namespaceFromSection(container);
      this.carousel = $('.cc-carousel', container)[0];
      this.carousel.prepare(); // trigger lazy-init
      this.presentedTextContainer = $(container)[0].querySelector('.testimonial-list__presented-text');

      if (this.presentedTextContainer) {
        this.registerEventListener(this.carousel, 'cc-carousel:selected', (evt) => this.functions.setPresentedText.call(this, evt.detail.currentItem));
        $('.testimonial__image', container).each((index, element) => {
          this.registerEventListener(element, 'click', (evt) => {
            evt.currentTarget.closest('cc-carousel').get().selectItem(evt.currentTarget.closest('.testimonial'));
          });
        });

        this.autoplay = $('.testimonial-list', container).data('autoplay');
        if (this.autoplay) {
          this.autoplaySpeed = $('.testimonial-list', container).data('autoplay-speed');
          this.functions.startAutoplay.call(this);
          this.registerEventListener($(container)[0], 'mouseenter', (evt) => this.functions.stopAutoplay.call(this));
          this.registerEventListener($(container)[0], 'mouseleave', (evt) => {
            if (!this.blockSelected) {
              this.functions.startAutoplay.call(this);
            }
          });
        }
      }
    };

    this.functions = {
      setPresentedText: function (testimonialEl) {
        this.presentedTextContainer.classList.remove('testimonial-list__presented-text--reveal');
        clearTimeout(this.setPresentedTextTimeout1Id);
        clearTimeout(this.setPresentedTextTimeout2Id);
        this.setPresentedTextTimeout1Id = setTimeout(() => {
          this.presentedTextContainer.querySelector('.testimonial__text').innerHTML = testimonialEl.querySelector('.testimonial__text').innerHTML;
          this.setPresentedTextTimeout2Id = setTimeout(() => this.presentedTextContainer.classList.add('testimonial-list__presented-text--reveal'), 50);
        }, parseFloat(getComputedStyle(this.presentedTextContainer).getPropertyValue('--hide-duration')) * 1000);
      },

      startAutoplay: function () {
        clearInterval(this.autoplayIntervalId);
        this.autoplayIntervalId = setInterval(() => {
          this.carousel.next();
        }, this.autoplaySpeed);
      },

      stopAutoplay: function () {
        clearInterval(this.autoplayIntervalId);
      }
    };

    this.onSectionUnload = function (container) {
      if (this.presentedTextContainer) {
        this.functions.stopAutoplay.call(this);
      }
    };

    this.onBlockSelect = function (block) {
      if (this.presentedTextContainer) {
        this.blockSelected = true;
        this.functions.stopAutoplay.call(this);
      }

      this.carousel.get().selectItem(block);
    };

    this.onBlockDeselect = function (block) {
      if (this.presentedTextContainer) {
        this.functions.startAutoplay.call(this);
        this.blockSelected = false;
      }
    };
  }();

  theme.CartDrawerSection = new function () {
    this.onSectionLoad = function (container) {
      this.container = container;
      this.namespace = theme.namespaceFromSection(container);
      this.popup = new ccPopup($('.cc-popup', container), this.namespace);

      this.boundOpen = () => this.popup.open();
      document.addEventListener('theme:open-cart-drawer', this.boundOpen);
      this.boundClose = () => this.popup.close();
      document.addEventListener('theme:close-cart-drawer', this.boundClose);

      container.querySelector('.cc-popup-close').addEventListener('click', this.boundClose);
      container.querySelector('.cc-popup-background').addEventListener('click', this.boundClose);
    };

    this.onSectionSelect = () => {
      document.dispatchEvent(
        new CustomEvent('theme:open-cart-drawer', { bubbles: true, cancelable: false })
      );
    };

    this.onSectionDeselect = () => {
      document.dispatchEvent(
        new CustomEvent('theme:close-cart-drawer', { bubbles: true, cancelable: false })
      );
    };

    this.onSectionUnload = function (container) {
      document.removeEventListener('theme:open-cart-drawer', this.boundOpen);
      document.removeEventListener('theme:close-cart-drawer', this.boundClose);
    };
  }();

  theme.ScrollingBannerSection = new function () {
    this.onSectionLoad = function (target) {
      document.fonts.ready.then(() => target.querySelector('.marquee').classList.add('marquee--animate'));
      target.querySelectorAll('img[loading="lazy"]').forEach((el) => {el.loading = 'eager';});
    };
  }();

  theme.MediaWithTextSection = new function () {
    this.onSectionLoad = function (container) {
      theme.VideoManager.onSectionLoad.call(this, container);
      $('.majortitle', container).each(function () {
        theme.avoidUnecessaryOrphans(this);
      });
    };

    this.onSectionUnload = function (container) {
      theme.VideoManager.onSectionUnload.call(this, container);
    };
  }();


  // dom ready
  $(function ($) {
    var $ = $; // keep this ref local

    $(document).on('keyup.themeTabCheck', function (evt) {
      if (evt.keyCode === 9) {
        $('body').addClass('tab-used');
        $(document).off('keyup.themeTabCheck');
      }
    });

    /// Reusable function to expand/contract a div
    $(document).on('click', 'a[data-toggle-target]', function (e) {
      e.preventDefault();
      var $toggler = $(this),
        $target = $($(this).data('toggle-target')),
        $transCont = $target.find('.toggle-target-container'),
        doCollapse = !$target.hasClass('toggle-target--hidden');
      var transitionDuration = $target.css('transition-duration').indexOf('ms') >= 0 ? parseInt($target.css('transition-duration')) : parseFloat($target.css('transition-duration')) * 1000;
      if (!$target.hasClass('toggle-target--in-transition')) {
        if (doCollapse) {
          $toggler.addClass('toggle-target-toggler--is-hidden');
          $target.addClass('toggle-target--in-transition toggle-target--hiding').css({
            height: $transCont.outerHeight() + 'px',
            opacity: 1
          });
          setTimeout(function () {
            $target.css({
              height: 0,
              opacity: 0
            });
            setTimeout(function () {
              $target.addClass('toggle-target--hidden').removeClass('toggle-target--in-transition toggle-target--hiding');
              $target.css({
                height: '',
                opacity: ''
              });
            }, transitionDuration);
          }, 10);
        } else {
          $toggler.removeClass('toggle-target-toggler--is-hidden');
          $target.addClass('toggle-target--in-transition toggle-target--revealing').css({
            height: 0,
            opacity: 0,
            display: 'block'
          });
          setTimeout(function () {
            $target.css({
              height: $transCont.outerHeight() + 'px',
              opacity: 1
            });
            setTimeout(function () {
              $target.removeClass('toggle-target--hidden toggle-target--in-transition toggle-target--revealing');
              $target.css({
                height: '',
                opacity: '',
                display: ''
              });
            }, transitionDuration);
          }, 10);
        }
      }
    });

    //Redirect dropdowns
    $(document).on('change', 'select.navdrop', function () {
      window.location = $(this).val();
    });

    /// Mobile nav
    $(document).on('click', '.mobile-nav-toggle', function (e) {
      e.preventDefault();
      if ($('body').hasClass('reveal-mobile-nav')) {
        // hide nav
        $('body').removeClass('reveal-mobile-nav reveal-mobile-nav--revealed');
      } else {
        // show nav
        theme.openMobileNav();
      }
    });

    theme.openMobileNav = function () {
      $('body').addClass('reveal-mobile-nav');

      // on reveal, set up internal transition values
      $('.mobile-navigation-drawer .disclosure').each(function () {
        var $list = $('.disclosure-list', this),
          listHeight = 0;
        $list.children().each(function () {
          listHeight += $(this).height();
        });
        $('.disclosure-list', this).css('height', listHeight + 'px');
      });

      // on reveal, lazy load images
      theme.manualLazyload(document.querySelector('.mobile-navigation-drawer'));

      // on reveal, load product carousel
      document.querySelectorAll('.mobile-navigation-drawer product-block').forEach((el) => el.init());

      // after reveal, add class
      const de = $('.mobile-navigation-drawer .navigation__tier-1 > .navigation__item > .navigation__link:first').css('transition-delay');
      const du = $('.mobile-navigation-drawer .navigation__tier-1 > .navigation__item > .navigation__link:first').css('transition-duration');
      const delayS = parseFloat(de.split(',')[0]) + parseFloat(du.split(',')[0]);
      setTimeout(function () {
        $('body').addClass('reveal-mobile-nav--revealed');
      }, delayS * 1000);
    };

    /// General window shade
    $('<a href="#" class="page-shade" aria-label="' + theme.strings.general_navigation_menu_toggle_aria_label + '"></a>').on('click', function () {
      $('body').removeClass('reveal-mobile-nav');
      return false;
    }).appendTo('body');


    if (theme.settings.quickbuy_style != 'off') {
      theme.loadQuickbuy();
    }

    /// Event for initialising options
    $(document).on('load-product-form', '.product-form', function (e, data) {
      if ($(this).data('product-id') === '') {
        return;
      }

      var $productFormContainer = $(this),
        $productDetail = $(this).closest('.product-detail');

      // events on variant change

      $(this).on('variantChanged', function (evt, variant, product) {
        // change variant status classes
        var $labelCont = $productDetail.find('.product-label-list');
        $labelCont.find('.product-label-container').remove();
        if (variant) {
          $labelCont.append($(`#variant-label-${product.id}-${variant.id}`).html());
        } else {
          $labelCont.append($(`#variant-label-${product.id}-none`).html());
        }

        // instate DPBs - requires a variant ID, and may be loaded in quick buy
        if (variant) {
          $productDetail.find('.dynamic-payment-button-template').each(function () {
            $(this).after($(this).html()).remove();

            if (Shopify.PaymentButton) {
              Shopify.PaymentButton.init();
            }
          });
        }
      });

      // icon-style variant picker to show option beside label
      // var $iconOptionContainers = $productDetail.find('.option-selector--swatch');
      var $iconOptionContainers = $productDetail.find('.option-selector');
      if ($iconOptionContainers.length /*&& $('body.swatch-style-icon_circle, body.swatch-style-icon_square').length*/) {
        $iconOptionContainers.find('.label').append('<span class="label__value">');
        $(this).on('variantChanged', function (evt, variant) {
          $iconOptionContainers.each(function () {
            const optionIndex = $(this).data('option-index');
            if (variant) {
              const optionValue = variant.options[optionIndex];
              $(this).find('.label__value').text(optionValue);
            } else {
              const selectedOption = this.querySelector('.opt-btn:checked');
              if (selectedOption) {
                $(this).find('.label__value').text(selectedOption.value);
              }
            }
          });
          if(variant)
            document.querySelector(".redirect__woa-btn")?.setAttribute('href', `https://worldofalps.com/search?q=${variant.sku}`);
        });
      }

      // Add a disabled-state to options that have no valid variants, in a descending selection order
      const $availabilityDependentOptions = $productDetail.find('.option-selectors[data-disable-unavailable="true"]');
      if ($availabilityDependentOptions.length) {
        $(this).on('variantChanged', function (evt, variant) {
          let productData = theme.OptionManager.getProductData($(this));
          let optionStatusMap = [];
          let currentSelectedOptionValues = [];

          $('.option-selectors[data-disable-unavailable="true"] .option-selector', this).each(function (index) {
            const checkedInput = $(this).find('input:checked');
            const selectedOption = $(this).find('.cc-select__option[aria-selected="true"]');
            const value = checkedInput.length ? checkedInput.val() : selectedOption ? selectedOption.data('value') : null;
            currentSelectedOptionValues.push(value);
          });

          // build map of options
          for (let optionIndex = 0; optionIndex < productData.options.length; optionIndex++) {
            const optionName = productData.options[optionIndex];
            let values = {};
            for (let i = 0; i < productData.variants.length; i++) {
              const v = productData.variants[i];
              if (!values[v.options[optionIndex]]) {
                values[v.options[optionIndex]] = false;
              }
            }
            optionStatusMap.push({
              name: optionName,
              values: values
            });
          }

          // go through each option, assume previous option's values are locked in, if any further choices are possible show as available
          for (let optionIndex = 0; optionIndex < productData.options.length; optionIndex++) {
            const optionName = productData.options[optionIndex];
            // for this option, find if any variants are available
            let fixedOptions = [];
            for (let i = 0; i < currentSelectedOptionValues.length && i < optionIndex; i++) {
              fixedOptions.push(currentSelectedOptionValues[i]);
            }

            // go through each option value
            Object.keys(optionStatusMap[optionIndex].values).forEach((optionValue) => {
              let fixedOptionsForValue = fixedOptions.map((x) => x);
              fixedOptionsForValue.push(optionValue);

              // go through all variants
              let availableVariantExists = false;
              for (let i = 0; i < productData.variants.length; i++) {
                const v = productData.variants[i];
                // does this variant comply with fixedOptionsForValue? (A blank value means it could be fine.)
                let variantComplies = true;
                for (let j = 0; j < fixedOptionsForValue.length; j++) {
                  if (fixedOptionsForValue[j] && fixedOptionsForValue[j] != v.options[j]) {// note typeless compare - can encounter (16 == '16') here
                    variantComplies = false;
                  }
                }
                if (variantComplies && v.available) {
                  availableVariantExists = true;
                }
              }
              optionStatusMap[optionIndex].values[optionValue] = availableVariantExists;
            });
          }

          for (let i = 0; i < optionStatusMap.length; i++) {
            for (let optionValue in optionStatusMap[i].values) {
              $(`.option-selector[data-selector-type="listed"][data-option-index="${i}"] .opt-btn`, this).filter(function () {
                return this.value === optionValue;
              }).toggleClass('is-unavailable', !optionStatusMap[i].values[optionValue]);
              $(`.option-selector[data-selector-type="dropdown"][data-option-index="${i}"] .cc-select__option`, this).filter(function () {
                return this.dataset.value === optionValue;
              }).toggleClass('is-unavailable', !optionStatusMap[i].values[optionValue]);
            }
          }
        });
      }

      // when option selector changes, update validation state, but only after first validation called
      $productFormContainer.on('change', '.option-selector', function () {
        if ($productFormContainer.hasClass('product-form--validation-started')) {
          theme.validateProductForm($productFormContainer);
        }
      });

      // initialise options
      theme.OptionManager.initProductOptions($(this), data && data.productUrl ? data.productUrl : null);
    });

    $(document).on('unload-product-form', '.product-form', function () {
      $(this).off('variantChanged change');
      theme.OptionManager.unloadProductOptions($(this));
    });

    /// Galleries (inc. product page)

    // when variant changes, and the variant has an image
    $(document).on('variantImageSelected', '.gallery', function (e, data, isFirstRun) {
      const $gallery = $(this);
      const $galleryCollageContainer = $gallery.filter('.gallery--layout-columns-1, .gallery--layout-columns-2, .gallery--layout-collage-1, .gallery--layout-collage-2').find('.product-slideshow:not(.slick-slider)');
      let collageGroupedImagesChanged = false;
      let $slideshow = null;

      if ($gallery.attr('data-variant-image-grouping-option-index') !== '') {
        // when images are grouped, we use options instead of variants
        const pivotOptionIndex = $gallery.attr('data-variant-image-grouping-option-index');
        const selectedGroupOption = data.options[pivotOptionIndex];
        const $thumbnails = $gallery.find('.thumbnails');
        $slideshow = $gallery.find('.slideshow');

        // slideshow - filter
        if ($slideshow.hasClass('slick-slider')) {
          // is variant image visible?
          const currentIsVisible = !!$slideshow.find(`.slide[data-media-id="${data.featured_media.id}"]`).length;
          // filter (By option name: standard. By media id: when multiple variants have same media)
          $slideshow.slick('slickUnfilter').slick('slickFilter', `.slide[data-media-id="${data.featured_media.id}"], [data-variant-image-group="${selectedGroupOption.replace('"', '&quot;').replace(/<>/g, '')}"]`);
          // weird hack required for Slick
          $slideshow.find('.slide').css({ position: '', left: '', top: '', zIndex: '', opacity: '' });
          // jump to correct slide immediately after filtering
          if (!currentIsVisible) {
            $slideshow.slick('slickGoTo', 0, true); // reset - hack for a bug
            $slideshow.slick('slickGoTo', $slideshow.find(`.slide[data-media-id="${data.featured_media.id}"]`).data('slick-index'), true);
          }
        }

        // carousel - add/remove as required
        if ($thumbnails.hasClass('owl-carousel')) {
          let $hiddenThumbnails = $gallery.find('.hidden-thumbnails');
          if (!$hiddenThumbnails.length) {
            $hiddenThumbnails = $('<div class="hidden-thumbnails hidden">').insertAfter($thumbnails);
          }

          // move to hidden thumbnails container (and show() in case hide() called prior)
          $thumbnails.find('.thumbnail').show().each(function () {
            if ($(this).attr('data-variant-image-group') != selectedGroupOption && $(this).attr('data-media-id') != data.featured_media.id) {
              $(this).appendTo($hiddenThumbnails);
            }
          });

          // add from hidden thumbnails container
          $hiddenThumbnails.find('.thumbnail').each(function () {
            if ($(this).attr('data-variant-image-group') == selectedGroupOption || $(this).attr('data-media-id') == data.featured_media.id) {
              $(this).show().appendTo($thumbnails);
            }
          });
        } else {
          // show/hide elements
          $thumbnails.find('.thumbnail').each(function () {
            if ($(this).attr('data-variant-image-group') == selectedGroupOption || $(this).attr('data-media-id') == data.featured_media.id) {
              $(this).show();
            } else {
              $(this).hide();
            }
          });
        }

        // carousel - visibility by class & moving visible to top (for nth-child styling)
        if ($galleryCollageContainer.length) {
          $galleryCollageContainer.find('.slide').each(function () {
            if ($(this).attr('data-variant-image-group') == selectedGroupOption || $(this).attr('data-media-id') == data.featured_media.id) {
              if ($(this).hasClass('slide--inactive-option')) {
                collageGroupedImagesChanged = true;
              }
              $(this).removeClass('slide--inactive-option');
            } else {
              if (!$(this).hasClass('slide--inactive-option')) {
                collageGroupedImagesChanged = true;
              }
              $(this).addClass('slide--inactive-option');
            }
          });
          $galleryCollageContainer.find('.slide--inactive-option').appendTo($galleryCollageContainer);
        }
      }

      // select matching thumbnail
      $gallery.find('.thumbnails a[data-media-id="' + data.featured_media.id + '"]:first').trigger('select');

      // collage - highlight selected, if not first run.
      if ($galleryCollageContainer.length) {
        const $active = $gallery.find('.slide[data-media-id="' + data.featured_media.id + '"]:first');
        if ($active.length) {
          if (isFirstRun && !collageGroupedImagesChanged) {
            // only scroll on first run, no visual highlight
            let isFeaturedProduct = $gallery.closest('.featured-product').length;
            if (!isFeaturedProduct) {
              theme.scrollToRevealElement($active[0]);
            }
          } else if (collageGroupedImagesChanged) {
            // assume first image is highlighted by the change
            $gallery.find('.slide--was-highlighted').removeClass('slide--was-highlighted');
            $active.addClass('slide--was-highlighted');
          } else if (!$active.hasClass('slide--was-highlighted')) {
            // reset
            clearTimeout(theme.variantImageFadeTimeout);
            $gallery.find('.slide--highlight-on').removeClass('slide--highlight-on');
            $gallery.find('.slide--highlight-off').removeClass('slide--highlight-off');
            $gallery.find('.slide--was-highlighted').removeClass('slide--was-highlighted');

            // highlight
            $active.addClass('slide--highlight-on slide--was-highlighted').siblings().addClass('slide--highlight-off');
            theme.variantImageFadeTimeout = setTimeout(function () {
              $gallery.find('.slide--highlight-on').removeClass('slide--highlight-on');
              $gallery.find('.slide--highlight-off').removeClass('slide--highlight-off');
            }, 1200);

            // scroll if needed
            theme.scrollToRevealElement($active[0]);
          }
        }
      }
    });

    // click main product image (launch gallery)
    $(document).on('click', '.product-detail .gallery .main-image a.show-gallery', function () {
      var images = [],
        $imgs = $(this).closest('.product-slideshow').length > 0 ? $(this).closest('.product-slideshow').find('.slide:not(.slide--inactive-option) .show-gallery') : $(this).closest('.swiper-wrapper').find('.show-gallery'),
        clickedHref = $(this).attr('href');
      if ($imgs.length) {
        $imgs.each(function () {
          var $imgThumb = $('.inline-image', this).clone();
          images.push({
            thumbTag: $imgThumb,
            zoomUrl: $(this).attr('href')
          });
        });
      } else {
        var $img = $('.inline-image', this).clone();
        images.push({
          thumbTag: $img,
          zoomUrl: $(this).attr('href')
        });
      }

      let galleryConfig = {
        images: images,
        currentImage: clickedHref,
        prev: theme.icons.chevronLeft,
        next: theme.icons.chevronRight,
        close: theme.icons.close
      };

      const qbCont = this.closest('.quickbuy-modal');
      if (qbCont) {
        galleryConfig.galleryParent = qbCont.querySelector('.cc-popup-modal');
      }

      theme.buildGalleryViewer(galleryConfig);


      // copy card scheme class to gallery-viewer
      const galleryEl = $(this).closest('.gallery')[0];
      for (let value of galleryEl.classList.entries()) {
        if (value[1].indexOf('card-scheme-vars--') === 0 && value[1] !== 'card-scheme-vars--none') {
          const gv = document.querySelector('.gallery-viewer');
          gv.classList.add('gallery-viewer--card-scheme', value[1]);
          const customBg = getComputedStyle(galleryEl.querySelector('.gallery__inner')).getPropertyValue('--bg');
          if (customBg) {
            gv.style.setProperty('--bg', customBg);
          }
        }
      }

      return false;
    });

    // forms don't all have correct label attributes
    $('#template label').each(function () {
      var $sibinputs = $(this).siblings('input:not([type="submit"]), textarea');
      if ($sibinputs.length == 1 && $sibinputs.attr('id').length > 0) {
        $(this).attr('for', $sibinputs.attr('id'));
      }
    });

    $(document).on('click', '.quantity-wrapper [data-quantity]', function () {
      var adj = $(this).data('quantity') == 'up' ? 1 : -1;
      var $qty = $(this).closest('.quantity-wrapper').find('[name=quantity]');
      if ($qty.attr('step')) {
        adj *= parseInt($qty.attr('step'));
      }
      $qty.val(Math.max(1, parseInt($qty.val()) + adj)).trigger('change');
      return false;
    });

    /// Responsive tables
    $('.responsive-table').on('click', '.responsive-table__cell-head', function () {
      if ($(window).width() < 768) {
        $(this).closest('tr').toggleClass('expanded');
        return false;
      }
    });

    // Enhance video sections for overlays
    if (typeof cc !== 'undefined' && cc.sections) {
      for (let sectionKey in cc.sections) {
        const ccSection = cc.sections[sectionKey];
        if (ccSection.name === 'video') {
          var t = ccSection.section.onSectionLoad;
          ccSection.section.onSectionLoad = function (container) {
            // Tidier typography
            $('.overlay-text__title, .overlay-text__rte', container).each(function () {
              theme.avoidUnecessaryOrphans(this);
            });
            t.call(this, container);
          };
        }
      }
    }

    // Watch for play/stop video events
    $(document).on('cc:video:play', function () {
      if ($(window).outerWidth() < 768) {
        $('body').addClass('video-modal-open');
      }
    }).on('cc:video:stop', function () {
      if ($(window).outerWidth() < 768) {
        $('body').removeClass('video-modal-open');
      }
    });

    // recalculate srcset sizes
    $(window).on('debouncedresize', theme.lazy.updateImgSizes);

    /// Register all sections
    theme.Sections.init();
    theme.Sections.register('header', theme.HeaderSection, { deferredLoad: false });
    theme.Sections.register('announcement-bar', theme.AnnouncementBarSection, { deferredLoad: false });
    theme.Sections.register('footer', theme.FooterSection);
    theme.Sections.register('cart-drawer', theme.CartDrawerSection, { deferredLoad: false }); // popup makes it hidden on load
    theme.Sections.register('slideshow', theme.SlideshowSection);
    theme.Sections.register('gallery', theme.GallerySection);
    theme.Sections.register('testimonials', theme.TestimonialsSection);
    theme.Sections.register('image-with-text-overlay', theme.ImageWithTextOverlaySection);
    theme.Sections.register('map', theme.MapSection);
    theme.Sections.register('background-video', theme.VideoManager, { deferredLoadViewportExcess: 800 });
    theme.Sections.register('custom-row', theme.CustomRowSection);
    theme.Sections.register('featured-product', theme.FeaturedProductSection);
    theme.Sections.register('main-product', theme.ProductTemplateSection, { deferredLoad: false });
    theme.Sections.register('collection-template', theme.CollectionTemplateSection, { deferredLoad: false });
    theme.Sections.register('search-template', theme.SearchTemplateSection, { deferredLoad: false });
    theme.Sections.register('blog-template', theme.BlogTemplateSection, { deferredLoad: false });
    theme.Sections.register('cart-template', new function () {}());
    theme.Sections.register('contact', new function () {}());
    theme.Sections.register('scrolling-banner', theme.ScrollingBannerSection);
    theme.Sections.register('media-with-text', theme.MediaWithTextSection, { deferredLoadViewportExcess: 800 });
  });


  //Register dynamically pulled in sections
  $(function ($) {
    if (cc.sections.length) {
      cc.sections.forEach((section) => {
        try {
          let data = {};
          if (typeof section.deferredLoad !== 'undefined') {
            data.deferredLoad = section.deferredLoad;
          }
          if (typeof section.deferredLoadViewportExcess !== 'undefined') {
            data.deferredLoadViewportExcess = section.deferredLoadViewportExcess;
          }
          theme.Sections.register(section.name, section.section, data);
        } catch (err) {
          console.error(`Unable to register section ${section.name}.`, err);
        }
      });
    } else {
      console.warn('Barry: No common sections have been registered.');
    }
  });

})(theme.jQuery);  
/* Built with Barry v1.0.8 */