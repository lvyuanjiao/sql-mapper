'use strict';

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
  pool:{}
}
*/
Factory.create = function(mappers, opts, done) {
  opts.database = opts.database || opts.driver.database;
  var adaptor = require(opts.adaptor)(opts);
  var mapper = new Mapper(opts.database, adaptor);
  mapper.build(mappers, function(err) {
    if (err) {
      return done(err);
    }
    cache[opts.database] = mapper;
    done(null, mapper);
  });
};

module.exports = Factory;
