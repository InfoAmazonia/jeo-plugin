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
/******/ 	return __webpack_require__(__webpack_require__.s = 9);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./assets/javascript/blocks/teamBlock/index.js":
/*!*****************************************************!*\
  !*** ./assets/javascript/blocks/teamBlock/index.js ***!
  \*****************************************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/blocks */ "@wordpress/blocks");
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_blocks__WEBPACK_IMPORTED_MODULE_2__);



Object(_wordpress_blocks__WEBPACK_IMPORTED_MODULE_2__["registerBlockType"])('jeo-theme/custom-team-block', {
  title: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__["__"])('Team'),
  icon: 'buddicons-buddypress-logo',
  category: 'common',
  keywords: [Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__["__"])('Team'), Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__["__"])('Members')],
  supports: {
    align: true
  },
  attributes: {
    title: {
      type: "string"
    }
  },
  edit: function edit(props) {
    var className = props.className,
        isSelected = props.isSelected,
        title = props.attributes.title,
        setAttributes = props.setAttributes;
    var TEMPLATE = [['jeo-theme/team-member']];
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "team-members"
    }, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"], {
      tagName: "h2",
      className: "gallery-title",
      value: title,
      onChange: function onChange(title) {
        setAttributes({
          title: title
        });
      },
      placeholder: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__["__"])('Type a team section title')
    }), /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["InnerBlocks"], {
      allowedBlocks: ['jeo-theme/team-member'],
      template: TEMPLATE
    })));
  },
  save: function save(props) {
    var className = props.className,
        isSelected = props.isSelected,
        title = props.attributes.title,
        setAttributes = props.setAttributes;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "team-members"
    }, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"].Content, {
      tagName: "h2",
      value: title
    }), /*#__PURE__*/React.createElement("div", {
      className: "team-members--content"
    }, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["InnerBlocks"].Content, null))));
  }
});

/***/ }),

/***/ 9:
/*!***********************************************************!*\
  !*** multi ./assets/javascript/blocks/teamBlock/index.js ***!
  \***********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /home/pame/Documents/Hacklab/jeo-theme-final/jeo-theme/themes/jeo-theme/assets/javascript/blocks/teamBlock/index.js */"./assets/javascript/blocks/teamBlock/index.js");


/***/ }),

/***/ "@wordpress/block-editor":
/*!**********************************************!*\
  !*** external {"this":["wp","blockEditor"]} ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = this["wp"]["blockEditor"]; }());

/***/ }),

