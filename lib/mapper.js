var builder = require('./builder');
var section = require('./section');
var cache = require('./cache');

module.exports = function(namespace) {
	
	var ns = namespace || Object.keys(cache)[0] || 'SQL_MAPPER_DEFAULT_KEY';
	
	var build = function(opts, callback){
		builder.build(ns, opts.mappers, function(err, data){
			cache[ns] = {
				mappers: data,
				getConnection: opts.getConnection
			};
			callback(err);
		});
	};
	
	var sql = function(id, args, callback) {
		if(typeof args === 'function'){
			callback = args;
			args = [];
		}
		
		var query = cache[ns]['mappers'][id];
		query.sql.apply(query, [].concat(args, callback));
	};
	
	var query = function(id, args, callback, connection) {
		
		if(typeof args === 'function'){
			connection = callback;
			callback = args;
			args = [];
		}
		
		sql(id, args, function(sql, values, filters) {
			
			if(connection) {
				return connection.query(sql, values, filters, callback);
			}
			
			cache[ns].getConnection(function(err, conn){
				
				if(err) {
					return callback(err);
				}
				
				conn.query(sql, values, filters, callback);
			});
								
		});
	};
	
	return {
		'build': build,
		'sql': sql,
		'query': query,
		'section': section
	};	
}
