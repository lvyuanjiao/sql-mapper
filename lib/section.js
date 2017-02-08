'use strict';

var util = require('./util');

function _where(ctx, params, nextBlock, done) {
  nextBlock(ctx, function(sql, values) {
    sql = sql.trim();
    if (sql) {
      sql = 'WHERE ' + sql.replace(/^(and|or)/i, ' ');
    }
    done(sql, values);
  });
}

function _set(ctx, params, nextBlock, done) {
  nextBlock(ctx, function(sql, values) {
    sql = sql.trim();
    if (sql) {
      sql = 'SET ' + sql.replace(/,$/, ' ');
    }
    done(sql, values);
  });
}

function _if(ctx, params, nextBlock, done) {
  if (ctx.eval(params.test)) {
    nextBlock(ctx, done);
  } else {
    done('', []);
  }
}

function _each(ctx, params, nextBlock, done) {
  var value = ctx.eval(params.value);
  var index = params.index || 'index';
  var key = params.key || 'key';
  var item = params.item || 'item';
  var open = params.open || '';
  var close = params.close || '';
  var exclude = (params.exclude || '').replace(/\s+/g, '').split(',');

  var txt = '';
  params = [];

  function callback(sql, values, next) {
    txt += (open + sql + close);
    params = [].concat(params, values);
    next();
  }

  util.each(value, function(val, next, k, i) {
    if (exclude.indexOf(k) > -1) {
      return next(); // skip property which list in exclude
    }
    ctx.pushState();
    ctx.set(key, k);
    ctx.set(index, i);
    ctx.set(item, val);
    nextBlock(ctx, function(sql, values) {
      ctx.popState();
      callback(sql, values, next);
    });
  }, function() {
    done(txt, params);
  });
}

function _trim(ctx, params, nextBlock, done) {
  var pre = params.prefix || '';
  var suf = params.suffix || '';
  var po = params.prefixOverrides;
  var so = params.suffixOverrides;

  nextBlock(ctx, function(sql, values) {
    sql = sql.trim();
    if (!sql) {
      return done(sql, values);
    }
    if (po) {
      sql = sql.replace(new RegExp('^(' + po + ')', 'i'), ' ');
    }
    if (so) {
      sql = sql.replace(new RegExp('(' + so + ')$', 'i'), ' ');
    }
    done(pre + sql + suf, values);
  });
}

function Section() {
  //built in sections
  this.sections = {
    'where': _where,
    'set': _set,
    'if': _if,
    'each': _each,
    'trim': _trim
  };
}

Section.prototype.set = function(name, callback) {
  this.sections[name] = callback;
};

Section.prototype.get = function(name) {
  return this.sections[name];
};

module.exports = Section;