/***/ "@wordpress/blocks":
/*!*****************************************!*\
  !*** external {"this":["wp","blocks"]} ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

(function() { module.exports = this["wp"]["blocks"]; }());

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vYXNzZXRzL2phdmFzY3JpcHQvYmxvY2tzL3RlYW1CbG9jay9pbmRleC5qcyIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwge1widGhpc1wiOltcIndwXCIsXCJibG9ja0VkaXRvclwiXX0iLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIHtcInRoaXNcIjpbXCJ3cFwiLFwiYmxvY2tzXCJdfSIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwge1widGhpc1wiOltcIndwXCIsXCJpMThuXCJdfSJdLCJuYW1lcyI6WyJyZWdpc3RlckJsb2NrVHlwZSIsInRpdGxlIiwiX18iLCJpY29uIiwiY2F0ZWdvcnkiLCJrZXl3b3JkcyIsInN1cHBvcnRzIiwiYWxpZ24iLCJhdHRyaWJ1dGVzIiwidHlwZSIsImVkaXQiLCJjbGFzc05hbWUiLCJwcm9wcyIsImlzU2VsZWN0ZWQiLCJzZXRBdHRyaWJ1dGVzIiwiVEVNUExBVEUiLCJzYXZlIl0sIm1hcHBpbmdzIjoiO1FBQUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7OztRQUdBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSwwQ0FBMEMsZ0NBQWdDO1FBQzFFO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0Esd0RBQXdELGtCQUFrQjtRQUMxRTtRQUNBLGlEQUFpRCxjQUFjO1FBQy9EOztRQUVBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQSx5Q0FBeUMsaUNBQWlDO1FBQzFFLGdIQUFnSCxtQkFBbUIsRUFBRTtRQUNySTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDJCQUEyQiwwQkFBMEIsRUFBRTtRQUN2RCxpQ0FBaUMsZUFBZTtRQUNoRDtRQUNBO1FBQ0E7O1FBRUE7UUFDQSxzREFBc0QsK0RBQStEOztRQUVySDtRQUNBOzs7UUFHQTtRQUNBOzs7Ozs7Ozs7Ozs7O0FDbEZBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBRUFBLDJFQUFpQixnQ0FBZ0M7QUFDN0NDLE9BQUssRUFBRUMsMERBQUUsQ0FEb0MsTUFDcEMsQ0FEb0M7QUFFN0NDLE1BQUksRUFGeUM7QUFHN0NDLFVBQVEsRUFIcUM7QUFJN0NDLFVBQVEsRUFBRSxDQUNOSCwwREFBRSxDQURJLE1BQ0osQ0FESSxFQUVOQSwwREFBRSxDQU51QyxTQU12QyxDQUZJLENBSm1DO0FBUWhESSxVQUFRLEVBQUU7QUFDVEMsU0FBSyxFQUFFO0FBREUsR0FSc0M7QUFXaERDLFlBQVUsRUFBRTtBQUNYUCxTQUFLLEVBQUU7QUFDTlEsVUFBSSxFQUFFO0FBREE7QUFESSxHQVhvQztBQWlCN0NDLE1BakI2Qyx1QkFpQmpDO0FBQUEsUUFFYkMsU0FGYSxHQVFKQyxLQVJJO0FBQUEsUUFHYkMsVUFIYSxHQVFKRCxLQVJJO0FBQUEsUUFLWFgsS0FMVyxHQVFKVyxLQVJJLFdBUUpBLENBUkk7QUFBQSxRQU9iRSxhQVBhLEdBUUpGLEtBUkk7QUFVUixRQUFNRyxRQUFRLEdBQUksQ0FBQyxDQUFuQix1QkFBbUIsQ0FBRCxDQUFsQjtBQUVBLHdCQUNMLHVEQUNDO0FBQUssZUFBUyxFQUFDO0FBQWYsb0JBQ0U7QUFDQyxhQUFPLEVBRFI7QUFFQyxlQUFTLEVBRlY7QUFHQyxXQUFLLEVBSE47QUFJQyxjQUFRLEVBQUcseUJBQWE7QUFDdkJELHFCQUFhLENBQUU7QUFBRWIsZUFBSyxFQUFMQTtBQUFGLFNBQUYsQ0FBYmE7QUFMRjtBQU9DLGlCQUFXLEVBQUdaLDBEQUFFO0FBUGpCLE1BREYsZUFVRTtBQUNDLG1CQUFhLEVBQUUsQ0FEaEIsdUJBQ2dCLENBRGhCO0FBRUMsY0FBUSxFQUFFYTtBQUZYLE1BVkYsQ0FERCxDQURLO0FBN0J5QztBQWtEN0NDLE1BQUksRUFBRSxxQkFBVztBQUFBLFFBRWxCTCxTQUZrQixHQVFiQyxLQVJhO0FBQUEsUUFHbEJDLFVBSGtCLEdBUWJELEtBUmE7QUFBQSxRQUtoQlgsS0FMZ0IsR0FRYlcsS0FSYSxXQVFiQSxDQVJhO0FBQUEsUUFPbEJFLGFBUGtCLEdBUWJGLEtBUmE7QUFXYix3QkFDTCx1REFDQztBQUFLLGVBQVMsRUFBQztBQUFmLG9CQUNnQixvQkFBQyxnRUFBRDtBQUFrQixhQUFPLEVBQXpCO0FBQStCLFdBQUssRUFBR1g7QUFBdkMsTUFEaEIsZUFFQztBQUFLLGVBQVMsRUFBQztBQUFmLG9CQUNDLG9CQUFDLG1FQUFELFVBTEUsSUFLRixDQURELENBRkQsQ0FERCxDQURLO0FBV0g7QUF4RTRDLENBQWhDLENBQWpCRCxDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0pBLGFBQWEsNENBQTRDLEVBQUUsSTs7Ozs7Ozs7Ozs7QUNBM0QsYUFBYSx1Q0FBdUMsRUFBRSxJOzs7Ozs7Ozs7OztBQ0F0RCxhQUFhLHFDQUFxQyxFQUFFLEkiLCJmaWxlIjoiL3RlYW1CbG9jay5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiLi8vZGlzdFwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gOSk7XG4iLCJpbXBvcnQgeyBSaWNoVGV4dCwgSW5uZXJCbG9ja3MgfSBmcm9tIFwiQHdvcmRwcmVzcy9ibG9jay1lZGl0b3JcIjtcbmltcG9ydCB7IF9fIH0gZnJvbSBcIkB3b3JkcHJlc3MvaTE4blwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJCbG9ja1R5cGUgfSBmcm9tIFwiQHdvcmRwcmVzcy9ibG9ja3NcIjtcblxucmVnaXN0ZXJCbG9ja1R5cGUoJ2plby10aGVtZS9jdXN0b20tdGVhbS1ibG9jaycsIHtcbiAgICB0aXRsZTogX18oJ1RlYW0nKSxcbiAgICBpY29uOiAnYnVkZGljb25zLWJ1ZGR5cHJlc3MtbG9nbycsXG4gICAgY2F0ZWdvcnk6ICdjb21tb24nLFxuICAgIGtleXdvcmRzOiBbXG4gICAgICAgIF9fKCdUZWFtJyksXG4gICAgICAgIF9fKCdNZW1iZXJzJyksXG5cdF0sXG5cdHN1cHBvcnRzOiB7XG5cdFx0YWxpZ246IHRydWUsXG5cdH0sXG5cdGF0dHJpYnV0ZXM6IHtcblx0XHR0aXRsZToge1xuXHRcdFx0dHlwZTogXCJzdHJpbmdcIixcblx0XHR9LFxuXHR9LFxuXG4gICAgZWRpdChwcm9wcykge1xuICAgICAgICBjb25zdCB7XG5cdFx0XHRjbGFzc05hbWUsXG5cdFx0XHRpc1NlbGVjdGVkLFxuXHRcdFx0YXR0cmlidXRlczoge1xuXHRcdFx0ICB0aXRsZSxcblx0XHRcdH0sXG5cdFx0XHRzZXRBdHRyaWJ1dGVzLFxuICAgICAgICB9ID0gcHJvcHM7XG5cbiAgICAgICAgY29uc3QgVEVNUExBVEUgPSAgW1snamVvLXRoZW1lL3RlYW0tbWVtYmVyJ11dO1xuXG4gICAgICAgIHJldHVybiAoXG5cdFx0XHQ8PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInRlYW0tbWVtYmVyc1wiPlxuXHRcdFx0XHRcdFx0PFJpY2hUZXh0XG5cdFx0XHRcdFx0XHRcdHRhZ05hbWU9XCJoMlwiXG5cdFx0XHRcdFx0XHRcdGNsYXNzTmFtZT1cImdhbGxlcnktdGl0bGVcIlxuXHRcdFx0XHRcdFx0XHR2YWx1ZT17IHRpdGxlIH1cblx0XHRcdFx0XHRcdFx0b25DaGFuZ2U9eyAoIHRpdGxlICkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdHNldEF0dHJpYnV0ZXMoIHsgdGl0bGUgfSApXG5cdFx0XHRcdFx0XHRcdH0gfVxuXHRcdFx0XHRcdFx0XHRwbGFjZWhvbGRlcj17IF9fKCAnVHlwZSBhIHRlYW0gc2VjdGlvbiB0aXRsZScgKSB9IFxuXHRcdFx0XHRcdFx0Lz5cblx0XHRcdFx0XHRcdDxJbm5lckJsb2Nrc1xuXHRcdFx0XHRcdFx0XHRhbGxvd2VkQmxvY2tzPXtbICdqZW8tdGhlbWUvdGVhbS1tZW1iZXInIF19XG5cdFx0XHRcdFx0XHRcdHRlbXBsYXRlPXtURU1QTEFURX1cblx0XHRcdFx0XHRcdC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC8+XG5cdFx0KTtcbiAgICB9LFxuXG4gICAgc2F2ZTogKHByb3BzKSA9PiB7XG4gICAgICAgIGNvbnN0IHtcblx0XHRcdGNsYXNzTmFtZSxcblx0XHRcdGlzU2VsZWN0ZWQsXG5cdFx0XHRhdHRyaWJ1dGVzOiB7XG5cdFx0XHQgIHRpdGxlLFxuXHRcdFx0fSxcblx0XHRcdHNldEF0dHJpYnV0ZXMsXG5cdFx0ICB9ID0gcHJvcHM7XG5cblxuICAgICAgICByZXR1cm4gKFxuXHRcdFx0PD5cdFxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInRlYW0tbWVtYmVyc1wiPlxuICAgICAgICAgICAgICAgICAgICA8UmljaFRleHQuQ29udGVudCB0YWdOYW1lPVwiaDJcIiB2YWx1ZT17IHRpdGxlIH0gLz5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInRlYW0tbWVtYmVycy0tY29udGVudFwiPlxuXHRcdFx0XHRcdFx0PElubmVyQmxvY2tzLkNvbnRlbnQvPlxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvPlxuXHRcdCk7XG5cbiAgICB9LFxufSk7IiwiKGZ1bmN0aW9uKCkgeyBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJ3cFwiXVtcImJsb2NrRWRpdG9yXCJdOyB9KCkpOyIsIihmdW5jdGlvbigpIHsgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wid3BcIl1bXCJibG9ja3NcIl07IH0oKSk7IiwiKGZ1bmN0aW9uKCkgeyBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJ3cFwiXVtcImkxOG5cIl07IH0oKSk7Il0sInNvdXJjZVJvb3QiOiIifQ==