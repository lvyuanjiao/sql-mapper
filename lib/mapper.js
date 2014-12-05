var builder = require('./builder');
var section = require('./section');
var cache = {};

module.exports = function(namespace) {
	
	var ns = namespace || Object.keys(cache)[0] || 'SQL_MAPPER_DEFAULT_KEY';
	
	var build = function(dir, callback){
		builder.build(ns, dir, function(err, data){
			cache[ns] = {
				mappers: data
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
	
	return {
		'build': build,
		'sql': sql,
		'section': section
	};	
}
