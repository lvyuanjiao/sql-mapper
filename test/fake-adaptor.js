'use strict';

module.exports = function() {
  var connection = {
    query: function(sql, values, done) {
      done(null, [0]);
    },
    end: function() {}
  };
  return {
    dialect: 'mysql',
    connect: function (done) {
      done(null, connection);
    }
  };
}
