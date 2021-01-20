var BladeAlpineInstantSearch = (function () {

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn) {
	  var module = { exports: {} };
		return fn(module, module.exports), module.exports;
	}

	var component = createCommonjsModule(function (module, exports) {
	  (function (global, factory) {
	     module.exports = factory() ;
	  })(commonjsGlobal, function () {

	    var checkForAlpine = function checkForAlpine() {
	      if (!window.Alpine) {
	        throw new Error('[Magic Helpers] Alpine is required for the magic helpers to function correctly.');
	      }

	      if (!window.Alpine.version || !isValidVersion('2.5.0', window.Alpine.version)) {
	        throw new Error('Invalid Alpine version. Please use Alpine version 2.5.0 or above');
	      }
	    };

	    var syncWithObservedComponent = function syncWithObservedComponent(data, observedComponent, callback) {
	      if (!observedComponent.getAttribute('x-bind:data-last-refresh')) {
	        observedComponent.setAttribute('x-bind:data-last-refresh', 'Date.now()');
	      }

	      var handler = function handler(scope) {
	        if (scope === void 0) {
	          scope = null;
	        }

	        return {
	          get: function get(target, key) {
	            if (target[key] !== null && typeof target[key] === 'object') {
	              var path = scope ? scope + "." + key : key;
	              return new Proxy(target[key], handler(path));
	            }

	            return target[key];
	          },
	          set: function set(_target, key, value) {
	            if (!observedComponent.__x) {
	              throw new Error('Error communicating with observed component');
	            }

	            var path = scope ? scope + "." + key : key;
	            callback.call(observedComponent, observedComponent.__x.$data, path, value);
	            return true;
	          }
	        };
	      };

	      return new Proxy(data, handler());
	    };

	    var updateOnMutation = function updateOnMutation(componentBeingObserved, callback) {
	      if (!componentBeingObserved.getAttribute('x-bind:data-last-refresh')) {
	        componentBeingObserved.setAttribute('x-bind:data-last-refresh', 'Date.now()');
	      }

	      var observer = new MutationObserver(function (mutations) {
	        for (var i = 0; i < mutations.length; i++) {
	          var mutatedComponent = mutations[i].target.closest('[x-data]');
	          if (mutatedComponent && !mutatedComponent.isSameNode(componentBeingObserved)) continue;
	          callback();
	          return;
	        }
	      });
	      observer.observe(componentBeingObserved, {
	        attributes: true,
	        childList: true,
	        subtree: true
	      });
	    }; // Borrowed from https://stackoverflow.com/a/54733755/1437789


	    var objectSetDeep = function objectSetDeep(object, path, value) {
	      path = path.toString().match(/[^.[\]]+/g) || []; // Iterate all of them except the last one

	      path.slice(0, -1).reduce(function (a, currentKey, index) {
	        // If the key does not exist or its value is not an object, create/override the key
	        if (Object(a[currentKey]) !== a[currentKey]) {
	          // Is the next key a potential array-index?
	          a[currentKey] = Math.abs(path[index + 1]) >> 0 === +path[index + 1] ? [] // Yes: assign a new array object
	          : {}; // No: assign a new plain object
	        }

	        return a[currentKey];
	      }, object)[path[path.length - 1]] = value; // Finally assign the value to the last key

	      return object;
	    }; // Returns component data if Alpine has made it available, otherwise computes it with saferEval()


	    var componentData = function componentData(component) {
	      if (component.__x) {
	        return component.__x.getUnobservedData();
	      }

	      return saferEval(component.getAttribute('x-data'), component);
	    };

	    function isValidVersion(required, current) {
	      var requiredArray = required.split('.');
	      var currentArray = current.split('.');

	      for (var i = 0; i < requiredArray.length; i++) {
	        if (!currentArray[i] || parseInt(currentArray[i]) < parseInt(requiredArray[i])) {
	          return false;
	        }
	      }

	      return true;
	    }

	    function saferEval(expression, dataContext, additionalHelperVariables) {
	      if (additionalHelperVariables === void 0) {
	        additionalHelperVariables = {};
	      }

	      if (typeof expression === 'function') {
	        return expression.call(dataContext);
	      } // eslint-disable-next-line no-new-func


	      return new Function(['$data'].concat(Object.keys(additionalHelperVariables)), "var __alpine_result; with($data) { __alpine_result = " + expression + " }; return __alpine_result").apply(void 0, [dataContext].concat(Object.values(additionalHelperVariables)));
	    }

	    var AlpineComponentMagicMethod = {
	      start: function start() {
	        checkForAlpine();
	        Alpine.addMagicProperty('parent', function ($el) {
	          if (typeof $el.$parent !== 'undefined') return $el.$parent;
	          var parentComponent = $el.parentNode.closest('[x-data]');
	          if (!parentComponent) throw new Error('Parent component not found');
	          $el.$parent = syncWithObservedComponent(componentData(parentComponent), parentComponent, objectSetDeep);
	          updateOnMutation(parentComponent, function () {
	            $el.$parent = syncWithObservedComponent(parentComponent.__x.getUnobservedData(), parentComponent, objectSetDeep);

	            $el.__x.updateElements($el);
	          });
	          return $el.$parent;
	        });
	        Alpine.addMagicProperty('component', function ($el) {
	          return function (componentName) {
	            var _this = this;

	            if (typeof this[componentName] !== 'undefined') return this[componentName];
	            var componentBeingObserved = document.querySelector("[x-data][x-id=\"" + componentName + "\"], [x-data]#" + componentName);
	            if (!componentBeingObserved) throw new Error('Component not found');
	            this[componentName] = syncWithObservedComponent(componentData(componentBeingObserved), componentBeingObserved, objectSetDeep);
	            updateOnMutation(componentBeingObserved, function () {
	              _this[componentName] = syncWithObservedComponent(componentBeingObserved.__x.getUnobservedData(), componentBeingObserved, objectSetDeep);

	              $el.__x.updateElements($el);
	            });
	            return this[componentName];
	          };
	        });
	      }
	    };

	    var alpine = window.deferLoadingAlpine || function (alpine) {
	      return alpine();
	    };

	    window.deferLoadingAlpine = function (callback) {
	      alpine(callback);
	      AlpineComponentMagicMethod.start();
	    };

	    return AlpineComponentMagicMethod;
	  });
	});

	var alpine = createCommonjsModule(function (module, exports) {
	  (function (global, factory) {
	     module.exports = factory() ;
	  })(commonjsGlobal, function () {

	    function _defineProperty(obj, key, value) {
	      if (key in obj) {
	        Object.defineProperty(obj, key, {
	          value: value,
	          enumerable: true,
	          configurable: true,
	          writable: true
	        });
	      } else {
	        obj[key] = value;
	      }

	      return obj;
	    }

	    function ownKeys(object, enumerableOnly) {
	      var keys = Object.keys(object);

	      if (Object.getOwnPropertySymbols) {
	        var symbols = Object.getOwnPropertySymbols(object);
	        if (enumerableOnly) symbols = symbols.filter(function (sym) {
	          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	        });
	        keys.push.apply(keys, symbols);
	      }

	      return keys;
	    }

	    function _objectSpread2(target) {
	      for (var i = 1; i < arguments.length; i++) {
	        var source = arguments[i] != null ? arguments[i] : {};

	        if (i % 2) {
	          ownKeys(Object(source), true).forEach(function (key) {
	            _defineProperty(target, key, source[key]);
	          });
	        } else if (Object.getOwnPropertyDescriptors) {
	          Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	        } else {
	          ownKeys(Object(source)).forEach(function (key) {
	            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	          });
	        }
	      }

	      return target;
	    } // Thanks @stimulus:
	    // https://github.com/stimulusjs/stimulus/blob/master/packages/%40stimulus/core/src/application.ts


	    function domReady() {
	      return new Promise(resolve => {
	        if (document.readyState == "loading") {
	          document.addEventListener("DOMContentLoaded", resolve);
	        } else {
	          resolve();
	        }
	      });
	    }

	    function arrayUnique(array) {
	      return Array.from(new Set(array));
	    }

	    function isTesting() {
	      return navigator.userAgent.includes("Node.js") || navigator.userAgent.includes("jsdom");
	    }

	    function checkedAttrLooseCompare(valueA, valueB) {
	      return valueA == valueB;
	    }

	    function warnIfMalformedTemplate(el, directive) {
	      if (el.tagName.toLowerCase() !== 'template') {
	        console.warn(`Alpine: [${directive}] directive should only be added to <template> tags. See https://github.com/alpinejs/alpine#${directive}`);
	      } else if (el.content.childElementCount !== 1) {
	        console.warn(`Alpine: <template> tag with [${directive}] encountered with multiple element roots. Make sure <template> only has a single child element.`);
	      }
	    }

	    function kebabCase(subject) {
	      return subject.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[_\s]/, '-').toLowerCase();
	    }

	    function camelCase(subject) {
	      return subject.toLowerCase().replace(/-(\w)/g, (match, char) => char.toUpperCase());
	    }

	    function walk(el, callback) {
	      if (callback(el) === false) return;
	      let node = el.firstElementChild;

	      while (node) {
	        walk(node, callback);
	        node = node.nextElementSibling;
	      }
	    }

	    function debounce(func, wait) {
	      var timeout;
	      return function () {
	        var context = this,
	            args = arguments;

	        var later = function later() {
	          timeout = null;
	          func.apply(context, args);
	        };

	        clearTimeout(timeout);
	        timeout = setTimeout(later, wait);
	      };
	    }

	    const handleError = (el, expression, error) => {
	      console.warn(`Alpine Error: "${error}"\n\nExpression: "${expression}"\nElement:`, el);

	      if (!isTesting()) {
	        throw error;
	      }
	    };

	    function tryCatch(cb, {
	      el,
	      expression
	    }) {
	      try {
	        const value = cb();
	        return value instanceof Promise ? value.catch(e => handleError(el, expression, e)) : value;
	      } catch (e) {
	        handleError(el, expression, e);
	      }
	    }

	    function saferEval(el, expression, dataContext, additionalHelperVariables = {}) {
	      return tryCatch(() => {
	        if (typeof expression === 'function') {
	          return expression.call(dataContext);
	        }

	        return new Function(['$data', ...Object.keys(additionalHelperVariables)], `var __alpine_result; with($data) { __alpine_result = ${expression} }; return __alpine_result`)(dataContext, ...Object.values(additionalHelperVariables));
	      }, {
	        el,
	        expression
	      });
	    }

	    function saferEvalNoReturn(el, expression, dataContext, additionalHelperVariables = {}) {
	      return tryCatch(() => {
	        if (typeof expression === 'function') {
	          return Promise.resolve(expression.call(dataContext, additionalHelperVariables['$event']));
	        }

	        let AsyncFunction = Function;
	        /* MODERN-ONLY:START */

	        AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
	        /* MODERN-ONLY:END */
	        // For the cases when users pass only a function reference to the caller: `x-on:click="foo"`
	        // Where "foo" is a function. Also, we'll pass the function the event instance when we call it.

	        if (Object.keys(dataContext).includes(expression)) {
	          let methodReference = new Function(['dataContext', ...Object.keys(additionalHelperVariables)], `with(dataContext) { return ${expression} }`)(dataContext, ...Object.values(additionalHelperVariables));

	          if (typeof methodReference === 'function') {
	            return Promise.resolve(methodReference.call(dataContext, additionalHelperVariables['$event']));
	          } else {
	            return Promise.resolve();
	          }
	        }

	        return Promise.resolve(new AsyncFunction(['dataContext', ...Object.keys(additionalHelperVariables)], `with(dataContext) { ${expression} }`)(dataContext, ...Object.values(additionalHelperVariables)));
	      }, {
	        el,
	        expression
	      });
	    }

	    const xAttrRE = /^x-(on|bind|data|text|html|model|if|for|show|cloak|transition|ref|spread)\b/;

	    function isXAttr(attr) {
	      const name = replaceAtAndColonWithStandardSyntax(attr.name);
	      return xAttrRE.test(name);
	    }

	    function getXAttrs(el, component, type) {
	      let directives = Array.from(el.attributes).filter(isXAttr).map(parseHtmlAttribute); // Get an object of directives from x-spread.

	      let spreadDirective = directives.filter(directive => directive.type === 'spread')[0];

	      if (spreadDirective) {
	        let spreadObject = saferEval(el, spreadDirective.expression, component.$data); // Add x-spread directives to the pile of existing directives.

	        directives = directives.concat(Object.entries(spreadObject).map(([name, value]) => parseHtmlAttribute({
	          name,
	          value
	        })));
	      }

	      if (type) return directives.filter(i => i.type === type);
	      return sortDirectives(directives);
	    }

	    function sortDirectives(directives) {
	      let directiveOrder = ['bind', 'model', 'show', 'catch-all'];
	      return directives.sort((a, b) => {
	        let typeA = directiveOrder.indexOf(a.type) === -1 ? 'catch-all' : a.type;
	        let typeB = directiveOrder.indexOf(b.type) === -1 ? 'catch-all' : b.type;
	        return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB);
	      });
	    }

	    function parseHtmlAttribute({
	      name,
	      value
	    }) {
	      const normalizedName = replaceAtAndColonWithStandardSyntax(name);
	      const typeMatch = normalizedName.match(xAttrRE);
	      const valueMatch = normalizedName.match(/:([a-zA-Z0-9\-:]+)/);
	      const modifiers = normalizedName.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];
	      return {
	        type: typeMatch ? typeMatch[1] : null,
	        value: valueMatch ? valueMatch[1] : null,
	        modifiers: modifiers.map(i => i.replace('.', '')),
	        expression: value
	      };
	    }

	    function isBooleanAttr(attrName) {
	      // As per HTML spec table https://html.spec.whatwg.org/multipage/indices.html#attributes-3:boolean-attribute
	      // Array roughly ordered by estimated usage
	      const booleanAttributes = ['disabled', 'checked', 'required', 'readonly', 'hidden', 'open', 'selected', 'autofocus', 'itemscope', 'multiple', 'novalidate', 'allowfullscreen', 'allowpaymentrequest', 'formnovalidate', 'autoplay', 'controls', 'loop', 'muted', 'playsinline', 'default', 'ismap', 'reversed', 'async', 'defer', 'nomodule'];
	      return booleanAttributes.includes(attrName);
	    }

	    function replaceAtAndColonWithStandardSyntax(name) {
	      if (name.startsWith('@')) {
	        return name.replace('@', 'x-on:');
	      } else if (name.startsWith(':')) {
	        return name.replace(':', 'x-bind:');
	      }

	      return name;
	    }

	    function convertClassStringToArray(classList, filterFn = Boolean) {
	      return classList.split(' ').filter(filterFn);
	    }

	    const TRANSITION_TYPE_IN = 'in';
	    const TRANSITION_TYPE_OUT = 'out';
	    const TRANSITION_CANCELLED = 'cancelled';

	    function transitionIn(el, show, reject, component, forceSkip = false) {
	      // We don't want to transition on the initial page load.
	      if (forceSkip) return show();

	      if (el.__x_transition && el.__x_transition.type === TRANSITION_TYPE_IN) {
	        // there is already a similar transition going on, this was probably triggered by
	        // a change in a different property, let's just leave the previous one doing its job
	        return;
	      }

	      const attrs = getXAttrs(el, component, 'transition');
	      const showAttr = getXAttrs(el, component, 'show')[0]; // If this is triggered by a x-show.transition.

	      if (showAttr && showAttr.modifiers.includes('transition')) {
	        let modifiers = showAttr.modifiers; // If x-show.transition.out, we'll skip the "in" transition.

	        if (modifiers.includes('out') && !modifiers.includes('in')) return show();
	        const settingBothSidesOfTransition = modifiers.includes('in') && modifiers.includes('out'); // If x-show.transition.in...out... only use "in" related modifiers for this transition.

	        modifiers = settingBothSidesOfTransition ? modifiers.filter((i, index) => index < modifiers.indexOf('out')) : modifiers;
	        transitionHelperIn(el, modifiers, show, reject); // Otherwise, we can assume x-transition:enter.
	      } else if (attrs.some(attr => ['enter', 'enter-start', 'enter-end'].includes(attr.value))) {
	        transitionClassesIn(el, component, attrs, show, reject);
	      } else {
	        // If neither, just show that damn thing.
	        show();
	      }
	    }

	    function transitionOut(el, hide, reject, component, forceSkip = false) {
	      // We don't want to transition on the initial page load.
	      if (forceSkip) return hide();

	      if (el.__x_transition && el.__x_transition.type === TRANSITION_TYPE_OUT) {
	        // there is already a similar transition going on, this was probably triggered by
	        // a change in a different property, let's just leave the previous one doing its job
	        return;
	      }

	      const attrs = getXAttrs(el, component, 'transition');
	      const showAttr = getXAttrs(el, component, 'show')[0];

	      if (showAttr && showAttr.modifiers.includes('transition')) {
	        let modifiers = showAttr.modifiers;
	        if (modifiers.includes('in') && !modifiers.includes('out')) return hide();
	        const settingBothSidesOfTransition = modifiers.includes('in') && modifiers.includes('out');
	        modifiers = settingBothSidesOfTransition ? modifiers.filter((i, index) => index > modifiers.indexOf('out')) : modifiers;
	        transitionHelperOut(el, modifiers, settingBothSidesOfTransition, hide, reject);
	      } else if (attrs.some(attr => ['leave', 'leave-start', 'leave-end'].includes(attr.value))) {
	        transitionClassesOut(el, component, attrs, hide, reject);
	      } else {
	        hide();
	      }
	    }

	    function transitionHelperIn(el, modifiers, showCallback, reject) {
	      // Default values inspired by: https://material.io/design/motion/speed.html#duration
	      const styleValues = {
	        duration: modifierValue(modifiers, 'duration', 150),
	        origin: modifierValue(modifiers, 'origin', 'center'),
	        first: {
	          opacity: 0,
	          scale: modifierValue(modifiers, 'scale', 95)
	        },
	        second: {
	          opacity: 1,
	          scale: 100
	        }
	      };
	      transitionHelper(el, modifiers, showCallback, () => {}, reject, styleValues, TRANSITION_TYPE_IN);
	    }

	    function transitionHelperOut(el, modifiers, settingBothSidesOfTransition, hideCallback, reject) {
	      // Make the "out" transition .5x slower than the "in". (Visually better)
	      // HOWEVER, if they explicitly set a duration for the "out" transition,
	      // use that.
	      const duration = settingBothSidesOfTransition ? modifierValue(modifiers, 'duration', 150) : modifierValue(modifiers, 'duration', 150) / 2;
	      const styleValues = {
	        duration: duration,
	        origin: modifierValue(modifiers, 'origin', 'center'),
	        first: {
	          opacity: 1,
	          scale: 100
	        },
	        second: {
	          opacity: 0,
	          scale: modifierValue(modifiers, 'scale', 95)
	        }
	      };
	      transitionHelper(el, modifiers, () => {}, hideCallback, reject, styleValues, TRANSITION_TYPE_OUT);
	    }

	    function modifierValue(modifiers, key, fallback) {
	      // If the modifier isn't present, use the default.
	      if (modifiers.indexOf(key) === -1) return fallback; // If it IS present, grab the value after it: x-show.transition.duration.500ms

	      const rawValue = modifiers[modifiers.indexOf(key) + 1];
	      if (!rawValue) return fallback;

	      if (key === 'scale') {
	        // Check if the very next value is NOT a number and return the fallback.
	        // If x-show.transition.scale, we'll use the default scale value.
	        // That is how a user opts out of the opacity transition.
	        if (!isNumeric(rawValue)) return fallback;
	      }

	      if (key === 'duration') {
	        // Support x-show.transition.duration.500ms && duration.500
	        let match = rawValue.match(/([0-9]+)ms/);
	        if (match) return match[1];
	      }

	      if (key === 'origin') {
	        // Support chaining origin directions: x-show.transition.top.right
	        if (['top', 'right', 'left', 'center', 'bottom'].includes(modifiers[modifiers.indexOf(key) + 2])) {
	          return [rawValue, modifiers[modifiers.indexOf(key) + 2]].join(' ');
	        }
	      }

	      return rawValue;
	    }

	    function transitionHelper(el, modifiers, hook1, hook2, reject, styleValues, type) {
	      // clear the previous transition if exists to avoid caching the wrong styles
	      if (el.__x_transition) {
	        el.__x_transition.cancel && el.__x_transition.cancel();
	      } // If the user set these style values, we'll put them back when we're done with them.


	      const opacityCache = el.style.opacity;
	      const transformCache = el.style.transform;
	      const transformOriginCache = el.style.transformOrigin; // If no modifiers are present: x-show.transition, we'll default to both opacity and scale.

	      const noModifiers = !modifiers.includes('opacity') && !modifiers.includes('scale');
	      const transitionOpacity = noModifiers || modifiers.includes('opacity');
	      const transitionScale = noModifiers || modifiers.includes('scale'); // These are the explicit stages of a transition (same stages for in and for out).
	      // This way you can get a birds eye view of the hooks, and the differences
	      // between them.

	      const stages = {
	        start() {
	          if (transitionOpacity) el.style.opacity = styleValues.first.opacity;
	          if (transitionScale) el.style.transform = `scale(${styleValues.first.scale / 100})`;
	        },

	        during() {
	          if (transitionScale) el.style.transformOrigin = styleValues.origin;
	          el.style.transitionProperty = [transitionOpacity ? `opacity` : ``, transitionScale ? `transform` : ``].join(' ').trim();
	          el.style.transitionDuration = `${styleValues.duration / 1000}s`;
	          el.style.transitionTimingFunction = `cubic-bezier(0.4, 0.0, 0.2, 1)`;
	        },

	        show() {
	          hook1();
	        },

	        end() {
	          if (transitionOpacity) el.style.opacity = styleValues.second.opacity;
	          if (transitionScale) el.style.transform = `scale(${styleValues.second.scale / 100})`;
	        },

	        hide() {
	          hook2();
	        },

	        cleanup() {
	          if (transitionOpacity) el.style.opacity = opacityCache;
	          if (transitionScale) el.style.transform = transformCache;
	          if (transitionScale) el.style.transformOrigin = transformOriginCache;
	          el.style.transitionProperty = null;
	          el.style.transitionDuration = null;
	          el.style.transitionTimingFunction = null;
	        }

	      };
	      transition(el, stages, type, reject);
	    }

	    const ensureStringExpression = (expression, el, component) => {
	      return typeof expression === 'function' ? component.evaluateReturnExpression(el, expression) : expression;
	    };

	    function transitionClassesIn(el, component, directives, showCallback, reject) {
	      const enter = convertClassStringToArray(ensureStringExpression((directives.find(i => i.value === 'enter') || {
	        expression: ''
	      }).expression, el, component));
	      const enterStart = convertClassStringToArray(ensureStringExpression((directives.find(i => i.value === 'enter-start') || {
	        expression: ''
	      }).expression, el, component));
	      const enterEnd = convertClassStringToArray(ensureStringExpression((directives.find(i => i.value === 'enter-end') || {
	        expression: ''
	      }).expression, el, component));
	      transitionClasses(el, enter, enterStart, enterEnd, showCallback, () => {}, TRANSITION_TYPE_IN, reject);
	    }

	    function transitionClassesOut(el, component, directives, hideCallback, reject) {
	      const leave = convertClassStringToArray(ensureStringExpression((directives.find(i => i.value === 'leave') || {
	        expression: ''
	      }).expression, el, component));
	      const leaveStart = convertClassStringToArray(ensureStringExpression((directives.find(i => i.value === 'leave-start') || {
	        expression: ''
	      }).expression, el, component));
	      const leaveEnd = convertClassStringToArray(ensureStringExpression((directives.find(i => i.value === 'leave-end') || {
	        expression: ''
	      }).expression, el, component));
	      transitionClasses(el, leave, leaveStart, leaveEnd, () => {}, hideCallback, TRANSITION_TYPE_OUT, reject);
	    }

	    function transitionClasses(el, classesDuring, classesStart, classesEnd, hook1, hook2, type, reject) {
	      // clear the previous transition if exists to avoid caching the wrong classes
	      if (el.__x_transition) {
	        el.__x_transition.cancel && el.__x_transition.cancel();
	      }

	      const originalClasses = el.__x_original_classes || [];
	      const stages = {
	        start() {
	          el.classList.add(...classesStart);
	        },

	        during() {
	          el.classList.add(...classesDuring);
	        },

	        show() {
	          hook1();
	        },

	        end() {
	          // Don't remove classes that were in the original class attribute.
	          el.classList.remove(...classesStart.filter(i => !originalClasses.includes(i)));
	          el.classList.add(...classesEnd);
	        },

	        hide() {
	          hook2();
	        },

	        cleanup() {
	          el.classList.remove(...classesDuring.filter(i => !originalClasses.includes(i)));
	          el.classList.remove(...classesEnd.filter(i => !originalClasses.includes(i)));
	        }

	      };
	      transition(el, stages, type, reject);
	    }

	    function transition(el, stages, type, reject) {
	      const finish = once(() => {
	        stages.hide(); // Adding an "isConnected" check, in case the callback
	        // removed the element from the DOM.

	        if (el.isConnected) {
	          stages.cleanup();
	        }

	        delete el.__x_transition;
	      });
	      el.__x_transition = {
	        // Set transition type so we can avoid clearing transition if the direction is the same
	        type: type,
	        // create a callback for the last stages of the transition so we can call it
	        // from different point and early terminate it. Once will ensure that function
	        // is only called one time.
	        cancel: once(() => {
	          reject(TRANSITION_CANCELLED);
	          finish();
	        }),
	        finish,
	        // This store the next animation frame so we can cancel it
	        nextFrame: null
	      };
	      stages.start();
	      stages.during();
	      el.__x_transition.nextFrame = requestAnimationFrame(() => {
	        // Note: Safari's transitionDuration property will list out comma separated transition durations
	        // for every single transition property. Let's grab the first one and call it a day.
	        let duration = Number(getComputedStyle(el).transitionDuration.replace(/,.*/, '').replace('s', '')) * 1000;

	        if (duration === 0) {
	          duration = Number(getComputedStyle(el).animationDuration.replace('s', '')) * 1000;
	        }

	        stages.show();
	        el.__x_transition.nextFrame = requestAnimationFrame(() => {
	          stages.end();
	          setTimeout(el.__x_transition.finish, duration);
	        });
	      });
	    }

	    function isNumeric(subject) {
	      return !Array.isArray(subject) && !isNaN(subject);
	    } // Thanks @vuejs
	    // https://github.com/vuejs/vue/blob/4de4649d9637262a9b007720b59f80ac72a5620c/src/shared/util.js


	    function once(callback) {
	      let called = false;
	      return function () {
	        if (!called) {
	          called = true;
	          callback.apply(this, arguments);
	        }
	      };
	    }

	    function handleForDirective(component, templateEl, expression, initialUpdate, extraVars) {
	      warnIfMalformedTemplate(templateEl, 'x-for');
	      let iteratorNames = typeof expression === 'function' ? parseForExpression(component.evaluateReturnExpression(templateEl, expression)) : parseForExpression(expression);
	      let items = evaluateItemsAndReturnEmptyIfXIfIsPresentAndFalseOnElement(component, templateEl, iteratorNames, extraVars); // As we walk the array, we'll also walk the DOM (updating/creating as we go).

	      let currentEl = templateEl;
	      items.forEach((item, index) => {
	        let iterationScopeVariables = getIterationScopeVariables(iteratorNames, item, index, items, extraVars());
	        let currentKey = generateKeyForIteration(component, templateEl, index, iterationScopeVariables);
	        let nextEl = lookAheadForMatchingKeyedElementAndMoveItIfFound(currentEl.nextElementSibling, currentKey); // If we haven't found a matching key, insert the element at the current position.

	        if (!nextEl) {
	          nextEl = addElementInLoopAfterCurrentEl(templateEl, currentEl); // And transition it in if it's not the first page load.

	          transitionIn(nextEl, () => {}, () => {}, component, initialUpdate);
	          nextEl.__x_for = iterationScopeVariables;
	          component.initializeElements(nextEl, () => nextEl.__x_for); // Otherwise update the element we found.
	        } else {
	          // Temporarily remove the key indicator to allow the normal "updateElements" to work.
	          delete nextEl.__x_for_key;
	          nextEl.__x_for = iterationScopeVariables;
	          component.updateElements(nextEl, () => nextEl.__x_for);
	        }

	        currentEl = nextEl;
	        currentEl.__x_for_key = currentKey;
	      });
	      removeAnyLeftOverElementsFromPreviousUpdate(currentEl, component);
	    } // This was taken from VueJS 2.* core. Thanks Vue!


	    function parseForExpression(expression) {
	      let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
	      let stripParensRE = /^\(|\)$/g;
	      let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
	      let inMatch = expression.match(forAliasRE);
	      if (!inMatch) return;
	      let res = {};
	      res.items = inMatch[2].trim();
	      let item = inMatch[1].trim().replace(stripParensRE, '');
	      let iteratorMatch = item.match(forIteratorRE);

	      if (iteratorMatch) {
	        res.item = item.replace(forIteratorRE, '').trim();
	        res.index = iteratorMatch[1].trim();

	        if (iteratorMatch[2]) {
	          res.collection = iteratorMatch[2].trim();
	        }
	      } else {
	        res.item = item;
	      }

	      return res;
	    }

	    function getIterationScopeVariables(iteratorNames, item, index, items, extraVars) {
	      // We must create a new object, so each iteration has a new scope
	      let scopeVariables = extraVars ? _objectSpread2({}, extraVars) : {};
	      scopeVariables[iteratorNames.item] = item;
	      if (iteratorNames.index) scopeVariables[iteratorNames.index] = index;
	      if (iteratorNames.collection) scopeVariables[iteratorNames.collection] = items;
	      return scopeVariables;
	    }

	    function generateKeyForIteration(component, el, index, iterationScopeVariables) {
	      let bindKeyAttribute = getXAttrs(el, component, 'bind').filter(attr => attr.value === 'key')[0]; // If the dev hasn't specified a key, just return the index of the iteration.

	      if (!bindKeyAttribute) return index;
	      return component.evaluateReturnExpression(el, bindKeyAttribute.expression, () => iterationScopeVariables);
	    }

	    function evaluateItemsAndReturnEmptyIfXIfIsPresentAndFalseOnElement(component, el, iteratorNames, extraVars) {
	      let ifAttribute = getXAttrs(el, component, 'if')[0];

	      if (ifAttribute && !component.evaluateReturnExpression(el, ifAttribute.expression)) {
	        return [];
	      }

	      let items = component.evaluateReturnExpression(el, iteratorNames.items, extraVars); // This adds support for the `i in n` syntax.

	      if (isNumeric(items) && items > 0) {
	        items = Array.from(Array(items).keys(), i => i + 1);
	      }

	      return items;
	    }

	    function addElementInLoopAfterCurrentEl(templateEl, currentEl) {
	      let clone = document.importNode(templateEl.content, true);
	      currentEl.parentElement.insertBefore(clone, currentEl.nextElementSibling);
	      return currentEl.nextElementSibling;
	    }

	    function lookAheadForMatchingKeyedElementAndMoveItIfFound(nextEl, currentKey) {
	      if (!nextEl) return; // If we are already past the x-for generated elements, we don't need to look ahead.

	      if (nextEl.__x_for_key === undefined) return; // If the the key's DO match, no need to look ahead.

	      if (nextEl.__x_for_key === currentKey) return nextEl; // If they don't, we'll look ahead for a match.
	      // If we find it, we'll move it to the current position in the loop.

	      let tmpNextEl = nextEl;

	      while (tmpNextEl) {
	        if (tmpNextEl.__x_for_key === currentKey) {
	          return tmpNextEl.parentElement.insertBefore(tmpNextEl, nextEl);
	        }

	        tmpNextEl = tmpNextEl.nextElementSibling && tmpNextEl.nextElementSibling.__x_for_key !== undefined ? tmpNextEl.nextElementSibling : false;
	      }
	    }

	    function removeAnyLeftOverElementsFromPreviousUpdate(currentEl, component) {
	      var nextElementFromOldLoop = currentEl.nextElementSibling && currentEl.nextElementSibling.__x_for_key !== undefined ? currentEl.nextElementSibling : false;

	      while (nextElementFromOldLoop) {
	        let nextElementFromOldLoopImmutable = nextElementFromOldLoop;
	        let nextSibling = nextElementFromOldLoop.nextElementSibling;
	        transitionOut(nextElementFromOldLoop, () => {
	          nextElementFromOldLoopImmutable.remove();
	        }, () => {}, component);
	        nextElementFromOldLoop = nextSibling && nextSibling.__x_for_key !== undefined ? nextSibling : false;
	      }
	    }

	    function handleAttributeBindingDirective(component, el, attrName, expression, extraVars, attrType, modifiers) {
	      var value = component.evaluateReturnExpression(el, expression, extraVars);

	      if (attrName === 'value') {
	        if (Alpine.ignoreFocusedForValueBinding && document.activeElement.isSameNode(el)) return; // If nested model key is undefined, set the default value to empty string.

	        if (value === undefined && expression.match(/\./)) {
	          value = '';
	        }

	        if (el.type === 'radio') {
	          // Set radio value from x-bind:value, if no "value" attribute exists.
	          // If there are any initial state values, radio will have a correct
	          // "checked" value since x-bind:value is processed before x-model.
	          if (el.attributes.value === undefined && attrType === 'bind') {
	            el.value = value;
	          } else if (attrType !== 'bind') {
	            el.checked = checkedAttrLooseCompare(el.value, value);
	          }
	        } else if (el.type === 'checkbox') {
	          // If we are explicitly binding a string to the :value, set the string,
	          // If the value is a boolean, leave it alone, it will be set to "on"
	          // automatically.
	          if (typeof value !== 'boolean' && ![null, undefined].includes(value) && attrType === 'bind') {
	            el.value = String(value);
	          } else if (attrType !== 'bind') {
	            if (Array.isArray(value)) {
	              // I'm purposely not using Array.includes here because it's
	              // strict, and because of Numeric/String mis-casting, I
	              // want the "includes" to be "fuzzy".
	              el.checked = value.some(val => checkedAttrLooseCompare(val, el.value));
	            } else {
	              el.checked = !!value;
	            }
	          }
	        } else if (el.tagName === 'SELECT') {
	          updateSelect(el, value);
	        } else {
	          if (el.value === value) return;
	          el.value = value;
	        }
	      } else if (attrName === 'class') {
	        if (Array.isArray(value)) {
	          const originalClasses = el.__x_original_classes || [];
	          el.setAttribute('class', arrayUnique(originalClasses.concat(value)).join(' '));
	        } else if (typeof value === 'object') {
	          // Sorting the keys / class names by their boolean value will ensure that
	          // anything that evaluates to `false` and needs to remove classes is run first.
	          const keysSortedByBooleanValue = Object.keys(value).sort((a, b) => value[a] - value[b]);
	          keysSortedByBooleanValue.forEach(classNames => {
	            if (value[classNames]) {
	              convertClassStringToArray(classNames).forEach(className => el.classList.add(className));
	            } else {
	              convertClassStringToArray(classNames).forEach(className => el.classList.remove(className));
	            }
	          });
	        } else {
	          const originalClasses = el.__x_original_classes || [];
	          const newClasses = value ? convertClassStringToArray(value) : [];
	          el.setAttribute('class', arrayUnique(originalClasses.concat(newClasses)).join(' '));
	        }
	      } else {
	        attrName = modifiers.includes('camel') ? camelCase(attrName) : attrName; // If an attribute's bound value is null, undefined or false, remove the attribute

	        if ([null, undefined, false].includes(value)) {
	          el.removeAttribute(attrName);
	        } else {
	          isBooleanAttr(attrName) ? setIfChanged(el, attrName, attrName) : setIfChanged(el, attrName, value);
	        }
	      }
	    }

	    function setIfChanged(el, attrName, value) {
	      if (el.getAttribute(attrName) != value) {
	        el.setAttribute(attrName, value);
	      }
	    }

	    function updateSelect(el, value) {
	      const arrayWrappedValue = [].concat(value).map(value => {
	        return value + '';
	      });
	      Array.from(el.options).forEach(option => {
	        option.selected = arrayWrappedValue.includes(option.value || option.text);
	      });
	    }

	    function handleTextDirective(el, output, expression) {
	      // If nested model key is undefined, set the default value to empty string.
	      if (output === undefined && expression.match(/\./)) {
	        output = '';
	      }

	      el.textContent = output;
	    }

	    function handleHtmlDirective(component, el, expression, extraVars) {
	      el.innerHTML = component.evaluateReturnExpression(el, expression, extraVars);
	    }

	    function handleShowDirective(component, el, value, modifiers, initialUpdate = false) {
	      const hide = () => {
	        el.style.display = 'none';
	        el.__x_is_shown = false;
	      };

	      const show = () => {
	        if (el.style.length === 1 && el.style.display === 'none') {
	          el.removeAttribute('style');
	        } else {
	          el.style.removeProperty('display');
	        }

	        el.__x_is_shown = true;
	      };

	      if (initialUpdate === true) {
	        if (value) {
	          show();
	        } else {
	          hide();
	        }

	        return;
	      }

	      const handle = (resolve, reject) => {
	        if (value) {
	          if (el.style.display === 'none' || el.__x_transition) {
	            transitionIn(el, () => {
	              show();
	            }, reject, component);
	          }

	          resolve(() => {});
	        } else {
	          if (el.style.display !== 'none') {
	            transitionOut(el, () => {
	              resolve(() => {
	                hide();
	              });
	            }, reject, component);
	          } else {
	            resolve(() => {});
	          }
	        }
	      }; // The working of x-show is a bit complex because we need to
	      // wait for any child transitions to finish before hiding
	      // some element. Also, this has to be done recursively.
	      // If x-show.immediate, foregoe the waiting.


	      if (modifiers.includes('immediate')) {
	        handle(finish => finish(), () => {});
	        return;
	      } // x-show is encountered during a DOM tree walk. If an element
	      // we encounter is NOT a child of another x-show element we
	      // can execute the previous x-show stack (if one exists).


	      if (component.showDirectiveLastElement && !component.showDirectiveLastElement.contains(el)) {
	        component.executeAndClearRemainingShowDirectiveStack();
	      }

	      component.showDirectiveStack.push(handle);
	      component.showDirectiveLastElement = el;
	    }

	    function handleIfDirective(component, el, expressionResult, initialUpdate, extraVars) {
	      warnIfMalformedTemplate(el, 'x-if');
	      const elementHasAlreadyBeenAdded = el.nextElementSibling && el.nextElementSibling.__x_inserted_me === true;

	      if (expressionResult && (!elementHasAlreadyBeenAdded || el.__x_transition)) {
	        const clone = document.importNode(el.content, true);
	        el.parentElement.insertBefore(clone, el.nextElementSibling);
	        transitionIn(el.nextElementSibling, () => {}, () => {}, component, initialUpdate);
	        component.initializeElements(el.nextElementSibling, extraVars);
	        el.nextElementSibling.__x_inserted_me = true;
	      } else if (!expressionResult && elementHasAlreadyBeenAdded) {
	        transitionOut(el.nextElementSibling, () => {
	          el.nextElementSibling.remove();
	        }, () => {}, component, initialUpdate);
	      }
	    }

	    function registerListener(component, el, event, modifiers, expression, extraVars = {}) {
	      const options = {
	        passive: modifiers.includes('passive')
	      };

	      if (modifiers.includes('camel')) {
	        event = camelCase(event);
	      }

	      if (modifiers.includes('away')) {
	        let handler = e => {
	          // Don't do anything if the click came from the element or within it.
	          if (el.contains(e.target)) return; // Don't do anything if this element isn't currently visible.

	          if (el.offsetWidth < 1 && el.offsetHeight < 1) return; // Now that we are sure the element is visible, AND the click
	          // is from outside it, let's run the expression.

	          runListenerHandler(component, expression, e, extraVars);

	          if (modifiers.includes('once')) {
	            document.removeEventListener(event, handler, options);
	          }
	        }; // Listen for this event at the root level.


	        document.addEventListener(event, handler, options);
	      } else {
	        let listenerTarget = modifiers.includes('window') ? window : modifiers.includes('document') ? document : el;

	        let handler = e => {
	          // Remove this global event handler if the element that declared it
	          // has been removed. It's now stale.
	          if (listenerTarget === window || listenerTarget === document) {
	            if (!document.body.contains(el)) {
	              listenerTarget.removeEventListener(event, handler, options);
	              return;
	            }
	          }

	          if (isKeyEvent(event)) {
	            if (isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers)) {
	              return;
	            }
	          }

	          if (modifiers.includes('prevent')) e.preventDefault();
	          if (modifiers.includes('stop')) e.stopPropagation(); // If the .self modifier isn't present, or if it is present and
	          // the target element matches the element we are registering the
	          // event on, run the handler

	          if (!modifiers.includes('self') || e.target === el) {
	            const returnValue = runListenerHandler(component, expression, e, extraVars);
	            returnValue.then(value => {
	              if (value === false) {
	                e.preventDefault();
	              } else {
	                if (modifiers.includes('once')) {
	                  listenerTarget.removeEventListener(event, handler, options);
	                }
	              }
	            });
	          }
	        };

	        if (modifiers.includes('debounce')) {
	          let nextModifier = modifiers[modifiers.indexOf('debounce') + 1] || 'invalid-wait';
	          let wait = isNumeric(nextModifier.split('ms')[0]) ? Number(nextModifier.split('ms')[0]) : 250;
	          handler = debounce(handler, wait);
	        }

	        listenerTarget.addEventListener(event, handler, options);
	      }
	    }

	    function runListenerHandler(component, expression, e, extraVars) {
	      return component.evaluateCommandExpression(e.target, expression, () => {
	        return _objectSpread2(_objectSpread2({}, extraVars()), {}, {
	          '$event': e
	        });
	      });
	    }

	    function isKeyEvent(event) {
	      return ['keydown', 'keyup'].includes(event);
	    }

	    function isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers) {
	      let keyModifiers = modifiers.filter(i => {
	        return !['window', 'document', 'prevent', 'stop'].includes(i);
	      });

	      if (keyModifiers.includes('debounce')) {
	        let debounceIndex = keyModifiers.indexOf('debounce');
	        keyModifiers.splice(debounceIndex, isNumeric((keyModifiers[debounceIndex + 1] || 'invalid-wait').split('ms')[0]) ? 2 : 1);
	      } // If no modifier is specified, we'll call it a press.


	      if (keyModifiers.length === 0) return false; // If one is passed, AND it matches the key pressed, we'll call it a press.

	      if (keyModifiers.length === 1 && keyModifiers[0] === keyToModifier(e.key)) return false; // The user is listening for key combinations.

	      const systemKeyModifiers = ['ctrl', 'shift', 'alt', 'meta', 'cmd', 'super'];
	      const selectedSystemKeyModifiers = systemKeyModifiers.filter(modifier => keyModifiers.includes(modifier));
	      keyModifiers = keyModifiers.filter(i => !selectedSystemKeyModifiers.includes(i));

	      if (selectedSystemKeyModifiers.length > 0) {
	        const activelyPressedKeyModifiers = selectedSystemKeyModifiers.filter(modifier => {
	          // Alias "cmd" and "super" to "meta"
	          if (modifier === 'cmd' || modifier === 'super') modifier = 'meta';
	          return e[`${modifier}Key`];
	        }); // If all the modifiers selected are pressed, ...

	        if (activelyPressedKeyModifiers.length === selectedSystemKeyModifiers.length) {
	          // AND the remaining key is pressed as well. It's a press.
	          if (keyModifiers[0] === keyToModifier(e.key)) return false;
	        }
	      } // We'll call it NOT a valid keypress.


	      return true;
	    }

	    function keyToModifier(key) {
	      switch (key) {
	        case '/':
	          return 'slash';

	        case ' ':
	        case 'Spacebar':
	          return 'space';

	        default:
	          return key && kebabCase(key);
	      }
	    }

	    function registerModelListener(component, el, modifiers, expression, extraVars) {
	      // If the element we are binding to is a select, a radio, or checkbox
	      // we'll listen for the change event instead of the "input" event.
	      var event = el.tagName.toLowerCase() === 'select' || ['checkbox', 'radio'].includes(el.type) || modifiers.includes('lazy') ? 'change' : 'input';
	      const listenerExpression = `${expression} = rightSideOfExpression($event, ${expression})`;
	      registerListener(component, el, event, modifiers, listenerExpression, () => {
	        return _objectSpread2(_objectSpread2({}, extraVars()), {}, {
	          rightSideOfExpression: generateModelAssignmentFunction(el, modifiers, expression)
	        });
	      });
	    }

	    function generateModelAssignmentFunction(el, modifiers, expression) {
	      if (el.type === 'radio') {
	        // Radio buttons only work properly when they share a name attribute.
	        // People might assume we take care of that for them, because
	        // they already set a shared "x-model" attribute.
	        if (!el.hasAttribute('name')) el.setAttribute('name', expression);
	      }

	      return (event, currentValue) => {
	        // Check for event.detail due to an issue where IE11 handles other events as a CustomEvent.
	        if (event instanceof CustomEvent && event.detail) {
	          return event.detail;
	        } else if (el.type === 'checkbox') {
	          // If the data we are binding to is an array, toggle its value inside the array.
	          if (Array.isArray(currentValue)) {
	            const newValue = modifiers.includes('number') ? safeParseNumber(event.target.value) : event.target.value;
	            return event.target.checked ? currentValue.concat([newValue]) : currentValue.filter(el => !checkedAttrLooseCompare(el, newValue));
	          } else {
	            return event.target.checked;
	          }
	        } else if (el.tagName.toLowerCase() === 'select' && el.multiple) {
	          return modifiers.includes('number') ? Array.from(event.target.selectedOptions).map(option => {
	            const rawValue = option.value || option.text;
	            return safeParseNumber(rawValue);
	          }) : Array.from(event.target.selectedOptions).map(option => {
	            return option.value || option.text;
	          });
	        } else {
	          const rawValue = event.target.value;
	          return modifiers.includes('number') ? safeParseNumber(rawValue) : modifiers.includes('trim') ? rawValue.trim() : rawValue;
	        }
	      };
	    }

	    function safeParseNumber(rawValue) {
	      const number = rawValue ? parseFloat(rawValue) : null;
	      return isNumeric(number) ? number : rawValue;
	    }
	    /**
	     * Copyright (C) 2017 salesforce.com, inc.
	     */


	    const {
	      isArray
	    } = Array;
	    const {
	      getPrototypeOf,
	      create: ObjectCreate,
	      defineProperty: ObjectDefineProperty,
	      defineProperties: ObjectDefineProperties,
	      isExtensible,
	      getOwnPropertyDescriptor,
	      getOwnPropertyNames,
	      getOwnPropertySymbols,
	      preventExtensions,
	      hasOwnProperty
	    } = Object;
	    const {
	      push: ArrayPush,
	      concat: ArrayConcat,
	      map: ArrayMap
	    } = Array.prototype;

	    function isUndefined(obj) {
	      return obj === undefined;
	    }

	    function isFunction(obj) {
	      return typeof obj === 'function';
	    }

	    function isObject(obj) {
	      return typeof obj === 'object';
	    }

	    const proxyToValueMap = new WeakMap();

	    function registerProxy(proxy, value) {
	      proxyToValueMap.set(proxy, value);
	    }

	    const unwrap = replicaOrAny => proxyToValueMap.get(replicaOrAny) || replicaOrAny;

	    function wrapValue(membrane, value) {
	      return membrane.valueIsObservable(value) ? membrane.getProxy(value) : value;
	    }
	    /**
	     * Unwrap property descriptors will set value on original descriptor
	     * We only need to unwrap if value is specified
	     * @param descriptor external descrpitor provided to define new property on original value
	     */


	    function unwrapDescriptor(descriptor) {
	      if (hasOwnProperty.call(descriptor, 'value')) {
	        descriptor.value = unwrap(descriptor.value);
	      }

	      return descriptor;
	    }

	    function lockShadowTarget(membrane, shadowTarget, originalTarget) {
	      const targetKeys = ArrayConcat.call(getOwnPropertyNames(originalTarget), getOwnPropertySymbols(originalTarget));
	      targetKeys.forEach(key => {
	        let descriptor = getOwnPropertyDescriptor(originalTarget, key); // We do not need to wrap the descriptor if configurable
	        // Because we can deal with wrapping it when user goes through
	        // Get own property descriptor. There is also a chance that this descriptor
	        // could change sometime in the future, so we can defer wrapping
	        // until we need to

	        if (!descriptor.configurable) {
	          descriptor = wrapDescriptor(membrane, descriptor, wrapValue);
	        }

	        ObjectDefineProperty(shadowTarget, key, descriptor);
	      });
	      preventExtensions(shadowTarget);
	    }

	    class ReactiveProxyHandler {
	      constructor(membrane, value) {
	        this.originalTarget = value;
	        this.membrane = membrane;
	      }

	      get(shadowTarget, key) {
	        const {
	          originalTarget,
	          membrane
	        } = this;
	        const value = originalTarget[key];
	        const {
	          valueObserved
	        } = membrane;
	        valueObserved(originalTarget, key);
	        return membrane.getProxy(value);
	      }

	      set(shadowTarget, key, value) {
	        const {
	          originalTarget,
	          membrane: {
	            valueMutated
	          }
	        } = this;
	        const oldValue = originalTarget[key];

	        if (oldValue !== value) {
	          originalTarget[key] = value;
	          valueMutated(originalTarget, key);
	        } else if (key === 'length' && isArray(originalTarget)) {
	          // fix for issue #236: push will add the new index, and by the time length
	          // is updated, the internal length is already equal to the new length value
	          // therefore, the oldValue is equal to the value. This is the forking logic
	          // to support this use case.
	          valueMutated(originalTarget, key);
	        }

	        return true;
	      }

	      deleteProperty(shadowTarget, key) {
	        const {
	          originalTarget,
	          membrane: {
	            valueMutated
	          }
	        } = this;
	        delete originalTarget[key];
	        valueMutated(originalTarget, key);
	        return true;
	      }

	      apply(shadowTarget, thisArg, argArray) {
	        /* No op */
	      }

	      construct(target, argArray, newTarget) {
	        /* No op */
	      }

	      has(shadowTarget, key) {
	        const {
	          originalTarget,
	          membrane: {
	            valueObserved
	          }
	        } = this;
	        valueObserved(originalTarget, key);
	        return key in originalTarget;
	      }

	      ownKeys(shadowTarget) {
	        const {
	          originalTarget
	        } = this;
	        return ArrayConcat.call(getOwnPropertyNames(originalTarget), getOwnPropertySymbols(originalTarget));
	      }

	      isExtensible(shadowTarget) {
	        const shadowIsExtensible = isExtensible(shadowTarget);

	        if (!shadowIsExtensible) {
	          return shadowIsExtensible;
	        }

	        const {
	          originalTarget,
	          membrane
	        } = this;
	        const targetIsExtensible = isExtensible(originalTarget);

	        if (!targetIsExtensible) {
	          lockShadowTarget(membrane, shadowTarget, originalTarget);
	        }

	        return targetIsExtensible;
	      }

	      setPrototypeOf(shadowTarget, prototype) {}

	      getPrototypeOf(shadowTarget) {
	        const {
	          originalTarget
	        } = this;
	        return getPrototypeOf(originalTarget);
	      }

	      getOwnPropertyDescriptor(shadowTarget, key) {
	        const {
	          originalTarget,
	          membrane
	        } = this;
	        const {
	          valueObserved
	        } = this.membrane; // keys looked up via hasOwnProperty need to be reactive

	        valueObserved(originalTarget, key);
	        let desc = getOwnPropertyDescriptor(originalTarget, key);

	        if (isUndefined(desc)) {
	          return desc;
	        }

	        const shadowDescriptor = getOwnPropertyDescriptor(shadowTarget, key);

	        if (!isUndefined(shadowDescriptor)) {
	          return shadowDescriptor;
	        } // Note: by accessing the descriptor, the key is marked as observed
	        // but access to the value, setter or getter (if available) cannot observe
	        // mutations, just like regular methods, in which case we just do nothing.


	        desc = wrapDescriptor(membrane, desc, wrapValue);

	        if (!desc.configurable) {
	          // If descriptor from original target is not configurable,
	          // We must copy the wrapped descriptor over to the shadow target.
	          // Otherwise, proxy will throw an invariant error.
	          // This is our last chance to lock the value.
	          // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getOwnPropertyDescriptor#Invariants
	          ObjectDefineProperty(shadowTarget, key, desc);
	        }

	        return desc;
	      }

	      preventExtensions(shadowTarget) {
	        const {
	          originalTarget,
	          membrane
	        } = this;
	        lockShadowTarget(membrane, shadowTarget, originalTarget);
	        preventExtensions(originalTarget);
	        return true;
	      }

	      defineProperty(shadowTarget, key, descriptor) {
	        const {
	          originalTarget,
	          membrane
	        } = this;
	        const {
	          valueMutated
	        } = membrane;
	        const {
	          configurable
	        } = descriptor; // We have to check for value in descriptor
	        // because Object.freeze(proxy) calls this method
	        // with only { configurable: false, writeable: false }
	        // Additionally, method will only be called with writeable:false
	        // if the descriptor has a value, as opposed to getter/setter
	        // So we can just check if writable is present and then see if
	        // value is present. This eliminates getter and setter descriptors

	        if (hasOwnProperty.call(descriptor, 'writable') && !hasOwnProperty.call(descriptor, 'value')) {
	          const originalDescriptor = getOwnPropertyDescriptor(originalTarget, key);
	          descriptor.value = originalDescriptor.value;
	        }

	        ObjectDefineProperty(originalTarget, key, unwrapDescriptor(descriptor));

	        if (configurable === false) {
	          ObjectDefineProperty(shadowTarget, key, wrapDescriptor(membrane, descriptor, wrapValue));
	        }

	        valueMutated(originalTarget, key);
	        return true;
	      }

	    }

	    function wrapReadOnlyValue(membrane, value) {
	      return membrane.valueIsObservable(value) ? membrane.getReadOnlyProxy(value) : value;
	    }

	    class ReadOnlyHandler {
	      constructor(membrane, value) {
	        this.originalTarget = value;
	        this.membrane = membrane;
	      }

	      get(shadowTarget, key) {
	        const {
	          membrane,
	          originalTarget
	        } = this;
	        const value = originalTarget[key];
	        const {
	          valueObserved
	        } = membrane;
	        valueObserved(originalTarget, key);
	        return membrane.getReadOnlyProxy(value);
	      }

	      set(shadowTarget, key, value) {
	        return false;
	      }

	      deleteProperty(shadowTarget, key) {
	        return false;
	      }

	      apply(shadowTarget, thisArg, argArray) {
	        /* No op */
	      }

	      construct(target, argArray, newTarget) {
	        /* No op */
	      }

	      has(shadowTarget, key) {
	        const {
	          originalTarget,
	          membrane: {
	            valueObserved
	          }
	        } = this;
	        valueObserved(originalTarget, key);
	        return key in originalTarget;
	      }

	      ownKeys(shadowTarget) {
	        const {
	          originalTarget
	        } = this;
	        return ArrayConcat.call(getOwnPropertyNames(originalTarget), getOwnPropertySymbols(originalTarget));
	      }

	      setPrototypeOf(shadowTarget, prototype) {}

	      getOwnPropertyDescriptor(shadowTarget, key) {
	        const {
	          originalTarget,
	          membrane
	        } = this;
	        const {
	          valueObserved
	        } = membrane; // keys looked up via hasOwnProperty need to be reactive

	        valueObserved(originalTarget, key);
	        let desc = getOwnPropertyDescriptor(originalTarget, key);

	        if (isUndefined(desc)) {
	          return desc;
	        }

	        const shadowDescriptor = getOwnPropertyDescriptor(shadowTarget, key);

	        if (!isUndefined(shadowDescriptor)) {
	          return shadowDescriptor;
	        } // Note: by accessing the descriptor, the key is marked as observed
	        // but access to the value or getter (if available) cannot be observed,
	        // just like regular methods, in which case we just do nothing.


	        desc = wrapDescriptor(membrane, desc, wrapReadOnlyValue);

	        if (hasOwnProperty.call(desc, 'set')) {
	          desc.set = undefined; // readOnly membrane does not allow setters
	        }

	        if (!desc.configurable) {
	          // If descriptor from original target is not configurable,
	          // We must copy the wrapped descriptor over to the shadow target.
	          // Otherwise, proxy will throw an invariant error.
	          // This is our last chance to lock the value.
	          // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getOwnPropertyDescriptor#Invariants
	          ObjectDefineProperty(shadowTarget, key, desc);
	        }

	        return desc;
	      }

	      preventExtensions(shadowTarget) {
	        return false;
	      }

	      defineProperty(shadowTarget, key, descriptor) {
	        return false;
	      }

	    }

	    function createShadowTarget(value) {
	      let shadowTarget = undefined;

	      if (isArray(value)) {
	        shadowTarget = [];
	      } else if (isObject(value)) {
	        shadowTarget = {};
	      }

	      return shadowTarget;
	    }

	    const ObjectDotPrototype = Object.prototype;

	    function defaultValueIsObservable(value) {
	      // intentionally checking for null
	      if (value === null) {
	        return false;
	      } // treat all non-object types, including undefined, as non-observable values


	      if (typeof value !== 'object') {
	        return false;
	      }

	      if (isArray(value)) {
	        return true;
	      }

	      const proto = getPrototypeOf(value);
	      return proto === ObjectDotPrototype || proto === null || getPrototypeOf(proto) === null;
	    }

	    const defaultValueObserved = (obj, key) => {
	      /* do nothing */
	    };

	    const defaultValueMutated = (obj, key) => {
	      /* do nothing */
	    };

	    const defaultValueDistortion = value => value;

	    function wrapDescriptor(membrane, descriptor, getValue) {
	      const {
	        set,
	        get
	      } = descriptor;

	      if (hasOwnProperty.call(descriptor, 'value')) {
	        descriptor.value = getValue(membrane, descriptor.value);
	      } else {
	        if (!isUndefined(get)) {
	          descriptor.get = function () {
	            // invoking the original getter with the original target
	            return getValue(membrane, get.call(unwrap(this)));
	          };
	        }

	        if (!isUndefined(set)) {
	          descriptor.set = function (value) {
	            // At this point we don't have a clear indication of whether
	            // or not a valid mutation will occur, we don't have the key,
	            // and we are not sure why and how they are invoking this setter.
	            // Nevertheless we preserve the original semantics by invoking the
	            // original setter with the original target and the unwrapped value
	            set.call(unwrap(this), membrane.unwrapProxy(value));
	          };
	        }
	      }

	      return descriptor;
	    }

	    class ReactiveMembrane {
	      constructor(options) {
	        this.valueDistortion = defaultValueDistortion;
	        this.valueMutated = defaultValueMutated;
	        this.valueObserved = defaultValueObserved;
	        this.valueIsObservable = defaultValueIsObservable;
	        this.objectGraph = new WeakMap();

	        if (!isUndefined(options)) {
	          const {
	            valueDistortion,
	            valueMutated,
	            valueObserved,
	            valueIsObservable
	          } = options;
	          this.valueDistortion = isFunction(valueDistortion) ? valueDistortion : defaultValueDistortion;
	          this.valueMutated = isFunction(valueMutated) ? valueMutated : defaultValueMutated;
	          this.valueObserved = isFunction(valueObserved) ? valueObserved : defaultValueObserved;
	          this.valueIsObservable = isFunction(valueIsObservable) ? valueIsObservable : defaultValueIsObservable;
	        }
	      }

	      getProxy(value) {
	        const unwrappedValue = unwrap(value);
	        const distorted = this.valueDistortion(unwrappedValue);

	        if (this.valueIsObservable(distorted)) {
	          const o = this.getReactiveState(unwrappedValue, distorted); // when trying to extract the writable version of a readonly
	          // we return the readonly.

	          return o.readOnly === value ? value : o.reactive;
	        }

	        return distorted;
	      }

	      getReadOnlyProxy(value) {
	        value = unwrap(value);
	        const distorted = this.valueDistortion(value);

	        if (this.valueIsObservable(distorted)) {
	          return this.getReactiveState(value, distorted).readOnly;
	        }

	        return distorted;
	      }

	      unwrapProxy(p) {
	        return unwrap(p);
	      }

	      getReactiveState(value, distortedValue) {
	        const {
	          objectGraph
	        } = this;
	        let reactiveState = objectGraph.get(distortedValue);

	        if (reactiveState) {
	          return reactiveState;
	        }

	        const membrane = this;
	        reactiveState = {
	          get reactive() {
	            const reactiveHandler = new ReactiveProxyHandler(membrane, distortedValue); // caching the reactive proxy after the first time it is accessed

	            const proxy = new Proxy(createShadowTarget(distortedValue), reactiveHandler);
	            registerProxy(proxy, value);
	            ObjectDefineProperty(this, 'reactive', {
	              value: proxy
	            });
	            return proxy;
	          },

	          get readOnly() {
	            const readOnlyHandler = new ReadOnlyHandler(membrane, distortedValue); // caching the readOnly proxy after the first time it is accessed

	            const proxy = new Proxy(createShadowTarget(distortedValue), readOnlyHandler);
	            registerProxy(proxy, value);
	            ObjectDefineProperty(this, 'readOnly', {
	              value: proxy
	            });
	            return proxy;
	          }

	        };
	        objectGraph.set(distortedValue, reactiveState);
	        return reactiveState;
	      }

	    }
	    /** version: 0.26.0 */


	    function wrap(data, mutationCallback) {
	      let membrane = new ReactiveMembrane({
	        valueMutated(target, key) {
	          mutationCallback(target, key);
	        }

	      });
	      return {
	        data: membrane.getProxy(data),
	        membrane: membrane
	      };
	    }

	    function unwrap$1(membrane, observable) {
	      let unwrappedData = membrane.unwrapProxy(observable);
	      let copy = {};
	      Object.keys(unwrappedData).forEach(key => {
	        if (['$el', '$refs', '$nextTick', '$watch'].includes(key)) return;
	        copy[key] = unwrappedData[key];
	      });
	      return copy;
	    }

	    class Component {
	      constructor(el, componentForClone = null) {
	        this.$el = el;
	        const dataAttr = this.$el.getAttribute('x-data');
	        const dataExpression = dataAttr === '' ? '{}' : dataAttr;
	        const initExpression = this.$el.getAttribute('x-init');
	        let dataExtras = {
	          $el: this.$el
	        };
	        let canonicalComponentElementReference = componentForClone ? componentForClone.$el : this.$el;
	        Object.entries(Alpine.magicProperties).forEach(([name, callback]) => {
	          Object.defineProperty(dataExtras, `$${name}`, {
	            get: function get() {
	              return callback(canonicalComponentElementReference);
	            }
	          });
	        });
	        this.unobservedData = componentForClone ? componentForClone.getUnobservedData() : saferEval(el, dataExpression, dataExtras); // Construct a Proxy-based observable. This will be used to handle reactivity.

	        let {
	          membrane,
	          data
	        } = this.wrapDataInObservable(this.unobservedData);
	        this.$data = data;
	        this.membrane = membrane; // After making user-supplied data methods reactive, we can now add
	        // our magic properties to the original data for access.

	        this.unobservedData.$el = this.$el;
	        this.unobservedData.$refs = this.getRefsProxy();
	        this.nextTickStack = [];

	        this.unobservedData.$nextTick = callback => {
	          this.nextTickStack.push(callback);
	        };

	        this.watchers = {};

	        this.unobservedData.$watch = (property, callback) => {
	          if (!this.watchers[property]) this.watchers[property] = [];
	          this.watchers[property].push(callback);
	        };
	        /* MODERN-ONLY:START */
	        // We remove this piece of code from the legacy build.
	        // In IE11, we have already defined our helpers at this point.
	        // Register custom magic properties.


	        Object.entries(Alpine.magicProperties).forEach(([name, callback]) => {
	          Object.defineProperty(this.unobservedData, `$${name}`, {
	            get: function get() {
	              return callback(canonicalComponentElementReference, this.$el);
	            }
	          });
	        });
	        /* MODERN-ONLY:END */

	        this.showDirectiveStack = [];
	        componentForClone || Alpine.onBeforeComponentInitializeds.forEach(callback => callback(this));
	        var initReturnedCallback; // If x-init is present AND we aren't cloning (skip x-init on clone)

	        if (initExpression && !componentForClone) {
	          // We want to allow data manipulation, but not trigger DOM updates just yet.
	          // We haven't even initialized the elements with their Alpine bindings. I mean c'mon.
	          this.pauseReactivity = true;
	          initReturnedCallback = this.evaluateReturnExpression(this.$el, initExpression);
	          this.pauseReactivity = false;
	        } // Register all our listeners and set all our attribute bindings.


	        this.initializeElements(this.$el); // Use mutation observer to detect new elements being added within this component at run-time.
	        // Alpine's just so darn flexible amirite?

	        this.listenForNewElementsToInitialize();

	        if (typeof initReturnedCallback === 'function') {
	          // Run the callback returned from the "x-init" hook to allow the user to do stuff after
	          // Alpine's got it's grubby little paws all over everything.
	          initReturnedCallback.call(this.$data);
	        }

	        componentForClone || setTimeout(() => {
	          Alpine.onComponentInitializeds.forEach(callback => callback(this));
	        }, 0);
	      }

	      getUnobservedData() {
	        return unwrap$1(this.membrane, this.$data);
	      }

	      wrapDataInObservable(data) {
	        var self = this;
	        let updateDom = debounce(function () {
	          self.updateElements(self.$el);
	        }, 0);
	        return wrap(data, (target, key) => {
	          if (self.watchers[key]) {
	            // If there's a watcher for this specific key, run it.
	            self.watchers[key].forEach(callback => callback(target[key]));
	          } else if (Array.isArray(target)) {
	            // Arrays are special cases, if any of the items change, we consider the array as mutated.
	            Object.keys(self.watchers).forEach(fullDotNotationKey => {
	              let dotNotationParts = fullDotNotationKey.split('.'); // Ignore length mutations since they would result in duplicate calls.
	              // For example, when calling push, we would get a mutation for the item's key
	              // and a second mutation for the length property.

	              if (key === 'length') return;
	              dotNotationParts.reduce((comparisonData, part) => {
	                if (Object.is(target, comparisonData[part])) {
	                  self.watchers[fullDotNotationKey].forEach(callback => callback(target));
	                }

	                return comparisonData[part];
	              }, self.unobservedData);
	            });
	          } else {
	            // Let's walk through the watchers with "dot-notation" (foo.bar) and see
	            // if this mutation fits any of them.
	            Object.keys(self.watchers).filter(i => i.includes('.')).forEach(fullDotNotationKey => {
	              let dotNotationParts = fullDotNotationKey.split('.'); // If this dot-notation watcher's last "part" doesn't match the current
	              // key, then skip it early for performance reasons.

	              if (key !== dotNotationParts[dotNotationParts.length - 1]) return; // Now, walk through the dot-notation "parts" recursively to find
	              // a match, and call the watcher if one's found.

	              dotNotationParts.reduce((comparisonData, part) => {
	                if (Object.is(target, comparisonData)) {
	                  // Run the watchers.
	                  self.watchers[fullDotNotationKey].forEach(callback => callback(target[key]));
	                }

	                return comparisonData[part];
	              }, self.unobservedData);
	            });
	          } // Don't react to data changes for cases like the `x-created` hook.


	          if (self.pauseReactivity) return;
	          updateDom();
	        });
	      }

	      walkAndSkipNestedComponents(el, callback, initializeComponentCallback = () => {}) {
	        walk(el, el => {
	          // We've hit a component.
	          if (el.hasAttribute('x-data')) {
	            // If it's not the current one.
	            if (!el.isSameNode(this.$el)) {
	              // Initialize it if it's not.
	              if (!el.__x) initializeComponentCallback(el); // Now we'll let that sub-component deal with itself.

	              return false;
	            }
	          }

	          return callback(el);
	        });
	      }

	      initializeElements(rootEl, extraVars = () => {}) {
	        this.walkAndSkipNestedComponents(rootEl, el => {
	          // Don't touch spawns from for loop
	          if (el.__x_for_key !== undefined) return false; // Don't touch spawns from if directives

	          if (el.__x_inserted_me !== undefined) return false;
	          this.initializeElement(el, extraVars);
	        }, el => {
	          el.__x = new Component(el);
	        });
	        this.executeAndClearRemainingShowDirectiveStack();
	        this.executeAndClearNextTickStack(rootEl);
	      }

	      initializeElement(el, extraVars) {
	        // To support class attribute merging, we have to know what the element's
	        // original class attribute looked like for reference.
	        if (el.hasAttribute('class') && getXAttrs(el, this).length > 0) {
	          el.__x_original_classes = convertClassStringToArray(el.getAttribute('class'));
	        }

	        this.registerListeners(el, extraVars);
	        this.resolveBoundAttributes(el, true, extraVars);
	      }

	      updateElements(rootEl, extraVars = () => {}) {
	        this.walkAndSkipNestedComponents(rootEl, el => {
	          // Don't touch spawns from for loop (and check if the root is actually a for loop in a parent, don't skip it.)
	          if (el.__x_for_key !== undefined && !el.isSameNode(this.$el)) return false;
	          this.updateElement(el, extraVars);
	        }, el => {
	          el.__x = new Component(el);
	        });
	        this.executeAndClearRemainingShowDirectiveStack();
	        this.executeAndClearNextTickStack(rootEl);
	      }

	      executeAndClearNextTickStack(el) {
	        // Skip spawns from alpine directives
	        if (el === this.$el && this.nextTickStack.length > 0) {
	          // We run the tick stack after the next frame to allow any
	          // running transitions to pass the initial show stage.
	          requestAnimationFrame(() => {
	            while (this.nextTickStack.length > 0) {
	              this.nextTickStack.shift()();
	            }
	          });
	        }
	      }

	      executeAndClearRemainingShowDirectiveStack() {
	        // The goal here is to start all the x-show transitions
	        // and build a nested promise chain so that elements
	        // only hide when the children are finished hiding.
	        this.showDirectiveStack.reverse().map(handler => {
	          return new Promise((resolve, reject) => {
	            handler(resolve, reject);
	          });
	        }).reduce((promiseChain, promise) => {
	          return promiseChain.then(() => {
	            return promise.then(finishElement => {
	              finishElement();
	            });
	          });
	        }, Promise.resolve(() => {})).catch(e => {
	          if (e !== TRANSITION_CANCELLED) throw e;
	        }); // We've processed the handler stack. let's clear it.

	        this.showDirectiveStack = [];
	        this.showDirectiveLastElement = undefined;
	      }

	      updateElement(el, extraVars) {
	        this.resolveBoundAttributes(el, false, extraVars);
	      }

	      registerListeners(el, extraVars) {
	        getXAttrs(el, this).forEach(({
	          type,
	          value,
	          modifiers,
	          expression
	        }) => {
	          switch (type) {
	            case 'on':
	              registerListener(this, el, value, modifiers, expression, extraVars);
	              break;

	            case 'model':
	              registerModelListener(this, el, modifiers, expression, extraVars);
	              break;
	          }
	        });
	      }

	      resolveBoundAttributes(el, initialUpdate = false, extraVars) {
	        let attrs = getXAttrs(el, this);
	        attrs.forEach(({
	          type,
	          value,
	          modifiers,
	          expression
	        }) => {
	          switch (type) {
	            case 'model':
	              handleAttributeBindingDirective(this, el, 'value', expression, extraVars, type, modifiers);
	              break;

	            case 'bind':
	              // The :key binding on an x-for is special, ignore it.
	              if (el.tagName.toLowerCase() === 'template' && value === 'key') return;
	              handleAttributeBindingDirective(this, el, value, expression, extraVars, type, modifiers);
	              break;

	            case 'text':
	              var output = this.evaluateReturnExpression(el, expression, extraVars);
	              handleTextDirective(el, output, expression);
	              break;

	            case 'html':
	              handleHtmlDirective(this, el, expression, extraVars);
	              break;

	            case 'show':
	              var output = this.evaluateReturnExpression(el, expression, extraVars);
	              handleShowDirective(this, el, output, modifiers, initialUpdate);
	              break;

	            case 'if':
	              // If this element also has x-for on it, don't process x-if.
	              // We will let the "x-for" directive handle the "if"ing.
	              if (attrs.some(i => i.type === 'for')) return;
	              var output = this.evaluateReturnExpression(el, expression, extraVars);
	              handleIfDirective(this, el, output, initialUpdate, extraVars);
	              break;

	            case 'for':
	              handleForDirective(this, el, expression, initialUpdate, extraVars);
	              break;

	            case 'cloak':
	              el.removeAttribute('x-cloak');
	              break;
	          }
	        });
	      }

	      evaluateReturnExpression(el, expression, extraVars = () => {}) {
	        return saferEval(el, expression, this.$data, _objectSpread2(_objectSpread2({}, extraVars()), {}, {
	          $dispatch: this.getDispatchFunction(el)
	        }));
	      }

	      evaluateCommandExpression(el, expression, extraVars = () => {}) {
	        return saferEvalNoReturn(el, expression, this.$data, _objectSpread2(_objectSpread2({}, extraVars()), {}, {
	          $dispatch: this.getDispatchFunction(el)
	        }));
	      }

	      getDispatchFunction(el) {
	        return (event, detail = {}) => {
	          el.dispatchEvent(new CustomEvent(event, {
	            detail,
	            bubbles: true
	          }));
	        };
	      }

	      listenForNewElementsToInitialize() {
	        const targetNode = this.$el;
	        const observerOptions = {
	          childList: true,
	          attributes: true,
	          subtree: true
	        };
	        const observer = new MutationObserver(mutations => {
	          for (let i = 0; i < mutations.length; i++) {
	            // Filter out mutations triggered from child components.
	            const closestParentComponent = mutations[i].target.closest('[x-data]');
	            if (!(closestParentComponent && closestParentComponent.isSameNode(this.$el))) continue;

	            if (mutations[i].type === 'attributes' && mutations[i].attributeName === 'x-data') {
	              const xAttr = mutations[i].target.getAttribute('x-data') || '{}';
	              const rawData = saferEval(this.$el, xAttr, {
	                $el: this.$el
	              });
	              Object.keys(rawData).forEach(key => {
	                if (this.$data[key] !== rawData[key]) {
	                  this.$data[key] = rawData[key];
	                }
	              });
	            }

	            if (mutations[i].addedNodes.length > 0) {
	              mutations[i].addedNodes.forEach(node => {
	                if (node.nodeType !== 1 || node.__x_inserted_me) return;

	                if (node.matches('[x-data]') && !node.__x) {
	                  node.__x = new Component(node);
	                  return;
	                }

	                this.initializeElements(node);
	              });
	            }
	          }
	        });
	        observer.observe(targetNode, observerOptions);
	      }

	      getRefsProxy() {
	        var self = this;
	        var refObj = {}; // One of the goals of this is to not hold elements in memory, but rather re-evaluate
	        // the DOM when the system needs something from it. This way, the framework is flexible and
	        // friendly to outside DOM changes from libraries like Vue/Livewire.
	        // For this reason, I'm using an "on-demand" proxy to fake a "$refs" object.

	        return new Proxy(refObj, {
	          get(object, property) {
	            if (property === '$isAlpineProxy') return true;
	            var ref; // We can't just query the DOM because it's hard to filter out refs in
	            // nested components.

	            self.walkAndSkipNestedComponents(self.$el, el => {
	              if (el.hasAttribute('x-ref') && el.getAttribute('x-ref') === property) {
	                ref = el;
	              }
	            });
	            return ref;
	          }

	        });
	      }

	    }

	    const Alpine = {
	      version: "2.8.0",
	      pauseMutationObserver: false,
	      magicProperties: {},
	      onComponentInitializeds: [],
	      onBeforeComponentInitializeds: [],
	      ignoreFocusedForValueBinding: false,
	      start: async function start() {
	        if (!isTesting()) {
	          await domReady();
	        }

	        this.discoverComponents(el => {
	          this.initializeComponent(el);
	        }); // It's easier and more performant to just support Turbolinks than listen
	        // to MutationObserver mutations at the document level.

	        document.addEventListener("turbolinks:load", () => {
	          this.discoverUninitializedComponents(el => {
	            this.initializeComponent(el);
	          });
	        });
	        this.listenForNewUninitializedComponentsAtRunTime();
	      },
	      discoverComponents: function discoverComponents(callback) {
	        const rootEls = document.querySelectorAll('[x-data]');
	        rootEls.forEach(rootEl => {
	          callback(rootEl);
	        });
	      },
	      discoverUninitializedComponents: function discoverUninitializedComponents(callback, el = null) {
	        const rootEls = (el || document).querySelectorAll('[x-data]');
	        Array.from(rootEls).filter(el => el.__x === undefined).forEach(rootEl => {
	          callback(rootEl);
	        });
	      },
	      listenForNewUninitializedComponentsAtRunTime: function listenForNewUninitializedComponentsAtRunTime() {
	        const targetNode = document.querySelector('body');
	        const observerOptions = {
	          childList: true,
	          attributes: true,
	          subtree: true
	        };
	        const observer = new MutationObserver(mutations => {
	          if (this.pauseMutationObserver) return;

	          for (let i = 0; i < mutations.length; i++) {
	            if (mutations[i].addedNodes.length > 0) {
	              mutations[i].addedNodes.forEach(node => {
	                // Discard non-element nodes (like line-breaks)
	                if (node.nodeType !== 1) return; // Discard any changes happening within an existing component.
	                // They will take care of themselves.

	                if (node.parentElement && node.parentElement.closest('[x-data]')) return;
	                this.discoverUninitializedComponents(el => {
	                  this.initializeComponent(el);
	                }, node.parentElement);
	              });
	            }
	          }
	        });
	        observer.observe(targetNode, observerOptions);
	      },
	      initializeComponent: function initializeComponent(el) {
	        if (!el.__x) {
	          // Wrap in a try/catch so that we don't prevent other components
	          // from initializing when one component contains an error.
	          try {
	            el.__x = new Component(el);
	          } catch (error) {
	            setTimeout(() => {
	              throw error;
	            }, 0);
	          }
	        }
	      },
	      clone: function clone(component, newEl) {
	        if (!newEl.__x) {
	          newEl.__x = new Component(newEl, component);
	        }
	      },
	      addMagicProperty: function addMagicProperty(name, callback) {
	        this.magicProperties[name] = callback;
	      },
	      onComponentInitialized: function onComponentInitialized(callback) {
	        this.onComponentInitializeds.push(callback);
	      },
	      onBeforeComponentInitialized: function onBeforeComponentInitialized(callback) {
	        this.onBeforeComponentInitializeds.push(callback);
	      }
	    };

	    if (!isTesting()) {
	      window.Alpine = Alpine;

	      if (window.deferLoadingAlpine) {
	        window.deferLoadingAlpine(function () {
	          window.Alpine.start();
	        });
	      } else {
	        window.Alpine.start();
	      }
	    }

	    return Alpine;
	  });
	});

	/*! algoliasearch-lite.umd.js | 4.8.3 | © Algolia, inc. | https://github.com/algolia/algoliasearch-client-javascript */
	var algoliasearchLite_umd = createCommonjsModule(function (module, exports) {
	  !function (e, t) {
	     module.exports = t() ;
	  }(commonjsGlobal, function () {

	    function e(e, t, r) {
	      return t in e ? Object.defineProperty(e, t, {
	        value: r,
	        enumerable: !0,
	        configurable: !0,
	        writable: !0
	      }) : e[t] = r, e;
	    }

	    function t(e, t) {
	      var r = Object.keys(e);

	      if (Object.getOwnPropertySymbols) {
	        var n = Object.getOwnPropertySymbols(e);
	        t && (n = n.filter(function (t) {
	          return Object.getOwnPropertyDescriptor(e, t).enumerable;
	        })), r.push.apply(r, n);
	      }

	      return r;
	    }

	    function r(r) {
	      for (var n = 1; n < arguments.length; n++) {
	        var o = null != arguments[n] ? arguments[n] : {};
	        n % 2 ? t(Object(o), !0).forEach(function (t) {
	          e(r, t, o[t]);
	        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(r, Object.getOwnPropertyDescriptors(o)) : t(Object(o)).forEach(function (e) {
	          Object.defineProperty(r, e, Object.getOwnPropertyDescriptor(o, e));
	        });
	      }

	      return r;
	    }

	    function n(e, t) {
	      if (null == e) return {};

	      var r,
	          n,
	          o = function (e, t) {
	        if (null == e) return {};
	        var r,
	            n,
	            o = {},
	            a = Object.keys(e);

	        for (n = 0; n < a.length; n++) r = a[n], t.indexOf(r) >= 0 || (o[r] = e[r]);

	        return o;
	      }(e, t);

	      if (Object.getOwnPropertySymbols) {
	        var a = Object.getOwnPropertySymbols(e);

	        for (n = 0; n < a.length; n++) r = a[n], t.indexOf(r) >= 0 || Object.prototype.propertyIsEnumerable.call(e, r) && (o[r] = e[r]);
	      }

	      return o;
	    }

	    function o(e, t) {
	      return function (e) {
	        if (Array.isArray(e)) return e;
	      }(e) || function (e, t) {
	        if (!(Symbol.iterator in Object(e) || "[object Arguments]" === Object.prototype.toString.call(e))) return;
	        var r = [],
	            n = !0,
	            o = !1,
	            a = void 0;

	        try {
	          for (var u, i = e[Symbol.iterator](); !(n = (u = i.next()).done) && (r.push(u.value), !t || r.length !== t); n = !0);
	        } catch (e) {
	          o = !0, a = e;
	        } finally {
	          try {
	            n || null == i.return || i.return();
	          } finally {
	            if (o) throw a;
	          }
	        }

	        return r;
	      }(e, t) || function () {
	        throw new TypeError("Invalid attempt to destructure non-iterable instance");
	      }();
	    }

	    function a(e) {
	      return function (e) {
	        if (Array.isArray(e)) {
	          for (var t = 0, r = new Array(e.length); t < e.length; t++) r[t] = e[t];

	          return r;
	        }
	      }(e) || function (e) {
	        if (Symbol.iterator in Object(e) || "[object Arguments]" === Object.prototype.toString.call(e)) return Array.from(e);
	      }(e) || function () {
	        throw new TypeError("Invalid attempt to spread non-iterable instance");
	      }();
	    }

	    function u(e) {
	      var t,
	          r = "algoliasearch-client-js-".concat(e.key),
	          n = function () {
	        return void 0 === t && (t = e.localStorage || window.localStorage), t;
	      },
	          a = function () {
	        return JSON.parse(n().getItem(r) || "{}");
	      };

	      return {
	        get: function (e, t) {
	          var r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {
	            miss: function () {
	              return Promise.resolve();
	            }
	          };
	          return Promise.resolve().then(function () {
	            var r = JSON.stringify(e),
	                n = a()[r];
	            return Promise.all([n || t(), void 0 !== n]);
	          }).then(function (e) {
	            var t = o(e, 2),
	                n = t[0],
	                a = t[1];
	            return Promise.all([n, a || r.miss(n)]);
	          }).then(function (e) {
	            return o(e, 1)[0];
	          });
	        },
	        set: function (e, t) {
	          return Promise.resolve().then(function () {
	            var o = a();
	            return o[JSON.stringify(e)] = t, n().setItem(r, JSON.stringify(o)), t;
	          });
	        },
	        delete: function (e) {
	          return Promise.resolve().then(function () {
	            var t = a();
	            delete t[JSON.stringify(e)], n().setItem(r, JSON.stringify(t));
	          });
	        },
	        clear: function () {
	          return Promise.resolve().then(function () {
	            n().removeItem(r);
	          });
	        }
	      };
	    }

	    function i(e) {
	      var t = a(e.caches),
	          r = t.shift();
	      return void 0 === r ? {
	        get: function (e, t) {
	          var r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {
	            miss: function () {
	              return Promise.resolve();
	            }
	          },
	              n = t();
	          return n.then(function (e) {
	            return Promise.all([e, r.miss(e)]);
	          }).then(function (e) {
	            return o(e, 1)[0];
	          });
	        },
	        set: function (e, t) {
	          return Promise.resolve(t);
	        },
	        delete: function (e) {
	          return Promise.resolve();
	        },
	        clear: function () {
	          return Promise.resolve();
	        }
	      } : {
	        get: function (e, n) {
	          var o = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {
	            miss: function () {
	              return Promise.resolve();
	            }
	          };
	          return r.get(e, n, o).catch(function () {
	            return i({
	              caches: t
	            }).get(e, n, o);
	          });
	        },
	        set: function (e, n) {
	          return r.set(e, n).catch(function () {
	            return i({
	              caches: t
	            }).set(e, n);
	          });
	        },
	        delete: function (e) {
	          return r.delete(e).catch(function () {
	            return i({
	              caches: t
	            }).delete(e);
	          });
	        },
	        clear: function () {
	          return r.clear().catch(function () {
	            return i({
	              caches: t
	            }).clear();
	          });
	        }
	      };
	    }

	    function s() {
	      var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {
	        serializable: !0
	      },
	          t = {};
	      return {
	        get: function (r, n) {
	          var o = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {
	            miss: function () {
	              return Promise.resolve();
	            }
	          },
	              a = JSON.stringify(r);
	          if (a in t) return Promise.resolve(e.serializable ? JSON.parse(t[a]) : t[a]);

	          var u = n(),
	              i = o && o.miss || function () {
	            return Promise.resolve();
	          };

	          return u.then(function (e) {
	            return i(e);
	          }).then(function () {
	            return u;
	          });
	        },
	        set: function (r, n) {
	          return t[JSON.stringify(r)] = e.serializable ? JSON.stringify(n) : n, Promise.resolve(n);
	        },
	        delete: function (e) {
	          return delete t[JSON.stringify(e)], Promise.resolve();
	        },
	        clear: function () {
	          return t = {}, Promise.resolve();
	        }
	      };
	    }

	    function c(e) {
	      for (var t = e.length - 1; t > 0; t--) {
	        var r = Math.floor(Math.random() * (t + 1)),
	            n = e[t];
	        e[t] = e[r], e[r] = n;
	      }

	      return e;
	    }

	    function l(e, t) {
	      return t ? (Object.keys(t).forEach(function (r) {
	        e[r] = t[r](e);
	      }), e) : e;
	    }

	    function f(e) {
	      for (var t = arguments.length, r = new Array(t > 1 ? t - 1 : 0), n = 1; n < t; n++) r[n - 1] = arguments[n];

	      var o = 0;
	      return e.replace(/%s/g, function () {
	        return encodeURIComponent(r[o++]);
	      });
	    }

	    var h = {
	      WithinQueryParameters: 0,
	      WithinHeaders: 1
	    };

	    function d(e, t) {
	      var r = e || {},
	          n = r.data || {};
	      return Object.keys(r).forEach(function (e) {
	        -1 === ["timeout", "headers", "queryParameters", "data", "cacheable"].indexOf(e) && (n[e] = r[e]);
	      }), {
	        data: Object.entries(n).length > 0 ? n : void 0,
	        timeout: r.timeout || t,
	        headers: r.headers || {},
	        queryParameters: r.queryParameters || {},
	        cacheable: r.cacheable
	      };
	    }

	    var m = {
	      Read: 1,
	      Write: 2,
	      Any: 3
	    },
	        p = 1,
	        v = 2,
	        y = 3;

	    function g(e) {
	      var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : p;
	      return r(r({}, e), {}, {
	        status: t,
	        lastUpdate: Date.now()
	      });
	    }

	    function b(e) {
	      return "string" == typeof e ? {
	        protocol: "https",
	        url: e,
	        accept: m.Any
	      } : {
	        protocol: e.protocol || "https",
	        url: e.url,
	        accept: e.accept || m.Any
	      };
	    }

	    var O = "GET",
	        P = "POST";

	    function q(e, t) {
	      return Promise.all(t.map(function (t) {
	        return e.get(t, function () {
	          return Promise.resolve(g(t));
	        });
	      })).then(function (e) {
	        var r = e.filter(function (e) {
	          return function (e) {
	            return e.status === p || Date.now() - e.lastUpdate > 12e4;
	          }(e);
	        }),
	            n = e.filter(function (e) {
	          return function (e) {
	            return e.status === y && Date.now() - e.lastUpdate <= 12e4;
	          }(e);
	        }),
	            o = [].concat(a(r), a(n));
	        return {
	          getTimeout: function (e, t) {
	            return (0 === n.length && 0 === e ? 1 : n.length + 3 + e) * t;
	          },
	          statelessHosts: o.length > 0 ? o.map(function (e) {
	            return b(e);
	          }) : t
	        };
	      });
	    }

	    function j(e, t, n, o) {
	      var u = [],
	          i = function (e, t) {
	        if (e.method === O || void 0 === e.data && void 0 === t.data) return;
	        var n = Array.isArray(e.data) ? e.data : r(r({}, e.data), t.data);
	        return JSON.stringify(n);
	      }(n, o),
	          s = function (e, t) {
	        var n = r(r({}, e.headers), t.headers),
	            o = {};
	        return Object.keys(n).forEach(function (e) {
	          var t = n[e];
	          o[e.toLowerCase()] = t;
	        }), o;
	      }(e, o),
	          c = n.method,
	          l = n.method !== O ? {} : r(r({}, n.data), o.data),
	          f = r(r(r({
	        "x-algolia-agent": e.userAgent.value
	      }, e.queryParameters), l), o.queryParameters),
	          h = 0,
	          d = function t(r, a) {
	        var l = r.pop();
	        if (void 0 === l) throw {
	          name: "RetryError",
	          message: "Unreachable hosts - your application id may be incorrect. If the error persists, contact support@algolia.com.",
	          transporterStackTrace: A(u)
	        };

	        var d = {
	          data: i,
	          headers: s,
	          method: c,
	          url: S(l, n.path, f),
	          connectTimeout: a(h, e.timeouts.connect),
	          responseTimeout: a(h, o.timeout)
	        },
	            m = function (e) {
	          var t = {
	            request: d,
	            response: e,
	            host: l,
	            triesLeft: r.length
	          };
	          return u.push(t), t;
	        },
	            p = {
	          onSucess: function (e) {
	            return function (e) {
	              try {
	                return JSON.parse(e.content);
	              } catch (t) {
	                throw function (e, t) {
	                  return {
	                    name: "DeserializationError",
	                    message: e,
	                    response: t
	                  };
	                }(t.message, e);
	              }
	            }(e);
	          },
	          onRetry: function (n) {
	            var o = m(n);
	            return n.isTimedOut && h++, Promise.all([e.logger.info("Retryable failure", x(o)), e.hostsCache.set(l, g(l, n.isTimedOut ? y : v))]).then(function () {
	              return t(r, a);
	            });
	          },
	          onFail: function (e) {
	            throw m(e), function (e, t) {
	              var r = e.content,
	                  n = e.status,
	                  o = r;

	              try {
	                o = JSON.parse(r).message;
	              } catch (e) {}

	              return function (e, t, r) {
	                return {
	                  name: "ApiError",
	                  message: e,
	                  status: t,
	                  transporterStackTrace: r
	                };
	              }(o, n, t);
	            }(e, A(u));
	          }
	        };

	        return e.requester.send(d).then(function (e) {
	          return function (e, t) {
	            return function (e) {
	              var t = e.status;
	              return e.isTimedOut || function (e) {
	                var t = e.isTimedOut,
	                    r = e.status;
	                return !t && 0 == ~~r;
	              }(e) || 2 != ~~(t / 100) && 4 != ~~(t / 100);
	            }(e) ? t.onRetry(e) : 2 == ~~(e.status / 100) ? t.onSucess(e) : t.onFail(e);
	          }(e, p);
	        });
	      };

	      return q(e.hostsCache, t).then(function (e) {
	        return d(a(e.statelessHosts).reverse(), e.getTimeout);
	      });
	    }

	    function w(e) {
	      var t = {
	        value: "Algolia for JavaScript (".concat(e, ")"),
	        add: function (e) {
	          var r = "; ".concat(e.segment).concat(void 0 !== e.version ? " (".concat(e.version, ")") : "");
	          return -1 === t.value.indexOf(r) && (t.value = "".concat(t.value).concat(r)), t;
	        }
	      };
	      return t;
	    }

	    function S(e, t, r) {
	      var n = T(r),
	          o = "".concat(e.protocol, "://").concat(e.url, "/").concat("/" === t.charAt(0) ? t.substr(1) : t);
	      return n.length && (o += "?".concat(n)), o;
	    }

	    function T(e) {
	      return Object.keys(e).map(function (t) {
	        return f("%s=%s", t, (r = e[t], "[object Object]" === Object.prototype.toString.call(r) || "[object Array]" === Object.prototype.toString.call(r) ? JSON.stringify(e[t]) : e[t]));
	        var r;
	      }).join("&");
	    }

	    function A(e) {
	      return e.map(function (e) {
	        return x(e);
	      });
	    }

	    function x(e) {
	      var t = e.request.headers["x-algolia-api-key"] ? {
	        "x-algolia-api-key": "*****"
	      } : {};
	      return r(r({}, e), {}, {
	        request: r(r({}, e.request), {}, {
	          headers: r(r({}, e.request.headers), t)
	        })
	      });
	    }

	    var N = function (e) {
	      var t = e.appId,
	          n = function (e, t, r) {
	        var n = {
	          "x-algolia-api-key": r,
	          "x-algolia-application-id": t
	        };
	        return {
	          headers: function () {
	            return e === h.WithinHeaders ? n : {};
	          },
	          queryParameters: function () {
	            return e === h.WithinQueryParameters ? n : {};
	          }
	        };
	      }(void 0 !== e.authMode ? e.authMode : h.WithinHeaders, t, e.apiKey),
	          a = function (e) {
	        var t = e.hostsCache,
	            r = e.logger,
	            n = e.requester,
	            a = e.requestsCache,
	            u = e.responsesCache,
	            i = e.timeouts,
	            s = e.userAgent,
	            c = e.hosts,
	            l = e.queryParameters,
	            f = {
	          hostsCache: t,
	          logger: r,
	          requester: n,
	          requestsCache: a,
	          responsesCache: u,
	          timeouts: i,
	          userAgent: s,
	          headers: e.headers,
	          queryParameters: l,
	          hosts: c.map(function (e) {
	            return b(e);
	          }),
	          read: function (e, t) {
	            var r = d(t, f.timeouts.read),
	                n = function () {
	              return j(f, f.hosts.filter(function (e) {
	                return 0 != (e.accept & m.Read);
	              }), e, r);
	            };

	            if (!0 !== (void 0 !== r.cacheable ? r.cacheable : e.cacheable)) return n();
	            var a = {
	              request: e,
	              mappedRequestOptions: r,
	              transporter: {
	                queryParameters: f.queryParameters,
	                headers: f.headers
	              }
	            };
	            return f.responsesCache.get(a, function () {
	              return f.requestsCache.get(a, function () {
	                return f.requestsCache.set(a, n()).then(function (e) {
	                  return Promise.all([f.requestsCache.delete(a), e]);
	                }, function (e) {
	                  return Promise.all([f.requestsCache.delete(a), Promise.reject(e)]);
	                }).then(function (e) {
	                  var t = o(e, 2);
	                  return t[1];
	                });
	              });
	            }, {
	              miss: function (e) {
	                return f.responsesCache.set(a, e);
	              }
	            });
	          },
	          write: function (e, t) {
	            return j(f, f.hosts.filter(function (e) {
	              return 0 != (e.accept & m.Write);
	            }), e, d(t, f.timeouts.write));
	          }
	        };
	        return f;
	      }(r(r({
	        hosts: [{
	          url: "".concat(t, "-dsn.algolia.net"),
	          accept: m.Read
	        }, {
	          url: "".concat(t, ".algolia.net"),
	          accept: m.Write
	        }].concat(c([{
	          url: "".concat(t, "-1.algolianet.com")
	        }, {
	          url: "".concat(t, "-2.algolianet.com")
	        }, {
	          url: "".concat(t, "-3.algolianet.com")
	        }]))
	      }, e), {}, {
	        headers: r(r(r({}, n.headers()), {
	          "content-type": "application/x-www-form-urlencoded"
	        }), e.headers),
	        queryParameters: r(r({}, n.queryParameters()), e.queryParameters)
	      }));

	      return l({
	        transporter: a,
	        appId: t,
	        addAlgoliaAgent: function (e, t) {
	          a.userAgent.add({
	            segment: e,
	            version: t
	          });
	        },
	        clearCache: function () {
	          return Promise.all([a.requestsCache.clear(), a.responsesCache.clear()]).then(function () {});
	        }
	      }, e.methods);
	    },
	        C = function (e) {
	      return function (t) {
	        var r = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
	            n = {
	          transporter: e.transporter,
	          appId: e.appId,
	          indexName: t
	        };
	        return l(n, r.methods);
	      };
	    },
	        k = function (e) {
	      return function (t, n) {
	        var o = t.map(function (e) {
	          return r(r({}, e), {}, {
	            params: T(e.params || {})
	          });
	        });
	        return e.transporter.read({
	          method: P,
	          path: "1/indexes/*/queries",
	          data: {
	            requests: o
	          },
	          cacheable: !0
	        }, n);
	      };
	    },
	        J = function (e) {
	      return function (t, o) {
	        return Promise.all(t.map(function (t) {
	          var a = t.params,
	              u = a.facetName,
	              i = a.facetQuery,
	              s = n(a, ["facetName", "facetQuery"]);
	          return C(e)(t.indexName, {
	            methods: {
	              searchForFacetValues: F
	            }
	          }).searchForFacetValues(u, i, r(r({}, o), s));
	        }));
	      };
	    },
	        E = function (e) {
	      return function (t, r, n) {
	        return e.transporter.read({
	          method: P,
	          path: f("1/answers/%s/prediction", e.indexName),
	          data: {
	            query: t,
	            queryLanguages: r
	          },
	          cacheable: !0
	        }, n);
	      };
	    },
	        I = function (e) {
	      return function (t, r) {
	        return e.transporter.read({
	          method: P,
	          path: f("1/indexes/%s/query", e.indexName),
	          data: {
	            query: t
	          },
	          cacheable: !0
	        }, r);
	      };
	    },
	        F = function (e) {
	      return function (t, r, n) {
	        return e.transporter.read({
	          method: P,
	          path: f("1/indexes/%s/facets/%s/query", e.indexName, t),
	          data: {
	            facetQuery: r
	          },
	          cacheable: !0
	        }, n);
	      };
	    },
	        R = 1,
	        D = 2,
	        W = 3;

	    function H(e, t, n) {
	      var o,
	          a = {
	        appId: e,
	        apiKey: t,
	        timeouts: {
	          connect: 1,
	          read: 2,
	          write: 30
	        },
	        requester: {
	          send: function (e) {
	            return new Promise(function (t) {
	              var r = new XMLHttpRequest();
	              r.open(e.method, e.url, !0), Object.keys(e.headers).forEach(function (t) {
	                return r.setRequestHeader(t, e.headers[t]);
	              });

	              var n,
	                  o = function (e, n) {
	                return setTimeout(function () {
	                  r.abort(), t({
	                    status: 0,
	                    content: n,
	                    isTimedOut: !0
	                  });
	                }, 1e3 * e);
	              },
	                  a = o(e.connectTimeout, "Connection timeout");

	              r.onreadystatechange = function () {
	                r.readyState > r.OPENED && void 0 === n && (clearTimeout(a), n = o(e.responseTimeout, "Socket timeout"));
	              }, r.onerror = function () {
	                0 === r.status && (clearTimeout(a), clearTimeout(n), t({
	                  content: r.responseText || "Network request failed",
	                  status: r.status,
	                  isTimedOut: !1
	                }));
	              }, r.onload = function () {
	                clearTimeout(a), clearTimeout(n), t({
	                  content: r.responseText,
	                  status: r.status,
	                  isTimedOut: !1
	                });
	              }, r.send(e.data);
	            });
	          }
	        },
	        logger: (o = W, {
	          debug: function (e, t) {
	            return R >= o && console.debug(e, t), Promise.resolve();
	          },
	          info: function (e, t) {
	            return D >= o && console.info(e, t), Promise.resolve();
	          },
	          error: function (e, t) {
	            return console.error(e, t), Promise.resolve();
	          }
	        }),
	        responsesCache: s(),
	        requestsCache: s({
	          serializable: !1
	        }),
	        hostsCache: i({
	          caches: [u({
	            key: "".concat("4.8.3", "-").concat(e)
	          }), s()]
	        }),
	        userAgent: w("4.8.3").add({
	          segment: "Browser",
	          version: "lite"
	        }),
	        authMode: h.WithinQueryParameters
	      };
	      return N(r(r(r({}, a), n), {}, {
	        methods: {
	          search: k,
	          searchForFacetValues: J,
	          multipleQueries: k,
	          multipleSearchForFacetValues: J,
	          initIndex: function (e) {
	            return function (t) {
	              return C(e)(t, {
	                methods: {
	                  search: I,
	                  searchForFacetValues: F,
	                  findAnswers: E
	                }
	              });
	            };
	          }
	        }
	      }));
	    }

	    return H.version = "4.8.3", H;
	  });
	});

	function clone(value) {
	  if (typeof value === 'object' && value !== null) {
	    return _merge(Array.isArray(value) ? [] : {}, value);
	  }

	  return value;
	}

	function isObjectOrArrayOrFunction(value) {
	  return typeof value === 'function' || Array.isArray(value) || Object.prototype.toString.call(value) === '[object Object]';
	}

	function _merge(target, source) {
	  if (target === source) {
	    return target;
	  }

	  for (var key in source) {
	    if (!Object.prototype.hasOwnProperty.call(source, key)) {
	      continue;
	    }

	    var sourceVal = source[key];
	    var targetVal = target[key];

	    if (typeof targetVal !== 'undefined' && typeof sourceVal === 'undefined') {
	      continue;
	    }

	    if (isObjectOrArrayOrFunction(targetVal) && isObjectOrArrayOrFunction(sourceVal)) {
	      target[key] = _merge(targetVal, sourceVal);
	    } else {
	      target[key] = clone(sourceVal);
	    }
	  }

	  return target;
	}
	/**
	 * This method is like Object.assign, but recursively merges own and inherited
	 * enumerable keyed properties of source objects into the destination object.
	 *
	 * NOTE: this behaves like lodash/merge, but:
	 * - does mutate functions if they are a source
	 * - treats non-plain objects as plain
	 * - does not work for circular objects
	 * - treats sparse arrays as sparse
	 * - does not convert Array-like objects (Arguments, NodeLists, etc.) to arrays
	 *
	 * @param {Object} object The destination object.
	 * @param {...Object} [sources] The source objects.
	 * @returns {Object} Returns `object`.
	 */


	function merge(target) {
	  if (!isObjectOrArrayOrFunction(target)) {
	    target = {};
	  }

	  for (var i = 1, l = arguments.length; i < l; i++) {
	    var source = arguments[i];

	    if (isObjectOrArrayOrFunction(source)) {
	      _merge(target, source);
	    }
	  }

	  return target;
	}

	var merge_1 = merge;

	// it also preserve keys order

	var defaultsPure = function defaultsPure() {
	  var sources = Array.prototype.slice.call(arguments);
	  return sources.reduceRight(function (acc, source) {
	    Object.keys(Object(source)).forEach(function (key) {
	      if (source[key] === undefined) {
	        return;
	      }

	      if (acc[key] !== undefined) {
	        // remove if already added, so that we can add it in correct order
	        delete acc[key];
	      }

	      acc[key] = source[key];
	    });
	    return acc;
	  }, {});
	};

	function intersection(arr1, arr2) {
	  return arr1.filter(function (value, index) {
	    return arr2.indexOf(value) > -1 && arr1.indexOf(value) === index
	    /* skips duplicates */
	    ;
	  });
	}

	var intersection_1 = intersection;

	var find = function find(array, comparator) {
	  if (!Array.isArray(array)) {
	    return undefined;
	  }

	  for (var i = 0; i < array.length; i++) {
	    if (comparator(array[i])) {
	      return array[i];
	    }
	  }
	};

	function valToNumber(v) {
	  if (typeof v === 'number') {
	    return v;
	  } else if (typeof v === 'string') {
	    return parseFloat(v);
	  } else if (Array.isArray(v)) {
	    return v.map(valToNumber);
	  }

	  throw new Error('The value should be a number, a parsable string or an array of those.');
	}

	var valToNumber_1 = valToNumber;

	function _objectWithoutPropertiesLoose(source, excluded) {
	  if (source === null) return {};
	  var target = {};
	  var sourceKeys = Object.keys(source);
	  var key;
	  var i;

	  for (i = 0; i < sourceKeys.length; i++) {
	    key = sourceKeys[i];
	    if (excluded.indexOf(key) >= 0) continue;
	    target[key] = source[key];
	  }

	  return target;
	}

	var omit = _objectWithoutPropertiesLoose;

	function objectHasKeys(obj) {
	  return obj && Object.keys(obj).length > 0;
	}

	var objectHasKeys_1 = objectHasKeys;

	var isValidUserToken = function isValidUserToken(userToken) {
	  if (userToken === null) {
	    return false;
	  }

	  return /^[a-zA-Z0-9_-]{1,64}$/.test(userToken);
	};

	/**
	 * Functions to manipulate refinement lists
	 *
	 * The RefinementList is not formally defined through a prototype but is based
	 * on a specific structure.
	 *
	 * @module SearchParameters.refinementList
	 *
	 * @typedef {string[]} SearchParameters.refinementList.Refinements
	 * @typedef {Object.<string, SearchParameters.refinementList.Refinements>} SearchParameters.refinementList.RefinementList
	 */


	var lib = {
	  /**
	   * Adds a refinement to a RefinementList
	   * @param {RefinementList} refinementList the initial list
	   * @param {string} attribute the attribute to refine
	   * @param {string} value the value of the refinement, if the value is not a string it will be converted
	   * @return {RefinementList} a new and updated refinement list
	   */
	  addRefinement: function addRefinement(refinementList, attribute, value) {
	    if (lib.isRefined(refinementList, attribute, value)) {
	      return refinementList;
	    }

	    var valueAsString = '' + value;
	    var facetRefinement = !refinementList[attribute] ? [valueAsString] : refinementList[attribute].concat(valueAsString);
	    var mod = {};
	    mod[attribute] = facetRefinement;
	    return defaultsPure({}, mod, refinementList);
	  },

	  /**
	   * Removes refinement(s) for an attribute:
	   *  - if the value is specified removes the refinement for the value on the attribute
	   *  - if no value is specified removes all the refinements for this attribute
	   * @param {RefinementList} refinementList the initial list
	   * @param {string} attribute the attribute to refine
	   * @param {string} [value] the value of the refinement
	   * @return {RefinementList} a new and updated refinement lst
	   */
	  removeRefinement: function removeRefinement(refinementList, attribute, value) {
	    if (value === undefined) {
	      // we use the "filter" form of clearRefinement, since it leaves empty values as-is
	      // the form with a string will remove the attribute completely
	      return lib.clearRefinement(refinementList, function (v, f) {
	        return attribute === f;
	      });
	    }

	    var valueAsString = '' + value;
	    return lib.clearRefinement(refinementList, function (v, f) {
	      return attribute === f && valueAsString === v;
	    });
	  },

	  /**
	   * Toggles the refinement value for an attribute.
	   * @param {RefinementList} refinementList the initial list
	   * @param {string} attribute the attribute to refine
	   * @param {string} value the value of the refinement
	   * @return {RefinementList} a new and updated list
	   */
	  toggleRefinement: function toggleRefinement(refinementList, attribute, value) {
	    if (value === undefined) throw new Error('toggleRefinement should be used with a value');

	    if (lib.isRefined(refinementList, attribute, value)) {
	      return lib.removeRefinement(refinementList, attribute, value);
	    }

	    return lib.addRefinement(refinementList, attribute, value);
	  },

	  /**
	   * Clear all or parts of a RefinementList. Depending on the arguments, three
	   * kinds of behavior can happen:
	   *  - if no attribute is provided: clears the whole list
	   *  - if an attribute is provided as a string: clears the list for the specific attribute
	   *  - if an attribute is provided as a function: discards the elements for which the function returns true
	   * @param {RefinementList} refinementList the initial list
	   * @param {string} [attribute] the attribute or function to discard
	   * @param {string} [refinementType] optional parameter to give more context to the attribute function
	   * @return {RefinementList} a new and updated refinement list
	   */
	  clearRefinement: function clearRefinement(refinementList, attribute, refinementType) {
	    if (attribute === undefined) {
	      if (!objectHasKeys_1(refinementList)) {
	        return refinementList;
	      }

	      return {};
	    } else if (typeof attribute === 'string') {
	      return omit(refinementList, [attribute]);
	    } else if (typeof attribute === 'function') {
	      var hasChanged = false;
	      var newRefinementList = Object.keys(refinementList).reduce(function (memo, key) {
	        var values = refinementList[key] || [];
	        var facetList = values.filter(function (value) {
	          return !attribute(value, key, refinementType);
	        });

	        if (facetList.length !== values.length) {
	          hasChanged = true;
	        }

	        memo[key] = facetList;
	        return memo;
	      }, {});
	      if (hasChanged) return newRefinementList;
	      return refinementList;
	    }
	  },

	  /**
	   * Test if the refinement value is used for the attribute. If no refinement value
	   * is provided, test if the refinementList contains any refinement for the
	   * given attribute.
	   * @param {RefinementList} refinementList the list of refinement
	   * @param {string} attribute name of the attribute
	   * @param {string} [refinementValue] value of the filter/refinement
	   * @return {boolean}
	   */
	  isRefined: function isRefined(refinementList, attribute, refinementValue) {
	    var containsRefinements = !!refinementList[attribute] && refinementList[attribute].length > 0;

	    if (refinementValue === undefined || !containsRefinements) {
	      return containsRefinements;
	    }

	    var refinementValueAsString = '' + refinementValue;
	    return refinementList[attribute].indexOf(refinementValueAsString) !== -1;
	  }
	};
	var RefinementList = lib;

	/**
	 * isEqual, but only for numeric refinement values, possible values:
	 * - 5
	 * - [5]
	 * - [[5]]
	 * - [[5,5],[4]]
	 */


	function isEqualNumericRefinement(a, b) {
	  if (Array.isArray(a) && Array.isArray(b)) {
	    return a.length === b.length && a.every(function (el, i) {
	      return isEqualNumericRefinement(b[i], el);
	    });
	  }

	  return a === b;
	}
	/**
	 * like _.find but using deep equality to be able to use it
	 * to find arrays.
	 * @private
	 * @param {any[]} array array to search into (elements are base or array of base)
	 * @param {any} searchedValue the value we're looking for (base or array of base)
	 * @return {any} the searched value or undefined
	 */


	function findArray(array, searchedValue) {
	  return find(array, function (currentValue) {
	    return isEqualNumericRefinement(currentValue, searchedValue);
	  });
	}
	/**
	 * The facet list is the structure used to store the list of values used to
	 * filter a single attribute.
	 * @typedef {string[]} SearchParameters.FacetList
	 */

	/**
	 * Structure to store numeric filters with the operator as the key. The supported operators
	 * are `=`, `>`, `<`, `>=`, `<=` and `!=`.
	 * @typedef {Object.<string, Array.<number|number[]>>} SearchParameters.OperatorList
	 */

	/**
	 * SearchParameters is the data structure that contains all the information
	 * usable for making a search to Algolia API. It doesn't do the search itself,
	 * nor does it contains logic about the parameters.
	 * It is an immutable object, therefore it has been created in a way that each
	 * changes does not change the object itself but returns a copy with the
	 * modification.
	 * This object should probably not be instantiated outside of the helper. It will
	 * be provided when needed. This object is documented for reference as you'll
	 * get it from events generated by the {@link AlgoliaSearchHelper}.
	 * If need be, instantiate the Helper from the factory function {@link SearchParameters.make}
	 * @constructor
	 * @classdesc contains all the parameters of a search
	 * @param {object|SearchParameters} newParameters existing parameters or partial object
	 * for the properties of a new SearchParameters
	 * @see SearchParameters.make
	 * @example <caption>SearchParameters of the first query in
	 *   <a href="http://demos.algolia.com/instant-search-demo/">the instant search demo</a></caption>
	{
	   "query": "",
	   "disjunctiveFacets": [
	      "customerReviewCount",
	      "category",
	      "salePrice_range",
	      "manufacturer"
	  ],
	   "maxValuesPerFacet": 30,
	   "page": 0,
	   "hitsPerPage": 10,
	   "facets": [
	      "type",
	      "shipping"
	  ]
	}
	 */


	function SearchParameters(newParameters) {
	  var params = newParameters ? SearchParameters._parseNumbers(newParameters) : {};

	  if (params.userToken !== undefined && !isValidUserToken(params.userToken)) {
	    console.warn('[algoliasearch-helper] The `userToken` parameter is invalid. This can lead to wrong analytics.\n  - Format: [a-zA-Z0-9_-]{1,64}');
	  }
	  /**
	   * This attribute contains the list of all the conjunctive facets
	   * used. This list will be added to requested facets in the
	   * [facets attribute](https://www.algolia.com/doc/rest-api/search#param-facets) sent to algolia.
	   * @member {string[]}
	   */


	  this.facets = params.facets || [];
	  /**
	   * This attribute contains the list of all the disjunctive facets
	   * used. This list will be added to requested facets in the
	   * [facets attribute](https://www.algolia.com/doc/rest-api/search#param-facets) sent to algolia.
	   * @member {string[]}
	   */

	  this.disjunctiveFacets = params.disjunctiveFacets || [];
	  /**
	   * This attribute contains the list of all the hierarchical facets
	   * used. This list will be added to requested facets in the
	   * [facets attribute](https://www.algolia.com/doc/rest-api/search#param-facets) sent to algolia.
	   * Hierarchical facets are a sub type of disjunctive facets that
	   * let you filter faceted attributes hierarchically.
	   * @member {string[]|object[]}
	   */

	  this.hierarchicalFacets = params.hierarchicalFacets || []; // Refinements

	  /**
	   * This attribute contains all the filters that need to be
	   * applied on the conjunctive facets. Each facet must be properly
	   * defined in the `facets` attribute.
	   *
	   * The key is the name of the facet, and the `FacetList` contains all
	   * filters selected for the associated facet name.
	   *
	   * When querying algolia, the values stored in this attribute will
	   * be translated into the `facetFilters` attribute.
	   * @member {Object.<string, SearchParameters.FacetList>}
	   */

	  this.facetsRefinements = params.facetsRefinements || {};
	  /**
	   * This attribute contains all the filters that need to be
	   * excluded from the conjunctive facets. Each facet must be properly
	   * defined in the `facets` attribute.
	   *
	   * The key is the name of the facet, and the `FacetList` contains all
	   * filters excluded for the associated facet name.
	   *
	   * When querying algolia, the values stored in this attribute will
	   * be translated into the `facetFilters` attribute.
	   * @member {Object.<string, SearchParameters.FacetList>}
	   */

	  this.facetsExcludes = params.facetsExcludes || {};
	  /**
	   * This attribute contains all the filters that need to be
	   * applied on the disjunctive facets. Each facet must be properly
	   * defined in the `disjunctiveFacets` attribute.
	   *
	   * The key is the name of the facet, and the `FacetList` contains all
	   * filters selected for the associated facet name.
	   *
	   * When querying algolia, the values stored in this attribute will
	   * be translated into the `facetFilters` attribute.
	   * @member {Object.<string, SearchParameters.FacetList>}
	   */

	  this.disjunctiveFacetsRefinements = params.disjunctiveFacetsRefinements || {};
	  /**
	   * This attribute contains all the filters that need to be
	   * applied on the numeric attributes.
	   *
	   * The key is the name of the attribute, and the value is the
	   * filters to apply to this attribute.
	   *
	   * When querying algolia, the values stored in this attribute will
	   * be translated into the `numericFilters` attribute.
	   * @member {Object.<string, SearchParameters.OperatorList>}
	   */

	  this.numericRefinements = params.numericRefinements || {};
	  /**
	   * This attribute contains all the tags used to refine the query.
	   *
	   * When querying algolia, the values stored in this attribute will
	   * be translated into the `tagFilters` attribute.
	   * @member {string[]}
	   */

	  this.tagRefinements = params.tagRefinements || [];
	  /**
	   * This attribute contains all the filters that need to be
	   * applied on the hierarchical facets. Each facet must be properly
	   * defined in the `hierarchicalFacets` attribute.
	   *
	   * The key is the name of the facet, and the `FacetList` contains all
	   * filters selected for the associated facet name. The FacetList values
	   * are structured as a string that contain the values for each level
	   * separated by the configured separator.
	   *
	   * When querying algolia, the values stored in this attribute will
	   * be translated into the `facetFilters` attribute.
	   * @member {Object.<string, SearchParameters.FacetList>}
	   */

	  this.hierarchicalFacetsRefinements = params.hierarchicalFacetsRefinements || {};
	  var self = this;
	  Object.keys(params).forEach(function (paramName) {
	    var isKeyKnown = SearchParameters.PARAMETERS.indexOf(paramName) !== -1;
	    var isValueDefined = params[paramName] !== undefined;

	    if (!isKeyKnown && isValueDefined) {
	      self[paramName] = params[paramName];
	    }
	  });
	}
	/**
	 * List all the properties in SearchParameters and therefore all the known Algolia properties
	 * This doesn't contain any beta/hidden features.
	 * @private
	 */


	SearchParameters.PARAMETERS = Object.keys(new SearchParameters());
	/**
	 * @private
	 * @param {object} partialState full or part of a state
	 * @return {object} a new object with the number keys as number
	 */

	SearchParameters._parseNumbers = function (partialState) {
	  // Do not reparse numbers in SearchParameters, they ought to be parsed already
	  if (partialState instanceof SearchParameters) return partialState;
	  var numbers = {};
	  var numberKeys = ['aroundPrecision', 'aroundRadius', 'getRankingInfo', 'minWordSizefor2Typos', 'minWordSizefor1Typo', 'page', 'maxValuesPerFacet', 'distinct', 'minimumAroundRadius', 'hitsPerPage', 'minProximity'];
	  numberKeys.forEach(function (k) {
	    var value = partialState[k];

	    if (typeof value === 'string') {
	      var parsedValue = parseFloat(value); // global isNaN is ok to use here, value is only number or NaN

	      numbers[k] = isNaN(parsedValue) ? value : parsedValue;
	    }
	  }); // there's two formats of insideBoundingBox, we need to parse
	  // the one which is an array of float geo rectangles

	  if (Array.isArray(partialState.insideBoundingBox)) {
	    numbers.insideBoundingBox = partialState.insideBoundingBox.map(function (geoRect) {
	      if (Array.isArray(geoRect)) {
	        return geoRect.map(function (value) {
	          return parseFloat(value);
	        });
	      }

	      return geoRect;
	    });
	  }

	  if (partialState.numericRefinements) {
	    var numericRefinements = {};
	    Object.keys(partialState.numericRefinements).forEach(function (attribute) {
	      var operators = partialState.numericRefinements[attribute] || {};
	      numericRefinements[attribute] = {};
	      Object.keys(operators).forEach(function (operator) {
	        var values = operators[operator];
	        var parsedValues = values.map(function (v) {
	          if (Array.isArray(v)) {
	            return v.map(function (vPrime) {
	              if (typeof vPrime === 'string') {
	                return parseFloat(vPrime);
	              }

	              return vPrime;
	            });
	          } else if (typeof v === 'string') {
	            return parseFloat(v);
	          }

	          return v;
	        });
	        numericRefinements[attribute][operator] = parsedValues;
	      });
	    });
	    numbers.numericRefinements = numericRefinements;
	  }

	  return merge_1({}, partialState, numbers);
	};
	/**
	 * Factory for SearchParameters
	 * @param {object|SearchParameters} newParameters existing parameters or partial
	 * object for the properties of a new SearchParameters
	 * @return {SearchParameters} frozen instance of SearchParameters
	 */


	SearchParameters.make = function makeSearchParameters(newParameters) {
	  var instance = new SearchParameters(newParameters);
	  var hierarchicalFacets = newParameters.hierarchicalFacets || [];
	  hierarchicalFacets.forEach(function (facet) {
	    if (facet.rootPath) {
	      var currentRefinement = instance.getHierarchicalRefinement(facet.name);

	      if (currentRefinement.length > 0 && currentRefinement[0].indexOf(facet.rootPath) !== 0) {
	        instance = instance.clearRefinements(facet.name);
	      } // get it again in case it has been cleared


	      currentRefinement = instance.getHierarchicalRefinement(facet.name);

	      if (currentRefinement.length === 0) {
	        instance = instance.toggleHierarchicalFacetRefinement(facet.name, facet.rootPath);
	      }
	    }
	  });
	  return instance;
	};
	/**
	 * Validates the new parameters based on the previous state
	 * @param {SearchParameters} currentState the current state
	 * @param {object|SearchParameters} parameters the new parameters to set
	 * @return {Error|null} Error if the modification is invalid, null otherwise
	 */


	SearchParameters.validate = function (currentState, parameters) {
	  var params = parameters || {};

	  if (currentState.tagFilters && params.tagRefinements && params.tagRefinements.length > 0) {
	    return new Error('[Tags] Cannot switch from the managed tag API to the advanced API. It is probably ' + 'an error, if it is really what you want, you should first clear the tags with clearTags method.');
	  }

	  if (currentState.tagRefinements.length > 0 && params.tagFilters) {
	    return new Error('[Tags] Cannot switch from the advanced tag API to the managed API. It is probably ' + 'an error, if it is not, you should first clear the tags with clearTags method.');
	  }

	  if (currentState.numericFilters && params.numericRefinements && objectHasKeys_1(params.numericRefinements)) {
	    return new Error("[Numeric filters] Can't switch from the advanced to the managed API. It" + ' is probably an error, if this is really what you want, you have to first' + ' clear the numeric filters.');
	  }

	  if (objectHasKeys_1(currentState.numericRefinements) && params.numericFilters) {
	    return new Error("[Numeric filters] Can't switch from the managed API to the advanced. It" + ' is probably an error, if this is really what you want, you have to first' + ' clear the numeric filters.');
	  }

	  return null;
	};

	SearchParameters.prototype = {
	  constructor: SearchParameters,

	  /**
	   * Remove all refinements (disjunctive + conjunctive + excludes + numeric filters)
	   * @method
	   * @param {undefined|string|SearchParameters.clearCallback} [attribute] optional string or function
	   * - If not given, means to clear all the filters.
	   * - If `string`, means to clear all refinements for the `attribute` named filter.
	   * - If `function`, means to clear all the refinements that return truthy values.
	   * @return {SearchParameters}
	   */
	  clearRefinements: function clearRefinements(attribute) {
	    var patch = {
	      numericRefinements: this._clearNumericRefinements(attribute),
	      facetsRefinements: RefinementList.clearRefinement(this.facetsRefinements, attribute, 'conjunctiveFacet'),
	      facetsExcludes: RefinementList.clearRefinement(this.facetsExcludes, attribute, 'exclude'),
	      disjunctiveFacetsRefinements: RefinementList.clearRefinement(this.disjunctiveFacetsRefinements, attribute, 'disjunctiveFacet'),
	      hierarchicalFacetsRefinements: RefinementList.clearRefinement(this.hierarchicalFacetsRefinements, attribute, 'hierarchicalFacet')
	    };

	    if (patch.numericRefinements === this.numericRefinements && patch.facetsRefinements === this.facetsRefinements && patch.facetsExcludes === this.facetsExcludes && patch.disjunctiveFacetsRefinements === this.disjunctiveFacetsRefinements && patch.hierarchicalFacetsRefinements === this.hierarchicalFacetsRefinements) {
	      return this;
	    }

	    return this.setQueryParameters(patch);
	  },

	  /**
	   * Remove all the refined tags from the SearchParameters
	   * @method
	   * @return {SearchParameters}
	   */
	  clearTags: function clearTags() {
	    if (this.tagFilters === undefined && this.tagRefinements.length === 0) return this;
	    return this.setQueryParameters({
	      tagFilters: undefined,
	      tagRefinements: []
	    });
	  },

	  /**
	   * Set the index.
	   * @method
	   * @param {string} index the index name
	   * @return {SearchParameters}
	   */
	  setIndex: function setIndex(index) {
	    if (index === this.index) return this;
	    return this.setQueryParameters({
	      index: index
	    });
	  },

	  /**
	   * Query setter
	   * @method
	   * @param {string} newQuery value for the new query
	   * @return {SearchParameters}
	   */
	  setQuery: function setQuery(newQuery) {
	    if (newQuery === this.query) return this;
	    return this.setQueryParameters({
	      query: newQuery
	    });
	  },

	  /**
	   * Page setter
	   * @method
	   * @param {number} newPage new page number
	   * @return {SearchParameters}
	   */
	  setPage: function setPage(newPage) {
	    if (newPage === this.page) return this;
	    return this.setQueryParameters({
	      page: newPage
	    });
	  },

	  /**
	   * Facets setter
	   * The facets are the simple facets, used for conjunctive (and) faceting.
	   * @method
	   * @param {string[]} facets all the attributes of the algolia records used for conjunctive faceting
	   * @return {SearchParameters}
	   */
	  setFacets: function setFacets(facets) {
	    return this.setQueryParameters({
	      facets: facets
	    });
	  },

	  /**
	   * Disjunctive facets setter
	   * Change the list of disjunctive (or) facets the helper chan handle.
	   * @method
	   * @param {string[]} facets all the attributes of the algolia records used for disjunctive faceting
	   * @return {SearchParameters}
	   */
	  setDisjunctiveFacets: function setDisjunctiveFacets(facets) {
	    return this.setQueryParameters({
	      disjunctiveFacets: facets
	    });
	  },

	  /**
	   * HitsPerPage setter
	   * Hits per page represents the number of hits retrieved for this query
	   * @method
	   * @param {number} n number of hits retrieved per page of results
	   * @return {SearchParameters}
	   */
	  setHitsPerPage: function setHitsPerPage(n) {
	    if (this.hitsPerPage === n) return this;
	    return this.setQueryParameters({
	      hitsPerPage: n
	    });
	  },

	  /**
	   * typoTolerance setter
	   * Set the value of typoTolerance
	   * @method
	   * @param {string} typoTolerance new value of typoTolerance ("true", "false", "min" or "strict")
	   * @return {SearchParameters}
	   */
	  setTypoTolerance: function setTypoTolerance(typoTolerance) {
	    if (this.typoTolerance === typoTolerance) return this;
	    return this.setQueryParameters({
	      typoTolerance: typoTolerance
	    });
	  },

	  /**
	   * Add a numeric filter for a given attribute
	   * When value is an array, they are combined with OR
	   * When value is a single value, it will combined with AND
	   * @method
	   * @param {string} attribute attribute to set the filter on
	   * @param {string} operator operator of the filter (possible values: =, >, >=, <, <=, !=)
	   * @param {number | number[]} value value of the filter
	   * @return {SearchParameters}
	   * @example
	   * // for price = 50 or 40
	   * searchparameter.addNumericRefinement('price', '=', [50, 40]);
	   * @example
	   * // for size = 38 and 40
	   * searchparameter.addNumericRefinement('size', '=', 38);
	   * searchparameter.addNumericRefinement('size', '=', 40);
	   */
	  addNumericRefinement: function (attribute, operator, v) {
	    var value = valToNumber_1(v);
	    if (this.isNumericRefined(attribute, operator, value)) return this;
	    var mod = merge_1({}, this.numericRefinements);
	    mod[attribute] = merge_1({}, mod[attribute]);

	    if (mod[attribute][operator]) {
	      // Array copy
	      mod[attribute][operator] = mod[attribute][operator].slice(); // Add the element. Concat can't be used here because value can be an array.

	      mod[attribute][operator].push(value);
	    } else {
	      mod[attribute][operator] = [value];
	    }

	    return this.setQueryParameters({
	      numericRefinements: mod
	    });
	  },

	  /**
	   * Get the list of conjunctive refinements for a single facet
	   * @param {string} facetName name of the attribute used for faceting
	   * @return {string[]} list of refinements
	   */
	  getConjunctiveRefinements: function (facetName) {
	    if (!this.isConjunctiveFacet(facetName)) {
	      return [];
	    }

	    return this.facetsRefinements[facetName] || [];
	  },

	  /**
	   * Get the list of disjunctive refinements for a single facet
	   * @param {string} facetName name of the attribute used for faceting
	   * @return {string[]} list of refinements
	   */
	  getDisjunctiveRefinements: function (facetName) {
	    if (!this.isDisjunctiveFacet(facetName)) {
	      return [];
	    }

	    return this.disjunctiveFacetsRefinements[facetName] || [];
	  },

	  /**
	   * Get the list of hierarchical refinements for a single facet
	   * @param {string} facetName name of the attribute used for faceting
	   * @return {string[]} list of refinements
	   */
	  getHierarchicalRefinement: function (facetName) {
	    // we send an array but we currently do not support multiple
	    // hierarchicalRefinements for a hierarchicalFacet
	    return this.hierarchicalFacetsRefinements[facetName] || [];
	  },

	  /**
	   * Get the list of exclude refinements for a single facet
	   * @param {string} facetName name of the attribute used for faceting
	   * @return {string[]} list of refinements
	   */
	  getExcludeRefinements: function (facetName) {
	    if (!this.isConjunctiveFacet(facetName)) {
	      return [];
	    }

	    return this.facetsExcludes[facetName] || [];
	  },

	  /**
	   * Remove all the numeric filter for a given (attribute, operator)
	   * @method
	   * @param {string} attribute attribute to set the filter on
	   * @param {string} [operator] operator of the filter (possible values: =, >, >=, <, <=, !=)
	   * @param {number} [number] the value to be removed
	   * @return {SearchParameters}
	   */
	  removeNumericRefinement: function (attribute, operator, paramValue) {
	    if (paramValue !== undefined) {
	      if (!this.isNumericRefined(attribute, operator, paramValue)) {
	        return this;
	      }

	      return this.setQueryParameters({
	        numericRefinements: this._clearNumericRefinements(function (value, key) {
	          return key === attribute && value.op === operator && isEqualNumericRefinement(value.val, valToNumber_1(paramValue));
	        })
	      });
	    } else if (operator !== undefined) {
	      if (!this.isNumericRefined(attribute, operator)) return this;
	      return this.setQueryParameters({
	        numericRefinements: this._clearNumericRefinements(function (value, key) {
	          return key === attribute && value.op === operator;
	        })
	      });
	    }

	    if (!this.isNumericRefined(attribute)) return this;
	    return this.setQueryParameters({
	      numericRefinements: this._clearNumericRefinements(function (value, key) {
	        return key === attribute;
	      })
	    });
	  },

	  /**
	   * Get the list of numeric refinements for a single facet
	   * @param {string} facetName name of the attribute used for faceting
	   * @return {SearchParameters.OperatorList} list of refinements
	   */
	  getNumericRefinements: function (facetName) {
	    return this.numericRefinements[facetName] || {};
	  },

	  /**
	   * Return the current refinement for the (attribute, operator)
	   * @param {string} attribute attribute in the record
	   * @param {string} operator operator applied on the refined values
	   * @return {Array.<number|number[]>} refined values
	   */
	  getNumericRefinement: function (attribute, operator) {
	    return this.numericRefinements[attribute] && this.numericRefinements[attribute][operator];
	  },

	  /**
	   * Clear numeric filters.
	   * @method
	   * @private
	   * @param {string|SearchParameters.clearCallback} [attribute] optional string or function
	   * - If not given, means to clear all the filters.
	   * - If `string`, means to clear all refinements for the `attribute` named filter.
	   * - If `function`, means to clear all the refinements that return truthy values.
	   * @return {Object.<string, OperatorList>}
	   */
	  _clearNumericRefinements: function _clearNumericRefinements(attribute) {
	    if (attribute === undefined) {
	      if (!objectHasKeys_1(this.numericRefinements)) {
	        return this.numericRefinements;
	      }

	      return {};
	    } else if (typeof attribute === 'string') {
	      return omit(this.numericRefinements, [attribute]);
	    } else if (typeof attribute === 'function') {
	      var hasChanged = false;
	      var numericRefinements = this.numericRefinements;
	      var newNumericRefinements = Object.keys(numericRefinements).reduce(function (memo, key) {
	        var operators = numericRefinements[key];
	        var operatorList = {};
	        operators = operators || {};
	        Object.keys(operators).forEach(function (operator) {
	          var values = operators[operator] || [];
	          var outValues = [];
	          values.forEach(function (value) {
	            var predicateResult = attribute({
	              val: value,
	              op: operator
	            }, key, 'numeric');
	            if (!predicateResult) outValues.push(value);
	          });

	          if (outValues.length !== values.length) {
	            hasChanged = true;
	          }

	          operatorList[operator] = outValues;
	        });
	        memo[key] = operatorList;
	        return memo;
	      }, {});
	      if (hasChanged) return newNumericRefinements;
	      return this.numericRefinements;
	    }
	  },

	  /**
	   * Add a facet to the facets attribute of the helper configuration, if it
	   * isn't already present.
	   * @method
	   * @param {string} facet facet name to add
	   * @return {SearchParameters}
	   */
	  addFacet: function addFacet(facet) {
	    if (this.isConjunctiveFacet(facet)) {
	      return this;
	    }

	    return this.setQueryParameters({
	      facets: this.facets.concat([facet])
	    });
	  },

	  /**
	   * Add a disjunctive facet to the disjunctiveFacets attribute of the helper
	   * configuration, if it isn't already present.
	   * @method
	   * @param {string} facet disjunctive facet name to add
	   * @return {SearchParameters}
	   */
	  addDisjunctiveFacet: function addDisjunctiveFacet(facet) {
	    if (this.isDisjunctiveFacet(facet)) {
	      return this;
	    }

	    return this.setQueryParameters({
	      disjunctiveFacets: this.disjunctiveFacets.concat([facet])
	    });
	  },

	  /**
	   * Add a hierarchical facet to the hierarchicalFacets attribute of the helper
	   * configuration.
	   * @method
	   * @param {object} hierarchicalFacet hierarchical facet to add
	   * @return {SearchParameters}
	   * @throws will throw an error if a hierarchical facet with the same name was already declared
	   */
	  addHierarchicalFacet: function addHierarchicalFacet(hierarchicalFacet) {
	    if (this.isHierarchicalFacet(hierarchicalFacet.name)) {
	      throw new Error('Cannot declare two hierarchical facets with the same name: `' + hierarchicalFacet.name + '`');
	    }

	    return this.setQueryParameters({
	      hierarchicalFacets: this.hierarchicalFacets.concat([hierarchicalFacet])
	    });
	  },

	  /**
	   * Add a refinement on a "normal" facet
	   * @method
	   * @param {string} facet attribute to apply the faceting on
	   * @param {string} value value of the attribute (will be converted to string)
	   * @return {SearchParameters}
	   */
	  addFacetRefinement: function addFacetRefinement(facet, value) {
	    if (!this.isConjunctiveFacet(facet)) {
	      throw new Error(facet + ' is not defined in the facets attribute of the helper configuration');
	    }

	    if (RefinementList.isRefined(this.facetsRefinements, facet, value)) return this;
	    return this.setQueryParameters({
	      facetsRefinements: RefinementList.addRefinement(this.facetsRefinements, facet, value)
	    });
	  },

	  /**
	   * Exclude a value from a "normal" facet
	   * @method
	   * @param {string} facet attribute to apply the exclusion on
	   * @param {string} value value of the attribute (will be converted to string)
	   * @return {SearchParameters}
	   */
	  addExcludeRefinement: function addExcludeRefinement(facet, value) {
	    if (!this.isConjunctiveFacet(facet)) {
	      throw new Error(facet + ' is not defined in the facets attribute of the helper configuration');
	    }

	    if (RefinementList.isRefined(this.facetsExcludes, facet, value)) return this;
	    return this.setQueryParameters({
	      facetsExcludes: RefinementList.addRefinement(this.facetsExcludes, facet, value)
	    });
	  },

	  /**
	   * Adds a refinement on a disjunctive facet.
	   * @method
	   * @param {string} facet attribute to apply the faceting on
	   * @param {string} value value of the attribute (will be converted to string)
	   * @return {SearchParameters}
	   */
	  addDisjunctiveFacetRefinement: function addDisjunctiveFacetRefinement(facet, value) {
	    if (!this.isDisjunctiveFacet(facet)) {
	      throw new Error(facet + ' is not defined in the disjunctiveFacets attribute of the helper configuration');
	    }

	    if (RefinementList.isRefined(this.disjunctiveFacetsRefinements, facet, value)) return this;
	    return this.setQueryParameters({
	      disjunctiveFacetsRefinements: RefinementList.addRefinement(this.disjunctiveFacetsRefinements, facet, value)
	    });
	  },

	  /**
	   * addTagRefinement adds a tag to the list used to filter the results
	   * @param {string} tag tag to be added
	   * @return {SearchParameters}
	   */
	  addTagRefinement: function addTagRefinement(tag) {
	    if (this.isTagRefined(tag)) return this;
	    var modification = {
	      tagRefinements: this.tagRefinements.concat(tag)
	    };
	    return this.setQueryParameters(modification);
	  },

	  /**
	   * Remove a facet from the facets attribute of the helper configuration, if it
	   * is present.
	   * @method
	   * @param {string} facet facet name to remove
	   * @return {SearchParameters}
	   */
	  removeFacet: function removeFacet(facet) {
	    if (!this.isConjunctiveFacet(facet)) {
	      return this;
	    }

	    return this.clearRefinements(facet).setQueryParameters({
	      facets: this.facets.filter(function (f) {
	        return f !== facet;
	      })
	    });
	  },

	  /**
	   * Remove a disjunctive facet from the disjunctiveFacets attribute of the
	   * helper configuration, if it is present.
	   * @method
	   * @param {string} facet disjunctive facet name to remove
	   * @return {SearchParameters}
	   */
	  removeDisjunctiveFacet: function removeDisjunctiveFacet(facet) {
	    if (!this.isDisjunctiveFacet(facet)) {
	      return this;
	    }

	    return this.clearRefinements(facet).setQueryParameters({
	      disjunctiveFacets: this.disjunctiveFacets.filter(function (f) {
	        return f !== facet;
	      })
	    });
	  },

	  /**
	   * Remove a hierarchical facet from the hierarchicalFacets attribute of the
	   * helper configuration, if it is present.
	   * @method
	   * @param {string} facet hierarchical facet name to remove
	   * @return {SearchParameters}
	   */
	  removeHierarchicalFacet: function removeHierarchicalFacet(facet) {
	    if (!this.isHierarchicalFacet(facet)) {
	      return this;
	    }

	    return this.clearRefinements(facet).setQueryParameters({
	      hierarchicalFacets: this.hierarchicalFacets.filter(function (f) {
	        return f.name !== facet;
	      })
	    });
	  },

	  /**
	   * Remove a refinement set on facet. If a value is provided, it will clear the
	   * refinement for the given value, otherwise it will clear all the refinement
	   * values for the faceted attribute.
	   * @method
	   * @param {string} facet name of the attribute used for faceting
	   * @param {string} [value] value used to filter
	   * @return {SearchParameters}
	   */
	  removeFacetRefinement: function removeFacetRefinement(facet, value) {
	    if (!this.isConjunctiveFacet(facet)) {
	      throw new Error(facet + ' is not defined in the facets attribute of the helper configuration');
	    }

	    if (!RefinementList.isRefined(this.facetsRefinements, facet, value)) return this;
	    return this.setQueryParameters({
	      facetsRefinements: RefinementList.removeRefinement(this.facetsRefinements, facet, value)
	    });
	  },

	  /**
	   * Remove a negative refinement on a facet
	   * @method
	   * @param {string} facet name of the attribute used for faceting
	   * @param {string} value value used to filter
	   * @return {SearchParameters}
	   */
	  removeExcludeRefinement: function removeExcludeRefinement(facet, value) {
	    if (!this.isConjunctiveFacet(facet)) {
	      throw new Error(facet + ' is not defined in the facets attribute of the helper configuration');
	    }

	    if (!RefinementList.isRefined(this.facetsExcludes, facet, value)) return this;
	    return this.setQueryParameters({
	      facetsExcludes: RefinementList.removeRefinement(this.facetsExcludes, facet, value)
	    });
	  },

	  /**
	   * Remove a refinement on a disjunctive facet
	   * @method
	   * @param {string} facet name of the attribute used for faceting
	   * @param {string} value value used to filter
	   * @return {SearchParameters}
	   */
	  removeDisjunctiveFacetRefinement: function removeDisjunctiveFacetRefinement(facet, value) {
	    if (!this.isDisjunctiveFacet(facet)) {
	      throw new Error(facet + ' is not defined in the disjunctiveFacets attribute of the helper configuration');
	    }

	    if (!RefinementList.isRefined(this.disjunctiveFacetsRefinements, facet, value)) return this;
	    return this.setQueryParameters({
	      disjunctiveFacetsRefinements: RefinementList.removeRefinement(this.disjunctiveFacetsRefinements, facet, value)
	    });
	  },

	  /**
	   * Remove a tag from the list of tag refinements
	   * @method
	   * @param {string} tag the tag to remove
	   * @return {SearchParameters}
	   */
	  removeTagRefinement: function removeTagRefinement(tag) {
	    if (!this.isTagRefined(tag)) return this;
	    var modification = {
	      tagRefinements: this.tagRefinements.filter(function (t) {
	        return t !== tag;
	      })
	    };
	    return this.setQueryParameters(modification);
	  },

	  /**
	   * Generic toggle refinement method to use with facet, disjunctive facets
	   * and hierarchical facets
	   * @param  {string} facet the facet to refine
	   * @param  {string} value the associated value
	   * @return {SearchParameters}
	   * @throws will throw an error if the facet is not declared in the settings of the helper
	   * @deprecated since version 2.19.0, see {@link SearchParameters#toggleFacetRefinement}
	   */
	  toggleRefinement: function toggleRefinement(facet, value) {
	    return this.toggleFacetRefinement(facet, value);
	  },

	  /**
	   * Generic toggle refinement method to use with facet, disjunctive facets
	   * and hierarchical facets
	   * @param  {string} facet the facet to refine
	   * @param  {string} value the associated value
	   * @return {SearchParameters}
	   * @throws will throw an error if the facet is not declared in the settings of the helper
	   */
	  toggleFacetRefinement: function toggleFacetRefinement(facet, value) {
	    if (this.isHierarchicalFacet(facet)) {
	      return this.toggleHierarchicalFacetRefinement(facet, value);
	    } else if (this.isConjunctiveFacet(facet)) {
	      return this.toggleConjunctiveFacetRefinement(facet, value);
	    } else if (this.isDisjunctiveFacet(facet)) {
	      return this.toggleDisjunctiveFacetRefinement(facet, value);
	    }

	    throw new Error('Cannot refine the undeclared facet ' + facet + '; it should be added to the helper options facets, disjunctiveFacets or hierarchicalFacets');
	  },

	  /**
	   * Switch the refinement applied over a facet/value
	   * @method
	   * @param {string} facet name of the attribute used for faceting
	   * @param {value} value value used for filtering
	   * @return {SearchParameters}
	   */
	  toggleConjunctiveFacetRefinement: function toggleConjunctiveFacetRefinement(facet, value) {
	    if (!this.isConjunctiveFacet(facet)) {
	      throw new Error(facet + ' is not defined in the facets attribute of the helper configuration');
	    }

	    return this.setQueryParameters({
	      facetsRefinements: RefinementList.toggleRefinement(this.facetsRefinements, facet, value)
	    });
	  },

	  /**
	   * Switch the refinement applied over a facet/value
	   * @method
	   * @param {string} facet name of the attribute used for faceting
	   * @param {value} value value used for filtering
	   * @return {SearchParameters}
	   */
	  toggleExcludeFacetRefinement: function toggleExcludeFacetRefinement(facet, value) {
	    if (!this.isConjunctiveFacet(facet)) {
	      throw new Error(facet + ' is not defined in the facets attribute of the helper configuration');
	    }

	    return this.setQueryParameters({
	      facetsExcludes: RefinementList.toggleRefinement(this.facetsExcludes, facet, value)
	    });
	  },

	  /**
	   * Switch the refinement applied over a facet/value
	   * @method
	   * @param {string} facet name of the attribute used for faceting
	   * @param {value} value value used for filtering
	   * @return {SearchParameters}
	   */
	  toggleDisjunctiveFacetRefinement: function toggleDisjunctiveFacetRefinement(facet, value) {
	    if (!this.isDisjunctiveFacet(facet)) {
	      throw new Error(facet + ' is not defined in the disjunctiveFacets attribute of the helper configuration');
	    }

	    return this.setQueryParameters({
	      disjunctiveFacetsRefinements: RefinementList.toggleRefinement(this.disjunctiveFacetsRefinements, facet, value)
	    });
	  },

	  /**
	   * Switch the refinement applied over a facet/value
	   * @method
	   * @param {string} facet name of the attribute used for faceting
	   * @param {value} value value used for filtering
	   * @return {SearchParameters}
	   */
	  toggleHierarchicalFacetRefinement: function toggleHierarchicalFacetRefinement(facet, value) {
	    if (!this.isHierarchicalFacet(facet)) {
	      throw new Error(facet + ' is not defined in the hierarchicalFacets attribute of the helper configuration');
	    }

	    var separator = this._getHierarchicalFacetSeparator(this.getHierarchicalFacetByName(facet));

	    var mod = {};
	    var upOneOrMultipleLevel = this.hierarchicalFacetsRefinements[facet] !== undefined && this.hierarchicalFacetsRefinements[facet].length > 0 && ( // remove current refinement:
	    // refinement was 'beer > IPA', call is toggleRefine('beer > IPA'), refinement should be `beer`
	    this.hierarchicalFacetsRefinements[facet][0] === value || // remove a parent refinement of the current refinement:
	    //  - refinement was 'beer > IPA > Flying dog'
	    //  - call is toggleRefine('beer > IPA')
	    //  - refinement should be `beer`
	    this.hierarchicalFacetsRefinements[facet][0].indexOf(value + separator) === 0);

	    if (upOneOrMultipleLevel) {
	      if (value.indexOf(separator) === -1) {
	        // go back to root level
	        mod[facet] = [];
	      } else {
	        mod[facet] = [value.slice(0, value.lastIndexOf(separator))];
	      }
	    } else {
	      mod[facet] = [value];
	    }

	    return this.setQueryParameters({
	      hierarchicalFacetsRefinements: defaultsPure({}, mod, this.hierarchicalFacetsRefinements)
	    });
	  },

	  /**
	   * Adds a refinement on a hierarchical facet.
	   * @param {string} facet the facet name
	   * @param {string} path the hierarchical facet path
	   * @return {SearchParameter} the new state
	   * @throws Error if the facet is not defined or if the facet is refined
	   */
	  addHierarchicalFacetRefinement: function (facet, path) {
	    if (this.isHierarchicalFacetRefined(facet)) {
	      throw new Error(facet + ' is already refined.');
	    }

	    if (!this.isHierarchicalFacet(facet)) {
	      throw new Error(facet + ' is not defined in the hierarchicalFacets attribute of the helper configuration.');
	    }

	    var mod = {};
	    mod[facet] = [path];
	    return this.setQueryParameters({
	      hierarchicalFacetsRefinements: defaultsPure({}, mod, this.hierarchicalFacetsRefinements)
	    });
	  },

	  /**
	   * Removes the refinement set on a hierarchical facet.
	   * @param {string} facet the facet name
	   * @return {SearchParameter} the new state
	   * @throws Error if the facet is not defined or if the facet is not refined
	   */
	  removeHierarchicalFacetRefinement: function (facet) {
	    if (!this.isHierarchicalFacetRefined(facet)) {
	      return this;
	    }

	    var mod = {};
	    mod[facet] = [];
	    return this.setQueryParameters({
	      hierarchicalFacetsRefinements: defaultsPure({}, mod, this.hierarchicalFacetsRefinements)
	    });
	  },

	  /**
	   * Switch the tag refinement
	   * @method
	   * @param {string} tag the tag to remove or add
	   * @return {SearchParameters}
	   */
	  toggleTagRefinement: function toggleTagRefinement(tag) {
	    if (this.isTagRefined(tag)) {
	      return this.removeTagRefinement(tag);
	    }

	    return this.addTagRefinement(tag);
	  },

	  /**
	   * Test if the facet name is from one of the disjunctive facets
	   * @method
	   * @param {string} facet facet name to test
	   * @return {boolean}
	   */
	  isDisjunctiveFacet: function (facet) {
	    return this.disjunctiveFacets.indexOf(facet) > -1;
	  },

	  /**
	   * Test if the facet name is from one of the hierarchical facets
	   * @method
	   * @param {string} facetName facet name to test
	   * @return {boolean}
	   */
	  isHierarchicalFacet: function (facetName) {
	    return this.getHierarchicalFacetByName(facetName) !== undefined;
	  },

	  /**
	   * Test if the facet name is from one of the conjunctive/normal facets
	   * @method
	   * @param {string} facet facet name to test
	   * @return {boolean}
	   */
	  isConjunctiveFacet: function (facet) {
	    return this.facets.indexOf(facet) > -1;
	  },

	  /**
	   * Returns true if the facet is refined, either for a specific value or in
	   * general.
	   * @method
	   * @param {string} facet name of the attribute for used for faceting
	   * @param {string} value, optional value. If passed will test that this value
	   * is filtering the given facet.
	   * @return {boolean} returns true if refined
	   */
	  isFacetRefined: function isFacetRefined(facet, value) {
	    if (!this.isConjunctiveFacet(facet)) {
	      return false;
	    }

	    return RefinementList.isRefined(this.facetsRefinements, facet, value);
	  },

	  /**
	   * Returns true if the facet contains exclusions or if a specific value is
	   * excluded.
	   *
	   * @method
	   * @param {string} facet name of the attribute for used for faceting
	   * @param {string} [value] optional value. If passed will test that this value
	   * is filtering the given facet.
	   * @return {boolean} returns true if refined
	   */
	  isExcludeRefined: function isExcludeRefined(facet, value) {
	    if (!this.isConjunctiveFacet(facet)) {
	      return false;
	    }

	    return RefinementList.isRefined(this.facetsExcludes, facet, value);
	  },

	  /**
	   * Returns true if the facet contains a refinement, or if a value passed is a
	   * refinement for the facet.
	   * @method
	   * @param {string} facet name of the attribute for used for faceting
	   * @param {string} value optional, will test if the value is used for refinement
	   * if there is one, otherwise will test if the facet contains any refinement
	   * @return {boolean}
	   */
	  isDisjunctiveFacetRefined: function isDisjunctiveFacetRefined(facet, value) {
	    if (!this.isDisjunctiveFacet(facet)) {
	      return false;
	    }

	    return RefinementList.isRefined(this.disjunctiveFacetsRefinements, facet, value);
	  },

	  /**
	   * Returns true if the facet contains a refinement, or if a value passed is a
	   * refinement for the facet.
	   * @method
	   * @param {string} facet name of the attribute for used for faceting
	   * @param {string} value optional, will test if the value is used for refinement
	   * if there is one, otherwise will test if the facet contains any refinement
	   * @return {boolean}
	   */
	  isHierarchicalFacetRefined: function isHierarchicalFacetRefined(facet, value) {
	    if (!this.isHierarchicalFacet(facet)) {
	      return false;
	    }

	    var refinements = this.getHierarchicalRefinement(facet);

	    if (!value) {
	      return refinements.length > 0;
	    }

	    return refinements.indexOf(value) !== -1;
	  },

	  /**
	   * Test if the triple (attribute, operator, value) is already refined.
	   * If only the attribute and the operator are provided, it tests if the
	   * contains any refinement value.
	   * @method
	   * @param {string} attribute attribute for which the refinement is applied
	   * @param {string} [operator] operator of the refinement
	   * @param {string} [value] value of the refinement
	   * @return {boolean} true if it is refined
	   */
	  isNumericRefined: function isNumericRefined(attribute, operator, value) {
	    if (value === undefined && operator === undefined) {
	      return !!this.numericRefinements[attribute];
	    }

	    var isOperatorDefined = this.numericRefinements[attribute] && this.numericRefinements[attribute][operator] !== undefined;

	    if (value === undefined || !isOperatorDefined) {
	      return isOperatorDefined;
	    }

	    var parsedValue = valToNumber_1(value);
	    var isAttributeValueDefined = findArray(this.numericRefinements[attribute][operator], parsedValue) !== undefined;
	    return isOperatorDefined && isAttributeValueDefined;
	  },

	  /**
	   * Returns true if the tag refined, false otherwise
	   * @method
	   * @param {string} tag the tag to check
	   * @return {boolean}
	   */
	  isTagRefined: function isTagRefined(tag) {
	    return this.tagRefinements.indexOf(tag) !== -1;
	  },

	  /**
	   * Returns the list of all disjunctive facets refined
	   * @method
	   * @param {string} facet name of the attribute used for faceting
	   * @param {value} value value used for filtering
	   * @return {string[]}
	   */
	  getRefinedDisjunctiveFacets: function getRefinedDisjunctiveFacets() {
	    var self = this; // attributes used for numeric filter can also be disjunctive

	    var disjunctiveNumericRefinedFacets = intersection_1(Object.keys(this.numericRefinements).filter(function (facet) {
	      return Object.keys(self.numericRefinements[facet]).length > 0;
	    }), this.disjunctiveFacets);
	    return Object.keys(this.disjunctiveFacetsRefinements).filter(function (facet) {
	      return self.disjunctiveFacetsRefinements[facet].length > 0;
	    }).concat(disjunctiveNumericRefinedFacets).concat(this.getRefinedHierarchicalFacets());
	  },

	  /**
	   * Returns the list of all disjunctive facets refined
	   * @method
	   * @param {string} facet name of the attribute used for faceting
	   * @param {value} value value used for filtering
	   * @return {string[]}
	   */
	  getRefinedHierarchicalFacets: function getRefinedHierarchicalFacets() {
	    var self = this;
	    return intersection_1( // enforce the order between the two arrays,
	    // so that refinement name index === hierarchical facet index
	    this.hierarchicalFacets.map(function (facet) {
	      return facet.name;
	    }), Object.keys(this.hierarchicalFacetsRefinements).filter(function (facet) {
	      return self.hierarchicalFacetsRefinements[facet].length > 0;
	    }));
	  },

	  /**
	   * Returned the list of all disjunctive facets not refined
	   * @method
	   * @return {string[]}
	   */
	  getUnrefinedDisjunctiveFacets: function () {
	    var refinedFacets = this.getRefinedDisjunctiveFacets();
	    return this.disjunctiveFacets.filter(function (f) {
	      return refinedFacets.indexOf(f) === -1;
	    });
	  },
	  managedParameters: ['index', 'facets', 'disjunctiveFacets', 'facetsRefinements', 'facetsExcludes', 'disjunctiveFacetsRefinements', 'numericRefinements', 'tagRefinements', 'hierarchicalFacets', 'hierarchicalFacetsRefinements'],
	  getQueryParams: function getQueryParams() {
	    var managedParameters = this.managedParameters;
	    var queryParams = {};
	    var self = this;
	    Object.keys(this).forEach(function (paramName) {
	      var paramValue = self[paramName];

	      if (managedParameters.indexOf(paramName) === -1 && paramValue !== undefined) {
	        queryParams[paramName] = paramValue;
	      }
	    });
	    return queryParams;
	  },

	  /**
	   * Let the user set a specific value for a given parameter. Will return the
	   * same instance if the parameter is invalid or if the value is the same as the
	   * previous one.
	   * @method
	   * @param {string} parameter the parameter name
	   * @param {any} value the value to be set, must be compliant with the definition
	   * of the attribute on the object
	   * @return {SearchParameters} the updated state
	   */
	  setQueryParameter: function setParameter(parameter, value) {
	    if (this[parameter] === value) return this;
	    var modification = {};
	    modification[parameter] = value;
	    return this.setQueryParameters(modification);
	  },

	  /**
	   * Let the user set any of the parameters with a plain object.
	   * @method
	   * @param {object} params all the keys and the values to be updated
	   * @return {SearchParameters} a new updated instance
	   */
	  setQueryParameters: function setQueryParameters(params) {
	    if (!params) return this;
	    var error = SearchParameters.validate(this, params);

	    if (error) {
	      throw error;
	    }

	    var self = this;

	    var nextWithNumbers = SearchParameters._parseNumbers(params);

	    var previousPlainObject = Object.keys(this).reduce(function (acc, key) {
	      acc[key] = self[key];
	      return acc;
	    }, {});
	    var nextPlainObject = Object.keys(nextWithNumbers).reduce(function (previous, key) {
	      var isPreviousValueDefined = previous[key] !== undefined;
	      var isNextValueDefined = nextWithNumbers[key] !== undefined;

	      if (isPreviousValueDefined && !isNextValueDefined) {
	        return omit(previous, [key]);
	      }

	      if (isNextValueDefined) {
	        previous[key] = nextWithNumbers[key];
	      }

	      return previous;
	    }, previousPlainObject);
	    return new this.constructor(nextPlainObject);
	  },

	  /**
	   * Returns a new instance with the page reset. Two scenarios possible:
	   * the page is omitted -> return the given instance
	   * the page is set -> return a new instance with a page of 0
	   * @return {SearchParameters} a new updated instance
	   */
	  resetPage: function () {
	    if (this.page === undefined) {
	      return this;
	    }

	    return this.setPage(0);
	  },

	  /**
	   * Helper function to get the hierarchicalFacet separator or the default one (`>`)
	   * @param  {object} hierarchicalFacet
	   * @return {string} returns the hierarchicalFacet.separator or `>` as default
	   */
	  _getHierarchicalFacetSortBy: function (hierarchicalFacet) {
	    return hierarchicalFacet.sortBy || ['isRefined:desc', 'name:asc'];
	  },

	  /**
	   * Helper function to get the hierarchicalFacet separator or the default one (`>`)
	   * @private
	   * @param  {object} hierarchicalFacet
	   * @return {string} returns the hierarchicalFacet.separator or `>` as default
	   */
	  _getHierarchicalFacetSeparator: function (hierarchicalFacet) {
	    return hierarchicalFacet.separator || ' > ';
	  },

	  /**
	   * Helper function to get the hierarchicalFacet prefix path or null
	   * @private
	   * @param  {object} hierarchicalFacet
	   * @return {string} returns the hierarchicalFacet.rootPath or null as default
	   */
	  _getHierarchicalRootPath: function (hierarchicalFacet) {
	    return hierarchicalFacet.rootPath || null;
	  },

	  /**
	   * Helper function to check if we show the parent level of the hierarchicalFacet
	   * @private
	   * @param  {object} hierarchicalFacet
	   * @return {string} returns the hierarchicalFacet.showParentLevel or true as default
	   */
	  _getHierarchicalShowParentLevel: function (hierarchicalFacet) {
	    if (typeof hierarchicalFacet.showParentLevel === 'boolean') {
	      return hierarchicalFacet.showParentLevel;
	    }

	    return true;
	  },

	  /**
	   * Helper function to get the hierarchicalFacet by it's name
	   * @param  {string} hierarchicalFacetName
	   * @return {object} a hierarchicalFacet
	   */
	  getHierarchicalFacetByName: function (hierarchicalFacetName) {
	    return find(this.hierarchicalFacets, function (f) {
	      return f.name === hierarchicalFacetName;
	    });
	  },

	  /**
	   * Get the current breadcrumb for a hierarchical facet, as an array
	   * @param  {string} facetName Hierarchical facet name
	   * @return {array.<string>} the path as an array of string
	   */
	  getHierarchicalFacetBreadcrumb: function (facetName) {
	    if (!this.isHierarchicalFacet(facetName)) {
	      return [];
	    }

	    var refinement = this.getHierarchicalRefinement(facetName)[0];
	    if (!refinement) return [];

	    var separator = this._getHierarchicalFacetSeparator(this.getHierarchicalFacetByName(facetName));

	    var path = refinement.split(separator);
	    return path.map(function (part) {
	      return part.trim();
	    });
	  },
	  toString: function () {
	    return JSON.stringify(this, null, 2);
	  }
	};
	/**
	 * Callback used for clearRefinement method
	 * @callback SearchParameters.clearCallback
	 * @param {OperatorList|FacetList} value the value of the filter
	 * @param {string} key the current attribute name
	 * @param {string} type `numeric`, `disjunctiveFacet`, `conjunctiveFacet`, `hierarchicalFacet` or `exclude`
	 * depending on the type of facet
	 * @return {boolean} `true` if the element should be removed. `false` otherwise.
	 */

	var SearchParameters_1 = SearchParameters;

	function compareAscending(value, other) {
	  if (value !== other) {
	    var valIsDefined = value !== undefined;
	    var valIsNull = value === null;
	    var othIsDefined = other !== undefined;
	    var othIsNull = other === null;

	    if (!othIsNull && value > other || valIsNull && othIsDefined || !valIsDefined) {
	      return 1;
	    }

	    if (!valIsNull && value < other || othIsNull && valIsDefined || !othIsDefined) {
	      return -1;
	    }
	  }

	  return 0;
	}
	/**
	 * @param {Array<object>} collection object with keys in attributes
	 * @param {Array<string>} iteratees attributes
	 * @param {Array<string>} orders asc | desc
	 */


	function orderBy(collection, iteratees, orders) {
	  if (!Array.isArray(collection)) {
	    return [];
	  }

	  if (!Array.isArray(orders)) {
	    orders = [];
	  }

	  var result = collection.map(function (value, index) {
	    return {
	      criteria: iteratees.map(function (iteratee) {
	        return value[iteratee];
	      }),
	      index: index,
	      value: value
	    };
	  });
	  result.sort(function comparer(object, other) {
	    var index = -1;

	    while (++index < object.criteria.length) {
	      var res = compareAscending(object.criteria[index], other.criteria[index]);

	      if (res) {
	        if (index >= orders.length) {
	          return res;
	        }

	        if (orders[index] === 'desc') {
	          return -res;
	        }

	        return res;
	      }
	    } // This ensures a stable sort in V8 and other engines.
	    // See https://bugs.chromium.org/p/v8/issues/detail?id=90 for more details.


	    return object.index - other.index;
	  });
	  return result.map(function (res) {
	    return res.value;
	  });
	}

	var orderBy_1 = orderBy;

	var compact = function compact(array) {
	  if (!Array.isArray(array)) {
	    return [];
	  }

	  return array.filter(Boolean);
	};

	var findIndex = function find(array, comparator) {
	  if (!Array.isArray(array)) {
	    return -1;
	  }

	  for (var i = 0; i < array.length; i++) {
	    if (comparator(array[i])) {
	      return i;
	    }
	  }

	  return -1;
	};

	/**
	 * Transform sort format from user friendly notation to lodash format
	 * @param {string[]} sortBy array of predicate of the form "attribute:order"
	 * @param {string[]} [defaults] array of predicate of the form "attribute:order"
	 * @return {array.<string[]>} array containing 2 elements : attributes, orders
	 */


	var formatSort = function formatSort(sortBy, defaults) {
	  var defaultInstructions = (defaults || []).map(function (sort) {
	    return sort.split(':');
	  });
	  return sortBy.reduce(function preparePredicate(out, sort) {
	    var sortInstruction = sort.split(':');
	    var matchingDefault = find(defaultInstructions, function (defaultInstruction) {
	      return defaultInstruction[0] === sortInstruction[0];
	    });

	    if (sortInstruction.length > 1 || !matchingDefault) {
	      out[0].push(sortInstruction[0]);
	      out[1].push(sortInstruction[1]);
	      return out;
	    }

	    out[0].push(matchingDefault[0]);
	    out[1].push(matchingDefault[1]);
	    return out;
	  }, [[], []]);
	};

	var generateHierarchicalTree_1 = generateTrees;

	function generateTrees(state) {
	  return function generate(hierarchicalFacetResult, hierarchicalFacetIndex) {
	    var hierarchicalFacet = state.hierarchicalFacets[hierarchicalFacetIndex];
	    var hierarchicalFacetRefinement = state.hierarchicalFacetsRefinements[hierarchicalFacet.name] && state.hierarchicalFacetsRefinements[hierarchicalFacet.name][0] || '';

	    var hierarchicalSeparator = state._getHierarchicalFacetSeparator(hierarchicalFacet);

	    var hierarchicalRootPath = state._getHierarchicalRootPath(hierarchicalFacet);

	    var hierarchicalShowParentLevel = state._getHierarchicalShowParentLevel(hierarchicalFacet);

	    var sortBy = formatSort(state._getHierarchicalFacetSortBy(hierarchicalFacet));
	    var rootExhaustive = hierarchicalFacetResult.every(function (facetResult) {
	      return facetResult.exhaustive;
	    });
	    var generateTreeFn = generateHierarchicalTree(sortBy, hierarchicalSeparator, hierarchicalRootPath, hierarchicalShowParentLevel, hierarchicalFacetRefinement);
	    var results = hierarchicalFacetResult;

	    if (hierarchicalRootPath) {
	      results = hierarchicalFacetResult.slice(hierarchicalRootPath.split(hierarchicalSeparator).length);
	    }

	    return results.reduce(generateTreeFn, {
	      name: state.hierarchicalFacets[hierarchicalFacetIndex].name,
	      count: null,
	      // root level, no count
	      isRefined: true,
	      // root level, always refined
	      path: null,
	      // root level, no path
	      exhaustive: rootExhaustive,
	      data: null
	    });
	  };
	}

	function generateHierarchicalTree(sortBy, hierarchicalSeparator, hierarchicalRootPath, hierarchicalShowParentLevel, currentRefinement) {
	  return function generateTree(hierarchicalTree, hierarchicalFacetResult, currentHierarchicalLevel) {
	    var parent = hierarchicalTree;

	    if (currentHierarchicalLevel > 0) {
	      var level = 0;
	      parent = hierarchicalTree;

	      while (level < currentHierarchicalLevel) {
	        /**
	         * @type {object[]]} hierarchical data
	         */
	        var data = parent && Array.isArray(parent.data) ? parent.data : [];
	        parent = find(data, function (subtree) {
	          return subtree.isRefined;
	        });
	        level++;
	      }
	    } // we found a refined parent, let's add current level data under it


	    if (parent) {
	      // filter values in case an object has multiple categories:
	      //   {
	      //     categories: {
	      //       level0: ['beers', 'bières'],
	      //       level1: ['beers > IPA', 'bières > Belges']
	      //     }
	      //   }
	      //
	      // If parent refinement is `beers`, then we do not want to have `bières > Belges`
	      // showing up
	      var picked = Object.keys(hierarchicalFacetResult.data).map(function (facetValue) {
	        return [facetValue, hierarchicalFacetResult.data[facetValue]];
	      }).filter(function (tuple) {
	        var facetValue = tuple[0];
	        return onlyMatchingTree(facetValue, parent.path || hierarchicalRootPath, currentRefinement, hierarchicalSeparator, hierarchicalRootPath, hierarchicalShowParentLevel);
	      });
	      parent.data = orderBy_1(picked.map(function (tuple) {
	        var facetValue = tuple[0];
	        var facetCount = tuple[1];
	        return format(facetCount, facetValue, hierarchicalSeparator, currentRefinement, hierarchicalFacetResult.exhaustive);
	      }), sortBy[0], sortBy[1]);
	    }

	    return hierarchicalTree;
	  };
	}

	function onlyMatchingTree(facetValue, parentPath, currentRefinement, hierarchicalSeparator, hierarchicalRootPath, hierarchicalShowParentLevel) {
	  // we want the facetValue is a child of hierarchicalRootPath
	  if (hierarchicalRootPath && (facetValue.indexOf(hierarchicalRootPath) !== 0 || hierarchicalRootPath === facetValue)) {
	    return false;
	  } // we always want root levels (only when there is no prefix path)


	  return !hierarchicalRootPath && facetValue.indexOf(hierarchicalSeparator) === -1 || // if there is a rootPath, being root level mean 1 level under rootPath
	  hierarchicalRootPath && facetValue.split(hierarchicalSeparator).length - hierarchicalRootPath.split(hierarchicalSeparator).length === 1 || // if current refinement is a root level and current facetValue is a root level,
	  // keep the facetValue
	  facetValue.indexOf(hierarchicalSeparator) === -1 && currentRefinement.indexOf(hierarchicalSeparator) === -1 || // currentRefinement is a child of the facet value
	  currentRefinement.indexOf(facetValue) === 0 || // facetValue is a child of the current parent, add it
	  facetValue.indexOf(parentPath + hierarchicalSeparator) === 0 && (hierarchicalShowParentLevel || facetValue.indexOf(currentRefinement) === 0);
	}

	function format(facetCount, facetValue, hierarchicalSeparator, currentRefinement, exhaustive) {
	  var parts = facetValue.split(hierarchicalSeparator);
	  return {
	    name: parts[parts.length - 1].trim(),
	    path: facetValue,
	    count: facetCount,
	    isRefined: currentRefinement === facetValue || currentRefinement.indexOf(facetValue + hierarchicalSeparator) === 0,
	    exhaustive: exhaustive,
	    data: null
	  };
	}

	/**
	 * @typedef SearchResults.Facet
	 * @type {object}
	 * @property {string} name name of the attribute in the record
	 * @property {object} data the faceting data: value, number of entries
	 * @property {object} stats undefined unless facet_stats is retrieved from algolia
	 */

	/**
	 * @typedef SearchResults.HierarchicalFacet
	 * @type {object}
	 * @property {string} name name of the current value given the hierarchical level, trimmed.
	 * If root node, you get the facet name
	 * @property {number} count number of objects matching this hierarchical value
	 * @property {string} path the current hierarchical value full path
	 * @property {boolean} isRefined `true` if the current value was refined, `false` otherwise
	 * @property {HierarchicalFacet[]} data sub values for the current level
	 */

	/**
	 * @typedef SearchResults.FacetValue
	 * @type {object}
	 * @property {string} name the facet value itself
	 * @property {number} count times this facet appears in the results
	 * @property {boolean} isRefined is the facet currently selected
	 * @property {boolean} isExcluded is the facet currently excluded (only for conjunctive facets)
	 */

	/**
	 * @typedef Refinement
	 * @type {object}
	 * @property {string} type the type of filter used:
	 * `numeric`, `facet`, `exclude`, `disjunctive`, `hierarchical`
	 * @property {string} attributeName name of the attribute used for filtering
	 * @property {string} name the value of the filter
	 * @property {number} numericValue the value as a number. Only for numeric filters.
	 * @property {string} operator the operator used. Only for numeric filters.
	 * @property {number} count the number of computed hits for this filter. Only on facets.
	 * @property {boolean} exhaustive if the count is exhaustive
	 */

	/**
	 * @param {string[]} attributes
	 */


	function getIndices(attributes) {
	  var indices = {};
	  attributes.forEach(function (val, idx) {
	    indices[val] = idx;
	  });
	  return indices;
	}

	function assignFacetStats(dest, facetStats, key) {
	  if (facetStats && facetStats[key]) {
	    dest.stats = facetStats[key];
	  }
	}
	/**
	 * @typedef {Object} HierarchicalFacet
	 * @property {string} name
	 * @property {string[]} attributes
	 */

	/**
	 * @param {HierarchicalFacet[]} hierarchicalFacets
	 * @param {string} hierarchicalAttributeName
	 */


	function findMatchingHierarchicalFacetFromAttributeName(hierarchicalFacets, hierarchicalAttributeName) {
	  return find(hierarchicalFacets, function facetKeyMatchesAttribute(hierarchicalFacet) {
	    var facetNames = hierarchicalFacet.attributes || [];
	    return facetNames.indexOf(hierarchicalAttributeName) > -1;
	  });
	}
	/*eslint-disable */

	/**
	 * Constructor for SearchResults
	 * @class
	 * @classdesc SearchResults contains the results of a query to Algolia using the
	 * {@link AlgoliaSearchHelper}.
	 * @param {SearchParameters} state state that led to the response
	 * @param {array.<object>} results the results from algolia client
	 * @example <caption>SearchResults of the first query in
	 * <a href="http://demos.algolia.com/instant-search-demo">the instant search demo</a></caption>
	{
	   "hitsPerPage": 10,
	   "processingTimeMS": 2,
	   "facets": [
	      {
	         "name": "type",
	         "data": {
	            "HardGood": 6627,
	            "BlackTie": 550,
	            "Music": 665,
	            "Software": 131,
	            "Game": 456,
	            "Movie": 1571
	         },
	         "exhaustive": false
	      },
	      {
	         "exhaustive": false,
	         "data": {
	            "Free shipping": 5507
	         },
	         "name": "shipping"
	      }
	  ],
	   "hits": [
	      {
	         "thumbnailImage": "http://img.bbystatic.com/BestBuy_US/images/products/1688/1688832_54x108_s.gif",
	         "_highlightResult": {
	            "shortDescription": {
	               "matchLevel": "none",
	               "value": "Safeguard your PC, Mac, Android and iOS devices with comprehensive Internet protection",
	               "matchedWords": []
	            },
	            "category": {
	               "matchLevel": "none",
	               "value": "Computer Security Software",
	               "matchedWords": []
	            },
	            "manufacturer": {
	               "matchedWords": [],
	               "value": "Webroot",
	               "matchLevel": "none"
	            },
	            "name": {
	               "value": "Webroot SecureAnywhere Internet Security (3-Device) (1-Year Subscription) - Mac/Windows",
	               "matchedWords": [],
	               "matchLevel": "none"
	            }
	         },
	         "image": "http://img.bbystatic.com/BestBuy_US/images/products/1688/1688832_105x210_sc.jpg",
	         "shipping": "Free shipping",
	         "bestSellingRank": 4,
	         "shortDescription": "Safeguard your PC, Mac, Android and iOS devices with comprehensive Internet protection",
	         "url": "http://www.bestbuy.com/site/webroot-secureanywhere-internet-security-3-devi…d=1219060687969&skuId=1688832&cmp=RMX&ky=2d3GfEmNIzjA0vkzveHdZEBgpPCyMnLTJ",
	         "name": "Webroot SecureAnywhere Internet Security (3-Device) (1-Year Subscription) - Mac/Windows",
	         "category": "Computer Security Software",
	         "salePrice_range": "1 - 50",
	         "objectID": "1688832",
	         "type": "Software",
	         "customerReviewCount": 5980,
	         "salePrice": 49.99,
	         "manufacturer": "Webroot"
	      },
	      ....
	  ],
	   "nbHits": 10000,
	   "disjunctiveFacets": [
	      {
	         "exhaustive": false,
	         "data": {
	            "5": 183,
	            "12": 112,
	            "7": 149,
	            ...
	         },
	         "name": "customerReviewCount",
	         "stats": {
	            "max": 7461,
	            "avg": 157.939,
	            "min": 1
	         }
	      },
	      {
	         "data": {
	            "Printer Ink": 142,
	            "Wireless Speakers": 60,
	            "Point & Shoot Cameras": 48,
	            ...
	         },
	         "name": "category",
	         "exhaustive": false
	      },
	      {
	         "exhaustive": false,
	         "data": {
	            "> 5000": 2,
	            "1 - 50": 6524,
	            "501 - 2000": 566,
	            "201 - 500": 1501,
	            "101 - 200": 1360,
	            "2001 - 5000": 47
	         },
	         "name": "salePrice_range"
	      },
	      {
	         "data": {
	            "Dynex™": 202,
	            "Insignia™": 230,
	            "PNY": 72,
	            ...
	         },
	         "name": "manufacturer",
	         "exhaustive": false
	      }
	  ],
	   "query": "",
	   "nbPages": 100,
	   "page": 0,
	   "index": "bestbuy"
	}
	 **/

	/*eslint-enable */


	function SearchResults(state, results) {
	  var mainSubResponse = results[0];
	  this._rawResults = results;
	  var self = this; // https://www.algolia.com/doc/api-reference/api-methods/search/#response

	  Object.keys(mainSubResponse).forEach(function (key) {
	    self[key] = mainSubResponse[key];
	  });
	  /**
	   * query used to generate the results
	   * @name query
	   * @member {string}
	   * @memberof SearchResults
	   * @instance
	   */

	  /**
	   * The query as parsed by the engine given all the rules.
	   * @name parsedQuery
	   * @member {string}
	   * @memberof SearchResults
	   * @instance
	   */

	  /**
	   * all the records that match the search parameters. Each record is
	   * augmented with a new attribute `_highlightResult`
	   * which is an object keyed by attribute and with the following properties:
	   *  - `value` : the value of the facet highlighted (html)
	   *  - `matchLevel`: full, partial or none depending on how the query terms match
	   * @name hits
	   * @member {object[]}
	   * @memberof SearchResults
	   * @instance
	   */

	  /**
	   * index where the results come from
	   * @name index
	   * @member {string}
	   * @memberof SearchResults
	   * @instance
	   */

	  /**
	   * number of hits per page requested
	   * @name hitsPerPage
	   * @member {number}
	   * @memberof SearchResults
	   * @instance
	   */

	  /**
	   * total number of hits of this query on the index
	   * @name nbHits
	   * @member {number}
	   * @memberof SearchResults
	   * @instance
	   */

	  /**
	   * total number of pages with respect to the number of hits per page and the total number of hits
	   * @name nbPages
	   * @member {number}
	   * @memberof SearchResults
	   * @instance
	   */

	  /**
	   * current page
	   * @name page
	   * @member {number}
	   * @memberof SearchResults
	   * @instance
	   */

	  /**
	   * The position if the position was guessed by IP.
	   * @name aroundLatLng
	   * @member {string}
	   * @memberof SearchResults
	   * @instance
	   * @example "48.8637,2.3615",
	   */

	  /**
	   * The radius computed by Algolia.
	   * @name automaticRadius
	   * @member {string}
	   * @memberof SearchResults
	   * @instance
	   * @example "126792922",
	   */

	  /**
	   * String identifying the server used to serve this request.
	   *
	   * getRankingInfo needs to be set to `true` for this to be returned
	   *
	   * @name serverUsed
	   * @member {string}
	   * @memberof SearchResults
	   * @instance
	   * @example "c7-use-2.algolia.net",
	   */

	  /**
	   * Boolean that indicates if the computation of the counts did time out.
	   * @deprecated
	   * @name timeoutCounts
	   * @member {boolean}
	   * @memberof SearchResults
	   * @instance
	   */

	  /**
	   * Boolean that indicates if the computation of the hits did time out.
	   * @deprecated
	   * @name timeoutHits
	   * @member {boolean}
	   * @memberof SearchResults
	   * @instance
	   */

	  /**
	   * True if the counts of the facets is exhaustive
	   * @name exhaustiveFacetsCount
	   * @member {boolean}
	   * @memberof SearchResults
	   * @instance
	   */

	  /**
	   * True if the number of hits is exhaustive
	   * @name exhaustiveNbHits
	   * @member {boolean}
	   * @memberof SearchResults
	   * @instance
	   */

	  /**
	   * Contains the userData if they are set by a [query rule](https://www.algolia.com/doc/guides/query-rules/query-rules-overview/).
	   * @name userData
	   * @member {object[]}
	   * @memberof SearchResults
	   * @instance
	   */

	  /**
	   * queryID is the unique identifier of the query used to generate the current search results.
	   * This value is only available if the `clickAnalytics` search parameter is set to `true`.
	   * @name queryID
	   * @member {string}
	   * @memberof SearchResults
	   * @instance
	   */

	  /**
	   * sum of the processing time of all the queries
	   * @member {number}
	   */

	  this.processingTimeMS = results.reduce(function (sum, result) {
	    return result.processingTimeMS === undefined ? sum : sum + result.processingTimeMS;
	  }, 0);
	  /**
	   * disjunctive facets results
	   * @member {SearchResults.Facet[]}
	   */

	  this.disjunctiveFacets = [];
	  /**
	   * disjunctive facets results
	   * @member {SearchResults.HierarchicalFacet[]}
	   */

	  this.hierarchicalFacets = state.hierarchicalFacets.map(function initFutureTree() {
	    return [];
	  });
	  /**
	   * other facets results
	   * @member {SearchResults.Facet[]}
	   */

	  this.facets = [];
	  var disjunctiveFacets = state.getRefinedDisjunctiveFacets();
	  var facetsIndices = getIndices(state.facets);
	  var disjunctiveFacetsIndices = getIndices(state.disjunctiveFacets);
	  var nextDisjunctiveResult = 1; // Since we send request only for disjunctive facets that have been refined,
	  // we get the facets information from the first, general, response.

	  var mainFacets = mainSubResponse.facets || {};
	  Object.keys(mainFacets).forEach(function (facetKey) {
	    var facetValueObject = mainFacets[facetKey];
	    var hierarchicalFacet = findMatchingHierarchicalFacetFromAttributeName(state.hierarchicalFacets, facetKey);

	    if (hierarchicalFacet) {
	      // Place the hierarchicalFacet data at the correct index depending on
	      // the attributes order that was defined at the helper initialization
	      var facetIndex = hierarchicalFacet.attributes.indexOf(facetKey);
	      var idxAttributeName = findIndex(state.hierarchicalFacets, function (f) {
	        return f.name === hierarchicalFacet.name;
	      });
	      self.hierarchicalFacets[idxAttributeName][facetIndex] = {
	        attribute: facetKey,
	        data: facetValueObject,
	        exhaustive: mainSubResponse.exhaustiveFacetsCount
	      };
	    } else {
	      var isFacetDisjunctive = state.disjunctiveFacets.indexOf(facetKey) !== -1;
	      var isFacetConjunctive = state.facets.indexOf(facetKey) !== -1;
	      var position;

	      if (isFacetDisjunctive) {
	        position = disjunctiveFacetsIndices[facetKey];
	        self.disjunctiveFacets[position] = {
	          name: facetKey,
	          data: facetValueObject,
	          exhaustive: mainSubResponse.exhaustiveFacetsCount
	        };
	        assignFacetStats(self.disjunctiveFacets[position], mainSubResponse.facets_stats, facetKey);
	      }

	      if (isFacetConjunctive) {
	        position = facetsIndices[facetKey];
	        self.facets[position] = {
	          name: facetKey,
	          data: facetValueObject,
	          exhaustive: mainSubResponse.exhaustiveFacetsCount
	        };
	        assignFacetStats(self.facets[position], mainSubResponse.facets_stats, facetKey);
	      }
	    }
	  }); // Make sure we do not keep holes within the hierarchical facets

	  this.hierarchicalFacets = compact(this.hierarchicalFacets); // aggregate the refined disjunctive facets

	  disjunctiveFacets.forEach(function (disjunctiveFacet) {
	    var result = results[nextDisjunctiveResult];
	    var facets = result && result.facets ? result.facets : {};
	    var hierarchicalFacet = state.getHierarchicalFacetByName(disjunctiveFacet); // There should be only item in facets.

	    Object.keys(facets).forEach(function (dfacet) {
	      var facetResults = facets[dfacet];
	      var position;

	      if (hierarchicalFacet) {
	        position = findIndex(state.hierarchicalFacets, function (f) {
	          return f.name === hierarchicalFacet.name;
	        });
	        var attributeIndex = findIndex(self.hierarchicalFacets[position], function (f) {
	          return f.attribute === dfacet;
	        }); // previous refinements and no results so not able to find it

	        if (attributeIndex === -1) {
	          return;
	        }

	        self.hierarchicalFacets[position][attributeIndex].data = merge_1({}, self.hierarchicalFacets[position][attributeIndex].data, facetResults);
	      } else {
	        position = disjunctiveFacetsIndices[dfacet];
	        var dataFromMainRequest = mainSubResponse.facets && mainSubResponse.facets[dfacet] || {};
	        self.disjunctiveFacets[position] = {
	          name: dfacet,
	          data: defaultsPure({}, facetResults, dataFromMainRequest),
	          exhaustive: result.exhaustiveFacetsCount
	        };
	        assignFacetStats(self.disjunctiveFacets[position], result.facets_stats, dfacet);

	        if (state.disjunctiveFacetsRefinements[dfacet]) {
	          state.disjunctiveFacetsRefinements[dfacet].forEach(function (refinementValue) {
	            // add the disjunctive refinements if it is no more retrieved
	            if (!self.disjunctiveFacets[position].data[refinementValue] && state.disjunctiveFacetsRefinements[dfacet].indexOf(refinementValue) > -1) {
	              self.disjunctiveFacets[position].data[refinementValue] = 0;
	            }
	          });
	        }
	      }
	    });
	    nextDisjunctiveResult++;
	  }); // if we have some root level values for hierarchical facets, merge them

	  state.getRefinedHierarchicalFacets().forEach(function (refinedFacet) {
	    var hierarchicalFacet = state.getHierarchicalFacetByName(refinedFacet);

	    var separator = state._getHierarchicalFacetSeparator(hierarchicalFacet);

	    var currentRefinement = state.getHierarchicalRefinement(refinedFacet); // if we are already at a root refinement (or no refinement at all), there is no
	    // root level values request

	    if (currentRefinement.length === 0 || currentRefinement[0].split(separator).length < 2) {
	      return;
	    }

	    var result = results[nextDisjunctiveResult];
	    var facets = result && result.facets ? result.facets : {};
	    Object.keys(facets).forEach(function (dfacet) {
	      var facetResults = facets[dfacet];
	      var position = findIndex(state.hierarchicalFacets, function (f) {
	        return f.name === hierarchicalFacet.name;
	      });
	      var attributeIndex = findIndex(self.hierarchicalFacets[position], function (f) {
	        return f.attribute === dfacet;
	      }); // previous refinements and no results so not able to find it

	      if (attributeIndex === -1) {
	        return;
	      } // when we always get root levels, if the hits refinement is `beers > IPA` (count: 5),
	      // then the disjunctive values will be `beers` (count: 100),
	      // but we do not want to display
	      //   | beers (100)
	      //     > IPA (5)
	      // We want
	      //   | beers (5)
	      //     > IPA (5)


	      var defaultData = {};

	      if (currentRefinement.length > 0) {
	        var root = currentRefinement[0].split(separator)[0];
	        defaultData[root] = self.hierarchicalFacets[position][attributeIndex].data[root];
	      }

	      self.hierarchicalFacets[position][attributeIndex].data = defaultsPure(defaultData, facetResults, self.hierarchicalFacets[position][attributeIndex].data);
	    });
	    nextDisjunctiveResult++;
	  }); // add the excludes

	  Object.keys(state.facetsExcludes).forEach(function (facetName) {
	    var excludes = state.facetsExcludes[facetName];
	    var position = facetsIndices[facetName];
	    self.facets[position] = {
	      name: facetName,
	      data: mainSubResponse.facets[facetName],
	      exhaustive: mainSubResponse.exhaustiveFacetsCount
	    };
	    excludes.forEach(function (facetValue) {
	      self.facets[position] = self.facets[position] || {
	        name: facetName
	      };
	      self.facets[position].data = self.facets[position].data || {};
	      self.facets[position].data[facetValue] = 0;
	    });
	  });
	  /**
	   * @type {Array}
	   */

	  this.hierarchicalFacets = this.hierarchicalFacets.map(generateHierarchicalTree_1(state));
	  /**
	   * @type {Array}
	   */

	  this.facets = compact(this.facets);
	  /**
	   * @type {Array}
	   */

	  this.disjunctiveFacets = compact(this.disjunctiveFacets);
	  this._state = state;
	}
	/**
	 * Get a facet object with its name
	 * @deprecated
	 * @param {string} name name of the faceted attribute
	 * @return {SearchResults.Facet} the facet object
	 */


	SearchResults.prototype.getFacetByName = function (name) {
	  function predicate(facet) {
	    return facet.name === name;
	  }

	  return find(this.facets, predicate) || find(this.disjunctiveFacets, predicate) || find(this.hierarchicalFacets, predicate);
	};
	/**
	 * Get the facet values of a specified attribute from a SearchResults object.
	 * @private
	 * @param {SearchResults} results the search results to search in
	 * @param {string} attribute name of the faceted attribute to search for
	 * @return {array|object} facet values. For the hierarchical facets it is an object.
	 */


	function extractNormalizedFacetValues(results, attribute) {
	  function predicate(facet) {
	    return facet.name === attribute;
	  }

	  if (results._state.isConjunctiveFacet(attribute)) {
	    var facet = find(results.facets, predicate);
	    if (!facet) return [];
	    return Object.keys(facet.data).map(function (name) {
	      return {
	        name: name,
	        count: facet.data[name],
	        isRefined: results._state.isFacetRefined(attribute, name),
	        isExcluded: results._state.isExcludeRefined(attribute, name)
	      };
	    });
	  } else if (results._state.isDisjunctiveFacet(attribute)) {
	    var disjunctiveFacet = find(results.disjunctiveFacets, predicate);
	    if (!disjunctiveFacet) return [];
	    return Object.keys(disjunctiveFacet.data).map(function (name) {
	      return {
	        name: name,
	        count: disjunctiveFacet.data[name],
	        isRefined: results._state.isDisjunctiveFacetRefined(attribute, name)
	      };
	    });
	  } else if (results._state.isHierarchicalFacet(attribute)) {
	    return find(results.hierarchicalFacets, predicate);
	  }
	}
	/**
	 * Sort nodes of a hierarchical facet results
	 * @private
	 * @param {HierarchicalFacet} node node to upon which we want to apply the sort
	 */


	function recSort(sortFn, node) {
	  if (!node.data || node.data.length === 0) {
	    return node;
	  }

	  var children = node.data.map(function (childNode) {
	    return recSort(sortFn, childNode);
	  });
	  var sortedChildren = sortFn(children);
	  var newNode = merge_1({}, node, {
	    data: sortedChildren
	  });
	  return newNode;
	}

	SearchResults.DEFAULT_SORT = ['isRefined:desc', 'count:desc', 'name:asc'];

	function vanillaSortFn(order, data) {
	  return data.sort(order);
	}
	/**
	 * Get a the list of values for a given facet attribute. Those values are sorted
	 * refinement first, descending count (bigger value on top), and name ascending
	 * (alphabetical order). The sort formula can overridden using either string based
	 * predicates or a function.
	 *
	 * This method will return all the values returned by the Algolia engine plus all
	 * the values already refined. This means that it can happen that the
	 * `maxValuesPerFacet` [configuration](https://www.algolia.com/doc/rest-api/search#param-maxValuesPerFacet)
	 * might not be respected if you have facet values that are already refined.
	 * @param {string} attribute attribute name
	 * @param {object} opts configuration options.
	 * @param {Array.<string> | function} opts.sortBy
	 * When using strings, it consists of
	 * the name of the [FacetValue](#SearchResults.FacetValue) or the
	 * [HierarchicalFacet](#SearchResults.HierarchicalFacet) attributes with the
	 * order (`asc` or `desc`). For example to order the value by count, the
	 * argument would be `['count:asc']`.
	 *
	 * If only the attribute name is specified, the ordering defaults to the one
	 * specified in the default value for this attribute.
	 *
	 * When not specified, the order is
	 * ascending.  This parameter can also be a function which takes two facet
	 * values and should return a number, 0 if equal, 1 if the first argument is
	 * bigger or -1 otherwise.
	 *
	 * The default value for this attribute `['isRefined:desc', 'count:desc', 'name:asc']`
	 * @return {FacetValue[]|HierarchicalFacet|undefined} depending on the type of facet of
	 * the attribute requested (hierarchical, disjunctive or conjunctive)
	 * @example
	 * helper.on('result', function(event){
	 *   //get values ordered only by name ascending using the string predicate
	 *   event.results.getFacetValues('city', {sortBy: ['name:asc']});
	 *   //get values  ordered only by count ascending using a function
	 *   event.results.getFacetValues('city', {
	 *     // this is equivalent to ['count:asc']
	 *     sortBy: function(a, b) {
	 *       if (a.count === b.count) return 0;
	 *       if (a.count > b.count)   return 1;
	 *       if (b.count > a.count)   return -1;
	 *     }
	 *   });
	 * });
	 */


	SearchResults.prototype.getFacetValues = function (attribute, opts) {
	  var facetValues = extractNormalizedFacetValues(this, attribute);

	  if (!facetValues) {
	    return undefined;
	  }

	  var options = defaultsPure({}, opts, {
	    sortBy: SearchResults.DEFAULT_SORT
	  });

	  if (Array.isArray(options.sortBy)) {
	    var order = formatSort(options.sortBy, SearchResults.DEFAULT_SORT);

	    if (Array.isArray(facetValues)) {
	      return orderBy_1(facetValues, order[0], order[1]);
	    } // If facetValues is not an array, it's an object thus a hierarchical facet object


	    return recSort(function (hierarchicalFacetValues) {
	      return orderBy_1(hierarchicalFacetValues, order[0], order[1]);
	    }, facetValues);
	  } else if (typeof options.sortBy === 'function') {
	    if (Array.isArray(facetValues)) {
	      return facetValues.sort(options.sortBy);
	    } // If facetValues is not an array, it's an object thus a hierarchical facet object


	    return recSort(function (data) {
	      return vanillaSortFn(options.sortBy, data);
	    }, facetValues);
	  }

	  throw new Error('options.sortBy is optional but if defined it must be ' + 'either an array of string (predicates) or a sorting function');
	};
	/**
	 * Returns the facet stats if attribute is defined and the facet contains some.
	 * Otherwise returns undefined.
	 * @param {string} attribute name of the faceted attribute
	 * @return {object} The stats of the facet
	 */


	SearchResults.prototype.getFacetStats = function (attribute) {
	  if (this._state.isConjunctiveFacet(attribute)) {
	    return getFacetStatsIfAvailable(this.facets, attribute);
	  } else if (this._state.isDisjunctiveFacet(attribute)) {
	    return getFacetStatsIfAvailable(this.disjunctiveFacets, attribute);
	  }

	  return undefined;
	};
	/**
	 * @typedef {Object} FacetListItem
	 * @property {string} name
	 */

	/**
	 * @param {FacetListItem[]} facetList (has more items, but enough for here)
	 * @param {string} facetName
	 */


	function getFacetStatsIfAvailable(facetList, facetName) {
	  var data = find(facetList, function (facet) {
	    return facet.name === facetName;
	  });
	  return data && data.stats;
	}
	/**
	 * Returns all refinements for all filters + tags. It also provides
	 * additional information: count and exhaustiveness for each filter.
	 *
	 * See the [refinement type](#Refinement) for an exhaustive view of the available
	 * data.
	 *
	 * Note that for a numeric refinement, results are grouped per operator, this
	 * means that it will return responses for operators which are empty.
	 *
	 * @return {Array.<Refinement>} all the refinements
	 */


	SearchResults.prototype.getRefinements = function () {
	  var state = this._state;
	  var results = this;
	  var res = [];
	  Object.keys(state.facetsRefinements).forEach(function (attributeName) {
	    state.facetsRefinements[attributeName].forEach(function (name) {
	      res.push(getRefinement(state, 'facet', attributeName, name, results.facets));
	    });
	  });
	  Object.keys(state.facetsExcludes).forEach(function (attributeName) {
	    state.facetsExcludes[attributeName].forEach(function (name) {
	      res.push(getRefinement(state, 'exclude', attributeName, name, results.facets));
	    });
	  });
	  Object.keys(state.disjunctiveFacetsRefinements).forEach(function (attributeName) {
	    state.disjunctiveFacetsRefinements[attributeName].forEach(function (name) {
	      res.push(getRefinement(state, 'disjunctive', attributeName, name, results.disjunctiveFacets));
	    });
	  });
	  Object.keys(state.hierarchicalFacetsRefinements).forEach(function (attributeName) {
	    state.hierarchicalFacetsRefinements[attributeName].forEach(function (name) {
	      res.push(getHierarchicalRefinement(state, attributeName, name, results.hierarchicalFacets));
	    });
	  });
	  Object.keys(state.numericRefinements).forEach(function (attributeName) {
	    var operators = state.numericRefinements[attributeName];
	    Object.keys(operators).forEach(function (operator) {
	      operators[operator].forEach(function (value) {
	        res.push({
	          type: 'numeric',
	          attributeName: attributeName,
	          name: value,
	          numericValue: value,
	          operator: operator
	        });
	      });
	    });
	  });
	  state.tagRefinements.forEach(function (name) {
	    res.push({
	      type: 'tag',
	      attributeName: '_tags',
	      name: name
	    });
	  });
	  return res;
	};
	/**
	 * @typedef {Object} Facet
	 * @property {string} name
	 * @property {Object} data
	 * @property {boolean} exhaustive
	 */

	/**
	 * @param {*} state
	 * @param {*} type
	 * @param {string} attributeName
	 * @param {*} name
	 * @param {Facet[]} resultsFacets
	 */


	function getRefinement(state, type, attributeName, name, resultsFacets) {
	  var facet = find(resultsFacets, function (f) {
	    return f.name === attributeName;
	  });
	  var count = facet && facet.data && facet.data[name] ? facet.data[name] : 0;
	  var exhaustive = facet && facet.exhaustive || false;
	  return {
	    type: type,
	    attributeName: attributeName,
	    name: name,
	    count: count,
	    exhaustive: exhaustive
	  };
	}
	/**
	 * @param {*} state
	 * @param {string} attributeName
	 * @param {*} name
	 * @param {Facet[]} resultsFacets
	 */


	function getHierarchicalRefinement(state, attributeName, name, resultsFacets) {
	  var facetDeclaration = state.getHierarchicalFacetByName(attributeName);

	  var separator = state._getHierarchicalFacetSeparator(facetDeclaration);

	  var split = name.split(separator);
	  var rootFacet = find(resultsFacets, function (facet) {
	    return facet.name === attributeName;
	  });
	  var facet = split.reduce(function (intermediateFacet, part) {
	    var newFacet = intermediateFacet && find(intermediateFacet.data, function (f) {
	      return f.name === part;
	    });
	    return newFacet !== undefined ? newFacet : intermediateFacet;
	  }, rootFacet);
	  var count = facet && facet.count || 0;
	  var exhaustive = facet && facet.exhaustive || false;
	  var path = facet && facet.path || '';
	  return {
	    type: 'hierarchical',
	    attributeName: attributeName,
	    name: path,
	    count: count,
	    exhaustive: exhaustive
	  };
	}

	var SearchResults_1 = SearchResults;

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.
	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}

	var events = EventEmitter; // Backwards-compat with node 0.10.x

	EventEmitter.EventEmitter = EventEmitter;
	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined; // By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.

	EventEmitter.defaultMaxListeners = 10; // Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.

	EventEmitter.prototype.setMaxListeners = function (n) {
	  if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};

	EventEmitter.prototype.emit = function (type) {
	  var er, handler, len, args, i, listeners;
	  if (!this._events) this._events = {}; // If there is no 'error' event listener then throw.

	  if (type === 'error') {
	    if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
	      er = arguments[1];

	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      } else {
	        // At least give some kind of context to the user
	        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
	        err.context = er;
	        throw err;
	      }
	    }
	  }

	  handler = this._events[type];
	  if (isUndefined(handler)) return false;

	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;

	      case 2:
	        handler.call(this, arguments[1]);
	        break;

	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower

	      default:
	        args = Array.prototype.slice.call(arguments, 1);
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    args = Array.prototype.slice.call(arguments, 1);
	    listeners = handler.slice();
	    len = listeners.length;

	    for (i = 0; i < len; i++) listeners[i].apply(this, args);
	  }

	  return true;
	};

	EventEmitter.prototype.addListener = function (type, listener) {
	  var m;
	  if (!isFunction(listener)) throw TypeError('listener must be a function');
	  if (!this._events) this._events = {}; // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".

	  if (this._events.newListener) this.emit('newListener', type, isFunction(listener.listener) ? listener.listener : listener);
	  if (!this._events[type]) // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;else if (isObject(this._events[type])) // If we've already got an array, just append.
	    this._events[type].push(listener);else // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener]; // Check for listener leak

	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }

	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' + 'leak detected. %d listeners added. ' + 'Use emitter.setMaxListeners() to increase limit.', this._events[type].length);

	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }

	  return this;
	};

	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

	EventEmitter.prototype.once = function (type, listener) {
	  if (!isFunction(listener)) throw TypeError('listener must be a function');
	  var fired = false;

	  function g() {
	    this.removeListener(type, g);

	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }

	  g.listener = listener;
	  this.on(type, g);
	  return this;
	}; // emits a 'removeListener' event iff the listener was removed


	EventEmitter.prototype.removeListener = function (type, listener) {
	  var list, position, length, i;
	  if (!isFunction(listener)) throw TypeError('listener must be a function');
	  if (!this._events || !this._events[type]) return this;
	  list = this._events[type];
	  length = list.length;
	  position = -1;

	  if (list === listener || isFunction(list.listener) && list.listener === listener) {
	    delete this._events[type];
	    if (this._events.removeListener) this.emit('removeListener', type, listener);
	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener || list[i].listener && list[i].listener === listener) {
	        position = i;
	        break;
	      }
	    }

	    if (position < 0) return this;

	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }

	    if (this._events.removeListener) this.emit('removeListener', type, listener);
	  }

	  return this;
	};

	EventEmitter.prototype.removeAllListeners = function (type) {
	  var key, listeners;
	  if (!this._events) return this; // not listening for removeListener, no need to emit

	  if (!this._events.removeListener) {
	    if (arguments.length === 0) this._events = {};else if (this._events[type]) delete this._events[type];
	    return this;
	  } // emit removeListener for all listeners on all events


	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }

	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }

	  listeners = this._events[type];

	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else if (listeners) {
	    // LIFO order
	    while (listeners.length) this.removeListener(type, listeners[listeners.length - 1]);
	  }

	  delete this._events[type];
	  return this;
	};

	EventEmitter.prototype.listeners = function (type) {
	  var ret;
	  if (!this._events || !this._events[type]) ret = [];else if (isFunction(this._events[type])) ret = [this._events[type]];else ret = this._events[type].slice();
	  return ret;
	};

	EventEmitter.prototype.listenerCount = function (type) {
	  if (this._events) {
	    var evlistener = this._events[type];
	    if (isFunction(evlistener)) return 1;else if (evlistener) return evlistener.length;
	  }

	  return 0;
	};

	EventEmitter.listenerCount = function (emitter, type) {
	  return emitter.listenerCount(type);
	};

	function isFunction(arg) {
	  return typeof arg === 'function';
	}

	function isNumber(arg) {
	  return typeof arg === 'number';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isUndefined(arg) {
	  return arg === void 0;
	}

	function inherits(ctor, superCtor) {
	  ctor.prototype = Object.create(superCtor.prototype, {
	    constructor: {
	      value: ctor,
	      enumerable: false,
	      writable: true,
	      configurable: true
	    }
	  });
	}

	var inherits_1 = inherits;

	/**
	 * A DerivedHelper is a way to create sub requests to
	 * Algolia from a main helper.
	 * @class
	 * @classdesc The DerivedHelper provides an event based interface for search callbacks:
	 *  - search: when a search is triggered using the `search()` method.
	 *  - result: when the response is retrieved from Algolia and is processed.
	 *    This event contains a {@link SearchResults} object and the
	 *    {@link SearchParameters} corresponding to this answer.
	 */


	function DerivedHelper(mainHelper, fn) {
	  this.main = mainHelper;
	  this.fn = fn;
	  this.lastResults = null;
	}

	inherits_1(DerivedHelper, events.EventEmitter);
	/**
	 * Detach this helper from the main helper
	 * @return {undefined}
	 * @throws Error if the derived helper is already detached
	 */

	DerivedHelper.prototype.detach = function () {
	  this.removeAllListeners();
	  this.main.detachDerivedHelper(this);
	};

	DerivedHelper.prototype.getModifiedState = function (parameters) {
	  return this.fn(parameters);
	};

	var DerivedHelper_1 = DerivedHelper;

	var requestBuilder = {
	  /**
	   * Get all the queries to send to the client, those queries can used directly
	   * with the Algolia client.
	   * @private
	   * @return {object[]} The queries
	   */
	  _getQueries: function getQueries(index, state) {
	    var queries = []; // One query for the hits

	    queries.push({
	      indexName: index,
	      params: requestBuilder._getHitsSearchParams(state)
	    }); // One for each disjunctive facets

	    state.getRefinedDisjunctiveFacets().forEach(function (refinedFacet) {
	      queries.push({
	        indexName: index,
	        params: requestBuilder._getDisjunctiveFacetSearchParams(state, refinedFacet)
	      });
	    }); // maybe more to get the root level of hierarchical facets when activated

	    state.getRefinedHierarchicalFacets().forEach(function (refinedFacet) {
	      var hierarchicalFacet = state.getHierarchicalFacetByName(refinedFacet);
	      var currentRefinement = state.getHierarchicalRefinement(refinedFacet); // if we are deeper than level 0 (starting from `beer > IPA`)
	      // we want to get the root values

	      var separator = state._getHierarchicalFacetSeparator(hierarchicalFacet);

	      if (currentRefinement.length > 0 && currentRefinement[0].split(separator).length > 1) {
	        queries.push({
	          indexName: index,
	          params: requestBuilder._getDisjunctiveFacetSearchParams(state, refinedFacet, true)
	        });
	      }
	    });
	    return queries;
	  },

	  /**
	   * Build search parameters used to fetch hits
	   * @private
	   * @return {object.<string, any>}
	   */
	  _getHitsSearchParams: function (state) {
	    var facets = state.facets.concat(state.disjunctiveFacets).concat(requestBuilder._getHitsHierarchicalFacetsAttributes(state));

	    var facetFilters = requestBuilder._getFacetFilters(state);

	    var numericFilters = requestBuilder._getNumericFilters(state);

	    var tagFilters = requestBuilder._getTagFilters(state);

	    var additionalParams = {
	      facets: facets,
	      tagFilters: tagFilters
	    };

	    if (facetFilters.length > 0) {
	      additionalParams.facetFilters = facetFilters;
	    }

	    if (numericFilters.length > 0) {
	      additionalParams.numericFilters = numericFilters;
	    }

	    return merge_1({}, state.getQueryParams(), additionalParams);
	  },

	  /**
	   * Build search parameters used to fetch a disjunctive facet
	   * @private
	   * @param  {string} facet the associated facet name
	   * @param  {boolean} hierarchicalRootLevel ?? FIXME
	   * @return {object}
	   */
	  _getDisjunctiveFacetSearchParams: function (state, facet, hierarchicalRootLevel) {
	    var facetFilters = requestBuilder._getFacetFilters(state, facet, hierarchicalRootLevel);

	    var numericFilters = requestBuilder._getNumericFilters(state, facet);

	    var tagFilters = requestBuilder._getTagFilters(state);

	    var additionalParams = {
	      hitsPerPage: 1,
	      page: 0,
	      attributesToRetrieve: [],
	      attributesToHighlight: [],
	      attributesToSnippet: [],
	      tagFilters: tagFilters,
	      analytics: false,
	      clickAnalytics: false
	    };
	    var hierarchicalFacet = state.getHierarchicalFacetByName(facet);

	    if (hierarchicalFacet) {
	      additionalParams.facets = requestBuilder._getDisjunctiveHierarchicalFacetAttribute(state, hierarchicalFacet, hierarchicalRootLevel);
	    } else {
	      additionalParams.facets = facet;
	    }

	    if (numericFilters.length > 0) {
	      additionalParams.numericFilters = numericFilters;
	    }

	    if (facetFilters.length > 0) {
	      additionalParams.facetFilters = facetFilters;
	    }

	    return merge_1({}, state.getQueryParams(), additionalParams);
	  },

	  /**
	   * Return the numeric filters in an algolia request fashion
	   * @private
	   * @param {string} [facetName] the name of the attribute for which the filters should be excluded
	   * @return {string[]} the numeric filters in the algolia format
	   */
	  _getNumericFilters: function (state, facetName) {
	    if (state.numericFilters) {
	      return state.numericFilters;
	    }

	    var numericFilters = [];
	    Object.keys(state.numericRefinements).forEach(function (attribute) {
	      var operators = state.numericRefinements[attribute] || {};
	      Object.keys(operators).forEach(function (operator) {
	        var values = operators[operator] || [];

	        if (facetName !== attribute) {
	          values.forEach(function (value) {
	            if (Array.isArray(value)) {
	              var vs = value.map(function (v) {
	                return attribute + operator + v;
	              });
	              numericFilters.push(vs);
	            } else {
	              numericFilters.push(attribute + operator + value);
	            }
	          });
	        }
	      });
	    });
	    return numericFilters;
	  },

	  /**
	   * Return the tags filters depending
	   * @private
	   * @return {string}
	   */
	  _getTagFilters: function (state) {
	    if (state.tagFilters) {
	      return state.tagFilters;
	    }

	    return state.tagRefinements.join(',');
	  },

	  /**
	   * Build facetFilters parameter based on current refinements. The array returned
	   * contains strings representing the facet filters in the algolia format.
	   * @private
	   * @param  {string} [facet] if set, the current disjunctive facet
	   * @return {array.<string>}
	   */
	  _getFacetFilters: function (state, facet, hierarchicalRootLevel) {
	    var facetFilters = [];
	    var facetsRefinements = state.facetsRefinements || {};
	    Object.keys(facetsRefinements).forEach(function (facetName) {
	      var facetValues = facetsRefinements[facetName] || [];
	      facetValues.forEach(function (facetValue) {
	        facetFilters.push(facetName + ':' + facetValue);
	      });
	    });
	    var facetsExcludes = state.facetsExcludes || {};
	    Object.keys(facetsExcludes).forEach(function (facetName) {
	      var facetValues = facetsExcludes[facetName] || [];
	      facetValues.forEach(function (facetValue) {
	        facetFilters.push(facetName + ':-' + facetValue);
	      });
	    });
	    var disjunctiveFacetsRefinements = state.disjunctiveFacetsRefinements || {};
	    Object.keys(disjunctiveFacetsRefinements).forEach(function (facetName) {
	      var facetValues = disjunctiveFacetsRefinements[facetName] || [];

	      if (facetName === facet || !facetValues || facetValues.length === 0) {
	        return;
	      }

	      var orFilters = [];
	      facetValues.forEach(function (facetValue) {
	        orFilters.push(facetName + ':' + facetValue);
	      });
	      facetFilters.push(orFilters);
	    });
	    var hierarchicalFacetsRefinements = state.hierarchicalFacetsRefinements || {};
	    Object.keys(hierarchicalFacetsRefinements).forEach(function (facetName) {
	      var facetValues = hierarchicalFacetsRefinements[facetName] || [];
	      var facetValue = facetValues[0];

	      if (facetValue === undefined) {
	        return;
	      }

	      var hierarchicalFacet = state.getHierarchicalFacetByName(facetName);

	      var separator = state._getHierarchicalFacetSeparator(hierarchicalFacet);

	      var rootPath = state._getHierarchicalRootPath(hierarchicalFacet);

	      var attributeToRefine;
	      var attributesIndex; // we ask for parent facet values only when the `facet` is the current hierarchical facet

	      if (facet === facetName) {
	        // if we are at the root level already, no need to ask for facet values, we get them from
	        // the hits query
	        if (facetValue.indexOf(separator) === -1 || !rootPath && hierarchicalRootLevel === true || rootPath && rootPath.split(separator).length === facetValue.split(separator).length) {
	          return;
	        }

	        if (!rootPath) {
	          attributesIndex = facetValue.split(separator).length - 2;
	          facetValue = facetValue.slice(0, facetValue.lastIndexOf(separator));
	        } else {
	          attributesIndex = rootPath.split(separator).length - 1;
	          facetValue = rootPath;
	        }

	        attributeToRefine = hierarchicalFacet.attributes[attributesIndex];
	      } else {
	        attributesIndex = facetValue.split(separator).length - 1;
	        attributeToRefine = hierarchicalFacet.attributes[attributesIndex];
	      }

	      if (attributeToRefine) {
	        facetFilters.push([attributeToRefine + ':' + facetValue]);
	      }
	    });
	    return facetFilters;
	  },
	  _getHitsHierarchicalFacetsAttributes: function (state) {
	    var out = [];
	    return state.hierarchicalFacets.reduce( // ask for as much levels as there's hierarchical refinements
	    function getHitsAttributesForHierarchicalFacet(allAttributes, hierarchicalFacet) {
	      var hierarchicalRefinement = state.getHierarchicalRefinement(hierarchicalFacet.name)[0]; // if no refinement, ask for root level

	      if (!hierarchicalRefinement) {
	        allAttributes.push(hierarchicalFacet.attributes[0]);
	        return allAttributes;
	      }

	      var separator = state._getHierarchicalFacetSeparator(hierarchicalFacet);

	      var level = hierarchicalRefinement.split(separator).length;
	      var newAttributes = hierarchicalFacet.attributes.slice(0, level + 1);
	      return allAttributes.concat(newAttributes);
	    }, out);
	  },
	  _getDisjunctiveHierarchicalFacetAttribute: function (state, hierarchicalFacet, rootLevel) {
	    var separator = state._getHierarchicalFacetSeparator(hierarchicalFacet);

	    if (rootLevel === true) {
	      var rootPath = state._getHierarchicalRootPath(hierarchicalFacet);

	      var attributeIndex = 0;

	      if (rootPath) {
	        attributeIndex = rootPath.split(separator).length;
	      }

	      return [hierarchicalFacet.attributes[attributeIndex]];
	    }

	    var hierarchicalRefinement = state.getHierarchicalRefinement(hierarchicalFacet.name)[0] || ''; // if refinement is 'beers > IPA > Flying dog',
	    // then we want `facets: ['beers > IPA']` as disjunctive facet (parent level values)

	    var parentLevel = hierarchicalRefinement.split(separator).length - 1;
	    return hierarchicalFacet.attributes.slice(0, parentLevel + 1);
	  },
	  getSearchForFacetQuery: function (facetName, query, maxFacetHits, state) {
	    var stateForSearchForFacetValues = state.isDisjunctiveFacet(facetName) ? state.clearRefinements(facetName) : state;
	    var searchForFacetSearchParameters = {
	      facetQuery: query,
	      facetName: facetName
	    };

	    if (typeof maxFacetHits === 'number') {
	      searchForFacetSearchParameters.maxFacetHits = maxFacetHits;
	    }

	    return merge_1({}, requestBuilder._getHitsSearchParams(stateForSearchForFacetValues), searchForFacetSearchParameters);
	  }
	};
	var requestBuilder_1 = requestBuilder;

	var version = '3.3.4';

	/**
	 * Event triggered when a parameter is set or updated
	 * @event AlgoliaSearchHelper#event:change
	 * @property {object} event
	 * @property {SearchParameters} event.state the current parameters with the latest changes applied
	 * @property {SearchResults} event.results the previous results received from Algolia. `null` before the first request
	 * @example
	 * helper.on('change', function(event) {
	 *   console.log('The parameters have changed');
	 * });
	 */

	/**
	 * Event triggered when a main search is sent to Algolia
	 * @event AlgoliaSearchHelper#event:search
	 * @property {object} event
	 * @property {SearchParameters} event.state the parameters used for this search
	 * @property {SearchResults} event.results the results from the previous search. `null` if it is the first search.
	 * @example
	 * helper.on('search', function(event) {
	 *   console.log('Search sent');
	 * });
	 */

	/**
	 * Event triggered when a search using `searchForFacetValues` is sent to Algolia
	 * @event AlgoliaSearchHelper#event:searchForFacetValues
	 * @property {object} event
	 * @property {SearchParameters} event.state the parameters used for this search it is the first search.
	 * @property {string} event.facet the facet searched into
	 * @property {string} event.query the query used to search in the facets
	 * @example
	 * helper.on('searchForFacetValues', function(event) {
	 *   console.log('searchForFacetValues sent');
	 * });
	 */

	/**
	 * Event triggered when a search using `searchOnce` is sent to Algolia
	 * @event AlgoliaSearchHelper#event:searchOnce
	 * @property {object} event
	 * @property {SearchParameters} event.state the parameters used for this search it is the first search.
	 * @example
	 * helper.on('searchOnce', function(event) {
	 *   console.log('searchOnce sent');
	 * });
	 */

	/**
	 * Event triggered when the results are retrieved from Algolia
	 * @event AlgoliaSearchHelper#event:result
	 * @property {object} event
	 * @property {SearchResults} event.results the results received from Algolia
	 * @property {SearchParameters} event.state the parameters used to query Algolia. Those might be different from the one in the helper instance (for example if the network is unreliable).
	 * @example
	 * helper.on('result', function(event) {
	 *   console.log('Search results received');
	 * });
	 */

	/**
	 * Event triggered when Algolia sends back an error. For example, if an unknown parameter is
	 * used, the error can be caught using this event.
	 * @event AlgoliaSearchHelper#event:error
	 * @property {object} event
	 * @property {Error} event.error the error returned by the Algolia.
	 * @example
	 * helper.on('error', function(event) {
	 *   console.log('Houston we got a problem.');
	 * });
	 */

	/**
	 * Event triggered when the queue of queries have been depleted (with any result or outdated queries)
	 * @event AlgoliaSearchHelper#event:searchQueueEmpty
	 * @example
	 * helper.on('searchQueueEmpty', function() {
	 *   console.log('No more search pending');
	 *   // This is received before the result event if we're not expecting new results
	 * });
	 *
	 * helper.search();
	 */

	/**
	 * Initialize a new AlgoliaSearchHelper
	 * @class
	 * @classdesc The AlgoliaSearchHelper is a class that ease the management of the
	 * search. It provides an event based interface for search callbacks:
	 *  - change: when the internal search state is changed.
	 *    This event contains a {@link SearchParameters} object and the
	 *    {@link SearchResults} of the last result if any.
	 *  - search: when a search is triggered using the `search()` method.
	 *  - result: when the response is retrieved from Algolia and is processed.
	 *    This event contains a {@link SearchResults} object and the
	 *    {@link SearchParameters} corresponding to this answer.
	 *  - error: when the response is an error. This event contains the error returned by the server.
	 * @param  {AlgoliaSearch} client an AlgoliaSearch client
	 * @param  {string} index the index name to query
	 * @param  {SearchParameters | object} options an object defining the initial
	 * config of the search. It doesn't have to be a {SearchParameters},
	 * just an object containing the properties you need from it.
	 */


	function AlgoliaSearchHelper(client, index, options) {
	  if (typeof client.addAlgoliaAgent === 'function') {
	    client.addAlgoliaAgent('JS Helper (' + version + ')');
	  }

	  this.setClient(client);
	  var opts = options || {};
	  opts.index = index;
	  this.state = SearchParameters_1.make(opts);
	  this.lastResults = null;
	  this._queryId = 0;
	  this._lastQueryIdReceived = -1;
	  this.derivedHelpers = [];
	  this._currentNbQueries = 0;
	}

	inherits_1(AlgoliaSearchHelper, events.EventEmitter);
	/**
	 * Start the search with the parameters set in the state. When the
	 * method is called, it triggers a `search` event. The results will
	 * be available through the `result` event. If an error occurs, an
	 * `error` will be fired instead.
	 * @return {AlgoliaSearchHelper}
	 * @fires search
	 * @fires result
	 * @fires error
	 * @chainable
	 */

	AlgoliaSearchHelper.prototype.search = function () {
	  this._search({
	    onlyWithDerivedHelpers: false
	  });

	  return this;
	};

	AlgoliaSearchHelper.prototype.searchOnlyWithDerivedHelpers = function () {
	  this._search({
	    onlyWithDerivedHelpers: true
	  });

	  return this;
	};
	/**
	 * Gets the search query parameters that would be sent to the Algolia Client
	 * for the hits
	 * @return {object} Query Parameters
	 */


	AlgoliaSearchHelper.prototype.getQuery = function () {
	  var state = this.state;
	  return requestBuilder_1._getHitsSearchParams(state);
	};
	/**
	 * Start a search using a modified version of the current state. This method does
	 * not trigger the helper lifecycle and does not modify the state kept internally
	 * by the helper. This second aspect means that the next search call will be the
	 * same as a search call before calling searchOnce.
	 * @param {object} options can contain all the parameters that can be set to SearchParameters
	 * plus the index
	 * @param {function} [callback] optional callback executed when the response from the
	 * server is back.
	 * @return {promise|undefined} if a callback is passed the method returns undefined
	 * otherwise it returns a promise containing an object with two keys :
	 *  - content with a SearchResults
	 *  - state with the state used for the query as a SearchParameters
	 * @example
	 * // Changing the number of records returned per page to 1
	 * // This example uses the callback API
	 * var state = helper.searchOnce({hitsPerPage: 1},
	 *   function(error, content, state) {
	 *     // if an error occurred it will be passed in error, otherwise its value is null
	 *     // content contains the results formatted as a SearchResults
	 *     // state is the instance of SearchParameters used for this search
	 *   });
	 * @example
	 * // Changing the number of records returned per page to 1
	 * // This example uses the promise API
	 * var state1 = helper.searchOnce({hitsPerPage: 1})
	 *                 .then(promiseHandler);
	 *
	 * function promiseHandler(res) {
	 *   // res contains
	 *   // {
	 *   //   content : SearchResults
	 *   //   state   : SearchParameters (the one used for this specific search)
	 *   // }
	 * }
	 */


	AlgoliaSearchHelper.prototype.searchOnce = function (options, cb) {
	  var tempState = !options ? this.state : this.state.setQueryParameters(options);

	  var queries = requestBuilder_1._getQueries(tempState.index, tempState);

	  var self = this;
	  this._currentNbQueries++;
	  this.emit('searchOnce', {
	    state: tempState
	  });

	  if (cb) {
	    this.client.search(queries).then(function (content) {
	      self._currentNbQueries--;

	      if (self._currentNbQueries === 0) {
	        self.emit('searchQueueEmpty');
	      }

	      cb(null, new SearchResults_1(tempState, content.results), tempState);
	    }).catch(function (err) {
	      self._currentNbQueries--;

	      if (self._currentNbQueries === 0) {
	        self.emit('searchQueueEmpty');
	      }

	      cb(err, null, tempState);
	    });
	    return undefined;
	  }

	  return this.client.search(queries).then(function (content) {
	    self._currentNbQueries--;
	    if (self._currentNbQueries === 0) self.emit('searchQueueEmpty');
	    return {
	      content: new SearchResults_1(tempState, content.results),
	      state: tempState,
	      _originalResponse: content
	    };
	  }, function (e) {
	    self._currentNbQueries--;
	    if (self._currentNbQueries === 0) self.emit('searchQueueEmpty');
	    throw e;
	  });
	};
	/**
	 * Structure of each result when using
	 * [`searchForFacetValues()`](reference.html#AlgoliaSearchHelper#searchForFacetValues)
	 * @typedef FacetSearchHit
	 * @type {object}
	 * @property {string} value the facet value
	 * @property {string} highlighted the facet value highlighted with the query string
	 * @property {number} count number of occurrence of this facet value
	 * @property {boolean} isRefined true if the value is already refined
	 */

	/**
	 * Structure of the data resolved by the
	 * [`searchForFacetValues()`](reference.html#AlgoliaSearchHelper#searchForFacetValues)
	 * promise.
	 * @typedef FacetSearchResult
	 * @type {object}
	 * @property {FacetSearchHit} facetHits the results for this search for facet values
	 * @property {number} processingTimeMS time taken by the query inside the engine
	 */

	/**
	 * Search for facet values based on an query and the name of a faceted attribute. This
	 * triggers a search and will return a promise. On top of using the query, it also sends
	 * the parameters from the state so that the search is narrowed down to only the possible values.
	 *
	 * See the description of [FacetSearchResult](reference.html#FacetSearchResult)
	 * @param {string} facet the name of the faceted attribute
	 * @param {string} query the string query for the search
	 * @param {number} [maxFacetHits] the maximum number values returned. Should be > 0 and <= 100
	 * @param {object} [userState] the set of custom parameters to use on top of the current state. Setting a property to `undefined` removes
	 * it in the generated query.
	 * @return {promise.<FacetSearchResult>} the results of the search
	 */


	AlgoliaSearchHelper.prototype.searchForFacetValues = function (facet, query, maxFacetHits, userState) {
	  var clientHasSFFV = typeof this.client.searchForFacetValues === 'function';

	  if (!clientHasSFFV && typeof this.client.initIndex !== 'function') {
	    throw new Error('search for facet values (searchable) was called, but this client does not have a function client.searchForFacetValues or client.initIndex(index).searchForFacetValues');
	  }

	  var state = this.state.setQueryParameters(userState || {});
	  var isDisjunctive = state.isDisjunctiveFacet(facet);
	  var algoliaQuery = requestBuilder_1.getSearchForFacetQuery(facet, query, maxFacetHits, state);
	  this._currentNbQueries++;
	  var self = this;
	  this.emit('searchForFacetValues', {
	    state: state,
	    facet: facet,
	    query: query
	  });
	  var searchForFacetValuesPromise = clientHasSFFV ? this.client.searchForFacetValues([{
	    indexName: state.index,
	    params: algoliaQuery
	  }]) : this.client.initIndex(state.index).searchForFacetValues(algoliaQuery);
	  return searchForFacetValuesPromise.then(function addIsRefined(content) {
	    self._currentNbQueries--;
	    if (self._currentNbQueries === 0) self.emit('searchQueueEmpty');
	    content = Array.isArray(content) ? content[0] : content;
	    content.facetHits.forEach(function (f) {
	      f.isRefined = isDisjunctive ? state.isDisjunctiveFacetRefined(facet, f.value) : state.isFacetRefined(facet, f.value);
	    });
	    return content;
	  }, function (e) {
	    self._currentNbQueries--;
	    if (self._currentNbQueries === 0) self.emit('searchQueueEmpty');
	    throw e;
	  });
	};
	/**
	 * Sets the text query used for the search.
	 *
	 * This method resets the current page to 0.
	 * @param  {string} q the user query
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.setQuery = function (q) {
	  this._change({
	    state: this.state.resetPage().setQuery(q),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * Remove all the types of refinements except tags. A string can be provided to remove
	 * only the refinements of a specific attribute. For more advanced use case, you can
	 * provide a function instead. This function should follow the
	 * [clearCallback definition](#SearchParameters.clearCallback).
	 *
	 * This method resets the current page to 0.
	 * @param {string} [name] optional name of the facet / attribute on which we want to remove all refinements
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 * @example
	 * // Removing all the refinements
	 * helper.clearRefinements().search();
	 * @example
	 * // Removing all the filters on a the category attribute.
	 * helper.clearRefinements('category').search();
	 * @example
	 * // Removing only the exclude filters on the category facet.
	 * helper.clearRefinements(function(value, attribute, type) {
	 *   return type === 'exclude' && attribute === 'category';
	 * }).search();
	 */


	AlgoliaSearchHelper.prototype.clearRefinements = function (name) {
	  this._change({
	    state: this.state.resetPage().clearRefinements(name),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * Remove all the tag filters.
	 *
	 * This method resets the current page to 0.
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.clearTags = function () {
	  this._change({
	    state: this.state.resetPage().clearTags(),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * Adds a disjunctive filter to a faceted attribute with the `value` provided. If the
	 * filter is already set, it doesn't change the filters.
	 *
	 * This method resets the current page to 0.
	 * @param  {string} facet the facet to refine
	 * @param  {string} value the associated value (will be converted to string)
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.addDisjunctiveFacetRefinement = function (facet, value) {
	  this._change({
	    state: this.state.resetPage().addDisjunctiveFacetRefinement(facet, value),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * @deprecated since version 2.4.0, see {@link AlgoliaSearchHelper#addDisjunctiveFacetRefinement}
	 */


	AlgoliaSearchHelper.prototype.addDisjunctiveRefine = function () {
	  return this.addDisjunctiveFacetRefinement.apply(this, arguments);
	};
	/**
	 * Adds a refinement on a hierarchical facet. It will throw
	 * an exception if the facet is not defined or if the facet
	 * is already refined.
	 *
	 * This method resets the current page to 0.
	 * @param {string} facet the facet name
	 * @param {string} path the hierarchical facet path
	 * @return {AlgoliaSearchHelper}
	 * @throws Error if the facet is not defined or if the facet is refined
	 * @chainable
	 * @fires change
	 */


	AlgoliaSearchHelper.prototype.addHierarchicalFacetRefinement = function (facet, value) {
	  this._change({
	    state: this.state.resetPage().addHierarchicalFacetRefinement(facet, value),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * Adds a an numeric filter to an attribute with the `operator` and `value` provided. If the
	 * filter is already set, it doesn't change the filters.
	 *
	 * This method resets the current page to 0.
	 * @param  {string} attribute the attribute on which the numeric filter applies
	 * @param  {string} operator the operator of the filter
	 * @param  {number} value the value of the filter
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.addNumericRefinement = function (attribute, operator, value) {
	  this._change({
	    state: this.state.resetPage().addNumericRefinement(attribute, operator, value),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * Adds a filter to a faceted attribute with the `value` provided. If the
	 * filter is already set, it doesn't change the filters.
	 *
	 * This method resets the current page to 0.
	 * @param  {string} facet the facet to refine
	 * @param  {string} value the associated value (will be converted to string)
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.addFacetRefinement = function (facet, value) {
	  this._change({
	    state: this.state.resetPage().addFacetRefinement(facet, value),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * @deprecated since version 2.4.0, see {@link AlgoliaSearchHelper#addFacetRefinement}
	 */


	AlgoliaSearchHelper.prototype.addRefine = function () {
	  return this.addFacetRefinement.apply(this, arguments);
	};
	/**
	 * Adds a an exclusion filter to a faceted attribute with the `value` provided. If the
	 * filter is already set, it doesn't change the filters.
	 *
	 * This method resets the current page to 0.
	 * @param  {string} facet the facet to refine
	 * @param  {string} value the associated value (will be converted to string)
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.addFacetExclusion = function (facet, value) {
	  this._change({
	    state: this.state.resetPage().addExcludeRefinement(facet, value),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * @deprecated since version 2.4.0, see {@link AlgoliaSearchHelper#addFacetExclusion}
	 */


	AlgoliaSearchHelper.prototype.addExclude = function () {
	  return this.addFacetExclusion.apply(this, arguments);
	};
	/**
	 * Adds a tag filter with the `tag` provided. If the
	 * filter is already set, it doesn't change the filters.
	 *
	 * This method resets the current page to 0.
	 * @param {string} tag the tag to add to the filter
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.addTag = function (tag) {
	  this._change({
	    state: this.state.resetPage().addTagRefinement(tag),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * Removes an numeric filter to an attribute with the `operator` and `value` provided. If the
	 * filter is not set, it doesn't change the filters.
	 *
	 * Some parameters are optional, triggering different behavior:
	 *  - if the value is not provided, then all the numeric value will be removed for the
	 *  specified attribute/operator couple.
	 *  - if the operator is not provided either, then all the numeric filter on this attribute
	 *  will be removed.
	 *
	 * This method resets the current page to 0.
	 * @param  {string} attribute the attribute on which the numeric filter applies
	 * @param  {string} [operator] the operator of the filter
	 * @param  {number} [value] the value of the filter
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.removeNumericRefinement = function (attribute, operator, value) {
	  this._change({
	    state: this.state.resetPage().removeNumericRefinement(attribute, operator, value),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * Removes a disjunctive filter to a faceted attribute with the `value` provided. If the
	 * filter is not set, it doesn't change the filters.
	 *
	 * If the value is omitted, then this method will remove all the filters for the
	 * attribute.
	 *
	 * This method resets the current page to 0.
	 * @param  {string} facet the facet to refine
	 * @param  {string} [value] the associated value
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.removeDisjunctiveFacetRefinement = function (facet, value) {
	  this._change({
	    state: this.state.resetPage().removeDisjunctiveFacetRefinement(facet, value),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * @deprecated since version 2.4.0, see {@link AlgoliaSearchHelper#removeDisjunctiveFacetRefinement}
	 */


	AlgoliaSearchHelper.prototype.removeDisjunctiveRefine = function () {
	  return this.removeDisjunctiveFacetRefinement.apply(this, arguments);
	};
	/**
	 * Removes the refinement set on a hierarchical facet.
	 * @param {string} facet the facet name
	 * @return {AlgoliaSearchHelper}
	 * @throws Error if the facet is not defined or if the facet is not refined
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.removeHierarchicalFacetRefinement = function (facet) {
	  this._change({
	    state: this.state.resetPage().removeHierarchicalFacetRefinement(facet),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * Removes a filter to a faceted attribute with the `value` provided. If the
	 * filter is not set, it doesn't change the filters.
	 *
	 * If the value is omitted, then this method will remove all the filters for the
	 * attribute.
	 *
	 * This method resets the current page to 0.
	 * @param  {string} facet the facet to refine
	 * @param  {string} [value] the associated value
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.removeFacetRefinement = function (facet, value) {
	  this._change({
	    state: this.state.resetPage().removeFacetRefinement(facet, value),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * @deprecated since version 2.4.0, see {@link AlgoliaSearchHelper#removeFacetRefinement}
	 */


	AlgoliaSearchHelper.prototype.removeRefine = function () {
	  return this.removeFacetRefinement.apply(this, arguments);
	};
	/**
	 * Removes an exclusion filter to a faceted attribute with the `value` provided. If the
	 * filter is not set, it doesn't change the filters.
	 *
	 * If the value is omitted, then this method will remove all the filters for the
	 * attribute.
	 *
	 * This method resets the current page to 0.
	 * @param  {string} facet the facet to refine
	 * @param  {string} [value] the associated value
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.removeFacetExclusion = function (facet, value) {
	  this._change({
	    state: this.state.resetPage().removeExcludeRefinement(facet, value),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * @deprecated since version 2.4.0, see {@link AlgoliaSearchHelper#removeFacetExclusion}
	 */


	AlgoliaSearchHelper.prototype.removeExclude = function () {
	  return this.removeFacetExclusion.apply(this, arguments);
	};
	/**
	 * Removes a tag filter with the `tag` provided. If the
	 * filter is not set, it doesn't change the filters.
	 *
	 * This method resets the current page to 0.
	 * @param {string} tag tag to remove from the filter
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.removeTag = function (tag) {
	  this._change({
	    state: this.state.resetPage().removeTagRefinement(tag),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * Adds or removes an exclusion filter to a faceted attribute with the `value` provided. If
	 * the value is set then it removes it, otherwise it adds the filter.
	 *
	 * This method resets the current page to 0.
	 * @param  {string} facet the facet to refine
	 * @param  {string} value the associated value
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.toggleFacetExclusion = function (facet, value) {
	  this._change({
	    state: this.state.resetPage().toggleExcludeFacetRefinement(facet, value),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * @deprecated since version 2.4.0, see {@link AlgoliaSearchHelper#toggleFacetExclusion}
	 */


	AlgoliaSearchHelper.prototype.toggleExclude = function () {
	  return this.toggleFacetExclusion.apply(this, arguments);
	};
	/**
	 * Adds or removes a filter to a faceted attribute with the `value` provided. If
	 * the value is set then it removes it, otherwise it adds the filter.
	 *
	 * This method can be used for conjunctive, disjunctive and hierarchical filters.
	 *
	 * This method resets the current page to 0.
	 * @param  {string} facet the facet to refine
	 * @param  {string} value the associated value
	 * @return {AlgoliaSearchHelper}
	 * @throws Error will throw an error if the facet is not declared in the settings of the helper
	 * @fires change
	 * @chainable
	 * @deprecated since version 2.19.0, see {@link AlgoliaSearchHelper#toggleFacetRefinement}
	 */


	AlgoliaSearchHelper.prototype.toggleRefinement = function (facet, value) {
	  return this.toggleFacetRefinement(facet, value);
	};
	/**
	 * Adds or removes a filter to a faceted attribute with the `value` provided. If
	 * the value is set then it removes it, otherwise it adds the filter.
	 *
	 * This method can be used for conjunctive, disjunctive and hierarchical filters.
	 *
	 * This method resets the current page to 0.
	 * @param  {string} facet the facet to refine
	 * @param  {string} value the associated value
	 * @return {AlgoliaSearchHelper}
	 * @throws Error will throw an error if the facet is not declared in the settings of the helper
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.toggleFacetRefinement = function (facet, value) {
	  this._change({
	    state: this.state.resetPage().toggleFacetRefinement(facet, value),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * @deprecated since version 2.4.0, see {@link AlgoliaSearchHelper#toggleFacetRefinement}
	 */


	AlgoliaSearchHelper.prototype.toggleRefine = function () {
	  return this.toggleFacetRefinement.apply(this, arguments);
	};
	/**
	 * Adds or removes a tag filter with the `value` provided. If
	 * the value is set then it removes it, otherwise it adds the filter.
	 *
	 * This method resets the current page to 0.
	 * @param {string} tag tag to remove or add
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.toggleTag = function (tag) {
	  this._change({
	    state: this.state.resetPage().toggleTagRefinement(tag),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * Increments the page number by one.
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 * @example
	 * helper.setPage(0).nextPage().getPage();
	 * // returns 1
	 */


	AlgoliaSearchHelper.prototype.nextPage = function () {
	  var page = this.state.page || 0;
	  return this.setPage(page + 1);
	};
	/**
	 * Decrements the page number by one.
	 * @fires change
	 * @return {AlgoliaSearchHelper}
	 * @chainable
	 * @example
	 * helper.setPage(1).previousPage().getPage();
	 * // returns 0
	 */


	AlgoliaSearchHelper.prototype.previousPage = function () {
	  var page = this.state.page || 0;
	  return this.setPage(page - 1);
	};
	/**
	 * @private
	 */


	function setCurrentPage(page) {
	  if (page < 0) throw new Error('Page requested below 0.');

	  this._change({
	    state: this.state.setPage(page),
	    isPageReset: false
	  });

	  return this;
	}
	/**
	 * Change the current page
	 * @deprecated
	 * @param  {number} page The page number
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.setCurrentPage = setCurrentPage;
	/**
	 * Updates the current page.
	 * @function
	 * @param  {number} page The page number
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */

	AlgoliaSearchHelper.prototype.setPage = setCurrentPage;
	/**
	 * Updates the name of the index that will be targeted by the query.
	 *
	 * This method resets the current page to 0.
	 * @param {string} name the index name
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */

	AlgoliaSearchHelper.prototype.setIndex = function (name) {
	  this._change({
	    state: this.state.resetPage().setIndex(name),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * Update a parameter of the search. This method reset the page
	 *
	 * The complete list of parameters is available on the
	 * [Algolia website](https://www.algolia.com/doc/rest#query-an-index).
	 * The most commonly used parameters have their own [shortcuts](#query-parameters-shortcuts)
	 * or benefit from higher-level APIs (all the kind of filters and facets have their own API)
	 *
	 * This method resets the current page to 0.
	 * @param {string} parameter name of the parameter to update
	 * @param {any} value new value of the parameter
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 * @example
	 * helper.setQueryParameter('hitsPerPage', 20).search();
	 */


	AlgoliaSearchHelper.prototype.setQueryParameter = function (parameter, value) {
	  this._change({
	    state: this.state.resetPage().setQueryParameter(parameter, value),
	    isPageReset: true
	  });

	  return this;
	};
	/**
	 * Set the whole state (warning: will erase previous state)
	 * @param {SearchParameters} newState the whole new state
	 * @return {AlgoliaSearchHelper}
	 * @fires change
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.setState = function (newState) {
	  this._change({
	    state: SearchParameters_1.make(newState),
	    isPageReset: false
	  });

	  return this;
	};
	/**
	 * Override the current state without triggering a change event.
	 * Do not use this method unless you know what you are doing. (see the example
	 * for a legit use case)
	 * @param {SearchParameters} newState the whole new state
	 * @return {AlgoliaSearchHelper}
	 * @example
	 *  helper.on('change', function(state){
	 *    // In this function you might want to find a way to store the state in the url/history
	 *    updateYourURL(state)
	 *  })
	 *  window.onpopstate = function(event){
	 *    // This is naive though as you should check if the state is really defined etc.
	 *    helper.overrideStateWithoutTriggeringChangeEvent(event.state).search()
	 *  }
	 * @chainable
	 */


	AlgoliaSearchHelper.prototype.overrideStateWithoutTriggeringChangeEvent = function (newState) {
	  this.state = new SearchParameters_1(newState);
	  return this;
	};
	/**
	 * Check if an attribute has any numeric, conjunctive, disjunctive or hierarchical filters.
	 * @param {string} attribute the name of the attribute
	 * @return {boolean} true if the attribute is filtered by at least one value
	 * @example
	 * // hasRefinements works with numeric, conjunctive, disjunctive and hierarchical filters
	 * helper.hasRefinements('price'); // false
	 * helper.addNumericRefinement('price', '>', 100);
	 * helper.hasRefinements('price'); // true
	 *
	 * helper.hasRefinements('color'); // false
	 * helper.addFacetRefinement('color', 'blue');
	 * helper.hasRefinements('color'); // true
	 *
	 * helper.hasRefinements('material'); // false
	 * helper.addDisjunctiveFacetRefinement('material', 'plastic');
	 * helper.hasRefinements('material'); // true
	 *
	 * helper.hasRefinements('categories'); // false
	 * helper.toggleFacetRefinement('categories', 'kitchen > knife');
	 * helper.hasRefinements('categories'); // true
	 *
	 */


	AlgoliaSearchHelper.prototype.hasRefinements = function (attribute) {
	  if (objectHasKeys_1(this.state.getNumericRefinements(attribute))) {
	    return true;
	  } else if (this.state.isConjunctiveFacet(attribute)) {
	    return this.state.isFacetRefined(attribute);
	  } else if (this.state.isDisjunctiveFacet(attribute)) {
	    return this.state.isDisjunctiveFacetRefined(attribute);
	  } else if (this.state.isHierarchicalFacet(attribute)) {
	    return this.state.isHierarchicalFacetRefined(attribute);
	  } // there's currently no way to know that the user did call `addNumericRefinement` at some point
	  // thus we cannot distinguish if there once was a numeric refinement that was cleared
	  // so we will return false in every other situations to be consistent
	  // while what we should do here is throw because we did not find the attribute in any type
	  // of refinement


	  return false;
	};
	/**
	 * Check if a value is excluded for a specific faceted attribute. If the value
	 * is omitted then the function checks if there is any excluding refinements.
	 *
	 * @param  {string}  facet name of the attribute for used for faceting
	 * @param  {string}  [value] optional value. If passed will test that this value
	   * is filtering the given facet.
	 * @return {boolean} true if refined
	 * @example
	 * helper.isExcludeRefined('color'); // false
	 * helper.isExcludeRefined('color', 'blue') // false
	 * helper.isExcludeRefined('color', 'red') // false
	 *
	 * helper.addFacetExclusion('color', 'red');
	 *
	 * helper.isExcludeRefined('color'); // true
	 * helper.isExcludeRefined('color', 'blue') // false
	 * helper.isExcludeRefined('color', 'red') // true
	 */


	AlgoliaSearchHelper.prototype.isExcluded = function (facet, value) {
	  return this.state.isExcludeRefined(facet, value);
	};
	/**
	 * @deprecated since 2.4.0, see {@link AlgoliaSearchHelper#hasRefinements}
	 */


	AlgoliaSearchHelper.prototype.isDisjunctiveRefined = function (facet, value) {
	  return this.state.isDisjunctiveFacetRefined(facet, value);
	};
	/**
	 * Check if the string is a currently filtering tag.
	 * @param {string} tag tag to check
	 * @return {boolean}
	 */


	AlgoliaSearchHelper.prototype.hasTag = function (tag) {
	  return this.state.isTagRefined(tag);
	};
	/**
	 * @deprecated since 2.4.0, see {@link AlgoliaSearchHelper#hasTag}
	 */


	AlgoliaSearchHelper.prototype.isTagRefined = function () {
	  return this.hasTagRefinements.apply(this, arguments);
	};
	/**
	 * Get the name of the currently used index.
	 * @return {string}
	 * @example
	 * helper.setIndex('highestPrice_products').getIndex();
	 * // returns 'highestPrice_products'
	 */


	AlgoliaSearchHelper.prototype.getIndex = function () {
	  return this.state.index;
	};

	function getCurrentPage() {
	  return this.state.page;
	}
	/**
	 * Get the currently selected page
	 * @deprecated
	 * @return {number} the current page
	 */


	AlgoliaSearchHelper.prototype.getCurrentPage = getCurrentPage;
	/**
	 * Get the currently selected page
	 * @function
	 * @return {number} the current page
	 */

	AlgoliaSearchHelper.prototype.getPage = getCurrentPage;
	/**
	 * Get all the tags currently set to filters the results.
	 *
	 * @return {string[]} The list of tags currently set.
	 */

	AlgoliaSearchHelper.prototype.getTags = function () {
	  return this.state.tagRefinements;
	};
	/**
	 * Get the list of refinements for a given attribute. This method works with
	 * conjunctive, disjunctive, excluding and numerical filters.
	 *
	 * See also SearchResults#getRefinements
	 *
	 * @param {string} facetName attribute name used for faceting
	 * @return {Array.<FacetRefinement|NumericRefinement>} All Refinement are objects that contain a value, and
	 * a type. Numeric also contains an operator.
	 * @example
	 * helper.addNumericRefinement('price', '>', 100);
	 * helper.getRefinements('price');
	 * // [
	 * //   {
	 * //     "value": [
	 * //       100
	 * //     ],
	 * //     "operator": ">",
	 * //     "type": "numeric"
	 * //   }
	 * // ]
	 * @example
	 * helper.addFacetRefinement('color', 'blue');
	 * helper.addFacetExclusion('color', 'red');
	 * helper.getRefinements('color');
	 * // [
	 * //   {
	 * //     "value": "blue",
	 * //     "type": "conjunctive"
	 * //   },
	 * //   {
	 * //     "value": "red",
	 * //     "type": "exclude"
	 * //   }
	 * // ]
	 * @example
	 * helper.addDisjunctiveFacetRefinement('material', 'plastic');
	 * // [
	 * //   {
	 * //     "value": "plastic",
	 * //     "type": "disjunctive"
	 * //   }
	 * // ]
	 */


	AlgoliaSearchHelper.prototype.getRefinements = function (facetName) {
	  var refinements = [];

	  if (this.state.isConjunctiveFacet(facetName)) {
	    var conjRefinements = this.state.getConjunctiveRefinements(facetName);
	    conjRefinements.forEach(function (r) {
	      refinements.push({
	        value: r,
	        type: 'conjunctive'
	      });
	    });
	    var excludeRefinements = this.state.getExcludeRefinements(facetName);
	    excludeRefinements.forEach(function (r) {
	      refinements.push({
	        value: r,
	        type: 'exclude'
	      });
	    });
	  } else if (this.state.isDisjunctiveFacet(facetName)) {
	    var disjRefinements = this.state.getDisjunctiveRefinements(facetName);
	    disjRefinements.forEach(function (r) {
	      refinements.push({
	        value: r,
	        type: 'disjunctive'
	      });
	    });
	  }

	  var numericRefinements = this.state.getNumericRefinements(facetName);
	  Object.keys(numericRefinements).forEach(function (operator) {
	    var value = numericRefinements[operator];
	    refinements.push({
	      value: value,
	      operator: operator,
	      type: 'numeric'
	    });
	  });
	  return refinements;
	};
	/**
	 * Return the current refinement for the (attribute, operator)
	 * @param {string} attribute attribute in the record
	 * @param {string} operator operator applied on the refined values
	 * @return {Array.<number|number[]>} refined values
	 */


	AlgoliaSearchHelper.prototype.getNumericRefinement = function (attribute, operator) {
	  return this.state.getNumericRefinement(attribute, operator);
	};
	/**
	 * Get the current breadcrumb for a hierarchical facet, as an array
	 * @param  {string} facetName Hierarchical facet name
	 * @return {array.<string>} the path as an array of string
	 */


	AlgoliaSearchHelper.prototype.getHierarchicalFacetBreadcrumb = function (facetName) {
	  return this.state.getHierarchicalFacetBreadcrumb(facetName);
	}; // /////////// PRIVATE

	/**
	 * Perform the underlying queries
	 * @private
	 * @return {undefined}
	 * @fires search
	 * @fires result
	 * @fires error
	 */


	AlgoliaSearchHelper.prototype._search = function (options) {
	  var state = this.state;
	  var states = [];
	  var mainQueries = [];

	  if (!options.onlyWithDerivedHelpers) {
	    mainQueries = requestBuilder_1._getQueries(state.index, state);
	    states.push({
	      state: state,
	      queriesCount: mainQueries.length,
	      helper: this
	    });
	    this.emit('search', {
	      state: state,
	      results: this.lastResults
	    });
	  }

	  var derivedQueries = this.derivedHelpers.map(function (derivedHelper) {
	    var derivedState = derivedHelper.getModifiedState(state);

	    var derivedStateQueries = requestBuilder_1._getQueries(derivedState.index, derivedState);

	    states.push({
	      state: derivedState,
	      queriesCount: derivedStateQueries.length,
	      helper: derivedHelper
	    });
	    derivedHelper.emit('search', {
	      state: derivedState,
	      results: derivedHelper.lastResults
	    });
	    return derivedStateQueries;
	  });
	  var queries = Array.prototype.concat.apply(mainQueries, derivedQueries);
	  var queryId = this._queryId++;
	  this._currentNbQueries++;

	  try {
	    this.client.search(queries).then(this._dispatchAlgoliaResponse.bind(this, states, queryId)).catch(this._dispatchAlgoliaError.bind(this, queryId));
	  } catch (error) {
	    // If we reach this part, we're in an internal error state
	    this.emit('error', {
	      error: error
	    });
	  }
	};
	/**
	 * Transform the responses as sent by the server and transform them into a user
	 * usable object that merge the results of all the batch requests. It will dispatch
	 * over the different helper + derived helpers (when there are some).
	 * @private
	 * @param {array.<{SearchParameters, AlgoliaQueries, AlgoliaSearchHelper}>}
	 *  state state used for to generate the request
	 * @param {number} queryId id of the current request
	 * @param {object} content content of the response
	 * @return {undefined}
	 */


	AlgoliaSearchHelper.prototype._dispatchAlgoliaResponse = function (states, queryId, content) {
	  // FIXME remove the number of outdated queries discarded instead of just one
	  if (queryId < this._lastQueryIdReceived) {
	    // Outdated answer
	    return;
	  }

	  this._currentNbQueries -= queryId - this._lastQueryIdReceived;
	  this._lastQueryIdReceived = queryId;
	  if (this._currentNbQueries === 0) this.emit('searchQueueEmpty');
	  var results = content.results.slice();
	  states.forEach(function (s) {
	    var state = s.state;
	    var queriesCount = s.queriesCount;
	    var helper = s.helper;
	    var specificResults = results.splice(0, queriesCount);
	    var formattedResponse = helper.lastResults = new SearchResults_1(state, specificResults);
	    helper.emit('result', {
	      results: formattedResponse,
	      state: state
	    });
	  });
	};

	AlgoliaSearchHelper.prototype._dispatchAlgoliaError = function (queryId, error) {
	  if (queryId < this._lastQueryIdReceived) {
	    // Outdated answer
	    return;
	  }

	  this._currentNbQueries -= queryId - this._lastQueryIdReceived;
	  this._lastQueryIdReceived = queryId;
	  this.emit('error', {
	    error: error
	  });
	  if (this._currentNbQueries === 0) this.emit('searchQueueEmpty');
	};

	AlgoliaSearchHelper.prototype.containsRefinement = function (query, facetFilters, numericFilters, tagFilters) {
	  return query || facetFilters.length !== 0 || numericFilters.length !== 0 || tagFilters.length !== 0;
	};
	/**
	 * Test if there are some disjunctive refinements on the facet
	 * @private
	 * @param {string} facet the attribute to test
	 * @return {boolean}
	 */


	AlgoliaSearchHelper.prototype._hasDisjunctiveRefinements = function (facet) {
	  return this.state.disjunctiveRefinements[facet] && this.state.disjunctiveRefinements[facet].length > 0;
	};

	AlgoliaSearchHelper.prototype._change = function (event) {
	  var state = event.state;
	  var isPageReset = event.isPageReset;

	  if (state !== this.state) {
	    this.state = state;
	    this.emit('change', {
	      state: this.state,
	      results: this.lastResults,
	      isPageReset: isPageReset
	    });
	  }
	};
	/**
	 * Clears the cache of the underlying Algolia client.
	 * @return {AlgoliaSearchHelper}
	 */


	AlgoliaSearchHelper.prototype.clearCache = function () {
	  this.client.clearCache && this.client.clearCache();
	  return this;
	};
	/**
	 * Updates the internal client instance. If the reference of the clients
	 * are equal then no update is actually done.
	 * @param  {AlgoliaSearch} newClient an AlgoliaSearch client
	 * @return {AlgoliaSearchHelper}
	 */


	AlgoliaSearchHelper.prototype.setClient = function (newClient) {
	  if (this.client === newClient) return this;

	  if (typeof newClient.addAlgoliaAgent === 'function') {
	    newClient.addAlgoliaAgent('JS Helper (' + version + ')');
	  }

	  this.client = newClient;
	  return this;
	};
	/**
	 * Gets the instance of the currently used client.
	 * @return {AlgoliaSearch}
	 */


	AlgoliaSearchHelper.prototype.getClient = function () {
	  return this.client;
	};
	/**
	 * Creates an derived instance of the Helper. A derived helper
	 * is a way to request other indices synchronised with the lifecycle
	 * of the main Helper. This mechanism uses the multiqueries feature
	 * of Algolia to aggregate all the requests in a single network call.
	 *
	 * This method takes a function that is used to create a new SearchParameter
	 * that will be used to create requests to Algolia. Those new requests
	 * are created just before the `search` event. The signature of the function
	 * is `SearchParameters -> SearchParameters`.
	 *
	 * This method returns a new DerivedHelper which is an EventEmitter
	 * that fires the same `search`, `result` and `error` events. Those
	 * events, however, will receive data specific to this DerivedHelper
	 * and the SearchParameters that is returned by the call of the
	 * parameter function.
	 * @param {function} fn SearchParameters -> SearchParameters
	 * @return {DerivedHelper}
	 */


	AlgoliaSearchHelper.prototype.derive = function (fn) {
	  var derivedHelper = new DerivedHelper_1(this, fn);
	  this.derivedHelpers.push(derivedHelper);
	  return derivedHelper;
	};
	/**
	 * This method detaches a derived Helper from the main one. Prefer using the one from the
	 * derived helper itself, to remove the event listeners too.
	 * @private
	 * @return {undefined}
	 * @throws Error
	 */


	AlgoliaSearchHelper.prototype.detachDerivedHelper = function (derivedHelper) {
	  var pos = this.derivedHelpers.indexOf(derivedHelper);
	  if (pos === -1) throw new Error('Derived helper already detached');
	  this.derivedHelpers.splice(pos, 1);
	};
	/**
	 * This method returns true if there is currently at least one on-going search.
	 * @return {boolean} true if there is a search pending
	 */


	AlgoliaSearchHelper.prototype.hasPendingRequests = function () {
	  return this._currentNbQueries > 0;
	};
	/**
	 * @typedef AlgoliaSearchHelper.NumericRefinement
	 * @type {object}
	 * @property {number[]} value the numbers that are used for filtering this attribute with
	 * the operator specified.
	 * @property {string} operator the faceting data: value, number of entries
	 * @property {string} type will be 'numeric'
	 */

	/**
	 * @typedef AlgoliaSearchHelper.FacetRefinement
	 * @type {object}
	 * @property {string} value the string use to filter the attribute
	 * @property {string} type the type of filter: 'conjunctive', 'disjunctive', 'exclude'
	 */


	var algoliasearch_helper = AlgoliaSearchHelper;

	/**
	 * The algoliasearchHelper module is the function that will let its
	 * contains everything needed to use the Algoliasearch
	 * Helper. It is a also a function that instanciate the helper.
	 * To use the helper, you also need the Algolia JS client v3.
	 * @example
	 * //using the UMD build
	 * var client = algoliasearch('latency', '6be0576ff61c053d5f9a3225e2a90f76');
	 * var helper = algoliasearchHelper(client, 'bestbuy', {
	 *   facets: ['shipping'],
	 *   disjunctiveFacets: ['category']
	 * });
	 * helper.on('result', function(event) {
	 *   console.log(event.results);
	 * });
	 * helper
	 *   .toggleFacetRefinement('category', 'Movies & TV Shows')
	 *   .toggleFacetRefinement('shipping', 'Free shipping')
	 *   .search();
	 * @example
	 * // The helper is an event emitter using the node API
	 * helper.on('result', updateTheResults);
	 * helper.once('result', updateTheResults);
	 * helper.removeListener('result', updateTheResults);
	 * helper.removeAllListeners('result');
	 * @module algoliasearchHelper
	 * @param  {AlgoliaSearch} client an AlgoliaSearch client
	 * @param  {string} index the name of the index to query
	 * @param  {SearchParameters|object} opts an object defining the initial config of the search. It doesn't have to be a {SearchParameters}, just an object containing the properties you need from it.
	 * @return {AlgoliaSearchHelper}
	 */


	function algoliasearchHelper(client, index, opts) {
	  return new algoliasearch_helper(client, index, opts);
	}
	/**
	 * The version currently used
	 * @member module:algoliasearchHelper.version
	 * @type {number}
	 */


	algoliasearchHelper.version = version;
	/**
	 * Constructor for the Helper.
	 * @member module:algoliasearchHelper.AlgoliaSearchHelper
	 * @type {AlgoliaSearchHelper}
	 */

	algoliasearchHelper.AlgoliaSearchHelper = algoliasearch_helper;
	/**
	 * Constructor for the object containing all the parameters of the search.
	 * @member module:algoliasearchHelper.SearchParameters
	 * @type {SearchParameters}
	 */

	algoliasearchHelper.SearchParameters = SearchParameters_1;
	/**
	 * Constructor for the object containing the results of the search.
	 * @member module:algoliasearchHelper.SearchResults
	 * @type {SearchResults}
	 */

	algoliasearchHelper.SearchResults = SearchResults_1;
	var algoliasearchHelper_1 = algoliasearchHelper;

	function capitalize(text) {
	  return text.toString().charAt(0).toUpperCase() + text.toString().slice(1);
	}

	var nextMicroTask = Promise.resolve();

	var defer = function defer(callback) {
	  var progress = null;
	  var cancelled = false;

	  var fn = function fn() {
	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }

	    if (progress !== null) {
	      return;
	    }

	    progress = nextMicroTask.then(function () {
	      progress = null;

	      if (cancelled) {
	        cancelled = false;
	        return;
	      }

	      callback.apply(void 0, args);
	    });
	  };

	  fn.wait = function () {
	    if (progress === null) {
	      throw new Error('The deferred function should be called before calling `wait()`');
	    }

	    return progress;
	  };

	  fn.cancel = function () {
	    if (progress === null) {
	      return;
	    }

	    cancelled = true;
	  };

	  return fn;
	};

	function uniq(array) {
	  return array.filter(function (value, index, self) {
	    return self.indexOf(value) === index;
	  });
	}

	// We aren't using the native `Array.prototype.find` because the refactor away from Lodash is not
	// published as a major version.
	// Relying on the `find` polyfill on user-land, which before was only required for niche use-cases,
	// was decided as too risky.
	// @MAJOR Replace with the native `Array.prototype.find` method
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
	function find$1(items, predicate) {
	  var value;

	  for (var i = 0; i < items.length; i++) {
	    value = items[i]; // inlined for performance: if (Call(predicate, thisArg, [value, i, list])) {

	    if (predicate(value, i, items)) {
	      return value;
	    }
	  }

	  return undefined;
	}

	function unescapeRefinement(value) {
	  return String(value).replace(/^\\-/, '-');
	}

	function getRefinement$1(state, type, attribute, name) {
	  var resultsFacets = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
	  var res = {
	    type: type,
	    attribute: attribute,
	    name: name
	  };
	  var facet = find$1(resultsFacets, function (resultsFacet) {
	    return resultsFacet.name === attribute;
	  });
	  var count;

	  if (type === 'hierarchical') {
	    (function () {
	      var facetDeclaration = state.getHierarchicalFacetByName(attribute);
	      var nameParts = name.split(facetDeclaration.separator);

	      var getFacetRefinement = function getFacetRefinement(facetData) {
	        return function (refinementKey) {
	          return facetData[refinementKey];
	        };
	      };

	      var _loop = function _loop(i) {
	        facet = facet && facet.data && find$1(Object.keys(facet.data).map(getFacetRefinement(facet.data)), function (refinement) {
	          return refinement.name === nameParts[i];
	        });
	      };

	      for (var i = 0; facet !== undefined && i < nameParts.length; ++i) {
	        _loop(i);
	      }

	      count = facet && facet.count;
	    })();
	  } else {
	    count = facet && facet.data && facet.data[res.name];
	  }

	  var exhaustive = facet && facet.exhaustive;

	  if (count !== undefined) {
	    res.count = count;
	  }

	  if (exhaustive !== undefined) {
	    res.exhaustive = exhaustive;
	  }

	  return res;
	}

	function getRefinements(results, state) {
	  var clearsQuery = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
	  var refinements = [];
	  var _state$facetsRefineme = state.facetsRefinements,
	      facetsRefinements = _state$facetsRefineme === void 0 ? {} : _state$facetsRefineme,
	      _state$facetsExcludes = state.facetsExcludes,
	      facetsExcludes = _state$facetsExcludes === void 0 ? {} : _state$facetsExcludes,
	      _state$disjunctiveFac = state.disjunctiveFacetsRefinements,
	      disjunctiveFacetsRefinements = _state$disjunctiveFac === void 0 ? {} : _state$disjunctiveFac,
	      _state$hierarchicalFa = state.hierarchicalFacetsRefinements,
	      hierarchicalFacetsRefinements = _state$hierarchicalFa === void 0 ? {} : _state$hierarchicalFa,
	      _state$numericRefinem = state.numericRefinements,
	      numericRefinements = _state$numericRefinem === void 0 ? {} : _state$numericRefinem,
	      _state$tagRefinements = state.tagRefinements,
	      tagRefinements = _state$tagRefinements === void 0 ? [] : _state$tagRefinements;
	  Object.keys(facetsRefinements).forEach(function (attribute) {
	    var refinementNames = facetsRefinements[attribute];
	    refinementNames.forEach(function (refinementName) {
	      refinements.push(getRefinement$1(state, 'facet', attribute, refinementName, results.facets));
	    });
	  });
	  Object.keys(facetsExcludes).forEach(function (attribute) {
	    var refinementNames = facetsExcludes[attribute];
	    refinementNames.forEach(function (refinementName) {
	      refinements.push({
	        type: 'exclude',
	        attribute: attribute,
	        name: refinementName,
	        exclude: true
	      });
	    });
	  });
	  Object.keys(disjunctiveFacetsRefinements).forEach(function (attribute) {
	    var refinementNames = disjunctiveFacetsRefinements[attribute];
	    refinementNames.forEach(function (refinementName) {
	      refinements.push(getRefinement$1(state, 'disjunctive', attribute, // We unescape any disjunctive refined values with `unescapeRefinement` because
	      // they can be escaped on negative numeric values with `escapeRefinement`.
	      unescapeRefinement(refinementName), results.disjunctiveFacets));
	    });
	  });
	  Object.keys(hierarchicalFacetsRefinements).forEach(function (attribute) {
	    var refinementNames = hierarchicalFacetsRefinements[attribute];
	    refinementNames.forEach(function (refinement) {
	      refinements.push(getRefinement$1(state, 'hierarchical', attribute, refinement, results.hierarchicalFacets));
	    });
	  });
	  Object.keys(numericRefinements).forEach(function (attribute) {
	    var operators = numericRefinements[attribute];
	    Object.keys(operators).forEach(function (operatorOriginal) {
	      var operator = operatorOriginal;
	      var valueOrValues = operators[operator];
	      var refinementNames = Array.isArray(valueOrValues) ? valueOrValues : [valueOrValues];
	      refinementNames.forEach(function (refinementName) {
	        refinements.push({
	          type: 'numeric',
	          attribute: attribute,
	          name: "".concat(refinementName),
	          numericValue: refinementName,
	          operator: operator
	        });
	      });
	    });
	  });
	  tagRefinements.forEach(function (refinementName) {
	    refinements.push({
	      type: 'tag',
	      attribute: '_tags',
	      name: refinementName
	    });
	  });

	  if (clearsQuery && state.query && state.query.trim()) {
	    refinements.push({
	      attribute: 'query',
	      type: 'query',
	      name: state.query,
	      query: state.query
	    });
	  }

	  return refinements;
	}

	/**
	 * Clears the refinements of a SearchParameters object based on rules provided.
	 * The included attributes list is applied before the excluded attributes list. If the list
	 * is not provided, this list of all the currently refined attributes is used as included attributes.
	 * @param {object} $0 parameters
	 * @param {Helper} $0.helper instance of the Helper
	 * @param {string[]} [$0.attributesToClear = []] list of parameters to clear
	 * @returns {SearchParameters} search parameters with refinements cleared
	 */
	function clearRefinements(_ref) {
	  var helper = _ref.helper,
	      _ref$attributesToClea = _ref.attributesToClear,
	      attributesToClear = _ref$attributesToClea === void 0 ? [] : _ref$attributesToClea;
	  var finalState = helper.state.setPage(0);
	  finalState = attributesToClear.reduce(function (state, attribute) {
	    if (finalState.isNumericRefined(attribute)) {
	      return state.removeNumericRefinement(attribute);
	    }

	    if (finalState.isHierarchicalFacet(attribute)) {
	      return state.removeHierarchicalFacetRefinement(attribute);
	    }

	    if (finalState.isDisjunctiveFacet(attribute)) {
	      return state.removeDisjunctiveFacetRefinement(attribute);
	    }

	    if (finalState.isConjunctiveFacet(attribute)) {
	      return state.removeFacetRefinement(attribute);
	    }

	    return state;
	  }, finalState);

	  if (attributesToClear.indexOf('query') !== -1) {
	    finalState = finalState.setQuery('');
	  }

	  return finalState;
	}

	function escapeRefinement(value) {
	  if (typeof value === 'number' && value < 0) {
	    value = String(value).replace(/^-/, '\\-');
	  }

	  return value;
	}

	function getObjectType(object) {
	  return Object.prototype.toString.call(object).slice(8, -1);
	}

	function checkRendering(rendering, usage) {
	  if (rendering === undefined || typeof rendering !== 'function') {
	    throw new Error("The render function is not valid (received type ".concat(getObjectType(rendering), ").\n\n").concat(usage));
	  }
	}

	function noop() {}

	/**
	 * Logs a warning
	 * This is used to log issues in development environment only.
	 */


	var warn = noop;
	/**
	 * Logs a warning if the condition is not met.
	 * This is used to log issues in development environment only.
	 */

	var _warning = noop;

	if ("development".NODE_ENV === 'development') {
	  warn = function warn(message) {
	    // eslint-disable-next-line no-console
	    console.warn("[InstantSearch.js]: ".concat(message.trim()));
	  };

	  _warning = function warning(condition, message) {
	    if (condition) {
	      return;
	    }

	    var hasAlreadyPrinted = _warning.cache[message];

	    if (!hasAlreadyPrinted) {
	      _warning.cache[message] = true;
	      warn(message);
	    }
	  };

	  _warning.cache = {};
	}

	function _toConsumableArray(arr) {
	  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
	}

	function _nonIterableSpread() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance");
	}

	function _iterableToArray(iter) {
	  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
	}

	function _arrayWithoutHoles(arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
	      arr2[i] = arr[i];
	    }

	    return arr2;
	  }
	}

	function _slicedToArray(arr, i) {
	  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
	}

	function _nonIterableRest() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance");
	}

	function _iterableToArrayLimit(arr, i) {
	  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
	    return;
	  }

	  var _arr = [];
	  var _n = true;
	  var _d = false;
	  var _e = undefined;

	  try {
	    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	      _arr.push(_s.value);

	      if (i && _arr.length === i) break;
	    }
	  } catch (err) {
	    _d = true;
	    _e = err;
	  } finally {
	    try {
	      if (!_n && _i["return"] != null) _i["return"]();
	    } finally {
	      if (_d) throw _e;
	    }
	  }

	  return _arr;
	}

	function _arrayWithHoles(arr) {
	  if (Array.isArray(arr)) return arr;
	}
	// to map them.

	function getWidgetNames(connectorName) {
	  switch (connectorName) {
	    case 'range':
	      return [];

	    case 'menu':
	      return ['menu', 'menuSelect'];

	    default:
	      return [connectorName];
	  }
	}

	var stateToWidgetsMap = {
	  query: {
	    connectors: ['connectSearchBox'],
	    widgets: ['ais.searchBox', 'ais.autocomplete', 'ais.voiceSearch']
	  },
	  refinementList: {
	    connectors: ['connectRefinementList'],
	    widgets: ['ais.refinementList']
	  },
	  menu: {
	    connectors: ['connectMenu'],
	    widgets: ['ais.menu']
	  },
	  hierarchicalMenu: {
	    connectors: ['connectHierarchicalMenu'],
	    widgets: ['ais.hierarchicalMenu']
	  },
	  numericMenu: {
	    connectors: ['connectNumericMenu'],
	    widgets: ['ais.numericMenu']
	  },
	  ratingMenu: {
	    connectors: ['connectRatingMenu'],
	    widgets: ['ais.ratingMenu']
	  },
	  range: {
	    connectors: ['connectRange'],
	    widgets: ['ais.rangeInput', 'ais.rangeSlider', 'ais.range']
	  },
	  toggle: {
	    connectors: ['connectToggleRefinement'],
	    widgets: ['ais.toggleRefinement']
	  },
	  geoSearch: {
	    connectors: ['connectGeoSearch'],
	    widgets: ['ais.geoSearch']
	  },
	  sortBy: {
	    connectors: ['connectSortBy'],
	    widgets: ['ais.sortBy']
	  },
	  page: {
	    connectors: ['connectPagination'],
	    widgets: ['ais.pagination', 'ais.infiniteHits']
	  },
	  hitsPerPage: {
	    connectors: ['connectHitsPerPage'],
	    widgets: ['ais.hitsPerPage']
	  },
	  configure: {
	    connectors: ['connectConfigure'],
	    widgets: ['ais.configure']
	  },
	  places: {
	    connectors: [],
	    widgets: ['ais.places']
	  }
	};
	function checkIndexUiState(_ref) {
	  var index = _ref.index,
	      indexUiState = _ref.indexUiState;
	  var mountedWidgets = index.getWidgets().map(function (widget) {
	    return widget.$$type;
	  }).filter(Boolean);
	  var missingWidgets = Object.keys(indexUiState).reduce(function (acc, parameter) {
	    var requiredWidgets = stateToWidgetsMap[parameter] && stateToWidgetsMap[parameter].widgets;

	    if (requiredWidgets && !requiredWidgets.some(function (requiredWidget) {
	      return mountedWidgets.includes(requiredWidget);
	    })) {
	      acc.push([parameter, {
	        connectors: stateToWidgetsMap[parameter].connectors,
	        widgets: stateToWidgetsMap[parameter].widgets.map(function (widgetIdentifier) {
	          return widgetIdentifier.split('ais.')[1];
	        })
	      }]);
	    }

	    return acc;
	  }, []);
	  "development".NODE_ENV === 'development' ? _warning(missingWidgets.length === 0, "The UI state for the index \"".concat(index.getIndexId(), "\" is not consistent with the widgets mounted.\n\nThis can happen when the UI state is specified via `initialUiState`, `routing` or `setUiState` but that the widgets responsible for this state were not added. This results in those query parameters not being sent to the API.\n\nTo fully reflect the state, some widgets need to be added to the index \"").concat(index.getIndexId(), "\":\n\n").concat(missingWidgets.map(function (_ref2) {
	    var _ref4;

	    var _ref3 = _slicedToArray(_ref2, 2),
	        stateParameter = _ref3[0],
	        widgets = _ref3[1].widgets;

	    return "- `".concat(stateParameter, "` needs one of these widgets: ").concat((_ref4 = []).concat.apply(_ref4, _toConsumableArray(widgets.map(function (name) {
	      return getWidgetNames(name);
	    }))).map(function (name) {
	      return "\"".concat(name, "\"");
	    }).join(', '));
	  }).join('\n'), "\n\nIf you do not wish to display widgets but still want to support their search parameters, you can mount \"virtual widgets\" that don't render anything:\n\n```\n").concat(missingWidgets.filter(function (_ref5) {
	    var _ref6 = _slicedToArray(_ref5, 2),
	        connectors = _ref6[1].connectors;

	    return connectors.length > 0;
	  }).map(function (_ref7) {
	    var _ref8 = _slicedToArray(_ref7, 2),
	        _ref8$ = _ref8[1],
	        connectors = _ref8$.connectors,
	        widgets = _ref8$.widgets;

	    var capitalizedWidget = capitalize(widgets[0]);
	    var connectorName = connectors[0];
	    return "const virtual".concat(capitalizedWidget, " = ").concat(connectorName, "(() => null);");
	  }).join('\n'), "\n\nsearch.addWidgets([\n  ").concat(missingWidgets.filter(function (_ref9) {
	    var _ref10 = _slicedToArray(_ref9, 2),
	        connectors = _ref10[1].connectors;

	    return connectors.length > 0;
	  }).map(function (_ref11) {
	    var _ref12 = _slicedToArray(_ref11, 2),
	        widgets = _ref12[1].widgets;

	    var capitalizedWidget = capitalize(widgets[0]);
	    return "virtual".concat(capitalizedWidget, "({ /* ... */ })");
	  }).join(',\n  '), "\n]);\n```\n\nIf you're using custom widgets that do set these query parameters, we recommend using connectors instead.\n\nSee https://www.algolia.com/doc/guides/building-search-ui/widgets/customize-an-existing-widget/js/#customize-the-complete-ui-of-the-widgets")) : void 0;
	}

	function getPropertyByPath(object, path) {
	  var parts = Array.isArray(path) ? path : path.split('.');
	  return parts.reduce(function (current, key) {
	    return current && current[key];
	  }, object);
	}

	// This is the `Number.isFinite()` polyfill recommended by MDN.
	// We do not provide any tests for this function.
	// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite#Polyfill
	function isFiniteNumber(value) {
	  return typeof value === 'number' && isFinite(value);
	}

	function _typeof(obj) {
	  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
	    _typeof = function _typeof(obj) {
	      return typeof obj;
	    };
	  } else {
	    _typeof = function _typeof(obj) {
	      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	    };
	  }

	  return _typeof(obj);
	}
	/**
	 * This implementation is taken from Lodash implementation.
	 * See: https://github.com/lodash/lodash/blob/master/isPlainObject.js
	 */


	function getTag(value) {
	  if (value === null) {
	    return value === undefined ? '[object Undefined]' : '[object Null]';
	  }

	  return Object.prototype.toString.call(value);
	}

	function isObjectLike(value) {
	  return _typeof(value) === 'object' && value !== null;
	}
	/**
	 * Checks if `value` is a plain object.
	 *
	 * A plain object is an object created by the `Object`
	 * constructor or with a `[[Prototype]]` of `null`.
	 */


	function isPlainObject(value) {
	  if (!isObjectLike(value) || getTag(value) !== '[object Object]') {
	    return false;
	  }

	  if (Object.getPrototypeOf(value) === null) {
	    return true;
	  }

	  var proto = value;

	  while (Object.getPrototypeOf(proto) !== null) {
	    proto = Object.getPrototypeOf(proto);
	  }

	  return Object.getPrototypeOf(value) === proto;
	}

	function _toConsumableArray$1(arr) {
	  return _arrayWithoutHoles$1(arr) || _iterableToArray$1(arr) || _nonIterableSpread$1();
	}

	function _nonIterableSpread$1() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance");
	}

	function _iterableToArray$1(iter) {
	  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
	}

	function _arrayWithoutHoles$1(arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
	      arr2[i] = arr[i];
	    }

	    return arr2;
	  }
	}

	function range(_ref) {
	  var _ref$start = _ref.start,
	      start = _ref$start === void 0 ? 0 : _ref$start,
	      end = _ref.end,
	      _ref$step = _ref.step,
	      step = _ref$step === void 0 ? 1 : _ref$step; // We can't divide by 0 so we re-assign the step to 1 if it happens.

	  var limitStep = step === 0 ? 1 : step; // In some cases the array to create has a decimal length.
	  // We therefore need to round the value.
	  // Example:
	  //   { start: 1, end: 5000, step: 500 }
	  //   => Array length = (5000 - 1) / 500 = 9.998

	  var arrayLength = Math.round((end - start) / limitStep);
	  return _toConsumableArray$1(Array(arrayLength)).map(function (_, current) {
	    return start + current * limitStep;
	  });
	}

	function isPrimitive(obj) {
	  return obj !== Object(obj);
	}

	function isEqual(first, second) {
	  if (first === second) {
	    return true;
	  }

	  if (isPrimitive(first) || isPrimitive(second) || typeof first === 'function' || typeof second === 'function') {
	    return first === second;
	  }

	  if (Object.keys(first).length !== Object.keys(second).length) {
	    return false;
	  }

	  for (var _i = 0, _Object$keys = Object.keys(first); _i < _Object$keys.length; _i++) {
	    var key = _Object$keys[_i];

	    if (!(key in second)) {
	      return false;
	    }

	    if (!isEqual(first[key], second[key])) {
	      return false;
	    }
	  }

	  return true;
	}

	/**
	 * This implementation is taken from Lodash implementation.
	 * See: https://github.com/lodash/lodash/blob/4.17.11-npm/escape.js
	 */
	// Used to map characters to HTML entities.
	var htmlEscapes = {
	  '&': '&amp;',
	  '<': '&lt;',
	  '>': '&gt;',
	  '"': '&quot;',
	  "'": '&#39;'
	}; // Used to match HTML entities and HTML characters.

	var regexUnescapedHtml = /[&<>"']/g;
	var regexHasUnescapedHtml = RegExp(regexUnescapedHtml.source);
	/**
	 * Converts the characters "&", "<", ">", '"', and "'" in `string` to their
	 * corresponding HTML entities.
	 */

	function escape$1(value) {
	  return value && regexHasUnescapedHtml.test(value) ? value.replace(regexUnescapedHtml, function (character) {
	    return htmlEscapes[character];
	  }) : value;
	}

	/**
	 * This implementation is taken from Lodash implementation.
	 * See: https://github.com/lodash/lodash/blob/4.17.11-npm/unescape.js
	 */
	// Used to map HTML entities to characters.
	var htmlEscapes$1 = {
	  '&amp;': '&',
	  '&lt;': '<',
	  '&gt;': '>',
	  '&quot;': '"',
	  '&#39;': "'"
	}; // Used to match HTML entities and HTML characters.

	var regexEscapedHtml = /&(amp|quot|lt|gt|#39);/g;
	var regexHasEscapedHtml = RegExp(regexEscapedHtml.source);
	/**
	 * Converts the HTML entities "&", "<", ">", '"', and "'" in `string` to their
	 * characters.
	 */

	function unescape$1(value) {
	  return value && regexHasEscapedHtml.test(value) ? value.replace(regexEscapedHtml, function (character) {
	    return htmlEscapes$1[character];
	  }) : value;
	}

	function _extends() {
	  _extends = Object.assign || function (target) {
	    for (var i = 1; i < arguments.length; i++) {
	      var source = arguments[i];

	      for (var key in source) {
	        if (Object.prototype.hasOwnProperty.call(source, key)) {
	          target[key] = source[key];
	        }
	      }
	    }

	    return target;
	  };

	  return _extends.apply(this, arguments);
	}

	function ownKeys(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys(Object(source), true).forEach(function (key) {
	        _defineProperty(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var TAG_PLACEHOLDER = {
	  highlightPreTag: '__ais-highlight__',
	  highlightPostTag: '__/ais-highlight__'
	};
	var TAG_REPLACEMENT = {
	  highlightPreTag: '<mark>',
	  highlightPostTag: '</mark>'
	};

	function replaceTagsAndEscape(value) {
	  return escape$1(value).replace(new RegExp(TAG_PLACEHOLDER.highlightPreTag, 'g'), TAG_REPLACEMENT.highlightPreTag).replace(new RegExp(TAG_PLACEHOLDER.highlightPostTag, 'g'), TAG_REPLACEMENT.highlightPostTag);
	}

	function recursiveEscape(input) {
	  if (isPlainObject(input) && typeof input.value !== 'string') {
	    return Object.keys(input).reduce(function (acc, key) {
	      return _objectSpread({}, acc, _defineProperty({}, key, recursiveEscape(input[key])));
	    }, {});
	  }

	  if (Array.isArray(input)) {
	    return input.map(recursiveEscape);
	  }

	  return _objectSpread({}, input, {
	    value: replaceTagsAndEscape(input.value)
	  });
	}

	function escapeHits(hits) {
	  if (hits.__escaped === undefined) {
	    // We don't override the value on hit because it will mutate the raw results
	    // instead we make a shallow copy and we assign the escaped values on it.
	    hits = hits.map(function (_ref) {
	      var hit = _extends({}, _ref);

	      if (hit._highlightResult) {
	        hit._highlightResult = recursiveEscape(hit._highlightResult);
	      }

	      if (hit._snippetResult) {
	        hit._snippetResult = recursiveEscape(hit._snippetResult);
	      }

	      return hit;
	    });
	    hits.__escaped = true;
	  }

	  return hits;
	}
	function escapeFacets(facetHits) {
	  return facetHits.map(function (h) {
	    return _objectSpread({}, h, {
	      highlighted: replaceTagsAndEscape(h.highlighted)
	    });
	  });
	}

	function concatHighlightedParts(parts) {
	  var highlightPreTag = TAG_REPLACEMENT.highlightPreTag,
	      highlightPostTag = TAG_REPLACEMENT.highlightPostTag;
	  return parts.map(function (part) {
	    return part.isHighlighted ? highlightPreTag + part.value + highlightPostTag : part.value;
	  }).join('');
	}

	function getHighlightedParts(highlightedValue) {
	  var highlightPostTag = TAG_REPLACEMENT.highlightPostTag,
	      highlightPreTag = TAG_REPLACEMENT.highlightPreTag;
	  var splitByPreTag = highlightedValue.split(highlightPreTag);
	  var firstValue = splitByPreTag.shift();
	  var elements = !firstValue ? [] : [{
	    value: firstValue,
	    isHighlighted: false
	  }];
	  splitByPreTag.forEach(function (split) {
	    var splitByPostTag = split.split(highlightPostTag);
	    elements.push({
	      value: splitByPostTag[0],
	      isHighlighted: true
	    });

	    if (splitByPostTag[1] !== '') {
	      elements.push({
	        value: splitByPostTag[1],
	        isHighlighted: false
	      });
	    }
	  });
	  return elements;
	}

	var hasAlphanumeric = new RegExp(/\w/i);
	function getHighlightFromSiblings(parts, i) {
	  var _parts, _parts2;

	  var current = parts[i];
	  var isNextHighlighted = ((_parts = parts[i + 1]) === null || _parts === void 0 ? void 0 : _parts.isHighlighted) || true;
	  var isPreviousHighlighted = ((_parts2 = parts[i - 1]) === null || _parts2 === void 0 ? void 0 : _parts2.isHighlighted) || true;

	  if (!hasAlphanumeric.test(unescape$1(current.value)) && isPreviousHighlighted === isNextHighlighted) {
	    return isPreviousHighlighted;
	  }

	  return current.isHighlighted;
	}

	function ownKeys$1(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$1(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$1(Object(source), true).forEach(function (key) {
	        _defineProperty$1(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$1(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$1(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	function reverseHighlightedParts(parts) {
	  if (!parts.some(function (part) {
	    return part.isHighlighted;
	  })) {
	    return parts.map(function (part) {
	      return _objectSpread$1({}, part, {
	        isHighlighted: false
	      });
	    });
	  }

	  return parts.map(function (part, i) {
	    return _objectSpread$1({}, part, {
	      isHighlighted: !getHighlightFromSiblings(parts, i)
	    });
	  });
	}

	// We aren't using the native `Array.prototype.findIndex` because the refactor away from Lodash is not
	// published as a major version.
	// Relying on the `findIndex` polyfill on user-land, which before was only required for niche use-cases,
	// was decided as too risky.
	// @MAJOR Replace with the native `Array.prototype.findIndex` method
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
	function findIndex$1(array, comparator) {
	  if (!Array.isArray(array)) {
	    return -1;
	  }

	  for (var i = 0; i < array.length; i++) {
	    if (comparator(array[i])) {
	      return i;
	    }
	  }

	  return -1;
	}

	function ownKeys$2(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$2(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$2(Object(source), true).forEach(function (key) {
	        _defineProperty$2(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$2(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$2(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	function _objectWithoutProperties(source, excluded) {
	  if (source == null) return {};

	  var target = _objectWithoutPropertiesLoose$1(source, excluded);

	  var key, i;

	  if (Object.getOwnPropertySymbols) {
	    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

	    for (i = 0; i < sourceSymbolKeys.length; i++) {
	      key = sourceSymbolKeys[i];
	      if (excluded.indexOf(key) >= 0) continue;
	      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
	      target[key] = source[key];
	    }
	  }

	  return target;
	}

	function _objectWithoutPropertiesLoose$1(source, excluded) {
	  if (source == null) return {};
	  var target = {};
	  var sourceKeys = Object.keys(source);
	  var key, i;

	  for (i = 0; i < sourceKeys.length; i++) {
	    key = sourceKeys[i];
	    if (excluded.indexOf(key) >= 0) continue;
	    target[key] = source[key];
	  }

	  return target;
	}

	var mergeWithRest = function mergeWithRest(left, right) {
	  var rest = _objectWithoutProperties(right, ["facets", "disjunctiveFacets", "facetsRefinements", "facetsExcludes", "disjunctiveFacetsRefinements", "numericRefinements", "tagRefinements", "hierarchicalFacets", "hierarchicalFacetsRefinements", "ruleContexts"]);

	  return left.setQueryParameters(rest);
	}; // Merge facets


	var mergeFacets = function mergeFacets(left, right) {
	  return right.facets.reduce(function (_, name) {
	    return _.addFacet(name);
	  }, left);
	};

	var mergeDisjunctiveFacets = function mergeDisjunctiveFacets(left, right) {
	  return right.disjunctiveFacets.reduce(function (_, name) {
	    return _.addDisjunctiveFacet(name);
	  }, left);
	};

	var mergeHierarchicalFacets = function mergeHierarchicalFacets(left, right) {
	  return left.setQueryParameters({
	    hierarchicalFacets: right.hierarchicalFacets.reduce(function (facets, facet) {
	      var index = findIndex$1(facets, function (_) {
	        return _.name === facet.name;
	      });

	      if (index === -1) {
	        return facets.concat(facet);
	      }

	      var nextFacets = facets.slice();
	      nextFacets.splice(index, 1, facet);
	      return nextFacets;
	    }, left.hierarchicalFacets)
	  });
	}; // Merge facet refinements


	var mergeTagRefinements = function mergeTagRefinements(left, right) {
	  return right.tagRefinements.reduce(function (_, value) {
	    return _.addTagRefinement(value);
	  }, left);
	};

	var mergeFacetRefinements = function mergeFacetRefinements(left, right) {
	  return left.setQueryParameters({
	    facetsRefinements: _objectSpread$2({}, left.facetsRefinements, {}, right.facetsRefinements)
	  });
	};

	var mergeFacetsExcludes = function mergeFacetsExcludes(left, right) {
	  return left.setQueryParameters({
	    facetsExcludes: _objectSpread$2({}, left.facetsExcludes, {}, right.facetsExcludes)
	  });
	};

	var mergeDisjunctiveFacetsRefinements = function mergeDisjunctiveFacetsRefinements(left, right) {
	  return left.setQueryParameters({
	    disjunctiveFacetsRefinements: _objectSpread$2({}, left.disjunctiveFacetsRefinements, {}, right.disjunctiveFacetsRefinements)
	  });
	};

	var mergeNumericRefinements = function mergeNumericRefinements(left, right) {
	  return left.setQueryParameters({
	    numericRefinements: _objectSpread$2({}, left.numericRefinements, {}, right.numericRefinements)
	  });
	};

	var mergeHierarchicalFacetsRefinements = function mergeHierarchicalFacetsRefinements(left, right) {
	  return left.setQueryParameters({
	    hierarchicalFacetsRefinements: _objectSpread$2({}, left.hierarchicalFacetsRefinements, {}, right.hierarchicalFacetsRefinements)
	  });
	};

	var mergeRuleContexts = function mergeRuleContexts(left, right) {
	  var ruleContexts = uniq([].concat(left.ruleContexts).concat(right.ruleContexts).filter(Boolean));

	  if (ruleContexts.length > 0) {
	    return left.setQueryParameters({
	      ruleContexts: ruleContexts
	    });
	  }

	  return left;
	};

	var merge$1 = function merge() {
	  for (var _len = arguments.length, parameters = new Array(_len), _key = 0; _key < _len; _key++) {
	    parameters[_key] = arguments[_key];
	  }

	  return parameters.reduce(function (left, right) {
	    var hierarchicalFacetsRefinementsMerged = mergeHierarchicalFacetsRefinements(left, right);
	    var hierarchicalFacetsMerged = mergeHierarchicalFacets(hierarchicalFacetsRefinementsMerged, right);
	    var tagRefinementsMerged = mergeTagRefinements(hierarchicalFacetsMerged, right);
	    var numericRefinementsMerged = mergeNumericRefinements(tagRefinementsMerged, right);
	    var disjunctiveFacetsRefinementsMerged = mergeDisjunctiveFacetsRefinements(numericRefinementsMerged, right);
	    var facetsExcludesMerged = mergeFacetsExcludes(disjunctiveFacetsRefinementsMerged, right);
	    var facetRefinementsMerged = mergeFacetRefinements(facetsExcludesMerged, right);
	    var disjunctiveFacetsMerged = mergeDisjunctiveFacets(facetRefinementsMerged, right);
	    var ruleContextsMerged = mergeRuleContexts(disjunctiveFacetsMerged, right);
	    var facetsMerged = mergeFacets(ruleContextsMerged, right);
	    return mergeWithRest(facetsMerged, right);
	  });
	};

	var resolveSearchParameters = function resolveSearchParameters(current) {
	  var parent = current.getParent();
	  var states = [current.getHelper().state];

	  while (parent !== null) {
	    states = [parent.getHelper().state].concat(states);
	    parent = parent.getParent();
	  }

	  return states;
	};

	function toArray(value) {
	  return Array.isArray(value) ? value : [value];
	}

	var createDocumentationLink = function createDocumentationLink(_ref) {
	  var name = _ref.name,
	      _ref$connector = _ref.connector,
	      connector = _ref$connector === void 0 ? false : _ref$connector;
	  return ['https://www.algolia.com/doc/api-reference/widgets/', name, '/js/', connector ? '#connector' : ''].join('');
	};
	var createDocumentationMessageGenerator = function createDocumentationMessageGenerator() {
	  for (var _len = arguments.length, widgets = new Array(_len), _key = 0; _key < _len; _key++) {
	    widgets[_key] = arguments[_key];
	  }

	  var links = widgets.map(function (widget) {
	    return createDocumentationLink(widget);
	  }).join(', ');
	  return function (message) {
	    return [message, "See documentation: ".concat(links)].filter(Boolean).join('\n\n');
	  };
	};

	function _slicedToArray$1(arr, i) {
	  return _arrayWithHoles$1(arr) || _iterableToArrayLimit$1(arr, i) || _nonIterableRest$1();
	}

	function _nonIterableRest$1() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance");
	}

	function _iterableToArrayLimit$1(arr, i) {
	  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
	    return;
	  }

	  var _arr = [];
	  var _n = true;
	  var _d = false;
	  var _e = undefined;

	  try {
	    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	      _arr.push(_s.value);

	      if (i && _arr.length === i) break;
	    }
	  } catch (err) {
	    _d = true;
	    _e = err;
	  } finally {
	    try {
	      if (!_n && _i["return"] != null) _i["return"]();
	    } finally {
	      if (_d) throw _e;
	    }
	  }

	  return _arr;
	}

	function _arrayWithHoles$1(arr) {
	  if (Array.isArray(arr)) return arr;
	}

	var latLngRegExp = /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/;
	function aroundLatLngToPosition(value) {
	  var pattern = value.match(latLngRegExp); // Since the value provided is the one send with the request, the API should
	  // throw an error due to the wrong format. So throw an error should be safe.

	  if (!pattern) {
	    throw new Error("Invalid value for \"aroundLatLng\" parameter: \"".concat(value, "\""));
	  }

	  return {
	    lat: parseFloat(pattern[1]),
	    lng: parseFloat(pattern[2])
	  };
	}
	function insideBoundingBoxArrayToBoundingBox(value) {
	  var _value = _slicedToArray$1(value, 1),
	      _value$ = _value[0];

	  _value$ = _value$ === void 0 ? [undefined, undefined, undefined, undefined] : _value$;

	  var _value$2 = _slicedToArray$1(_value$, 4),
	      neLat = _value$2[0],
	      neLng = _value$2[1],
	      swLat = _value$2[2],
	      swLng = _value$2[3]; // Since the value provided is the one send with the request, the API should
	  // throw an error due to the wrong format. So throw an error should be safe.


	  if (!neLat || !neLng || !swLat || !swLng) {
	    throw new Error("Invalid value for \"insideBoundingBox\" parameter: [".concat(value, "]"));
	  }

	  return {
	    northEast: {
	      lat: neLat,
	      lng: neLng
	    },
	    southWest: {
	      lat: swLat,
	      lng: swLng
	    }
	  };
	}
	function insideBoundingBoxStringToBoundingBox(value) {
	  var _value$split$map = value.split(',').map(parseFloat),
	      _value$split$map2 = _slicedToArray$1(_value$split$map, 4),
	      neLat = _value$split$map2[0],
	      neLng = _value$split$map2[1],
	      swLat = _value$split$map2[2],
	      swLng = _value$split$map2[3]; // Since the value provided is the one send with the request, the API should
	  // throw an error due to the wrong format. So throw an error should be safe.


	  if (!neLat || !neLng || !swLat || !swLng) {
	    throw new Error("Invalid value for \"insideBoundingBox\" parameter: \"".concat(value, "\""));
	  }

	  return {
	    northEast: {
	      lat: neLat,
	      lng: neLng
	    },
	    southWest: {
	      lat: swLat,
	      lng: swLng
	    }
	  };
	}
	function insideBoundingBoxToBoundingBox(value) {
	  if (Array.isArray(value)) {
	    return insideBoundingBoxArrayToBoundingBox(value);
	  }

	  return insideBoundingBoxStringToBoundingBox(value);
	}

	function ownKeys$3(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$3(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$3(Object(source), true).forEach(function (key) {
	        _defineProperty$3(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$3(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$3(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	var addAbsolutePosition = function addAbsolutePosition(hits, page, hitsPerPage) {
	  return hits.map(function (hit, idx) {
	    return _objectSpread$3({}, hit, {
	      __position: hitsPerPage * page + idx + 1
	    });
	  });
	};

	function ownKeys$4(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$4(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$4(Object(source), true).forEach(function (key) {
	        _defineProperty$4(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$4(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$4(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	var addQueryID = function addQueryID(hits, queryID) {
	  if (!queryID) {
	    return hits;
	  }

	  return hits.map(function (hit) {
	    return _objectSpread$4({}, hit, {
	      __queryID: queryID
	    });
	  });
	};

	function isFacetRefined(helper, facet, value) {
	  if (helper.state.isHierarchicalFacet(facet)) {
	    return helper.state.isHierarchicalFacetRefined(facet, value);
	  } else if (helper.state.isConjunctiveFacet(facet)) {
	    return helper.state.isFacetRefined(facet, value);
	  } else {
	    return helper.state.isDisjunctiveFacetRefined(facet, value);
	  }
	}

	function _typeof$1(obj) {
	  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
	    _typeof$1 = function _typeof(obj) {
	      return typeof obj;
	    };
	  } else {
	    _typeof$1 = function _typeof(obj) {
	      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	    };
	  }

	  return _typeof$1(obj);
	}
	function createSendEventForFacet(_ref) {
	  var instantSearchInstance = _ref.instantSearchInstance,
	      helper = _ref.helper,
	      attribute = _ref.attribute,
	      widgetType = _ref.widgetType;

	  var sendEventForFacet = function sendEventForFacet() {
	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }

	    var eventType = args[0],
	        facetValue = args[1],
	        _args$ = args[2],
	        eventName = _args$ === void 0 ? 'Filter Applied' : _args$;

	    if (args.length === 1 && _typeof$1(args[0]) === 'object') {
	      instantSearchInstance.sendEventToInsights(args[0]);
	    } else if (eventType === 'click' && (args.length === 2 || args.length === 3)) {
	      if (!isFacetRefined(helper, attribute, facetValue)) {
	        // send event only when the facet is being checked "ON"
	        instantSearchInstance.sendEventToInsights({
	          insightsMethod: 'clickedFilters',
	          widgetType: widgetType,
	          eventType: eventType,
	          payload: {
	            eventName: eventName,
	            index: helper.getIndex(),
	            filters: ["".concat(attribute, ":").concat(facetValue)]
	          }
	        });
	      }
	    } else if ("development".NODE_ENV === 'development') {
	      throw new Error("You need to pass two arguments like:\n  sendEvent('click', facetValue);\n\nIf you want to send a custom payload, you can pass one object: sendEvent(customPayload);\n");
	    }
	  };

	  return sendEventForFacet;
	}

	function _typeof$2(obj) {
	  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
	    _typeof$2 = function _typeof(obj) {
	      return typeof obj;
	    };
	  } else {
	    _typeof$2 = function _typeof(obj) {
	      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	    };
	  }

	  return _typeof$2(obj);
	}

	var buildPayload = function buildPayload(_ref) {
	  var index = _ref.index,
	      widgetType = _ref.widgetType,
	      methodName = _ref.methodName,
	      args = _ref.args;

	  if (args.length === 1 && _typeof$2(args[0]) === 'object') {
	    return args[0];
	  }

	  var eventType = args[0];
	  var hits = args[1];
	  var eventName = args[2];

	  if (!hits) {
	    if ("development".NODE_ENV === 'development') {
	      throw new Error("You need to pass hit or hits as the second argument like:\n  ".concat(methodName, "(eventType, hit);\n  "));
	    } else {
	      return null;
	    }
	  }

	  if ((eventType === 'click' || eventType === 'conversion') && !eventName) {
	    if ("development".NODE_ENV === 'development') {
	      throw new Error("You need to pass eventName as the third argument for 'click' or 'conversion' events like:\n  ".concat(methodName, "('click', hit, 'Product Purchased');\n\n  To learn more about event naming: https://www.algolia.com/doc/guides/getting-insights-and-analytics/search-analytics/click-through-and-conversions/in-depth/clicks-conversions-best-practices/\n  "));
	    } else {
	      return null;
	    }
	  }

	  var hitsArray = Array.isArray(hits) ? hits : [hits];

	  if (hitsArray.length === 0) {
	    return null;
	  }

	  var queryID = hitsArray[0].__queryID;
	  var objectIDs = hitsArray.map(function (hit) {
	    return hit.objectID;
	  });
	  var positions = hitsArray.map(function (hit) {
	    return hit.__position;
	  });

	  if (eventType === 'view') {
	    return {
	      insightsMethod: 'viewedObjectIDs',
	      widgetType: widgetType,
	      eventType: eventType,
	      payload: {
	        eventName: eventName || 'Hits Viewed',
	        index: index,
	        objectIDs: objectIDs
	      }
	    };
	  } else if (eventType === 'click') {
	    return {
	      insightsMethod: 'clickedObjectIDsAfterSearch',
	      widgetType: widgetType,
	      eventType: eventType,
	      payload: {
	        eventName: eventName,
	        index: index,
	        queryID: queryID,
	        objectIDs: objectIDs,
	        positions: positions
	      }
	    };
	  } else if (eventType === 'conversion') {
	    return {
	      insightsMethod: 'convertedObjectIDsAfterSearch',
	      widgetType: widgetType,
	      eventType: eventType,
	      payload: {
	        eventName: eventName,
	        index: index,
	        queryID: queryID,
	        objectIDs: objectIDs
	      }
	    };
	  } else if ("development".NODE_ENV === 'development') {
	    throw new Error("eventType(\"".concat(eventType, "\") is not supported.\n    If you want to send a custom payload, you can pass one object: ").concat(methodName, "(customPayload);\n    "));
	  } else {
	    return null;
	  }
	};

	function createSendEventForHits(_ref2) {
	  var instantSearchInstance = _ref2.instantSearchInstance,
	      index = _ref2.index,
	      widgetType = _ref2.widgetType;

	  var sendEventForHits = function sendEventForHits() {
	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }

	    var payload = buildPayload({
	      widgetType: widgetType,
	      index: index,
	      methodName: 'sendEvent',
	      args: args
	    });

	    if (payload) {
	      instantSearchInstance.sendEventToInsights(payload);
	    }
	  };

	  return sendEventForHits;
	}
	function createBindEventForHits(_ref3) {
	  var index = _ref3.index,
	      widgetType = _ref3.widgetType;

	  var bindEventForHits = function bindEventForHits() {
	    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	      args[_key2] = arguments[_key2];
	    }

	    var payload = buildPayload({
	      widgetType: widgetType,
	      index: index,
	      methodName: 'bindEvent',
	      args: args
	    });
	    return payload ? "data-insights-event=".concat(btoa(JSON.stringify(payload))) : '';
	  };

	  return bindEventForHits;
	}

	function convertNumericRefinementsToFilters(state, attribute) {
	  if (!state) {
	    return null;
	  }

	  var filtersObj = state.numericRefinements[attribute];
	  /*
	    filtersObj === {
	      "<=": [10],
	      "=": [],
	      ">=": [5]
	    }
	  */

	  var filters = [];
	  Object.keys(filtersObj).filter(function (operator) {
	    return Array.isArray(filtersObj[operator]) && filtersObj[operator].length > 0;
	  }).forEach(function (operator) {
	    filtersObj[operator].forEach(function (value) {
	      filters.push("".concat(attribute).concat(operator).concat(value));
	    });
	  });
	  return filters;
	}

	function ownKeys$5(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$5(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$5(Object(source), true).forEach(function (key) {
	        _defineProperty$5(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$5(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$5(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	function _toConsumableArray$2(arr) {
	  return _arrayWithoutHoles$2(arr) || _iterableToArray$2(arr) || _nonIterableSpread$2();
	}

	function _nonIterableSpread$2() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance");
	}

	function _iterableToArray$2(iter) {
	  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
	}

	function _arrayWithoutHoles$2(arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
	      arr2[i] = arr[i];
	    }

	    return arr2;
	  }
	}

	function _objectWithoutProperties$1(source, excluded) {
	  if (source == null) return {};

	  var target = _objectWithoutPropertiesLoose$2(source, excluded);

	  var key, i;

	  if (Object.getOwnPropertySymbols) {
	    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

	    for (i = 0; i < sourceSymbolKeys.length; i++) {
	      key = sourceSymbolKeys[i];
	      if (excluded.indexOf(key) >= 0) continue;
	      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
	      target[key] = source[key];
	    }
	  }

	  return target;
	}

	function _objectWithoutPropertiesLoose$2(source, excluded) {
	  if (source == null) return {};
	  var target = {};
	  var sourceKeys = Object.keys(source);
	  var key, i;

	  for (i = 0; i < sourceKeys.length; i++) {
	    key = sourceKeys[i];
	    if (excluded.indexOf(key) >= 0) continue;
	    target[key] = source[key];
	  }

	  return target;
	}
	var withUsage = createDocumentationMessageGenerator({
	  name: 'index-widget'
	});
	function isIndexWidget(widget) {
	  return widget.$$type === 'ais.index';
	}
	/**
	 * This is the same content as helper._change / setState, but allowing for extra
	 * UiState to be synchronized.
	 * see: https://github.com/algolia/algoliasearch-helper-js/blob/6b835ffd07742f2d6b314022cce6848f5cfecd4a/src/algoliasearch.helper.js#L1311-L1324
	 */

	function privateHelperSetState(helper, _ref) {
	  var state = _ref.state,
	      isPageReset = _ref.isPageReset,
	      _uiState = _ref._uiState;

	  if (state !== helper.state) {
	    helper.state = state;
	    helper.emit('change', {
	      state: helper.state,
	      results: helper.lastResults,
	      isPageReset: isPageReset,
	      _uiState: _uiState
	    });
	  }
	}

	function getLocalWidgetsUiState(widgets, widgetStateOptions) {
	  var initialUiState = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
	  return widgets.filter(function (widget) {
	    return !isIndexWidget(widget);
	  }).reduce(function (uiState, widget) {
	    if (!widget.getWidgetUiState && !widget.getWidgetState) {
	      return uiState;
	    }

	    if (widget.getWidgetUiState) {
	      return widget.getWidgetUiState(uiState, widgetStateOptions);
	    }

	    return widget.getWidgetState(uiState, widgetStateOptions);
	  }, initialUiState);
	}

	function getLocalWidgetsSearchParameters(widgets, widgetSearchParametersOptions) {
	  var initialSearchParameters = widgetSearchParametersOptions.initialSearchParameters,
	      rest = _objectWithoutProperties$1(widgetSearchParametersOptions, ["initialSearchParameters"]);

	  return widgets.filter(function (widget) {
	    return !isIndexWidget(widget);
	  }).reduce(function (state, widget) {
	    if (!widget.getWidgetSearchParameters) {
	      return state;
	    }

	    return widget.getWidgetSearchParameters(state, rest);
	  }, initialSearchParameters);
	}

	function resetPageFromWidgets(widgets) {
	  var indexWidgets = widgets.filter(isIndexWidget);

	  if (indexWidgets.length === 0) {
	    return;
	  }

	  indexWidgets.forEach(function (widget) {
	    var widgetHelper = widget.getHelper();
	    privateHelperSetState(widgetHelper, {
	      state: widgetHelper.state.resetPage(),
	      isPageReset: true
	    });
	    resetPageFromWidgets(widget.getWidgets());
	  });
	}

	function resolveScopedResultsFromWidgets(widgets) {
	  var indexWidgets = widgets.filter(isIndexWidget);
	  return indexWidgets.reduce(function (scopedResults, current) {
	    return scopedResults.concat.apply(scopedResults, [{
	      indexId: current.getIndexId(),
	      results: current.getResults(),
	      helper: current.getHelper()
	    }].concat(_toConsumableArray$2(resolveScopedResultsFromWidgets(current.getWidgets()))));
	  }, []);
	}

	var index = function index(props) {
	  if (props === undefined || props.indexName === undefined) {
	    throw new Error(withUsage('The `indexName` option is required.'));
	  }

	  var indexName = props.indexName,
	      _props$indexId = props.indexId,
	      indexId = _props$indexId === void 0 ? indexName : _props$indexId;
	  var localWidgets = [];
	  var localUiState = {};
	  var localInstantSearchInstance = null;
	  var localParent = null;
	  var helper = null;
	  var derivedHelper = null;
	  return {
	    $$type: 'ais.index',
	    getIndexName: function getIndexName() {
	      return indexName;
	    },
	    getIndexId: function getIndexId() {
	      return indexId;
	    },
	    getHelper: function getHelper() {
	      return helper;
	    },
	    getResults: function getResults() {
	      return derivedHelper && derivedHelper.lastResults;
	    },
	    getScopedResults: function getScopedResults() {
	      var widgetParent = this.getParent(); // If the widget is the root, we consider itself as the only sibling.

	      var widgetSiblings = widgetParent ? widgetParent.getWidgets() : [this];
	      return resolveScopedResultsFromWidgets(widgetSiblings);
	    },
	    getParent: function getParent() {
	      return localParent;
	    },
	    createURL: function createURL(nextState) {
	      return localInstantSearchInstance._createURL(_defineProperty$5({}, indexId, getLocalWidgetsUiState(localWidgets, {
	        searchParameters: nextState,
	        helper: helper
	      })));
	    },
	    getWidgets: function getWidgets() {
	      return localWidgets;
	    },
	    addWidgets: function addWidgets(widgets) {
	      var _this = this;

	      if (!Array.isArray(widgets)) {
	        throw new Error(withUsage('The `addWidgets` method expects an array of widgets.'));
	      }

	      if (widgets.some(function (widget) {
	        return typeof widget.init !== 'function' && typeof widget.render !== 'function';
	      })) {
	        throw new Error(withUsage('The widget definition expects a `render` and/or an `init` method.'));
	      }

	      localWidgets = localWidgets.concat(widgets);

	      if (localInstantSearchInstance && Boolean(widgets.length)) {
	        privateHelperSetState(helper, {
	          state: getLocalWidgetsSearchParameters(localWidgets, {
	            uiState: localUiState,
	            initialSearchParameters: helper.state
	          }),
	          _uiState: localUiState
	        }); // We compute the render state before calling `init` in a separate loop
	        // to construct the whole render state object that is then passed to
	        // `init`.

	        widgets.forEach(function (widget) {
	          if (widget.getRenderState) {
	            var renderState = widget.getRenderState(localInstantSearchInstance.renderState[_this.getIndexId()] || {}, {
	              uiState: localInstantSearchInstance._initialUiState,
	              helper: _this.getHelper(),
	              parent: _this,
	              instantSearchInstance: localInstantSearchInstance,
	              state: helper.state,
	              renderState: localInstantSearchInstance.renderState,
	              templatesConfig: localInstantSearchInstance.templatesConfig,
	              createURL: _this.createURL,
	              scopedResults: [],
	              searchMetadata: {
	                isSearchStalled: localInstantSearchInstance._isSearchStalled
	              }
	            });
	            storeRenderState({
	              renderState: renderState,
	              instantSearchInstance: localInstantSearchInstance,
	              parent: _this
	            });
	          }
	        });
	        widgets.forEach(function (widget) {
	          if (widget.init) {
	            widget.init({
	              helper: helper,
	              parent: _this,
	              uiState: localInstantSearchInstance._initialUiState,
	              instantSearchInstance: localInstantSearchInstance,
	              state: helper.state,
	              renderState: localInstantSearchInstance.renderState,
	              templatesConfig: localInstantSearchInstance.templatesConfig,
	              createURL: _this.createURL,
	              scopedResults: [],
	              searchMetadata: {
	                isSearchStalled: localInstantSearchInstance._isSearchStalled
	              }
	            });
	          }
	        });
	        localInstantSearchInstance.scheduleSearch();
	      }

	      return this;
	    },
	    removeWidgets: function removeWidgets(widgets) {
	      if (!Array.isArray(widgets)) {
	        throw new Error(withUsage('The `removeWidgets` method expects an array of widgets.'));
	      }

	      if (widgets.some(function (widget) {
	        return typeof widget.dispose !== 'function';
	      })) {
	        throw new Error(withUsage('The widget definition expects a `dispose` method.'));
	      }

	      localWidgets = localWidgets.filter(function (widget) {
	        return widgets.indexOf(widget) === -1;
	      });

	      if (localInstantSearchInstance && Boolean(widgets.length)) {
	        var nextState = widgets.reduce(function (state, widget) {
	          // the `dispose` method exists at this point we already assert it
	          var next = widget.dispose({
	            helper: helper,
	            state: state
	          });
	          return next || state;
	        }, helper.state);
	        localUiState = getLocalWidgetsUiState(localWidgets, {
	          searchParameters: nextState,
	          helper: helper
	        });
	        helper.setState(getLocalWidgetsSearchParameters(localWidgets, {
	          uiState: localUiState,
	          initialSearchParameters: nextState
	        }));

	        if (localWidgets.length) {
	          localInstantSearchInstance.scheduleSearch();
	        }
	      }

	      return this;
	    },
	    init: function init(_ref2) {
	      var _this2 = this;

	      var instantSearchInstance = _ref2.instantSearchInstance,
	          parent = _ref2.parent,
	          uiState = _ref2.uiState;
	      localInstantSearchInstance = instantSearchInstance;
	      localParent = parent;
	      localUiState = uiState[indexId] || {}; // The `mainHelper` is already defined at this point. The instance is created
	      // inside InstantSearch at the `start` method, which occurs before the `init`
	      // step.

	      var mainHelper = instantSearchInstance.mainHelper;
	      var parameters = getLocalWidgetsSearchParameters(localWidgets, {
	        uiState: localUiState,
	        initialSearchParameters: new algoliasearchHelper_1.SearchParameters({
	          index: indexName
	        })
	      }); // This Helper is only used for state management we do not care about the
	      // `searchClient`. Only the "main" Helper created at the `InstantSearch`
	      // level is aware of the client.

	      helper = algoliasearchHelper_1({}, parameters.index, parameters); // We forward the call to `search` to the "main" instance of the Helper
	      // which is responsible for managing the queries (it's the only one that is
	      // aware of the `searchClient`).

	      helper.search = function () {
	        if (instantSearchInstance.onStateChange) {
	          instantSearchInstance.onStateChange({
	            uiState: instantSearchInstance.mainIndex.getWidgetUiState({}),
	            setUiState: instantSearchInstance.setUiState.bind(instantSearchInstance)
	          }); // We don't trigger a search when controlled because it becomes the
	          // responsibility of `setUiState`.

	          return mainHelper;
	        }

	        return mainHelper.search();
	      };

	      helper.searchWithoutTriggeringOnStateChange = function () {
	        return mainHelper.search();
	      }; // We use the same pattern for the `searchForFacetValues`.


	      helper.searchForFacetValues = function (facetName, facetValue, maxFacetHits, userState) {
	        var state = helper.state.setQueryParameters(userState);
	        return mainHelper.searchForFacetValues(facetName, facetValue, maxFacetHits, state);
	      };

	      derivedHelper = mainHelper.derive(function () {
	        return merge$1.apply(void 0, _toConsumableArray$2(resolveSearchParameters(_this2)));
	      }); // Subscribe to the Helper state changes for the page before widgets
	      // are initialized. This behavior mimics the original one of the Helper.
	      // It makes sense to replicate it at the `init` step. We have another
	      // listener on `change` below, once `init` is done.

	      helper.on('change', function (_ref3) {
	        var isPageReset = _ref3.isPageReset;

	        if (isPageReset) {
	          resetPageFromWidgets(localWidgets);
	        }
	      });
	      derivedHelper.on('search', function () {
	        // The index does not manage the "staleness" of the search. This is the
	        // responsibility of the main instance. It does not make sense to manage
	        // it at the index level because it's either: all of them or none of them
	        // that are stalled. The queries are performed into a single network request.
	        instantSearchInstance.scheduleStalledRender();

	        if ("development".NODE_ENV === 'development') {
	          checkIndexUiState({
	            index: _this2,
	            indexUiState: localUiState
	          });
	        }
	      });
	      derivedHelper.on('result', function (_ref4) {
	        var results = _ref4.results; // The index does not render the results it schedules a new render
	        // to let all the other indices emit their own results. It allows us to
	        // run the render process in one pass.

	        instantSearchInstance.scheduleRender(); // the derived helper is the one which actually searches, but the helper
	        // which is exposed e.g. via instance.helper, doesn't search, and thus
	        // does not have access to lastResults, which it used to in pre-federated
	        // search behavior.

	        helper.lastResults = results;
	      }); // We compute the render state before calling `render` in a separate loop
	      // to construct the whole render state object that is then passed to
	      // `render`.

	      localWidgets.forEach(function (widget) {
	        if (widget.getRenderState) {
	          var renderState = widget.getRenderState(instantSearchInstance.renderState[_this2.getIndexId()] || {}, {
	            uiState: uiState,
	            helper: helper,
	            parent: _this2,
	            instantSearchInstance: instantSearchInstance,
	            state: helper.state,
	            renderState: instantSearchInstance.renderState,
	            templatesConfig: instantSearchInstance.templatesConfig,
	            createURL: _this2.createURL,
	            scopedResults: [],
	            searchMetadata: {
	              isSearchStalled: instantSearchInstance._isSearchStalled
	            }
	          });
	          storeRenderState({
	            renderState: renderState,
	            instantSearchInstance: instantSearchInstance,
	            parent: _this2
	          });
	        }
	      });
	      localWidgets.forEach(function (widget) {
	        "development".NODE_ENV === 'development' ? _warning( // if it has NO getWidgetState or if it has getWidgetUiState, we don't warn
	        // aka we warn if there's _only_ getWidgetState
	        !widget.getWidgetState || Boolean(widget.getWidgetUiState), 'The `getWidgetState` method is renamed `getWidgetUiState` and will no longer exist under that name in InstantSearch.js 5.x. Please use `getWidgetUiState` instead.') : void 0;

	        if (widget.init) {
	          widget.init({
	            uiState: uiState,
	            helper: helper,
	            parent: _this2,
	            instantSearchInstance: instantSearchInstance,
	            state: helper.state,
	            renderState: instantSearchInstance.renderState,
	            templatesConfig: instantSearchInstance.templatesConfig,
	            createURL: _this2.createURL,
	            scopedResults: [],
	            searchMetadata: {
	              isSearchStalled: instantSearchInstance._isSearchStalled
	            }
	          });
	        }
	      }); // Subscribe to the Helper state changes for the `uiState` once widgets
	      // are initialized. Until the first render, state changes are part of the
	      // configuration step. This is mainly for backward compatibility with custom
	      // widgets. When the subscription happens before the `init` step, the (static)
	      // configuration of the widget is pushed in the URL. That's what we want to avoid.
	      // https://github.com/algolia/instantsearch.js/pull/994/commits/4a672ae3fd78809e213de0368549ef12e9dc9454

	      helper.on('change', function (event) {
	        var state = event.state; // @ts-ignore _uiState comes from privateHelperSetState and thus isn't typed on the helper event

	        var _uiState = event._uiState;
	        localUiState = getLocalWidgetsUiState(localWidgets, {
	          searchParameters: state,
	          helper: helper
	        }, _uiState || {}); // We don't trigger an internal change when controlled because it
	        // becomes the responsibility of `setUiState`.

	        if (!instantSearchInstance.onStateChange) {
	          instantSearchInstance.onInternalStateChange();
	        }
	      });
	    },
	    render: function render(_ref5) {
	      var _this3 = this;

	      var instantSearchInstance = _ref5.instantSearchInstance;

	      if (!this.getResults()) {
	        return;
	      }

	      localWidgets.forEach(function (widget) {
	        if (widget.getRenderState) {
	          var renderState = widget.getRenderState(instantSearchInstance.renderState[_this3.getIndexId()] || {}, {
	            helper: _this3.getHelper(),
	            parent: _this3,
	            instantSearchInstance: instantSearchInstance,
	            results: _this3.getResults(),
	            scopedResults: _this3.getScopedResults(),
	            state: _this3.getResults()._state,
	            renderState: instantSearchInstance.renderState,
	            templatesConfig: instantSearchInstance.templatesConfig,
	            createURL: _this3.createURL,
	            searchMetadata: {
	              isSearchStalled: instantSearchInstance._isSearchStalled
	            }
	          });
	          storeRenderState({
	            renderState: renderState,
	            instantSearchInstance: instantSearchInstance,
	            parent: _this3
	          });
	        }
	      });
	      localWidgets.forEach(function (widget) {
	        // At this point, all the variables used below are set. Both `helper`
	        // and `derivedHelper` have been created at the `init` step. The attribute
	        // `lastResults` might be `null` though. It's possible that a stalled render
	        // happens before the result e.g with a dynamically added index the request might
	        // be delayed. The render is triggered for the complete tree but some parts do
	        // not have results yet.
	        if (widget.render) {
	          widget.render({
	            helper: helper,
	            parent: _this3,
	            instantSearchInstance: instantSearchInstance,
	            results: _this3.getResults(),
	            scopedResults: _this3.getScopedResults(),
	            state: _this3.getResults()._state,
	            renderState: instantSearchInstance.renderState,
	            templatesConfig: instantSearchInstance.templatesConfig,
	            createURL: _this3.createURL,
	            searchMetadata: {
	              isSearchStalled: instantSearchInstance._isSearchStalled
	            }
	          });
	        }
	      });
	    },
	    dispose: function dispose() {
	      localWidgets.forEach(function (widget) {
	        if (widget.dispose) {
	          // The dispose function is always called once the instance is started
	          // (it's an effect of `removeWidgets`). The index is initialized and
	          // the Helper is available. We don't care about the return value of
	          // `dispose` because the index is removed. We can't call `removeWidgets`
	          // because we want to keep the widgets on the instance, to allow idempotent
	          // operations on `add` & `remove`.
	          widget.dispose({
	            helper: helper,
	            state: helper.state
	          });
	        }
	      });
	      localInstantSearchInstance = null;
	      localParent = null;
	      helper.removeAllListeners();
	      helper = null;
	      derivedHelper.detach();
	      derivedHelper = null;
	    },
	    getWidgetUiState: function getWidgetUiState(uiState) {
	      return localWidgets.filter(isIndexWidget).reduce(function (previousUiState, innerIndex) {
	        return innerIndex.getWidgetUiState(previousUiState);
	      }, _objectSpread$5({}, uiState, _defineProperty$5({}, this.getIndexId(), localUiState)));
	    },
	    getWidgetState: function getWidgetState(uiState) {
	      "development".NODE_ENV === 'development' ? _warning(false, 'The `getWidgetState` method is renamed `getWidgetUiState` and will no longer exist under that name in InstantSearch.js 5.x. Please use `getWidgetUiState` instead.') : void 0;
	      return this.getWidgetUiState(uiState);
	    },
	    getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref6) {
	      var uiState = _ref6.uiState;
	      return getLocalWidgetsSearchParameters(localWidgets, {
	        uiState: uiState,
	        initialSearchParameters: searchParameters
	      });
	    },
	    refreshUiState: function refreshUiState() {
	      localUiState = getLocalWidgetsUiState(localWidgets, {
	        searchParameters: this.getHelper().state,
	        helper: this.getHelper()
	      });
	    }
	  };
	};

	function storeRenderState(_ref7) {
	  var renderState = _ref7.renderState,
	      instantSearchInstance = _ref7.instantSearchInstance,
	      parent = _ref7.parent;
	  var parentIndexName = parent ? parent.getIndexId() : instantSearchInstance.mainIndex.getIndexId();
	  instantSearchInstance.renderState = _objectSpread$5({}, instantSearchInstance.renderState, _defineProperty$5({}, parentIndexName, _objectSpread$5({}, instantSearchInstance.renderState[parentIndexName], {}, renderState)));
	}

	var version$1 = '4.11.0';

	var NAMESPACE = 'ais';
	var component$1 = function component(componentName) {
	  return function () {
	    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
	        descendantName = _ref.descendantName,
	        modifierName = _ref.modifierName;

	    var descendent = descendantName ? "-".concat(descendantName) : '';
	    var modifier = modifierName ? "--".concat(modifierName) : '';
	    return "".concat(NAMESPACE, "-").concat(componentName).concat(descendent).concat(modifier);
	  };
	};

	var suit = component$1('Highlight');
	function highlight(_ref) {
	  var attribute = _ref.attribute,
	      _ref$highlightedTagNa = _ref.highlightedTagName,
	      highlightedTagName = _ref$highlightedTagNa === void 0 ? 'mark' : _ref$highlightedTagNa,
	      hit = _ref.hit,
	      _ref$cssClasses = _ref.cssClasses,
	      cssClasses = _ref$cssClasses === void 0 ? {} : _ref$cssClasses;

	  var _ref2 = getPropertyByPath(hit._highlightResult, attribute) || {},
	      _ref2$value = _ref2.value,
	      attributeValue = _ref2$value === void 0 ? '' : _ref2$value; // cx is not used, since it would be bundled as a dependency for Vue & Angular


	  var className = suit({
	    descendantName: 'highlighted'
	  }) + (cssClasses.highlighted ? " ".concat(cssClasses.highlighted) : '');
	  return attributeValue.replace(new RegExp(TAG_REPLACEMENT.highlightPreTag, 'g'), "<".concat(highlightedTagName, " class=\"").concat(className, "\">")).replace(new RegExp(TAG_REPLACEMENT.highlightPostTag, 'g'), "</".concat(highlightedTagName, ">"));
	}

	var suit$1 = component$1('ReverseHighlight');
	function reverseHighlight(_ref) {
	  var attribute = _ref.attribute,
	      _ref$highlightedTagNa = _ref.highlightedTagName,
	      highlightedTagName = _ref$highlightedTagNa === void 0 ? 'mark' : _ref$highlightedTagNa,
	      hit = _ref.hit,
	      _ref$cssClasses = _ref.cssClasses,
	      cssClasses = _ref$cssClasses === void 0 ? {} : _ref$cssClasses;

	  var _ref2 = getPropertyByPath(hit._highlightResult, attribute) || {},
	      _ref2$value = _ref2.value,
	      attributeValue = _ref2$value === void 0 ? '' : _ref2$value; // cx is not used, since it would be bundled as a dependency for Vue & Angular


	  var className = suit$1({
	    descendantName: 'highlighted'
	  }) + (cssClasses.highlighted ? " ".concat(cssClasses.highlighted) : '');
	  var reverseHighlightedValue = concatHighlightedParts(reverseHighlightedParts(getHighlightedParts(attributeValue)));
	  return reverseHighlightedValue.replace(new RegExp(TAG_REPLACEMENT.highlightPreTag, 'g'), "<".concat(highlightedTagName, " class=\"").concat(className, "\">")).replace(new RegExp(TAG_REPLACEMENT.highlightPostTag, 'g'), "</".concat(highlightedTagName, ">"));
	}

	var suit$2 = component$1('Snippet');
	function snippet(_ref) {
	  var attribute = _ref.attribute,
	      _ref$highlightedTagNa = _ref.highlightedTagName,
	      highlightedTagName = _ref$highlightedTagNa === void 0 ? 'mark' : _ref$highlightedTagNa,
	      hit = _ref.hit,
	      _ref$cssClasses = _ref.cssClasses,
	      cssClasses = _ref$cssClasses === void 0 ? {} : _ref$cssClasses;

	  var _ref2 = getPropertyByPath(hit._snippetResult, attribute) || {},
	      _ref2$value = _ref2.value,
	      attributeValue = _ref2$value === void 0 ? '' : _ref2$value; // cx is not used, since it would be bundled as a dependency for Vue & Angular


	  var className = suit$2({
	    descendantName: 'highlighted'
	  }) + (cssClasses.highlighted ? " ".concat(cssClasses.highlighted) : '');
	  return attributeValue.replace(new RegExp(TAG_REPLACEMENT.highlightPreTag, 'g'), "<".concat(highlightedTagName, " class=\"").concat(className, "\">")).replace(new RegExp(TAG_REPLACEMENT.highlightPostTag, 'g'), "</".concat(highlightedTagName, ">"));
	}

	var suit$3 = component$1('ReverseSnippet');
	function reverseSnippet(_ref) {
	  var attribute = _ref.attribute,
	      _ref$highlightedTagNa = _ref.highlightedTagName,
	      highlightedTagName = _ref$highlightedTagNa === void 0 ? 'mark' : _ref$highlightedTagNa,
	      hit = _ref.hit,
	      _ref$cssClasses = _ref.cssClasses,
	      cssClasses = _ref$cssClasses === void 0 ? {} : _ref$cssClasses;

	  var _ref2 = getPropertyByPath(hit._snippetResult, attribute) || {},
	      _ref2$value = _ref2.value,
	      attributeValue = _ref2$value === void 0 ? '' : _ref2$value; // cx is not used, since it would be bundled as a dependency for Vue & Angular


	  var className = suit$3({
	    descendantName: 'highlighted'
	  }) + (cssClasses.highlighted ? " ".concat(cssClasses.highlighted) : '');
	  var reverseHighlightedValue = concatHighlightedParts(reverseHighlightedParts(getHighlightedParts(attributeValue)));
	  return reverseHighlightedValue.replace(new RegExp(TAG_REPLACEMENT.highlightPreTag, 'g'), "<".concat(highlightedTagName, " class=\"").concat(className, "\">")).replace(new RegExp(TAG_REPLACEMENT.highlightPostTag, 'g'), "</".concat(highlightedTagName, ">"));
	}

	function _typeof$3(obj) {
	  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
	    _typeof$3 = function _typeof(obj) {
	      return typeof obj;
	    };
	  } else {
	    _typeof$3 = function _typeof(obj) {
	      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	    };
	  }

	  return _typeof$3(obj);
	}
	function writeDataAttributes(_ref) {
	  var method = _ref.method,
	      payload = _ref.payload;

	  if (_typeof$3(payload) !== 'object') {
	    throw new Error("The insights helper expects the payload to be an object.");
	  }

	  var serializedPayload;

	  try {
	    serializedPayload = btoa(JSON.stringify(payload));
	  } catch (error) {
	    throw new Error("Could not JSON serialize the payload object.");
	  }

	  return "data-insights-method=\"".concat(method, "\" data-insights-payload=\"").concat(serializedPayload, "\"");
	}
	/**
	 * @deprecated This function will be still supported in 4.x releases, but not further. It is replaced by the `insights` middleware. For more information, visit https://www.algolia.com/doc/guides/getting-insights-and-analytics/search-analytics/click-through-and-conversions/how-to/send-click-and-conversion-events-with-instantsearch/js/
	 */

	function insights(method, payload) {
	  "development".NODE_ENV === 'development' ? _warning(false, "`insights` function has been deprecated. It is still supported in 4.x releases, but not further. It is replaced by the `insights` middleware.\n\nFor more information, visit https://www.algolia.com/doc/guides/getting-insights-and-analytics/search-analytics/click-through-and-conversions/how-to/send-click-and-conversion-events-with-instantsearch/js/") : void 0;
	  return writeDataAttributes({
	    method: method,
	    payload: payload
	  });
	}

	var ANONYMOUS_TOKEN_COOKIE_KEY = '_ALGOLIA';

	function getCookie(name) {
	  var prefix = "".concat(name, "=");
	  var cookies = document.cookie.split(';');

	  for (var i = 0; i < cookies.length; i++) {
	    var cookie = cookies[i];

	    while (cookie.charAt(0) === ' ') {
	      cookie = cookie.substring(1);
	    }

	    if (cookie.indexOf(prefix) === 0) {
	      return cookie.substring(prefix.length, cookie.length);
	    }
	  }

	  return undefined;
	}

	function getInsightsAnonymousUserTokenInternal() {
	  return getCookie(ANONYMOUS_TOKEN_COOKIE_KEY);
	}
	/**
	 * @deprecated This function will be still supported in 4.x releases, but not further. It is replaced by the `insights` middleware. For more information, visit https://www.algolia.com/doc/guides/getting-insights-and-analytics/search-analytics/click-through-and-conversions/how-to/send-click-and-conversion-events-with-instantsearch/js/
	 */

	function getInsightsAnonymousUserToken() {
	  "development".NODE_ENV === 'development' ? _warning(false, "`getInsightsAnonymousUserToken` function has been deprecated. It is still supported in 4.x releases, but not further. It is replaced by the `insights` middleware.\n\nFor more information, visit https://www.algolia.com/doc/guides/getting-insights-and-analytics/search-analytics/click-through-and-conversions/how-to/send-click-and-conversion-events-with-instantsearch/js/") : void 0;
	  return getInsightsAnonymousUserTokenInternal();
	}

	function ownKeys$6(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$6(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$6(Object(source), true).forEach(function (key) {
	        _defineProperty$6(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$6(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$6(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	function hoganHelpers(_ref) {
	  var numberLocale = _ref.numberLocale;
	  return {
	    formatNumber: function formatNumber(value, render) {
	      return Number(render(value)).toLocaleString(numberLocale);
	    },
	    highlight: function highlight$1(options, render) {
	      try {
	        var highlightOptions = JSON.parse(options);
	        return render(highlight(_objectSpread$6({}, highlightOptions, {
	          hit: this
	        })));
	      } catch (error) {
	        throw new Error("\nThe highlight helper expects a JSON object of the format:\n{ \"attribute\": \"name\", \"highlightedTagName\": \"mark\" }");
	      }
	    },
	    reverseHighlight: function reverseHighlight$1(options, render) {
	      try {
	        var reverseHighlightOptions = JSON.parse(options);
	        return render(reverseHighlight(_objectSpread$6({}, reverseHighlightOptions, {
	          hit: this
	        })));
	      } catch (error) {
	        throw new Error("\n  The reverseHighlight helper expects a JSON object of the format:\n  { \"attribute\": \"name\", \"highlightedTagName\": \"mark\" }");
	      }
	    },
	    snippet: function snippet$1(options, render) {
	      try {
	        var snippetOptions = JSON.parse(options);
	        return render(snippet(_objectSpread$6({}, snippetOptions, {
	          hit: this
	        })));
	      } catch (error) {
	        throw new Error("\nThe snippet helper expects a JSON object of the format:\n{ \"attribute\": \"name\", \"highlightedTagName\": \"mark\" }");
	      }
	    },
	    reverseSnippet: function reverseSnippet$1(options, render) {
	      try {
	        var reverseSnippetOptions = JSON.parse(options);
	        return render(reverseSnippet(_objectSpread$6({}, reverseSnippetOptions, {
	          hit: this
	        })));
	      } catch (error) {
	        throw new Error("\n  The reverseSnippet helper expects a JSON object of the format:\n  { \"attribute\": \"name\", \"highlightedTagName\": \"mark\" }");
	      }
	    },
	    insights: function insights$1(options, render) {
	      try {
	        var _JSON$parse = JSON.parse(options),
	            method = _JSON$parse.method,
	            payload = _JSON$parse.payload;

	        return render(insights(method, _objectSpread$6({
	          objectIDs: [this.objectID]
	        }, payload)));
	      } catch (error) {
	        throw new Error("\nThe insights helper expects a JSON object of the format:\n{ \"method\": \"method-name\", \"payload\": { \"eventName\": \"name of the event\" } }");
	      }
	    }
	  };
	}

	function ownKeys$7(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$7(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$7(Object(source), true).forEach(function (key) {
	        _defineProperty$7(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$7(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$7(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	function _objectWithoutProperties$2(source, excluded) {
	  if (source == null) return {};

	  var target = _objectWithoutPropertiesLoose$3(source, excluded);

	  var key, i;

	  if (Object.getOwnPropertySymbols) {
	    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

	    for (i = 0; i < sourceSymbolKeys.length; i++) {
	      key = sourceSymbolKeys[i];
	      if (excluded.indexOf(key) >= 0) continue;
	      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
	      target[key] = source[key];
	    }
	  }

	  return target;
	}

	function _objectWithoutPropertiesLoose$3(source, excluded) {
	  if (source == null) return {};
	  var target = {};
	  var sourceKeys = Object.keys(source);
	  var key, i;

	  for (i = 0; i < sourceKeys.length; i++) {
	    key = sourceKeys[i];
	    if (excluded.indexOf(key) >= 0) continue;
	    target[key] = source[key];
	  }

	  return target;
	}

	function getIndexStateWithoutConfigure(uiState) {
	  var trackedUiState = _objectWithoutProperties$2(uiState, ["configure"]);

	  return trackedUiState;
	} // technically a URL could contain any key, since users provide it,
	// which is why the input to this function is UiState, not something
	// which excludes "configure" as this function does.


	function simpleStateMapping() {
	  return {
	    stateToRoute: function stateToRoute(uiState) {
	      return Object.keys(uiState).reduce(function (state, indexId) {
	        return _objectSpread$7({}, state, _defineProperty$7({}, indexId, getIndexStateWithoutConfigure(uiState[indexId])));
	      }, {});
	    },
	    routeToState: function routeToState() {
	      var routeState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	      return Object.keys(routeState).reduce(function (state, indexId) {
	        return _objectSpread$7({}, state, _defineProperty$7({}, indexId, getIndexStateWithoutConfigure(routeState[indexId])));
	      }, {});
	    }
	  };
	}

	var replace = String.prototype.replace;
	var percentTwenties = /%20/g;
	var Format = {
	  RFC1738: 'RFC1738',
	  RFC3986: 'RFC3986'
	};
	var formats = {
	  'default': Format.RFC3986,
	  formatters: {
	    RFC1738: function (value) {
	      return replace.call(value, percentTwenties, '+');
	    },
	    RFC3986: function (value) {
	      return String(value);
	    }
	  },
	  RFC1738: Format.RFC1738,
	  RFC3986: Format.RFC3986
	};

	var has = Object.prototype.hasOwnProperty;
	var isArray = Array.isArray;

	var hexTable = function () {
	  var array = [];

	  for (var i = 0; i < 256; ++i) {
	    array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
	  }

	  return array;
	}();

	var compactQueue = function compactQueue(queue) {
	  while (queue.length > 1) {
	    var item = queue.pop();
	    var obj = item.obj[item.prop];

	    if (isArray(obj)) {
	      var compacted = [];

	      for (var j = 0; j < obj.length; ++j) {
	        if (typeof obj[j] !== 'undefined') {
	          compacted.push(obj[j]);
	        }
	      }

	      item.obj[item.prop] = compacted;
	    }
	  }
	};

	var arrayToObject = function arrayToObject(source, options) {
	  var obj = options && options.plainObjects ? Object.create(null) : {};

	  for (var i = 0; i < source.length; ++i) {
	    if (typeof source[i] !== 'undefined') {
	      obj[i] = source[i];
	    }
	  }

	  return obj;
	};

	var merge$2 = function merge(target, source, options) {
	  /* eslint no-param-reassign: 0 */
	  if (!source) {
	    return target;
	  }

	  if (typeof source !== 'object') {
	    if (isArray(target)) {
	      target.push(source);
	    } else if (target && typeof target === 'object') {
	      if (options && (options.plainObjects || options.allowPrototypes) || !has.call(Object.prototype, source)) {
	        target[source] = true;
	      }
	    } else {
	      return [target, source];
	    }

	    return target;
	  }

	  if (!target || typeof target !== 'object') {
	    return [target].concat(source);
	  }

	  var mergeTarget = target;

	  if (isArray(target) && !isArray(source)) {
	    mergeTarget = arrayToObject(target, options);
	  }

	  if (isArray(target) && isArray(source)) {
	    source.forEach(function (item, i) {
	      if (has.call(target, i)) {
	        var targetItem = target[i];

	        if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
	          target[i] = merge(targetItem, item, options);
	        } else {
	          target.push(item);
	        }
	      } else {
	        target[i] = item;
	      }
	    });
	    return target;
	  }

	  return Object.keys(source).reduce(function (acc, key) {
	    var value = source[key];

	    if (has.call(acc, key)) {
	      acc[key] = merge(acc[key], value, options);
	    } else {
	      acc[key] = value;
	    }

	    return acc;
	  }, mergeTarget);
	};

	var assign = function assignSingleSource(target, source) {
	  return Object.keys(source).reduce(function (acc, key) {
	    acc[key] = source[key];
	    return acc;
	  }, target);
	};

	var decode = function (str, decoder, charset) {
	  var strWithoutPlus = str.replace(/\+/g, ' ');

	  if (charset === 'iso-8859-1') {
	    // unescape never throws, no try...catch needed:
	    return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
	  } // utf-8


	  try {
	    return decodeURIComponent(strWithoutPlus);
	  } catch (e) {
	    return strWithoutPlus;
	  }
	};

	var encode = function encode(str, defaultEncoder, charset, kind, format) {
	  // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
	  // It has been adapted here for stricter adherence to RFC 3986
	  if (str.length === 0) {
	    return str;
	  }

	  var string = str;

	  if (typeof str === 'symbol') {
	    string = Symbol.prototype.toString.call(str);
	  } else if (typeof str !== 'string') {
	    string = String(str);
	  }

	  if (charset === 'iso-8859-1') {
	    return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
	      return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
	    });
	  }

	  var out = '';

	  for (var i = 0; i < string.length; ++i) {
	    var c = string.charCodeAt(i);

	    if (c === 0x2D // -
	    || c === 0x2E // .
	    || c === 0x5F // _
	    || c === 0x7E // ~
	    || c >= 0x30 && c <= 0x39 // 0-9
	    || c >= 0x41 && c <= 0x5A // a-z
	    || c >= 0x61 && c <= 0x7A // A-Z
	    || format === formats.RFC1738 && (c === 0x28 || c === 0x29) // ( )
	    ) {
	        out += string.charAt(i);
	        continue;
	      }

	    if (c < 0x80) {
	      out = out + hexTable[c];
	      continue;
	    }

	    if (c < 0x800) {
	      out = out + (hexTable[0xC0 | c >> 6] + hexTable[0x80 | c & 0x3F]);
	      continue;
	    }

	    if (c < 0xD800 || c >= 0xE000) {
	      out = out + (hexTable[0xE0 | c >> 12] + hexTable[0x80 | c >> 6 & 0x3F] + hexTable[0x80 | c & 0x3F]);
	      continue;
	    }

	    i += 1;
	    c = 0x10000 + ((c & 0x3FF) << 10 | string.charCodeAt(i) & 0x3FF);
	    out += hexTable[0xF0 | c >> 18] + hexTable[0x80 | c >> 12 & 0x3F] + hexTable[0x80 | c >> 6 & 0x3F] + hexTable[0x80 | c & 0x3F];
	  }

	  return out;
	};

	var compact$1 = function compact(value) {
	  var queue = [{
	    obj: {
	      o: value
	    },
	    prop: 'o'
	  }];
	  var refs = [];

	  for (var i = 0; i < queue.length; ++i) {
	    var item = queue[i];
	    var obj = item.obj[item.prop];
	    var keys = Object.keys(obj);

	    for (var j = 0; j < keys.length; ++j) {
	      var key = keys[j];
	      var val = obj[key];

	      if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
	        queue.push({
	          obj: obj,
	          prop: key
	        });
	        refs.push(val);
	      }
	    }
	  }

	  compactQueue(queue);
	  return value;
	};

	var isRegExp = function isRegExp(obj) {
	  return Object.prototype.toString.call(obj) === '[object RegExp]';
	};

	var isBuffer = function isBuffer(obj) {
	  if (!obj || typeof obj !== 'object') {
	    return false;
	  }

	  return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
	};

	var combine = function combine(a, b) {
	  return [].concat(a, b);
	};

	var maybeMap = function maybeMap(val, fn) {
	  if (isArray(val)) {
	    var mapped = [];

	    for (var i = 0; i < val.length; i += 1) {
	      mapped.push(fn(val[i]));
	    }

	    return mapped;
	  }

	  return fn(val);
	};

	var utils = {
	  arrayToObject: arrayToObject,
	  assign: assign,
	  combine: combine,
	  compact: compact$1,
	  decode: decode,
	  encode: encode,
	  isBuffer: isBuffer,
	  isRegExp: isRegExp,
	  maybeMap: maybeMap,
	  merge: merge$2
	};

	var has$1 = Object.prototype.hasOwnProperty;
	var arrayPrefixGenerators = {
	  brackets: function brackets(prefix) {
	    return prefix + '[]';
	  },
	  comma: 'comma',
	  indices: function indices(prefix, key) {
	    return prefix + '[' + key + ']';
	  },
	  repeat: function repeat(prefix) {
	    return prefix;
	  }
	};
	var isArray$1 = Array.isArray;
	var push = Array.prototype.push;

	var pushToArray = function (arr, valueOrArray) {
	  push.apply(arr, isArray$1(valueOrArray) ? valueOrArray : [valueOrArray]);
	};

	var toISO = Date.prototype.toISOString;
	var defaultFormat = formats['default'];
	var defaults = {
	  addQueryPrefix: false,
	  allowDots: false,
	  charset: 'utf-8',
	  charsetSentinel: false,
	  delimiter: '&',
	  encode: true,
	  encoder: utils.encode,
	  encodeValuesOnly: false,
	  format: defaultFormat,
	  formatter: formats.formatters[defaultFormat],
	  // deprecated
	  indices: false,
	  serializeDate: function serializeDate(date) {
	    return toISO.call(date);
	  },
	  skipNulls: false,
	  strictNullHandling: false
	};

	var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
	  return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || typeof v === 'symbol' || typeof v === 'bigint';
	};

	var stringify = function stringify(object, prefix, generateArrayPrefix, strictNullHandling, skipNulls, encoder, filter, sort, allowDots, serializeDate, format, formatter, encodeValuesOnly, charset) {
	  var obj = object;

	  if (typeof filter === 'function') {
	    obj = filter(prefix, obj);
	  } else if (obj instanceof Date) {
	    obj = serializeDate(obj);
	  } else if (generateArrayPrefix === 'comma' && isArray$1(obj)) {
	    obj = utils.maybeMap(obj, function (value) {
	      if (value instanceof Date) {
	        return serializeDate(value);
	      }

	      return value;
	    });
	  }

	  if (obj === null) {
	    if (strictNullHandling) {
	      return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, 'key', format) : prefix;
	    }

	    obj = '';
	  }

	  if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
	    if (encoder) {
	      var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, 'key', format);
	      return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset, 'value', format))];
	    }

	    return [formatter(prefix) + '=' + formatter(String(obj))];
	  }

	  var values = [];

	  if (typeof obj === 'undefined') {
	    return values;
	  }

	  var objKeys;

	  if (generateArrayPrefix === 'comma' && isArray$1(obj)) {
	    // we need to join elements in
	    objKeys = [{
	      value: obj.length > 0 ? obj.join(',') || null : undefined
	    }];
	  } else if (isArray$1(filter)) {
	    objKeys = filter;
	  } else {
	    var keys = Object.keys(obj);
	    objKeys = sort ? keys.sort(sort) : keys;
	  }

	  for (var i = 0; i < objKeys.length; ++i) {
	    var key = objKeys[i];
	    var value = typeof key === 'object' && key.value !== undefined ? key.value : obj[key];

	    if (skipNulls && value === null) {
	      continue;
	    }

	    var keyPrefix = isArray$1(obj) ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(prefix, key) : prefix : prefix + (allowDots ? '.' + key : '[' + key + ']');
	    pushToArray(values, stringify(value, keyPrefix, generateArrayPrefix, strictNullHandling, skipNulls, encoder, filter, sort, allowDots, serializeDate, format, formatter, encodeValuesOnly, charset));
	  }

	  return values;
	};

	var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
	  if (!opts) {
	    return defaults;
	  }

	  if (opts.encoder !== null && opts.encoder !== undefined && typeof opts.encoder !== 'function') {
	    throw new TypeError('Encoder has to be a function.');
	  }

	  var charset = opts.charset || defaults.charset;

	  if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
	    throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
	  }

	  var format = formats['default'];

	  if (typeof opts.format !== 'undefined') {
	    if (!has$1.call(formats.formatters, opts.format)) {
	      throw new TypeError('Unknown format option provided.');
	    }

	    format = opts.format;
	  }

	  var formatter = formats.formatters[format];
	  var filter = defaults.filter;

	  if (typeof opts.filter === 'function' || isArray$1(opts.filter)) {
	    filter = opts.filter;
	  }

	  return {
	    addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults.addQueryPrefix,
	    allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
	    charset: charset,
	    charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
	    delimiter: typeof opts.delimiter === 'undefined' ? defaults.delimiter : opts.delimiter,
	    encode: typeof opts.encode === 'boolean' ? opts.encode : defaults.encode,
	    encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults.encoder,
	    encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
	    filter: filter,
	    format: format,
	    formatter: formatter,
	    serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults.serializeDate,
	    skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults.skipNulls,
	    sort: typeof opts.sort === 'function' ? opts.sort : null,
	    strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
	  };
	};

	var stringify_1 = function (object, opts) {
	  var obj = object;
	  var options = normalizeStringifyOptions(opts);
	  var objKeys;
	  var filter;

	  if (typeof options.filter === 'function') {
	    filter = options.filter;
	    obj = filter('', obj);
	  } else if (isArray$1(options.filter)) {
	    filter = options.filter;
	    objKeys = filter;
	  }

	  var keys = [];

	  if (typeof obj !== 'object' || obj === null) {
	    return '';
	  }

	  var arrayFormat;

	  if (opts && opts.arrayFormat in arrayPrefixGenerators) {
	    arrayFormat = opts.arrayFormat;
	  } else if (opts && 'indices' in opts) {
	    arrayFormat = opts.indices ? 'indices' : 'repeat';
	  } else {
	    arrayFormat = 'indices';
	  }

	  var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

	  if (!objKeys) {
	    objKeys = Object.keys(obj);
	  }

	  if (options.sort) {
	    objKeys.sort(options.sort);
	  }

	  for (var i = 0; i < objKeys.length; ++i) {
	    var key = objKeys[i];

	    if (options.skipNulls && obj[key] === null) {
	      continue;
	    }

	    pushToArray(keys, stringify(obj[key], key, generateArrayPrefix, options.strictNullHandling, options.skipNulls, options.encode ? options.encoder : null, options.filter, options.sort, options.allowDots, options.serializeDate, options.format, options.formatter, options.encodeValuesOnly, options.charset));
	  }

	  var joined = keys.join(options.delimiter);
	  var prefix = options.addQueryPrefix === true ? '?' : '';

	  if (options.charsetSentinel) {
	    if (options.charset === 'iso-8859-1') {
	      // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
	      prefix += 'utf8=%26%2310003%3B&';
	    } else {
	      // encodeURIComponent('✓')
	      prefix += 'utf8=%E2%9C%93&';
	    }
	  }

	  return joined.length > 0 ? prefix + joined : '';
	};

	var has$2 = Object.prototype.hasOwnProperty;
	var isArray$2 = Array.isArray;
	var defaults$1 = {
	  allowDots: false,
	  allowPrototypes: false,
	  arrayLimit: 20,
	  charset: 'utf-8',
	  charsetSentinel: false,
	  comma: false,
	  decoder: utils.decode,
	  delimiter: '&',
	  depth: 5,
	  ignoreQueryPrefix: false,
	  interpretNumericEntities: false,
	  parameterLimit: 1000,
	  parseArrays: true,
	  plainObjects: false,
	  strictNullHandling: false
	};

	var interpretNumericEntities = function (str) {
	  return str.replace(/&#(\d+);/g, function ($0, numberStr) {
	    return String.fromCharCode(parseInt(numberStr, 10));
	  });
	};

	var parseArrayValue = function (val, options) {
	  if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
	    return val.split(',');
	  }

	  return val;
	}; // This is what browsers will submit when the ✓ character occurs in an
	// application/x-www-form-urlencoded body and the encoding of the page containing
	// the form is iso-8859-1, or when the submitted form has an accept-charset
	// attribute of iso-8859-1. Presumably also with other charsets that do not contain
	// the ✓ character, such as us-ascii.


	var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')
	// These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.

	var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

	var parseValues = function parseQueryStringValues(str, options) {
	  var obj = {};
	  var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
	  var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
	  var parts = cleanStr.split(options.delimiter, limit);
	  var skipIndex = -1; // Keep track of where the utf8 sentinel was found

	  var i;
	  var charset = options.charset;

	  if (options.charsetSentinel) {
	    for (i = 0; i < parts.length; ++i) {
	      if (parts[i].indexOf('utf8=') === 0) {
	        if (parts[i] === charsetSentinel) {
	          charset = 'utf-8';
	        } else if (parts[i] === isoSentinel) {
	          charset = 'iso-8859-1';
	        }

	        skipIndex = i;
	        i = parts.length; // The eslint settings do not allow break;
	      }
	    }
	  }

	  for (i = 0; i < parts.length; ++i) {
	    if (i === skipIndex) {
	      continue;
	    }

	    var part = parts[i];
	    var bracketEqualsPos = part.indexOf(']=');
	    var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;
	    var key, val;

	    if (pos === -1) {
	      key = options.decoder(part, defaults$1.decoder, charset, 'key');
	      val = options.strictNullHandling ? null : '';
	    } else {
	      key = options.decoder(part.slice(0, pos), defaults$1.decoder, charset, 'key');
	      val = utils.maybeMap(parseArrayValue(part.slice(pos + 1), options), function (encodedVal) {
	        return options.decoder(encodedVal, defaults$1.decoder, charset, 'value');
	      });
	    }

	    if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
	      val = interpretNumericEntities(val);
	    }

	    if (part.indexOf('[]=') > -1) {
	      val = isArray$2(val) ? [val] : val;
	    }

	    if (has$2.call(obj, key)) {
	      obj[key] = utils.combine(obj[key], val);
	    } else {
	      obj[key] = val;
	    }
	  }

	  return obj;
	};

	var parseObject = function (chain, val, options, valuesParsed) {
	  var leaf = valuesParsed ? val : parseArrayValue(val, options);

	  for (var i = chain.length - 1; i >= 0; --i) {
	    var obj;
	    var root = chain[i];

	    if (root === '[]' && options.parseArrays) {
	      obj = [].concat(leaf);
	    } else {
	      obj = options.plainObjects ? Object.create(null) : {};
	      var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
	      var index = parseInt(cleanRoot, 10);

	      if (!options.parseArrays && cleanRoot === '') {
	        obj = {
	          0: leaf
	        };
	      } else if (!isNaN(index) && root !== cleanRoot && String(index) === cleanRoot && index >= 0 && options.parseArrays && index <= options.arrayLimit) {
	        obj = [];
	        obj[index] = leaf;
	      } else {
	        obj[cleanRoot] = leaf;
	      }
	    }

	    leaf = obj;
	  }

	  return leaf;
	};

	var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
	  if (!givenKey) {
	    return;
	  } // Transform dot notation to bracket notation


	  var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey; // The regex chunks

	  var brackets = /(\[[^[\]]*])/;
	  var child = /(\[[^[\]]*])/g; // Get the parent

	  var segment = options.depth > 0 && brackets.exec(key);
	  var parent = segment ? key.slice(0, segment.index) : key; // Stash the parent if it exists

	  var keys = [];

	  if (parent) {
	    // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
	    if (!options.plainObjects && has$2.call(Object.prototype, parent)) {
	      if (!options.allowPrototypes) {
	        return;
	      }
	    }

	    keys.push(parent);
	  } // Loop through children appending to the array until we hit depth


	  var i = 0;

	  while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
	    i += 1;

	    if (!options.plainObjects && has$2.call(Object.prototype, segment[1].slice(1, -1))) {
	      if (!options.allowPrototypes) {
	        return;
	      }
	    }

	    keys.push(segment[1]);
	  } // If there's a remainder, just add whatever is left


	  if (segment) {
	    keys.push('[' + key.slice(segment.index) + ']');
	  }

	  return parseObject(keys, val, options, valuesParsed);
	};

	var normalizeParseOptions = function normalizeParseOptions(opts) {
	  if (!opts) {
	    return defaults$1;
	  }

	  if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
	    throw new TypeError('Decoder has to be a function.');
	  }

	  if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
	    throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
	  }

	  var charset = typeof opts.charset === 'undefined' ? defaults$1.charset : opts.charset;
	  return {
	    allowDots: typeof opts.allowDots === 'undefined' ? defaults$1.allowDots : !!opts.allowDots,
	    allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults$1.allowPrototypes,
	    arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults$1.arrayLimit,
	    charset: charset,
	    charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults$1.charsetSentinel,
	    comma: typeof opts.comma === 'boolean' ? opts.comma : defaults$1.comma,
	    decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults$1.decoder,
	    delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults$1.delimiter,
	    // eslint-disable-next-line no-implicit-coercion, no-extra-parens
	    depth: typeof opts.depth === 'number' || opts.depth === false ? +opts.depth : defaults$1.depth,
	    ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
	    interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults$1.interpretNumericEntities,
	    parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults$1.parameterLimit,
	    parseArrays: opts.parseArrays !== false,
	    plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults$1.plainObjects,
	    strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults$1.strictNullHandling
	  };
	};

	var parse = function (str, opts) {
	  var options = normalizeParseOptions(opts);

	  if (str === '' || str === null || typeof str === 'undefined') {
	    return options.plainObjects ? Object.create(null) : {};
	  }

	  var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
	  var obj = options.plainObjects ? Object.create(null) : {}; // Iterate over the keys and setup the new object

	  var keys = Object.keys(tempObj);

	  for (var i = 0; i < keys.length; ++i) {
	    var key = keys[i];
	    var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
	    obj = utils.merge(obj, newObj, options);
	  }

	  return utils.compact(obj);
	};

	var lib$1 = {
	  formats: formats,
	  parse: parse,
	  stringify: stringify_1
	};

	function _classCallCheck(instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	}

	function _defineProperties(target, props) {
	  for (var i = 0; i < props.length; i++) {
	    var descriptor = props[i];
	    descriptor.enumerable = descriptor.enumerable || false;
	    descriptor.configurable = true;
	    if ("value" in descriptor) descriptor.writable = true;
	    Object.defineProperty(target, descriptor.key, descriptor);
	  }
	}

	function _createClass(Constructor, protoProps, staticProps) {
	  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
	  if (staticProps) _defineProperties(Constructor, staticProps);
	  return Constructor;
	}

	function _defineProperty$8(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	var defaultCreateURL = function defaultCreateURL(_ref) {
	  var qsModule = _ref.qsModule,
	      routeState = _ref.routeState,
	      location = _ref.location;
	  var protocol = location.protocol,
	      hostname = location.hostname,
	      _location$port = location.port,
	      port = _location$port === void 0 ? '' : _location$port,
	      pathname = location.pathname,
	      hash = location.hash;
	  var queryString = qsModule.stringify(routeState);
	  var portWithPrefix = port === '' ? '' : ":".concat(port); // IE <= 11 has no proper `location.origin` so we cannot rely on it.

	  if (!queryString) {
	    return "".concat(protocol, "//").concat(hostname).concat(portWithPrefix).concat(pathname).concat(hash);
	  }

	  return "".concat(protocol, "//").concat(hostname).concat(portWithPrefix).concat(pathname, "?").concat(queryString).concat(hash);
	};

	var defaultParseURL = function defaultParseURL(_ref2) {
	  var qsModule = _ref2.qsModule,
	      location = _ref2.location; // `qs` by default converts arrays with more than 20 items to an object.
	  // We want to avoid this because the data structure manipulated can therefore vary.
	  // Setting the limit to `100` seems a good number because the engine's default is 100
	  // (it can go up to 1000 but it is very unlikely to select more than 100 items in the UI).
	  //
	  // Using an `arrayLimit` of `n` allows `n + 1` items.
	  //
	  // See:
	  //   - https://github.com/ljharb/qs#parsing-arrays
	  //   - https://www.algolia.com/doc/api-reference/api-parameters/maxValuesPerFacet/

	  return qsModule.parse(location.search.slice(1), {
	    arrayLimit: 99
	  });
	};

	var setWindowTitle = function setWindowTitle(title) {
	  if (title) {
	    window.document.title = title;
	  }
	};

	var BrowserHistory = /*#__PURE__*/function () {
	  /**
	   * Initializes a new storage provider that syncs the search state to the URL
	   * using web APIs (`window.location.pushState` and `onpopstate` event).
	   */
	  function BrowserHistory() {
	    var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
	        windowTitle = _ref3.windowTitle,
	        _ref3$writeDelay = _ref3.writeDelay,
	        writeDelay = _ref3$writeDelay === void 0 ? 400 : _ref3$writeDelay,
	        _ref3$createURL = _ref3.createURL,
	        createURL = _ref3$createURL === void 0 ? defaultCreateURL : _ref3$createURL,
	        _ref3$parseURL = _ref3.parseURL,
	        parseURL = _ref3$parseURL === void 0 ? defaultParseURL : _ref3$parseURL;

	    _classCallCheck(this, BrowserHistory);

	    _defineProperty$8(this, "windowTitle", void 0);

	    _defineProperty$8(this, "writeDelay", void 0);

	    _defineProperty$8(this, "_createURL", void 0);

	    _defineProperty$8(this, "parseURL", void 0);

	    _defineProperty$8(this, "writeTimer", void 0);

	    this.windowTitle = windowTitle;
	    this.writeTimer = undefined;
	    this.writeDelay = writeDelay;
	    this._createURL = createURL;
	    this.parseURL = parseURL;
	    var title = this.windowTitle && this.windowTitle(this.read());
	    setWindowTitle(title);
	  }
	  /**
	   * Reads the URL and returns a syncable UI search state.
	   */


	  _createClass(BrowserHistory, [{
	    key: "read",
	    value: function read() {
	      return this.parseURL({
	        qsModule: lib$1,
	        location: window.location
	      });
	    }
	    /**
	     * Pushes a search state into the URL.
	     */

	  }, {
	    key: "write",
	    value: function write(routeState) {
	      var _this = this;

	      var url = this.createURL(routeState);
	      var title = this.windowTitle && this.windowTitle(routeState);

	      if (this.writeTimer) {
	        window.clearTimeout(this.writeTimer);
	      }

	      this.writeTimer = window.setTimeout(function () {
	        setWindowTitle(title);
	        window.history.pushState(routeState, title || '', url);
	        _this.writeTimer = undefined;
	      }, this.writeDelay);
	    }
	    /**
	     * Sets a callback on the `onpopstate` event of the history API of the current page.
	     * It enables the URL sync to keep track of the changes.
	     */

	  }, {
	    key: "onUpdate",
	    value: function onUpdate(callback) {
	      var _this2 = this;

	      this._onPopState = function (event) {
	        if (_this2.writeTimer) {
	          window.clearTimeout(_this2.writeTimer);
	          _this2.writeTimer = undefined;
	        }

	        var routeState = event.state; // At initial load, the state is read from the URL without update.
	        // Therefore the state object is not available.
	        // In this case, we fallback and read the URL.

	        if (!routeState) {
	          callback(_this2.read());
	        } else {
	          callback(routeState);
	        }
	      };

	      window.addEventListener('popstate', this._onPopState);
	    }
	    /**
	     * Creates a complete URL from a given syncable UI state.
	     *
	     * It always generates the full URL, not a relative one.
	     * This allows to handle cases like using a <base href>.
	     * See: https://github.com/algolia/instantsearch.js/issues/790
	     */

	  }, {
	    key: "createURL",
	    value: function createURL(routeState) {
	      return this._createURL({
	        qsModule: lib$1,
	        routeState: routeState,
	        location: window.location
	      });
	    }
	    /**
	     * Removes the event listener and cleans up the URL.
	     */

	  }, {
	    key: "dispose",
	    value: function dispose() {
	      if (this._onPopState) {
	        window.removeEventListener('popstate', this._onPopState);
	      }

	      if (this.writeTimer) {
	        window.clearTimeout(this.writeTimer);
	      }

	      this.write({});
	    }
	  }]);

	  return BrowserHistory;
	}();

	function historyRouter (props) {
	  return new BrowserHistory(props);
	}

	function ownKeys$8(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$8(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$8(Object(source), true).forEach(function (key) {
	        _defineProperty$9(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$8(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$9(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var createRouterMiddleware = function createRouterMiddleware() {
	  var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	  var _props$router = props.router,
	      router = _props$router === void 0 ? historyRouter() : _props$router,
	      _props$stateMapping = props.stateMapping,
	      stateMapping = _props$stateMapping === void 0 ? simpleStateMapping() : _props$stateMapping;
	  return function (_ref) {
	    var instantSearchInstance = _ref.instantSearchInstance;

	    function topLevelCreateURL(nextState) {
	      var uiState = Object.keys(nextState).reduce(function (acc, indexId) {
	        return _objectSpread$8({}, acc, _defineProperty$9({}, indexId, nextState[indexId]));
	      }, instantSearchInstance.mainIndex.getWidgetUiState({}));
	      var route = stateMapping.stateToRoute(uiState);
	      return router.createURL(route);
	    }

	    instantSearchInstance._createURL = topLevelCreateURL;
	    instantSearchInstance._initialUiState = _objectSpread$8({}, instantSearchInstance._initialUiState, {}, stateMapping.routeToState(router.read()));
	    var lastRouteState = undefined;
	    return {
	      onStateChange: function onStateChange(_ref2) {
	        var uiState = _ref2.uiState;
	        var routeState = stateMapping.stateToRoute(uiState);

	        if (lastRouteState === undefined || !isEqual(lastRouteState, routeState)) {
	          router.write(routeState);
	          lastRouteState = routeState;
	        }
	      },
	      subscribe: function subscribe() {
	        router.onUpdate(function (route) {
	          instantSearchInstance.setUiState(stateMapping.routeToState(route));
	        });
	      },
	      unsubscribe: function unsubscribe() {
	        router.dispose();
	      }
	    };
	  };
	};

	function _typeof$4(obj) {
	  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
	    _typeof$4 = function _typeof(obj) {
	      return typeof obj;
	    };
	  } else {
	    _typeof$4 = function _typeof(obj) {
	      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	    };
	  }

	  return _typeof$4(obj);
	}

	function _classCallCheck$1(instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	}

	function _defineProperties$1(target, props) {
	  for (var i = 0; i < props.length; i++) {
	    var descriptor = props[i];
	    descriptor.enumerable = descriptor.enumerable || false;
	    descriptor.configurable = true;
	    if ("value" in descriptor) descriptor.writable = true;
	    Object.defineProperty(target, descriptor.key, descriptor);
	  }
	}

	function _createClass$1(Constructor, protoProps, staticProps) {
	  if (protoProps) _defineProperties$1(Constructor.prototype, protoProps);
	  if (staticProps) _defineProperties$1(Constructor, staticProps);
	  return Constructor;
	}

	function _possibleConstructorReturn(self, call) {
	  if (call && (_typeof$4(call) === "object" || typeof call === "function")) {
	    return call;
	  }

	  return _assertThisInitialized(self);
	}

	function _getPrototypeOf(o) {
	  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
	    return o.__proto__ || Object.getPrototypeOf(o);
	  };
	  return _getPrototypeOf(o);
	}

	function _assertThisInitialized(self) {
	  if (self === void 0) {
	    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	  }

	  return self;
	}

	function _inherits(subClass, superClass) {
	  if (typeof superClass !== "function" && superClass !== null) {
	    throw new TypeError("Super expression must either be null or a function");
	  }

	  subClass.prototype = Object.create(superClass && superClass.prototype, {
	    constructor: {
	      value: subClass,
	      writable: true,
	      configurable: true
	    }
	  });
	  if (superClass) _setPrototypeOf(subClass, superClass);
	}

	function _setPrototypeOf(o, p) {
	  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
	    o.__proto__ = p;
	    return o;
	  };

	  return _setPrototypeOf(o, p);
	}

	function _defineProperty$a(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$1 = createDocumentationMessageGenerator({
	  name: 'instantsearch'
	});

	function defaultCreateURL$1() {
	  return '#';
	}
	/**
	 * Global options for an InstantSearch instance.
	 */

	/**
	 * The actual implementation of the InstantSearch. This is
	 * created using the `instantsearch` factory function.
	 * It emits the 'render' event every time a search is done
	 */


	var InstantSearch = /*#__PURE__*/function (_EventEmitter) {
	  _inherits(InstantSearch, _EventEmitter);

	  function InstantSearch(options) {
	    var _this;

	    _classCallCheck$1(this, InstantSearch);

	    _this = _possibleConstructorReturn(this, _getPrototypeOf(InstantSearch).call(this));

	    _defineProperty$a(_assertThisInitialized(_this), "client", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "indexName", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "insightsClient", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "onStateChange", null);

	    _defineProperty$a(_assertThisInitialized(_this), "helper", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "mainHelper", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "mainIndex", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "started", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "templatesConfig", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "renderState", {});

	    _defineProperty$a(_assertThisInitialized(_this), "_stalledSearchDelay", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "_searchStalledTimer", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "_isSearchStalled", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "_initialUiState", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "_createURL", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "_searchFunction", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "_mainHelperSearch", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "middleware", []);

	    _defineProperty$a(_assertThisInitialized(_this), "sendEventToInsights", void 0);

	    _defineProperty$a(_assertThisInitialized(_this), "scheduleSearch", defer(function () {
	      if (_this.started) {
	        _this.mainHelper.search();
	      }
	    }));

	    _defineProperty$a(_assertThisInitialized(_this), "scheduleRender", defer(function () {
	      if (!_this.mainHelper.hasPendingRequests()) {
	        clearTimeout(_this._searchStalledTimer);
	        _this._searchStalledTimer = null;
	        _this._isSearchStalled = false;
	      }

	      _this.mainIndex.render({
	        instantSearchInstance: _assertThisInitialized(_this)
	      });

	      _this.emit('render');
	    }));

	    _defineProperty$a(_assertThisInitialized(_this), "onInternalStateChange", function () {
	      var nextUiState = _this.mainIndex.getWidgetUiState({});

	      _this.middleware.forEach(function (m) {
	        m.onStateChange({
	          uiState: nextUiState
	        });
	      });
	    });

	    var _options$indexName = options.indexName,
	        indexName = _options$indexName === void 0 ? null : _options$indexName,
	        numberLocale = options.numberLocale,
	        _options$initialUiSta = options.initialUiState,
	        initialUiState = _options$initialUiSta === void 0 ? {} : _options$initialUiSta,
	        _options$routing = options.routing,
	        routing = _options$routing === void 0 ? null : _options$routing,
	        searchFunction = options.searchFunction,
	        _options$stalledSearc = options.stalledSearchDelay,
	        stalledSearchDelay = _options$stalledSearc === void 0 ? 200 : _options$stalledSearc,
	        _options$searchClient = options.searchClient,
	        searchClient = _options$searchClient === void 0 ? null : _options$searchClient,
	        _options$insightsClie = options.insightsClient,
	        insightsClient = _options$insightsClie === void 0 ? null : _options$insightsClie,
	        _options$onStateChang = options.onStateChange,
	        onStateChange = _options$onStateChang === void 0 ? null : _options$onStateChang;

	    if (indexName === null) {
	      throw new Error(withUsage$1('The `indexName` option is required.'));
	    }

	    if (searchClient === null) {
	      throw new Error(withUsage$1('The `searchClient` option is required.'));
	    }

	    if (typeof searchClient.search !== 'function') {
	      throw new Error("The `searchClient` must implement a `search` method.\n\nSee: https://www.algolia.com/doc/guides/building-search-ui/going-further/backend-search/in-depth/backend-instantsearch/js/");
	    }

	    if (typeof searchClient.addAlgoliaAgent === 'function') {
	      searchClient.addAlgoliaAgent("instantsearch.js (".concat(version$1, ")"));
	    }

	    "development".NODE_ENV === 'development' ? _warning(insightsClient === null, "`insightsClient` property has been deprecated. It is still supported in 4.x releases, but not further. It is replaced by the `insights` middleware.\n\nFor more information, visit https://www.algolia.com/doc/guides/getting-insights-and-analytics/search-analytics/click-through-and-conversions/how-to/send-click-and-conversion-events-with-instantsearch/js/") : void 0;

	    if (insightsClient && typeof insightsClient !== 'function') {
	      throw new Error(withUsage$1('The `insightsClient` option should be a function.'));
	    }

	    "development".NODE_ENV === 'development' ? _warning(!options.searchParameters, "The `searchParameters` option is deprecated and will not be supported in InstantSearch.js 4.x.\n\nYou can replace it with the `configure` widget:\n\n```\nsearch.addWidgets([\n  configure(".concat(JSON.stringify(options.searchParameters, null, 2), ")\n]);\n```\n\nSee ").concat(createDocumentationLink({
	      name: 'configure'
	    }))) : void 0;
	    _this.client = searchClient;
	    _this.insightsClient = insightsClient;
	    _this.indexName = indexName;
	    _this.helper = null;
	    _this.mainHelper = null;
	    _this.mainIndex = index({
	      indexName: indexName
	    });
	    _this.onStateChange = onStateChange;
	    _this.started = false;
	    _this.templatesConfig = {
	      helpers: hoganHelpers({
	        numberLocale: numberLocale
	      }),
	      compileOptions: {}
	    };
	    _this._stalledSearchDelay = stalledSearchDelay;
	    _this._searchStalledTimer = null;
	    _this._isSearchStalled = false;
	    _this._createURL = defaultCreateURL$1;
	    _this._initialUiState = initialUiState;

	    if (searchFunction) {
	      _this._searchFunction = searchFunction;
	    }

	    _this.sendEventToInsights = noop;

	    if (routing) {
	      var routerOptions = typeof routing === 'boolean' ? undefined : routing;

	      _this.use(createRouterMiddleware(routerOptions));
	    }

	    return _this;
	  }
	  /**
	   * Hooks a middleware into the InstantSearch lifecycle.
	   *
	   * This method is considered as experimental and is subject to change in
	   * minor versions.
	   */


	  _createClass$1(InstantSearch, [{
	    key: "use",
	    value: function use() {
	      var _this2 = this;

	      for (var _len = arguments.length, middleware = new Array(_len), _key = 0; _key < _len; _key++) {
	        middleware[_key] = arguments[_key];
	      }

	      var newMiddlewareList = middleware.map(function (fn) {
	        var newMiddleware = fn({
	          instantSearchInstance: _this2
	        });

	        _this2.middleware.push(newMiddleware);

	        return newMiddleware;
	      }); // If the instance has already started, we directly subscribe the
	      // middleware so they're notified of changes.

	      if (this.started) {
	        newMiddlewareList.forEach(function (m) {
	          m.subscribe();
	        });
	      }

	      return this;
	    } // @major we shipped with EXPERIMENTAL_use, but have changed that to just `use` now

	  }, {
	    key: "EXPERIMENTAL_use",
	    value: function EXPERIMENTAL_use() {
	      "development".NODE_ENV === 'development' ? _warning(false, 'The middleware API is now considered stable, so we recommend replacing `EXPERIMENTAL_use` with `use` before upgrading to the next major version.') : void 0;
	      return this.use.apply(this, arguments);
	    }
	    /**
	     * Adds a widget to the search instance.
	     * A widget can be added either before or after InstantSearch has started.
	     * @param widget The widget to add to InstantSearch.
	     *
	     * @deprecated This method will still be supported in 4.x releases, but not further. It is replaced by `addWidgets([widget])`.
	     */

	  }, {
	    key: "addWidget",
	    value: function addWidget(widget) {
	      "development".NODE_ENV === 'development' ? _warning(false, 'addWidget will still be supported in 4.x releases, but not further. It is replaced by `addWidgets([widget])`') : void 0;
	      return this.addWidgets([widget]);
	    }
	    /**
	     * Adds multiple widgets to the search instance.
	     * Widgets can be added either before or after InstantSearch has started.
	     * @param widgets The array of widgets to add to InstantSearch.
	     */

	  }, {
	    key: "addWidgets",
	    value: function addWidgets(widgets) {
	      if (!Array.isArray(widgets)) {
	        throw new Error(withUsage$1('The `addWidgets` method expects an array of widgets. Please use `addWidget`.'));
	      }

	      if (widgets.some(function (widget) {
	        return typeof widget.init !== 'function' && typeof widget.render !== 'function';
	      })) {
	        throw new Error(withUsage$1('The widget definition expects a `render` and/or an `init` method.'));
	      }

	      this.mainIndex.addWidgets(widgets);
	      return this;
	    }
	    /**
	     * Removes a widget from the search instance.
	     * @deprecated This method will still be supported in 4.x releases, but not further. It is replaced by `removeWidgets([widget])`
	     * @param widget The widget instance to remove from InstantSearch.
	     *
	     * The widget must implement a `dispose()` method to clear its state.
	     */

	  }, {
	    key: "removeWidget",
	    value: function removeWidget(widget) {
	      "development".NODE_ENV === 'development' ? _warning(false, 'removeWidget will still be supported in 4.x releases, but not further. It is replaced by `removeWidgets([widget])`') : void 0;
	      return this.removeWidgets([widget]);
	    }
	    /**
	     * Removes multiple widgets from the search instance.
	     * @param widgets Array of widgets instances to remove from InstantSearch.
	     *
	     * The widgets must implement a `dispose()` method to clear their states.
	     */

	  }, {
	    key: "removeWidgets",
	    value: function removeWidgets(widgets) {
	      if (!Array.isArray(widgets)) {
	        throw new Error(withUsage$1('The `removeWidgets` method expects an array of widgets. Please use `removeWidget`.'));
	      }

	      if (widgets.some(function (widget) {
	        return typeof widget.dispose !== 'function';
	      })) {
	        throw new Error(withUsage$1('The widget definition expects a `dispose` method.'));
	      }

	      this.mainIndex.removeWidgets(widgets);
	      return this;
	    }
	    /**
	     * Ends the initialization of InstantSearch.js and triggers the
	     * first search. This method should be called after all widgets have been added
	     * to the instance of InstantSearch.js. InstantSearch.js also supports adding and removing
	     * widgets after the start as an **EXPERIMENTAL** feature.
	     */

	  }, {
	    key: "start",
	    value: function start() {
	      var _this3 = this;

	      if (this.started) {
	        throw new Error(withUsage$1('The `start` method has already been called once.'));
	      } // This Helper is used for the queries, we don't care about its state. The
	      // states are managed at the `index` level. We use this Helper to create
	      // DerivedHelper scoped into the `index` widgets.


	      var mainHelper = algoliasearchHelper_1(this.client, this.indexName);

	      mainHelper.search = function () {
	        // This solution allows us to keep the exact same API for the users but
	        // under the hood, we have a different implementation. It should be
	        // completely transparent for the rest of the codebase. Only this module
	        // is impacted.
	        return mainHelper.searchOnlyWithDerivedHelpers();
	      };

	      if (this._searchFunction) {
	        // this client isn't used to actually search, but required for the helper
	        // to not throw errors
	        var fakeClient = {
	          search: function search() {
	            return new Promise(noop);
	          }
	        };
	        this._mainHelperSearch = mainHelper.search.bind(mainHelper);

	        mainHelper.search = function () {
	          var mainIndexHelper = _this3.mainIndex.getHelper();

	          var searchFunctionHelper = algoliasearchHelper_1(fakeClient, mainIndexHelper.state.index, mainIndexHelper.state);
	          searchFunctionHelper.once('search', function (_ref) {
	            var state = _ref.state;
	            mainIndexHelper.overrideStateWithoutTriggeringChangeEvent(state);

	            _this3._mainHelperSearch();
	          }); // Forward state changes from `searchFunctionHelper` to `mainIndexHelper`

	          searchFunctionHelper.on('change', function (_ref2) {
	            var state = _ref2.state;
	            mainIndexHelper.setState(state);
	          });

	          _this3._searchFunction(searchFunctionHelper);

	          return mainHelper;
	        };
	      } // Only the "main" Helper emits the `error` event vs the one for `search`
	      // and `results` that are also emitted on the derived one.


	      mainHelper.on('error', function (_ref3) {
	        var error = _ref3.error;

	        _this3.emit('error', {
	          error: error
	        });
	      });
	      this.mainHelper = mainHelper;
	      this.mainIndex.init({
	        instantSearchInstance: this,
	        parent: null,
	        uiState: this._initialUiState
	      });
	      this.middleware.forEach(function (m) {
	        m.subscribe();
	      });
	      mainHelper.search(); // Keep the previous reference for legacy purpose, some pattern use
	      // the direct Helper access `search.helper` (e.g multi-index).

	      this.helper = this.mainIndex.getHelper(); // track we started the search if we add more widgets,
	      // to init them directly after add

	      this.started = true;
	    }
	    /**
	     * Removes all widgets without triggering a search afterwards. This is an **EXPERIMENTAL** feature,
	     * if you find an issue with it, please
	     * [open an issue](https://github.com/algolia/instantsearch.js/issues/new?title=Problem%20with%20dispose).
	     * @return {undefined} This method does not return anything
	     */

	  }, {
	    key: "dispose",
	    value: function dispose() {
	      this.scheduleSearch.cancel();
	      this.scheduleRender.cancel();
	      clearTimeout(this._searchStalledTimer);
	      this.removeWidgets(this.mainIndex.getWidgets());
	      this.mainIndex.dispose(); // You can not start an instance two times, therefore a disposed instance
	      // needs to set started as false otherwise this can not be restarted at a
	      // later point.

	      this.started = false; // The helper needs to be reset to perform the next search from a fresh state.
	      // If not reset, it would use the state stored before calling `dispose()`.

	      this.removeAllListeners();
	      this.mainHelper.removeAllListeners();
	      this.mainHelper = null;
	      this.helper = null;
	      this.middleware.forEach(function (m) {
	        m.unsubscribe();
	      });
	    }
	  }, {
	    key: "scheduleStalledRender",
	    value: function scheduleStalledRender() {
	      var _this4 = this;

	      if (!this._searchStalledTimer) {
	        this._searchStalledTimer = setTimeout(function () {
	          _this4._isSearchStalled = true;

	          _this4.scheduleRender();
	        }, this._stalledSearchDelay);
	      }
	    }
	  }, {
	    key: "setUiState",
	    value: function setUiState(uiState) {
	      if (!this.mainHelper) {
	        throw new Error(withUsage$1('The `start` method needs to be called before `setUiState`.'));
	      } // We refresh the index UI state to update the local UI state that the
	      // main index passes to the function form of `setUiState`.


	      this.mainIndex.refreshUiState();
	      var nextUiState = typeof uiState === 'function' ? uiState(this.mainIndex.getWidgetUiState({})) : uiState;

	      var setIndexHelperState = function setIndexHelperState(indexWidget) {
	        if ("development".NODE_ENV === 'development') {
	          checkIndexUiState({
	            index: indexWidget,
	            indexUiState: nextUiState[indexWidget.getIndexId()]
	          });
	        }

	        indexWidget.getHelper().overrideStateWithoutTriggeringChangeEvent(indexWidget.getWidgetSearchParameters(indexWidget.getHelper().state, {
	          uiState: nextUiState[indexWidget.getIndexId()]
	        }));
	        indexWidget.getWidgets().filter(isIndexWidget).forEach(setIndexHelperState);
	      };

	      setIndexHelperState(this.mainIndex);
	      this.scheduleSearch();
	      this.onInternalStateChange();
	    }
	  }, {
	    key: "createURL",
	    value: function createURL() {
	      var nextState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	      if (!this.started) {
	        throw new Error(withUsage$1('The `start` method needs to be called before `createURL`.'));
	      }

	      return this._createURL(nextState);
	    }
	  }, {
	    key: "refresh",
	    value: function refresh() {
	      if (!this.mainHelper) {
	        throw new Error(withUsage$1('The `start` method needs to be called before `refresh`.'));
	      }

	      this.mainHelper.clearCache().search();
	    }
	  }]);

	  return InstantSearch;
	}(events);

	function _objectWithoutProperties$3(source, excluded) {
	  if (source == null) return {};

	  var target = _objectWithoutPropertiesLoose$4(source, excluded);

	  var key, i;

	  if (Object.getOwnPropertySymbols) {
	    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

	    for (i = 0; i < sourceSymbolKeys.length; i++) {
	      key = sourceSymbolKeys[i];
	      if (excluded.indexOf(key) >= 0) continue;
	      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
	      target[key] = source[key];
	    }
	  }

	  return target;
	}

	function _objectWithoutPropertiesLoose$4(source, excluded) {
	  if (source == null) return {};
	  var target = {};
	  var sourceKeys = Object.keys(source);
	  var key, i;

	  for (i = 0; i < sourceKeys.length; i++) {
	    key = sourceKeys[i];
	    if (excluded.indexOf(key) >= 0) continue;
	    target[key] = source[key];
	  }

	  return target;
	}

	function getStateWithoutPage(state) {
	  var _ref = state || {},
	      rest = _objectWithoutProperties$3(_ref, ["page"]);

	  return rest;
	}

	var KEY = 'ais.infiniteHits';

	function hasSessionStorage() {
	  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
	}

	function createInfiniteHitsSessionStorageCache() {
	  return {
	    read: function read(_ref2) {
	      var state = _ref2.state;

	      if (!hasSessionStorage()) {
	        return null;
	      }

	      try {
	        var cache = JSON.parse( // @ts-ignore JSON.parse() requires a string, but it actually accepts null, too.
	        window.sessionStorage.getItem(KEY));
	        return cache && isEqual(cache.state, getStateWithoutPage(state)) ? cache.hits : null;
	      } catch (error) {
	        if (error instanceof SyntaxError) {
	          try {
	            window.sessionStorage.removeItem(KEY);
	          } catch (err) {// do nothing
	          }
	        }

	        return null;
	      }
	    },
	    write: function write(_ref3) {
	      var state = _ref3.state,
	          hits = _ref3.hits;

	      if (!hasSessionStorage()) {
	        return;
	      }

	      try {
	        window.sessionStorage.setItem(KEY, JSON.stringify({
	          state: getStateWithoutPage(state),
	          hits: hits
	        }));
	      } catch (error) {// do nothing
	      }
	    }
	  };
	}

	var instantsearch = function instantsearch(options) {
	  return new InstantSearch(options);
	};

	instantsearch.version = version$1;
	instantsearch.snippet = snippet;
	instantsearch.reverseSnippet = reverseSnippet;
	instantsearch.highlight = highlight;
	instantsearch.reverseHighlight = reverseHighlight;
	instantsearch.insights = insights;
	instantsearch.getInsightsAnonymousUserToken = getInsightsAnonymousUserToken;
	instantsearch.createInfiniteHitsSessionStorageCache = createInfiniteHitsSessionStorageCache;
	Object.defineProperty(instantsearch, 'widgets', {
	  get: function get() {
	    throw new ReferenceError("\"instantsearch.widgets\" are not available from the ES build.\n\nTo import the widgets:\n\nimport { searchBox } from 'instantsearch.js/es/widgets'");
	  }
	});
	Object.defineProperty(instantsearch, 'connectors', {
	  get: function get() {
	    throw new ReferenceError("\"instantsearch.connectors\" are not available from the ES build.\n\nTo import the connectors:\n\nimport { connectSearchBox } from 'instantsearch.js/es/connectors'");
	  }
	});

	function _toConsumableArray$3(arr) {
	  return _arrayWithoutHoles$3(arr) || _iterableToArray$3(arr) || _nonIterableSpread$3();
	}

	function _nonIterableSpread$3() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance");
	}

	function _iterableToArray$3(iter) {
	  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
	}

	function _arrayWithoutHoles$3(arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
	      arr2[i] = arr[i];
	    }

	    return arr2;
	  }
	}

	function ownKeys$9(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$9(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$9(Object(source), true).forEach(function (key) {
	        _defineProperty$b(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$9(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$b(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$2 = createDocumentationMessageGenerator({
	  name: 'clear-refinements',
	  connector: true
	});

	var connectClearRefinements = function connectClearRefinements(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$2());
	  return function (widgetParams) {
	    var _ref = widgetParams || {},
	        _ref$includedAttribut = _ref.includedAttributes,
	        includedAttributes = _ref$includedAttribut === void 0 ? [] : _ref$includedAttribut,
	        _ref$excludedAttribut = _ref.excludedAttributes,
	        excludedAttributes = _ref$excludedAttribut === void 0 ? ['query'] : _ref$excludedAttribut,
	        _ref$transformItems = _ref.transformItems,
	        transformItems = _ref$transformItems === void 0 ? function (items) {
	      return items;
	    } : _ref$transformItems;

	    if (widgetParams.includedAttributes && widgetParams.excludedAttributes) {
	      throw new Error(withUsage$2('The options `includedAttributes` and `excludedAttributes` cannot be used together.'));
	    }

	    var connectorState = {
	      refine: noop,
	      createURL: function createURL() {
	        return '';
	      },
	      attributesToClear: []
	    };

	    var cachedRefine = function cachedRefine() {
	      return connectorState.refine();
	    };

	    var cachedCreateURL = function cachedCreateURL() {
	      return connectorState.createURL();
	    };

	    return {
	      $$type: 'ais.clearRefinements',
	      init: function init(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        renderFn(_objectSpread$9({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        renderFn(_objectSpread$9({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      dispose: function dispose() {
	        unmountFn();
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$9({}, renderState, {
	          clearRefinements: this.getWidgetRenderState(renderOptions)
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref2) {
	        var createURL = _ref2.createURL,
	            scopedResults = _ref2.scopedResults;
	        connectorState.attributesToClear = scopedResults.reduce(function (results, scopedResult) {
	          return results.concat(getAttributesToClear({
	            scopedResult: scopedResult,
	            includedAttributes: includedAttributes,
	            excludedAttributes: excludedAttributes,
	            transformItems: transformItems
	          }));
	        }, []);

	        connectorState.refine = function () {
	          connectorState.attributesToClear.forEach(function (_ref3) {
	            var indexHelper = _ref3.helper,
	                items = _ref3.items;
	            indexHelper.setState(clearRefinements({
	              helper: indexHelper,
	              attributesToClear: items
	            })).search();
	          });
	        };

	        connectorState.createURL = function () {
	          return createURL(merge$1.apply(void 0, _toConsumableArray$3(connectorState.attributesToClear.map(function (_ref4) {
	            var indexHelper = _ref4.helper,
	                items = _ref4.items;
	            return clearRefinements({
	              helper: indexHelper,
	              attributesToClear: items
	            });
	          }))));
	        };

	        return {
	          hasRefinements: connectorState.attributesToClear.some(function (attributeToClear) {
	            return attributeToClear.items.length > 0;
	          }),
	          refine: cachedRefine,
	          createURL: cachedCreateURL,
	          widgetParams: widgetParams
	        };
	      }
	    };
	  };
	};

	function getAttributesToClear(_ref5) {
	  var scopedResult = _ref5.scopedResult,
	      includedAttributes = _ref5.includedAttributes,
	      excludedAttributes = _ref5.excludedAttributes,
	      transformItems = _ref5.transformItems;
	  var clearsQuery = includedAttributes.indexOf('query') !== -1 || excludedAttributes.indexOf('query') === -1;
	  return {
	    helper: scopedResult.helper,
	    items: transformItems(uniq(getRefinements(scopedResult.results, scopedResult.helper.state, clearsQuery).map(function (refinement) {
	      return refinement.attribute;
	    }).filter(function (attribute) {
	      return (// If the array is empty (default case), we keep all the attributes
	        includedAttributes.length === 0 || // Otherwise, only add the specified attributes
	        includedAttributes.indexOf(attribute) !== -1
	      );
	    }).filter(function (attribute) {
	      return (// If the query is included, we ignore the default `excludedAttributes = ['query']`
	        attribute === 'query' && clearsQuery || // Otherwise, ignore the excluded attributes
	        excludedAttributes.indexOf(attribute) === -1
	      );
	    })))
	  };
	}

	function _toConsumableArray$4(arr) {
	  return _arrayWithoutHoles$4(arr) || _iterableToArray$4(arr) || _nonIterableSpread$4();
	}

	function _nonIterableSpread$4() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance");
	}

	function _iterableToArray$4(iter) {
	  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
	}

	function _arrayWithoutHoles$4(arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
	      arr2[i] = arr[i];
	    }

	    return arr2;
	  }
	}

	function ownKeys$a(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$a(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$a(Object(source), true).forEach(function (key) {
	        _defineProperty$c(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$a(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$c(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$3 = createDocumentationMessageGenerator({
	  name: 'current-refinements',
	  connector: true
	});

	var connectCurrentRefinements = function connectCurrentRefinements(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$3());
	  return function (widgetParams) {
	    if ((widgetParams || {}).includedAttributes && (widgetParams || {}).excludedAttributes) {
	      throw new Error(withUsage$3('The options `includedAttributes` and `excludedAttributes` cannot be used together.'));
	    }

	    var _ref = widgetParams || {},
	        includedAttributes = _ref.includedAttributes,
	        _ref$excludedAttribut = _ref.excludedAttributes,
	        excludedAttributes = _ref$excludedAttribut === void 0 ? ['query'] : _ref$excludedAttribut,
	        _ref$transformItems = _ref.transformItems,
	        transformItems = _ref$transformItems === void 0 ? function (items) {
	      return items;
	    } : _ref$transformItems;

	    return {
	      $$type: 'ais.currentRefinements',
	      init: function init(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        renderFn(_objectSpread$a({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        renderFn(_objectSpread$a({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      dispose: function dispose() {
	        unmountFn();
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$a({}, renderState, {
	          currentRefinements: this.getWidgetRenderState(renderOptions)
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref2) {
	        var results = _ref2.results,
	            scopedResults = _ref2.scopedResults,
	            _createURL = _ref2.createURL,
	            helper = _ref2.helper;

	        function getItems() {
	          if (!results) {
	            return transformItems(getRefinementsItems({
	              results: {},
	              helper: helper,
	              includedAttributes: includedAttributes,
	              excludedAttributes: excludedAttributes
	            }));
	          }

	          return scopedResults.reduce(function (accResults, scopedResult) {
	            return accResults.concat(transformItems(getRefinementsItems({
	              results: scopedResult.results,
	              helper: scopedResult.helper,
	              includedAttributes: includedAttributes,
	              excludedAttributes: excludedAttributes
	            })));
	          }, []);
	        }

	        return {
	          items: getItems(),
	          refine: function refine(refinement) {
	            return clearRefinement(helper, refinement);
	          },
	          createURL: function createURL(refinement) {
	            return _createURL(clearRefinementFromState(helper.state, refinement));
	          },
	          widgetParams: widgetParams
	        };
	      }
	    };
	  };
	};

	function getRefinementsItems(_ref3) {
	  var results = _ref3.results,
	      helper = _ref3.helper,
	      includedAttributes = _ref3.includedAttributes,
	      excludedAttributes = _ref3.excludedAttributes;
	  var clearsQuery = (includedAttributes || []).indexOf('query') !== -1 || (excludedAttributes || []).indexOf('query') === -1;
	  var filterFunction = includedAttributes ? function (item) {
	    return includedAttributes.indexOf(item.attribute) !== -1;
	  } : function (item) {
	    return excludedAttributes.indexOf(item.attribute) === -1;
	  };
	  var items = getRefinements(results, helper.state, clearsQuery).map(normalizeRefinement).filter(filterFunction);
	  return items.reduce(function (allItems, currentItem) {
	    return [].concat(_toConsumableArray$4(allItems.filter(function (item) {
	      return item.attribute !== currentItem.attribute;
	    })), [{
	      indexName: helper.state.index,
	      attribute: currentItem.attribute,
	      label: currentItem.attribute,
	      refinements: items.filter(function (result) {
	        return result.attribute === currentItem.attribute;
	      }) // We want to keep the order of refinements except the numeric ones.
	      .sort(function (a, b) {
	        return a.type === 'numeric' ? a.value - b.value : 0;
	      }),
	      refine: function refine(refinement) {
	        return clearRefinement(helper, refinement);
	      }
	    }]);
	  }, []);
	}

	function clearRefinementFromState(state, refinement) {
	  switch (refinement.type) {
	    case 'facet':
	      return state.removeFacetRefinement(refinement.attribute, String(refinement.value));

	    case 'disjunctive':
	      return state.removeDisjunctiveFacetRefinement(refinement.attribute, String(refinement.value));

	    case 'hierarchical':
	      return state.removeHierarchicalFacetRefinement(refinement.attribute);

	    case 'exclude':
	      return state.removeExcludeRefinement(refinement.attribute, String(refinement.value));

	    case 'numeric':
	      return state.removeNumericRefinement(refinement.attribute, refinement.operator, String(refinement.value));

	    case 'tag':
	      return state.removeTagRefinement(String(refinement.value));

	    case 'query':
	      return state.setQueryParameter('query', '');

	    default:
	      "development".NODE_ENV === 'development' ? _warning(false, "The refinement type \"".concat(refinement.type, "\" does not exist and cannot be cleared from the current refinements.")) : void 0;
	      return state;
	  }
	}

	function clearRefinement(helper, refinement) {
	  helper.setState(clearRefinementFromState(helper.state, refinement)).search();
	}

	function getOperatorSymbol(operator) {
	  switch (operator) {
	    case '>=':
	      return '≥';

	    case '<=':
	      return '≤';

	    default:
	      return operator;
	  }
	}

	function normalizeRefinement(refinement) {
	  var value = refinement.type === 'numeric' ? Number(refinement.name) : refinement.name;
	  var label = refinement.operator ? "".concat(getOperatorSymbol(refinement.operator), " ").concat(refinement.name) : refinement.name;
	  var normalizedRefinement = {
	    attribute: refinement.attribute,
	    type: refinement.type,
	    value: value,
	    label: label
	  };

	  if (refinement.operator !== undefined) {
	    normalizedRefinement.operator = refinement.operator;
	  }

	  if (refinement.count !== undefined) {
	    normalizedRefinement.count = refinement.count;
	  }

	  if (refinement.exhaustive !== undefined) {
	    normalizedRefinement.exhaustive = refinement.exhaustive;
	  }

	  return normalizedRefinement;
	}

	function _objectWithoutProperties$4(source, excluded) {
	  if (source == null) return {};

	  var target = _objectWithoutPropertiesLoose$5(source, excluded);

	  var key, i;

	  if (Object.getOwnPropertySymbols) {
	    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

	    for (i = 0; i < sourceSymbolKeys.length; i++) {
	      key = sourceSymbolKeys[i];
	      if (excluded.indexOf(key) >= 0) continue;
	      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
	      target[key] = source[key];
	    }
	  }

	  return target;
	}

	function _objectWithoutPropertiesLoose$5(source, excluded) {
	  if (source == null) return {};
	  var target = {};
	  var sourceKeys = Object.keys(source);
	  var key, i;

	  for (i = 0; i < sourceKeys.length; i++) {
	    key = sourceKeys[i];
	    if (excluded.indexOf(key) >= 0) continue;
	    target[key] = source[key];
	  }

	  return target;
	}

	function ownKeys$b(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$b(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$b(Object(source), true).forEach(function (key) {
	        _defineProperty$d(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$b(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$d(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	function _slicedToArray$2(arr, i) {
	  return _arrayWithHoles$2(arr) || _iterableToArrayLimit$2(arr, i) || _nonIterableRest$2();
	}

	function _nonIterableRest$2() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance");
	}

	function _iterableToArrayLimit$2(arr, i) {
	  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
	    return;
	  }

	  var _arr = [];
	  var _n = true;
	  var _d = false;
	  var _e = undefined;

	  try {
	    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	      _arr.push(_s.value);

	      if (i && _arr.length === i) break;
	    }
	  } catch (err) {
	    _d = true;
	    _e = err;
	  } finally {
	    try {
	      if (!_n && _i["return"] != null) _i["return"]();
	    } finally {
	      if (_d) throw _e;
	    }
	  }

	  return _arr;
	}

	function _arrayWithHoles$2(arr) {
	  if (Array.isArray(arr)) return arr;
	}
	var withUsage$4 = createDocumentationMessageGenerator({
	  name: 'hierarchical-menu',
	  connector: true
	});
	/**
	 * @typedef {Object} HierarchicalMenuItem
	 * @property {string} value Value of the menu item.
	 * @property {string} label Human-readable value of the menu item.
	 * @property {number} count Number of matched results after refinement is applied.
	 * @property {isRefined} boolean Indicates if the refinement is applied.
	 * @property {Object} [data = undefined] n+1 level of items, same structure HierarchicalMenuItem (default: `undefined`).
	 */

	/**
	 * @typedef {Object} CustomHierarchicalMenuWidgetOptions
	 * @property {string[]} attributes Attributes to use to generate the hierarchy of the menu.
	 * @property {string} [separator = '>'] Separator used in the attributes to separate level values.
	 * @property {string} [rootPath = null] Prefix path to use if the first level is not the root level.
	 * @property {boolean} [showParentLevel=false] Show the siblings of the selected parent levels of the current refined value. This
	 * does not impact the root level.
	 * @property {number} [limit = 10] Max number of values to display.
	 * @property {boolean} [showMore = false] Whether to display the "show more" button.
	 * @property {number} [showMoreLimit = 20] Max number of values to display when showing more.
	 * @property  {string[]|function} [sortBy = ['name:asc']] How to sort refinements. Possible values: `count|isRefined|name:asc|name:desc`.
	 *
	 * You can also use a sort function that behaves like the standard Javascript [compareFunction](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Syntax).
	 * @property {function(object[]):object[]} [transformItems] Function to transform the items passed to the templates.
	 */

	/**
	 * @typedef {Object} HierarchicalMenuRenderingOptions
	 * @property {function(item.value): string} createURL Creates an url for the next state for a clicked item.
	 * @property {HierarchicalMenuItem[]} items Values to be rendered.
	 * @property {function(item.value)} refine Sets the path of the hierarchical filter and triggers a new search.
	 * @property {Object} widgetParams All original `CustomHierarchicalMenuWidgetOptions` forwarded to the `renderFn`.
	 */

	/**
	 * **HierarchicalMenu** connector provides the logic to build a custom widget
	 * that will give the user the ability to explore facets in a tree-like structure.
	 *
	 * This is commonly used for multi-level categorization of products on e-commerce
	 * websites. From a UX point of view, we suggest not displaying more than two
	 * levels deep.
	 *
	 * @type {Connector}
	 * @param {function(HierarchicalMenuRenderingOptions, boolean)} renderFn Rendering function for the custom **HierarchicalMenu** widget.
	 * @param {function} unmountFn Unmount function called when the widget is disposed.
	 * @return {function(CustomHierarchicalMenuWidgetOptions)} Re-usable widget factory for a custom **HierarchicalMenu** widget.
	 */

	function connectHierarchicalMenu(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$4());
	  return function () {
	    var widgetParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    var attributes = widgetParams.attributes,
	        _widgetParams$separat = widgetParams.separator,
	        separator = _widgetParams$separat === void 0 ? ' > ' : _widgetParams$separat,
	        _widgetParams$rootPat = widgetParams.rootPath,
	        rootPath = _widgetParams$rootPat === void 0 ? null : _widgetParams$rootPat,
	        _widgetParams$showPar = widgetParams.showParentLevel,
	        showParentLevel = _widgetParams$showPar === void 0 ? true : _widgetParams$showPar,
	        _widgetParams$limit = widgetParams.limit,
	        limit = _widgetParams$limit === void 0 ? 10 : _widgetParams$limit,
	        _widgetParams$showMor = widgetParams.showMore,
	        showMore = _widgetParams$showMor === void 0 ? false : _widgetParams$showMor,
	        _widgetParams$showMor2 = widgetParams.showMoreLimit,
	        showMoreLimit = _widgetParams$showMor2 === void 0 ? 20 : _widgetParams$showMor2,
	        _widgetParams$sortBy = widgetParams.sortBy,
	        sortBy = _widgetParams$sortBy === void 0 ? ['name:asc'] : _widgetParams$sortBy,
	        _widgetParams$transfo = widgetParams.transformItems,
	        transformItems = _widgetParams$transfo === void 0 ? function (items) {
	      return items;
	    } : _widgetParams$transfo;

	    if (!attributes || !Array.isArray(attributes) || attributes.length === 0) {
	      throw new Error(withUsage$4('The `attributes` option expects an array of strings.'));
	    }

	    if (showMore === true && showMoreLimit <= limit) {
	      throw new Error(withUsage$4('The `showMoreLimit` option must be greater than `limit`.'));
	    } // we need to provide a hierarchicalFacet name for the search state
	    // so that we can always map $hierarchicalFacetName => real attributes
	    // we use the first attribute name


	    var _attributes = _slicedToArray$2(attributes, 1),
	        hierarchicalFacetName = _attributes[0];

	    var sendEvent; // Provide the same function to the `renderFn` so that way the user
	    // has to only bind it once when `isFirstRendering` for instance

	    var toggleShowMore = function toggleShowMore() {};

	    function cachedToggleShowMore() {
	      toggleShowMore();
	    }

	    return {
	      $$type: 'ais.hierarchicalMenu',
	      isShowingMore: false,
	      createToggleShowMore: function createToggleShowMore(renderOptions) {
	        var _this = this;

	        return function () {
	          _this.isShowingMore = !_this.isShowingMore;

	          _this.render(renderOptions);
	        };
	      },
	      getLimit: function getLimit() {
	        return this.isShowingMore ? showMoreLimit : limit;
	      },
	      init: function init(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        renderFn(_objectSpread$b({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      _prepareFacetValues: function _prepareFacetValues(facetValues) {
	        var _this2 = this;

	        return facetValues.slice(0, this.getLimit()).map(function (_ref) {
	          var label = _ref.name,
	              value = _ref.path,
	              subValue = _objectWithoutProperties$4(_ref, ["name", "path"]);

	          if (Array.isArray(subValue.data)) {
	            subValue.data = _this2._prepareFacetValues(subValue.data);
	          }

	          return _objectSpread$b({}, subValue, {
	            label: label,
	            value: value
	          });
	        });
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        toggleShowMore = this.createToggleShowMore(renderOptions);
	        renderFn(_objectSpread$b({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },

	      /**
	       * @param {Object} param0 cleanup arguments
	       * @param {any} param0.state current search parameters
	       * @returns {any} next search parameters
	       */
	      dispose: function dispose(_ref2) {
	        var state = _ref2.state;
	        unmountFn();
	        return state.removeHierarchicalFacet(hierarchicalFacetName).setQueryParameter('maxValuesPerFacet', undefined);
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$b({}, renderState, {
	          hierarchicalMenu: _objectSpread$b({}, renderState.hierarchicalMenu, _defineProperty$d({}, hierarchicalFacetName, this.getWidgetRenderState(renderOptions)))
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref3) {
	        var _this3 = this;

	        var results = _ref3.results,
	            state = _ref3.state,
	            createURL = _ref3.createURL,
	            instantSearchInstance = _ref3.instantSearchInstance,
	            helper = _ref3.helper; // Bind createURL to this specific attribute

	        function _createURL(facetValue) {
	          return createURL(state.toggleRefinement(hierarchicalFacetName, facetValue));
	        }

	        if (!sendEvent) {
	          sendEvent = createSendEventForFacet({
	            instantSearchInstance: instantSearchInstance,
	            helper: helper,
	            attribute: hierarchicalFacetName,
	            widgetType: this.$$type
	          });
	        }

	        if (!this._refine) {
	          this._refine = function (facetValue) {
	            sendEvent('click', facetValue);
	            helper.toggleRefinement(hierarchicalFacetName, facetValue).search();
	          };
	        }

	        var facetValues = results ? results.getFacetValues(hierarchicalFacetName, {
	          sortBy: sortBy
	        }).data || [] : [];
	        var items = transformItems(results ? this._prepareFacetValues(facetValues) : []);

	        var getHasExhaustiveItems = function getHasExhaustiveItems() {
	          if (!results) {
	            return false;
	          }

	          var currentLimit = _this3.getLimit(); // If the limit is the max number of facet retrieved it is impossible to know
	          // if the facets are exhaustive. The only moment we are sure it is exhaustive
	          // is when it is strictly under the number requested unless we know that another
	          // widget has requested more values (maxValuesPerFacet > getLimit()).
	          // Because this is used for making the search of facets unable or not, it is important
	          // to be conservative here.


	          return state.maxValuesPerFacet > currentLimit ? facetValues.length <= currentLimit : facetValues.length < currentLimit;
	        };

	        return {
	          items: items,
	          refine: this._refine,
	          createURL: _createURL,
	          sendEvent: sendEvent,
	          widgetParams: widgetParams,
	          isShowingMore: this.isShowingMore,
	          toggleShowMore: cachedToggleShowMore,
	          canToggleShowMore: showMore && (this.isShowingMore || !getHasExhaustiveItems())
	        };
	      },
	      getWidgetUiState: function getWidgetUiState(uiState, _ref4) {
	        var searchParameters = _ref4.searchParameters;
	        var path = searchParameters.getHierarchicalFacetBreadcrumb(hierarchicalFacetName);

	        if (!path.length) {
	          return uiState;
	        }

	        return _objectSpread$b({}, uiState, {
	          hierarchicalMenu: _objectSpread$b({}, uiState.hierarchicalMenu, _defineProperty$d({}, hierarchicalFacetName, path))
	        });
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref5) {
	        var uiState = _ref5.uiState;
	        var values = uiState.hierarchicalMenu && uiState.hierarchicalMenu[hierarchicalFacetName];

	        if (searchParameters.isHierarchicalFacet(hierarchicalFacetName)) {
	          var facet = searchParameters.getHierarchicalFacetByName(hierarchicalFacetName);
	          "development".NODE_ENV === 'development' ? _warning(isEqual(facet.attributes, attributes) && facet.separator === separator && facet.rootPath === rootPath, 'Using Breadcrumb and HierarchicalMenu on the same facet with different options overrides the configuration of the HierarchicalMenu.') : void 0;
	        }

	        var withFacetConfiguration = searchParameters.removeHierarchicalFacet(hierarchicalFacetName).addHierarchicalFacet({
	          name: hierarchicalFacetName,
	          attributes: attributes,
	          separator: separator,
	          rootPath: rootPath,
	          showParentLevel: showParentLevel
	        });
	        var currentMaxValuesPerFacet = withFacetConfiguration.maxValuesPerFacet || 0;
	        var nextMaxValuesPerFacet = Math.max(currentMaxValuesPerFacet, showMore ? showMoreLimit : limit);
	        var withMaxValuesPerFacet = withFacetConfiguration.setQueryParameter('maxValuesPerFacet', nextMaxValuesPerFacet);

	        if (!values) {
	          return withMaxValuesPerFacet.setQueryParameters({
	            hierarchicalFacetsRefinements: _objectSpread$b({}, withMaxValuesPerFacet.hierarchicalFacetsRefinements, _defineProperty$d({}, hierarchicalFacetName, []))
	          });
	        }

	        return withMaxValuesPerFacet.addHierarchicalFacetRefinement(hierarchicalFacetName, values.join(separator));
	      }
	    };
	  };
	}

	function ownKeys$c(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$c(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$c(Object(source), true).forEach(function (key) {
	        _defineProperty$e(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$c(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$e(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$5 = createDocumentationMessageGenerator({
	  name: 'hits',
	  connector: true
	});

	var connectHits = function connectHits(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$5());
	  return function (widgetParams) {
	    var _ref = widgetParams || {},
	        _ref$escapeHTML = _ref.escapeHTML,
	        escapeHTML = _ref$escapeHTML === void 0 ? true : _ref$escapeHTML,
	        _ref$transformItems = _ref.transformItems,
	        transformItems = _ref$transformItems === void 0 ? function (items) {
	      return items;
	    } : _ref$transformItems;

	    var sendEvent;
	    var bindEvent;
	    return {
	      $$type: 'ais.hits',
	      init: function init(initOptions) {
	        renderFn(_objectSpread$c({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: initOptions.instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var renderState = this.getWidgetRenderState(renderOptions);
	        renderState.sendEvent('view', renderState.hits);
	        renderFn(_objectSpread$c({}, renderState, {
	          instantSearchInstance: renderOptions.instantSearchInstance
	        }), false);
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$c({}, renderState, {
	          hits: this.getWidgetRenderState(renderOptions)
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref2) {
	        var results = _ref2.results,
	            helper = _ref2.helper,
	            instantSearchInstance = _ref2.instantSearchInstance;

	        if (!sendEvent) {
	          sendEvent = createSendEventForHits({
	            instantSearchInstance: instantSearchInstance,
	            index: helper.getIndex(),
	            widgetType: this.$$type
	          });
	        }

	        if (!bindEvent) {
	          bindEvent = createBindEventForHits({
	            index: helper.getIndex(),
	            widgetType: this.$$type
	          });
	        }

	        if (!results) {
	          return {
	            hits: [],
	            results: undefined,
	            sendEvent: sendEvent,
	            bindEvent: bindEvent,
	            widgetParams: widgetParams
	          };
	        }

	        if (escapeHTML && results.hits.length > 0) {
	          results.hits = escapeHits(results.hits);
	        }

	        var initialEscaped = results.hits.__escaped;
	        results.hits = addAbsolutePosition(results.hits, results.page, results.hitsPerPage);
	        results.hits = addQueryID(results.hits, results.queryID);
	        results.hits = transformItems(results.hits); // Make sure the escaped tag stays, even after mapping over the hits.
	        // This prevents the hits from being double-escaped if there are multiple
	        // hits widgets mounted on the page.

	        results.hits.__escaped = initialEscaped;
	        return {
	          hits: results.hits,
	          results: results,
	          sendEvent: sendEvent,
	          bindEvent: bindEvent,
	          widgetParams: widgetParams
	        };
	      },
	      dispose: function dispose(_ref3) {
	        var state = _ref3.state;
	        unmountFn();

	        if (!escapeHTML) {
	          return state;
	        }

	        return state.setQueryParameters(Object.keys(TAG_PLACEHOLDER).reduce(function (acc, key) {
	          return _objectSpread$c({}, acc, _defineProperty$e({}, key, undefined));
	        }, {}));
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(state) {
	        if (!escapeHTML) {
	          return state;
	        }

	        return state.setQueryParameters(TAG_PLACEHOLDER);
	      }
	    };
	  };
	};

	function ownKeys$d(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$d(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$d(Object(source), true).forEach(function (key) {
	        _defineProperty$f(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$d(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$f(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	var getSelectedHits = function getSelectedHits(hits, selectedObjectIDs) {
	  return selectedObjectIDs.map(function (objectID) {
	    var hit = find$1(hits, function (h) {
	      return h.objectID === objectID;
	    });

	    if (typeof hit === 'undefined') {
	      throw new Error("Could not find objectID \"".concat(objectID, "\" passed to `clickedObjectIDsAfterSearch` in the returned hits. This is necessary to infer the absolute position and the query ID."));
	    }

	    return hit;
	  });
	};

	var getQueryID = function getQueryID(selectedHits) {
	  var queryIDs = uniq(selectedHits.map(function (hit) {
	    return hit.__queryID;
	  }));

	  if (queryIDs.length > 1) {
	    throw new Error('Insights currently allows a single `queryID`. The `objectIDs` provided map to multiple `queryID`s.');
	  }

	  var queryID = queryIDs[0];

	  if (typeof queryID !== 'string') {
	    throw new Error("Could not infer `queryID`. Ensure InstantSearch `clickAnalytics: true` was added with the Configure widget.\n\nSee: https://alg.li/lNiZZ7");
	  }

	  return queryID;
	};

	var getPositions = function getPositions(selectedHits) {
	  return selectedHits.map(function (hit) {
	    return hit.__position;
	  });
	};

	var inferPayload = function inferPayload(_ref) {
	  var method = _ref.method,
	      results = _ref.results,
	      hits = _ref.hits,
	      objectIDs = _ref.objectIDs;
	  var index = results.index;
	  var selectedHits = getSelectedHits(hits, objectIDs);
	  var queryID = getQueryID(selectedHits);

	  switch (method) {
	    case 'clickedObjectIDsAfterSearch':
	      {
	        var positions = getPositions(selectedHits);
	        return {
	          index: index,
	          queryID: queryID,
	          objectIDs: objectIDs,
	          positions: positions
	        };
	      }

	    case 'convertedObjectIDsAfterSearch':
	      return {
	        index: index,
	        queryID: queryID,
	        objectIDs: objectIDs
	      };

	    default:
	      throw new Error("Unsupported method passed to insights: \"".concat(method, "\"."));
	  }
	};

	var wrapInsightsClient = function wrapInsightsClient(aa, results, hits) {
	  return function (method, payload) {
	    "development".NODE_ENV === 'development' ? _warning(false, "`insights` function has been deprecated. It is still supported in 4.x releases, but not further. It is replaced by the `insights` middleware.\n\nFor more information, visit https://www.algolia.com/doc/guides/getting-insights-and-analytics/search-analytics/click-through-and-conversions/how-to/send-click-and-conversion-events-with-instantsearch/js/") : void 0;

	    if (!aa) {
	      var withInstantSearchUsage = createDocumentationMessageGenerator({
	        name: 'instantsearch'
	      });
	      throw new Error(withInstantSearchUsage('The `insightsClient` option has not been provided to `instantsearch`.'));
	    }

	    if (!Array.isArray(payload.objectIDs)) {
	      throw new TypeError('Expected `objectIDs` to be an array.');
	    }

	    var inferredPayload = inferPayload({
	      method: method,
	      results: results,
	      hits: hits,
	      objectIDs: payload.objectIDs
	    });
	    aa(method, _objectSpread$d({}, inferredPayload, {}, payload));
	  };
	};
	/**
	 * @deprecated This function will be still supported in 4.x releases, but not further. It is replaced by the `insights` middleware. For more information, visit https://www.algolia.com/doc/guides/getting-insights-and-analytics/search-analytics/click-through-and-conversions/how-to/send-click-and-conversion-events-with-instantsearch/js/
	 * It passes `insights` to `HitsWithInsightsListener` and `InfiniteHitsWithInsightsListener`.
	 */


	function withInsights(connector) {
	  var wrapRenderFn = function wrapRenderFn(renderFn) {
	    return function (renderOptions, isFirstRender) {
	      var results = renderOptions.results,
	          hits = renderOptions.hits,
	          instantSearchInstance = renderOptions.instantSearchInstance;

	      if (results && hits && instantSearchInstance) {
	        var insights = wrapInsightsClient(instantSearchInstance.insightsClient, results, hits);
	        return renderFn(_objectSpread$d({}, renderOptions, {
	          insights: insights
	        }), isFirstRender);
	      }

	      return renderFn(renderOptions, isFirstRender);
	    };
	  };

	  return function (renderFn, unmountFn) {
	    return connector(wrapRenderFn(renderFn), unmountFn);
	  };
	}

	var connectHitsWithInsights = withInsights(connectHits);

	function _toConsumableArray$5(arr) {
	  return _arrayWithoutHoles$5(arr) || _iterableToArray$5(arr) || _nonIterableSpread$5();
	}

	function _nonIterableSpread$5() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance");
	}

	function _iterableToArray$5(iter) {
	  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
	}

	function _arrayWithoutHoles$5(arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
	      arr2[i] = arr[i];
	    }

	    return arr2;
	  }
	}

	function ownKeys$e(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$e(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$e(Object(source), true).forEach(function (key) {
	        _defineProperty$g(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$e(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$g(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$6 = createDocumentationMessageGenerator({
	  name: 'hits-per-page',
	  connector: true
	});

	var connectHitsPerPage = function connectHitsPerPage(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$6());
	  return function (widgetParams) {
	    var _ref = widgetParams || {},
	        userItems = _ref.items,
	        _ref$transformItems = _ref.transformItems,
	        transformItems = _ref$transformItems === void 0 ? function (items) {
	      return items;
	    } : _ref$transformItems;

	    var items = userItems;

	    if (!Array.isArray(items)) {
	      throw new Error(withUsage$6('The `items` option expects an array of objects.'));
	    }

	    var defaultItems = items.filter(function (item) {
	      return item.default === true;
	    });

	    if (defaultItems.length === 0) {
	      throw new Error(withUsage$6("A default value must be specified in `items`."));
	    }

	    if (defaultItems.length > 1) {
	      throw new Error(withUsage$6('More than one default value is specified in `items`.'));
	    }

	    var defaultItem = defaultItems[0];

	    var normalizeItems = function normalizeItems(_ref2) {
	      var hitsPerPage = _ref2.hitsPerPage;
	      return items.map(function (item) {
	        return _objectSpread$e({}, item, {
	          isRefined: Number(item.value) === Number(hitsPerPage)
	        });
	      });
	    };

	    var connectorState = {
	      getRefine: function getRefine(helper) {
	        return function (value) {
	          return !value && value !== 0 ? helper.setQueryParameter('hitsPerPage', undefined).search() : helper.setQueryParameter('hitsPerPage', value).search();
	        };
	      },
	      createURLFactory: function createURLFactory(_ref3) {
	        var state = _ref3.state,
	            createURL = _ref3.createURL;
	        return function (value) {
	          return createURL(state.setQueryParameter('hitsPerPage', !value && value !== 0 ? undefined : value));
	        };
	      }
	    };
	    return {
	      $$type: 'ais.hitsPerPage',
	      init: function init(initOptions) {
	        var state = initOptions.state,
	            instantSearchInstance = initOptions.instantSearchInstance;
	        var isCurrentInOptions = items.some(function (item) {
	          return Number(state.hitsPerPage) === Number(item.value);
	        });

	        if (!isCurrentInOptions) {
	          "development".NODE_ENV === 'development' ? _warning(state.hitsPerPage !== undefined, "\n`hitsPerPage` is not defined.\nThe option `hitsPerPage` needs to be set using the `configure` widget.\n\nLearn more: https://www.algolia.com/doc/api-reference/widgets/hits-per-page/js/\n            ") : void 0;
	          "development".NODE_ENV === 'development' ? _warning(false, "\nThe `items` option of `hitsPerPage` does not contain the \"hits per page\" value coming from the state: ".concat(state.hitsPerPage, ".\n\nYou may want to add another entry to the `items` option with this value.")) : void 0;
	          items = [// The helper will convert the empty string to `undefined`.
	          {
	            value: '',
	            label: ''
	          }].concat(_toConsumableArray$5(items));
	        }

	        renderFn(_objectSpread$e({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        renderFn(_objectSpread$e({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      dispose: function dispose(_ref4) {
	        var state = _ref4.state;
	        unmountFn();
	        return state.setQueryParameter('hitsPerPage', undefined);
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$e({}, renderState, {
	          hitsPerPage: this.getWidgetRenderState(renderOptions)
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref5) {
	        var state = _ref5.state,
	            results = _ref5.results,
	            createURL = _ref5.createURL,
	            helper = _ref5.helper;
	        return {
	          items: transformItems(normalizeItems(state)),
	          refine: connectorState.getRefine(helper),
	          createURL: connectorState.createURLFactory({
	            state: state,
	            createURL: createURL
	          }),
	          hasNoResults: results ? results.nbHits === 0 : true,
	          widgetParams: widgetParams
	        };
	      },
	      getWidgetUiState: function getWidgetUiState(uiState, _ref6) {
	        var searchParameters = _ref6.searchParameters;
	        var hitsPerPage = searchParameters.hitsPerPage;

	        if (hitsPerPage === undefined || hitsPerPage === defaultItem.value) {
	          return uiState;
	        }

	        return _objectSpread$e({}, uiState, {
	          hitsPerPage: hitsPerPage
	        });
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref7) {
	        var uiState = _ref7.uiState;
	        return searchParameters.setQueryParameters({
	          hitsPerPage: uiState.hitsPerPage || defaultItem.value
	        });
	      }
	    };
	  };
	};

	function ownKeys$f(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$f(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$f(Object(source), true).forEach(function (key) {
	        _defineProperty$h(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$f(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$h(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	function _toConsumableArray$6(arr) {
	  return _arrayWithoutHoles$6(arr) || _iterableToArray$6(arr) || _nonIterableSpread$6();
	}

	function _nonIterableSpread$6() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance");
	}

	function _iterableToArray$6(iter) {
	  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
	}

	function _arrayWithoutHoles$6(arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
	      arr2[i] = arr[i];
	    }

	    return arr2;
	  }
	}

	function _objectWithoutProperties$5(source, excluded) {
	  if (source == null) return {};

	  var target = _objectWithoutPropertiesLoose$6(source, excluded);

	  var key, i;

	  if (Object.getOwnPropertySymbols) {
	    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

	    for (i = 0; i < sourceSymbolKeys.length; i++) {
	      key = sourceSymbolKeys[i];
	      if (excluded.indexOf(key) >= 0) continue;
	      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
	      target[key] = source[key];
	    }
	  }

	  return target;
	}

	function _objectWithoutPropertiesLoose$6(source, excluded) {
	  if (source == null) return {};
	  var target = {};
	  var sourceKeys = Object.keys(source);
	  var key, i;

	  for (i = 0; i < sourceKeys.length; i++) {
	    key = sourceKeys[i];
	    if (excluded.indexOf(key) >= 0) continue;
	    target[key] = source[key];
	  }

	  return target;
	}
	var withUsage$7 = createDocumentationMessageGenerator({
	  name: 'infinite-hits',
	  connector: true
	});

	function getStateWithoutPage$1(state) {
	  var _ref = state || {},
	      rest = _objectWithoutProperties$5(_ref, ["page"]);

	  return rest;
	}

	function getInMemoryCache() {
	  var cachedHits = null;
	  var cachedState = undefined;
	  return {
	    read: function read(_ref2) {
	      var state = _ref2.state;
	      return isEqual(cachedState, getStateWithoutPage$1(state)) ? cachedHits : null;
	    },
	    write: function write(_ref3) {
	      var state = _ref3.state,
	          hits = _ref3.hits;
	      cachedState = getStateWithoutPage$1(state);
	      cachedHits = hits;
	    }
	  };
	}

	function extractHitsFromCachedHits(cachedHits) {
	  return Object.keys(cachedHits).map(Number).sort(function (a, b) {
	    return a - b;
	  }).reduce(function (acc, page) {
	    return acc.concat(cachedHits[page]);
	  }, []);
	}

	var connectInfiniteHits = function connectInfiniteHits(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$7());
	  return function (widgetParams) {
	    var _ref4 = widgetParams || {},
	        _ref4$escapeHTML = _ref4.escapeHTML,
	        escapeHTML = _ref4$escapeHTML === void 0 ? true : _ref4$escapeHTML,
	        _ref4$transformItems = _ref4.transformItems,
	        transformItems = _ref4$transformItems === void 0 ? function (items) {
	      return items;
	    } : _ref4$transformItems,
	        _ref4$cache = _ref4.cache,
	        cache = _ref4$cache === void 0 ? getInMemoryCache() : _ref4$cache;

	    var showPrevious;
	    var showMore;
	    var sendEvent;
	    var bindEvent;

	    var getFirstReceivedPage = function getFirstReceivedPage(state, cachedHits) {
	      var _state$page = state.page,
	          page = _state$page === void 0 ? 0 : _state$page;
	      var pages = Object.keys(cachedHits).map(Number);

	      if (pages.length === 0) {
	        return page;
	      } else {
	        return Math.min.apply(Math, [page].concat(_toConsumableArray$6(pages)));
	      }
	    };

	    var getLastReceivedPage = function getLastReceivedPage(state, cachedHits) {
	      var _state$page2 = state.page,
	          page = _state$page2 === void 0 ? 0 : _state$page2;
	      var pages = Object.keys(cachedHits).map(Number);

	      if (pages.length === 0) {
	        return page;
	      } else {
	        return Math.max.apply(Math, [page].concat(_toConsumableArray$6(pages)));
	      }
	    };

	    var getShowPrevious = function getShowPrevious(helper, cachedHits) {
	      return function () {
	        // Using the helper's `overrideStateWithoutTriggeringChangeEvent` method
	        // avoid updating the browser URL when the user displays the previous page.
	        helper.overrideStateWithoutTriggeringChangeEvent(_objectSpread$f({}, helper.state, {
	          page: getFirstReceivedPage(helper.state, cachedHits) - 1
	        })).searchWithoutTriggeringOnStateChange();
	      };
	    };

	    var getShowMore = function getShowMore(helper, cachedHits) {
	      return function () {
	        helper.setPage(getLastReceivedPage(helper.state, cachedHits) + 1).search();
	      };
	    };

	    return {
	      $$type: 'ais.infiniteHits',
	      init: function init(initOptions) {
	        renderFn(_objectSpread$f({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: initOptions.instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        var widgetRenderState = this.getWidgetRenderState(renderOptions);
	        sendEvent('view', widgetRenderState.currentPageHits);
	        renderFn(_objectSpread$f({}, widgetRenderState, {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$f({}, renderState, {
	          infiniteHits: this.getWidgetRenderState(renderOptions)
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref5) {
	        var results = _ref5.results,
	            helper = _ref5.helper,
	            state = _ref5.state,
	            instantSearchInstance = _ref5.instantSearchInstance;
	        var isFirstPage;
	        var currentPageHits = [];
	        var cachedHits = cache.read({
	          state: state
	        }) || {};

	        if (!results) {
	          showPrevious = getShowPrevious(helper, cachedHits);
	          showMore = getShowMore(helper, cachedHits);
	          sendEvent = createSendEventForHits({
	            instantSearchInstance: instantSearchInstance,
	            index: helper.getIndex(),
	            widgetType: this.$$type
	          });
	          bindEvent = createBindEventForHits({
	            index: helper.getIndex(),
	            widgetType: this.$$type
	          });
	          isFirstPage = helper.state.page === undefined || getFirstReceivedPage(helper.state, cachedHits) === 0;
	        } else {
	          var _state$page3 = state.page,
	              _page = _state$page3 === void 0 ? 0 : _state$page3;

	          if (escapeHTML && results.hits.length > 0) {
	            results.hits = escapeHits(results.hits);
	          }

	          var initialEscaped = results.hits.__escaped;
	          results.hits = addAbsolutePosition(results.hits, results.page, results.hitsPerPage);
	          results.hits = addQueryID(results.hits, results.queryID);
	          results.hits = transformItems(results.hits); // Make sure the escaped tag stays after mapping over the hits.
	          // This prevents the hits from being double-escaped if there are multiple
	          // hits widgets mounted on the page.

	          results.hits.__escaped = initialEscaped;

	          if (cachedHits[_page] === undefined) {
	            cachedHits[_page] = results.hits;
	            cache.write({
	              state: state,
	              hits: cachedHits
	            });
	          }

	          currentPageHits = results.hits;
	          isFirstPage = getFirstReceivedPage(state, cachedHits) === 0;
	        }

	        var hits = extractHitsFromCachedHits(cachedHits);
	        var isLastPage = results ? results.nbPages <= getLastReceivedPage(state, cachedHits) + 1 : true;
	        return {
	          hits: hits,
	          currentPageHits: currentPageHits,
	          sendEvent: sendEvent,
	          bindEvent: bindEvent,
	          results: results,
	          showPrevious: showPrevious,
	          showMore: showMore,
	          isFirstPage: isFirstPage,
	          isLastPage: isLastPage,
	          widgetParams: widgetParams
	        };
	      },
	      dispose: function dispose(_ref6) {
	        var state = _ref6.state;
	        unmountFn();
	        var stateWithoutPage = state.setQueryParameter('page', undefined);

	        if (!escapeHTML) {
	          return stateWithoutPage;
	        }

	        return stateWithoutPage.setQueryParameters(Object.keys(TAG_PLACEHOLDER).reduce(function (acc, key) {
	          return _objectSpread$f({}, acc, _defineProperty$h({}, key, undefined));
	        }, {}));
	      },
	      getWidgetUiState: function getWidgetUiState(uiState, _ref7) {
	        var searchParameters = _ref7.searchParameters;
	        var page = searchParameters.page || 0;

	        if (!page) {
	          // return without adding `page` to uiState
	          // because we don't want `page=1` in the URL
	          return uiState;
	        }

	        return _objectSpread$f({}, uiState, {
	          // The page in the UI state is incremented by one
	          // to expose the user value (not `0`).
	          page: page + 1
	        });
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref8) {
	        var uiState = _ref8.uiState;
	        var widgetSearchParameters = searchParameters;

	        if (escapeHTML) {
	          widgetSearchParameters = searchParameters.setQueryParameters(TAG_PLACEHOLDER);
	        } // The page in the search parameters is decremented by one
	        // to get to the actual parameter value from the UI state.


	        var page = uiState.page ? uiState.page - 1 : 0;
	        return widgetSearchParameters.setQueryParameter('page', page);
	      }
	    };
	  };
	};

	var connectInfiniteHitsWithInsights = withInsights(connectInfiniteHits);

	function _objectWithoutProperties$6(source, excluded) {
	  if (source == null) return {};

	  var target = _objectWithoutPropertiesLoose$7(source, excluded);

	  var key, i;

	  if (Object.getOwnPropertySymbols) {
	    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

	    for (i = 0; i < sourceSymbolKeys.length; i++) {
	      key = sourceSymbolKeys[i];
	      if (excluded.indexOf(key) >= 0) continue;
	      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
	      target[key] = source[key];
	    }
	  }

	  return target;
	}

	function _objectWithoutPropertiesLoose$7(source, excluded) {
	  if (source == null) return {};
	  var target = {};
	  var sourceKeys = Object.keys(source);
	  var key, i;

	  for (i = 0; i < sourceKeys.length; i++) {
	    key = sourceKeys[i];
	    if (excluded.indexOf(key) >= 0) continue;
	    target[key] = source[key];
	  }

	  return target;
	}

	function _slicedToArray$3(arr, i) {
	  return _arrayWithHoles$3(arr) || _iterableToArrayLimit$3(arr, i) || _nonIterableRest$3();
	}

	function _nonIterableRest$3() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance");
	}

	function _iterableToArrayLimit$3(arr, i) {
	  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
	    return;
	  }

	  var _arr = [];
	  var _n = true;
	  var _d = false;
	  var _e = undefined;

	  try {
	    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	      _arr.push(_s.value);

	      if (i && _arr.length === i) break;
	    }
	  } catch (err) {
	    _d = true;
	    _e = err;
	  } finally {
	    try {
	      if (!_n && _i["return"] != null) _i["return"]();
	    } finally {
	      if (_d) throw _e;
	    }
	  }

	  return _arr;
	}

	function _arrayWithHoles$3(arr) {
	  if (Array.isArray(arr)) return arr;
	}

	function ownKeys$g(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$g(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$g(Object(source), true).forEach(function (key) {
	        _defineProperty$i(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$g(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$i(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$8 = createDocumentationMessageGenerator({
	  name: 'menu',
	  connector: true
	});
	/**
	 * @typedef {Object} MenuItem
	 * @property {string} value The value of the menu item.
	 * @property {string} label Human-readable value of the menu item.
	 * @property {number} count Number of results matched after refinement is applied.
	 * @property {boolean} isRefined Indicates if the refinement is applied.
	 */

	/**
	 * @typedef {Object} CustomMenuWidgetOptions
	 * @property {string} attribute Name of the attribute for faceting (eg. "free_shipping").
	 * @property {number} [limit = 10] How many facets values to retrieve.
	 * @property {boolean} [showMore = false] Whether to display a button that expands the number of items.
	 * @property {number} [showMoreLimit = 20] How many facets values to retrieve when `toggleShowMore` is called, this value is meant to be greater than `limit` option.
	 * @property {string[]|function} [sortBy = ['isRefined', 'name:asc']] How to sort refinements. Possible values: `count|isRefined|name:asc|name:desc`.
	 *
	 * You can also use a sort function that behaves like the standard Javascript [compareFunction](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Syntax).
	 * @property {function(object[]):object[]} [transformItems] Function to transform the items passed to the templates.
	 */

	/**
	 * @typedef {Object} MenuRenderingOptions
	 * @property {MenuItem[]} items The elements that can be refined for the current search results.
	 * @property {function(item.value): string} createURL Creates the URL for a single item name in the list.
	 * @property {function(item.value)} refine Filter the search to item value.
	 * @property {boolean} canRefine True if refinement can be applied.
	 * @property {Object} widgetParams All original `CustomMenuWidgetOptions` forwarded to the `renderFn`.
	 * @property {boolean} isShowingMore True if the menu is displaying all the menu items.
	 * @property {function} toggleShowMore Toggles the number of values displayed between `limit` and `showMore.limit`.
	 * @property {boolean} canToggleShowMore `true` if the toggleShowMore button can be activated (enough items to display more or
	 * already displaying more than `limit` items)
	 */

	/**
	 * **Menu** connector provides the logic to build a widget that will give the user the ability to choose a single value for a specific facet. The typical usage of menu is for navigation in categories.
	 *
	 * This connector provides a `toggleShowMore()` function to display more or less items and a `refine()`
	 * function to select an item. While selecting a new element, the `refine` will also unselect the
	 * one that is currently selected.
	 *
	 * **Requirement:** the attribute passed as `attribute` must be present in "attributes for faceting" on the Algolia dashboard or configured as attributesForFaceting via a set settings call to the Algolia API.
	 * @type {Connector}
	 * @param {function(MenuRenderingOptions, boolean)} renderFn Rendering function for the custom **Menu** widget. widget.
	 * @param {function} unmountFn Unmount function called when the widget is disposed.
	 * @return {function(CustomMenuWidgetOptions)} Re-usable widget factory for a custom **Menu** widget.
	 * @example
	 * // custom `renderFn` to render the custom Menu widget
	 * function renderFn(MenuRenderingOptions, isFirstRendering) {
	 *   if (isFirstRendering) {
	 *     MenuRenderingOptions.widgetParams.containerNode
	 *       .html('<select></select');
	 *
	 *     MenuRenderingOptions.widgetParams.containerNode
	 *       .find('select')
	 *       .on('change', function(event) {
	 *         MenuRenderingOptions.refine(event.target.value);
	 *       });
	 *   }
	 *
	 *   var options = MenuRenderingOptions.items.map(function(item) {
	 *     return item.isRefined
	 *       ? '<option value="' + item.value + '" selected>' + item.label + '</option>'
	 *       : '<option value="' + item.value + '">' + item.label + '</option>';
	 *   });
	 *
	 *   MenuRenderingOptions.widgetParams.containerNode
	 *     .find('select')
	 *     .html(options);
	 * }
	 *
	 * // connect `renderFn` to Menu logic
	 * var customMenu = instantsearch.connectors.connectMenu(renderFn);
	 *
	 * // mount widget on the page
	 * search.addWidgets([
	 *   customMenu({
	 *     containerNode: $('#custom-menu-container'),
	 *     attribute: 'categories',
	 *     limit: 10,
	 *   })
	 * ]);
	 */

	function connectMenu(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$8());
	  return function () {
	    var widgetParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    var attribute = widgetParams.attribute,
	        _widgetParams$limit = widgetParams.limit,
	        limit = _widgetParams$limit === void 0 ? 10 : _widgetParams$limit,
	        _widgetParams$showMor = widgetParams.showMore,
	        showMore = _widgetParams$showMor === void 0 ? false : _widgetParams$showMor,
	        _widgetParams$showMor2 = widgetParams.showMoreLimit,
	        showMoreLimit = _widgetParams$showMor2 === void 0 ? 20 : _widgetParams$showMor2,
	        _widgetParams$sortBy = widgetParams.sortBy,
	        sortBy = _widgetParams$sortBy === void 0 ? ['isRefined', 'name:asc'] : _widgetParams$sortBy,
	        _widgetParams$transfo = widgetParams.transformItems,
	        transformItems = _widgetParams$transfo === void 0 ? function (items) {
	      return items;
	    } : _widgetParams$transfo;

	    if (!attribute) {
	      throw new Error(withUsage$8('The `attribute` option is required.'));
	    }

	    if (showMore === true && showMoreLimit <= limit) {
	      throw new Error(withUsage$8('The `showMoreLimit` option must be greater than `limit`.'));
	    }

	    var sendEvent; // Provide the same function to the `renderFn` so that way the user
	    // has to only bind it once when `isFirstRendering` for instance

	    var toggleShowMore = function toggleShowMore() {};

	    function cachedToggleShowMore() {
	      toggleShowMore();
	    }

	    return {
	      $$type: 'ais.menu',
	      isShowingMore: false,
	      createToggleShowMore: function createToggleShowMore(_ref) {
	        var _this = this;

	        var results = _ref.results,
	            instantSearchInstance = _ref.instantSearchInstance;
	        return function () {
	          _this.isShowingMore = !_this.isShowingMore;

	          _this.render({
	            results: results,
	            instantSearchInstance: instantSearchInstance
	          });
	        };
	      },
	      getLimit: function getLimit() {
	        return this.isShowingMore ? showMoreLimit : limit;
	      },
	      init: function init(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        renderFn(_objectSpread$g({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        renderFn(_objectSpread$g({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      dispose: function dispose(_ref2) {
	        var state = _ref2.state;
	        unmountFn();
	        return state.removeHierarchicalFacet(attribute).setQueryParameter('maxValuesPerFacet', undefined);
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$g({}, renderState, {
	          menu: this.getWidgetRenderState(renderOptions)
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref3) {
	        var results = _ref3.results,
	            createURL = _ref3.createURL,
	            instantSearchInstance = _ref3.instantSearchInstance,
	            helper = _ref3.helper;
	        var items = [];
	        var canToggleShowMore = false;

	        if (!sendEvent) {
	          sendEvent = createSendEventForFacet({
	            instantSearchInstance: instantSearchInstance,
	            helper: helper,
	            attribute: attribute,
	            widgetType: this.$$type
	          });
	        }

	        if (!this._createURL) {
	          this._createURL = function (facetValue) {
	            return createURL(helper.state.toggleRefinement(attribute, facetValue));
	          };
	        }

	        if (!this._refine) {
	          this._refine = function (facetValue) {
	            var _helper$getHierarchic = helper.getHierarchicalFacetBreadcrumb(attribute),
	                _helper$getHierarchic2 = _slicedToArray$3(_helper$getHierarchic, 1),
	                refinedItem = _helper$getHierarchic2[0];

	            sendEvent('click', facetValue ? facetValue : refinedItem);
	            helper.toggleRefinement(attribute, facetValue ? facetValue : refinedItem).search();
	          };
	        }

	        toggleShowMore = this.createToggleShowMore({
	          results: results,
	          instantSearchInstance: instantSearchInstance
	        });

	        if (results) {
	          var facetValues = results.getFacetValues(attribute, {
	            sortBy: sortBy
	          });
	          var facetItems = facetValues && facetValues.data ? facetValues.data : [];
	          canToggleShowMore = showMore && (this.isShowingMore || facetItems.length > this.getLimit());
	          items = transformItems(facetItems.slice(0, this.getLimit()).map(function (_ref4) {
	            var label = _ref4.name,
	                value = _ref4.path,
	                item = _objectWithoutProperties$6(_ref4, ["name", "path"]);

	            return _objectSpread$g({}, item, {
	              label: label,
	              value: value
	            });
	          }));
	        }

	        return {
	          items: items,
	          createURL: this._createURL,
	          refine: this._refine,
	          sendEvent: sendEvent,
	          canRefine: items.length > 0,
	          widgetParams: widgetParams,
	          isShowingMore: this.isShowingMore,
	          toggleShowMore: cachedToggleShowMore,
	          canToggleShowMore: canToggleShowMore
	        };
	      },
	      getWidgetUiState: function getWidgetUiState(uiState, _ref5) {
	        var searchParameters = _ref5.searchParameters;

	        var _searchParameters$get = searchParameters.getHierarchicalFacetBreadcrumb(attribute),
	            _searchParameters$get2 = _slicedToArray$3(_searchParameters$get, 1),
	            value = _searchParameters$get2[0];

	        if (!value) {
	          return uiState;
	        }

	        return _objectSpread$g({}, uiState, {
	          menu: _objectSpread$g({}, uiState.menu, _defineProperty$i({}, attribute, value))
	        });
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref6) {
	        var uiState = _ref6.uiState;
	        var value = uiState.menu && uiState.menu[attribute];
	        var withFacetConfiguration = searchParameters.removeHierarchicalFacet(attribute).addHierarchicalFacet({
	          name: attribute,
	          attributes: [attribute]
	        });
	        var currentMaxValuesPerFacet = withFacetConfiguration.maxValuesPerFacet || 0;
	        var nextMaxValuesPerFacet = Math.max(currentMaxValuesPerFacet, showMore ? showMoreLimit : limit);
	        var withMaxValuesPerFacet = withFacetConfiguration.setQueryParameter('maxValuesPerFacet', nextMaxValuesPerFacet);

	        if (!value) {
	          return withMaxValuesPerFacet.setQueryParameters({
	            hierarchicalFacetsRefinements: _objectSpread$g({}, withMaxValuesPerFacet.hierarchicalFacetsRefinements, _defineProperty$i({}, attribute, []))
	          });
	        }

	        return withMaxValuesPerFacet.addHierarchicalFacetRefinement(attribute, value);
	      }
	    };
	  };
	}

	function _slicedToArray$4(arr, i) {
	  return _arrayWithHoles$4(arr) || _iterableToArrayLimit$4(arr, i) || _nonIterableRest$4();
	}

	function _nonIterableRest$4() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance");
	}

	function _iterableToArrayLimit$4(arr, i) {
	  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
	    return;
	  }

	  var _arr = [];
	  var _n = true;
	  var _d = false;
	  var _e = undefined;

	  try {
	    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	      _arr.push(_s.value);

	      if (i && _arr.length === i) break;
	    }
	  } catch (err) {
	    _d = true;
	    _e = err;
	  } finally {
	    try {
	      if (!_n && _i["return"] != null) _i["return"]();
	    } finally {
	      if (_d) throw _e;
	    }
	  }

	  return _arr;
	}

	function _arrayWithHoles$4(arr) {
	  if (Array.isArray(arr)) return arr;
	}

	function ownKeys$h(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$h(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$h(Object(source), true).forEach(function (key) {
	        _defineProperty$j(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$h(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$j(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$9 = createDocumentationMessageGenerator({
	  name: 'numeric-menu',
	  connector: true
	});
	var $$type = 'ais.numericMenu';

	var createSendEvent = function createSendEvent(_ref) {
	  var instantSearchInstance = _ref.instantSearchInstance,
	      helper = _ref.helper,
	      attribute = _ref.attribute;
	  return function () {
	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }

	    if (args.length === 1) {
	      instantSearchInstance.sendEventToInsights(args[0]);
	      return;
	    }

	    var eventType = args[0],
	        facetValue = args[1],
	        _args$ = args[2],
	        eventName = _args$ === void 0 ? 'Filter Applied' : _args$;

	    if (eventType !== 'click') {
	      return;
	    } // facetValue === "%7B%22start%22:5,%22end%22:10%7D"


	    var filters = convertNumericRefinementsToFilters(getRefinedState(helper.state, attribute, facetValue), attribute);

	    if (filters && filters.length > 0) {
	      /*
	          filters === ["price<=10", "price>=5"]
	        */
	      instantSearchInstance.sendEventToInsights({
	        insightsMethod: 'clickedFilters',
	        widgetType: $$type,
	        eventType: eventType,
	        payload: {
	          eventName: eventName,
	          index: helper.getIndex(),
	          filters: filters
	        }
	      });
	    }
	  };
	};

	var connectNumericMenu = function connectNumericMenu(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$9());
	  return function (widgetParams) {
	    var _ref2 = widgetParams || {},
	        _ref2$attribute = _ref2.attribute,
	        attribute = _ref2$attribute === void 0 ? '' : _ref2$attribute,
	        _ref2$items = _ref2.items,
	        items = _ref2$items === void 0 ? [] : _ref2$items,
	        _ref2$transformItems = _ref2.transformItems,
	        transformItems = _ref2$transformItems === void 0 ? function (x) {
	      return x;
	    } : _ref2$transformItems;

	    if (attribute === '') {
	      throw new Error(withUsage$9('The `attribute` option is required.'));
	    }

	    if (!items || items.length === 0) {
	      throw new Error(withUsage$9('The `items` option expects an array of objects.'));
	    }

	    var prepareItems = function prepareItems(state) {
	      return items.map(function (_ref3) {
	        var start = _ref3.start,
	            end = _ref3.end,
	            label = _ref3.label;
	        return {
	          label: label,
	          value: window.encodeURI(JSON.stringify({
	            start: start,
	            end: end
	          })),
	          isRefined: isRefined(state, attribute, {
	            start: start,
	            end: end,
	            label: label
	          })
	        };
	      });
	    };

	    var connectorState = {};
	    return {
	      $$type: $$type,
	      init: function init(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        renderFn(_objectSpread$h({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        renderFn(_objectSpread$h({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      dispose: function dispose(_ref4) {
	        var state = _ref4.state;
	        unmountFn();
	        return state.clearRefinements(attribute);
	      },
	      getWidgetUiState: function getWidgetUiState(uiState, _ref5) {
	        var searchParameters = _ref5.searchParameters;
	        var values = searchParameters.getNumericRefinements(attribute);
	        var equal = values['='] && values['='][0];

	        if (equal || equal === 0) {
	          return _objectSpread$h({}, uiState, {
	            numericMenu: _objectSpread$h({}, uiState.numericMenu, _defineProperty$j({}, attribute, "".concat(values['='])))
	          });
	        }

	        var min = values['>='] && values['>='][0] || '';
	        var max = values['<='] && values['<='][0] || '';

	        if (min === '' && max === '') {
	          return uiState;
	        }

	        return _objectSpread$h({}, uiState, {
	          numericMenu: _objectSpread$h({}, uiState.numericMenu, _defineProperty$j({}, attribute, "".concat(min, ":").concat(max)))
	        });
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref6) {
	        var uiState = _ref6.uiState;
	        var value = uiState.numericMenu && uiState.numericMenu[attribute];
	        var withoutRefinements = searchParameters.clearRefinements(attribute);

	        if (!value) {
	          return withoutRefinements.setQueryParameters({
	            numericRefinements: _objectSpread$h({}, withoutRefinements.numericRefinements, _defineProperty$j({}, attribute, {}))
	          });
	        }

	        var isExact = value.indexOf(':') === -1;

	        if (isExact) {
	          return withoutRefinements.addNumericRefinement(attribute, '=', Number(value));
	        }

	        var _value$split$map = value.split(':').map(parseFloat),
	            _value$split$map2 = _slicedToArray$4(_value$split$map, 2),
	            min = _value$split$map2[0],
	            max = _value$split$map2[1];

	        var withMinRefinement = isFiniteNumber(min) ? withoutRefinements.addNumericRefinement(attribute, '>=', min) : withoutRefinements;
	        var withMaxRefinement = isFiniteNumber(max) ? withMinRefinement.addNumericRefinement(attribute, '<=', max) : withMinRefinement;
	        return withMaxRefinement;
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$h({}, renderState, {
	          numericMenu: _objectSpread$h({}, renderState.numericMenu, _defineProperty$j({}, attribute, this.getWidgetRenderState(renderOptions)))
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref7) {
	        var results = _ref7.results,
	            state = _ref7.state,
	            instantSearchInstance = _ref7.instantSearchInstance,
	            helper = _ref7.helper,
	            createURL = _ref7.createURL;

	        if (!connectorState.refine) {
	          connectorState.refine = function (facetValue) {
	            var refinedState = getRefinedState(helper.state, attribute, facetValue);
	            connectorState.sendEvent('click', facetValue);
	            helper.setState(refinedState).search();
	          };
	        }

	        if (!connectorState.createURL) {
	          connectorState.createURL = function (newState) {
	            return function (facetValue) {
	              return createURL(getRefinedState(newState, attribute, facetValue));
	            };
	          };
	        }

	        if (!connectorState.sendEvent) {
	          connectorState.sendEvent = createSendEvent({
	            instantSearchInstance: instantSearchInstance,
	            helper: helper,
	            attribute: attribute
	          });
	        }

	        return {
	          createURL: connectorState.createURL(state),
	          items: transformItems(prepareItems(state)),
	          hasNoResults: results ? results.nbHits === 0 : true,
	          refine: connectorState.refine,
	          sendEvent: connectorState.sendEvent,
	          widgetParams: widgetParams
	        };
	      }
	    };
	  };
	};

	function isRefined(state, attribute, option) {
	  // @TODO: same as another spot, why is this mixing arrays & elements?
	  var currentRefinements = state.getNumericRefinements(attribute);

	  if (option.start !== undefined && option.end !== undefined) {
	    if (option.start === option.end) {
	      return hasNumericRefinement(currentRefinements, '=', option.start);
	    }
	  }

	  if (option.start !== undefined) {
	    return hasNumericRefinement(currentRefinements, '>=', option.start);
	  }

	  if (option.end !== undefined) {
	    return hasNumericRefinement(currentRefinements, '<=', option.end);
	  }

	  if (option.start === undefined && option.end === undefined) {
	    return Object.keys(currentRefinements).every(function (operator) {
	      return (currentRefinements[operator] || []).length === 0;
	    });
	  }

	  return false;
	}

	function getRefinedState(state, attribute, facetValue) {
	  var resolvedState = state;
	  var refinedOption = JSON.parse(window.decodeURI(facetValue)); // @TODO: why is array / element mixed here & hasRefinements; seems wrong?

	  var currentRefinements = resolvedState.getNumericRefinements(attribute);

	  if (refinedOption.start === undefined && refinedOption.end === undefined) {
	    return resolvedState.removeNumericRefinement(attribute);
	  }

	  if (!isRefined(resolvedState, attribute, refinedOption)) {
	    resolvedState = resolvedState.removeNumericRefinement(attribute);
	  }

	  if (refinedOption.start !== undefined && refinedOption.end !== undefined) {
	    if (refinedOption.start > refinedOption.end) {
	      throw new Error('option.start should be > to option.end');
	    }

	    if (refinedOption.start === refinedOption.end) {
	      if (hasNumericRefinement(currentRefinements, '=', refinedOption.start)) {
	        resolvedState = resolvedState.removeNumericRefinement(attribute, '=', refinedOption.start);
	      } else {
	        resolvedState = resolvedState.addNumericRefinement(attribute, '=', refinedOption.start);
	      }

	      return resolvedState;
	    }
	  }

	  if (refinedOption.start !== undefined) {
	    if (hasNumericRefinement(currentRefinements, '>=', refinedOption.start)) {
	      resolvedState = resolvedState.removeNumericRefinement(attribute, '>=', refinedOption.start);
	    } else {
	      resolvedState = resolvedState.addNumericRefinement(attribute, '>=', refinedOption.start);
	    }
	  }

	  if (refinedOption.end !== undefined) {
	    if (hasNumericRefinement(currentRefinements, '<=', refinedOption.end)) {
	      resolvedState = resolvedState.removeNumericRefinement(attribute, '<=', refinedOption.end);
	    } else {
	      resolvedState = resolvedState.addNumericRefinement(attribute, '<=', refinedOption.end);
	    }
	  }

	  if (typeof resolvedState.page === 'number') {
	    resolvedState.page = 0;
	  }

	  return resolvedState;
	}

	function hasNumericRefinement(currentRefinements, operator, value) {
	  return currentRefinements[operator] !== undefined && currentRefinements[operator].includes(value);
	}

	function _classCallCheck$2(instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	}

	function _defineProperties$2(target, props) {
	  for (var i = 0; i < props.length; i++) {
	    var descriptor = props[i];
	    descriptor.enumerable = descriptor.enumerable || false;
	    descriptor.configurable = true;
	    if ("value" in descriptor) descriptor.writable = true;
	    Object.defineProperty(target, descriptor.key, descriptor);
	  }
	}

	function _createClass$2(Constructor, protoProps, staticProps) {
	  if (protoProps) _defineProperties$2(Constructor.prototype, protoProps);
	  if (staticProps) _defineProperties$2(Constructor, staticProps);
	  return Constructor;
	}

	function _defineProperty$k(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	var Paginator = /*#__PURE__*/function () {
	  function Paginator(params) {
	    _classCallCheck$2(this, Paginator);

	    _defineProperty$k(this, "currentPage", void 0);

	    _defineProperty$k(this, "total", void 0);

	    _defineProperty$k(this, "padding", void 0);

	    this.currentPage = params.currentPage;
	    this.total = params.total;
	    this.padding = params.padding;
	  }

	  _createClass$2(Paginator, [{
	    key: "pages",
	    value: function pages() {
	      var total = this.total,
	          currentPage = this.currentPage,
	          padding = this.padding;
	      if (total === 0) return [0];
	      var totalDisplayedPages = this.nbPagesDisplayed(padding, total);

	      if (totalDisplayedPages === total) {
	        return range({
	          end: total
	        });
	      }

	      var paddingLeft = this.calculatePaddingLeft(currentPage, padding, total, totalDisplayedPages);
	      var paddingRight = totalDisplayedPages - paddingLeft;
	      var first = currentPage - paddingLeft;
	      var last = currentPage + paddingRight;
	      return range({
	        start: first,
	        end: last
	      });
	    }
	  }, {
	    key: "nbPagesDisplayed",
	    value: function nbPagesDisplayed(padding, total) {
	      return Math.min(2 * padding + 1, total);
	    }
	  }, {
	    key: "calculatePaddingLeft",
	    value: function calculatePaddingLeft(current, padding, total, totalDisplayedPages) {
	      if (current <= padding) {
	        return current;
	      }

	      if (current >= total - padding) {
	        return totalDisplayedPages - (total - current);
	      }

	      return padding;
	    }
	  }, {
	    key: "isLastPage",
	    value: function isLastPage() {
	      return this.currentPage === this.total - 1 || this.total === 0;
	    }
	  }, {
	    key: "isFirstPage",
	    value: function isFirstPage() {
	      return this.currentPage === 0;
	    }
	  }]);

	  return Paginator;
	}();

	function ownKeys$i(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$i(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$i(Object(source), true).forEach(function (key) {
	        _defineProperty$l(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$i(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$l(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$a = createDocumentationMessageGenerator({
	  name: 'pagination',
	  connector: true
	});
	/**
	 * **Pagination** connector provides the logic to build a widget that will let the user
	 * choose the current page of the results.
	 *
	 * When using the pagination with Algolia, you should be aware that the engine won't provide you pages
	 * beyond the 1000th hits by default. You can find more information on the [Algolia documentation](https://www.algolia.com/doc/guides/searching/pagination/#pagination-limitations).
	 */

	var connectPagination = function connectPagination(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$a());
	  return function (widgetParams) {
	    var _ref = widgetParams || {},
	        totalPages = _ref.totalPages,
	        _ref$padding = _ref.padding,
	        padding = _ref$padding === void 0 ? 3 : _ref$padding;

	    var pager = new Paginator({
	      currentPage: 0,
	      total: 0,
	      padding: padding
	    });
	    var connectorState = {};

	    function getMaxPage(_ref2) {
	      var nbPages = _ref2.nbPages;
	      return totalPages !== undefined ? Math.min(totalPages, nbPages) : nbPages;
	    }

	    return {
	      $$type: 'ais.pagination',
	      init: function init(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        renderFn(_objectSpread$i({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        renderFn(_objectSpread$i({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      dispose: function dispose(_ref3) {
	        var state = _ref3.state;
	        unmountFn();
	        return state.setQueryParameter('page', undefined);
	      },
	      getWidgetUiState: function getWidgetUiState(uiState, _ref4) {
	        var searchParameters = _ref4.searchParameters;
	        var page = searchParameters.page || 0;

	        if (!page) {
	          return uiState;
	        }

	        return _objectSpread$i({}, uiState, {
	          page: page + 1
	        });
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref5) {
	        var uiState = _ref5.uiState;
	        var page = uiState.page ? uiState.page - 1 : 0;
	        return searchParameters.setQueryParameter('page', page);
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref6) {
	        var results = _ref6.results,
	            helper = _ref6.helper,
	            createURL = _ref6.createURL;

	        if (!connectorState.refine) {
	          connectorState.refine = function (page) {
	            helper.setPage(page);
	            helper.search();
	          };
	        }

	        if (!connectorState.createURL) {
	          connectorState.createURL = function (state) {
	            return function (page) {
	              return createURL(state.setPage(page));
	            };
	          };
	        }

	        var state = helper.state;
	        var page = state.page || 0;
	        var nbPages = getMaxPage(results || {
	          nbPages: 0
	        });
	        pager.currentPage = page;
	        pager.total = nbPages;
	        return {
	          createURL: connectorState.createURL(state),
	          refine: connectorState.refine,
	          currentRefinement: page,
	          nbHits: (results === null || results === void 0 ? void 0 : results.nbHits) || 0,
	          nbPages: nbPages,
	          pages: results ? pager.pages() : [],
	          isFirstPage: pager.isFirstPage(),
	          isLastPage: pager.isLastPage(),
	          widgetParams: widgetParams
	        };
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$i({}, renderState, {
	          pagination: this.getWidgetRenderState(renderOptions)
	        });
	      }
	    };
	  };
	};

	function ownKeys$j(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$j(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$j(Object(source), true).forEach(function (key) {
	        _defineProperty$m(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$j(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$m(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	function _slicedToArray$5(arr, i) {
	  return _arrayWithHoles$5(arr) || _iterableToArrayLimit$5(arr, i) || _nonIterableRest$5();
	}

	function _nonIterableRest$5() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance");
	}

	function _iterableToArrayLimit$5(arr, i) {
	  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
	    return;
	  }

	  var _arr = [];
	  var _n = true;
	  var _d = false;
	  var _e = undefined;

	  try {
	    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	      _arr.push(_s.value);

	      if (i && _arr.length === i) break;
	    }
	  } catch (err) {
	    _d = true;
	    _e = err;
	  } finally {
	    try {
	      if (!_n && _i["return"] != null) _i["return"]();
	    } finally {
	      if (_d) throw _e;
	    }
	  }

	  return _arr;
	}

	function _arrayWithHoles$5(arr) {
	  if (Array.isArray(arr)) return arr;
	}
	var withUsage$b = createDocumentationMessageGenerator({
	  name: 'range-input',
	  connector: true
	}, {
	  name: 'range-slider',
	  connector: true
	});
	var $$type$1 = 'ais.range';

	function toPrecision(_ref) {
	  var min = _ref.min,
	      max = _ref.max,
	      precision = _ref.precision;
	  var pow = Math.pow(10, precision);
	  return {
	    min: min ? Math.floor(min * pow) / pow : min,
	    max: max ? Math.ceil(max * pow) / pow : max
	  };
	}
	/**
	 * **Range** connector provides the logic to create custom widget that will let
	 * the user refine results using a numeric range.
	 *
	 * This connectors provides a `refine()` function that accepts bounds. It will also provide
	 * information about the min and max bounds for the current result set.
	 */


	var connectRange = function connectRange(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$b());
	  return function (widgetParams) {
	    var _ref2 = widgetParams || {},
	        attribute = _ref2.attribute,
	        minBound = _ref2.min,
	        maxBound = _ref2.max,
	        _ref2$precision = _ref2.precision,
	        precision = _ref2$precision === void 0 ? 0 : _ref2$precision;

	    if (!attribute) {
	      throw new Error(withUsage$b('The `attribute` option is required.'));
	    }

	    if (isFiniteNumber(minBound) && isFiniteNumber(maxBound) && minBound > maxBound) {
	      throw new Error(withUsage$b("The `max` option can't be lower than `min`."));
	    }

	    var formatToNumber = function formatToNumber(v) {
	      return Number(Number(v).toFixed(precision));
	    };

	    var rangeFormatter = {
	      from: function from(v) {
	        return v.toLocaleString();
	      },
	      to: function to(v) {
	        return formatToNumber(v).toLocaleString();
	      }
	    }; // eslint-disable-next-line complexity

	    var getRefinedState = function getRefinedState(helper, currentRange, nextMin, nextMax) {
	      var resolvedState = helper.state;
	      var currentRangeMin = currentRange.min,
	          currentRangeMax = currentRange.max;

	      var _ref3 = resolvedState.getNumericRefinement(attribute, '>=') || [],
	          _ref4 = _slicedToArray$5(_ref3, 1),
	          min = _ref4[0];

	      var _ref5 = resolvedState.getNumericRefinement(attribute, '<=') || [],
	          _ref6 = _slicedToArray$5(_ref5, 1),
	          max = _ref6[0];

	      var isResetMin = nextMin === undefined || nextMin === '';
	      var isResetMax = nextMax === undefined || nextMax === '';

	      var _toPrecision = toPrecision({
	        min: !isResetMin ? parseFloat(nextMin) : undefined,
	        max: !isResetMax ? parseFloat(nextMax) : undefined,
	        precision: precision
	      }),
	          nextMinAsNumber = _toPrecision.min,
	          nextMaxAsNumber = _toPrecision.max;

	      var newNextMin;

	      if (!isFiniteNumber(minBound) && currentRangeMin === nextMinAsNumber) {
	        newNextMin = undefined;
	      } else if (isFiniteNumber(minBound) && isResetMin) {
	        newNextMin = minBound;
	      } else {
	        newNextMin = nextMinAsNumber;
	      }

	      var newNextMax;

	      if (!isFiniteNumber(maxBound) && currentRangeMax === nextMaxAsNumber) {
	        newNextMax = undefined;
	      } else if (isFiniteNumber(maxBound) && isResetMax) {
	        newNextMax = maxBound;
	      } else {
	        newNextMax = nextMaxAsNumber;
	      }

	      var isResetNewNextMin = newNextMin === undefined;
	      var isGreaterThanCurrentRange = isFiniteNumber(currentRangeMin) && currentRangeMin <= newNextMin;
	      var isMinValid = isResetNewNextMin || isFiniteNumber(newNextMin) && (!isFiniteNumber(currentRangeMin) || isGreaterThanCurrentRange);
	      var isResetNewNextMax = newNextMax === undefined;
	      var isLowerThanRange = isFiniteNumber(newNextMax) && currentRangeMax >= newNextMax;
	      var isMaxValid = isResetNewNextMax || isFiniteNumber(newNextMax) && (!isFiniteNumber(currentRangeMax) || isLowerThanRange);
	      var hasMinChange = min !== newNextMin;
	      var hasMaxChange = max !== newNextMax;

	      if ((hasMinChange || hasMaxChange) && isMinValid && isMaxValid) {
	        resolvedState = resolvedState.removeNumericRefinement(attribute);

	        if (isFiniteNumber(newNextMin)) {
	          resolvedState = resolvedState.addNumericRefinement(attribute, '>=', newNextMin);
	        }

	        if (isFiniteNumber(newNextMax)) {
	          resolvedState = resolvedState.addNumericRefinement(attribute, '<=', newNextMax);
	        }

	        return resolvedState;
	      }

	      return null;
	    };

	    var sendEventWithRefinedState = function sendEventWithRefinedState(refinedState, instantSearchInstance, helper) {
	      var eventName = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'Filter Applied';
	      var filters = convertNumericRefinementsToFilters(refinedState, attribute);

	      if (filters && filters.length > 0) {
	        instantSearchInstance.sendEventToInsights({
	          insightsMethod: 'clickedFilters',
	          widgetType: $$type$1,
	          eventType: 'click',
	          payload: {
	            eventName: eventName,
	            index: helper.getIndex(),
	            filters: filters
	          }
	        });
	      }
	    };

	    var createSendEvent = function createSendEvent(instantSearchInstance, helper, currentRange) {
	      return function () {
	        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	          args[_key] = arguments[_key];
	        }

	        if (args.length === 1) {
	          instantSearchInstance.sendEventToInsights(args[0]);
	          return;
	        }

	        var eventType = args[0],
	            facetValue = args[1],
	            eventName = args[2];

	        if (eventType !== 'click') {
	          return;
	        }

	        var _facetValue = _slicedToArray$5(facetValue, 2),
	            nextMin = _facetValue[0],
	            nextMax = _facetValue[1];

	        var refinedState = getRefinedState(helper, currentRange, nextMin, nextMax);
	        sendEventWithRefinedState(refinedState, instantSearchInstance, helper, eventName);
	      };
	    };

	    function _getCurrentRange(stats) {
	      var min;

	      if (isFiniteNumber(minBound)) {
	        min = minBound;
	      } else if (isFiniteNumber(stats.min)) {
	        min = stats.min;
	      } else {
	        min = 0;
	      }

	      var max;

	      if (isFiniteNumber(maxBound)) {
	        max = maxBound;
	      } else if (isFiniteNumber(stats.max)) {
	        max = stats.max;
	      } else {
	        max = 0;
	      }

	      return toPrecision({
	        min: min,
	        max: max,
	        precision: precision
	      });
	    }

	    function _getCurrentRefinement(helper) {
	      var _ref7 = helper.getNumericRefinement(attribute, '>=') || [],
	          _ref8 = _slicedToArray$5(_ref7, 1),
	          minValue = _ref8[0];

	      var _ref9 = helper.getNumericRefinement(attribute, '<=') || [],
	          _ref10 = _slicedToArray$5(_ref9, 1),
	          maxValue = _ref10[0];

	      var min = isFiniteNumber(minValue) ? minValue : -Infinity;
	      var max = isFiniteNumber(maxValue) ? maxValue : Infinity;
	      return [min, max];
	    }

	    function _refine(instantSearchInstance, helper, currentRange) {
	      return function () {
	        var _ref11 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [undefined, undefined],
	            _ref12 = _slicedToArray$5(_ref11, 2),
	            nextMin = _ref12[0],
	            nextMax = _ref12[1];

	        var refinedState = getRefinedState(helper, currentRange, nextMin, nextMax);

	        if (refinedState) {
	          sendEventWithRefinedState(refinedState, instantSearchInstance, helper);
	          helper.setState(refinedState).search();
	        }
	      };
	    }

	    return {
	      $$type: $$type$1,
	      init: function init(initOptions) {
	        renderFn(_objectSpread$j({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: initOptions.instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        renderFn(_objectSpread$j({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: renderOptions.instantSearchInstance
	        }), false);
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$j({}, renderState, {
	          range: _objectSpread$j({}, renderState.range, _defineProperty$m({}, attribute, this.getWidgetRenderState(renderOptions)))
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref13) {
	        var results = _ref13.results,
	            helper = _ref13.helper,
	            instantSearchInstance = _ref13.instantSearchInstance;
	        var facetsFromResults = results && results.disjunctiveFacets || [];
	        var facet = find$1(facetsFromResults, function (facetResult) {
	          return facetResult.name === attribute;
	        });
	        var stats = facet && facet.stats || {
	          min: undefined,
	          max: undefined
	        };

	        var currentRange = _getCurrentRange(stats);

	        var start = _getCurrentRefinement(helper);

	        var refine;

	        if (!results) {
	          // On first render pass an empty range
	          // to be able to bypass the validation
	          // related to it
	          refine = _refine(instantSearchInstance, helper, {
	            min: undefined,
	            max: undefined
	          });
	        } else {
	          refine = _refine(instantSearchInstance, helper, currentRange);
	        }

	        return {
	          refine: refine,
	          format: rangeFormatter,
	          range: currentRange,
	          sendEvent: createSendEvent(instantSearchInstance, helper, currentRange),
	          widgetParams: _objectSpread$j({}, widgetParams, {
	            precision: precision
	          }),
	          start: start
	        };
	      },
	      dispose: function dispose(_ref14) {
	        var state = _ref14.state;
	        unmountFn();
	        return state.removeDisjunctiveFacet(attribute).removeNumericRefinement(attribute);
	      },
	      getWidgetUiState: function getWidgetUiState(uiState, _ref15) {
	        var searchParameters = _ref15.searchParameters;

	        var _searchParameters$get = searchParameters.getNumericRefinements(attribute),
	            _searchParameters$get2 = _searchParameters$get['>='],
	            min = _searchParameters$get2 === void 0 ? [] : _searchParameters$get2,
	            _searchParameters$get3 = _searchParameters$get['<='],
	            max = _searchParameters$get3 === void 0 ? [] : _searchParameters$get3;

	        if (min.length === 0 && max.length === 0) {
	          return uiState;
	        }

	        return _objectSpread$j({}, uiState, {
	          range: _objectSpread$j({}, uiState.range, _defineProperty$m({}, attribute, "".concat(min, ":").concat(max)))
	        });
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref16) {
	        var uiState = _ref16.uiState;
	        var widgetSearchParameters = searchParameters.addDisjunctiveFacet(attribute).setQueryParameters({
	          numericRefinements: _objectSpread$j({}, searchParameters.numericRefinements, _defineProperty$m({}, attribute, {}))
	        });

	        if (isFiniteNumber(minBound)) {
	          widgetSearchParameters = widgetSearchParameters.addNumericRefinement(attribute, '>=', minBound);
	        }

	        if (isFiniteNumber(maxBound)) {
	          widgetSearchParameters = widgetSearchParameters.addNumericRefinement(attribute, '<=', maxBound);
	        }

	        var value = uiState.range && uiState.range[attribute];

	        if (!value || value.indexOf(':') === -1) {
	          return widgetSearchParameters;
	        }

	        var _value$split$map = value.split(':').map(parseFloat),
	            _value$split$map2 = _slicedToArray$5(_value$split$map, 2),
	            lowerBound = _value$split$map2[0],
	            upperBound = _value$split$map2[1];

	        if (isFiniteNumber(lowerBound)) {
	          widgetSearchParameters = widgetSearchParameters.addNumericRefinement(attribute, '>=', lowerBound);
	        }

	        if (isFiniteNumber(upperBound)) {
	          widgetSearchParameters = widgetSearchParameters.addNumericRefinement(attribute, '<=', upperBound);
	        }

	        return widgetSearchParameters;
	      }
	    };
	  };
	};

	function ownKeys$k(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$k(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$k(Object(source), true).forEach(function (key) {
	        _defineProperty$n(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$k(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$n(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	function _objectWithoutProperties$7(source, excluded) {
	  if (source == null) return {};

	  var target = _objectWithoutPropertiesLoose$8(source, excluded);

	  var key, i;

	  if (Object.getOwnPropertySymbols) {
	    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

	    for (i = 0; i < sourceSymbolKeys.length; i++) {
	      key = sourceSymbolKeys[i];
	      if (excluded.indexOf(key) >= 0) continue;
	      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
	      target[key] = source[key];
	    }
	  }

	  return target;
	}

	function _objectWithoutPropertiesLoose$8(source, excluded) {
	  if (source == null) return {};
	  var target = {};
	  var sourceKeys = Object.keys(source);
	  var key, i;

	  for (i = 0; i < sourceKeys.length; i++) {
	    key = sourceKeys[i];
	    if (excluded.indexOf(key) >= 0) continue;
	    target[key] = source[key];
	  }

	  return target;
	}
	var withUsage$c = createDocumentationMessageGenerator({
	  name: 'refinement-list',
	  connector: true
	});
	/**
	 * @typedef {Object} RefinementListItem
	 * @property {string} value The value of the refinement list item.
	 * @property {string} label Human-readable value of the refinement list item.
	 * @property {number} count Number of matched results after refinement is applied.
	 * @property {boolean} isRefined Indicates if the list item is refined.
	 */

	/**
	 * @typedef {Object} CustomRefinementListWidgetOptions
	 * @property {string} attribute The name of the attribute in the records.
	 * @property {"and"|"or"} [operator = 'or'] How the filters are combined together.
	 * @property {number} [limit = 10] The max number of items to display when
	 * `showMoreLimit` is not set or if the widget is showing less value.
	 * @property {boolean} [showMore = false] Whether to display a button that expands the number of items.
	 * @property {number} [showMoreLimit = 20] The max number of items to display if the widget
	 * is showing more items.
	 * @property {string[]|function} [sortBy = ['isRefined', 'count:desc', 'name:asc']] How to sort refinements. Possible values: `count|isRefined|name:asc|name:desc`.
	 * @property {boolean} [escapeFacetValues = true] Escapes the content of the facet values.
	 * @property {function(object[]):object[]} [transformItems] Function to transform the items passed to the templates.
	 */

	/**
	 * @typedef {Object} RefinementListRenderingOptions
	 * @property {RefinementListItem[]} items The list of filtering values returned from Algolia API.
	 * @property {function(item.value): string} createURL Creates the next state url for a selected refinement.
	 * @property {function(item.value)} refine Action to apply selected refinements.
	 * @property {function} searchForItems Searches for values inside the list.
	 * @property {boolean} isFromSearch `true` if the values are from an index search.
	 * @property {boolean} canRefine `true` if a refinement can be applied.
	 * @property {boolean} canToggleShowMore `true` if the toggleShowMore button can be activated (enough items to display more or
	 * already displaying more than `limit` items)
	 * @property {Object} widgetParams All original `CustomRefinementListWidgetOptions` forwarded to the `renderFn`.
	 * @property {boolean} isShowingMore True if the menu is displaying all the menu items.
	 * @property {function} toggleShowMore Toggles the number of values displayed between `limit` and `showMoreLimit`.
	 */

	/**
	 * **RefinementList** connector provides the logic to build a custom widget that will let the
	 * user filter the results based on the values of a specific facet.
	 *
	 * This connector provides a `toggleShowMore()` function to display more or less items and a `refine()`
	 * function to select an item.
	 * @type {Connector}
	 * @param {function(RefinementListRenderingOptions, boolean)} renderFn Rendering function for the custom **RefinementList** widget.
	 * @param {function} unmountFn Unmount function called when the widget is disposed.
	 * @return {function(CustomRefinementListWidgetOptions)} Re-usable widget factory for a custom **RefinementList** widget.
	 * @example
	 * // custom `renderFn` to render the custom RefinementList widget
	 * function renderFn(RefinementListRenderingOptions, isFirstRendering) {
	 *   if (isFirstRendering) {
	 *     RefinementListRenderingOptions.widgetParams.containerNode
	 *       .html('<ul></ul>')
	 *   }
	 *
	 *     RefinementListRenderingOptions.widgetParams.containerNode
	 *       .find('li[data-refine-value]')
	 *       .each(function() { $(this).off('click'); });
	 *
	 *   if (RefinementListRenderingOptions.canRefine) {
	 *     var list = RefinementListRenderingOptions.items.map(function(item) {
	 *       return `
	 *         <li data-refine-value="${item.value}">
	 *           <input type="checkbox" value="${item.value}" ${item.isRefined ? 'checked' : ''} />
	 *           <a href="${RefinementListRenderingOptions.createURL(item.value)}">
	 *             ${item.label} (${item.count})
	 *           </a>
	 *         </li>
	 *       `;
	 *     });
	 *
	 *     RefinementListRenderingOptions.widgetParams.containerNode.find('ul').html(list);
	 *     RefinementListRenderingOptions.widgetParams.containerNode
	 *       .find('li[data-refine-value]')
	 *       .each(function() {
	 *         $(this).on('click', function(event) {
	 *           event.stopPropagation();
	 *           event.preventDefault();
	 *
	 *           RefinementListRenderingOptions.refine($(this).data('refine-value'));
	 *         });
	 *       });
	 *   } else {
	 *     RefinementListRenderingOptions.widgetParams.containerNode.find('ul').html('');
	 *   }
	 * }
	 *
	 * // connect `renderFn` to RefinementList logic
	 * var customRefinementList = instantsearch.connectors.connectRefinementList(renderFn);
	 *
	 * // mount widget on the page
	 * search.addWidgets([
	 *   customRefinementList({
	 *     containerNode: $('#custom-refinement-list-container'),
	 *     attribute: 'categories',
	 *     limit: 10,
	 *   })
	 * ]);
	 */

	function connectRefinementList(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$c());
	  return function () {
	    var widgetParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    var attribute = widgetParams.attribute,
	        _widgetParams$operato = widgetParams.operator,
	        operator = _widgetParams$operato === void 0 ? 'or' : _widgetParams$operato,
	        _widgetParams$limit = widgetParams.limit,
	        limit = _widgetParams$limit === void 0 ? 10 : _widgetParams$limit,
	        _widgetParams$showMor = widgetParams.showMore,
	        showMore = _widgetParams$showMor === void 0 ? false : _widgetParams$showMor,
	        _widgetParams$showMor2 = widgetParams.showMoreLimit,
	        showMoreLimit = _widgetParams$showMor2 === void 0 ? 20 : _widgetParams$showMor2,
	        _widgetParams$sortBy = widgetParams.sortBy,
	        sortBy = _widgetParams$sortBy === void 0 ? ['isRefined', 'count:desc', 'name:asc'] : _widgetParams$sortBy,
	        _widgetParams$escapeF = widgetParams.escapeFacetValues,
	        escapeFacetValues = _widgetParams$escapeF === void 0 ? true : _widgetParams$escapeF,
	        _widgetParams$transfo = widgetParams.transformItems,
	        transformItems = _widgetParams$transfo === void 0 ? function (items) {
	      return items;
	    } : _widgetParams$transfo;

	    if (!attribute) {
	      throw new Error(withUsage$c('The `attribute` option is required.'));
	    }

	    if (!/^(and|or)$/.test(operator)) {
	      throw new Error(withUsage$c("The `operator` must one of: `\"and\"`, `\"or\"` (got \"".concat(operator, "\").")));
	    }

	    if (showMore === true && showMoreLimit <= limit) {
	      throw new Error(withUsage$c('`showMoreLimit` should be greater than `limit`.'));
	    }

	    var formatItems = function formatItems(_ref) {
	      var label = _ref.name,
	          item = _objectWithoutProperties$7(_ref, ["name"]);

	      return _objectSpread$k({}, item, {
	        label: label,
	        value: label,
	        highlighted: label
	      });
	    };

	    var _getLimit = function getLimit(isShowingMore) {
	      return isShowingMore ? showMoreLimit : limit;
	    };

	    var lastResultsFromMainSearch;
	    var lastItemsFromMainSearch = [];
	    var hasExhaustiveItems = true;
	    var searchForFacetValues;
	    var triggerRefine;
	    var sendEvent;
	    var toggleShowMore;
	    /* eslint-disable max-params */

	    var createSearchForFacetValues = function createSearchForFacetValues(helper) {
	      var _this = this;

	      return function (renderOptions) {
	        return function (query) {
	          var instantSearchInstance = renderOptions.instantSearchInstance;

	          if (query === '' && lastItemsFromMainSearch) {
	            // render with previous data from the helper.
	            renderFn(_objectSpread$k({}, _this.getWidgetRenderState(_objectSpread$k({}, renderOptions, {
	              results: lastResultsFromMainSearch
	            })), {
	              instantSearchInstance: instantSearchInstance
	            }));
	          } else {
	            var tags = {
	              highlightPreTag: escapeFacetValues ? TAG_PLACEHOLDER.highlightPreTag : TAG_REPLACEMENT.highlightPreTag,
	              highlightPostTag: escapeFacetValues ? TAG_PLACEHOLDER.highlightPostTag : TAG_REPLACEMENT.highlightPostTag
	            };
	            helper.searchForFacetValues(attribute, query, // We cap the `maxFacetHits` value to 100 because the Algolia API
	            // doesn't support a greater number.
	            // See https://www.algolia.com/doc/api-reference/api-parameters/maxFacetHits/
	            Math.min(_getLimit(_this.isShowingMore), 100), tags).then(function (results) {
	              var facetValues = escapeFacetValues ? escapeFacets(results.facetHits) : results.facetHits;
	              var normalizedFacetValues = transformItems(facetValues.map(function (_ref2) {
	                var value = _ref2.value,
	                    item = _objectWithoutProperties$7(_ref2, ["value"]);

	                return _objectSpread$k({}, item, {
	                  value: value,
	                  label: value
	                });
	              }));
	              var canToggleShowMore = _this.isShowingMore && lastItemsFromMainSearch.length > limit;
	              renderFn(_objectSpread$k({}, _this.getWidgetRenderState(_objectSpread$k({}, renderOptions, {
	                results: lastResultsFromMainSearch
	              })), {
	                items: normalizedFacetValues,
	                canToggleShowMore: canToggleShowMore,
	                canRefine: true,
	                instantSearchInstance: instantSearchInstance,
	                isFromSearch: true
	              }));
	            });
	          }
	        };
	      };
	    };
	    /* eslint-enable max-params */


	    return {
	      $$type: 'ais.refinementList',
	      isShowingMore: false,
	      // Provide the same function to the `renderFn` so that way the user
	      // has to only bind it once when `isFirstRendering` for instance
	      toggleShowMore: function toggleShowMore() {},
	      cachedToggleShowMore: function cachedToggleShowMore() {
	        toggleShowMore();
	      },
	      createToggleShowMore: function createToggleShowMore(renderOptions) {
	        var _this2 = this;

	        return function () {
	          _this2.isShowingMore = !_this2.isShowingMore;

	          _this2.render(renderOptions);
	        };
	      },
	      getLimit: function getLimit() {
	        return _getLimit(this.isShowingMore);
	      },
	      init: function init(initOptions) {
	        renderFn(_objectSpread$k({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: initOptions.instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        renderFn(_objectSpread$k({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: renderOptions.instantSearchInstance
	        }), false);
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$k({}, renderState, {
	          refinementList: _objectSpread$k({}, renderState.refinementList, _defineProperty$n({}, attribute, this.getWidgetRenderState(renderOptions)))
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(renderOptions) {
	        var results = renderOptions.results,
	            state = renderOptions.state,
	            createURL = renderOptions.createURL,
	            instantSearchInstance = renderOptions.instantSearchInstance,
	            _renderOptions$isFrom = renderOptions.isFromSearch,
	            isFromSearch = _renderOptions$isFrom === void 0 ? false : _renderOptions$isFrom,
	            helper = renderOptions.helper;
	        var items = [];
	        var facetValues;

	        if (!sendEvent || !triggerRefine || !searchForFacetValues) {
	          sendEvent = createSendEventForFacet({
	            instantSearchInstance: instantSearchInstance,
	            helper: helper,
	            attribute: attribute,
	            widgetType: this.$$type
	          });

	          triggerRefine = function triggerRefine(facetValue) {
	            sendEvent('click', facetValue);
	            helper.toggleRefinement(attribute, facetValue).search();
	          };

	          searchForFacetValues = createSearchForFacetValues.call(this, helper);
	        }

	        if (results) {
	          if (!isFromSearch) {
	            facetValues = results.getFacetValues(attribute, {
	              sortBy: sortBy
	            }) || [];
	            items = transformItems(facetValues.slice(0, this.getLimit()).map(formatItems));
	          } else {
	            facetValues = escapeFacetValues ? escapeFacets(results.facetHits) : results.facetHits;
	            items = transformItems(facetValues.map(function (_ref3) {
	              var value = _ref3.value,
	                  item = _objectWithoutProperties$7(_ref3, ["value"]);

	              return _objectSpread$k({}, item, {
	                value: value,
	                label: value
	              });
	            }));
	          }

	          var maxValuesPerFacetConfig = state.maxValuesPerFacet;
	          var currentLimit = this.getLimit(); // If the limit is the max number of facet retrieved it is impossible to know
	          // if the facets are exhaustive. The only moment we are sure it is exhaustive
	          // is when it is strictly under the number requested unless we know that another
	          // widget has requested more values (maxValuesPerFacet > getLimit()).
	          // Because this is used for making the search of facets unable or not, it is important
	          // to be conservative here.

	          hasExhaustiveItems = maxValuesPerFacetConfig > currentLimit ? facetValues.length <= currentLimit : facetValues.length < currentLimit;
	          lastResultsFromMainSearch = results;
	          lastItemsFromMainSearch = items;
	          toggleShowMore = this.createToggleShowMore(renderOptions);
	        } // Compute a specific createURL method able to link to any facet value state change


	        var _createURL = function _createURL(facetValue) {
	          return createURL(state.toggleRefinement(attribute, facetValue));
	        }; // Do not mistake searchForFacetValues and searchFacetValues which is the actual search
	        // function


	        var searchFacetValues = searchForFacetValues && searchForFacetValues(renderOptions);
	        var canShowLess = this.isShowingMore && lastItemsFromMainSearch.length > limit;
	        var canShowMore = showMore && !isFromSearch && !hasExhaustiveItems;
	        var canToggleShowMore = canShowLess || canShowMore;
	        return {
	          createURL: _createURL,
	          items: items,
	          refine: triggerRefine,
	          searchForItems: searchFacetValues,
	          isFromSearch: isFromSearch,
	          canRefine: isFromSearch || items.length > 0,
	          widgetParams: widgetParams,
	          isShowingMore: this.isShowingMore,
	          canToggleShowMore: canToggleShowMore,
	          toggleShowMore: this.cachedToggleShowMore,
	          sendEvent: sendEvent,
	          hasExhaustiveItems: hasExhaustiveItems
	        };
	      },
	      dispose: function dispose(_ref4) {
	        var state = _ref4.state;
	        unmountFn();
	        var withoutMaxValuesPerFacet = state.setQueryParameter('maxValuesPerFacet', undefined);

	        if (operator === 'and') {
	          return withoutMaxValuesPerFacet.removeFacet(attribute);
	        }

	        return withoutMaxValuesPerFacet.removeDisjunctiveFacet(attribute);
	      },
	      getWidgetUiState: function getWidgetUiState(uiState, _ref5) {
	        var searchParameters = _ref5.searchParameters;
	        var values = operator === 'or' ? searchParameters.getDisjunctiveRefinements(attribute) : searchParameters.getConjunctiveRefinements(attribute);

	        if (!values.length) {
	          return uiState;
	        }

	        return _objectSpread$k({}, uiState, {
	          refinementList: _objectSpread$k({}, uiState.refinementList, _defineProperty$n({}, attribute, values))
	        });
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref6) {
	        var uiState = _ref6.uiState;
	        var isDisjunctive = operator === 'or';
	        var values = uiState.refinementList && uiState.refinementList[attribute];
	        var withoutRefinements = searchParameters.clearRefinements(attribute);
	        var withFacetConfiguration = isDisjunctive ? withoutRefinements.addDisjunctiveFacet(attribute) : withoutRefinements.addFacet(attribute);
	        var currentMaxValuesPerFacet = withFacetConfiguration.maxValuesPerFacet || 0;
	        var nextMaxValuesPerFacet = Math.max(currentMaxValuesPerFacet, showMore ? showMoreLimit : limit);
	        var withMaxValuesPerFacet = withFacetConfiguration.setQueryParameter('maxValuesPerFacet', nextMaxValuesPerFacet);

	        if (!values) {
	          var key = isDisjunctive ? 'disjunctiveFacetsRefinements' : 'facetsRefinements';
	          return withMaxValuesPerFacet.setQueryParameters(_defineProperty$n({}, key, _objectSpread$k({}, withMaxValuesPerFacet[key], _defineProperty$n({}, attribute, []))));
	        }

	        return values.reduce(function (parameters, value) {
	          return isDisjunctive ? parameters.addDisjunctiveFacetRefinement(attribute, value) : parameters.addFacetRefinement(attribute, value);
	        }, withMaxValuesPerFacet);
	      }
	    };
	  };
	}

	function ownKeys$l(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$l(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$l(Object(source), true).forEach(function (key) {
	        _defineProperty$o(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$l(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$o(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$d = createDocumentationMessageGenerator({
	  name: 'search-box',
	  connector: true
	});
	/**
	 * @typedef {Object} CustomSearchBoxWidgetOptions
	 * @property {function(string, function(string))} [queryHook = undefined] A function that will be called every time
	 * a new value for the query is set. The first parameter is the query and the second is a
	 * function to actually trigger the search. The function takes the query as the parameter.
	 *
	 * This queryHook can be used to debounce the number of searches done from the searchBox.
	 */

	/**
	 * @typedef {Object} SearchBoxRenderingOptions
	 * @property {string} query The query from the last search.
	 * @property {function(string)} refine Sets a new query and searches.
	 * @property {function()} clear Remove the query and perform search.
	 * @property {Object} widgetParams All original `CustomSearchBoxWidgetOptions` forwarded to the `renderFn`.
	 * @property {boolean} isSearchStalled `true` if the search results takes more than a certain time to come back
	 * from Algolia servers. This can be configured on the InstantSearch constructor with the attribute
	 * `stalledSearchDelay` which is 200ms, by default.
	 */

	/**
	 * **SearchBox** connector provides the logic to build a widget that will let the user search for a query.
	 *
	 * The connector provides to the rendering: `refine()` to set the query. The behaviour of this function
	 * may be impacted by the `queryHook` widget parameter.
	 * @type {Connector}
	 * @param {function(SearchBoxRenderingOptions, boolean)} renderFn Rendering function for the custom **SearchBox** widget.
	 * @param {function} unmountFn Unmount function called when the widget is disposed.
	 * @return {function(CustomSearchBoxWidgetOptions)} Re-usable widget factory for a custom **SearchBox** widget.
	 * @example
	 * // custom `renderFn` to render the custom SearchBox widget
	 * function renderFn(SearchBoxRenderingOptions, isFirstRendering) {
	 *   if (isFirstRendering) {
	 *     SearchBoxRenderingOptions.widgetParams.containerNode.html('<input type="text" />');
	 *     SearchBoxRenderingOptions.widgetParams.containerNode
	 *       .find('input')
	 *       .on('keyup', function() {
	 *         SearchBoxRenderingOptions.refine($(this).val());
	 *       });
	 *     SearchBoxRenderingOptions.widgetParams.containerNode
	 *       .find('input')
	 *       .val(SearchBoxRenderingOptions.query);
	 *   }
	 * }
	 *
	 * // connect `renderFn` to SearchBox logic
	 * var customSearchBox = instantsearch.connectors.connectSearchBox(renderFn);
	 *
	 * // mount widget on the page
	 * search.addWidgets([
	 *   customSearchBox({
	 *     containerNode: $('#custom-searchbox'),
	 *   })
	 * ]);
	 */

	function connectSearchBox(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$d());
	  return function () {
	    var widgetParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    var queryHook = widgetParams.queryHook;

	    function clear(helper) {
	      return function () {
	        helper.setQuery('').search();
	      };
	    }

	    var _clear = function _clear() {};

	    function _cachedClear() {
	      _clear();
	    }

	    return {
	      $$type: 'ais.searchBox',
	      init: function init(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        renderFn(_objectSpread$l({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        renderFn(_objectSpread$l({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      dispose: function dispose(_ref) {
	        var state = _ref.state;
	        unmountFn();
	        return state.setQueryParameter('query', undefined);
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$l({}, renderState, {
	          searchBox: this.getWidgetRenderState(renderOptions)
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref2) {
	        var helper = _ref2.helper,
	            searchMetadata = _ref2.searchMetadata;

	        if (!this._refine) {
	          var setQueryAndSearch = function setQueryAndSearch(query) {
	            if (query !== helper.state.query) {
	              helper.setQuery(query).search();
	            }
	          };

	          this._refine = function (query) {
	            if (queryHook) {
	              queryHook(query, setQueryAndSearch);
	              return;
	            }

	            setQueryAndSearch(query);
	          };
	        }

	        _clear = clear(helper);
	        return {
	          query: helper.state.query || '',
	          refine: this._refine,
	          clear: _cachedClear,
	          widgetParams: widgetParams,
	          isSearchStalled: searchMetadata.isSearchStalled
	        };
	      },
	      getWidgetUiState: function getWidgetUiState(uiState, _ref3) {
	        var searchParameters = _ref3.searchParameters;
	        var query = searchParameters.query || '';

	        if (query === '' || uiState && uiState.query === query) {
	          return uiState;
	        }

	        return _objectSpread$l({}, uiState, {
	          query: query
	        });
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref4) {
	        var uiState = _ref4.uiState;
	        return searchParameters.setQueryParameter('query', uiState.query || '');
	      }
	    };
	  };
	}

	function ownKeys$m(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$m(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$m(Object(source), true).forEach(function (key) {
	        _defineProperty$p(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$m(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$p(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$e = createDocumentationMessageGenerator({
	  name: 'sort-by',
	  connector: true
	});
	/**
	 * @typedef {Object} SortByItem
	 * @property {string} value The name of the index to target.
	 * @property {string} label The label of the index to display.
	 */

	/**
	 * @typedef {Object} CustomSortByWidgetOptions
	 * @property {SortByItem[]} items Array of objects defining the different indices to choose from.
	 * @property {function(object[]):object[]} [transformItems] Function to transform the items passed to the templates.
	 */

	/**
	 * @typedef {Object} SortByRenderingOptions
	 * @property {string} currentRefinement The currently selected index.
	 * @property {SortByItem[]} options All the available indices
	 * @property {function(string)} refine Switches indices and triggers a new search.
	 * @property {boolean} hasNoResults `true` if the last search contains no result.
	 * @property {Object} widgetParams All original `CustomSortByWidgetOptions` forwarded to the `renderFn`.
	 */

	/**
	 * The **SortBy** connector provides the logic to build a custom widget that will display a
	 * list of indices. With Algolia, this is most commonly used for changing ranking strategy. This allows
	 * a user to change how the hits are being sorted.
	 *
	 * This connector provides the `refine` function that allows to switch indices.
	 * The connector provides to the rendering: `refine()` to switch the current index and
	 * `options` that are the values that can be selected. `refine` should be used
	 * with `options.value`.
	 * @type {Connector}
	 * @param {function(SortByRenderingOptions, boolean)} renderFn Rendering function for the custom **SortBy** widget.
	 * @param {function} unmountFn Unmount function called when the widget is disposed.
	 * @return {function(CustomSortByWidgetOptions)} Re-usable widget factory for a custom **SortBy** widget.
	 * @example
	 * // custom `renderFn` to render the custom SortBy widget
	 * function renderFn(SortByRenderingOptions, isFirstRendering) {
	 *   if (isFirstRendering) {
	 *     SortByRenderingOptions.widgetParams.containerNode.html('<select></select>');
	 *     SortByRenderingOptions.widgetParams.containerNode
	 *       .find('select')
	 *       .on('change', function(event) {
	 *         SortByRenderingOptions.refine(event.target.value);
	 *       });
	 *   }
	 *
	 *   var optionsHTML = SortByRenderingOptions.options.map(function(option) {
	 *     return `
	 *       <option
	 *         value="${option.value}"
	 *         ${SortByRenderingOptions.currentRefinement === option.value ? 'selected' : ''}
	 *       >
	 *         ${option.label}
	 *       </option>
	 *     `;
	 *   });
	 *
	 *   SortByRenderingOptions.widgetParams.containerNode
	 *     .find('select')
	 *     .html(optionsHTML);
	 * }
	 *
	 * // connect `renderFn` to SortBy logic
	 * var customSortBy = instantsearch.connectors.connectSortBy(renderFn);
	 *
	 * // mount widget on the page
	 * search.addWidgets([
	 *   customSortBy({
	 *     containerNode: $('#custom-sort-by-container'),
	 *     items: [
	 *       { value: 'instant_search', label: 'Most relevant' },
	 *       { value: 'instant_search_price_asc', label: 'Lowest price' },
	 *       { value: 'instant_search_price_desc', label: 'Highest price' },
	 *     ],
	 *   })
	 * ]);
	 */

	function connectSortBy(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$e());
	  return function () {
	    var widgetParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    var items = widgetParams.items,
	        _widgetParams$transfo = widgetParams.transformItems,
	        transformItems = _widgetParams$transfo === void 0 ? function (x) {
	      return x;
	    } : _widgetParams$transfo;

	    if (!Array.isArray(items)) {
	      throw new Error(withUsage$e('The `items` option expects an array of objects.'));
	    }

	    return {
	      $$type: 'ais.sortBy',
	      init: function init(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        var widgetRenderState = this.getWidgetRenderState(initOptions);
	        var currentIndex = widgetRenderState.currentRefinement;
	        var isCurrentIndexInItems = find$1(items, function (item) {
	          return item.value === currentIndex;
	        });
	        "development".NODE_ENV === 'development' ? _warning(isCurrentIndexInItems, "The index named \"".concat(currentIndex, "\" is not listed in the `items` of `sortBy`.")) : void 0;
	        renderFn(_objectSpread$m({}, widgetRenderState, {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        renderFn(_objectSpread$m({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      dispose: function dispose(_ref) {
	        var state = _ref.state;
	        unmountFn();
	        return state.setIndex(this.initialIndex);
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$m({}, renderState, {
	          sortBy: this.getWidgetRenderState(renderOptions)
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref2) {
	        var results = _ref2.results,
	            helper = _ref2.helper,
	            parent = _ref2.parent;

	        if (!this.initialIndex) {
	          this.initialIndex = parent.getIndexName();
	        }

	        if (!this.setIndex) {
	          this.setIndex = function (indexName) {
	            helper.setIndex(indexName).search();
	          };
	        }

	        return {
	          currentRefinement: helper.state.index,
	          options: transformItems(items),
	          refine: this.setIndex,
	          hasNoResults: results ? results.nbHits === 0 : true,
	          widgetParams: widgetParams
	        };
	      },
	      getWidgetUiState: function getWidgetUiState(uiState, _ref3) {
	        var searchParameters = _ref3.searchParameters;
	        var currentIndex = searchParameters.index;
	        var isInitialIndex = currentIndex === this.initialIndex;

	        if (isInitialIndex) {
	          return uiState;
	        }

	        return _objectSpread$m({}, uiState, {
	          sortBy: currentIndex
	        });
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref4) {
	        var uiState = _ref4.uiState;
	        return searchParameters.setQueryParameter('index', uiState.sortBy || this.initialIndex || searchParameters.index);
	      }
	    };
	  };
	}

	function ownKeys$n(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$n(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$n(Object(source), true).forEach(function (key) {
	        _defineProperty$q(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$n(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$q(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	function _toConsumableArray$7(arr) {
	  return _arrayWithoutHoles$7(arr) || _iterableToArray$7(arr) || _nonIterableSpread$7();
	}

	function _nonIterableSpread$7() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance");
	}

	function _iterableToArray$7(iter) {
	  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
	}

	function _arrayWithoutHoles$7(arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
	      arr2[i] = arr[i];
	    }

	    return arr2;
	  }
	}
	var withUsage$f = createDocumentationMessageGenerator({
	  name: 'rating-menu',
	  connector: true
	});
	var $$type$2 = 'ais.ratingMenu';

	var createSendEvent$1 = function createSendEvent(_ref) {
	  var instantSearchInstance = _ref.instantSearchInstance,
	      helper = _ref.helper,
	      getRefinedStar = _ref.getRefinedStar,
	      attribute = _ref.attribute;
	  return function () {
	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }

	    if (args.length === 1) {
	      instantSearchInstance.sendEventToInsights(args[0]);
	      return;
	    }

	    var eventType = args[0],
	        facetValue = args[1],
	        _args$ = args[2],
	        eventName = _args$ === void 0 ? 'Filter Applied' : _args$;

	    if (eventType !== 'click') {
	      return;
	    }

	    var isRefined = getRefinedStar() === Number(facetValue);

	    if (!isRefined) {
	      instantSearchInstance.sendEventToInsights({
	        insightsMethod: 'clickedFilters',
	        widgetType: $$type$2,
	        eventType: eventType,
	        payload: {
	          eventName: eventName,
	          index: helper.getIndex(),
	          filters: ["".concat(attribute, ">=").concat(facetValue)]
	        }
	      });
	    }
	  };
	};
	/**
	 * @typedef {Object} StarRatingItems
	 * @property {string} name Name corresponding to the number of stars.
	 * @property {string} value Number of stars as string.
	 * @property {number} count Count of matched results corresponding to the number of stars.
	 * @property {boolean[]} stars Array of length of maximum rating value with stars to display or not.
	 * @property {boolean} isRefined Indicates if star rating refinement is applied.
	 */

	/**
	 * @typedef {Object} CustomStarRatingWidgetOptions
	 * @property {string} attribute Name of the attribute for faceting (eg. "free_shipping").
	 * @property {number} [max = 5] The maximum rating value.
	 */

	/**
	 * @typedef {Object} StarRatingRenderingOptions
	 * @property {StarRatingItems[]} items Possible star ratings the user can apply.
	 * @property {function(string): string} createURL Creates an URL for the next
	 * state (takes the item value as parameter). Takes the value of an item as parameter.
	 * @property {function(string)} refine Selects a rating to filter the results
	 * (takes the filter value as parameter). Takes the value of an item as parameter.
	 * @property {boolean} hasNoResults `true` if the last search contains no result.
	 * @property {Object} widgetParams All original `CustomStarRatingWidgetOptions` forwarded to the `renderFn`.
	 */

	/**
	 * **StarRating** connector provides the logic to build a custom widget that will let
	 * the user refine search results based on ratings.
	 *
	 * The connector provides to the rendering: `refine()` to select a value and
	 * `items` that are the values that can be selected. `refine` should be used
	 * with `items.value`.
	 * @type {Connector}
	 * @param {function(StarRatingRenderingOptions, boolean)} renderFn Rendering function for the custom **StarRating** widget.
	 * @param {function} unmountFn Unmount function called when the widget is disposed.
	 * @return {function(CustomStarRatingWidgetOptions)} Re-usable widget factory for a custom **StarRating** widget.
	 * @example
	 * // custom `renderFn` to render the custom StarRating widget
	 * function renderFn(StarRatingRenderingOptions, isFirstRendering) {
	 *   if (isFirstRendering) {
	 *     StarRatingRenderingOptions.widgetParams.containerNode.html('<ul></ul>');
	 *   }
	 *
	 *   StarRatingRenderingOptions.widgetParams.containerNode
	 *     .find('li[data-refine-value]')
	 *     .each(function() { $(this).off('click'); });
	 *
	 *   var listHTML = StarRatingRenderingOptions.items.map(function(item) {
	 *     return '<li data-refine-value="' + item.value + '">' +
	 *       '<a href="' + StarRatingRenderingOptions.createURL(item.value) + '">' +
	 *       item.stars.map(function(star) { return star === false ? '☆' : '★'; }).join(' ') +
	 *       '& up (' + item.count + ')' +
	 *       '</a></li>';
	 *   });
	 *
	 *   StarRatingRenderingOptions.widgetParams.containerNode
	 *     .find('ul')
	 *     .html(listHTML);
	 *
	 *   StarRatingRenderingOptions.widgetParams.containerNode
	 *     .find('li[data-refine-value]')
	 *     .each(function() {
	 *       $(this).on('click', function(event) {
	 *         event.preventDefault();
	 *         event.stopPropagation();
	 *
	 *         StarRatingRenderingOptions.refine($(this).data('refine-value'));
	 *       });
	 *     });
	 * }
	 *
	 * // connect `renderFn` to StarRating logic
	 * var customStarRating = instantsearch.connectors.connectRatingMenu(renderFn);
	 *
	 * // mount widget on the page
	 * search.addWidgets([
	 *   customStarRating({
	 *     containerNode: $('#custom-rating-menu-container'),
	 *     attribute: 'rating',
	 *     max: 5,
	 *   })
	 * ]);
	 */


	function connectRatingMenu(renderFn) {
	  var _this = this;

	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$f());
	  return function () {
	    var widgetParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    var attribute = widgetParams.attribute,
	        _widgetParams$max = widgetParams.max,
	        max = _widgetParams$max === void 0 ? 5 : _widgetParams$max;
	    var sendEvent;

	    if (!attribute) {
	      throw new Error(withUsage$f('The `attribute` option is required.'));
	    }

	    var _getRefinedStar = function getRefinedStar(state) {
	      var refinements = state.getDisjunctiveRefinements(attribute);

	      if (!refinements.length) {
	        return undefined;
	      }

	      return Math.min.apply(Math, _toConsumableArray$7(refinements.map(Number)));
	    };

	    var toggleRefinement = function toggleRefinement(helper, facetValue) {
	      sendEvent('click', facetValue);
	      var isRefined = _getRefinedStar(helper.state) === Number(facetValue);
	      helper.removeDisjunctiveFacetRefinement(attribute);

	      if (!isRefined) {
	        for (var val = Number(facetValue); val <= max; ++val) {
	          helper.addDisjunctiveFacetRefinement(attribute, val);
	        }
	      }

	      helper.search();
	    };

	    var connectorState = {
	      toggleRefinementFactory: function toggleRefinementFactory(helper) {
	        return toggleRefinement.bind(_this, helper);
	      },
	      createURLFactory: function createURLFactory(_ref2) {
	        var state = _ref2.state,
	            createURL = _ref2.createURL;
	        return function (value) {
	          return createURL(state.toggleRefinement(attribute, value));
	        };
	      }
	    };
	    return {
	      $$type: $$type$2,
	      init: function init(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        renderFn(_objectSpread$n({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        renderFn(_objectSpread$n({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$n({}, renderState, {
	          ratingMenu: _objectSpread$n({}, renderState.ratingMenu, _defineProperty$q({}, attribute, this.getWidgetRenderState(renderOptions)))
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref3) {
	        var helper = _ref3.helper,
	            results = _ref3.results,
	            state = _ref3.state,
	            instantSearchInstance = _ref3.instantSearchInstance,
	            createURL = _ref3.createURL;
	        var facetValues = [];

	        if (!sendEvent) {
	          sendEvent = createSendEvent$1({
	            instantSearchInstance: instantSearchInstance,
	            helper: helper,
	            getRefinedStar: function getRefinedStar() {
	              return _getRefinedStar(helper.state);
	            },
	            attribute: attribute
	          });
	        }

	        if (results) {
	          var allValues = {};

	          for (var v = max; v >= 0; --v) {
	            allValues[v] = 0;
	          }

	          (results.getFacetValues(attribute) || []).forEach(function (facet) {
	            var val = Math.round(facet.name);

	            if (!val || val > max) {
	              return;
	            }

	            for (var _v = val; _v >= 1; --_v) {
	              allValues[_v] += facet.count;
	            }
	          });

	          var refinedStar = _getRefinedStar(state);

	          for (var star = max - 1; star >= 1; --star) {
	            var count = allValues[star];

	            if (refinedStar && star !== refinedStar && count === 0) {
	              // skip count==0 when at least 1 refinement is enabled
	              // eslint-disable-next-line no-continue
	              continue;
	            }

	            var stars = [];

	            for (var i = 1; i <= max; ++i) {
	              stars.push(i <= star);
	            }

	            facetValues.push({
	              stars: stars,
	              name: String(star),
	              value: String(star),
	              count: count,
	              isRefined: refinedStar === star
	            });
	          }
	        }

	        return {
	          items: facetValues,
	          hasNoResults: results ? results.nbHits === 0 : true,
	          refine: connectorState.toggleRefinementFactory(helper),
	          sendEvent: sendEvent,
	          createURL: connectorState.createURLFactory({
	            state: state,
	            createURL: createURL
	          }),
	          widgetParams: widgetParams
	        };
	      },
	      dispose: function dispose(_ref4) {
	        var state = _ref4.state;
	        unmountFn();
	        return state.removeDisjunctiveFacet(attribute);
	      },
	      getWidgetUiState: function getWidgetUiState(uiState, _ref5) {
	        var searchParameters = _ref5.searchParameters;

	        var value = _getRefinedStar(searchParameters);

	        if (typeof value !== 'number') {
	          return uiState;
	        }

	        return _objectSpread$n({}, uiState, {
	          ratingMenu: _objectSpread$n({}, uiState.ratingMenu, _defineProperty$q({}, attribute, value))
	        });
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref6) {
	        var uiState = _ref6.uiState;
	        var value = uiState.ratingMenu && uiState.ratingMenu[attribute];
	        var withoutRefinements = searchParameters.clearRefinements(attribute);
	        var withDisjunctiveFacet = withoutRefinements.addDisjunctiveFacet(attribute);

	        if (!value) {
	          return withDisjunctiveFacet.setQueryParameters({
	            disjunctiveFacetsRefinements: _objectSpread$n({}, withDisjunctiveFacet.disjunctiveFacetsRefinements, _defineProperty$q({}, attribute, []))
	          });
	        }

	        return range({
	          start: Number(value),
	          end: max + 1
	        }).reduce(function (parameters, number) {
	          return parameters.addDisjunctiveFacetRefinement(attribute, number);
	        }, withDisjunctiveFacet);
	      }
	    };
	  };
	}

	function ownKeys$o(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$o(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$o(Object(source), true).forEach(function (key) {
	        _defineProperty$r(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$o(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$r(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$g = createDocumentationMessageGenerator({
	  name: 'stats',
	  connector: true
	});
	/**
	 * @typedef {Object} StatsRenderingOptions
	 * @property {number} hitsPerPage The maximum number of hits per page returned by Algolia.
	 * @property {number} nbHits The number of hits in the result set.
	 * @property {number} nbPages The number of pages computed for the result set.
	 * @property {number} page The current page.
	 * @property {number} processingTimeMS The time taken to compute the results inside the Algolia engine.
	 * @property {string} query The query used for the current search.
	 * @property {object} widgetParams All original `CustomStatsWidgetOptions` forwarded to the `renderFn`.
	 */

	/**
	 * @typedef {Object} CustomStatsWidgetOptions
	 */

	/**
	 * **Stats** connector provides the logic to build a custom widget that will displays
	 * search statistics (hits number and processing time).
	 *
	 * @type {Connector}
	 * @param {function(StatsRenderingOptions, boolean)} renderFn Rendering function for the custom **Stats** widget.
	 * @param {function} unmountFn Unmount function called when the widget is disposed.
	 * @return {function(CustomStatsWidgetOptions)} Re-usable widget factory for a custom **Stats** widget.
	 * @example
	 * // custom `renderFn` to render the custom Stats widget
	 * function renderFn(StatsRenderingOptions, isFirstRendering) {
	 *   if (isFirstRendering) return;
	 *
	 *   StatsRenderingOptions.widgetParams.containerNode
	 *     .html(StatsRenderingOptions.nbHits + ' results found in ' + StatsRenderingOptions.processingTimeMS);
	 * }
	 *
	 * // connect `renderFn` to Stats logic
	 * var customStatsWidget = instantsearch.connectors.connectStats(renderFn);
	 *
	 * // mount widget on the page
	 * search.addWidgets([
	 *   customStatsWidget({
	 *     containerNode: $('#custom-stats-container'),
	 *   })
	 * ]);
	 */

	function connectStats(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$g());
	  return function () {
	    var widgetParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    return {
	      $$type: 'ais.stats',
	      init: function init(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        renderFn(_objectSpread$o({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        renderFn(_objectSpread$o({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      dispose: function dispose() {
	        unmountFn();
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$o({}, renderState, {
	          stats: this.getWidgetRenderState(renderOptions)
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref) {
	        var results = _ref.results,
	            helper = _ref.helper;

	        if (!results) {
	          return {
	            hitsPerPage: helper.state.hitsPerPage,
	            nbHits: 0,
	            nbPages: 0,
	            page: helper.state.page || 0,
	            processingTimeMS: -1,
	            query: helper.state.query || '',
	            widgetParams: widgetParams
	          };
	        }

	        return {
	          hitsPerPage: results.hitsPerPage,
	          nbHits: results.nbHits,
	          nbPages: results.nbPages,
	          page: results.page,
	          processingTimeMS: results.processingTimeMS,
	          query: results.query,
	          widgetParams: widgetParams
	        };
	      }
	    };
	  };
	}

	function ownKeys$p(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$p(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$p(Object(source), true).forEach(function (key) {
	        _defineProperty$s(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$p(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$s(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$h = createDocumentationMessageGenerator({
	  name: 'toggle-refinement',
	  connector: true
	});
	var $$type$3 = 'ais.toggleRefinement';

	var createSendEvent$2 = function createSendEvent(_ref) {
	  var instantSearchInstance = _ref.instantSearchInstance,
	      attribute = _ref.attribute,
	      on = _ref.on,
	      helper = _ref.helper;
	  return function () {
	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
	      args[_key] = arguments[_key];
	    }

	    if (args.length === 1) {
	      instantSearchInstance.sendEventToInsights(args[0]);
	      return;
	    }

	    var eventType = args[0],
	        isRefined = args[1],
	        _args$ = args[2],
	        eventName = _args$ === void 0 ? 'Filter Applied' : _args$;

	    if (eventType !== 'click' || on === undefined) {
	      return;
	    } // Checking


	    if (!isRefined) {
	      instantSearchInstance.sendEventToInsights({
	        insightsMethod: 'clickedFilters',
	        widgetType: $$type$3,
	        eventType: eventType,
	        payload: {
	          eventName: eventName,
	          index: helper.getIndex(),
	          filters: on.map(function (value) {
	            return "".concat(attribute, ":").concat(value);
	          })
	        }
	      });
	    }
	  };
	};
	/**
	 * @typedef {Object} ToggleValue
	 * @property {boolean} isRefined `true` if the toggle is on.
	 * @property {number} count Number of results matched after applying the toggle refinement.
	 * @property {Object} onFacetValue Value of the toggle when it's on.
	 * @property {Object} offFacetValue Value of the toggle when it's off.
	 */

	/**
	 * @typedef {Object} CustomToggleWidgetOptions
	 * @property {string} attribute Name of the attribute for faceting (eg. "free_shipping").
	 * @property {Object} [on = true] Value to filter on when toggled.
	 * @property {Object} [off] Value to filter on when not toggled.
	 */

	/**
	 * @typedef {Object} ToggleRenderingOptions
	 * @property {ToggleValue} value The current toggle value.
	 * @property {function():string} createURL Creates an URL for the next state.
	 * @property {function(value)} refine Updates to the next state by applying the toggle refinement.
	 * @property {Object} widgetParams All original `CustomToggleWidgetOptions` forwarded to the `renderFn`.
	 */

	/**
	 * **Toggle** connector provides the logic to build a custom widget that will provide
	 * an on/off filtering feature based on an attribute value or values.
	 *
	 * Two modes are implemented in the custom widget:
	 *  - with or without the value filtered
	 *  - switch between two values.
	 *
	 * @type {Connector}
	 * @param {function(ToggleRenderingOptions, boolean)} renderFn Rendering function for the custom **Toggle** widget.
	 * @param {function} unmountFn Unmount function called when the widget is disposed.
	 * @return {function(CustomToggleWidgetOptions)} Re-usable widget factory for a custom **Toggle** widget.
	 * @example
	 * // custom `renderFn` to render the custom ClearAll widget
	 * function renderFn(ToggleRenderingOptions, isFirstRendering) {
	 *   ToggleRenderingOptions.widgetParams.containerNode
	 *     .find('a')
	 *     .off('click');
	 *
	 *   var buttonHTML = `
	 *     <a href="${ToggleRenderingOptions.createURL()}">
	 *       <input
	 *         type="checkbox"
	 *         value="${ToggleRenderingOptions.value.name}"
	 *         ${ToggleRenderingOptions.value.isRefined ? 'checked' : ''}
	 *       />
	 *       ${ToggleRenderingOptions.value.name} (${ToggleRenderingOptions.value.count})
	 *     </a>
	 *   `;
	 *
	 *   ToggleRenderingOptions.widgetParams.containerNode.html(buttonHTML);
	 *   ToggleRenderingOptions.widgetParams.containerNode
	 *     .find('a')
	 *     .on('click', function(event) {
	 *       event.preventDefault();
	 *       event.stopPropagation();
	 *
	 *       ToggleRenderingOptions.refine(ToggleRenderingOptions.value);
	 *     });
	 * }
	 *
	 * // connect `renderFn` to Toggle logic
	 * var customToggle = instantsearch.connectors.connectToggleRefinement(renderFn);
	 *
	 * // mount widget on the page
	 * search.addWidgets([
	 *   customToggle({
	 *     containerNode: $('#custom-toggle-container'),
	 *     attribute: 'free_shipping',
	 *   })
	 * ]);
	 */


	function connectToggleRefinement(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$h());
	  return function () {
	    var widgetParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    var attribute = widgetParams.attribute,
	        _widgetParams$on = widgetParams.on,
	        userOn = _widgetParams$on === void 0 ? true : _widgetParams$on,
	        userOff = widgetParams.off;

	    if (!attribute) {
	      throw new Error(withUsage$h('The `attribute` option is required.'));
	    }

	    var hasAnOffValue = userOff !== undefined;
	    var hasAnOnValue = userOn !== undefined;
	    var on = hasAnOnValue ? toArray(userOn).map(escapeRefinement) : undefined;
	    var off = hasAnOffValue ? toArray(userOff).map(escapeRefinement) : undefined;
	    var sendEvent;

	    var toggleRefinementFactory = function toggleRefinementFactory(helper) {
	      return function () {
	        var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
	            isRefined = _ref2.isRefined; // Checking


	        if (!isRefined) {
	          sendEvent('click', isRefined);

	          if (hasAnOffValue) {
	            off.forEach(function (v) {
	              return helper.removeDisjunctiveFacetRefinement(attribute, v);
	            });
	          }

	          on.forEach(function (v) {
	            return helper.addDisjunctiveFacetRefinement(attribute, v);
	          });
	        } else {
	          // Unchecking
	          on.forEach(function (v) {
	            return helper.removeDisjunctiveFacetRefinement(attribute, v);
	          });

	          if (hasAnOffValue) {
	            off.forEach(function (v) {
	              return helper.addDisjunctiveFacetRefinement(attribute, v);
	            });
	          }
	        }

	        helper.search();
	      };
	    };

	    var connectorState = {
	      createURLFactory: function createURLFactory(isRefined, _ref3) {
	        var state = _ref3.state,
	            createURL = _ref3.createURL;
	        return function () {
	          var valuesToRemove = isRefined ? on : off;

	          if (valuesToRemove) {
	            valuesToRemove.forEach(function (v) {
	              state.removeDisjunctiveFacetRefinement(attribute, v);
	            });
	          }

	          var valuesToAdd = isRefined ? off : on;

	          if (valuesToAdd) {
	            valuesToAdd.forEach(function (v) {
	              state.addDisjunctiveFacetRefinement(attribute, v);
	            });
	          }

	          return createURL(state);
	        };
	      }
	    };
	    return {
	      $$type: $$type$3,
	      init: function init(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        renderFn(_objectSpread$p({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        renderFn(_objectSpread$p({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      dispose: function dispose(_ref4) {
	        var state = _ref4.state;
	        unmountFn();
	        return state.removeDisjunctiveFacet(attribute);
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$p({}, renderState, {
	          toggleRefinement: this.getWidgetRenderState(renderOptions)
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref5) {
	        var state = _ref5.state,
	            helper = _ref5.helper,
	            results = _ref5.results,
	            createURL = _ref5.createURL,
	            instantSearchInstance = _ref5.instantSearchInstance;
	        var isRefined = results ? on === null || on === void 0 ? void 0 : on.every(function (v) {
	          return helper.state.isDisjunctiveFacetRefined(attribute, v);
	        }) : on === null || on === void 0 ? void 0 : on.every(function (v) {
	          return state.isDisjunctiveFacetRefined(attribute, v);
	        });
	        var onFacetValue = {
	          isRefined: isRefined,
	          count: 0
	        };
	        var offFacetValue = {
	          isRefined: hasAnOffValue && !isRefined,
	          count: 0
	        };

	        if (results) {
	          var offValue = toArray(off || false);
	          var allFacetValues = results.getFacetValues(attribute) || [];
	          var onData = on === null || on === void 0 ? void 0 : on.map(function (v) {
	            return find$1(allFacetValues, function (_ref6) {
	              var name = _ref6.name;
	              return name === unescapeRefinement(v);
	            });
	          }).filter(function (v) {
	            return v !== undefined;
	          });
	          var offData = hasAnOffValue ? offValue.map(function (v) {
	            return find$1(allFacetValues, function (_ref7) {
	              var name = _ref7.name;
	              return name === unescapeRefinement(v);
	            });
	          }).filter(function (v) {
	            return v !== undefined;
	          }) : [];
	          onFacetValue = {
	            isRefined: onData.length ? onData.every(function (v) {
	              return v.isRefined;
	            }) : false,
	            count: onData.reduce(function (acc, v) {
	              return acc + v.count;
	            }, 0) || null
	          };
	          offFacetValue = {
	            isRefined: offData.length ? offData.every(function (v) {
	              return v.isRefined;
	            }) : false,
	            count: offData.reduce(function (acc, v) {
	              return acc + v.count;
	            }, 0) || allFacetValues.reduce(function (total, _ref8) {
	              var count = _ref8.count;
	              return total + count;
	            }, 0)
	          };
	        } else if (hasAnOffValue && !isRefined) {
	          if (off) {
	            off.forEach(function (v) {
	              return helper.addDisjunctiveFacetRefinement(attribute, v);
	            });
	          }

	          helper.setPage(helper.state.page);
	        }

	        if (!sendEvent) {
	          sendEvent = createSendEvent$2({
	            instantSearchInstance: instantSearchInstance,
	            attribute: attribute,
	            on: on,
	            helper: helper
	          });
	        }

	        var nextRefinement = isRefined ? offFacetValue : onFacetValue;
	        return {
	          value: {
	            name: attribute,
	            isRefined: isRefined,
	            count: results ? nextRefinement.count : null,
	            onFacetValue: onFacetValue,
	            offFacetValue: offFacetValue
	          },
	          state: state,
	          createURL: connectorState.createURLFactory(isRefined, {
	            state: state,
	            createURL: createURL
	          }),
	          sendEvent: sendEvent,
	          refine: toggleRefinementFactory(helper),
	          widgetParams: widgetParams
	        };
	      },
	      getWidgetUiState: function getWidgetUiState(uiState, _ref9) {
	        var searchParameters = _ref9.searchParameters;
	        var isRefined = on && on.every(function (v) {
	          return searchParameters.isDisjunctiveFacetRefined(attribute, v);
	        });

	        if (!isRefined) {
	          return uiState;
	        }

	        return _objectSpread$p({}, uiState, {
	          toggle: _objectSpread$p({}, uiState.toggle, _defineProperty$s({}, attribute, isRefined))
	        });
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref10) {
	        var uiState = _ref10.uiState;
	        var withFacetConfiguration = searchParameters.clearRefinements(attribute).addDisjunctiveFacet(attribute);
	        var isRefined = Boolean(uiState.toggle && uiState.toggle[attribute]);

	        if (isRefined) {
	          if (on) {
	            on.forEach(function (v) {
	              withFacetConfiguration = withFacetConfiguration.addDisjunctiveFacetRefinement(attribute, v);
	            });
	          }

	          return withFacetConfiguration;
	        } // It's not refined with an `off` value


	        if (hasAnOffValue) {
	          if (off) {
	            off.forEach(function (v) {
	              withFacetConfiguration = withFacetConfiguration.addDisjunctiveFacetRefinement(attribute, v);
	            });
	          }

	          return withFacetConfiguration;
	        } // It's not refined without an `off` value


	        return withFacetConfiguration.setQueryParameters({
	          disjunctiveFacetsRefinements: _objectSpread$p({}, searchParameters.disjunctiveFacetsRefinements, _defineProperty$s({}, attribute, []))
	        });
	      }
	    };
	  };
	}

	function ownKeys$q(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$q(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$q(Object(source), true).forEach(function (key) {
	        _defineProperty$t(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$q(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$t(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	function _slicedToArray$6(arr, i) {
	  return _arrayWithHoles$6(arr) || _iterableToArrayLimit$6(arr, i) || _nonIterableRest$6();
	}

	function _nonIterableRest$6() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance");
	}

	function _iterableToArrayLimit$6(arr, i) {
	  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
	    return;
	  }

	  var _arr = [];
	  var _n = true;
	  var _d = false;
	  var _e = undefined;

	  try {
	    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	      _arr.push(_s.value);

	      if (i && _arr.length === i) break;
	    }
	  } catch (err) {
	    _d = true;
	    _e = err;
	  } finally {
	    try {
	      if (!_n && _i["return"] != null) _i["return"]();
	    } finally {
	      if (_d) throw _e;
	    }
	  }

	  return _arr;
	}

	function _arrayWithHoles$6(arr) {
	  if (Array.isArray(arr)) return arr;
	}
	var withUsage$i = createDocumentationMessageGenerator({
	  name: 'breadcrumb',
	  connector: true
	});

	var connectBreadcrumb = function connectBreadcrumb(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$i());
	  var connectorState = {};
	  return function (widgetParams) {
	    var _ref = widgetParams || {},
	        attributes = _ref.attributes,
	        _ref$separator = _ref.separator,
	        separator = _ref$separator === void 0 ? ' > ' : _ref$separator,
	        _ref$rootPath = _ref.rootPath,
	        rootPath = _ref$rootPath === void 0 ? null : _ref$rootPath,
	        _ref$transformItems = _ref.transformItems,
	        transformItems = _ref$transformItems === void 0 ? function (items) {
	      return items;
	    } : _ref$transformItems;

	    if (!attributes || !Array.isArray(attributes) || attributes.length === 0) {
	      throw new Error(withUsage$i('The `attributes` option expects an array of strings.'));
	    }

	    var _attributes = _slicedToArray$6(attributes, 1),
	        hierarchicalFacetName = _attributes[0];

	    return {
	      $$type: 'ais.breadcrumb',
	      init: function init(initOptions) {
	        renderFn(_objectSpread$q({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: initOptions.instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        renderFn(_objectSpread$q({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: renderOptions.instantSearchInstance
	        }), false);
	      },
	      dispose: function dispose() {
	        unmountFn();
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$q({}, renderState, {
	          breadcrumb: _objectSpread$q({}, renderState.breadcrumb, _defineProperty$t({}, hierarchicalFacetName, this.getWidgetRenderState(renderOptions)))
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref2) {
	        var helper = _ref2.helper,
	            createURL = _ref2.createURL,
	            results = _ref2.results,
	            state = _ref2.state;

	        function getItems() {
	          if (!results) {
	            return [];
	          }

	          var _state$hierarchicalFa = _slicedToArray$6(state.hierarchicalFacets, 1),
	              facetName = _state$hierarchicalFa[0].name;

	          var facetValues = results.getFacetValues(facetName, {});
	          var data = Array.isArray(facetValues.data) ? facetValues.data : [];
	          var items = transformItems(shiftItemsValues(prepareItems(data)));
	          return items;
	        }

	        var items = getItems();

	        if (!connectorState.createURL) {
	          connectorState.createURL = function (facetValue) {
	            if (!facetValue) {
	              var breadcrumb = helper.getHierarchicalFacetBreadcrumb(hierarchicalFacetName);

	              if (breadcrumb.length > 0) {
	                return createURL(helper.state.toggleFacetRefinement(hierarchicalFacetName, breadcrumb[0]));
	              }
	            }

	            return createURL(helper.state.toggleFacetRefinement(hierarchicalFacetName, facetValue));
	          };
	        }

	        if (!connectorState.refine) {
	          connectorState.refine = function (facetValue) {
	            if (!facetValue) {
	              var breadcrumb = helper.getHierarchicalFacetBreadcrumb(hierarchicalFacetName);

	              if (breadcrumb.length > 0) {
	                helper.toggleRefinement(hierarchicalFacetName, breadcrumb[0]).search();
	              }
	            } else {
	              helper.toggleRefinement(hierarchicalFacetName, facetValue).search();
	            }
	          };
	        }

	        return {
	          canRefine: items.length > 0,
	          createURL: connectorState.createURL,
	          items: items,
	          refine: connectorState.refine,
	          widgetParams: widgetParams
	        };
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters) {
	        if (searchParameters.isHierarchicalFacet(hierarchicalFacetName)) {
	          var facet = searchParameters.getHierarchicalFacetByName(hierarchicalFacetName);
	          "development".NODE_ENV === 'development' ? _warning(isEqual(facet.attributes, attributes) && facet.separator === separator && facet.rootPath === rootPath, 'Using Breadcrumb and HierarchicalMenu on the same facet with different options overrides the configuration of the HierarchicalMenu.') : void 0;
	          return searchParameters;
	        }

	        return searchParameters.addHierarchicalFacet({
	          name: hierarchicalFacetName,
	          attributes: attributes,
	          separator: separator,
	          rootPath: rootPath
	        });
	      }
	    };
	  };
	};

	function prepareItems(data) {
	  return data.reduce(function (result, currentItem) {
	    if (currentItem.isRefined) {
	      result.push({
	        label: currentItem.name,
	        value: currentItem.path
	      });

	      if (Array.isArray(currentItem.data)) {
	        result = result.concat(prepareItems(currentItem.data));
	      }
	    }

	    return result;
	  }, []);
	}

	function shiftItemsValues(array) {
	  return array.map(function (x, idx) {
	    return {
	      label: x.label,
	      value: idx + 1 === array.length ? null : array[idx + 1].value
	    };
	  });
	}

	function ownKeys$r(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$r(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$r(Object(source), true).forEach(function (key) {
	        _defineProperty$u(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$r(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$u(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$j = createDocumentationMessageGenerator({
	  name: 'geo-search',
	  connector: true
	});
	var $$type$4 = 'ais.geoSearch';
	/**
	 * @typedef {Object} LatLng
	 * @property {number} lat The latitude in degrees.
	 * @property {number} lng The longitude in degrees.
	 */

	/**
	 * @typedef {Object} Bounds
	 * @property {LatLng} northEast The top right corner of the map view.
	 * @property {LatLng} southWest The bottom left corner of the map view.
	 */

	/**
	 * @typedef {Object} CustomGeoSearchWidgetOptions
	 * @property {boolean} [enableRefineOnMapMove=true] If true, refine will be triggered as you move the map.
	 * @property {function(object[]):object[]} [transformItems] Function to transform the items passed to the templates.
	 */

	/**
	 * @typedef {Object} GeoSearchRenderingOptions
	 * @property {Object[]} items The matched hits from Algolia API.
	 * @property {LatLng} position The current position of the search.
	 * @property {Bounds} currentRefinement The current bounding box of the search.
	 * @property {function(Bounds)} refine Sets a bounding box to filter the results from the given map bounds.
	 * @property {function()} clearMapRefinement Reset the current bounding box refinement.
	 * @property {function(): boolean} isRefinedWithMap Return true if the current refinement is set with the map bounds.
	 * @property {function()} toggleRefineOnMapMove Toggle the fact that the user is able to refine on map move.
	 * @property {function(): boolean} isRefineOnMapMove Return true if the user is able to refine on map move.
	 * @property {function()} setMapMoveSinceLastRefine Set the fact that the map has moved since the last refinement, should be call on each map move. The call to the function triggers a new rendering only when the value change.
	 * @property {function(): boolean} hasMapMoveSinceLastRefine Return true if the map has move since the last refinement.
	 * @property {Object} widgetParams All original `CustomGeoSearchWidgetOptions` forwarded to the `renderFn`.
	 * @property {LatLng} [position] The current position of the search.
	 */

	/**
	 * The **GeoSearch** connector provides the logic to build a widget that will display the results on a map. It also provides a way to search for results based on their position. The connector provides functions to manage the search experience (search on map interaction or control the interaction for example).
	 *
	 * @requirements
	 *
	 * Note that the GeoSearch connector uses the [geosearch](https://www.algolia.com/doc/guides/searching/geo-search) capabilities of Algolia. Your hits **must** have a `_geoloc` attribute in order to be passed to the rendering function.
	 *
	 * Currently, the feature is not compatible with multiple values in the _geoloc attribute.
	 *
	 * @param {function(GeoSearchRenderingOptions, boolean)} renderFn Rendering function for the custom **GeoSearch** widget.
	 * @param {function} unmountFn Unmount function called when the widget is disposed.
	 * @return {function(CustomGeoSearchWidgetOptions)} Re-usable widget factory for a custom **GeoSearch** widget.
	 * @staticExample
	 * // This example use Leaflet for the rendering, be sure to have the library correctly setup
	 * // before trying the demo. You can find more details in their documentation (link below).
	 * // We choose Leaflet for the example but you can use any libraries that you want.
	 * // See: http://leafletjs.com/examples/quick-start
	 *
	 * let map = null;
	 * let markers = [];
	 *
	 * // custom `renderFn` to render the custom GeoSearch widget
	 * function renderFn(GeoSearchRenderingOptions, isFirstRendering) {
	 *   const { items, widgetParams } = GeoSearchRenderingOptions;
	 *
	 *   if (isFirstRendering) {
	 *     map = L.map(widgetParams.container);
	 *
	 *     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	 *       attribution:
	 *         '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
	 *     }).addTo(map);
	 *   }
	 *
	 *   markers.forEach(marker => marker.remove());
	 *
	 *   markers = items.map(({ _geoloc }) =>
	 *     L.marker([_geoloc.lat, _geoloc.lng]).addTo(map)
	 *   );
	 *
	 *   if (markers.length) {
	 *     map.fitBounds(L.featureGroup(markers).getBounds());
	 *   }
	 * }
	 *
	 * // connect `renderFn` to GeoSearch logic
	 * const customGeoSearch = instantsearch.connectors.connectGeoSearch(renderFn);
	 *
	 * // mount widget on the page
	 * search.addWidgets([
	 *   customGeoSearch({
	 *     container: document.getElementById('custom-geo-search'),
	 *   })
	 * ]);
	 */

	var connectGeoSearch = function connectGeoSearch(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$j());
	  return function () {
	    var widgetParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    var _widgetParams$enableR = widgetParams.enableRefineOnMapMove,
	        enableRefineOnMapMove = _widgetParams$enableR === void 0 ? true : _widgetParams$enableR,
	        _widgetParams$transfo = widgetParams.transformItems,
	        transformItems = _widgetParams$transfo === void 0 ? function (items) {
	      return items;
	    } : _widgetParams$transfo;
	    var widgetState = {
	      isRefineOnMapMove: enableRefineOnMapMove,
	      // @MAJOR hasMapMoveSinceLastRefine -> hasMapMovedSinceLastRefine
	      hasMapMoveSinceLastRefine: false,
	      lastRefinePosition: '',
	      lastRefineBoundingBox: '',
	      internalToggleRefineOnMapMove: noop,
	      internalSetMapMoveSinceLastRefine: noop
	    };

	    var getPositionFromState = function getPositionFromState(state) {
	      return state.aroundLatLng && aroundLatLngToPosition(state.aroundLatLng);
	    };

	    var getCurrentRefinementFromState = function getCurrentRefinementFromState(state) {
	      return state.insideBoundingBox && insideBoundingBoxToBoundingBox(state.insideBoundingBox);
	    };

	    var refine = function refine(helper) {
	      return function (_ref) {
	        var ne = _ref.northEast,
	            sw = _ref.southWest;
	        var boundingBox = [ne.lat, ne.lng, sw.lat, sw.lng].join();
	        helper.setQueryParameter('insideBoundingBox', boundingBox).search();
	        widgetState.hasMapMoveSinceLastRefine = false;
	        widgetState.lastRefineBoundingBox = boundingBox;
	      };
	    };

	    var clearMapRefinement = function clearMapRefinement(helper) {
	      return function () {
	        helper.setQueryParameter('insideBoundingBox', undefined).search();
	      };
	    };

	    var isRefinedWithMap = function isRefinedWithMap(state) {
	      return function () {
	        return Boolean(state.insideBoundingBox);
	      };
	    };

	    var toggleRefineOnMapMove = function toggleRefineOnMapMove() {
	      return widgetState.internalToggleRefineOnMapMove();
	    };

	    var createInternalToggleRefinementOnMapMove = function createInternalToggleRefinementOnMapMove(render, args) {
	      return function () {
	        widgetState.isRefineOnMapMove = !widgetState.isRefineOnMapMove;
	        render(args);
	      };
	    };

	    var isRefineOnMapMove = function isRefineOnMapMove() {
	      return widgetState.isRefineOnMapMove;
	    };

	    var setMapMoveSinceLastRefine = function setMapMoveSinceLastRefine() {
	      return widgetState.internalSetMapMoveSinceLastRefine();
	    };

	    var createInternalSetMapMoveSinceLastRefine = function createInternalSetMapMoveSinceLastRefine(render, args) {
	      return function () {
	        var shouldTriggerRender = widgetState.hasMapMoveSinceLastRefine !== true;
	        widgetState.hasMapMoveSinceLastRefine = true;

	        if (shouldTriggerRender) {
	          render(args);
	        }
	      };
	    };

	    var hasMapMoveSinceLastRefine = function hasMapMoveSinceLastRefine() {
	      return widgetState.hasMapMoveSinceLastRefine;
	    };

	    var sendEvent;
	    return {
	      $$type: $$type$4,
	      init: function init(initArgs) {
	        var instantSearchInstance = initArgs.instantSearchInstance;
	        var isFirstRendering = true;
	        widgetState.internalToggleRefineOnMapMove = createInternalToggleRefinementOnMapMove(noop, initArgs);
	        widgetState.internalSetMapMoveSinceLastRefine = createInternalSetMapMoveSinceLastRefine(noop, initArgs);
	        renderFn(_objectSpread$r({}, this.getWidgetRenderState(initArgs), {
	          instantSearchInstance: instantSearchInstance
	        }), isFirstRendering);
	      },
	      render: function render(renderArgs) {
	        var helper = renderArgs.helper,
	            instantSearchInstance = renderArgs.instantSearchInstance;
	        var isFirstRendering = false; // We don't use the state provided by the render function because we need
	        // to be sure that the state is the latest one for the following condition

	        var state = helper.state;
	        var positionChangedSinceLastRefine = Boolean(state.aroundLatLng) && Boolean(widgetState.lastRefinePosition) && state.aroundLatLng !== widgetState.lastRefinePosition;
	        var boundingBoxChangedSinceLastRefine = !state.insideBoundingBox && Boolean(widgetState.lastRefineBoundingBox) && state.insideBoundingBox !== widgetState.lastRefineBoundingBox;

	        if (positionChangedSinceLastRefine || boundingBoxChangedSinceLastRefine) {
	          widgetState.hasMapMoveSinceLastRefine = false;
	        }

	        widgetState.lastRefinePosition = state.aroundLatLng || '';
	        widgetState.lastRefineBoundingBox = state.insideBoundingBox || '';
	        widgetState.internalToggleRefineOnMapMove = createInternalToggleRefinementOnMapMove(this.render.bind(this), renderArgs);
	        widgetState.internalSetMapMoveSinceLastRefine = createInternalSetMapMoveSinceLastRefine(this.render.bind(this), renderArgs);
	        var widgetRenderState = this.getWidgetRenderState(renderArgs);
	        sendEvent('view', widgetRenderState.items);
	        renderFn(_objectSpread$r({}, widgetRenderState, {
	          instantSearchInstance: instantSearchInstance
	        }), isFirstRendering);
	      },
	      getWidgetRenderState: function getWidgetRenderState(renderOptions) {
	        var helper = renderOptions.helper,
	            results = renderOptions.results,
	            instantSearchInstance = renderOptions.instantSearchInstance;
	        var state = helper.state;
	        var items = results ? transformItems(results.hits.filter(function (hit) {
	          return hit._geoloc;
	        })) : [];

	        if (!sendEvent) {
	          sendEvent = createSendEventForHits({
	            instantSearchInstance: instantSearchInstance,
	            index: helper.getIndex(),
	            widgetType: $$type$4
	          });
	        }

	        return {
	          items: items,
	          position: getPositionFromState(state),
	          currentRefinement: getCurrentRefinementFromState(state),
	          refine: refine(helper),
	          sendEvent: sendEvent,
	          clearMapRefinement: clearMapRefinement(helper),
	          isRefinedWithMap: isRefinedWithMap(state),
	          toggleRefineOnMapMove: toggleRefineOnMapMove,
	          isRefineOnMapMove: isRefineOnMapMove,
	          setMapMoveSinceLastRefine: setMapMoveSinceLastRefine,
	          hasMapMoveSinceLastRefine: hasMapMoveSinceLastRefine,
	          widgetParams: widgetParams
	        };
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$r({}, renderState, {
	          geoSearch: this.getWidgetRenderState(renderOptions)
	        });
	      },
	      dispose: function dispose(_ref2) {
	        var state = _ref2.state;
	        unmountFn();
	        return state.setQueryParameter('insideBoundingBox', undefined);
	      },
	      getWidgetUiState: function getWidgetUiState(uiState, _ref3) {
	        var searchParameters = _ref3.searchParameters;
	        var boundingBox = searchParameters.insideBoundingBox;

	        if (!boundingBox || uiState && uiState.geoSearch && uiState.geoSearch.boundingBox === boundingBox) {
	          return uiState;
	        }

	        return _objectSpread$r({}, uiState, {
	          geoSearch: {
	            boundingBox: boundingBox
	          }
	        });
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref4) {
	        var uiState = _ref4.uiState;

	        if (!uiState || !uiState.geoSearch) {
	          return searchParameters.setQueryParameter('insideBoundingBox', undefined);
	        }

	        return searchParameters.setQueryParameter('insideBoundingBox', uiState.geoSearch.boundingBox);
	      }
	    };
	  };
	};

	function ownKeys$s(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$s(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$s(Object(source), true).forEach(function (key) {
	        _defineProperty$v(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$s(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$v(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$k = createDocumentationMessageGenerator({
	  name: 'powered-by',
	  connector: true
	});
	/**
	 * **PoweredBy** connector provides the logic to build a custom widget that will displays
	 * the logo to redirect to Algolia.
	 */

	var connectPoweredBy = function connectPoweredBy(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$k());
	  var defaultUrl = 'https://www.algolia.com/?' + 'utm_source=instantsearch.js&' + 'utm_medium=website&' + "utm_content=".concat(typeof window !== 'undefined' && window.location ? window.location.hostname : '', "&") + 'utm_campaign=poweredby';
	  return function (widgetParams) {
	    var _ref = widgetParams || {},
	        _ref$url = _ref.url,
	        url = _ref$url === void 0 ? defaultUrl : _ref$url;

	    return {
	      $$type: 'ais.poweredBy',
	      init: function init(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        renderFn(_objectSpread$s({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        renderFn(_objectSpread$s({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$s({}, renderState, {
	          poweredBy: this.getWidgetRenderState(renderOptions)
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState() {
	        return {
	          url: url,
	          widgetParams: widgetParams
	        };
	      },
	      dispose: function dispose() {
	        unmountFn();
	      }
	    };
	  };
	};

	function ownKeys$t(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$t(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$t(Object(source), true).forEach(function (key) {
	        _defineProperty$w(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$t(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$w(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	/**
	 * Refine the given search parameters.
	 */

	var withUsage$l = createDocumentationMessageGenerator({
	  name: 'configure',
	  connector: true
	});

	function getInitialSearchParameters(state, widgetParams) {
	  // We leverage the helper internals to remove the `widgetParams` from
	  // the state. The function `setQueryParameters` omits the values that
	  // are `undefined` on the next state.
	  return state.setQueryParameters(Object.keys(widgetParams.searchParameters).reduce(function (acc, key) {
	    return _objectSpread$t({}, acc, _defineProperty$w({}, key, undefined));
	  }, {}));
	}

	var connectConfigure = function connectConfigure() {
	  var renderFn = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : noop;
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  return function (widgetParams) {
	    if (!widgetParams || !isPlainObject(widgetParams.searchParameters)) {
	      throw new Error(withUsage$l('The `searchParameters` option expects an object.'));
	    }

	    var connectorState = {};

	    function refine(helper) {
	      return function (searchParameters) {
	        // Merge new `searchParameters` with the ones set from other widgets
	        var actualState = getInitialSearchParameters(helper.state, widgetParams);
	        var nextSearchParameters = merge$1(actualState, new algoliasearchHelper_1.SearchParameters(searchParameters)); // Update original `widgetParams.searchParameters` to the new refined one

	        widgetParams.searchParameters = searchParameters; // Trigger a search with the resolved search parameters

	        helper.setState(nextSearchParameters).search();
	      };
	    }

	    return {
	      $$type: 'ais.configure',
	      init: function init(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        renderFn(_objectSpread$t({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        renderFn(_objectSpread$t({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      dispose: function dispose(_ref) {
	        var state = _ref.state;
	        unmountFn();
	        return getInitialSearchParameters(state, widgetParams);
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        var _renderState$configur;

	        var widgetRenderState = this.getWidgetRenderState(renderOptions);
	        return _objectSpread$t({}, renderState, {
	          configure: _objectSpread$t({}, widgetRenderState, {
	            widgetParams: _objectSpread$t({}, widgetRenderState.widgetParams, {
	              searchParameters: merge$1(new algoliasearchHelper_1.SearchParameters((_renderState$configur = renderState.configure) === null || _renderState$configur === void 0 ? void 0 : _renderState$configur.widgetParams.searchParameters), new algoliasearchHelper_1.SearchParameters(widgetRenderState.widgetParams.searchParameters)).getQueryParams()
	            })
	          })
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref2) {
	        var helper = _ref2.helper;

	        if (!connectorState.refine) {
	          connectorState.refine = refine(helper);
	        }

	        return {
	          refine: connectorState.refine,
	          widgetParams: widgetParams
	        };
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(state, _ref3) {
	        var uiState = _ref3.uiState;
	        return merge$1(state, new algoliasearchHelper_1.SearchParameters(_objectSpread$t({}, uiState.configure, {}, widgetParams.searchParameters)));
	      },
	      getWidgetUiState: function getWidgetUiState(uiState) {
	        return _objectSpread$t({}, uiState, {
	          configure: _objectSpread$t({}, uiState.configure, {}, widgetParams.searchParameters)
	        });
	      }
	    };
	  };
	};

	function ownKeys$u(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$u(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$u(Object(source), true).forEach(function (key) {
	        _defineProperty$x(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$u(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$x(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	function _toConsumableArray$8(arr) {
	  return _arrayWithoutHoles$8(arr) || _iterableToArray$8(arr) || _nonIterableSpread$8();
	}

	function _nonIterableSpread$8() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance");
	}

	function _iterableToArray$8(iter) {
	  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
	}

	function _arrayWithoutHoles$8(arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
	      arr2[i] = arr[i];
	    }

	    return arr2;
	  }
	}
	var withUsage$m = createDocumentationMessageGenerator({
	  name: 'configure-related-items',
	  connector: true
	});

	function createOptionalFilter(_ref) {
	  var attributeName = _ref.attributeName,
	      attributeValue = _ref.attributeValue,
	      attributeScore = _ref.attributeScore;
	  return "".concat(attributeName, ":").concat(attributeValue, "<score=").concat(attributeScore || 1, ">");
	}

	var connectConfigureRelatedItems = function connectConfigureRelatedItems(renderFn, unmountFn) {
	  return function (widgetParams) {
	    var _ref2 = widgetParams || {},
	        hit = _ref2.hit,
	        matchingPatterns = _ref2.matchingPatterns,
	        _ref2$transformSearch = _ref2.transformSearchParameters,
	        transformSearchParameters = _ref2$transformSearch === void 0 ? function (x) {
	      return x;
	    } : _ref2$transformSearch;

	    if (!hit) {
	      throw new Error(withUsage$m('The `hit` option is required.'));
	    }

	    if (!matchingPatterns) {
	      throw new Error(withUsage$m('The `matchingPatterns` option is required.'));
	    }

	    var optionalFilters = Object.keys(matchingPatterns).reduce(function (acc, attributeName) {
	      var attribute = matchingPatterns[attributeName];
	      var attributeValue = getPropertyByPath(hit, attributeName);
	      var attributeScore = attribute.score;

	      if (Array.isArray(attributeValue)) {
	        return [].concat(_toConsumableArray$8(acc), [attributeValue.map(function (attributeSubValue) {
	          return createOptionalFilter({
	            attributeName: attributeName,
	            attributeValue: attributeSubValue,
	            attributeScore: attributeScore
	          });
	        })]);
	      }

	      if (typeof attributeValue === 'string') {
	        return [].concat(_toConsumableArray$8(acc), [createOptionalFilter({
	          attributeName: attributeName,
	          attributeValue: attributeValue,
	          attributeScore: attributeScore
	        })]);
	      }

	      "development".NODE_ENV === 'development' ? _warning(false, "\nThe `matchingPatterns` option returned a value of type ".concat(getObjectType(attributeValue), " for the \"").concat(attributeName, "\" key. This value was not sent to Algolia because `optionalFilters` only supports strings and array of strings.\n\nYou can remove the \"").concat(attributeName, "\" key from the `matchingPatterns` option.\n\nSee https://www.algolia.com/doc/api-reference/api-parameters/optionalFilters/\n            ")) : void 0;
	      return acc;
	    }, []);

	    var searchParameters = _objectSpread$u({}, transformSearchParameters(new algoliasearchHelper_1.SearchParameters({
	      sumOrFiltersScores: true,
	      facetFilters: ["objectID:-".concat(hit.objectID)],
	      optionalFilters: optionalFilters
	    })));

	    var makeConfigure = connectConfigure(renderFn, unmountFn);
	    return _objectSpread$u({}, makeConfigure({
	      searchParameters: searchParameters
	    }), {
	      $$type: 'ais.configureRelatedItems'
	    });
	  };
	};

	function ownKeys$v(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$v(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$v(Object(source), true).forEach(function (key) {
	        _defineProperty$y(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$v(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$y(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$n = createDocumentationMessageGenerator({
	  name: 'autocomplete',
	  connector: true
	});

	var connectAutocomplete = function connectAutocomplete(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$n());
	  return function (widgetParams) {
	    var _ref = widgetParams || {},
	        _ref$escapeHTML = _ref.escapeHTML,
	        escapeHTML = _ref$escapeHTML === void 0 ? true : _ref$escapeHTML;

	    "development".NODE_ENV === 'development' ? _warning(!widgetParams.indices, "\nThe option `indices` has been removed from the Autocomplete connector.\n\nThe indices to target are now inferred from the widgets tree.\n".concat(Array.isArray(widgetParams.indices) ? "\nAn alternative would be:\n\nconst autocomplete = connectAutocomplete(renderer);\n\nsearch.addWidgets([\n  ".concat(widgetParams.indices.map(function (_ref2) {
	      var value = _ref2.value;
	      return "index({ indexName: '".concat(value, "' }),");
	    }).join('\n  '), "\n  autocomplete()\n]);\n") : '', "\n      ")) : void 0;
	    var connectorState = {};
	    return {
	      $$type: 'ais.autocomplete',
	      init: function init(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        renderFn(_objectSpread$v({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        var renderState = this.getWidgetRenderState(renderOptions);
	        renderState.indices.forEach(function (_ref3) {
	          var sendEvent = _ref3.sendEvent,
	              hits = _ref3.hits;
	          sendEvent('view', hits);
	        });
	        renderFn(_objectSpread$v({}, renderState, {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$v({}, renderState, {
	          autocomplete: this.getWidgetRenderState(renderOptions)
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref4) {
	        var _this = this;

	        var helper = _ref4.helper,
	            scopedResults = _ref4.scopedResults,
	            instantSearchInstance = _ref4.instantSearchInstance;

	        if (!connectorState.refine) {
	          connectorState.refine = function (query) {
	            helper.setQuery(query).search();
	          };
	        }

	        var indices = scopedResults.map(function (scopedResult) {
	          // We need to escape the hits because highlighting
	          // exposes HTML tags to the end-user.
	          scopedResult.results.hits = escapeHTML ? escapeHits(scopedResult.results.hits) : scopedResult.results.hits;
	          var sendEvent = createSendEventForHits({
	            instantSearchInstance: instantSearchInstance,
	            index: scopedResult.results.index,
	            widgetType: _this.$$type
	          });
	          return {
	            indexId: scopedResult.indexId,
	            indexName: scopedResult.results.index,
	            hits: scopedResult.results.hits,
	            results: scopedResult.results,
	            sendEvent: sendEvent
	          };
	        });
	        return {
	          currentRefinement: helper.state.query || '',
	          indices: indices,
	          refine: connectorState.refine,
	          widgetParams: widgetParams
	        };
	      },
	      getWidgetUiState: function getWidgetUiState(uiState, _ref5) {
	        var searchParameters = _ref5.searchParameters;
	        var query = searchParameters.query || '';

	        if (query === '' || uiState && uiState.query === query) {
	          return uiState;
	        }

	        return _objectSpread$v({}, uiState, {
	          query: query
	        });
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref6) {
	        var uiState = _ref6.uiState;
	        var parameters = {
	          query: uiState.query || ''
	        };

	        if (!escapeHTML) {
	          return searchParameters.setQueryParameters(parameters);
	        }

	        return searchParameters.setQueryParameters(_objectSpread$v({}, parameters, {}, TAG_PLACEHOLDER));
	      },
	      dispose: function dispose(_ref7) {
	        var state = _ref7.state;
	        unmountFn();
	        var stateWithoutQuery = state.setQueryParameter('query', undefined);

	        if (!escapeHTML) {
	          return stateWithoutQuery;
	        }

	        return stateWithoutQuery.setQueryParameters(Object.keys(TAG_PLACEHOLDER).reduce(function (acc, key) {
	          return _objectSpread$v({}, acc, _defineProperty$y({}, key, undefined));
	        }, {}));
	      }
	    };
	  };
	};

	function ownKeys$w(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$w(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$w(Object(source), true).forEach(function (key) {
	        _defineProperty$z(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$w(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$z(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	function _toConsumableArray$9(arr) {
	  return _arrayWithoutHoles$9(arr) || _iterableToArray$9(arr) || _nonIterableSpread$9();
	}

	function _nonIterableSpread$9() {
	  throw new TypeError("Invalid attempt to spread non-iterable instance");
	}

	function _iterableToArray$9(iter) {
	  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
	}

	function _arrayWithoutHoles$9(arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
	      arr2[i] = arr[i];
	    }

	    return arr2;
	  }
	}
	var withUsage$o = createDocumentationMessageGenerator({
	  name: 'query-rules',
	  connector: true
	});

	function hasStateRefinements(state) {
	  return [state.disjunctiveFacetsRefinements, state.facetsRefinements, state.hierarchicalFacetsRefinements, state.numericRefinements].some(function (refinement) {
	    return Boolean(refinement && Object.keys(refinement).length > 0);
	  });
	} // A context rule must consist only of alphanumeric characters, hyphens, and underscores.
	// See https://www.algolia.com/doc/guides/managing-results/refine-results/merchandising-and-promoting/in-depth/implementing-query-rules/#context


	function escapeRuleContext(ruleName) {
	  return ruleName.replace(/[^a-z0-9-_]+/gi, '_');
	}

	function getRuleContextsFromTrackedFilters(_ref) {
	  var helper = _ref.helper,
	      sharedHelperState = _ref.sharedHelperState,
	      trackedFilters = _ref.trackedFilters;
	  var ruleContexts = Object.keys(trackedFilters).reduce(function (facets, facetName) {
	    var facetRefinements = getRefinements( // An empty object is technically not a `SearchResults` but `getRefinements`
	    // only accesses properties, meaning it will not throw with an empty object.
	    helper.lastResults || {}, sharedHelperState).filter(function (refinement) {
	      return refinement.attribute === facetName;
	    }).map(function (refinement) {
	      return refinement.numericValue || refinement.name;
	    });
	    var getTrackedFacetValues = trackedFilters[facetName];
	    var trackedFacetValues = getTrackedFacetValues(facetRefinements);
	    return [].concat(_toConsumableArray$9(facets), _toConsumableArray$9(facetRefinements.filter(function (facetRefinement) {
	      return trackedFacetValues.includes(facetRefinement);
	    }).map(function (facetValue) {
	      return escapeRuleContext("ais-".concat(facetName, "-").concat(facetValue));
	    })));
	  }, []);
	  return ruleContexts;
	}

	function applyRuleContexts(event) {
	  var helper = this.helper,
	      initialRuleContexts = this.initialRuleContexts,
	      trackedFilters = this.trackedFilters,
	      transformRuleContexts = this.transformRuleContexts;
	  var sharedHelperState = event.state;
	  var previousRuleContexts = sharedHelperState.ruleContexts || [];
	  var newRuleContexts = getRuleContextsFromTrackedFilters({
	    helper: helper,
	    sharedHelperState: sharedHelperState,
	    trackedFilters: trackedFilters
	  });
	  var nextRuleContexts = [].concat(_toConsumableArray$9(initialRuleContexts), _toConsumableArray$9(newRuleContexts));
	  "development".NODE_ENV === 'development' ? _warning(nextRuleContexts.length <= 10, "\nThe maximum number of `ruleContexts` is 10. They have been sliced to that limit.\nConsider using `transformRuleContexts` to minimize the number of rules sent to Algolia.\n") : void 0;
	  var ruleContexts = transformRuleContexts(nextRuleContexts).slice(0, 10);

	  if (!isEqual(previousRuleContexts, ruleContexts)) {
	    helper.overrideStateWithoutTriggeringChangeEvent(_objectSpread$w({}, sharedHelperState, {
	      ruleContexts: ruleContexts
	    }));
	  }
	}

	var connectQueryRules = function connectQueryRules(_render) {
	  var unmount = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(_render, withUsage$o());
	  return function (widgetParams) {
	    var _ref2 = widgetParams || {},
	        _ref2$trackedFilters = _ref2.trackedFilters,
	        trackedFilters = _ref2$trackedFilters === void 0 ? {} : _ref2$trackedFilters,
	        _ref2$transformRuleCo = _ref2.transformRuleContexts,
	        transformRuleContexts = _ref2$transformRuleCo === void 0 ? function (rules) {
	      return rules;
	    } : _ref2$transformRuleCo,
	        _ref2$transformItems = _ref2.transformItems,
	        transformItems = _ref2$transformItems === void 0 ? function (items) {
	      return items;
	    } : _ref2$transformItems;

	    Object.keys(trackedFilters).forEach(function (facetName) {
	      if (typeof trackedFilters[facetName] !== 'function') {
	        throw new Error(withUsage$o("'The \"".concat(facetName, "\" filter value in the `trackedFilters` option expects a function.")));
	      }
	    });
	    var hasTrackedFilters = Object.keys(trackedFilters).length > 0; // We store the initial rule contexts applied before creating the widget
	    // so that we do not override them with the rules created from `trackedFilters`.

	    var initialRuleContexts = [];
	    var onHelperChange;
	    return {
	      $$type: 'ais.queryRules',
	      init: function init(initOptions) {
	        var helper = initOptions.helper,
	            state = initOptions.state,
	            instantSearchInstance = initOptions.instantSearchInstance;
	        initialRuleContexts = state.ruleContexts || [];
	        onHelperChange = applyRuleContexts.bind({
	          helper: helper,
	          initialRuleContexts: initialRuleContexts,
	          trackedFilters: trackedFilters,
	          transformRuleContexts: transformRuleContexts
	        });

	        if (hasTrackedFilters) {
	          // We need to apply the `ruleContexts` based on the `trackedFilters`
	          // before the helper changes state in some cases:
	          //   - Some filters are applied on the first load (e.g. using `configure`)
	          //   - The `transformRuleContexts` option sets initial `ruleContexts`.
	          if (hasStateRefinements(state) || Boolean(widgetParams.transformRuleContexts)) {
	            onHelperChange({
	              state: state
	            });
	          } // We track every change in the helper to override its state and add
	          // any `ruleContexts` needed based on the `trackedFilters`.


	          helper.on('change', onHelperChange);
	        }

	        _render(_objectSpread$w({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;

	        _render(_objectSpread$w({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      getWidgetRenderState: function getWidgetRenderState(_ref3) {
	        var results = _ref3.results;

	        var _ref4 = results || {},
	            _ref4$userData = _ref4.userData,
	            userData = _ref4$userData === void 0 ? [] : _ref4$userData;

	        var items = transformItems(userData);
	        return {
	          items: items,
	          widgetParams: widgetParams
	        };
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$w({}, renderState, {
	          queryRules: this.getWidgetRenderState(renderOptions)
	        });
	      },
	      dispose: function dispose(_ref5) {
	        var helper = _ref5.helper,
	            state = _ref5.state;
	        unmount();

	        if (hasTrackedFilters) {
	          helper.removeListener('change', onHelperChange);
	          return state.setQueryParameter('ruleContexts', initialRuleContexts);
	        }

	        return state;
	      }
	    };
	  };
	};

	function ownKeys$x(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$x(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$x(Object(source), true).forEach(function (key) {
	        _defineProperty$A(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$x(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$A(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}

	var createVoiceSearchHelper = function createVoiceSearchHelper(_ref) {
	  var searchAsYouSpeak = _ref.searchAsYouSpeak,
	      language = _ref.language,
	      onQueryChange = _ref.onQueryChange,
	      onStateChange = _ref.onStateChange;
	  var SpeechRecognitionAPI = window.webkitSpeechRecognition || window.SpeechRecognition;

	  var getDefaultState = function getDefaultState(status) {
	    return {
	      status: status,
	      transcript: '',
	      isSpeechFinal: false,
	      errorCode: undefined
	    };
	  };

	  var state = getDefaultState('initial');
	  var recognition;

	  var isBrowserSupported = function isBrowserSupported() {
	    return Boolean(SpeechRecognitionAPI);
	  };

	  var isListening = function isListening() {
	    return state.status === 'askingPermission' || state.status === 'waiting' || state.status === 'recognizing';
	  };

	  var setState = function setState() {
	    var newState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    state = _objectSpread$x({}, state, {}, newState);
	    onStateChange();
	  };

	  var getState = function getState() {
	    return state;
	  };

	  var resetState = function resetState() {
	    var status = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'initial';
	    setState(getDefaultState(status));
	  };

	  var onStart = function onStart() {
	    setState({
	      status: 'waiting'
	    });
	  };

	  var onError = function onError(event) {
	    setState({
	      status: 'error',
	      errorCode: event.error
	    });
	  };

	  var onResult = function onResult(event) {
	    setState({
	      status: 'recognizing',
	      transcript: event.results[0] && event.results[0][0] && event.results[0][0].transcript || '',
	      isSpeechFinal: event.results[0] && event.results[0].isFinal
	    });

	    if (searchAsYouSpeak && state.transcript) {
	      onQueryChange(state.transcript);
	    }
	  };

	  var onEnd = function onEnd() {
	    if (!state.errorCode && state.transcript && !searchAsYouSpeak) {
	      onQueryChange(state.transcript);
	    }

	    if (state.status !== 'error') {
	      setState({
	        status: 'finished'
	      });
	    }
	  };

	  var startListening = function startListening() {
	    recognition = new SpeechRecognitionAPI();

	    if (!recognition) {
	      return;
	    }

	    resetState('askingPermission');
	    recognition.interimResults = true;

	    if (language) {
	      recognition.lang = language;
	    }

	    recognition.addEventListener('start', onStart);
	    recognition.addEventListener('error', onError);
	    recognition.addEventListener('result', onResult);
	    recognition.addEventListener('end', onEnd);
	    recognition.start();
	  };

	  var dispose = function dispose() {
	    if (!recognition) {
	      return;
	    }

	    recognition.stop();
	    recognition.removeEventListener('start', onStart);
	    recognition.removeEventListener('error', onError);
	    recognition.removeEventListener('result', onResult);
	    recognition.removeEventListener('end', onEnd);
	    recognition = undefined;
	  };

	  var stopListening = function stopListening() {
	    dispose(); // Because `dispose` removes event listeners, `end` listener is not called.
	    // So we're setting the `status` as `finished` here.
	    // If we don't do it, it will be still `waiting` or `recognizing`.

	    resetState('finished');
	  };

	  return {
	    getState: getState,
	    isBrowserSupported: isBrowserSupported,
	    isListening: isListening,
	    startListening: startListening,
	    stopListening: stopListening,
	    dispose: dispose
	  };
	};

	function ownKeys$y(object, enumerableOnly) {
	  var keys = Object.keys(object);

	  if (Object.getOwnPropertySymbols) {
	    var symbols = Object.getOwnPropertySymbols(object);
	    if (enumerableOnly) symbols = symbols.filter(function (sym) {
	      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
	    });
	    keys.push.apply(keys, symbols);
	  }

	  return keys;
	}

	function _objectSpread$y(target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i] != null ? arguments[i] : {};

	    if (i % 2) {
	      ownKeys$y(Object(source), true).forEach(function (key) {
	        _defineProperty$B(target, key, source[key]);
	      });
	    } else if (Object.getOwnPropertyDescriptors) {
	      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
	    } else {
	      ownKeys$y(Object(source)).forEach(function (key) {
	        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
	      });
	    }
	  }

	  return target;
	}

	function _defineProperty$B(obj, key, value) {
	  if (key in obj) {
	    Object.defineProperty(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }

	  return obj;
	}
	var withUsage$p = createDocumentationMessageGenerator({
	  name: 'voice-search',
	  connector: true
	});

	var connectVoiceSearch = function connectVoiceSearch(renderFn) {
	  var unmountFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
	  checkRendering(renderFn, withUsage$p());
	  return function (widgetParams) {
	    var _widgetParams$searchA = widgetParams.searchAsYouSpeak,
	        searchAsYouSpeak = _widgetParams$searchA === void 0 ? false : _widgetParams$searchA,
	        language = widgetParams.language,
	        additionalQueryParameters = widgetParams.additionalQueryParameters,
	        _widgetParams$createV = widgetParams.createVoiceSearchHelper,
	        createVoiceSearchHelper$1 = _widgetParams$createV === void 0 ? createVoiceSearchHelper : _widgetParams$createV;
	    return {
	      $$type: 'ais.voiceSearch',
	      init: function init(initOptions) {
	        var instantSearchInstance = initOptions.instantSearchInstance;
	        renderFn(_objectSpread$y({}, this.getWidgetRenderState(initOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), true);
	      },
	      render: function render(renderOptions) {
	        var instantSearchInstance = renderOptions.instantSearchInstance;
	        renderFn(_objectSpread$y({}, this.getWidgetRenderState(renderOptions), {
	          instantSearchInstance: instantSearchInstance
	        }), false);
	      },
	      getRenderState: function getRenderState(renderState, renderOptions) {
	        return _objectSpread$y({}, renderState, {
	          voiceSearch: this.getWidgetRenderState(renderOptions)
	        });
	      },
	      getWidgetRenderState: function getWidgetRenderState(renderOptions) {
	        var _this = this;

	        var helper = renderOptions.helper,
	            instantSearchInstance = renderOptions.instantSearchInstance;

	        if (!this._refine) {
	          this._refine = function (query) {
	            if (query !== helper.state.query) {
	              var queryLanguages = language ? [language.split('-')[0]] : undefined;
	              helper.setQueryParameter('queryLanguages', queryLanguages);

	              if (typeof additionalQueryParameters === 'function') {
	                helper.setState(helper.state.setQueryParameters(_objectSpread$y({
	                  ignorePlurals: true,
	                  removeStopWords: true,
	                  // @ts-ignore (optionalWords only allows array, while string is also valid)
	                  optionalWords: query
	                }, additionalQueryParameters({
	                  query: query
	                }))));
	              }

	              helper.setQuery(query).search();
	            }
	          };
	        }

	        if (!this._voiceSearchHelper) {
	          this._voiceSearchHelper = createVoiceSearchHelper$1({
	            searchAsYouSpeak: searchAsYouSpeak,
	            language: language,
	            onQueryChange: function onQueryChange(query) {
	              return _this._refine(query);
	            },
	            onStateChange: function onStateChange() {
	              renderFn(_objectSpread$y({}, _this.getWidgetRenderState(renderOptions), {
	                instantSearchInstance: instantSearchInstance
	              }), false);
	            }
	          });
	        }

	        var _voiceSearchHelper = this._voiceSearchHelper,
	            isBrowserSupported = _voiceSearchHelper.isBrowserSupported,
	            isListening = _voiceSearchHelper.isListening,
	            startListening = _voiceSearchHelper.startListening,
	            stopListening = _voiceSearchHelper.stopListening,
	            getState = _voiceSearchHelper.getState;
	        return {
	          isBrowserSupported: isBrowserSupported(),
	          isListening: isListening(),
	          toggleListening: function toggleListening() {
	            if (!isBrowserSupported()) {
	              return;
	            }

	            if (isListening()) {
	              stopListening();
	            } else {
	              startListening();
	            }
	          },
	          voiceListeningState: getState(),
	          widgetParams: widgetParams
	        };
	      },
	      dispose: function dispose(_ref) {
	        var state = _ref.state;

	        this._voiceSearchHelper.dispose();

	        unmountFn();
	        var newState = state;

	        if (typeof additionalQueryParameters === 'function') {
	          var additional = additionalQueryParameters({
	            query: ''
	          });
	          var toReset = additional ? Object.keys(additional).reduce(function (acc, current) {
	            acc[current] = undefined;
	            return acc;
	          }, {}) : {};
	          newState = state.setQueryParameters(_objectSpread$y({
	            // @ts-ignore (queryLanguages is not yet added to algoliasearch)
	            queryLanguages: undefined,
	            ignorePlurals: undefined,
	            removeStopWords: undefined,
	            optionalWords: undefined
	          }, toReset));
	        }

	        return newState.setQueryParameter('query', undefined);
	      },
	      getWidgetUiState: function getWidgetUiState(uiState, _ref2) {
	        var searchParameters = _ref2.searchParameters;
	        var query = searchParameters.query || '';

	        if (!query) {
	          return uiState;
	        }

	        return _objectSpread$y({}, uiState, {
	          query: query
	        });
	      },
	      getWidgetSearchParameters: function getWidgetSearchParameters(searchParameters, _ref3) {
	        var uiState = _ref3.uiState;
	        return searchParameters.setQueryParameter('query', uiState.query || '');
	      }
	    };
	  };
	};

	var connectors = {
		__proto__: null,
		connectClearRefinements: connectClearRefinements,
		connectCurrentRefinements: connectCurrentRefinements,
		connectHierarchicalMenu: connectHierarchicalMenu,
		connectHits: connectHits,
		connectHitsWithInsights: connectHitsWithInsights,
		connectHitsPerPage: connectHitsPerPage,
		connectInfiniteHits: connectInfiniteHits,
		connectInfiniteHitsWithInsights: connectInfiniteHitsWithInsights,
		connectMenu: connectMenu,
		connectNumericMenu: connectNumericMenu,
		connectPagination: connectPagination,
		connectRange: connectRange,
		connectRefinementList: connectRefinementList,
		connectSearchBox: connectSearchBox,
		connectSortBy: connectSortBy,
		connectRatingMenu: connectRatingMenu,
		connectStats: connectStats,
		connectToggleRefinement: connectToggleRefinement,
		connectBreadcrumb: connectBreadcrumb,
		connectGeoSearch: connectGeoSearch,
		connectPoweredBy: connectPoweredBy,
		connectConfigure: connectConfigure,
		EXPERIMENTAL_connectConfigureRelatedItems: connectConfigureRelatedItems,
		connectAutocomplete: connectAutocomplete,
		connectQueryRules: connectQueryRules,
		connectVoiceSearch: connectVoiceSearch
	};

	function factory(algoliasearch, instantsearch, connectors) {
	  var BladeAlpineInstantSearch = function BladeAlpineInstantSearch() {
	    return {
	      search: '',
	      algolia: null,
	      hits: [],
	      init: function init() {
	        var config = JSON.parse(this.$el.dataset.config);
	        var client = algoliasearch(config.id, config.key);
	        this.algolia = instantsearch({
	          indexName: config.index,
	          searchClient: client
	        });
	        this.algolia.start();
	      },
	      addWidget: function addWidget(widget) {
	        var _this = this;

	        var connector = "connect" + widget.name;

	        var callback = function callback(options, first_render) {
	          if (connector in _this) {
	            _this[connector](options, first_render);
	          }

	          widget.connect(options, first_render);
	        };

	        this.algolia.addWidget(connectors[connector](callback)(widget.config));
	      },
	      // connectSearchBox(options, first_render) {
	      // 	let { query, refine } = options;
	      //	
	      // 	if (first_render) {
	      // 		this.$watch('search', value => refine(value));
	      // 	}
	      //	
	      // 	this.search = query;
	      // },
	      connectHits: function connectHits(options) {
	        this.hits = options.hits;
	      }
	    };
	  };

	  BladeAlpineInstantSearch.widget = function () {
	    return {
	      name: '',
	      config: {},
	      items: [],
	      first_render: true,
	      init: function init() {
	        var _this2 = this;

	        var _JSON$parse = JSON.parse(this.$el.dataset.config),
	            name = _JSON$parse.name,
	            config = _JSON$parse.config,
	            defaults = _JSON$parse.defaults;

	        this.name = name;
	        this.config = config;
	        Object.entries(defaults).forEach(function (_ref) {
	          var key = _ref[0],
	              value = _ref[1];
	          return _this2[key] = value;
	        });
	        setTimeout(function () {
	          return _this2.$parent.addWidget(_this2);
	        }, 1);
	      },
	      connect: function connect(options, first_render) {
	        var _this3 = this;

	        this.first_render = first_render;
	        Object.entries(options).forEach(function (_ref2) {
	          var key = _ref2[0],
	              value = _ref2[1];
	          return _this3[key] = value;
	        });
	      }
	    };
	  };

	  return BladeAlpineInstantSearch;
	}

	var rootAlgoliaAlpine = factory(algoliasearchLite_umd, instantsearch, connectors);

	return rootAlgoliaAlpine;

}());
