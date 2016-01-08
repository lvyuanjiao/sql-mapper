'use strict';

var path = require('path');
var should = require('should');
var helper = require('./helper');

var cacheData = {};
var testCache = function() {
  return function(opt) {
    return {
      get: function(key) {
        return cacheData[key];
      },
      set: function(key, value) {
        cacheData[key] = [].concat(value);
      },
      reset: function() {
        cacheData = {};
      }
    };
  };
}

describe('Cache', function() {

  var sqlMapper;
  before(function(done) {
    helper.contruct('test', '{#cacheQuery+}placeholder{/cacheQuery}{#flushQuery-}placeholder{/flushQuery}', function(err, mapper) {
      should.not.exist(err);
      should.exist(mapper);
      mapper.cacheProvider.set({
        test: {}
      }, testCache());
      sqlMapper = mapper;
      done();
    });
  });

  it('should emtpy', function() {
    Object.keys(cacheData).should.be.empty();
  });

  it('should cache results', function(done) {
    sqlMapper.query('test.cacheQuery', function(err, results) {
      should.not.exist(err);
      results.should.eql([0]);
      Object.keys(cacheData).should.not.empty();
      done();
    });
  });

  it('should flush the cache', function(done) {
    sqlMapper.query('test.flushQuery', function(err, results) {
      should.not.exist(err);
      results.should.eql([0]);
      Object.keys(cacheData).should.be.empty();
      done();
    });
  });

});
