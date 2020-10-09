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
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./assets/javascript/blocks/imageBlock/index.js":
/*!******************************************************!*\
  !*** ./assets/javascript/blocks/imageBlock/index.js ***!
  \******************************************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);



wp.blocks.registerBlockType("jeo-theme/custom-image-block-editor", {
  title: "Credited Image",
  icon: "format-image",
  category: "common",
  supports: {
    align: true
  },
  attributes: {
    title: {
      type: "string"
    },
    mediaID: {
      type: "number"
    },
    mediaURL: {
      type: "string"
    },
    mediaDescription: {
      type: "string"
    }
  },
  edit: function edit(props) {
    var className = props.className,
        isSelected = props.isSelected,
        _props$attributes = props.attributes,
        mediaID = _props$attributes.mediaID,
        mediaURL = _props$attributes.mediaURL,
        title = _props$attributes.title,
        mediaDescription = _props$attributes.mediaDescription,
        setAttributes = props.setAttributes;

    var onChangeTitle = function onChangeTitle(value) {
      setAttributes({
        title: value
      });
    };

    var onChangeDescription = function onChangeDescription(value) {
      setAttributes({
        mediaDescription: value
      });
    };

    var onSelectImage = function onSelectImage(media) {
      setAttributes({
        mediaURL: media.url,
        mediaID: media.id
      });
    };

    var imageClasses = "left",
        textClasses = className,
        wrapClass = "image-block-container";
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: wrapClass,
      key: "container"
    }, /*#__PURE__*/React.createElement("div", {
      className: imageClasses
    }, /*#__PURE__*/React.createElement("div", {
      className: "callout-image"
    }, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["MediaUpload"], {
      onSelect: onSelectImage,
      type: "image",
      value: mediaID,
      render: function render(_ref) {
        var open = _ref.open;
        return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__["Button"], {
          isSecondary: true,
          className: mediaID ? "image-button margin-auto" : "image-button button-large margin-auto",
          onClick: open
        }, !mediaID ? Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])("Upload Image") : Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])("Replace image")), mediaID ? /*#__PURE__*/React.createElement("div", {
          className: "image-wrapper"
        }, /*#__PURE__*/React.createElement("img", {
          src: mediaURL
        }), /*#__PURE__*/React.createElement("div", {
          "class": "image-info-wrapper"
        }, /*#__PURE__*/React.createElement("span", {
          "class": "dashicons image-icon dashicons-camera-alt"
        }), /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"], {
          tagName: "span",
          className: "image-meta",
          placeholder: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])("Write a info here."),
          value: mediaDescription,
          onChange: onChangeDescription
        }))) : "");
      }
    }))), /*#__PURE__*/React.createElement("div", {
      className: textClasses
    }, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"], {
      tagName: "span",
      className: "callout-title image-description margin-auto",
      placeholder: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])("Write a description here."),
      value: title,
      onChange: onChangeTitle
    }))));
  },
  save: function save(props) {
    var className = props.className,
        _props$attributes2 = props.attributes,
        mediaID = _props$attributes2.mediaID,
        mediaURL = _props$attributes2.mediaURL,
        title = _props$attributes2.title,
        mediaDescription = _props$attributes2.mediaDescription,
        align = _props$attributes2.align;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "vue-component image-block-container",
      key: "container"
    }, /*#__PURE__*/React.createElement("image-block", {
      alignment: align,
      title: title,
      mediaurl: mediaURL,
      mediadescription: mediaDescription
    })));
  }
});

/***/ }),

