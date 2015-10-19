'use strict';

var each = require('./util').each;
var Context = require('./context');

// function lookup table
var fns = {
    'reference': 'end',
    'inline': 'end',
    'text': 'end',
    'section': 'section',
    'fragment': 'fragment'
};

var Query = function(namespace, filename, ast) {
    this.namespace = namespace;
    this.filename = filename;
    this.entry = ast.name;
    this.ast = ast;
};

Query.prototype.sql = function(args, done) {
    var ctx = new Context(this.namespace, this.filename, this.entry);

    this.ast.args.forEach(function(arg, i) {
        ctx.val(arg, args[i]);
    });

    var interceptor = ctx.mapper().interceptor;
    var chain = this.ast.interceptors;
    this.parse(this.ast.block, ctx, function(sql, values) {
        ctx.sql = sql;
        ctx.values = values;
        interceptor.chain(ctx, chain, done);
    });
};

Query.prototype.parse = function(nodes, ctx, callback) {
    
    var self = this;
    var sql = '';
    var values = [];

    each(nodes, function(node, next) {
        self[fns[node.type]](node, ctx, function(_sql, _values) {
            sql = sql + (node.type === 'section' ? ' ' : '') + _sql;
            values = [].concat(values, _values);
            next();
        });
    }, function() {
        callback(sql, values);
    });

};

Query.prototype.section = function(node, ctx, callback) {
    var self = this;
    var mapper = ctx.mapper();
    var sec = mapper.section.get(node.value);
    if(!sec) {
        throw new Error('invalid section ' + node.value);
    }
    sec(ctx, node.params, function(newCtx, done){
        self.parse(node.block, newCtx, done);
    }, callback);

};

Query.prototype.fragment = function(node, ctx, callback) {
    
    var args = ctx.args(node.args);

    var ref = node.value;
    if(node.value.length === 1) {
        ref = [this.filename, ref[0]];
    }
    
    var mapper = ctx.mapper();
    mapper.sql.apply(mapper, [ref.join('.'), args, callback]);

};

Query.prototype.end = function(node, ctx, callback) {
    
    switch (node.type) {
    case 'text' :
        callback(node.value, []);
        break;
    case 'inline':
        callback(ctx.value(node.value, node.handler), []);
        break;
    case 'reference':
        callback(ctx.nextParamSign(), ctx.value(node.value, node.handler));
        break;
    default:
        callback('', []);
    }

};

module.exports = Query;