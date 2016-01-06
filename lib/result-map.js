'use strict';

var async = require('async');
var util = require('./util');

function expandAST(AST, getBaseAST, done) {

  function overrideResult(target, base, callback) {
    async.forEachOf(base.result, function(value, property, next) {
      target.result = target.result || {};
      target.result[property] = target.result[property] || value;
      next();
    }, callback);
  }

  function overrideBlock(target, base, callback) {
    async.forEachOf(base, function(nextBlock, property, next) {
      target[property] = target[property] || {};
      mergeAST(target[property], nextBlock, function() {
        expandAST(target[property], getBaseAST, next);
      });
    }, callback);
  }

  function overrideBlocks(target, base, callback) {
    async.parallel([
      function(cb) {
        //association
        overrideBlock(target.association, base.association, cb);
      },
      function(cb) {
        //collection
        overrideBlock(target.collection, base.collection, cb);
      }
    ], callback);
  }

  var base = getBaseAST(AST.extend);
  // remove extend property
  delete AST.extend;

  AST.id = util.idArray(AST.id, base.id);
  async.parallel([
    function(callback) {
      //override result
      overrideResult(AST, base, callback);
    },
    function(callback) {
      // extend
      overrideBlocks(AST, base, callback);
    },
    function(callback) {
      // AST
      overrideBlocks(AST, AST, callback);
    }
  ], done);
}

// Extend from base
function mergeAST(target, base, done) {
  target.extend = base.extend;
  target.id = util.idArray(target.id, base.id);
  async.parallel([
    function(callback) {
      //result
      target.result = target.result || {};
      async.forEachOf(base.result, function(result, property, next) {
        target.result[property] = target.result[property] || result;
        next();
      }, callback);
    },
    function(callback) {
      //association
      target.association = target.association || {};
      async.forEachOf(base.association, function(association, property, next) {
        mergeAST(target.association[property], association, next);
      }, callback);
    },
    function(callback) {
      //collection
      target.collection = target.collection || {};
      async.forEachOf(base.collection, function(collection, property, next) {
        mergeAST(target.collection[property], collection, next);
      }, callback);
    }
  ], done);
}

function resolveValue(struct, row, typeHandle, done) {
  var map = {};
  async.parallel([
    function(callback) {
      async.forEachOf(struct.result, function(result, key, next) {
        var val = row[result.column];
        var params = [val];
        if (result.params) {
          params = params.concat(result.params.map(function(param) {
            return row[param];
          }));
        }
        map[key] = result.handler ? typeHandle(result.handler, params) : val;
        next();
      }, callback);
    },
    function(callback) {
      async.forEachOf(struct.association, function(association, key, next) {
        resolveValue(association, row, typeHandle, function(ret) {
          map[key] = ret;
          next();
        });
      }, callback);
    },
    function(callback) {
      async.forEachOf(struct.collection, function(collection, key, next) {
        resolveValue(collection, row, typeHandle, function(ret) {
          map[key] = ret;
          next();
        });
      }, callback);
    }
  ], function() {
    done(map);
  });
}

function mergeValue(struct, result, data, done) {
  async.parallel([
    function(callback) {
      var actual = util.idValue(struct.id, data);
      var expect = util.idValue(struct.id, result);
      if (!expect || (actual !== expect)) {
        async.forEachOf(struct.result, function(value, key, next) {
          result[key] = data[key];
          next();
        }, callback);
      } else {
        callback();
      }
    },
    function(callback) {
      async.forEachOf(struct.association, function(association, key, next) {
        result[key] = result[key] || {};
        mergeValue(association, result[key], data[key], next);
      }, callback);
    },
    function(callback) {
      async.forEachOf(struct.collection, function(collection, key, next) {
        var list = result[key] = result[key] || [];
        var id = collection.id;
        var pos = (id.length === 0) ? -1 : util.indexOfIdValue(list, id, util.idValue(id, data[key]));
        var val = {};
        if (pos === -1) {
          list.push(val);
        } else {
          val = list[pos];
        }
        mergeValue(collection, val, data[key], next);
      }, callback);
    }
  ], done);
}

module.exports = function resultMap(dialect, database, namespace, entry, AST) {

  function getMapper() {
    return require('../index')(database);
  }

  function getBaseAST(extend) {
    var ex = util.mapSchema();
    if (extend) {
      var queryName = util.spliceQueryName(extend, namespace);
      ex = getMapper().getResultMap(queryName[0], queryName[1], true);
      return ex.AST;
    }
    return ex;
  }

  function handle(name, params) {
    var handler = getMapper().typeHandler.get(name);
    if (!handler) {
      throw new Error('handler ' + name + ' is unavailable.');
    }
    return handler.apply(null, params);
  }

  var expanded = false;
  var m = {
    AST: AST,
    expand: function(done) {
      if (expanded) {
        return done(AST);
      }
      expandAST(AST, getBaseAST, function() {
        expanded = true;
        done(AST);
      });
    },
    mapping: function(rows, done) {
      m.expand(function(ast) {

        var result = {};
        var root = util.mapSchema();
        root.collection.results = ast;

        async.each(rows, function(row, next) {
          resolveValue(root, row, handle, function(data) {
            mergeValue(root, result, data, next);
          });
        }, function() {
          done(null, result.results);
        });

      });
    }
  };
  return m;
};
