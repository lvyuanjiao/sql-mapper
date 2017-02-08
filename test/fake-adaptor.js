'use strict';

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}

module.exports = function() {
  var connection = {
    query: function(sql, values, done) {
      var result = [sql];
      sql = sql.trim().toUpperCase();
      if (sql.startsWith('INSERT')) {
        result = { insertId: 1, affectedRows: 1 };
      } else if (sql.startsWith('UPDATE')) {
        result = { changedRows: 1 };
      } else if (sql.startsWith('DELETE')) {
        result = { affectedRows: 1 };
      }
      done(null, result);
    },
    begin: function(done) { done() },
    end: function() {},
    rollback: function(done) { done() }
  };
  return {
    dialect: 'mysql',
    connect: function (done) {
      done(null, connection);
    },
    select: function (rows) {
      return rows;
    },
    selectOne: function(rows) {
      return rows[0];
    },
    insert: function(result) {
      return result;
    },
    update: function(result) {
      return result;
    },
    delete: function(result) {
      return result;
    }
  };
}
