'use strict';

var util = require('./util');

function CacheProvider() {
  this.caches = {};
}

CacheProvider.prototype.set = function(opts, cacheClient) {
  for (var key in opts) {
    this.caches[key] = cacheClient(opts[key]);
  }
};

CacheProvider.prototype.get = function(name) {
  return this.caches[name] || util.dummyCache;
};

module.exports = CacheProvider;
