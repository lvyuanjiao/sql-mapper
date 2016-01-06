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
  async.eachSeries(nodes, function (node, next) {
    table[node.type](node, ctx, function(_sql, _values) {
      sql = sql + _sql;
      values = [].concat(values, _values);
      next();
    });
  }, function () {
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

  var q = {
    ctx: ctx,
    AST: AST,
    init: function (params) {
      ctx.init(AST.args, params);
      return q;
    },
    getResultMap: function () {
      if(!AST.map) {
        return util.dummyMap();
      } else {
        var mapName = util.spliceQueryName(AST.map, namespace);
        return ctx.getMapper().getResultMap(mapName[0], mapName[1]) || util.dummyMap();
      }
    },
    getPluginChain: function () {
      return ctx.getMapper().plugin.chain(AST.plugins || [], ctx);
    },
    parse: function (params, done) {
      if(done) {
        q.init(params);
      } else {
        done = params;
      }
      parseNodes(AST.block, ctx, done);
    }
  };

  return q;
};
