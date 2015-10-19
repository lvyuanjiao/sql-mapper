'use strict';

var fs = require('fs');
var path = require('path');
var Query = require('./query');
var parser = require('./parser');
var each = require('./util').each;
var Interceptor = require('./interceptor');
var Section = require('./section');
var TypeHandler = require('./type-handler');

function Mapper(namespace, dialect) {
    this.namespace = namespace;
    this.dialect = (dialect || 'mysql').toLowerCase();
    this.mappers = {};

    this.interceptor = new Interceptor();
    this.section = new Section();
    this.typeHandler = new TypeHandler();
}


Mapper.prototype.sql = function(queryName, args, callback) {

    if (typeof args === 'function') {
        callback = args;
        args = [];
    }

    var query = this.getQuery(queryName);
    if (!query) {
        throw new Error('Query: ' + queryName + ' is not exist');
    }
    query.sql.apply(query, [
        [].concat(args), callback
    ]);
};

Mapper.prototype.getQuery = function(queryName) {

    var paths = queryName.split('.');
    var ns = this.namespace;
    var filename;
    var entry;

    if(paths.length < 2) {
        filename = ns;
        entry = paths[0];
    } else {
        filename = paths[0];
        entry = paths[1];
    }

    return this.mappers[ns][filename][entry];
};

Mapper.prototype.parseString = function(filename, queryString) {

    var self = this;
    var ns = self.namespace;

    if(!queryString) {
        queryString = filename;
        filename = ns;
    }

    if(!self.mappers[ns][filename]) {
        self.mappers[ns][filename] = {};
    }
    var ast = parser.parse(queryString);
    for (var entry in ast) {
        self.mappers[ns][filename][entry] = new Query(ns, filename, ast[entry]);
    }
    return ast;
};

Mapper.prototype.parseFile = function(filepath, done) {
    var self = this;

    fs.lstat(filepath, function(err, stat) {
        if(err) {
            return done(err);
        }

        if(!stat.isFile() || !/.smp$/i.test(filepath)) {
            return done();
        }
        
        fs.readFile(filepath, function(err, data){
            if(err) {
                return done(err);
            }

            // filename
            var filename = path.basename(filepath, path.extname(filepath));
            self.parseString(filename, data.toString());
            done();
        });

    });
};

Mapper.prototype.parseFolder = function(folder, done) {
    var self = this;
    var ns = self.namespace;

    if(!self.mappers[ns]) {
        self.mappers[ns] = {};
    }

    fs.readdir(folder, function(err, files){
        if(err) {
            return done(err);
        }

        each(files, function(file, next){

            self.parseFile(folder + path.sep + file, next);

        }, done);

    });
};

Mapper.prototype.build = function(mappers, done) {
    var self = this;
    
    fs.lstat(mappers, function(err, stats) {
        
        if(stats.isDirectory()) {
            self.parseFolder(mappers, done);
        } else if(stats.isFile()) {
            self.parseFile(mappers, done);
        } else {
            self.parseString(mappers);
            done();
        }

    });

};

/*
var convert = function(sql, prefix) {
    var regex = /\?(?=([^'\\]*(\\.|'([^'\\]*\\.)*[^'\\]*'))*[^']*$)/g;
    var i = 1;
    return sql.replace(regex, function() {
        return prefix + i++;
    });
};
var converter = {
    'mysql': function(sql) {
        return sql;
    },
    'oracel': function(sql) {
        convert(sql, ':');
    },
    'mssql': function(sql) {
        convert(sql, '@');
    },
    'postgres': function(sql) {
        convert(sql, '$');
    }
};
*/

module.exports = Mapper;