/***/ 6:
/*!************************************************************!*\
  !*** multi ./assets/javascript/blocks/imageBlock/index.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /home/pame/Documents/Hacklab/jeo-theme-final/jeo-theme/themes/jeo-theme/assets/javascript/blocks/imageBlock/index.js */"./assets/javascript/blocks/imageBlock/index.js");


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vYXNzZXRzL2phdmFzY3JpcHQvYmxvY2tzL2ltYWdlQmxvY2svaW5kZXguanMiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIHtcInRoaXNcIjpbXCJ3cFwiLFwiYmxvY2tFZGl0b3JcIl19Iiwid2VicGFjazovLy9leHRlcm5hbCB7XCJ0aGlzXCI6W1wid3BcIixcImNvbXBvbmVudHNcIl19Iiwid2VicGFjazovLy9leHRlcm5hbCB7XCJ0aGlzXCI6W1wid3BcIixcImkxOG5cIl19Il0sIm5hbWVzIjpbIndwIiwidGl0bGUiLCJpY29uIiwiY2F0ZWdvcnkiLCJzdXBwb3J0cyIsImFsaWduIiwiYXR0cmlidXRlcyIsInR5cGUiLCJtZWRpYUlEIiwibWVkaWFVUkwiLCJtZWRpYURlc2NyaXB0aW9uIiwiZWRpdCIsImNsYXNzTmFtZSIsInByb3BzIiwiaXNTZWxlY3RlZCIsInNldEF0dHJpYnV0ZXMiLCJvbkNoYW5nZVRpdGxlIiwidmFsdWUiLCJvbkNoYW5nZURlc2NyaXB0aW9uIiwib25TZWxlY3RJbWFnZSIsIm1lZGlhIiwiaWQiLCJpbWFnZUNsYXNzZXMiLCJ0ZXh0Q2xhc3NlcyIsIndyYXBDbGFzcyIsIm9wZW4iLCJfXyIsInNhdmUiXSwibWFwcGluZ3MiOiI7UUFBQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTs7O1FBR0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDBDQUEwQyxnQ0FBZ0M7UUFDMUU7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSx3REFBd0Qsa0JBQWtCO1FBQzFFO1FBQ0EsaURBQWlELGNBQWM7UUFDL0Q7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7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aEIsb0JBQ0k7QUFDSSxhQUFPLEVBRFg7QUFFSSxlQUFTLEVBRmI7QUFHSSxpQkFBVyxFQUFFRywwREFBRSxDQUhuQiwyQkFHbUIsQ0FIbkI7QUFJSSxXQUFLLEVBSlQ7QUFLSSxjQUFRLEVBQUVWO0FBTGQsTUFESixDQTVDSixDQURKLENBREo7QUF6RDJEO0FBcUgvRFcsTUFBSSxFQUFFLHFCQUFXO0FBQUEsUUFFVGYsU0FGUyxHQVVUQyxLQVZTO0FBQUEsNkJBVVRBLEtBVlM7QUFBQSxRQUlMTCxPQUpLO0FBQUEsUUFLTEMsUUFMSztBQUFBLFFBTUxSLEtBTks7QUFBQSxRQU9MUyxnQkFQSztBQUFBLFFBUUxMLEtBUks7QUFZYix3QkFDSSx1REFDSTtBQUFLLGVBQVMsRUFBZDtBQUFxRCxTQUFHLEVBQUM7QUFBekQsb0JBQ0k7QUFBYSxlQUFTLEVBQXRCO0FBQStCLFdBQUssRUFBcEM7QUFBNkMsY0FBUSxFQUFyRDtBQUFpRSxzQkFBZ0IsRUFBRUs7QUFBbkYsTUFESixDQURKLENBREo7QUFRSDtBQXpJOEQsQ0FBbkVWLEU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDSkEsYUFBYSw0Q0FBNEMsRUFBRSxJOzs7Ozs7Ozs7OztBQ0EzRCxhQUFhLDJDQUEyQyxFQUFFLEk7Ozs7Ozs7Ozs7O0FDQTFELGFBQWEscUNBQXFDLEVBQUUsSSIsImZpbGUiOiIvaW1hZ2VCbG9jay5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiLi8vZGlzdFwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gNik7XG4iLCJpbXBvcnQgeyBNZWRpYVVwbG9hZCwgUmljaFRleHQgfSBmcm9tIFwiQHdvcmRwcmVzcy9ibG9jay1lZGl0b3JcIjtcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gXCJAd29yZHByZXNzL2NvbXBvbmVudHNcIjtcbmltcG9ydCB7IF9fIH0gZnJvbSBcIkB3b3JkcHJlc3MvaTE4blwiO1xuXG53cC5ibG9ja3MucmVnaXN0ZXJCbG9ja1R5cGUoXCJqZW8tdGhlbWUvY3VzdG9tLWltYWdlLWJsb2NrLWVkaXRvclwiLCB7XG4gICAgdGl0bGU6IFwiQ3JlZGl0ZWQgSW1hZ2VcIixcbiAgICBpY29uOiBcImZvcm1hdC1pbWFnZVwiLFxuICAgIGNhdGVnb3J5OiBcImNvbW1vblwiLFxuICAgIHN1cHBvcnRzOiB7XG4gICAgICAgIGFsaWduOiB0cnVlLFxuICAgIH0sXG4gICAgYXR0cmlidXRlczoge1xuICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgfSxcbiAgICAgICAgbWVkaWFJRDoge1xuICAgICAgICAgICAgdHlwZTogXCJudW1iZXJcIixcbiAgICAgICAgfSxcbiAgICAgICAgbWVkaWFVUkw6IHtcbiAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgIH0sXG5cbiAgICAgICAgbWVkaWFEZXNjcmlwdGlvbjoge1xuICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgZWRpdDogKHByb3BzKSA9PiB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGNsYXNzTmFtZSxcbiAgICAgICAgICAgIGlzU2VsZWN0ZWQsXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgbWVkaWFJRCxcbiAgICAgICAgICAgICAgICBtZWRpYVVSTCxcbiAgICAgICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgICAgICBtZWRpYURlc2NyaXB0aW9uLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldEF0dHJpYnV0ZXMsXG4gICAgICAgIH0gPSBwcm9wcztcblxuICAgICAgICBjb25zdCBvbkNoYW5nZVRpdGxlID0gKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBzZXRBdHRyaWJ1dGVzKHsgdGl0bGU6IHZhbHVlIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IG9uQ2hhbmdlRGVzY3JpcHRpb24gPSAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHNldEF0dHJpYnV0ZXMoeyBtZWRpYURlc2NyaXB0aW9uOiB2YWx1ZSB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBvblNlbGVjdEltYWdlID0gKG1lZGlhKSA9PiB7XG4gICAgICAgICAgICBzZXRBdHRyaWJ1dGVzKHtcbiAgICAgICAgICAgICAgICBtZWRpYVVSTDogbWVkaWEudXJsLFxuICAgICAgICAgICAgICAgIG1lZGlhSUQ6IG1lZGlhLmlkLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgW2ltYWdlQ2xhc3NlcywgdGV4dENsYXNzZXMsIHdyYXBDbGFzc10gPSBbXG4gICAgICAgICAgICBcImxlZnRcIixcbiAgICAgICAgICAgIGNsYXNzTmFtZSxcbiAgICAgICAgICAgIFwiaW1hZ2UtYmxvY2stY29udGFpbmVyXCIsXG4gICAgICAgIF07XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3dyYXBDbGFzc30ga2V5PVwiY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtpbWFnZUNsYXNzZXN9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjYWxsb3V0LWltYWdlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPE1lZGlhVXBsb2FkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uU2VsZWN0PXtvblNlbGVjdEltYWdlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiaW1hZ2VcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17bWVkaWFJRH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyPXsoeyBvcGVuIH0pID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc1NlY29uZGFyeVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVkaWFJRFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gXCJpbWFnZS1idXR0b24gbWFyZ2luLWF1dG9cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogXCJpbWFnZS1idXR0b24gYnV0dG9uLWxhcmdlIG1hcmdpbi1hdXRvXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXtvcGVufVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyFtZWRpYUlEID8gX18oXCJVcGxvYWQgSW1hZ2VcIikgOiBfXyhcIlJlcGxhY2UgaW1hZ2VcIil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge21lZGlhSUQgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW1hZ2Utd3JhcHBlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGltZyBzcmM9e21lZGlhVVJMfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImltYWdlLWluZm8td3JhcHBlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwiZGFzaGljb25zIGltYWdlLWljb24gZGFzaGljb25zLWNhbWVyYS1hbHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFJpY2hUZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWU9XCJzcGFuXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaW1hZ2UtbWV0YVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtfXyhcIldyaXRlIGEgaW5mbyBoZXJlLlwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e21lZGlhRGVzY3JpcHRpb259XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtvbkNoYW5nZURlc2NyaXB0aW9ufVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXt0ZXh0Q2xhc3Nlc30+XG4gICAgICAgICAgICAgICAgICAgICAgICA8UmljaFRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lPVwic3BhblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiY2FsbG91dC10aXRsZSBpbWFnZS1kZXNjcmlwdGlvbiBtYXJnaW4tYXV0b1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e19fKFwiV3JpdGUgYSBkZXNjcmlwdGlvbiBoZXJlLlwiKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17dGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e29uQ2hhbmdlVGl0bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvPlxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBzYXZlOiAocHJvcHMpID0+IHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgY2xhc3NOYW1lLFxuICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgIG1lZGlhSUQsXG4gICAgICAgICAgICAgICAgbWVkaWFVUkwsXG4gICAgICAgICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgICAgICAgbWVkaWFEZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICBhbGlnbixcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0gPSBwcm9wcztcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInZ1ZS1jb21wb25lbnQgaW1hZ2UtYmxvY2stY29udGFpbmVyXCIga2V5PVwiY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxpbWFnZS1ibG9jayBhbGlnbm1lbnQ9e2FsaWdufSB0aXRsZT17dGl0bGV9IG1lZGlhdXJsPXttZWRpYVVSTH0gbWVkaWFkZXNjcmlwdGlvbj17bWVkaWFEZXNjcmlwdGlvbn0+PC9pbWFnZS1ibG9jaz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvPlxuXG4gICAgICAgICk7XG4gICAgfSxcbn0pO1xuIiwiKGZ1bmN0aW9uKCkgeyBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJ3cFwiXVtcImJsb2NrRWRpdG9yXCJdOyB9KCkpOyIsIihmdW5jdGlvbigpIHsgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wid3BcIl1bXCJjb21wb25lbnRzXCJdOyB9KCkpOyIsIihmdW5jdGlvbigpIHsgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wid3BcIl1bXCJpMThuXCJdOyB9KCkpOyJdLCJzb3VyY2VSb290IjoiIn0=