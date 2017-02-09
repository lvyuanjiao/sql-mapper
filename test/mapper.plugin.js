'use strict';

var path = require('path');
var should = require('should');
var helper = require('./helper');

var casePlugin = function() {
  return {
    before: function(sql, values, filter, done) {
      var fn = (filter.params[0] === 'upper') ? 'toUpperCase' : 'toLowerCase';
      done(sql[fn](), [values[0][fn]()]);
    },
    after: function(results, filter, done) {
      results.push(2);
      done(results);
    }
  };
};

var cachePlugin = function() {
  var cache = {
    'lower': ['lower cache']
  };
  return {
    before: function(sql, values, filter, done) {
      done(sql, values, cache[values[0]]);
    },
    after: function(results, filter, done) {
      results.push(2);
      done(results);
    }
  };
};

describe('Plugin', function() {
  it('sql', function(done) {
    helper.contruct('test', '{#query(param) |case param}select case text #param{/query}', function(err, mapper) {
      mapper.plugin.set('case', casePlugin());
      mapper.sql('test.query', 'upper').then(function(pair) {
        helper.beauty(pair.sql).should.be.equal('SELECT CASE TEXT ?');
        pair.values.should.eql(['UPPER']);
        done();
      }).catch(done);
    });
  });

  it('query', function(done) {
    helper.contruct('test', '{#query(param) |case param}select case text #param{/query}', function(err, mapper) {
      mapper.plugin.set('case', casePlugin());
      mapper.query('test.query', 'lower').then(function(results) {
        results.should.eql(['select case text ?', 2]);
        done();
      }).catch(done);;
    });
  });

  it('cache hit', function(done) {
    helper.contruct('test', '{#query(param) |cache}select case text #param{/query}', function(err, mapper) {
      mapper.plugin.set('cache', cachePlugin());
      mapper.query('test.query', 'lower').then(function(results) {
        results.should.eql(['lower cache']);
        done();
      }).catch(done);;
    });
  });

  it('cache it', function(done) {
    helper.contruct('test', '{#query(param) |cache}select case text #param{/query}', function(err, mapper) {
      mapper.plugin.set('cache', cachePlugin());
      mapper.query('test.query', 'upper').then(function(results) {
        results.should.eql(['select case text ?', 2]);
        done();
      }).catch(done);;
    });
  });  
});
