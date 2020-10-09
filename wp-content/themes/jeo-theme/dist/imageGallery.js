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
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./assets/javascript/blocks/imageGallery/index.js":
/*!********************************************************!*\
  !*** ./assets/javascript/blocks/imageGallery/index.js ***!
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




wp.blocks.registerBlockType('jeo-theme/custom-image-gallery-block', {
  title: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])('Image Gallery'),
  icon: 'format-gallery',
  category: 'common',
  keywords: [Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])('materialtheme'), Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])('photos'), Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])('images')],
  attributes: {
    galleryTitle: {
      type: 'string'
    },
    images: {
      type: 'array'
    },
    imagesDescriptions: {
      type: 'array'
    },
    imagesCredits: {
      type: 'array'
    }
  },
  edit: function edit(_ref) {
    var attributes = _ref.attributes,
        className = _ref.className,
        setAttributes = _ref.setAttributes;
    var _attributes$galleryTi = attributes.galleryTitle,
        galleryTitle = _attributes$galleryTi === void 0 ? "" : _attributes$galleryTi,
        _attributes$images = attributes.images,
        images = _attributes$images === void 0 ? [] : _attributes$images,
        _attributes$imagesDes = attributes.imagesDescriptions,
        imagesDescriptions = _attributes$imagesDes === void 0 ? [] : _attributes$imagesDes,
        _attributes$imagesCre = attributes.imagesCredits,
        imagesCredits = _attributes$imagesCre === void 0 ? [] : _attributes$imagesCre;
    console.log(attributes);
    images.forEach(function (element, index) {
      if (!imagesDescriptions[index]) {
        imagesDescriptions[index] = "";
      }

      if (!imagesCredits[index]) {
        imagesCredits[index] = "";
      }
    });

    var removeImage = function removeImage(removeImageIndex) {
      var newImages = images.filter(function (image, index) {
        if (index != removeImageIndex) {
          return image;
        }
      });
      imagesDescriptions.splice(removeImageIndex, 1);
      imagesCredits.splice(removeImageIndex, 1);
      setAttributes({
        images: newImages,
        imagesDescriptions: imagesDescriptions,
        imagesCredits: imagesCredits
      });
    };

    var displayImages = function displayImages(images) {
      //console.log(external_link_api); 
      return images.map(function (image, index) {
        //console.log(image);
        return /*#__PURE__*/React.createElement("div", {
          className: "gallery-item-container"
        }, /*#__PURE__*/React.createElement("img", {
          className: "gallery-item",
          src: image.url,
          key: image.id
        }), /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"], {
          tagName: "span",
          className: "description-field",
          value: imagesDescriptions[index],
          formattingControls: ['bold', 'italic'],
          onChange: function onChange(content) {
            setAttributes({
              imagesDescriptions: imagesDescriptions.map(function (item, i) {
                if (i == index) {
                  return content;
                } else {
                  return item;
                }
              })
            });
          },
          placeholder: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])('Type here your description')
        }), /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"], {
          tagName: "span",
          className: "credit-field",
          value: imagesCredits[index],
          formattingControls: ['bold', 'italic'],
          onChange: function onChange(content) {
            setAttributes({
              imagesCredits: imagesCredits.map(function (item, i) {
                if (i == index) {
                  return content;
                } else {
                  return item;
                }
              })
            });
          },
          placeholder: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])('Type the credits here')
        }), /*#__PURE__*/React.createElement("div", {
          className: "remove-item",
          onClick: function onClick() {
            return removeImage(index);
          }
        }, /*#__PURE__*/React.createElement("span", {
          "class": "dashicons dashicons-trash"
        })));
      });
    };

    return /*#__PURE__*/React.createElement("div", {
      className: "image-gallery"
    }, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"], {
      tagName: "h2",
      className: "gallery-title",
      value: galleryTitle,
      formattingControls: ['bold', 'italic'],
      onChange: function onChange(galleryTitle) {
        setAttributes({
          galleryTitle: galleryTitle
        });
      },
      placeholder: Object(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__["__"])('Type a title')
    }), /*#__PURE__*/React.createElement("div", {
      className: "gallery-grid"
    }, displayImages(images), /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["MediaUpload"], {
      onSelect: function onSelect(media) {
        setAttributes({
          images: [].concat(_toConsumableArray(images), _toConsumableArray(media))
        });
      },
      type: "image",
      multiple: true,
      value: images,
      render: function render(_ref2) {
        var open = _ref2.open;
        return /*#__PURE__*/React.createElement("div", {
          className: "select-images-button is-button is-default is-large",
          onClick: open
        }, /*#__PURE__*/React.createElement("span", {
          "class": "dashicons dashicons-plus"
        }));
      }
    })));
  },
  save: function save(_ref3) {
    var attributes = _ref3.attributes;
    var _attributes$galleryTi2 = attributes.galleryTitle,
        galleryTitle = _attributes$galleryTi2 === void 0 ? "" : _attributes$galleryTi2,
        _attributes$images2 = attributes.images,
        images = _attributes$images2 === void 0 ? [] : _attributes$images2,
        _attributes$imagesDes2 = attributes.imagesDescriptions,
        imagesDescriptions = _attributes$imagesDes2 === void 0 ? [] : _attributes$imagesDes2,
        _attributes$imagesCre2 = attributes.imagesCredits,
        imagesCredits = _attributes$imagesCre2 === void 0 ? [] : _attributes$imagesCre2; //console.log(imagesDescriptions);

    var displayImages = function displayImages(images) {
      return images.map(function (image, index) {
        return /*#__PURE__*/React.createElement("div", {
          className: "gallery-item-container"
        }, /*#__PURE__*/React.createElement("img", {
          className: "gallery-item",
          key: images.id,
          src: image.url,
          alt: image.alt
        }), /*#__PURE__*/React.createElement("div", {
          "class": "image-meta"
        }, /*#__PURE__*/React.createElement("div", {
          "class": "image-description"
        }, " ", /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"].Content, {
          tagName: "span",
          value: imagesDescriptions[index]
        })), /*#__PURE__*/React.createElement("i", {
          "class": "fas fa-camera"
        }), /*#__PURE__*/React.createElement("div", {
          "class": "image-credit"
        }, " ", /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"].Content, {
          tagName: "span",
          value: imagesCredits[index]
        }))));
      });
    };

    return /*#__PURE__*/React.createElement("div", {
      className: "image-gallery"
    }, /*#__PURE__*/React.createElement("div", {
      className: "image-gallery-wrapper"
    }, /*#__PURE__*/React.createElement("div", {
      className: "gallery-title"
    }, /*#__PURE__*/React.createElement(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_0__["RichText"].Content, {
      tagName: "h2",
      value: galleryTitle
    })), /*#__PURE__*/React.createElement("div", {
      className: "actions"
    }, /*#__PURE__*/React.createElement("button", {
      action: "display-grid"
    }, /*#__PURE__*/React.createElement("i", {
      "class": "fas fa-th"
    })), /*#__PURE__*/React.createElement("button", {
      action: "fullsreen"
    }, /*#__PURE__*/React.createElement("i", {
      "class": "fas fa-expand"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "gallery-grid",
      "data-total-slides": images.length
    }, displayImages(images))));
  }
});

