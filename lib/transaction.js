function transaction(connection, mapper) {
  var tx = {};
  ['select', 'selectOne', 'insert', 'update', 'delete'].forEach(function(op) {
    (function(op) {
      tx[op] = function(queryName, params) {
        return mapper[op](connection, queryName, params);
      };
    })(op);
  });

  ['commit', 'rollback'].forEach(function(op) {
    (function(op) {
      tx[op] = function() {
        return new Promise(function(resolve, reject) {
          connection[op](function(err) {
            if (err) { return reject(err); }
            connection.end();
            resolve();
          });
        });
      };
    })(op);
  });

  return tx;
}

module.exports = transaction;
