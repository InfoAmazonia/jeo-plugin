/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = ".//dist";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 7);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./assets/javascript/blocks/newsletter/index.js":
/*!******************************************************!*\
  !*** ./assets/javascript/blocks/newsletter/index.js ***!
  \******************************************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);


 //const {  } = wp.editor;

wp.blocks.registerBlockType("jeo-theme/custom-newsletter-block", {
  title: "Newsletter",
  icon: "email",
  category: "common",
  supports: {
    align: true
  },
  attributes: {
    title: {
      type: "string"
    },
    typeNews: {
      type: "string"
    },
    subtitle: {
      type: "string"
    },
    newsletterShortcode: {
      type: "string"
    },
    lastEditionLink: {
      type: "string"
    },
    adicionalContent: {
      type: "string"
    },
    customStyle: {
      type: "string"
    }
  },
  edit: function edit(props) {
    var className = props.className,
        isSelected = props.isSelected,
        _props$attributes = props.attributes,
        title = _props$attributes.title,
        subtitle = _props$attributes.subtitle,
        newsletterShortcode = _props$attributes.newsletterShortcode,
        adicionalContent = _props$attributes.adicionalContent,
        customStyle = _props$attributes.customStyle,
        typeNews = _props$attributes.typeNews,
        setAttributes = props.setAttributes;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "newsletter-wrapper",
      key: "container"
    }, /*#__PURE__*/React.createElement("div", {
      "class": "category-page-sidebar"
    }, /*#__PURE__*/React.createElement(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__["SelectControl"], {
      label: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__["__"])('Select newsletter type:'),
      value: typeNews,
      onChange: function onChange(value) {
        setAttributes({
          typeNews: value
        });
      },
      options: [{
        value: null,
        label: 'Select a type',
        disabled: true
      }, {
        value: 'horizontal',
        label: 'Horizontal'
      }, {
        value: 'vertical',
        label: 'Vertical'
      }]
    }), /*#__PURE__*/React.createElement(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__["TextControl"], {
      label: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__["__"])('Add custom css:'),
      value: customStyle,
      onChange: function onChange(value) {
        setAttributes({
          customStyle: value
        });
      }
    }), /*#__PURE__*/React.createElement("div", {
      "class": "newsletter"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("i", {
      "class": "fa fa-envelope fa-3x",
      "aria-hidden": "true"
    }), /*#__PURE__*/React.createElement("div", {
      "class": "newsletter-header"
    }, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"], {
      tagName: "p",
      placeholder: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__["__"])("Title"),
      value: title,
      onChange: function onChange(value) {
        return setAttributes({
          title: value
        });
      }
    })), /*#__PURE__*/React.createElement("div", {
      "class": "customized-content"
    }, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"], {
      tagName: "p",
      className: "anchor-text",
      placeholder: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__["__"])("Subtitle"),
      value: subtitle,
      onChange: function onChange(value) {
        return setAttributes({
          subtitle: value
        });
      }
    }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["InnerBlocks"], {
      allowedBlocks: ['core/shortcode'],
      template: [['core/shortcode', {
        placeholder: 'Newsletter shortcode'
      }]]
    }), /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"], {
      tagName: "p",
      className: "link-add",
      placeholder: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__["__"])("Adicional Information"),
      value: adicionalContent,
      onChange: function onChange(value) {
        return setAttributes({
          adicionalContent: value
        });
      }
    }))))));
  },
  save: function save(props) {
    var className = props.className,
        isSelected = props.isSelected,
        _props$attributes2 = props.attributes,
        title = _props$attributes2.title,
        subtitle = _props$attributes2.subtitle,
        newsletterShortcode = _props$attributes2.newsletterShortcode,
        adicionalContent = _props$attributes2.adicionalContent,
        align = _props$attributes2.align,
        typeNews = _props$attributes2.typeNews,
        customStyle = _props$attributes2.customStyle,
        setAttributes = props.setAttributes;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "newsletter-wrapper",
      key: "container"
    }, /*#__PURE__*/React.createElement("div", {
      "class": "category-page-sidebar"
    }, /*#__PURE__*/React.createElement("div", {
      "class": "newsletter ".concat(typeNews, " ").concat(customStyle)
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("i", {
      "class": "fa fa-envelope fa-3x",
      "aria-hidden": "true"
    }), /*#__PURE__*/React.createElement("div", {
      "class": "newsletter-header"
    }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"].Content, {
      value: title
    }))), /*#__PURE__*/React.createElement("p", {
      "class": "anchor-text"
    }, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"].Content, {
      value: subtitle
    }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["InnerBlocks"].Content, null), /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"].Content, {
      tagName: "p",
      className: "link-add",
      value: adicionalContent
    }))))));
  }
}); // [mc4wp_form id="65"]

