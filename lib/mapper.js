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
var cacheProvider = require('./cache-provider');
var transaction = require('./transaction');

function Mapper(database, adaptor) {
  this.database = database;
  this.adaptor = adaptor;
  this.section = section();
  this.plugin = plugin();
  this.typeHandler = typeHandler();
  this.cacheProvider = cacheProvider();
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

Mapper.prototype.sql = function(queryName, params, done) {
  var self = this;
  if (typeof params === 'function') {
    done = params;
    params = [];
  }
  params = params || [];

  var entryPath = util.spliceQueryName(queryName, this.database);
  var q = self.getQuery(entryPath[0], entryPath[1], true)(params);
  var chain = q.getPluginChain();

  chain.beforeParse(params, function(newParams) {    
    if (params !== newParams) { // Reinit context if params changed
      q.reset(newParams);
    }
    q.parse(function(sql, values) {
      chain.afterParse(sql, values, done);
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
  var cache = q.getCache();

  return new Promise(function(resolve, reject) {
    function mapping(err, rows) {
      if (err) { return reject(err); }
      var resultMap = q.getResultMap(); // Get result map
      var mappingAction = resultMap ? resultMap.mapping : function(results, done) { done(null, results) };      
      
      chain.beforeMapping(rows, function(rows) { // chain before mapping
        mappingAction(rows, function(err, results) {
          if (err) { return reject(err); }
          chain.afterMapping(results, function(results) { // chain after mapping
            cache.cache(results, function() { // cache results
              resolve(results);
            });
          });
        });
      });
    }

    cache.check(function(results) {
      if (results) { return resolve(results); }
      chain.beforeParse(params, function(newParams) { // chain before parse     
        if (params !== newParams) { // Reinit context
          q.reset(newParams);
        }
        q.parse(function(sql, values) {          
          chain.afterParse(sql, values, function(sql, values) { // chain after parse
            if (conn) {
              return conn.query(sql, values, mapping);
            }
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

Mapper.prototype.parseString = function(ns, input, done) {
  var self = this;
  var dialect = self.adaptor.dialect;
  var db = self.database;
  if (typeof input === 'function') {
    done = input;
    input = ns;
    ns = db;
  }
  util.ensure(this.AST, 'map', db, ns);
  util.ensure(this.AST, 'sql', db, ns);

  var AST = parser.parse(input);
  async.parallel([
    function(callback) {
      async.forEachOf(AST.map, function(content, entry, next) {
        self.AST.map[db][ns][entry] = resultMap(dialect, db, ns, entry, content);
        next();
      }, callback);
    },
    function(callback) {
      async.forEachOf(AST.sql, function(content, entry, next) {
        self.AST.sql[db][ns][entry] = query(dialect, db, ns, entry, content);
        next();
      }, callback);
    }
  ], done);
};

// filename as namespace
Mapper.prototype.parseFile = function(filepath, done) {
  var self = this;
  fs.readFile(filepath, function(err, data) {
    if (err) { return done(err); }
    var ns = path.basename(filepath, path.extname(filepath));
    self.parseString(ns, data.toString(), done);
  });
};

// filename as namespace
Mapper.prototype.parseFolder = function(folder, done) {
  var self = this;
  var db = self.database;
  fs.readdir(folder, function(err, files) {
    if (err) { return done(err); }
    async.each(files, function(file, next) {
      self.parseFile(folder + path.sep + file, next);
    }, done);
  });
};

Mapper.prototype.build = function(mappers, done) {
  var self = this;
  fs.exists(mappers, function(exists) {
    if (exists) {
      fs.lstat(mappers, function(err, stats) {
        if (err) { return done(err); }
        if (stats.isDirectory()) {
          self.parseFolder(mappers, done);
        } else if (stats.isFile()) {
          self.parseFile(mappers, done);
        }
      });
    } else {
      self.parseString(mappers, done);
    }
  });
};

module.exports = Mapper;
