var Context = require('./context');
var getSection = require('./section').get;

// function lookup table
var fns = {
    'reference': end,
    'inline': end,
    'text': end,
    'section': section,
    'fragment': fragment
};

var Query = function(ns, id, ast) {
	this.ns = ns;
	this.id = id;	
	this.ast = ast
};

Query.prototype.createCtx = function(args) {
	var ctx = new Context();
	ctx.id = this.id;
	ctx.ns = this.ns;
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
};

function section(node, ctx, callback) {
	getSection(node.value)(ctx, node.params, function(newCtx, done){
	    parse(node.children, newCtx, done);
	}, callback);
};

function fragment(node, ctx, callback){    
    var args = [];
    node.args.forEach(function(arg, i) {
		args.push(ctx.get(arg));
	});
	
	var ref = node.value.split('.');
    if(ref.length === 1) {
		ref = [ctx.id.split('.')[0], ref[0]];
    }
	
    require('./mapper')(ctx.ns).sql.apply(null, [].concat(ref.join('.'), args, callback));
};

function end(node, ctx, callback) {
	switch(node.type) {
		case 'text':
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
};

module.exports = Query;
