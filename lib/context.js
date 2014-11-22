function Context(ctx) {
	this.name = '';
	this.namespace = '';
	this.values = {};
	
	if(ctx) {
		this.name = ctx.name;
		this.namespace = ctx.namespace;
		copy(this.values, ctx.values);
	}
};

Context.prototype.set = function (name, value) {
	this.values[name] = value;
};

Context.prototype.get = function(path) {
	if(typeof path === 'string') {
		path = path.split('.');
	}
	
	var e = 'this.values["' + path.join('"]["') + '"]';
	return eval(e);
};

Context.prototype.value = function(path) {
	var val = this.get(path);
	if(val === undefined) {
		throw new Error('#' + this.namespace + '.' + this.name + ' ' +path.join('.') + ' is unavailable in context.');
	}
	return val;
};

Context.prototype.parse = function (id) {
	var e = id.replace(/#([\w.]+)/g, 'this.get("$1")');
	return eval(e);
};

function copy(to, from) {
	for(var k in from) {
		to[k] = from[k];
	}
};

module.exports = Context;
