'use strict';

module.exports = function cacheProvider() {
  var caches = {};
  return {
    get: function(name) {
      var cache = caches[name] || {
        get: function(k, done) { done(); },
        set: function(k, v, done) { done(); },
        reset: function(done) { done(); }
      };
      return function(type, cacheKey) {
        return {
          check: function(done) {
            if (type === 'cache') {
              return cache.get(cacheKey, done);
            } else if (type === 'flush') {
              cache.reset(done);
            }
          },
          cache: function(value, done) {
            if (type === 'cache') {
              return cache.set(cacheKey, value, done);
            }
            done();
          }
        };
      };
    },
    set: function(key, cacheClient) {
      caches[key] = cacheClient;
    }
  };
};
