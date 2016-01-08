'use strict';

var async = require('async');
var util = require('./util');
var Context = require('./context');

// function lookup table
var table = {
  'section': section,
  'fragment': fragment,
  'reference': reference,
  'inline': inline,
  'text': text
};

function parseNodes(nodes, ctx, callback) {
  var sql = '';
  var values = [];
  async.eachSeries(nodes, function(node, next) {
    table[node.type](node, ctx, function(_sql, _values) {
      sql = sql + _sql;
      values = [].concat(values, _values);
      next();
    });
  }, function() {
    callback(sql, values);
  });
}

function section(node, ctx, callback) {
  var sec = ctx.getMapper().section.get(node.value);
  if (!sec) {
    throw new Error('invalid section ' + node.value);
  }
  sec(ctx, node.params, function(newCtx, done) {
    parseNodes(node.block, newCtx, done);
  }, callback);
}

function fragment(node, ctx, callback) {
  var params = ctx.args(node.args);
  var queryName = util.spliceQueryName(node.value, ctx.namespace).join('.');
  var mapper = ctx.getMapper();
  mapper.sql.apply(mapper, [queryName, params, callback]);
}

function text(node, ctx, callback) {
  callback(node.value, []);
}

function reference(node, ctx, callback) {
  callback(ctx.nextSign(), ctx.value(node));
}

function inline(node, ctx, callback) {
  callback(ctx.value(node), []);
}

module.exports = function query(dialect, database, namespace, entry, AST) {
  var ctx = new Context(dialect, database, namespace, entry);

  // For lazy load
  var resultMap = null;
  var pluginChain = null;

  return function(params) {
    ctx.init(AST.args, params);
    return {
      ctx: ctx,
      AST: AST,
      reset: function(params) {
        ctx.init(AST.args, params);
      },
      getResultMap: function() {
        if (!resultMap) {
          if (!AST.map) {
            resultMap = util.dummyMap();
          } else {
            var mapName = util.spliceQueryName(AST.map, namespace);
            resultMap = ctx.getMapper().getResultMap(mapName[0], mapName[1]) || util.dummyMap();
          }
        }
        return resultMap;
      },
      getPluginChain: function() {
        if (!pluginChain) {
          pluginChain = ctx.getMapper().plugin.chain(AST.plugins || [], ctx);
        }
        return pluginChain;
      },
      getCache: function() {
        if (!AST.cache) {
          return {
            check: function(done) {
              done();
            },
            cache: function(value, done) {
              done();
            }
          };
        }
        var cache = ctx.getMapper().cacheProvider.get(AST.cache.key || ctx.namespace);
        return {
          check: function(done) {
            if (AST.cache.type === 'cache') {
              var cacheKey = util.getCacheKey(ctx.prefix, params);
              return done(cache.get(cacheKey));
            } else if (AST.cache.type === 'flush') {
              cache.reset();
            }
            done();
          },
          cache: function(value, done) {
            if (AST.cache.type === 'cache') {
              var cacheKey = util.getCacheKey(ctx.prefix, params);
              cache.set(cacheKey, value);
            }
            done();
          }
        };
      },
      parse: function(done) {
        parseNodes(AST.block, ctx, done);
      }
    };
  };
};
