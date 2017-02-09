'use strict';

var path = require('path');
var should = require('should');
var helper = require('./helper');

describe('From file system', function() {
  it('file', function(done) {
    helper.contruct(path.join(__dirname, 'mappers/post.smp'), function(err, mapper) {
      should.not.exist(err);
      should.exist(mapper);
      done();
    });
  });

  it('folder', function(done) {
    helper.contruct(path.join(__dirname, 'mappers'), function(err, mapper) {
      should.not.exist(err);
      should.exist(mapper);
      done();
    });
  });

  it('failure', function(done) {
    helper.contruct(path.join(__dirname, 'mappers/not_exist.smp'), function(err) {
      should.exist(err);
      done();
    });
  });
});
