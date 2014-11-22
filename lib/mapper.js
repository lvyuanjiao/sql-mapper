var builder = require('./builder');
var section = require('./section');

var SQL_MAPPER_DEFAULT_KEY = 'SQL_MAPPER_DEFAULT_KEY';

module.exports = (function() {

	var manager = {};
	
	var toSql = function(namespace, id, args, callback) {
		if(typeof args === 'function'){
			callback = args;
			args = [];
		}
		var query = manager[namespace]['mappers'][id];
		query.sql.apply(query, [].concat(args, callback));
	}
	
	var query = function(namespace, id, args, callback, connection) {
		
		if(typeof args === 'function'){
			connection = callback;
			callback = args;
			args = [];
		}
		
		toSql(namespace, id, args, function(sql, values) {
			
			if(connection) {
				return connection.query(sql, values, callback);
			}
			
			manager[namespace].getConnection(function(err, conn){
				
				if(err) {
					return callback(err);
				}
				
				conn.query(sql, values, callback);
			});
								
		});
	}
	
	return {
		
		'build': function(opts, callback){
			builder.build(opts.mappers, function(err, data){
				var ns = opts.namespace || SQL_MAPPER_DEFAULT_KEY;
				manager[ns] = {
					mappers: data,
					getConnection: opts.getConnection
				};
				callback(err);
			});
		},
		
		'section': require('./section'),
		
		'namespace': function(namespace) {
			return {
				'sql': function(id, args, callback) {
					toSql(namespace, id, args, callback);
				},		
				'query': function(id, args, callback, connection) {
					query(namespace, id, args, callback, connection);
				}
			};
		},
		
		'sql': function(id, args, callback) {
			toSql(Object.keys(manager)[0], id, args, callback);
		},
		
		'query': function(id, args, callback, connection) {
			query(Object.keys(manager)[0], id, args, callback, connection);
		}
		
	};
	
})();
