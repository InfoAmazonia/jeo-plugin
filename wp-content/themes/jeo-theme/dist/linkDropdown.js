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
/******/ 	return __webpack_require__(__webpack_require__.s = 8);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./assets/javascript/blocks/linkDropdown/index.js":
/*!********************************************************!*\
  !*** ./assets/javascript/blocks/linkDropdown/index.js ***!
  \********************************************************/
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
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/blocks */ "@wordpress/blocks");
/* harmony import */ var _wordpress_blocks__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_blocks__WEBPACK_IMPORTED_MODULE_3__);
function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }

  return arr2;
}





Object(_wordpress_blocks__WEBPACK_IMPORTED_MODULE_3__["registerBlockType"])('jeo-theme/custom-link-dropdown', {
  title: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])('Link Dropdown'),
  icon: 'editor-ul',
  category: 'common',
  keywords: [Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])('link'), Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])('dropdown')],
  supports: {
    align: ['left', 'right']
  },
  attributes: {
    option: {
      type: 'string'
    },
    dropdownTitle: {
      type: 'string'
    },
    newSectionTitle: {
      type: 'string'
    },
    newSectionURL: {
      type: 'string'
    },
    sections: {
      type: 'array'
    },
    sectionsLinks: {
      type: 'array'
    }
  },
  edit: function edit(_ref) {
    var attributes = _ref.attributes,
        setAttributes = _ref.setAttributes;
    var _attributes$dropdownT = attributes.dropdownTitle,
        dropdownTitle = _attributes$dropdownT === void 0 ? "" : _attributes$dropdownT,
        _attributes$sections = attributes.sections,
        sections = _attributes$sections === void 0 ? [] : _attributes$sections,
        _attributes$sectionsL = attributes.sectionsLinks,
        sectionsLinks = _attributes$sectionsL === void 0 ? [] : _attributes$sectionsL,
        _attributes$newSectio = attributes.newSectionTitle,
        newSectionTitle = _attributes$newSectio === void 0 ? '' : _attributes$newSectio,
        _attributes$newSectio2 = attributes.newSectionURL,
        newSectionURL = _attributes$newSectio2 === void 0 ? '' : _attributes$newSectio2,
        _attributes$option = attributes.option,
        option = _attributes$option === void 0 ? 's' : _attributes$option;
    sections.forEach(function (element, index) {
      if (!sectionsLinks[index]) {
        sectionsLinks[index] = "";
      }
    });

    var removeSection = function removeSection(removeSectionIndex) {
      var newSections = sections.filter(function (section, index) {
        if (index != removeSectionIndex) {
          return section;
        }
      });
      sectionsLinks.splice(removeSectionIndex, 1);
      setAttributes({
        sections: newSections,
        sectionsLinks: sectionsLinks
      });
    };

    var displaySections = function displaySections(sections) {
      return sections.map(function (section, index) {
        return /*#__PURE__*/React.createElement("div", {
          className: "section"
        }, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"], {
          tagName: "p",
          className: "section-url",
          value: section,
          formattingControls: ['bold', 'italic'],
          onChange: function onChange(updatedSectionTitle) {
            setAttributes({
              sections: sections.map(function (item, i) {
                if (i == index) {
                  return updatedSectionTitle;
                } else {
                  return item;
                }
              })
            });
          }
        }), /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"], {
          tagName: "p",
          className: "section-url",
          value: sectionsLinks[index],
          formattingControls: ['bold', 'italic'],
          onChange: function onChange(content) {
            setAttributes({
              sectionsLinks: sectionsLinks.map(function (item, i) {
                if (i == index) {
                  return content;
                } else {
                  return item;
                }
              })
            });
          }
        }), /*#__PURE__*/React.createElement("div", {
          className: "remove-item",
          onClick: function onClick() {
            return removeSection(index);
          }
        }, /*#__PURE__*/React.createElement("span", {
          "class": "dashicons dashicons-trash"
        })));
      });
    };

    return /*#__PURE__*/React.createElement("div", {
      className: "link-dropdown"
    }, /*#__PURE__*/React.createElement(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__["RadioControl"], {
      label: "Target",
      selected: option,
      options: [{
        label: 'New page',
        value: 'n'
      }, {
        label: 'Same page',
        value: 's'
      }],
      onChange: function onChange(option) {
        setAttributes({
          option: option
        });
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "controls"
    }, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"], {
      tagName: "h2",
      className: "dropdown-title",
      value: dropdownTitle,
      formattingControls: ['bold', 'italic'],
      onChange: function onChange(dropdownTitle) {
        setAttributes({
          dropdownTitle: dropdownTitle
        });
      },
      placeholder: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])('Type a title')
    }), /*#__PURE__*/React.createElement("i", {
      "class": "arrow-icon fas fa-angle-down"
    })), /*#__PURE__*/React.createElement("div", {
      className: "sections"
    }, displaySections(sections)), /*#__PURE__*/React.createElement("div", {
      "class": "inputs"
    }, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"], {
      tagName: "p",
      className: "title-input",
      value: newSectionTitle,
      formattingControls: ['bold', 'italic'],
      onChange: function onChange(newSectionTitle) {
        setAttributes({
          newSectionTitle: newSectionTitle
        });
      },
      placeholder: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])('Section title')
    }), /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"], {
      tagName: "p",
      className: "url-input",
      value: newSectionURL,
      formattingControls: ['bold', 'italic'],
      onChange: function onChange(newSectionURL) {
        setAttributes({
          newSectionURL: newSectionURL
        });
      },
      placeholder: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])('Section URL (requires HTTPS)')
    })), /*#__PURE__*/React.createElement(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__["Button"], {
      onClick: function onClick() {
        if (!newSectionURL || !newSectionTitle) {
          alert(Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])('Please, fill all the fields.'));
          return;
        }

        var newSections = [].concat(_toConsumableArray(sections), [newSectionTitle]);
        var newSectionsLinks = [].concat(_toConsumableArray(sectionsLinks), [newSectionURL]);
        setAttributes({
          sections: newSections,
          sectionsLinks: newSectionsLinks,
          newSectionTitle: '',
          newSectionURL: ''
        });
      },
      isSecondary: true
    }, Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])('Add new section')));
  },
  save: function save(_ref2) {
    var attributes = _ref2.attributes;
    var _attributes$dropdownT2 = attributes.dropdownTitle,
        dropdownTitle = _attributes$dropdownT2 === void 0 ? "" : _attributes$dropdownT2,
        _attributes$sections2 = attributes.sections,
        sections = _attributes$sections2 === void 0 ? [] : _attributes$sections2,
        _attributes$sectionsL2 = attributes.sectionsLinks,
        sectionsLinks = _attributes$sectionsL2 === void 0 ? [] : _attributes$sectionsL2,
        _attributes$option2 = attributes.option,
        option = _attributes$option2 === void 0 ? "s" : _attributes$option2;
    var isBlank = option === "n";

    var displaySections = function displaySections(sections) {
      return sections.map(function (section, index) {
        return /*#__PURE__*/React.createElement("div", {
          className: "section"
        }, /*#__PURE__*/React.createElement("a", {
          href: sectionsLinks[index],
          target: isBlank && '_blank' // Initial test
          ,
          rel: isBlank && 'noopener noreferrer' // Add this to fix

        }, sections[index]));
      });
    };

    return /*#__PURE__*/React.createElement("div", {
      className: "link-dropdown"
    }, /*#__PURE__*/React.createElement("div", {
      className: "controls saved-block"
    }, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"].Content, {
      className: "dropdown-title",
      tagName: "h2",
      value: dropdownTitle
    }), /*#__PURE__*/React.createElement("i", {
      "class": "arrow-icon fas fa-angle-down"
    })), /*#__PURE__*/React.createElement("div", {
      className: "sections saved-block"
    }, displaySections(sections)));
  }
});

