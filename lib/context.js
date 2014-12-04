function Context(ctx) {
	this.ns = '';
	this.id = '';
	this.values = {};
	
	if(ctx) {
		this.ns = ctx.ns;
		this.id = ctx.id;		
		copy(this.values, ctx.values);
	}
};

Context.prototype.set = function (name, value) {
	this.values[name] = value;
};

Context.prototype.get = function(ref) {
	if(typeof ref === 'string') {
		ref = ref.split('.');
	}		
	return eval('this.values["' + ref.join('"]["') + '"]');
};

Context.prototype.value = function(path) {
	var val = this.get(path);
	if(val === undefined) {
		throw new Error('#' + this.ns + ' ' + this.id + ' ' +path.join('.') + ' is unavailable in context.');
	}
	return val;
};

Context.prototype.eval = function(expression) {
	return eval(expression.replace(/#([\w.]+)/g, 'this.get("$1")'));
};

function copy(to, from) {
	for(var k in from) {
		to[k] = from[k];
	}
};

module.exports = Context;
