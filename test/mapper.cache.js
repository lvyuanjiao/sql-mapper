'use strict';

var path = require('path');
var should = require('should');
var helper = require('./helper');

var cacheData = {};
var testCache = function() {
  return {
    get: function(key, done) {
      done(cacheData[key]);
    },
    set: function(key, value, done) {
      cacheData[key] = [].concat(value);
      done();
    },
    reset: function(done) {
      cacheData = {};
      done();
    }
  };
}

describe('Cache', function() {
  var sqlMapper;
  before(function(done) {
    helper.contruct('test', '{#cacheQuery+}select{/cacheQuery}{#flushQuery-}select{/flushQuery}', function(err, mapper) {
      should.not.exist(err);
      should.exist(mapper);
      mapper.cacheProvider.set('test', testCache());
      sqlMapper = mapper;
      done();
    });
  });

  it('should emtpy', function() {
    Object.keys(cacheData).should.be.empty();
  });

  it('should cache results', function(done) {
    sqlMapper.query('test.cacheQuery',[0]).then(function(results){
      results.should.eql(['select']);
      Object.keys(cacheData).should.not.empty();
      done();
    }).catch(done);;
  });

  it('should flush the cache', function(done) {
    sqlMapper.query('test.flushQuery',[0]).then(function(results){
      results.should.eql(['select']);
      Object.keys(cacheData).should.be.empty();
      done();
    }).catch(done);;
  });

});
