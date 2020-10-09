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
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./assets/javascript/blocks/contentBox/index.js":
/*!******************************************************!*\
  !*** ./assets/javascript/blocks/contentBox/index.js ***!
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
function _objectDestructuringEmpty(obj) {
  if (obj == null) throw new TypeError("Cannot destructure undefined");
}



 //const {  } = wp.editor;

wp.blocks.registerBlockType("jeo-theme/content-box", {
  title: "Content Box",
  icon: "format-aside",
  category: "common",
  supports: {
    align: false
  },
  attributes: {},
  edit: function edit(props) {
    var className = props.className,
        isSelected = props.isSelected;

    _objectDestructuringEmpty(props.attributes);

    var setAttributes = props.setAttributes;
    var TEMPLATE = [['core/paragraph', {
      placeholder: 'Insert the text of the content box here'
    }]];
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "content-box--text"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, " Content box "), /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["InnerBlocks"], {
      allowedBlocks: ['core/paragraph'],
      template: TEMPLATE,
      templateLock: "all"
    }))));
  },
  save: function save(props) {
    var className = props.className,
        isSelected = props.isSelected,
        title = props.attributes.title,
        setAttributes = props.setAttributes;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "content-box--text"
    }, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["InnerBlocks"].Content, null)));
  }
}); // [mc4wp_form id="65"]

/***/ }),

