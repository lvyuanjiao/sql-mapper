'use strict';

function CacheProvider() {
  this.caches = {};
}

CacheProvider.prototype.set = function(opts, cacheClient) {
  for (var key in opts) {
    this.caches[key] = cacheClient(opts[key]);
  }
};

CacheProvider.prototype.get = function(name) {
  return this.caches[name] || {
    get: function(k) {
      return undefined;
    },
    set: function() {},
    reset: function() {}
  };
};

module.exports = CacheProvider;
