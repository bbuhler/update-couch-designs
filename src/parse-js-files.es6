import { transform } from 'babel';
import { minify } from 'uglify-js';

const babelOptions =
{
  ast: false,
  compact: true,
  blacklist: ['useStrict']
};

const uglifyOptions =
{
  compress:
  {
    conditionals: true
  },
  output:
  {
    ast: false,
    quote_style: 1
  }
};

function transformFunctionsToString(func, name)
{
  let str = func.toString().replace(name, 'function ' + name);
  str = transform(str, babelOptions).code;
  str = minify(str, uglifyOptions).code;
  return str.replace('function ' + name, 'function');
}

function walk(obj)
{
  Object.keys(obj).forEach(key =>
  {
    if (typeof obj[key] === 'function')
    {
      obj[key] = transformFunctionsToString(obj[key], key);
    }
    else if (typeof obj[key] === 'object')
    {
      walk(obj[key]);
    }
  });
}

export function parseDesignJs(designDoc)
{
  walk(designDoc);
  return designDoc;
}