/***/ }),

/***/ 8:
/*!**************************************************************!*\
  !*** multi ./assets/javascript/blocks/linkDropdown/index.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /home/pame/Documents/Hacklab/jeo-theme-final/jeo-theme/themes/jeo-theme/assets/javascript/blocks/linkDropdown/index.js */"./assets/javascript/blocks/linkDropdown/index.js");


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vYXNzZXRzL2phdmFzY3JpcHQvYmxvY2tzL2xpbmtEcm9wZG93bi9pbmRleC5qcyIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwge1widGhpc1wiOltcIndwXCIsXCJibG9ja0VkaXRvclwiXX0iLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIHtcInRoaXNcIjpbXCJ3cFwiLFwiYmxvY2tzXCJdfSIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwge1widGhpc1wiOltcIndwXCIsXCJjb21wb25lbnRzXCJdfSIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwge1widGhpc1wiOltcIndwXCIsXCJpMThuXCJdfSJdLCJuYW1lcyI6WyJyZWdpc3RlckJsb2NrVHlwZSIsInRpdGxlIiwiX18iLCJpY29uIiwiY2F0ZWdvcnkiLCJrZXl3b3JkcyIsInN1cHBvcnRzIiwiYWxpZ24iLCJhdHRyaWJ1dGVzIiwib3B0aW9uIiwidHlwZSIsImRyb3Bkb3duVGl0bGUiLCJuZXdTZWN0aW9uVGl0bGUiLCJuZXdTZWN0aW9uVVJMIiwic2VjdGlvbnMiLCJzZWN0aW9uc0xpbmtzIiwiZWRpdCIsInNldEF0dHJpYnV0ZXMiLCJyZW1vdmVTZWN0aW9uIiwibmV3U2VjdGlvbnMiLCJpbmRleCIsImRpc3BsYXlTZWN0aW9ucyIsImkiLCJsYWJlbCIsInZhbHVlIiwiYWxlcnQiLCJuZXdTZWN0aW9uc0xpbmtzIiwic2F2ZSIsImlzQmxhbmsiXSwibWFwcGluZ3MiOiI7UUFBQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTs7O1FBR0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDBDQUEwQyxnQ0FBZ0M7UUFDMUU7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSx3REFBd0Qsa0JB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RUFBRSxJOzs7Ozs7Ozs7OztBQ0EzRCxhQUFhLHVDQUF1QyxFQUFFLEk7Ozs7Ozs7Ozs7O0FDQXRELGFBQWEsMkNBQTJDLEVBQUUsSTs7Ozs7Ozs7Ozs7QUNBMUQsYUFBYSxxQ0FBcUMsRUFBRSxJIiwiZmlsZSI6Ii9saW5rRHJvcGRvd24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIi4vL2Rpc3RcIjtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IDgpO1xuIiwiaW1wb3J0IHsgTWVkaWFVcGxvYWQsIFJpY2hUZXh0IH0gZnJvbSBcIkB3b3JkcHJlc3MvYmxvY2stZWRpdG9yXCI7XG5pbXBvcnQgeyBCdXR0b24sIFJhZGlvQ29udHJvbCB9IGZyb20gXCJAd29yZHByZXNzL2NvbXBvbmVudHNcIjtcbmltcG9ydCB7IF9fIH0gZnJvbSBcIkB3b3JkcHJlc3MvaTE4blwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJCbG9ja1R5cGUgfSBmcm9tIFwiQHdvcmRwcmVzcy9ibG9ja3NcIjtcblxucmVnaXN0ZXJCbG9ja1R5cGUoJ2plby10aGVtZS9jdXN0b20tbGluay1kcm9wZG93bicsIHtcbiAgICB0aXRsZTogX18oJ0xpbmsgRHJvcGRvd24nKSxcbiAgICBpY29uOiAnZWRpdG9yLXVsJyxcbiAgICBjYXRlZ29yeTogJ2NvbW1vbicsXG4gICAga2V5d29yZHM6IFtcbiAgICAgICAgX18oJ2xpbmsnKSxcbiAgICAgICAgX18oJ2Ryb3Bkb3duJyksXG5cdF0sXG5cdHN1cHBvcnRzOiB7XG5cdFx0YWxpZ246IFsnbGVmdCcsICdyaWdodCddLFxuXHR9LFxuICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgb3B0aW9uOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcblx0XHR9LFxuICAgICAgICBkcm9wZG93blRpdGxlOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcblx0XHR9LFxuXHRcdG5ld1NlY3Rpb25UaXRsZToge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0fSxcblx0XHRuZXdTZWN0aW9uVVJMOiB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHR9LFxuICAgICAgICBzZWN0aW9uczoge1xuICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgfSwgICBcblxuICAgICAgICBzZWN0aW9uc0xpbmtzOiB7XG4gICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICBlZGl0KHsgYXR0cmlidXRlcywgc2V0QXR0cmlidXRlc30pIHtcbiAgICAgICAgY29uc3QgeyBkcm9wZG93blRpdGxlID0gXCJcIiwgc2VjdGlvbnMgPSBbXSwgc2VjdGlvbnNMaW5rcyA9IFtdLCBuZXdTZWN0aW9uVGl0bGUgPSAnJywgbmV3U2VjdGlvblVSTCA9ICcnLCBvcHRpb24gPSAncyd9ID0gYXR0cmlidXRlcztcblxuICAgICAgICBzZWN0aW9ucy5mb3JFYWNoKCAoZWxlbWVudCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGlmKCFzZWN0aW9uc0xpbmtzW2luZGV4XSkge1xuICAgICAgICAgICAgICAgIHNlY3Rpb25zTGlua3NbaW5kZXhdID0gXCJcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgcmVtb3ZlU2VjdGlvbiA9IChyZW1vdmVTZWN0aW9uSW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1NlY3Rpb25zID0gc2VjdGlvbnMuZmlsdGVyKChzZWN0aW9uLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPSByZW1vdmVTZWN0aW9uSW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHNlY3Rpb25zTGlua3Muc3BsaWNlKHJlbW92ZVNlY3Rpb25JbmRleCwgMSk7XG5cbiAgICAgICAgICAgIHNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgICAgIHNlY3Rpb25zOiBuZXdTZWN0aW9ucyxcbiAgICAgICAgICAgICAgICBzZWN0aW9uc0xpbmtzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkaXNwbGF5U2VjdGlvbnMgPSAoc2VjdGlvbnMpID0+IHtcblxuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICBzZWN0aW9ucy5tYXAoKHNlY3Rpb24sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNlY3Rpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UmljaFRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZT1cInBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJzZWN0aW9uLXVybFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXsgc2VjdGlvbiB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdHRpbmdDb250cm9scz17IFsgJ2JvbGQnLCAnaXRhbGljJyBdIH0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsgKCB1cGRhdGVkU2VjdGlvblRpdGxlICkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlcyggeyBzZWN0aW9uczogc2VjdGlvbnMubWFwKCAoaXRlbSwgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpID09IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1cGRhdGVkU2VjdGlvblRpdGxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pIH0gKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxSaWNoVGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lPVwicFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInNlY3Rpb24tdXJsXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9eyBzZWN0aW9uc0xpbmtzW2luZGV4XSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdHRpbmdDb250cm9scz17IFsgJ2JvbGQnLCAnaXRhbGljJyBdIH0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsgKCBjb250ZW50ICkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlcyggeyBzZWN0aW9uc0xpbmtzOiBzZWN0aW9uc0xpbmtzLm1hcCggKGl0ZW0sIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PSBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSB9IClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ncmVtb3ZlLWl0ZW0nIG9uQ2xpY2s9eygpID0+IHJlbW92ZVNlY3Rpb24oaW5kZXgpfT48c3BhbiBjbGFzcz1cImRhc2hpY29ucyBkYXNoaWNvbnMtdHJhc2hcIj48L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH0pXG5cdFx0XHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibGluay1kcm9wZG93blwiPlxuICAgICAgICAgICAgICAgIDxSYWRpb0NvbnRyb2xcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw9XCJUYXJnZXRcIlxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZD17IG9wdGlvbiB9XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM9eyBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTmV3IHBhZ2UnLCB2YWx1ZTogJ24nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnU2FtZSBwYWdlJywgdmFsdWU6ICdzJyB9LFxuICAgICAgICAgICAgICAgICAgICBdIH1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyAob3B0aW9uKSA9PiB7IHNldEF0dHJpYnV0ZXMoIHsgb3B0aW9uOiBvcHRpb24gfSApIH0gfVxuXG4gICAgICAgICAgICAgICAgLz5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb250cm9sc1wiPlxuXHRcdFx0XHRcdDxSaWNoVGV4dFxuXHRcdFx0XHRcdFx0dGFnTmFtZT1cImgyXCJcblx0XHRcdFx0XHRcdGNsYXNzTmFtZT1cImRyb3Bkb3duLXRpdGxlXCJcblx0XHRcdFx0XHRcdHZhbHVlPXsgZHJvcGRvd25UaXRsZSB9XG5cdFx0XHRcdFx0XHRmb3JtYXR0aW5nQ29udHJvbHM9eyBbICdib2xkJywgJ2l0YWxpYycgXSB9IFxuXHRcdFx0XHRcdFx0b25DaGFuZ2U9eyAoIGRyb3Bkb3duVGl0bGUgKSA9PiB7XG5cdFx0XHRcdFx0XHRcdHNldEF0dHJpYnV0ZXMoIHsgZHJvcGRvd25UaXRsZSB9IClcblx0XHRcdFx0XHRcdH0gfVxuXHRcdFx0XHRcdFx0cGxhY2Vob2xkZXI9eyBfXyggJ1R5cGUgYSB0aXRsZScgKSB9IFxuXHRcdFx0XHRcdC8+XG5cdFx0XHRcdFx0PGkgY2xhc3M9XCJhcnJvdy1pY29uIGZhcyBmYS1hbmdsZS1kb3duXCI+PC9pPlxuXHRcdFx0XHQ8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNlY3Rpb25zXCI+XG4gICAgICAgICAgICAgICAgICAgIHtkaXNwbGF5U2VjdGlvbnMoc2VjdGlvbnMpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzPVwiaW5wdXRzXCI+XG5cdFx0XHRcdFx0PFJpY2hUZXh0XG5cdFx0XHRcdFx0XHR0YWdOYW1lPVwicFwiXG5cdFx0XHRcdFx0XHRjbGFzc05hbWU9XCJ0aXRsZS1pbnB1dFwiXG5cdFx0XHRcdFx0XHR2YWx1ZT17IG5ld1NlY3Rpb25UaXRsZSB9XG5cdFx0XHRcdFx0XHRmb3JtYXR0aW5nQ29udHJvbHM9eyBbICdib2xkJywgJ2l0YWxpYycgXSB9IFxuXHRcdFx0XHRcdFx0b25DaGFuZ2U9eyAoIG5ld1NlY3Rpb25UaXRsZSApID0+IHtcblx0XHRcdFx0XHRcdFx0c2V0QXR0cmlidXRlcyggeyBuZXdTZWN0aW9uVGl0bGUgfSApXG5cdFx0XHRcdFx0XHR9IH1cblx0XHRcdFx0XHRcdHBsYWNlaG9sZGVyPXsgX18oICdTZWN0aW9uIHRpdGxlJyApIH0gXG5cdFx0XHRcdFx0Lz5cblx0XHRcdFx0XHQ8UmljaFRleHRcblx0XHRcdFx0XHRcdHRhZ05hbWU9XCJwXCJcblx0XHRcdFx0XHRcdGNsYXNzTmFtZT1cInVybC1pbnB1dFwiXG5cdFx0XHRcdFx0XHR2YWx1ZT17IG5ld1NlY3Rpb25VUkwgfVxuXHRcdFx0XHRcdFx0Zm9ybWF0dGluZ0NvbnRyb2xzPXsgWyAnYm9sZCcsICdpdGFsaWMnIF0gfSBcblx0XHRcdFx0XHRcdG9uQ2hhbmdlPXsgKCBuZXdTZWN0aW9uVVJMICkgPT4ge1xuXHRcdFx0XHRcdFx0XHRzZXRBdHRyaWJ1dGVzKCB7IG5ld1NlY3Rpb25VUkwgfSApXG5cdFx0XHRcdFx0XHR9IH1cblx0XHRcdFx0XHRcdHBsYWNlaG9sZGVyPXsgX18oICdTZWN0aW9uIFVSTCAocmVxdWlyZXMgSFRUUFMpJyApIH0gXG5cdFx0XHRcdFx0Lz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxCdXR0b25cblx0XHRcdFx0XHRvbkNsaWNrPXsoKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoICFuZXdTZWN0aW9uVVJMIHx8ICFuZXdTZWN0aW9uVGl0bGUgKSB7XG5cdFx0XHRcdFx0XHRcdGFsZXJ0KF9fKCdQbGVhc2UsIGZpbGwgYWxsIHRoZSBmaWVsZHMuJykpO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGxldCBuZXdTZWN0aW9ucyA9IFsuLi5zZWN0aW9ucywgbmV3U2VjdGlvblRpdGxlXTtcblx0XHRcdFx0XHRcdGxldCBuZXdTZWN0aW9uc0xpbmtzID0gWy4uLnNlY3Rpb25zTGlua3MsIG5ld1NlY3Rpb25VUkxdO1xuXHRcdFx0XHRcdFx0c2V0QXR0cmlidXRlcyh7XG5cdFx0XHRcdFx0XHRcdHNlY3Rpb25zOiBuZXdTZWN0aW9ucyxcblx0XHRcdFx0XHRcdFx0c2VjdGlvbnNMaW5rczogbmV3U2VjdGlvbnNMaW5rcyxcblx0XHRcdFx0XHRcdFx0bmV3U2VjdGlvblRpdGxlOiAnJyxcblx0XHRcdFx0XHRcdFx0bmV3U2VjdGlvblVSTDogJycsXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9fVxuXHRcdFx0XHRcdGlzU2Vjb25kYXJ5XG5cdFx0XHRcdD5cblx0XHRcdFx0XHR7X18oJ0FkZCBuZXcgc2VjdGlvbicpfVxuXHRcdFx0XHQ8L0J1dHRvbj5cblxuXHRcdFx0PC9kaXY+XG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIHNhdmU6ICh7IGF0dHJpYnV0ZXMgfSkgPT4ge1xuICAgICAgICBjb25zdCB7IGRyb3Bkb3duVGl0bGUgPSBcIlwiLCBzZWN0aW9ucyA9IFtdLCBzZWN0aW9uc0xpbmtzID0gW10sIG9wdGlvbj1cInNcIn0gPSBhdHRyaWJ1dGVzO1xuICAgICAgICBjb25zdCBpc0JsYW5rID0gb3B0aW9uID09PSBcIm5cIjtcbiAgICAgICAgY29uc3QgZGlzcGxheVNlY3Rpb25zID0gKHNlY3Rpb25zKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIHNlY3Rpb25zLm1hcCgoc2VjdGlvbiwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2VjdGlvblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHJlZj17c2VjdGlvbnNMaW5rc1tpbmRleF19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0PXtpc0JsYW5rICYmICdfYmxhbmsnfSAvLyBJbml0aWFsIHRlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWw9e2lzQmxhbmsgJiYgJ25vb3BlbmVyIG5vcmVmZXJyZXInfSAgLy8gQWRkIHRoaXMgdG8gZml4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7c2VjdGlvbnNbaW5kZXhdfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIClcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImxpbmstZHJvcGRvd25cIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb250cm9scyBzYXZlZC1ibG9ja1wiPlxuXHRcdFx0XHRcdDxSaWNoVGV4dC5Db250ZW50IGNsYXNzTmFtZT1cImRyb3Bkb3duLXRpdGxlXCIgdGFnTmFtZT1cImgyXCIgdmFsdWU9eyBkcm9wZG93blRpdGxlIH0gLz5cblx0XHRcdFx0XHQ8aSBjbGFzcz1cImFycm93LWljb24gZmFzIGZhLWFuZ2xlLWRvd25cIj48L2k+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlY3Rpb25zIHNhdmVkLWJsb2NrXCI+XG5cdFx0XHRcdFx0e2Rpc3BsYXlTZWN0aW9ucyhzZWN0aW9ucyl9XG5cdFx0XHRcdDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cdFx0KTtcbiAgICB9LFxufSk7IiwiKGZ1bmN0aW9uKCkgeyBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJ3cFwiXVtcImJsb2NrRWRpdG9yXCJdOyB9KCkpOyIsIihmdW5jdGlvbigpIHsgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wid3BcIl1bXCJibG9ja3NcIl07IH0oKSk7IiwiKGZ1bmN0aW9uKCkgeyBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJ3cFwiXVtcImNvbXBvbmVudHNcIl07IH0oKSk7IiwiKGZ1bmN0aW9uKCkgeyBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJ3cFwiXVtcImkxOG5cIl07IH0oKSk7Il0sInNvdXJjZVJvb3QiOiIifQ==