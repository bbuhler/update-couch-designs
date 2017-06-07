'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

require('core-js/shim');

var _deepEqual = require('deep-equal');

var _deepEqual2 = _interopRequireDefault(_deepEqual);

var _qouch = require('qouch');

var _qouch2 = _interopRequireDefault(_qouch);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _util = require('util');

var _couchdbIndexer = require('couchdb-indexer');

var _couchdbIndexer2 = _interopRequireDefault(_couchdbIndexer);

var _parseJsFiles = require('./parse-js-files');

exports['default'] = function (_ref) {
  var _ref$db = _ref.db;
  var db = _ref$db === undefined ? '' : _ref$db;
  var _ref$docs = _ref.docs;
  var docs = _ref$docs === undefined ? '' : _ref$docs;
  var _ref$tempDocPrefix = _ref.tempDocPrefix;
  var tempDocPrefix = _ref$tempDocPrefix === undefined ? (0, _util.format)('ucd-%d-', +new Date()) : _ref$tempDocPrefix;

  // Remove trailing slash from the database URL if necessary.
  db = db.replace(/\/$/, '');

  return new Promise(function (resolve, reject) {

    // Get files matching the glob.
    (0, _glob2['default'])(docs, function (err, files) {

      if (err) {
        return reject(err);
      }

      if (!files.length) {
        return reject(new Error('No files found.'));
      }

      return resolve(files);
    });
  }).then(function (files) {

    // Import all the files. They should all be either valid JSON or valid JS
    // programs. Node's require can handle both. This will throw if any of the
    // design document files are invalid.
    var docs = files.map(function (file) {
      return (0, _parseJsFiles.parseDesignJs)(require(_path2['default'].resolve(file)));
    });
    var qouch = new _qouch2['default'](db);

    return new Promise(function (resolve, reject) {

      // Attempt to create the database.
      qouch.createDB().then(function () {
        return resolve();
      })['catch'](function (err) {

        // CouchDB returns an HTTP 412 status code if the database already
        // exists. If that's the case we can continue.
        if (err.response && err.response.status === 412) {
          return resolve();
        }

        return reject(err);
      });
    }).then(function () {

      // Get existing design documents from the database.
      return qouch.fetch(docs.map(function (doc) {
        return doc._id;
      }));
    }).then(function (existingDocs) {

      // Build a map of the existing design document IDs to documents.
      existingDocs = existingDocs.reduce(function (obj, doc) {
        if (doc) {
          obj[doc._id] = doc;
        }
        return obj;
      }, {});

      // Find which design documents need to be inserted or updated.
      var changed = [];

      docs.forEach(function (doc) {

        var currentDoc = existingDocs[doc._id];

        if (currentDoc) {

          // If the design document already exists in the database we need to
          // set the revision on the potentially updated document as CouchDB
          // requires a specific revision to update.
          doc._rev = currentDoc._rev;

          if ((0, _deepEqual2['default'])(currentDoc, doc)) {

            // The design document has not changed since it was last updated.
            console.info('NO CHANGE %s ( _rev: %s )', doc._id, doc._rev);
          } else {

            // The design document has changed and needs to be updated.
            console.info('UPDATE %s from _rev: %s', doc._id, doc._rev);
            changed.push(doc);
          }
        } else {

          // It's a new design document and will be inserted into the
          // database.
          console.info('CREATE %s', doc._id);
          changed.push(doc);
        }
      });

      // if no design docs have been added or changed then there's nothing more to do
      if (!changed.length) {
        return [];
      }

      // create temp design docs
      var tempDocs = changed.map(function (orig) {
        var tmp = JSON.parse(JSON.stringify(orig));
        tmp._id = tmp._id.replace(/^(_design\/)/, '$1' + tempDocPrefix);
        tmp._rev = void 0;
        return tmp;
      });

      console.info('> Save temporary design docs with prefix "%s"', tempDocPrefix);

      return qouch.bulk(tempDocs).then(updateRevs(tempDocs)).then(function () {

        // index newly created temp design docs
        console.info('> Index views on new temp design docs');
        console.log({
          filter: new RegExp('^' + tempDocPrefix),
          maxActiveTasks: 4 });

        // TODO: provide option rather than hard-coding maxActiveTasks
        return (0, _couchdbIndexer2['default'])(qouch, {
          filter: new RegExp('^' + tempDocPrefix),
          maxActiveTasks: 4 });
      }). // TODO: provide option rather than hard-coding maxActiveTasks
      then(function () {

        // now that views indexed, save changed docs under original names
        console.info('> Indexing complete - update original design docs');
        return qouch.bulk(changed);
      }).then(updateRevs(changed)).then(function () {

        // finally, delete the temporary design docs and return changed docs
        console.info('> Delete temporary design docs');

        tempDocs.forEach(function (doc) {
          return doc._deleted = true;
        });
        return qouch.bulk(tempDocs);
      }).then(function () {
        console.info('> Success');
        return changed;
      });
    });
  });
};

function updateRevs(originals) {
  return function (updates) {

    originals.forEach(function (orig, i) {
      return orig._rev = updates[i]._rev;
    });

    return originals;
  };
}
module.exports = exports['default'];
//# sourceMappingURL=update-couch-designs.js.map