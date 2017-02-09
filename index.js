'use strict';

require('es6-promise').polyfill();
var Mapper = require('./lib/mapper');
var cache = {};

function Factory(name) {
  if (!name) {
    name = Object.keys(cache)[0];
  }
  var mapper = cache[name];
  if (!mapper) {
    throw new Error('Mapper ' + name + ' is not exist');
  }
  return mapper;
}

/*
var opts = {
  adaptor:'',
  database: '',
  driver:{},
  pool:{},
  plugins: {
    pluginName: {
      provider: 'plugin',
      opts: {}
    }
  }
}
*/
Factory.create = function(mappers, opts) {
  opts.database = opts.database || opts.driver.database;
  var adaptor = require(opts.adaptor)(opts);
  var mapper = new Mapper(opts.database, adaptor);
  return new Promise(function(resolve, reject){
    mapper.build(mappers).then(function() {
      for (var key in opts.plugins) { // config plugins
        var pluginOpts = opts.plugins[key];
        mapper.plugin.set(key, require(pluginOpts.provider)(pluginOpts.opts || {}));
      }
      cache[opts.database] = mapper;
      resolve(mapper);
    }).catch(reject);
  });
};

module.exports = Factory;
