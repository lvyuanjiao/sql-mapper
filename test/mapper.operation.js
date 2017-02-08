'use strict';

var path = require('path');
var should = require('should');
var helper = require('./helper');

describe('Operation', function() {

  var sqlMapper;
  before(function(done) {
    helper.contruct('test', '{#select}select{/select}{#insert}insert{/insert}{#delete}delete{/delete}{#update}update{/update}', function(err, mapper) {
      should.not.exist(err);
      should.exist(mapper);
      sqlMapper = mapper;
      done();
    });
  });

  it('select', function(done) {
    sqlMapper.select('test.select').then(function(results){
      results.should.eql(['select']);
      done();
    }).catch(done);;
  });

  it('selectOne', function(done) {
    sqlMapper.selectOne('test.select').then(function(result){
      result.should.eql('select');
      done();
    }).catch(done);;
  });

  it('insert', function(done) {
    sqlMapper.insert('test.insert').then(function(result){
      result.should.have.property('insertId', 1);
      result.should.have.property('affectedRows', 1);
      done();
    }).catch(done);;
  });

  it('delete', function(done) {
    sqlMapper.delete('test.delete').then(function(result){
      result.should.have.property('affectedRows', 1);
      done();
    }).catch(done);
  });

  it('update', function(done) {
    sqlMapper.update('test.update').then(function(result){
      result.should.have.property('changedRows', 1);
      done();
    }).catch(done);;
  });

});