/***/ }),

/***/ 7:
/*!************************************************************!*\
  !*** multi ./assets/javascript/blocks/newsletter/index.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /home/pame/Documents/Hacklab/jeo-theme-final/jeo-theme/themes/jeo-theme/assets/javascript/blocks/newsletter/index.js */"./assets/javascript/blocks/newsletter/index.js");


/***/ }),

/***/ "@wordpress/block-editor":
/*!**********************************************!*\
  !*** external {"this":["wp","blockEditor"]} ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = this["wp"]["blockEditor"]; }());

/***/ }),

/***/ "@wordpress/components":
/*!*********************************************!*\
  !*** external {"this":["wp","components"]} ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = this["wp"]["components"]; }());

/***/ }),

/***/ "@wordpress/i18n":
/*!***************************************!*\
  !*** external {"this":["wp","i18n"]} ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = this["wp"]["i18n"]; }());

/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vYXNzZXRzL2phdmFzY3JpcHQvYmxvY2tzL25ld3NsZXR0ZXIvaW5kZXguanMiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIHtcInRoaXNcIjpbXCJ3cFwiLFwiYmxvY2tFZGl0b3JcIl19Iiwid2VicGFjazovLy9leHRlcm5hbCB7XCJ0aGlzXCI6W1wid3BcIixcImNvbXBvbmVudHNcIl19Iiwid2VicGFjazovLy9leHRlcm5hbCB7XCJ0aGlzXCI6W1wid3BcIixcImkxOG5cIl19Il0sIm5hbWVzIjpbIndwIiwidGl0bGUiLCJpY29uIiwiY2F0ZWdvcnkiLCJzdXBwb3J0cyIsImFsaWduIiwiYXR0cmlidXRlcyIsInR5cGUiLCJ0eXBlTmV3cyIsInN1YnRpdGxlIiwibmV3c2xldHRlclNob3J0Y29kZSIsImxhc3RFZGl0aW9uTGluayIsImFkaWNpb25hbENvbnRlbnQiLCJjdXN0b21TdHlsZSIsImVkaXQiLCJjbGFzc05hbWUiLCJwcm9wcyIsImlzU2VsZWN0ZWQiLCJzZXRBdHRyaWJ1dGVzIiwiX18iLCJ2YWx1ZSIsImxhYmVsIiwiZGlzYWJsZWQiLCJwbGFjZWhvbGRlciIsInNhdmUiXSwibWFwcGluZ3MiOiI7UUFBQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTs7O1FBR0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDBDQUEwQyxnQ0FBZ0M7UUFDMUU7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSx3REFBd0Qsa0JBQWtCO1FBQzFFO1FBQ0EsaURBQWlELGNBQWM7UUFDL0Q7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBLHlDQUF5QyxpQ0FBaUM7UUFD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QUFNO0FBQVQsb0JBQXVCLG9CQUFDLGdFQUFEO0FBQWtCLFdBQUssRUFBRVE7QUFBekIsTUFBdkIsQ0FOSixDQURBLGVBVUEsOENBQ0ksb0JBQUMsbUVBQUQsVUFESixJQUNJLENBREosZUFFSSxvQkFBQyxnRUFBRDtBQUNRLGFBQU8sRUFEZjtBQUVRLGVBQVMsRUFGakI7QUFHUSxXQUFLLEVBQUVHO0FBSGYsTUFGSixDQVZBLENBREosQ0FESixDQURKLENBREo7QUEyQkQ7QUEvSjhELENBQWpFWixFLENBa0tBLHVCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzNLQSxhQUFhLDRDQUE0QyxFQUFFLEk7Ozs7Ozs7Ozs7O0FDQTNELGFBQWEsMkNBQTJDLEVBQUUsSTs7Ozs7Ozs7Ozs7QUNBMUQsYUFBYSxxQ0FBcUMsRUFBRSxJIiwiZmlsZSI6Ii9uZXdzbGV0dGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCIuLy9kaXN0XCI7XG5cblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSA3KTtcbiIsImltcG9ydCB7XG4gIFJpY2hUZXh0LFxuICBJbm5lckJsb2Nrcyxcbn0gZnJvbSBcIkB3b3JkcHJlc3MvYmxvY2stZWRpdG9yXCI7XG5cbmltcG9ydCB7IF9fIH0gZnJvbSBcIkB3b3JkcHJlc3MvaTE4blwiO1xuaW1wb3J0IHsgQnV0dG9uLCBTZWxlY3RDb250cm9sLCBUZXh0Q29udHJvbCB9IGZyb20gXCJAd29yZHByZXNzL2NvbXBvbmVudHNcIjtcbi8vY29uc3QgeyAgfSA9IHdwLmVkaXRvcjtcblxud3AuYmxvY2tzLnJlZ2lzdGVyQmxvY2tUeXBlKFwiamVvLXRoZW1lL2N1c3RvbS1uZXdzbGV0dGVyLWJsb2NrXCIsIHtcbiAgdGl0bGU6IFwiTmV3c2xldHRlclwiLFxuICBpY29uOiBcImVtYWlsXCIsXG4gIGNhdGVnb3J5OiBcImNvbW1vblwiLFxuICBzdXBwb3J0czoge1xuICAgIGFsaWduOiB0cnVlLFxuICB9LFxuICBhdHRyaWJ1dGVzOiB7XG4gICAgdGl0bGU6IHtcbiAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgfSxcblxuICAgIHR5cGVOZXdzOiB7XG4gICAgICB0eXBlOiBcInN0cmluZ1wiLFxuICAgIH0sXG4gICAgc3VidGl0bGU6IHtcbiAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgfSxcblxuICAgIG5ld3NsZXR0ZXJTaG9ydGNvZGU6IHtcbiAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgfSxcblxuICAgIGxhc3RFZGl0aW9uTGluazoge1xuICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICB9LFxuXG4gICAgYWRpY2lvbmFsQ29udGVudDoge1xuICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICB9LFxuXG4gICAgY3VzdG9tU3R5bGU6IHtcbiAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgfSxcbiAgfSxcblxuICBlZGl0OiAocHJvcHMpID0+IHtcbiAgICBjb25zdCB7XG4gICAgICBjbGFzc05hbWUsXG4gICAgICBpc1NlbGVjdGVkLFxuICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgc3VidGl0bGUsXG4gICAgICAgIG5ld3NsZXR0ZXJTaG9ydGNvZGUsXG4gICAgICAgIGFkaWNpb25hbENvbnRlbnQsXG4gICAgICAgIGN1c3RvbVN0eWxlLFxuICAgICAgICB0eXBlTmV3cyxcbiAgICAgIH0sXG4gICAgICBzZXRBdHRyaWJ1dGVzLFxuICAgIH0gPSBwcm9wcztcblxuICAgIHJldHVybiAoXG4gICAgICA8PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm5ld3NsZXR0ZXItd3JhcHBlclwiIGtleT1cImNvbnRhaW5lclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXRlZ29yeS1wYWdlLXNpZGViYXJcIj5cbiAgICAgICAgICA8U2VsZWN0Q29udHJvbFxuICAgICAgICAgICAgICBsYWJlbD17IF9fKCAnU2VsZWN0IG5ld3NsZXR0ZXIgdHlwZTonICkgfVxuICAgICAgICAgICAgICB2YWx1ZT17IHR5cGVOZXdzIH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyAodmFsdWUpID0+IHtzZXRBdHRyaWJ1dGVzKCB7IHR5cGVOZXdzOiB2YWx1ZSB9ICkgfSB9XG4gICAgICAgICAgICAgIG9wdGlvbnM9eyBbXG4gICAgICAgICAgICAgICAgICB7IHZhbHVlOiBudWxsLCBsYWJlbDogJ1NlbGVjdCBhIHR5cGUnLCBkaXNhYmxlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgICAgeyB2YWx1ZTogJ2hvcml6b250YWwnLCBsYWJlbDogJ0hvcml6b250YWwnIH0sXG4gICAgICAgICAgICAgICAgICB7IHZhbHVlOiAndmVydGljYWwnLCBsYWJlbDogJ1ZlcnRpY2FsJyB9LFxuICAgICAgICAgICAgICBdIH1cbiAgICAgICAgICAvPlxuICAgICAgICAgIDxUZXh0Q29udHJvbFxuICAgICAgICAgICAgbGFiZWw9eyBfXyggJ0FkZCBjdXN0b20gY3NzOicgKSB9XG4gICAgICAgICAgICB2YWx1ZT17IGN1c3RvbVN0eWxlIH1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXsgKCB2YWx1ZSApID0+IHtzZXRBdHRyaWJ1dGVzKCB7IGN1c3RvbVN0eWxlOiB2YWx1ZSB9ICkgfSB9XG4gICAgICAgICAgLz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJuZXdzbGV0dGVyXCI+XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGkgY2xhc3M9XCJmYSBmYS1lbnZlbG9wZSBmYS0zeFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvaT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibmV3c2xldHRlci1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICA8UmljaFRleHRcbiAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lPVwicFwiXG4gICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e19fKFwiVGl0bGVcIil9XG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3RpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsodmFsdWUpID0+IHNldEF0dHJpYnV0ZXMoeyB0aXRsZTogdmFsdWUgfSl9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjdXN0b21pemVkLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgICAgPFJpY2hUZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lPVwicFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhbmNob3ItdGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17X18oXCJTdWJ0aXRsZVwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtzdWJ0aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsodmFsdWUpID0+IHNldEF0dHJpYnV0ZXMoeyBzdWJ0aXRsZTogdmFsdWUgfSl9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICA8SW5uZXJCbG9ja3NcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dlZEJsb2Nrcz17Wydjb3JlL3Nob3J0Y29kZSddfVxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZT17W1snY29yZS9zaG9ydGNvZGUnLCB7cGxhY2Vob2xkZXI6ICdOZXdzbGV0dGVyIHNob3J0Y29kZSd9XV19XG5cdFx0XHQgICAgLz5cbiAgICAgICAgICAgICAgICA8UmljaFRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWU9XCJwXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImxpbmstYWRkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtfXyhcIkFkaWNpb25hbCBJbmZvcm1hdGlvblwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXthZGljaW9uYWxDb250ZW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyh2YWx1ZSkgPT4gc2V0QXR0cmlidXRlcyh7IGFkaWNpb25hbENvbnRlbnQ6IHZhbHVlIH0pfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC8+XG4gICAgKTtcbiAgfSxcblxuICBzYXZlOiAocHJvcHMpID0+IHtcbiAgICBjb25zdCB7XG4gICAgICBjbGFzc05hbWUsXG4gICAgICBpc1NlbGVjdGVkLFxuICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgc3VidGl0bGUsXG4gICAgICAgIG5ld3NsZXR0ZXJTaG9ydGNvZGUsXG4gICAgICAgIGFkaWNpb25hbENvbnRlbnQsXG4gICAgICAgIGFsaWduLFxuICAgICAgICB0eXBlTmV3cyxcbiAgICAgICAgY3VzdG9tU3R5bGUsXG4gICAgICB9LFxuICAgICAgc2V0QXR0cmlidXRlcyxcbiAgICB9ID0gcHJvcHM7XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJuZXdzbGV0dGVyLXdyYXBwZXJcIiBrZXk9XCJjb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2F0ZWdvcnktcGFnZS1zaWRlYmFyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9e2BuZXdzbGV0dGVyICR7dHlwZU5ld3N9ICR7Y3VzdG9tU3R5bGV9YH0gPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3M9XCJmYSBmYS1lbnZlbG9wZSBmYS0zeFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvaT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJuZXdzbGV0dGVyLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwPjxSaWNoVGV4dC5Db250ZW50IHZhbHVlPXt0aXRsZX0vPjwvcD4gXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3M9XCJhbmNob3ItdGV4dFwiPjxSaWNoVGV4dC5Db250ZW50IHZhbHVlPXtzdWJ0aXRsZX0vPjwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxJbm5lckJsb2Nrcy5Db250ZW50IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8UmljaFRleHQuQ29udGVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lPVwicFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImxpbmstYWRkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2FkaWNpb25hbENvbnRlbnR9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFxuICAgICAgICA8Lz4pO1xuICB9LFxufSk7XG5cbi8vIFttYzR3cF9mb3JtIGlkPVwiNjVcIl1cbiIsIihmdW5jdGlvbigpIHsgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wid3BcIl1bXCJibG9ja0VkaXRvclwiXTsgfSgpKTsiLCIoZnVuY3Rpb24oKSB7IG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIndwXCJdW1wiY29tcG9uZW50c1wiXTsgfSgpKTsiLCIoZnVuY3Rpb24oKSB7IG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIndwXCJdW1wiaTE4blwiXTsgfSgpKTsiXSwic291cmNlUm9vdCI6IiJ9