'use strict';

var async = require('async');

function chain(filters) {
  return {
    before: function(sql, values, done) {
      var cache = null;
      async.eachSeries(filters, function(filter, next) {
        var handle = filter.handler.before;
        if(!handle) {
          return next();
        }
        handle(sql, values, filter, function(_sql, _values, results) {
          sql = _sql;
          values = _values;
          cache = results;
          next();
        });
      }, function() {
        done(sql, values, cache);
      });
    },
    after: function(results, done) {
      async.eachSeries(filters, function(filter, next) {
        var handle = filter.handler.after;
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
    }
  };
}

module.exports = function plugin() {
  var pluginCache = {};
  return {
    get: function(name) {
      return pluginCache[name];
    },
    set: function(name, plugin) {
      pluginCache[name] = plugin;
    },
    chain: function(plugins, ctx) {
      var filters = [];
      plugins.forEach(function(plugin) {
        var handler = pluginCache[plugin.value];
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
      return chain(filters);
    }
  };
};
