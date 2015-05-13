'use strict';

var Context = require('./context');

function _where(ctx, params, process, next) {
	process(ctx, function(sql, values) {
		sql = sql.trim();
		if(sql) {
			sql = 'WHERE ' + sql.replace(/^(and|or)/i, ' ');
		}
		next(sql, values);
	});
}

function _set(ctx, params, process, next) {
	process(ctx, function(sql, values) {
		sql = sql.trim();
		if(sql) {
			sql = 'SET ' + sql.replace(/,$/, ' ');
		}
		next(sql, values);
	});
}

function _if(ctx, params, process, next) {
	if(ctx.eval(params['test'])) {
		process(ctx, next);
	} else {
	    next('', []);
	}
}

function _each(ctx, params, process, next) {
	var value = ctx.eval(params['value']);
	var key = params['key'] || 'key';
	var index = params['index'] || 'index';
	var item = params['item'] || 'item';
	
	var txt = '';
	var params = [];
	var i = 0;
	for(var k in value) {
	    var newCtx = new Context(ctx);
		newCtx.set(key, k);
		newCtx.set(index, i++);
		newCtx.set(item, value[k]);
		
		process(newCtx, function(sql, values){
	        txt = ' ' + txt + ' ' + sql + ' ';
			params = [].concat(params, values);
	    });
	}
	next(txt, params);
};

function _trim(ctx, params, process, next) {
	var pre = params['prefix'] || '';
	var suf = params['suffix'] || '';
	var po = params['prefixOverrides'];
	var so = params['suffixOverrides'];	
	
	process(ctx, function(sql, values) {
		var sql = sql.trim();
		
		if(!sql) {
			return next(sql, values);
		}
		if(po) {
			sql = sql.replace(new RegExp('^(' + po + ')', 'i'), ' ');
		}
		if(so) {
			sql = sql.replace(new RegExp('(' + so + ')$', 'i'), ' ');
		}
		sql = pre + ' ' + sql + ' ' + suf;
		next(sql, values);
	});
};

function Section() {
	this.sections = {
		'where': _where,
		'set': _set,
		'if': _if,
		'each': _each,
		'trim': _trim
	};
}

Section.prototype.set = function(name, callback) {
	this.sections[name] = callback;
};

Section.prototype.get = function(name) {
	return this.sections[name];
};

module.exports = Section;
