'use strict';

var Context = require('./context');

// function lookup table
var fns = {
    'reference': end,
    'inline': end,
    'text': end,
    'section': section,
    'fragment': fragment
};

var Query = function(namespace, ast) {
	this.namespace = namespace;
	this.entry = ast.name;
	this.ast = ast;
};

Query.prototype.createCtx = function(args) {
	var ctx = new Context();
	ctx.queryName = this.namespace + '.' + this.entry;
	this.ast.args.forEach(function(arg, i) {
		ctx.set(arg, args[i]);
	});
	return ctx;
};

Query.prototype.sql = function() {
	var args = Array.prototype.slice.call(arguments);
	var done = args.pop();
	var ctx = this.createCtx(args);
	var filters = this.ast.filters;
	
	parse(this.ast.children, ctx, function(sql, values){
		done(sql, values, filters);
	});
};

function parse(nodes, ctx, callback) { 
    var sql = '';
    var values = [];
    
    nodes.forEach(function(node){
        fns[node.type](node, ctx, function(_sql, _values) {
			sql = ' ' + sql + ' ' + _sql + ' ';
			values = [].concat(values, _values);
		});
    });
    callback(sql, values);
}

function section(node, ctx, callback) {	
	var sec = require('./mapper').section.get(node.value);
	if(!sec) {
		throw new Error('invalid section ' + sec);
	}
	sec(ctx, node.params, function(newCtx, done){
	    parse(node.children, newCtx, done);
	}, callback);
}

function fragment(node, ctx, callback){
    var args = [];
    node.args.forEach(function(arg, i) {
		if(arg.type === 'var') {
			args.push(ctx.get(arg.value));
		} else {
			args.push(arg.value);
		}
	});
	
	var ref = node.value.split('.');
    if(ref.length === 1) {
		ref = [ctx.queryName.split('.')[0], ref[0]];
    }
	
	var mapper = require('./mapper');
    mapper.sql.apply(mapper, [].concat(ref.join('.'), args, callback));
}

function end(node, ctx, callback) {
	switch (node.type) {
	case 'text'	:
		callback(node.value, []);
		break;
	case 'inline':
		callback(ctx.value(node.value), []);
		break;
	case 'reference':
		callback('?', ctx.value(node.value));
		break;
	default:
		callback('', []);
	}
}

module.exports = Query;
