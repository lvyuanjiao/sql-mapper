'use strict';

var Section = require('./section');
var TypeHandler = require('./type-handler');
var Provider = require('./provider');

function Mapper(opts) {
    this.dialect = opts.dialect || 'mysql';
    this.provider = new Provider(opts.namespace, opts.mappers);
    this.section = new Section();
    this.typeHandler = new TypeHandler();
}

Mapper.prototype.build = function(done) {
    this.provider.build(done);
};

Mapper.prototype.sql = function(queryName, args, callback) {

    if (typeof args === 'function') {
        callback = args;
        args = [];
    }

    var query = this.provider.query(queryName);

    if (!query) {
        throw new Error('Query: ' + queryName + ' is not exist');
    }

    var convert = converter[this.dialect];
    var done = function(sql, values, filters) {
        callback(convert(sql), values, filters);
    };

    query.sql.apply(query, [
        [].concat(args), done
    ]);
};

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

module.exports = Mapper;