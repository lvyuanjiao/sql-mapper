'use strict';

var each = require('./each');
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

    var filters = this.ast.filters;

    this.parse(this.ast.block, ctx, function(sql, values) {
        done(sql, values, filters);
    });
};

Query.prototype.parse = function(nodes, ctx, callback) {
    
    var self = this;
    var sql = '';
    var values = [];

    each(nodes, function(node, next) {
        
        self[fns[node.name]](node, ctx, function(_sql, _values) {
            sql = sql + _sql;
            values = [].concat(values, _values);
            next();
        });

    }, function() {

        callback(sql, values);

    });

};

Query.prototype.section = function(node, ctx, callback) {
    var self = this;
    var mapper = require('../index')(self.namespace);
    
    var sec = mapper.section.get(node.value);
    if(!sec) {
        throw new Error('invalid section ' + node.value);
    }
    sec(ctx, node.params, function(newCtx, done){
        self.parse(node.block, newCtx, done);
    }, callback);

};

Query.prototype.fragment = function(node, ctx, callback) {
    
    var args = [];
    node.args.forEach(function(arg, i) {
        if(arg.name === 'var') {
            args.push(ctx.val(arg.value));
        } else {
            args.push(arg.value);
        }
    });

    var ref = node.value;
    if(node.value.length === 1) {
        ref = [this.filename, ref[0]];
    }
    
    var mapper = require('../index')(this.namespace);
    mapper.sql.apply(mapper, [ref.join('.'), args, callback]);

};

Query.prototype.end = function(node, ctx, callback) {
    
    switch (node.name) {
    case 'text' :
        callback(node.value, []);
        break;
    case 'inline':
        callback(ctx.value(node.value, node.type), []);
        break;
    case 'reference':
        callback('?', ctx.value(node.value, node.type));
        break;
    default:
        callback('', []);
    }

};

module.exports = Query;