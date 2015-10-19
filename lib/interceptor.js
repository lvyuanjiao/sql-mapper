'use strict';

var each = require('./util').each;

function _page (ctx, args, callback) {
	if(args.length === 0 || !args[0]) {
		return callback(ctx.sql, ctx.values);
	}

	var limit = args[0];
	if(!limit.offset) {
		limit.offset = 0;
	}

	var dialect = ctx.dialect();
	var condition = '';

	if(dialect === 'mysql' || dialect === 'postgres' || dialect === 'sqlite') {

		callback((ctx.sql + (limit.rows ? (' LIMIT ' + limit.rows) : '') + ' OFFSET ' + limit.offset), ctx.values);

	} else if(dialect === 'oracle') {

		condition = '';
		if(limit.rows) {
			condition = 'WHERE rownum <= ' + limit.rows;
		}
		callback('SELECT * FROM ( SELECT tmp_table.*, rownum, row_id FROM ( ' + ctx.sql + ' ) tmp_table ' + condition + ' ) WHERE row_id > ' + limit.offset, ctx.values);

	} else if (dialect === 'mssql') {
		// MSSQL Server 2012
		condition = '';
		if(limit.rows) {
			condition = 'FETCH NEXT ' + limit.rows + ' ROWS ONLY';
		}
		callback(ctx.sql + ' OFFSET ' + limit.offset + ' ROWS ' + condition, ctx.values);

	} else {
		callback(ctx.sql, ctx.values);
	}
}

function Interceptor () {
	this.interceptors = {
		'page': _page
	};
}

Interceptor.prototype.chain = function(ctx, chain, callback) {
	var self = this;

	each(chain, function (filter, next) {

		var handler = self.get(filter.value);
		if(!handler) {
			return next(new Error(filter.value + ' interceptor not found'));
		}
		var args = ctx.args(filter.args);

		handler(ctx, args, function (_sql, _values) {
			ctx.sql = _sql;
			ctx.values = _values;
			next();
		});

	}, function (err) {
		if(err) {
			throw err;
		}
		callback(ctx.sql, ctx.values);
	});

};

Interceptor.prototype.set = function(name, interceptor) {
    this.interceptors[name] = interceptor;
};

Interceptor.prototype.get = function(name) {
	return this.interceptors[name];
};


module.exports = Interceptor;