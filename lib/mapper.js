'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var util = require('./util');
var query = require('./query');
var parser = require('./parser');
var Plugin = require('./plugin');
var Section = require('./section');
var resultMap = require('./result-map');
var TypeHandler = require('./type-handler');

function Mapper(database, adaptor) {
  this.database = database;
  this.adaptor = adaptor;
  this.section = new Section();
  this.plugin = new Plugin();
  this.typeHandler = new TypeHandler();
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
  var q = self.getQuery(entryPath[0], entryPath[1], true).init(params);
  var chain = q.getPluginChain();

  chain.onSql(params, function (bundle) {
    if(bundle) {
      return done(bundle.sql, bundle.values);
    }
    chain.beforeParse(params, function(newParams) {
      // Reinit context if params changed
      if (params !== newParams) {
        params = newParams;
        q.init(newParams);
      }
      q.parse(function(sql, values) {
        chain.afterParse(sql, values, done);
      });
    });
  });

};

Mapper.prototype.query = function(queryName, params, done, conn) {
  var self = this;
  if (typeof params === 'function') {
    conn = done;
    done = params;
    params = [];
  }
  params = params || [];

  var entryPath = util.spliceQueryName(queryName, this.database);
  var q = self.getQuery(entryPath[0], entryPath[1], true).init(params);
  var chain = q.getPluginChain();

  function mapping(err, rows) {
    if (err) {
      return done(err);
    }
    // Get result map
    var resultMap = q.getResultMap();

    // chain before mapping
    chain.beforeMapping(rows, function(rows) {
      resultMap.mapping(rows, function(err, results) {
        if (err) {
          return done(err);
        }
        // chain after mapping
        chain.afterMapping(results, function(results) {
          done(err, results);
        });
      });
    });
  }

  chain.onQuery(params, function (results) {
    if(results) {
      return done(null, results);
    }

    chain.beforeParse(params, function(newParams) {
      // Reinit context
      if (params !== newParams) {
        params = newParams;
        q.init(newParams);
      }
      q.parse(function(sql, values) {
        // chain after parse
        chain.afterParse(sql, values, function(sql, values) {
          if (conn) {
            return conn.query(sql, values, mapping);
          }
          self.adaptor.connect(function(err, conn) {
            if (err) {
              return done(err);
            }
            conn.query(sql, values, function(err, rows) {
              conn.end();
              mapping(err, rows);
            });
          });
        });
      });
    });
  });

};

Mapper.prototype.transaction = function(tasks, done) {
  this.adaptor.connect(function(err, conn) {
    if (err) {
      return done(err);
    }

    function rollback(err) {
      conn.rollback(function() {
        conn.end();
        done(err);
      });
    }
    conn.begin(function(err) {
      if (err) {
        conn.end();
        return done(err);
      }
      util.tx(tasks, function(err, results) {
        if (err) {
          return rollback(err);
        }
        conn.commit(function(err) {
          if (err) {
            return rollback(err);
          }
          conn.end();
          done(err, results);
        });
      }, conn);
    });
  });
};

['select', 'selectOne', 'insert', 'update', 'delete'].forEach(function (op) {
  (function (op) {
    Mapper.prototype[op] = function(queryName, params, done, conn) {
      this.query.apply(this, trimQueryArgs(queryName, params, done, conn)(this.adaptor[op]));
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
    if (err) {
      return done(err);
    }
    var ns = path.basename(filepath, path.extname(filepath));
    self.parseString(ns, data.toString(), done);
  });
};

// filename as namespace
Mapper.prototype.parseFolder = function(folder, done) {
  var self = this;
  var db = self.database;
  fs.readdir(folder, function(err, files) {
    if (err) {
      return done(err);
    }
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
        if (err) {
          return done(err);
        }
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

function trimQueryArgs(queryName, params, done, conn) {
  if (typeof params === 'function') {
    conn = done;
    done = params;
    params = [];
  }
  params = params || [];
  return function(fn) {
    return [queryName, params, function(err, rows) {
      done(err, rows && fn(rows));
    }, conn];
  };
}

module.exports = Mapper;
