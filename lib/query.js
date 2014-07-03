
var async = require('async');
var Context = require('./context');
var section = require('./section');

var fnMap = {
    'ref': endNode,
    'inl': endNode,
    'text': endNode,
    'section': sectionNode,
    'frag': fragmentNode
};

var Query = function(namespace, ast) {
	this.namespace = namespace;
	this.name = ast.name;
	this.args = ast.args;
	this.ast = ast.children;
};

Query.prototype.context = function(args) {
	var ctx = new Context();
	ctx.namespace = this.namespace;
	ctx.name = this.name;
	this.args.forEach(function(arg, i) {
		ctx.set(arg, args[i]);
	});
	return ctx;
};

Query.prototype.sql = function() {
	
	var args = Array.prototype.slice.call(arguments);
	var done = args.pop();
	var ctx = this.context(args);
	
	parseNodes(this.ast, ctx, done);
};

function parseNodesSync(nodes, ctx, callback) { 
    var sql = '';
    var values = [];    

    async.eachSeries(nodes, function(node, next){
        fnMap[node.type](node, ctx, function(_sql, _values) {
			sql = ' ' + sql + ' ' + _sql + ' ';
			values = [].concat(values, _values);
			next();
		});
    }, function(err) {
        callback(sql, values);
    });

};

function parseNodes(nodes, ctx, callback){
    process.nextTick(function(){
        parseNodesSync(nodes, ctx, callback);
    });
};

function sectionNode(node, ctx, callback) {
	section.get(node.value)(node.params, ctx, function(newCtx, done){
	    parseNodes(node.children, newCtx, done);
	}, callback);
};

function fragmentNode(node, ctx, callback){
    var ns = node.value.split('.');
    if(ns.length !== 2) {
        ns.splice(0, 0, ctx.namespace);
    }
    var args = [];
    node.args.forEach(function(arg, i) {
		args.push(ctx.get(arg));
	});
	args.push(callback);
    require('./mapper').get(ns[0])[ns[1]].apply(null, args);
};

function endNode(node, ctx, callback) {
	switch(node.type) {
		case 'text':
			callback(node.value, []);
			break;
		case 'inl':
			callback(ctx.getValue(node.value), []);
			break;
		case 'ref':
			callback('?', ctx.getValue(node.value));
			break;
		default:
			callback('', []);
	}

};

module.exports = Query;
