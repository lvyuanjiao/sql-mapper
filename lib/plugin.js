'use strict';

var async = require('async');

function chain(filters) {
  return {
    beforeParse: function(params, done) {
      async.eachSeries(filters, function(filter, next) {
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
    },
    afterParse: function(sql, values, done) {
      async.eachSeries(filters, function(filter, next) {
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
    },
    beforeMapping: function(rows, done) {
      async.eachSeries(filters, function(filter, next) {
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
    },
    afterMapping: function(results, done) {
      async.eachSeries(filters, function(filter, next) {
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
