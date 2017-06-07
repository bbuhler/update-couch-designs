#!/usr/bin/env node
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _updateCouchDesigns = require('./update-couch-designs');

var _updateCouchDesigns2 = _interopRequireDefault(_updateCouchDesigns);

// Configure CLI options.
var argv = _yargs2['default'].usage('Update the design documents in a CouchDB database.').describe('db', 'The URL of a CouchDB database').describe('docs', 'A glob matching CouchDB design documents (JSON files)').describe('temp-doc-prefix', 'prepend temp copies of updated design docs with prefix. These docs are then indexed separately for zero downtime.').demand(['db', 'docs']).argv;

(0, _updateCouchDesigns2['default'])(argv)['catch'](function (err) {

  // Something went wrong. Print the error and exit.
  console.error(err.message);
  console.error(err.stack);
  process.exit(1);
});
//# sourceMappingURL=cli.js.map