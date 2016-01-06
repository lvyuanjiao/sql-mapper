'use strict';

var async = require('async');

function Plugin() {
  this.plugins = {};
}

Plugin.prototype.set = function(name, plugin) {
  this.plugins[name] = plugin;
};

Plugin.prototype.get = function(name) {
  return this.plugins[name];
};

Plugin.prototype.chain = function(plugins, ctx) {
  var self = this;
  var filters = [];
  plugins.forEach(function(plugin) {
    var handler = self.get(plugin.value);
    if (!handler) {
      throw new Error(plugin.value + ' plugin not found');
    }
    filters.push({
      'name': plugin.value,
      'handler': handler,
      'args': plugin.args,
      'params': ctx.args(plugin.args),
      'ctx': ctx
    });
  });
  return new Chain(filters);
};

function Chain(chain) {
  this.chain = chain;
}

Chain.prototype.beforeParse = function(params, done) {
  var self = this;
  async.eachSeries(self.chain, function(filter, next) {
    var handle = filter.handler.beforeParse;
    if(!handle) {
      return next();
    }
    handle(params, filter, function(_params) {
      params = _params;
      next();
    });
  }, function() {
    done(params);
  });
};

Chain.prototype.afterParse = function(sql, values, done) {
  var self = this;
  var ctx = self.ctx;
  async.eachSeries(self.chain, function(filter, next) {
    var handle = filter.handler.afterParse;
    if(!handle) {
      return next();
    }
    handle(sql, values, filter, function(_sql, _values) {
      sql = _sql;
      values = _values;
      next();
    });
  }, function() {
    done(sql, values);
  });
};

Chain.prototype.beforeMapping = function(rows, done) {
  var self = this;
  var ctx = self.ctx;
  async.eachSeries(self.chain, function(filter, next) {
    var handle = filter.handler.beforeMapping;
    if(!handle) {
      return next();
    }
    handle(rows, filter, function(_rows) {
      rows = _rows;
      next();
    });
  }, function() {
    done(rows);
  });
};

Chain.prototype.afterMapping = function(results, done) {
  var self = this;
  var ctx = self.ctx;
  async.eachSeries(self.chain, function(filter, next) {
    var handle = filter.handler.afterMapping;
    if(!handle) {
      return next();
    }
    handle(results, filter, function(_results) {
      results = _results;
      next();
    });
  }, function() {
    done(results);
  });
};

module.exports = Plugin;
