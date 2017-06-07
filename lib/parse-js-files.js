'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.parseDesignJs = parseDesignJs;

var _babel = require('babel');

var _uglifyJs = require('uglify-js');

var babelOptions = {
  ast: false,
  compact: true,
  blacklist: ['useStrict']
};

var uglifyOptions = {
  compress: {
    conditionals: true
  },
  output: {
    ast: false,
    quote_style: 1
  }
};

function transformFunctionsToString(func, name) {
  var str = func.toString().replace(name, 'function ' + name);
  str = (0, _babel.transform)(str, babelOptions).code;
  str = (0, _uglifyJs.minify)(str, uglifyOptions).code;
  return str.replace('function ' + name, 'function');
}

function walk(obj) {
  Object.keys(obj).forEach(function (key) {
    if (typeof obj[key] === 'function') {
      obj[key] = transformFunctionsToString(obj[key], key);
    } else if (typeof obj[key] === 'object') {
      walk(obj[key]);
    }
  });
}

function parseDesignJs(designDoc) {
  walk(designDoc);
  return designDoc;
}
//# sourceMappingURL=parse-js-files.js.map