/***/ 3:
/*!************************************************************!*\
  !*** multi ./assets/javascript/blocks/contentBox/index.js ***!
  \************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /home/pame/Documents/Hacklab/jeo-theme-final/jeo-theme/themes/jeo-theme/assets/javascript/blocks/contentBox/index.js */"./assets/javascript/blocks/contentBox/index.js");


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vYXNzZXRzL2phdmFzY3JpcHQvYmxvY2tzL2NvbnRlbnRCb3gvaW5kZXguanMiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIHtcInRoaXNcIjpbXCJ3cFwiLFwiYmxvY2tFZGl0b3JcIl19Iiwid2VicGFjazovLy9leHRlcm5hbCB7XCJ0aGlzXCI6W1wid3BcIixcImNvbXBvbmVudHNcIl19Iiwid2VicGFjazovLy9leHRlcm5hbCB7XCJ0aGlzXCI6W1wid3BcIixcImkxOG5cIl19Il0sIm5hbWVzIjpbIndwIiwidGl0bGUiLCJpY29uIiwiY2F0ZWdvcnkiLCJzdXBwb3J0cyIsImFsaWduIiwiYXR0cmlidXRlcyIsImVkaXQiLCJjbGFzc05hbWUiLCJwcm9wcyIsImlzU2VsZWN0ZWQiLCJzZXRBdHRyaWJ1dGVzIiwiVEVNUExBVEUiLCJwbGFjZWhvbGRlciIsInNhdmUiXSwibWFwcGluZ3MiOiI7UUFBQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTs7O1FBR0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDBDQUEwQyxnQ0FBZ0M7UUFDMUU7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSx3REFBd0Qsa0JBQWtCO1FBQzFFO1FBQ0EsaURBQWlELGNBQWM7UUFDL0Q7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBLHlDQUF5QyxpQ0FBaUM7UUFDMUUsZ0hBQWdILG1CQUFtQixFQUFFO1FBQ3JJO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMkJBQTJCLDBCQUEwQixFQUFFO1FBQ3ZELGlDQUFpQyxlQUFlO1FBQ2hEO1FBQ0E7UUFDQTs7UUFFQTtRQUNBLHNEQUFzRCwrREFBK0Q7O1FBRXJIO1FBQ0E7OztRQUdBO1FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2xGQTtBQUVBO0NBRUE7O0FBRUFBLEVBQUUsQ0FBRkEsa0RBQXFEO0FBQ3BEQyxPQUFLLEVBRCtDO0FBRXBEQyxNQUFJLEVBRmdEO0FBR3BEQyxVQUFRLEVBSDRDO0FBSXBEQyxVQUFRLEVBQUU7QUFDVEMsU0FBSyxFQUFFO0FBREUsR0FKMEM7QUFPcERDLFlBQVUsRUFQMEM7QUFXcERDLE1BQUksRUFBRSxxQkFBVztBQUFBLFFBRWZDLFNBRmUsR0FPWkMsS0FQWTtBQUFBLFFBR2ZDLFVBSGUsR0FPWkQsS0FQWTs7QUFBQSw4QkFPWkEsS0FQWTs7QUFBQSxRQU1mRSxhQU5lLEdBT1pGLEtBUFk7QUFTaEIsUUFBTUcsUUFBUSxHQUFJLENBQ2hCLG1CQUFvQjtBQUFFQyxpQkFBVyxFQUFFO0FBQWYsS0FBcEIsQ0FEZ0IsQ0FBbEI7QUFJQSx3QkFDQyx1REFDQztBQUFLLGVBQVMsRUFBQztBQUFmLG9CQUNDLDhDQUNDLGdDQURELGVBQ0MsQ0FERCxlQUVDO0FBQ0MsbUJBQWEsRUFBRSxDQURoQixnQkFDZ0IsQ0FEaEI7QUFFQyxjQUFRLEVBRlQ7QUFHQyxrQkFBWSxFQUFDO0FBSGQsTUFGRCxDQURELENBREQsQ0FERDtBQXhCbUQ7QUF3Q3BEQyxNQUFJLEVBQUUscUJBQVc7QUFBQSxRQUVmTixTQUZlLEdBUVZDLEtBUlU7QUFBQSxRQUdmQyxVQUhlLEdBUVZELEtBUlU7QUFBQSxRQUtiUixLQUxhLEdBUVZRLEtBUlUsV0FRVkEsQ0FSVTtBQUFBLFFBT2ZFLGFBUGUsR0FRVkYsS0FSVTtBQVdoQix3QkFDQyx1REFDQztBQUFLLGVBQVMsRUFBQztBQUFmLG9CQUNDLG9CQUFDLG1FQUFELFVBSEgsSUFHRyxDQURELENBREQsQ0FERDtBQU9BO0FBMURtRCxDQUFyRFQsRSxDQTZEQSx1Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNuRUEsYUFBYSw0Q0FBNEMsRUFBRSxJOzs7Ozs7Ozs7OztBQ0EzRCxhQUFhLDJDQUEyQyxFQUFFLEk7Ozs7Ozs7Ozs7O0FDQTFELGFBQWEscUNBQXFDLEVBQUUsSSIsImZpbGUiOiIvY29udGVudEJveC5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiLi8vZGlzdFwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMyk7XG4iLCJpbXBvcnQgeyBSaWNoVGV4dCwgSW5uZXJCbG9ja3MgfSBmcm9tIFwiQHdvcmRwcmVzcy9ibG9jay1lZGl0b3JcIjtcblxuaW1wb3J0IHsgX18gfSBmcm9tIFwiQHdvcmRwcmVzcy9pMThuXCI7XG5pbXBvcnQgeyBCdXR0b24sIFNlbGVjdENvbnRyb2wsIFRleHRDb250cm9sIH0gZnJvbSBcIkB3b3JkcHJlc3MvY29tcG9uZW50c1wiO1xuLy9jb25zdCB7ICB9ID0gd3AuZWRpdG9yO1xuXG53cC5ibG9ja3MucmVnaXN0ZXJCbG9ja1R5cGUoXCJqZW8tdGhlbWUvY29udGVudC1ib3hcIiwge1xuXHR0aXRsZTogXCJDb250ZW50IEJveFwiLFxuXHRpY29uOiBcImZvcm1hdC1hc2lkZVwiLFxuXHRjYXRlZ29yeTogXCJjb21tb25cIixcblx0c3VwcG9ydHM6IHtcblx0XHRhbGlnbjogZmFsc2UsXG5cdH0sXG5cdGF0dHJpYnV0ZXM6IHtcblx0XHRcblx0fSxcblxuXHRlZGl0OiAocHJvcHMpID0+IHtcblx0XHRjb25zdCB7XG5cdFx0XHRjbGFzc05hbWUsXG5cdFx0XHRpc1NlbGVjdGVkLFxuXHRcdFx0YXR0cmlidXRlczoge1xuXHRcdFx0fSxcblx0XHRcdHNldEF0dHJpYnV0ZXMsXG5cdFx0fSA9IHByb3BzO1xuXHRcdFxuXHRcdGNvbnN0IFRFTVBMQVRFID0gIFsgXG5cdFx0XHRcdFsgJ2NvcmUvcGFyYWdyYXBoJywgeyBwbGFjZWhvbGRlcjogJ0luc2VydCB0aGUgdGV4dCBvZiB0aGUgY29udGVudCBib3ggaGVyZScgfSBdLFxuXHRcdF07XG5cdFx0ICBcblx0XHRyZXR1cm4gKFxuXHRcdFx0PD5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb250ZW50LWJveC0tdGV4dFwiPlxuXHRcdFx0XHRcdDxkaXY+XG5cdFx0XHRcdFx0XHQ8aDM+IENvbnRlbnQgYm94IDwvaDM+XG5cdFx0XHRcdFx0XHQ8SW5uZXJCbG9ja3Ncblx0XHRcdFx0XHRcdFx0YWxsb3dlZEJsb2Nrcz17WyAnY29yZS9wYXJhZ3JhcGgnIF19XG5cdFx0XHRcdFx0XHRcdHRlbXBsYXRlPXtURU1QTEFURX1cblx0XHRcdFx0XHRcdFx0dGVtcGxhdGVMb2NrPVwiYWxsXCJcblx0XHRcdFx0XHRcdC8+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC8+XG5cdFx0KTtcblx0fSxcblxuXHRzYXZlOiAocHJvcHMpID0+IHtcblx0XHRjb25zdCB7XG5cdFx0XHRjbGFzc05hbWUsXG5cdFx0XHRpc1NlbGVjdGVkLFxuXHRcdFx0YXR0cmlidXRlczoge1xuXHRcdFx0ICB0aXRsZSxcblx0XHRcdH0sXG5cdFx0XHRzZXRBdHRyaWJ1dGVzLFxuXHRcdCAgfSA9IHByb3BzO1xuXHQgIFxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDw+XHRcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb250ZW50LWJveC0tdGV4dFwiPlxuXHRcdFx0XHRcdDxJbm5lckJsb2Nrcy5Db250ZW50Lz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8Lz5cblx0XHQpO1xuXHR9LFxufSk7XG5cbi8vIFttYzR3cF9mb3JtIGlkPVwiNjVcIl1cbiIsIihmdW5jdGlvbigpIHsgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wid3BcIl1bXCJibG9ja0VkaXRvclwiXTsgfSgpKTsiLCIoZnVuY3Rpb24oKSB7IG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIndwXCJdW1wiY29tcG9uZW50c1wiXTsgfSgpKTsiLCIoZnVuY3Rpb24oKSB7IG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIndwXCJdW1wiaTE4blwiXTsgfSgpKTsiXSwic291cmNlUm9vdCI6IiJ9