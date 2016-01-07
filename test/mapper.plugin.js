'use strict';

var path = require('path');
var should = require('should');
var helper = require('./helper');

var testPlugin = function() {
  return {
    beforeParse: function(params, filter, done) {
      done([params[0] + 1]);
    },
    afterParse: function(sql, values, filter, done) {
      sql = 'NOT ' + sql.toUpperCase();
      done(sql, values);
    },
    beforeMapping: function(rows, filter, done) {
      rows.push(1);
      done(rows);
    },
    afterMapping: function(results, filter, done) {
      results.push(2);
      done(results);
    }
  };
};

var cachePlugin = function() {
  return {
    onSql: function(params, plugin, done) {
      // always
      done({
        sql: 'SELECT * FROM table',
        values: [1, 2]
      });
    },
    onQuery: function(params, plugin, done) {
      // always
      done([1, 2, 3, 4, 5]);
    }
  };
}

describe('Plugin', function() {

  it('sql should pass', function(done) {
    helper.contruct('test', '{#query(param) |test param}lower case text #param{/query}', function(err, mapper) {
      mapper.plugin.set('test', testPlugin());
      mapper.sql('test.query', [0], function(sql, values) {
        //console.log(sql, values);
        helper.beauty(sql).should.be.equal('NOT LOWER CASE TEXT ?');
        values.should.eql([1]);
        done();
      });
    });
  });

  it('query should pass', function(done) {
    helper.contruct('test', '{#query(param) |test param |test param}lower case text #param{/query}', function(err, mapper) {
      mapper.plugin.set('test', testPlugin());
      mapper.query('test.query', [0], function(err, results) {
        should.not.exists(err);
        results.should.eql([0, 1, 1, 2, 2]);
        done();
      });
    });
  });

  it('cache sql should pass', function(done) {
    helper.contruct('test', '{#query |cache}test{/query}', function(err, mapper) {
      mapper.plugin.set('cache', cachePlugin());
      mapper.sql('test.query', [0], function(sql, values) {
        helper.beauty(sql).should.be.equal('SELECT * FROM table');
        values.should.eql([1, 2]);
        done();
      });
    });
  });

  it('cache query should pass', function(done) {
    helper.contruct('test', '{#query |cache}test{/query}', function(err, mapper) {
      mapper.plugin.set('cache', cachePlugin());
      mapper.query('test.query', [0], function(err, results) {
        should.not.exists(err);
        results.should.eql([1, 2, 3, 4, 5]);
        done();
      });
    });
  });

});
