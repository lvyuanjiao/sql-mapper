var Context = require('./context');

function _where(params, ctx, next, done) {
	next(ctx, function(sql, values) {
		var sql = sql.trim();
		if(sql) {
			sql = 'WHERE ' + sql.replace(/^(and|or)/i, ' ');
		}
		done(sql, values);
	});
};

function _set(params, ctx, next, done) {
	next(ctx, function(sql, values) {
		var sql = sql.trim();
		if(sql) {
			sql = 'SET ' + sql.replace(/,$/, ' ');
		}
		done(sql, values);
	});
};

function _if(params, ctx, next, done) {
	if(ctx.parse(params['test'])) {
		next(ctx, done);
	} else {
	    done('', []);
	}
};

function _each(params, ctx, next, done) {
	var value = ctx.parse(params['value']);
	var key = params['key'] || 'key';
	var index = params['index'] || 'index';
	var item = params['item'] || 'item';
	
	var ctxs = [];
	var i = 0;
	for(var k in value) {
	    var newCtx = new Context(ctx);
		newCtx.set(key, k);
		newCtx.set(index, i++);
		newCtx.set(item, value[k]);
		ctxs.push(newCtx);
	}

	var tmp = ['', []];
	ctxs.forEach(function(ctx){
		next(ctx, function(sql, values){
	        tmp[0] = ' ' + tmp[0] + ' ' + sql + ' ';
			tmp[1] = [].concat(tmp[1], values);
	    });
	});
	done(tmp[0], tmp[1]);
};

function _trim(params, ctx, next, done) {
	var pre = params['prefix'] || '';
	var suf = params['suffix'] || '';
	var po = params['prefixOverrides'];
	var so = params['suffixOverrides'];	
	
	next(ctx, function(sql, values) {
		var sql = sql.trim();
		
		if(!sql) {
			return done(sql, values);
		}		
		if(po) {
			sql = sql.replace(new RegExp('^(' + po + ')', 'i'), ' ');
		}
		if(so) {
			sql = sql.replace(new RegExp('(' + so + ')$', 'i'), ' ');
		}
		sql = pre + ' ' + sql + ' ' + suf;
		done(sql, values);
	});
};

module.exports = (function() {
	
	// Built in sections
	var sections = {
		'where': _where,
		'set': _set,
		'if': _if,
		'each': _each,
		'trim': _trim
	};
	
	return {
		'set': function(name, callback) {
			sections[name] = callback;
		},
		'get': function(name) {
			return sections[name];
		}
	};
	
})();

