'use strict';

var path = require('path');
var Mapper = require('../index');

exports.contruct = function(db, string, done) {
  if(typeof string === 'function') {
    done = string;
    string = db;
    db = 'test';
  }
  Mapper.create(string, {
    adaptor: path.join(__dirname, 'fake-adaptor'),
    driver: {
      database: db
    }
  }, done);
}

exports.beauty = function(sql) {
  return sql.replace(/\s+/g, ' ').trim();
}
