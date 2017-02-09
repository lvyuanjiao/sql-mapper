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
    table[node.type](node, ctx, function(sv) {
      sql = sql + sv.sql;
      values = [].concat(values, sv.values);
      next();
    });
  }, function() {
    callback({ sql: sql, values: values });
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
  ctx.getMapper().sql(queryName, params).then(callback);
}

function text(node, ctx, callback) {
  callback({ sql: node.value, values: [] });
}

function reference(node, ctx, callback) {
  callback({ sql: ctx.nextSign(), values: ctx.value(node) } );
}

function inline(node, ctx, callback) {
  callback({ sql: ctx.value(node), values: []});
}

module.exports = function query(dialect, database, namespace, entry, AST) {
  var ctx = new Context(dialect, database, namespace, entry);

  // For lazy load
  var resultMap = null;
  var pluginChain = null;

  return function(params) {
    ctx.init(AST.args, params);
    return {
      parse: function(done) {
        parseNodes(AST.block, ctx, done);
      },
      getResultMap: function() {
        if (!AST.map) { return null; }
        if (resultMap) { return resultMap; }
        var mapName = util.spliceQueryName(AST.map, namespace);
        return resultMap = ctx.getMapper().getResultMap(mapName[0], mapName[1]);
      },
      getPluginChain: function() {
        if (pluginChain) { return pluginChain; }
        return pluginChain = ctx.getMapper().plugin.chain(AST.plugins || [], ctx);
      }
    };
  };
};