/***/ }),

/***/ 4:
/*!**************************************************************!*\
  !*** multi ./assets/javascript/blocks/imageGallery/index.js ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /home/pame/Documents/Hacklab/jeo-theme-final/jeo-theme/themes/jeo-theme/assets/javascript/blocks/imageGallery/index.js */"./assets/javascript/blocks/imageGallery/index.js");


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vYXNzZXRzL2phdmFzY3JpcHQvYmxvY2tzL2ltYWdlR2FsbGVyeS9pbmRleC5qcyIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwge1widGhpc1wiOltcIndwXCIsXCJibG9ja0VkaXRvclwiXX0iLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIHtcInRoaXNcIjpbXCJ3cFwiLFwiY29tcG9uZW50c1wiXX0iLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIHtcInRoaXNcIjpbXCJ3cFwiLFwiaTE4blwiXX0iXSwibmFtZXMiOlsid3AiLCJ0aXRsZSIsIl9fIiwiaWNvbiIsImNhdGVnb3J5Iiwia2V5d29yZHMiLCJhdHRyaWJ1dGVzIiwiZ2FsbGVyeVRpdGxlIiwidHlwZSIsImltYWdlcyIsImltYWdlc0Rlc2NyaXB0aW9ucyIsImltYWdlc0NyZWRpdHMiLCJlZGl0IiwiY2xhc3NOYW1lIiwic2V0QXR0cmlidXRlcyIsImNvbnNvbGUiLCJyZW1vdmVJbWFnZSIsIm5ld0ltYWdlcyIsImluZGV4IiwiZGlzcGxheUltYWdlcyIsImltYWdlIiwiaWQiLCJpIiwib3BlbiIsInNhdmUiLCJhbHQiLCJsZW5ndGgiXSwibWFwcGluZ3MiOiI7UUFBQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTs7O1FBR0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLDBDQUEwQyxnQ0FBZ0M7UUFDMUU7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSx3REFBd0Qsa0JBQWtCO1FBQzFFO1FBQ0EsaURBQWlELGNBQWM7UUFDL0Q7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBLHlDQUF5QyxpQ0FBaUM7UUFDMUUs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REo7QUFESjs7QUF5QkEsd0JBQ0k7QUFBSyxlQUFTLEVBQUM7QUFBZixvQkFDSTtBQUFLLGVBQVMsRUFBQztBQUFmLG9CQUNJO0FBQUssZUFBUyxFQUFDO0FBQWYsb0JBQ0ksb0JBQUMsZ0VBQUQ7QUFBa0IsYUFBTyxFQUF6QjtBQUErQixXQUFLLEVBQUVKO0FBQXRDLE1BREosQ0FESixlQUlJO0FBQUssZUFBUyxFQUFDO0FBQWYsb0JBQ0k7QUFBUSxZQUFNLEVBQUM7QUFBZixvQkFDSTtBQUFHLGVBQU07QUFBVCxNQURKLENBREosZUFLSTtBQUFRLFlBQU0sRUFBQztBQUFmLG9CQUNJO0FBQUcsZUFBTTtBQUFULE1BREosQ0FMSixDQUpKLGVBY0k7QUFBSyxlQUFTLEVBQWQ7QUFBOEIsMkJBQW1CRSxNQUFNLENBQUNpQjtBQUF4RCxPQUNLUCxhQUFhLENBakI5QixNQWlCOEIsQ0FEbEIsQ0FkSixDQURKLENBREo7QUF1Qkg7QUFwTStELENBQXBFbkIsRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNKQSxhQUFhLDRDQUE0QyxFQUFFLEk7Ozs7Ozs7Ozs7O0FDQTNELGFBQWEsMkNBQTJDLEVBQUUsSTs7Ozs7Ozs7Ozs7QUNBMUQsYUFBYSxxQ0FBcUMsRUFBRSxJIiwiZmlsZSI6Ii9pbWFnZUdhbGxlcnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IGZ1bmN0aW9uKGV4cG9ydHMpIHtcbiBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4gXHRcdH1cbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiBcdH07XG5cbiBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDE6IHZhbHVlIGlzIGEgbW9kdWxlIGlkLCByZXF1aXJlIGl0XG4gXHQvLyBtb2RlICYgMjogbWVyZ2UgYWxsIHByb3BlcnRpZXMgb2YgdmFsdWUgaW50byB0aGUgbnNcbiBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuIFx0Ly8gbW9kZSAmIDh8MTogYmVoYXZlIGxpa2UgcmVxdWlyZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy50ID0gZnVuY3Rpb24odmFsdWUsIG1vZGUpIHtcbiBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4gXHRcdGlmKG1vZGUgJiA4KSByZXR1cm4gdmFsdWU7XG4gXHRcdGlmKChtb2RlICYgNCkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAmJiB2YWx1ZS5fX2VzTW9kdWxlKSByZXR1cm4gdmFsdWU7XG4gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18ucihucyk7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShucywgJ2RlZmF1bHQnLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2YWx1ZSB9KTtcbiBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuIFx0XHRyZXR1cm4gbnM7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIi4vL2Rpc3RcIjtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IDQpO1xuIiwiaW1wb3J0IHsgTWVkaWFVcGxvYWQsIFJpY2hUZXh0IH0gZnJvbSBcIkB3b3JkcHJlc3MvYmxvY2stZWRpdG9yXCI7XG5pbXBvcnQgeyBCdXR0b24gfSBmcm9tIFwiQHdvcmRwcmVzcy9jb21wb25lbnRzXCI7XG5pbXBvcnQgeyBfXyB9IGZyb20gXCJAd29yZHByZXNzL2kxOG5cIjtcblxud3AuYmxvY2tzLnJlZ2lzdGVyQmxvY2tUeXBlKCdqZW8tdGhlbWUvY3VzdG9tLWltYWdlLWdhbGxlcnktYmxvY2snLCB7XG4gICAgdGl0bGU6IF9fKCdJbWFnZSBHYWxsZXJ5JyksXG4gICAgaWNvbjogJ2Zvcm1hdC1nYWxsZXJ5JyxcbiAgICBjYXRlZ29yeTogJ2NvbW1vbicsXG4gICAga2V5d29yZHM6IFtcbiAgICAgICAgX18oJ21hdGVyaWFsdGhlbWUnKSxcbiAgICAgICAgX18oJ3Bob3RvcycpLFxuICAgICAgICBfXygnaW1hZ2VzJylcbiAgICBdLFxuICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgZ2FsbGVyeVRpdGxlOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgfSxcblxuICAgICAgICBpbWFnZXM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgIH0sXG5cbiAgICAgICAgaW1hZ2VzRGVzY3JpcHRpb25zOiB7XG4gICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICB9LFxuXG4gICAgICAgIGltYWdlc0NyZWRpdHM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZWRpdCh7IGF0dHJpYnV0ZXMsIGNsYXNzTmFtZSwgc2V0QXR0cmlidXRlcyB9KSB7XG4gICAgICAgIGNvbnN0IHsgZ2FsbGVyeVRpdGxlID0gXCJcIiwgaW1hZ2VzID0gW10sIGltYWdlc0Rlc2NyaXB0aW9ucyA9IFtdLCBpbWFnZXNDcmVkaXRzID0gW10gfSA9IGF0dHJpYnV0ZXM7XG4gICAgICAgIGNvbnNvbGUubG9nKGF0dHJpYnV0ZXMpO1xuXG4gICAgICAgIGltYWdlcy5mb3JFYWNoKChlbGVtZW50LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFpbWFnZXNEZXNjcmlwdGlvbnNbaW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VzRGVzY3JpcHRpb25zW2luZGV4XSA9IFwiXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaW1hZ2VzQ3JlZGl0c1tpbmRleF0pIHtcbiAgICAgICAgICAgICAgICBpbWFnZXNDcmVkaXRzW2luZGV4XSA9IFwiXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHJlbW92ZUltYWdlID0gKHJlbW92ZUltYWdlSW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5ld0ltYWdlcyA9IGltYWdlcy5maWx0ZXIoKGltYWdlLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPSByZW1vdmVJbWFnZUluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpbWFnZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaW1hZ2VzRGVzY3JpcHRpb25zLnNwbGljZShyZW1vdmVJbWFnZUluZGV4LCAxKTtcbiAgICAgICAgICAgIGltYWdlc0NyZWRpdHMuc3BsaWNlKHJlbW92ZUltYWdlSW5kZXgsIDEpO1xuXG4gICAgICAgICAgICBzZXRBdHRyaWJ1dGVzKHtcbiAgICAgICAgICAgICAgICBpbWFnZXM6IG5ld0ltYWdlcyxcbiAgICAgICAgICAgICAgICBpbWFnZXNEZXNjcmlwdGlvbnMsXG4gICAgICAgICAgICAgICAgaW1hZ2VzQ3JlZGl0cyxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkaXNwbGF5SW1hZ2VzID0gKGltYWdlcykgPT4ge1xuXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGV4dGVybmFsX2xpbmtfYXBpKTsgXG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIGltYWdlcy5tYXAoKGltYWdlLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKGltYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ2FsbGVyeS1pdGVtLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbWcgY2xhc3NOYW1lPSdnYWxsZXJ5LWl0ZW0nIHNyYz17aW1hZ2UudXJsfSBrZXk9e2ltYWdlLmlkfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxSaWNoVGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lPVwic3BhblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImRlc2NyaXB0aW9uLWZpZWxkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2ltYWdlc0Rlc2NyaXB0aW9uc1tpbmRleF19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdHRpbmdDb250cm9scz17Wydib2xkJywgJ2l0YWxpYyddfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGNvbnRlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlc0Rlc2NyaXB0aW9uczogaW1hZ2VzRGVzY3JpcHRpb25zLm1hcCgoaXRlbSwgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PSBpbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17X18oJ1R5cGUgaGVyZSB5b3VyIGRlc2NyaXB0aW9uJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxSaWNoVGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lPVwic3BhblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImNyZWRpdC1maWVsZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtpbWFnZXNDcmVkaXRzW2luZGV4XX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0dGluZ0NvbnRyb2xzPXtbJ2JvbGQnLCAnaXRhbGljJ119XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoY29udGVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2VzQ3JlZGl0czogaW1hZ2VzQ3JlZGl0cy5tYXAoKGl0ZW0sIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT0gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e19fKCdUeXBlIHRoZSBjcmVkaXRzIGhlcmUnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdyZW1vdmUtaXRlbScgb25DbGljaz17KCkgPT4gcmVtb3ZlSW1hZ2UoaW5kZXgpfT48c3BhbiBjbGFzcz1cImRhc2hpY29ucyBkYXNoaWNvbnMtdHJhc2hcIj48L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIClcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImltYWdlLWdhbGxlcnlcIj5cbiAgICAgICAgICAgICAgICA8UmljaFRleHRcbiAgICAgICAgICAgICAgICAgICAgdGFnTmFtZT1cImgyXCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZ2FsbGVyeS10aXRsZVwiXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtnYWxsZXJ5VGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdHRpbmdDb250cm9scz17Wydib2xkJywgJ2l0YWxpYyddfVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGdhbGxlcnlUaXRsZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0QXR0cmlidXRlcyh7IGdhbGxlcnlUaXRsZSB9KVxuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17X18oJ1R5cGUgYSB0aXRsZScpfVxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJnYWxsZXJ5LWdyaWRcIj5cbiAgICAgICAgICAgICAgICAgICAge2Rpc3BsYXlJbWFnZXMoaW1hZ2VzKX1cbiAgICAgICAgICAgICAgICAgICAgPE1lZGlhVXBsb2FkXG4gICAgICAgICAgICAgICAgICAgICAgICBvblNlbGVjdD17KG1lZGlhKSA9PiB7IHNldEF0dHJpYnV0ZXMoeyBpbWFnZXM6IFsuLi5pbWFnZXMsIC4uLm1lZGlhXSB9KTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJpbWFnZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZT17dHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtpbWFnZXN9XG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXI9eyh7IG9wZW4gfSkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic2VsZWN0LWltYWdlcy1idXR0b24gaXMtYnV0dG9uIGlzLWRlZmF1bHQgaXMtbGFyZ2VcIiBvbkNsaWNrPXtvcGVufT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJkYXNoaWNvbnMgZGFzaGljb25zLXBsdXNcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBzYXZlOiAoeyBhdHRyaWJ1dGVzIH0pID0+IHtcbiAgICAgICAgY29uc3QgeyBnYWxsZXJ5VGl0bGUgPSBcIlwiLCBpbWFnZXMgPSBbXSwgaW1hZ2VzRGVzY3JpcHRpb25zID0gW10sIGltYWdlc0NyZWRpdHMgPSBbXSB9ID0gYXR0cmlidXRlcztcbiAgICAgICAgLy9jb25zb2xlLmxvZyhpbWFnZXNEZXNjcmlwdGlvbnMpO1xuXG4gICAgICAgIGNvbnN0IGRpc3BsYXlJbWFnZXMgPSAoaW1hZ2VzKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIGltYWdlcy5tYXAoKGltYWdlLCBpbmRleCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdhbGxlcnktaXRlbS1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW1nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT0nZ2FsbGVyeS1pdGVtJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2ltYWdlcy5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjPXtpbWFnZS51cmx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsdD17aW1hZ2UuYWx0fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaW1hZ2UtbWV0YVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaW1hZ2UtZGVzY3JpcHRpb25cIj4gPFJpY2hUZXh0LkNvbnRlbnQgdGFnTmFtZT1cInNwYW5cIiB2YWx1ZT17aW1hZ2VzRGVzY3JpcHRpb25zW2luZGV4XX0gLz48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3M9XCJmYXMgZmEtY2FtZXJhXCI+PC9pPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaW1hZ2UtY3JlZGl0XCI+IDxSaWNoVGV4dC5Db250ZW50IHRhZ05hbWU9XCJzcGFuXCIgdmFsdWU9e2ltYWdlc0NyZWRpdHNbaW5kZXhdfSAvPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJpbWFnZS1nYWxsZXJ5XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJpbWFnZS1nYWxsZXJ5LXdyYXBwZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJnYWxsZXJ5LXRpdGxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8UmljaFRleHQuQ29udGVudCB0YWdOYW1lPVwiaDJcIiB2YWx1ZT17Z2FsbGVyeVRpdGxlfSAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhY3Rpb25zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGFjdGlvbj1cImRpc3BsYXktZ3JpZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLXRoXCI+PC9pPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gYWN0aW9uPVwiZnVsbHNyZWVuXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3M9XCJmYXMgZmEtZXhwYW5kXCI+PC9pPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ2FsbGVyeS1ncmlkXCIgZGF0YS10b3RhbC1zbGlkZXM9e2ltYWdlcy5sZW5ndGh9PlxuICAgICAgICAgICAgICAgICAgICAgICAge2Rpc3BsYXlJbWFnZXMoaW1hZ2VzKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKTtcblxuICAgIH0sXG59KTsiLCIoZnVuY3Rpb24oKSB7IG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIndwXCJdW1wiYmxvY2tFZGl0b3JcIl07IH0oKSk7IiwiKGZ1bmN0aW9uKCkgeyBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJ3cFwiXVtcImNvbXBvbmVudHNcIl07IH0oKSk7IiwiKGZ1bmN0aW9uKCkgeyBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJ3cFwiXVtcImkxOG5cIl07IH0oKSk7Il0sInNvdXJjZVJvb3QiOiIifQ==