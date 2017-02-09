'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var util = require('./util');
var query = require('./query');
var parser = require('./parser');
var plugin = require('./plugin');
var section = require('./section');
var resultMap = require('./result-map');
var typeHandler = require('./type-handler');
var transaction = require('./transaction');

function Mapper(database, adaptor) {
  this.database = database;
  this.adaptor = adaptor;
  this.section = section();
  this.plugin = plugin();
  this.typeHandler = typeHandler(adaptor.dialect);
  this.AST = {};
}

Mapper.prototype.getResultMap = function(namespace, entry, throwError) {
  try {
    return this.AST.map[this.database][namespace][entry];
  } catch (e) {
    if (throwError) {
      throw new Error(namespace + '.' + entry + ' map not found.');
    }
    return null;
  }
};

Mapper.prototype.getQuery = function(namespace, entry, throwError) {
  try {
    return this.AST.sql[this.database][namespace][entry];
  } catch (e) {
    if (throwError) {
      throw new Error(namespace + '.' + entry + ' query not found.');
    }
    return null;
  }
};

Mapper.prototype.sql = function(queryName, params) {
  params = params || [];

  var entryPath = util.spliceQueryName(queryName, this.database);
  var q = this.getQuery(entryPath[0], entryPath[1], true)(params);
  var chain = q.getPluginChain();

  return new Promise(function(resolve){
    q.parse(function(sv) {
      chain.before(sv.sql, sv.values, function(sql, values) {
        resolve({ sql: sql, values: values });
      });
    });
  });
};

Mapper.prototype.query = function(conn, queryName, params) {
  var self = this;
  if (typeof conn === 'string') {
    params = queryName;
    queryName = conn;
    conn = null;
  }
  params = params || [];

  var entryPath = util.spliceQueryName(queryName, this.database);
  var q = self.getQuery(entryPath[0], entryPath[1], true)(params);
  var chain = q.getPluginChain();

  return new Promise(function(resolve, reject) {
    function mapping(err, rows) {
      if (err) { return reject(err); }
      var resultMap = q.getResultMap(); // Get result map
      var mappingAction = resultMap ? resultMap.mapping : function(results, done) { done(null, results) };
      mappingAction(rows, function(err, results) {
        if (err) { return reject(err); }
        chain.after(results, resolve);
      });
    }

    q.parse(function(sv) {
      chain.before(sv.sql, sv.values, function(sql, values, cache) {
        if (cache) { return resolve(cache); } // hit the cache
        if (conn) { return conn.query(sql, values, mapping); } // query use present connection
        self.adaptor.connect(function(err, conn) {
          if (err) { return reject(err); }
          conn.query(sql, values, function(err, rows) {
            conn.end();
            mapping(err, rows);
          });
        });
      });
    });
  });
};

Mapper.prototype.begin = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.adaptor.connect(function(err, conn) {
      if (err) { return reject(err); }
      conn.begin(function(err) {
        if (err) {
          conn.end();
          return reject(err);
        }
        resolve(transaction(conn, self));
      });
    });
  });
};

['select', 'selectOne', 'insert', 'update', 'delete'].forEach(function(op) {
  (function(op) {
    Mapper.prototype[op] = function(conn, queryName, params) {
      var self = this;
      return new Promise(function(resolve, reject){
        self.query(conn, queryName, params).then(function(result) {
          resolve(self.adaptor[op](result));
        }).catch(reject);
      });
    };
  })(op);
});

Mapper.prototype.parseString = function(ns, input) {
  var self = this;
  var dialect = self.adaptor.dialect;
  var db = self.database;
  if (!input) {
    input = ns;
    ns = db;
  }
  util.ensure(this.AST, 'map', db, ns);
  util.ensure(this.AST, 'sql', db, ns);  

  return new Promise(function(resolve, reject) {
    try {
      var AST = parser.parse(input);
      for(var entry in AST.map) {
        self.AST.map[db][ns][entry] = resultMap(dialect, db, ns, entry, AST.map[entry]);
      }
      for(var entry in AST.sql) {
        self.AST.sql[db][ns][entry] = query(dialect, db, ns, entry, AST.sql[entry]);
      }
      resolve();
    } catch(err) {
      reject(err);
    }
  });
};

// filename as namespace
Mapper.prototype.parseFile = function(filepath) {
  var self = this;
  return new Promise(function(resolve, reject){
    fs.readFile(filepath, function(err, data) {
      if (err) { return reject(err); }
      var ns = path.basename(filepath, path.extname(filepath));
      self.parseString(ns, data.toString()).then(resolve).catch(reject);
    });
  });
};

// filename as namespace
Mapper.prototype.parseFolder = function(folder) {
  var self = this;
  return new Promise(function(resolve, reject) {
    fs.readdir(folder, function(err, files) {
      if (err) { return reject(err); }
      async.each(files, function(file, next) {
        self.parseFile(folder + path.sep + file).then(next).catch(reject);
      }, resolve);
    });
  });
};

Mapper.prototype.build = function(mappers) {
  var self = this;
  return new Promise(function(resolve, reject){
    fs.exists(mappers, function(exists) {
      if (exists) {
        fs.lstat(mappers, function(err, stats) {
          if (err) { return reject(err); }
          if (stats.isDirectory()) {
            self.parseFolder(mappers).then(resolve, reject);
          } else if (stats.isFile()) {
            self.parseFile(mappers).then(resolve, reject);
          }
        });
      } else {
        self.parseString(mappers).then(resolve, reject);
      }
    });
  });
};

module.exports = Mapper;
